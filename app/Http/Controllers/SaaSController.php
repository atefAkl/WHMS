<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use App\Models\Tenant;
use App\Models\TenantRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;

class SaaSController extends Controller
{
    public function index()
    {
        // Fetch current tenant info from settings as the primary tenant safely
        $settings = [];
        try {
            if (class_exists(ContractSetting::class) && \Illuminate\Support\Facades\Schema::hasTable('contract_settings')) {
                $settings = ContractSetting::pluck('value', 'key')->all();
            }
        } catch (\Exception $e) {
            // Table doesn't exist in central database context
        }

        $realTenants = Tenant::with('domains')->get();

        $tenants = [];
        $totalRevenue = 0;

        foreach ($realTenants as $t) {
            $domain = $t->domains->first()?->domain ?? ($t->id . '.whm.apl');
            $data = $t->data ?? [];
            
            // Query dynamic data from the tenant's database
            $contractsCount = 0;
            $revenue = 0;
            $activeSeason = 'غير محدد';
            $storageUsed = '0%';
            
            try {
                $t->run(function () use (&$contractsCount, &$revenue, &$activeSeason, &$storageUsed) {
                    if (\Illuminate\Support\Facades\Schema::hasTable('contracts')) {
                        $contractsCount = \App\Models\Contract::count();
                        $revenue = \App\Models\Contract::sum('total_amount'); // Summing total_amount from contracts
                    }
                    if (\Illuminate\Support\Facades\Schema::hasTable('seasons')) {
                        $season = \App\Models\Season::where('is_active', true)->first();
                        if ($season) {
                            $activeSeason = $season->name;
                        }
                    }
                    if (\Illuminate\Support\Facades\Schema::hasTable('pallets')) {
                        $totalPallets = \App\Models\Pallet::count();
                        $storedPallets = \App\Models\Pallet::where('status', '!=', 'dispatched')->count();
                        if ($totalPallets > 0) {
                            $storageUsed = round(($storedPallets / $totalPallets) * 100) . '%';
                        }
                    }
                });
            } catch (\Exception $e) {
                // In case database is not fully migrated yet
            }

            $totalRevenue += $revenue;

            $tenants[] = [
                'id' => $t->id,
                'company_name' => $data['company_name'] ?? ('شركة ' . ucfirst($t->id)),
                'subdomain' => $domain,
                'plan' => $data['plan'] ?? 'باقة أعمال (Business)',
                'active_season' => $activeSeason,
                'storage_used' => $storageUsed,
                'contracts_count' => $contractsCount,
                'revenue' => number_format((float)$revenue, 2) . ' ر.س',
                'expiry_date' => $data['expiry_date'] ?? date('Y-m-d', strtotime($t->created_at . ' +1 year')),
                'status' => $data['status'] ?? 'نشط',
            ];
        }

        $kpis = [
            'total_tenants' => count($tenants),
            'active_subscriptions' => collect($tenants)->where('status', 'نشط')->count(),
            'total_revenue' => number_format((float)$totalRevenue, 2) . ' ر.س',
            'active_subdomains' => count($tenants),
        ];

        $requests = TenantRequest::where('status', 'pending')->latest()->get();

        return Inertia::render('SaaS/Tenants', compact('tenants', 'kpis', 'settings', 'requests'));
    }

    public function approveRequest(TenantRequest $tenantRequest)
    {
        try {
            // 1. Create the Tenant
            $tenant = Tenant::create([
                'id' => $tenantRequest->requested_subdomain,
                'data' => [
                    'company_name' => $tenantRequest->company_name,
                    'email' => $tenantRequest->email,
                    'phone' => $tenantRequest->phone,
                    'plan' => $tenantRequest->plan,
                    'status' => 'نشط',
                ]
            ]);

            // 2. Create the Domain
            $tenant->domains()->create([
                'domain' => $tenantRequest->requested_subdomain . '.localhost' // Change .localhost to your production TLD
            ]);

            // 3. Run migrations for the new tenant
            Artisan::call('tenants:migrate', ['--tenants' => [$tenant->id]]);

            // 4. Update request status
            $tenantRequest->update(['status' => 'approved']);

            return back()->with('success', 'تم إنشاء حساب العميل وتفعيل المستودع بنجاح.');
        } catch (\Exception $e) {
            return back()->with('error', 'خطأ أثناء تفعيل الحساب: ' . $e->getMessage());
        }
    }

    public function rejectRequest(TenantRequest $tenantRequest)
    {
        $tenantRequest->update(['status' => 'rejected']);
        return back()->with('success', 'تم رفض الطلب بنجاح.');
    }
}
