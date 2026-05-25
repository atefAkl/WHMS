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
            $setupToken = null;

            try {
                $tenant->run(function () use (&$contractsCount, &$revenue, &$activeSeason, &$storageUsed, &$setupToken) {
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

                    if (Schema::hasTable('users')) {
                        $userWithToken = \App\Models\User::whereNotNull('setup_token')
                            ->where('setup_token', '!=', '')
                            ->first();
                        if ($userWithToken) {
                            $setupToken = $userWithToken->setup_token;
                        }
                    }
                });
            } catch (\Exception $e) {
                // Tenant database may still be onboarding or partially migrated.
            } finally {
                $this->ensureCentralContext();
            }

            $totalRevenue += $revenue;

            $appDomain = config('app.domain', 'whms.test');

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
                'setup_token' => $setupToken,
                'activation_link' => $setupToken ? "http://{$tenant->id}.{$appDomain}/setup-password?token={$setupToken}" : null,
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

        // ══ Phase 0: Guard ════════════════════════════════════════════════
        // منع أي معالجة مكررة أو تعارض في البيانات قبل البدء
        if ($tenantRequest->status !== 'pending') {
            return back()->with('error', 'هذا الطلب تمت معالجته مسبقاً (الحالة: ' . $tenantRequest->status . ').');
        }

        if (Tenant::find($tenantRequest->requested_subdomain)) {
            return back()->with('error', 'النطاق الفرعي "' . $tenantRequest->requested_subdomain . '" محجوز مسبقاً في النظام.');
        }

        // ══ Phase 1: Infrastructure ═══════════════════════════════════════
        // هذه المرحلة يجب أن تنجح بالكامل أو تتراجع بالكامل
        $tenant = null;

        try {
            // ① إنشاء سجل التينانت
            $tenant = Tenant::create([
                'id'   => $tenantRequest->requested_subdomain,
                'data' => [
                    'company_name' => $tenantRequest->company_name,
                    'email'        => $tenantRequest->email,
                    'phone'        => $tenantRequest->phone,
                    'plan'         => $tenantRequest->plan,
                    'status'       => 'نشط',
                ],
            ]);

            // ② إنشاء الدومين الفرعي
            $tenant->domains()->create([
                'domain' => $tenantRequest->requested_subdomain . '.' . config('app.domain', 'whms.test'),
            ]);

            // ③ تشغيل المايجريشن (ينشئ قاعدة بيانات التينانت)
            Artisan::call('tenants:migrate', ['--tenants' => [$tenant->id]]);

            // ④ زرع بيانات المستخدم الأولي والإعدادات
            $setupToken = \Illuminate\Support\Str::random(40);

            $tenant->run(function () use ($tenantRequest, $setupToken) {
                \App\Models\User::updateOrCreate(
                    ['email' => $tenantRequest->email],
                    [
                        'name'        => $tenantRequest->company_name . ' Admin',
                        'password'    => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(16)),
                        'setup_token' => $setupToken,
                    ]
                );

                foreach ([
                    'company_name'  => $tenantRequest->company_name,
                    'company_email' => $tenantRequest->email,
                    'company_phone' => $tenantRequest->phone,
                    'company_plan'  => $tenantRequest->plan,
                ] as $key => $value) {
                    \App\Models\ContractSetting::updateOrCreate(
                        ['key' => $key],
                        ['value' => $value ?? '']
                    );
                }
            });

            $this->ensureCentralContext();

            // ⑤ بناء رابط التفعيل وحفظ حالة الموافقة في قاعدة البيانات
            $appDomain      = config('app.domain', 'whms.test');
            $activationLink = "http://{$tenantRequest->requested_subdomain}.{$appDomain}/setup-password?token={$setupToken}";

            $tenantRequest->setConnection($this->centralConnection());
            $tenantRequest->update([
                'status'          => 'approved',
                'setup_token'     => $setupToken,
                'activation_link' => $activationLink,
            ]);

        } catch (\Throwable $e) {
            // ══ Compensating Actions ══════════════════════════════════════
            // نتراجع عن كل ما تم إنشاؤه في Phase 1
            $this->ensureCentralContext();

            \Illuminate\Support\Facades\Log::error('Tenant approval failed at infrastructure phase', [
                'request_id' => $tenantRequest->id,
                'subdomain'  => $tenantRequest->requested_subdomain,
                'message'    => $e->getMessage(),
                'trace'      => $e->getTraceAsString(),
            ]);

            if ($tenant) {
                try {
                    $tenant->domains()->delete();
                    // tenant->delete() يطلق TenantDeleted event الذي يحذف قاعدة البيانات
                    $tenant->delete();
                } catch (\Throwable $cleanupEx) {
                    \Illuminate\Support\Facades\Log::error('Cleanup after failed approval also failed', [
                        'message' => $cleanupEx->getMessage(),
                    ]);
                }
            }

            return back()->with('error', 'فشل تفعيل الحساب: ' . $e->getMessage());
        }

        // ══ Phase 2: Notification (best-effort) ══════════════════════════
        // فشل البريد لا يعني فشل الموافقة - الحساب أصبح جاهزاً
        try {
            \Illuminate\Support\Facades\Mail::to($tenantRequest->email)
                ->send(new \App\Mail\TenantActivationMail($activationLink, $tenantRequest->company_name));

            return back()->with('success',
                'تم إنشاء حساب العميل بنجاح وإرسال رابط التفعيل إلى ' . $tenantRequest->email . '.'
            );

        } catch (\Throwable $mailEx) {
            \Illuminate\Support\Facades\Log::warning('Activation email failed after successful tenant approval', [
                'request_id' => $tenantRequest->id,
                'message'    => $mailEx->getMessage(),
            ]);

            // نعرض الرابط في الـ UI بدلاً من البريد
            return back()->with('mail_warning', [
                'message' => 'تم إنشاء حساب العميل بنجاح، لكن فشل إرسال البريد الإلكتروني. انسخ رابط التفعيل وأرسله للعميل يدوياً.',
                'link'    => $activationLink,
            ]);
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