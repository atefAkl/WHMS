<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SaaSController extends Controller
{
    public function index()
    {
        // Fetch current tenant info from settings as the primary tenant
        $settings = ContractSetting::pluck('value', 'key')->all();

        // Fetch real tenants from the database
        $realTenants = Tenant::with('domains')->get();

        $tenants = [];

        if ($realTenants->isNotEmpty()) {
            foreach ($realTenants as $index => $t) {
                $domain = $t->domains->first()?->domain ?? ($t->id . '.whm.apl');
                $data = $t->data ?? [];
                $tenants[] = [
                    'id' => $t->id,
                    'company_name' => $data['company_name'] ?? ($t->id === 'ayman' ? ($settings['company_name'] ?? 'شركة مخازن أيمن المتقدمة') : ('شركة ' . ucfirst($t->id))),
                    'subdomain' => $domain,
                    'plan' => $data['plan'] ?? ($index === 0 ? 'باقة المستودعات المتقدمة (Enterprise)' : ($index === 1 ? 'باقة الأعمال (Business)' : 'باقة الشركات الكبرى (VIP)')),
                    'active_season' => $data['active_season'] ?? 'موسم تمور 2026-2027',
                    'storage_used' => $data['storage_used'] ?? (85 - ($index * 10) . '%'),
                    'contracts_count' => $data['contracts_count'] ?? (24 - ($index * 5)),
                    'revenue' => $data['revenue'] ?? (45000 - ($index * 5000) . ' ر.س'),
                    'expiry_date' => $data['expiry_date'] ?? '2027-12-31',
                    'status' => $data['status'] ?? 'نشط',
                ];
            }
        } else {
            // Fallback rich mock data if no tenants seeded yet
            $tenants = [
                [
                    'id' => 'ayman',
                    'company_name' => $settings['company_name'] ?? 'شركة مخازن أيمن المتقدمة',
                    'subdomain' => 'ayman.whm.apl',
                    'plan' => 'باقة المستودعات المتقدمة (Enterprise)',
                    'active_season' => 'موسم تمور 2026-2027',
                    'storage_used' => '85%',
                    'contracts_count' => 24,
                    'revenue' => '45,000 ر.س',
                    'expiry_date' => '2027-12-31',
                    'status' => 'نشط',
                ],
                [
                    'id' => 'atyaf',
                    'company_name' => 'شركة أطياف للتبريد والتغليف',
                    'subdomain' => 'atyaf.whm.apl',
                    'plan' => 'باقة الأعمال (Business)',
                    'active_season' => 'موسم الصيف 2026',
                    'storage_used' => '62%',
                    'contracts_count' => 12,
                    'revenue' => '28,500 ر.س',
                    'expiry_date' => '2026-10-15',
                    'status' => 'نشط',
                ],
                [
                    'id' => 'ksa-logistics',
                    'company_name' => 'مستودعات المملكة اللوجستية',
                    'subdomain' => 'ksa-logistics.whm.apl',
                    'plan' => 'باقة الشركات الكبرى (VIP)',
                    'active_season' => 'الموسم السنوي الشامل',
                    'storage_used' => '94%',
                    'contracts_count' => 86,
                    'revenue' => '150,000 ر.س',
                    'expiry_date' => '2028-05-20',
                    'status' => 'نشط',
                ],
                [
                    'id' => 'alfajr',
                    'company_name' => 'مؤسسة الفجر للحفظ البارد',
                    'subdomain' => 'alfajr.whm.apl',
                    'plan' => 'الباقة الأساسية (Starter)',
                    'active_season' => 'موسم الربيع 2026',
                    'storage_used' => '30%',
                    'contracts_count' => 3,
                    'revenue' => '9,000 ر.س',
                    'expiry_date' => '2026-06-01',
                    'status' => 'موقوف',
                ],
            ];
        }

        $kpis = [
            'total_tenants' => count($tenants),
            'active_subscriptions' => collect($tenants)->where('status', 'نشط')->count(),
            'total_revenue' => '232,500 ر.س',
            'active_subdomains' => count($tenants),
        ];

        return Inertia::render('SaaS/Tenants', compact('tenants', 'kpis', 'settings'));
    }
}
