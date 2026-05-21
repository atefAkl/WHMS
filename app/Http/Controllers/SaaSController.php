<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use App\Models\Tenant;
use App\Models\TenantRequest;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SaaSController extends Controller
{
    private function ensureCentralContext(): void
    {
        if (function_exists('tenancy') && tenancy()->initialized) {
            tenancy()->end();
        }
    }

    private function centralConnection(): string
    {
        return config('tenancy.database.central_connection', config('database.default'));
    }

    public function index()
    {
        $this->ensureCentralContext();

        $settings = [];
        try {
            if (class_exists(ContractSetting::class) && Schema::hasTable('contract_settings')) {
                $settings = ContractSetting::pluck('value', 'key')->all();
            }
        } catch (\Exception $e) {
            // The central database may not have tenant-only settings tables.
        }

        $realTenants = Tenant::with('domains')->get();
        $tenants = [];
        $totalRevenue = 0;

        foreach ($realTenants as $tenant) {
            $appDomain = config('app.domain', parse_url(config('app.url'), PHP_URL_HOST) ?: 'whms.test');
            $domain = $tenant->domains->first()?->domain ?? ($tenant->id . '.' . $appDomain);
            $data = $tenant->data ?? [];

            $contractsCount = 0;
            $revenue = 0;
            $activeSeason = 'غير محدد';
            $storageUsed = '0%';

            try {
                $tenant->run(function () use (&$contractsCount, &$revenue, &$activeSeason, &$storageUsed) {
                    if (Schema::hasTable('contracts')) {
                        $contractsCount = \App\Models\Contract::count();
                        $revenue = \App\Models\Contract::sum('total_amount');
                    }

                    if (Schema::hasTable('seasons')) {
                        $season = \App\Models\Season::where('is_active', true)->first();
                        if ($season) {
                            $activeSeason = $season->name_ar ?? $season->name_en ?? 'غير محدد';
                        }
                    }

                    if (Schema::hasTable('pallets')) {
                        $totalPallets = \App\Models\Pallet::count();
                        $storedPallets = \App\Models\Pallet::where('status', '!=', 'dispatched')->count();
                        if ($totalPallets > 0) {
                            $storageUsed = round(($storedPallets / $totalPallets) * 100) . '%';
                        }
                    }
                });
            } catch (\Exception $e) {
                // Tenant database may still be onboarding or partially migrated.
            } finally {
                $this->ensureCentralContext();
            }

            $totalRevenue += $revenue;

            $tenants[] = [
                'id' => $tenant->id,
                'company_name' => $data['company_name'] ?? ('شركة ' . ucfirst($tenant->id)),
                'subdomain' => $domain,
                'plan' => $data['plan'] ?? 'باقة أعمال (Business)',
                'active_season' => $activeSeason,
                'storage_used' => $storageUsed,
                'contracts_count' => $contractsCount,
                'revenue' => number_format((float) $revenue, 2) . ' ر.س',
                'expiry_date' => $data['expiry_date'] ?? date('Y-m-d', strtotime($tenant->created_at . ' +1 year')),
                'status' => $data['status'] ?? 'نشط',
            ];
        }

        $this->ensureCentralContext();

        $kpis = [
            'total_tenants' => count($tenants),
            'active_subscriptions' => collect($tenants)->where('status', 'نشط')->count(),
            'total_revenue' => number_format((float) $totalRevenue, 2) . ' ر.س',
            'active_subdomains' => count($tenants),
        ];

        $requests = TenantRequest::on($this->centralConnection())
            ->where('status', 'pending')
            ->latest()
            ->get();

        return Inertia::render('SaaS/Tenants', compact('tenants', 'kpis', 'settings', 'requests'));
    }

    public function approveRequest(TenantRequest $tenantRequest)
    {
        $this->ensureCentralContext();

        try {
            $tenant = Tenant::create([
                'id' => $tenantRequest->requested_subdomain,
                'data' => [
                    'company_name' => $tenantRequest->company_name,
                    'email' => $tenantRequest->email,
                    'phone' => $tenantRequest->phone,
                    'plan' => $tenantRequest->plan,
                    'status' => 'نشط',
                ],
            ]);

            $tenant->domains()->create([
                'domain' => $tenantRequest->requested_subdomain . '.' . config('app.domain', 'whms.test'),
            ]);

            Artisan::call('tenants:migrate', ['--tenants' => [$tenant->id]]);

            $tenant->run(function () use ($tenantRequest) {
                // إنشاء مستخدم الدخول الأوّلي
                \App\Models\User::updateOrCreate(
                    ['email' => $tenantRequest->email],
                    [
                        'name' => $tenantRequest->company_name . ' Admin',
                        'password' => Hash::make('admin123'),
                    ]
                );

                // ========================================================
                // زرع بيانات التسجيل في contract_settings لتظهر معبأة مسبقاً
                // في شاشة إعداد بيانات المنشأة (Setup Wizard)
                // ========================================================
                $registrationData = [
                    'company_name'  => $tenantRequest->company_name,
                    'company_email' => $tenantRequest->email,
                    'company_phone' => $tenantRequest->phone,
                    'company_plan'  => $tenantRequest->plan,
                ];

                foreach ($registrationData as $key => $value) {
                    \App\Models\ContractSetting::updateOrCreate(
                        ['key' => $key],
                        ['value' => $value ?? '']
                    );
                }
            });

            $this->ensureCentralContext();

            $tenantRequest->setConnection($this->centralConnection());
            $tenantRequest->update(['status' => 'approved']);

            return back()->with('success', 'تم إنشاء حساب العميل وتفعيل المستودع بنجاح.');
        } catch (\Exception $e) {
            $this->ensureCentralContext();

            return back()->with('error', 'خطأ أثناء تفعيل الحساب: ' . $e->getMessage());
        }
    }

    public function rejectRequest(TenantRequest $tenantRequest)
    {
        $this->ensureCentralContext();

        $tenantRequest->setConnection($this->centralConnection());
        $tenantRequest->update(['status' => 'rejected']);

        return back()->with('success', 'تم رفض الطلب بنجاح.');
    }
}