<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;

class SeedRealTenantsCommand extends Command
{
    protected $signature = 'saas:seed-tenants';
    protected $description = 'Seed real SaaS tenants and subdomains for testing';

    public function handle()
    {
        $tenants = [
            ['id' => 'ayman', 'domain' => 'ayman.whm.apl', 'name' => 'شركة مخازن أيمن المتقدمة', 'plan' => 'باقة المستودعات المتقدمة (Enterprise)', 'storage_used' => '85%', 'contracts_count' => 24, 'revenue' => '45,000 ر.س'],
            ['id' => 'atyaf', 'domain' => 'atyaf.whm.apl', 'name' => 'شركة أطياف للتبريد والتغليف', 'plan' => 'باقة الأعمال (Business)', 'storage_used' => '62%', 'contracts_count' => 12, 'revenue' => '28,500 ر.س'],
            ['id' => 'ksa-logistics', 'domain' => 'ksa-logistics.whm.apl', 'name' => 'مستودعات المملكة اللوجستية', 'plan' => 'باقة الشركات الكبرى (VIP)', 'storage_used' => '94%', 'contracts_count' => 86, 'revenue' => '150,000 ر.س'],
            ['id' => 'alfajr', 'domain' => 'alfajr.whm.apl', 'name' => 'مؤسسة الفجر للحفظ البارد', 'plan' => 'الباقة الأساسية (Starter)', 'storage_used' => '30%', 'contracts_count' => 3, 'revenue' => '9,000 ر.س'],
        ];

        foreach ($tenants as $t) {
            $this->info("Creating tenant: {$t['name']} ({$t['domain']})...");
            $tenant = Tenant::firstOrCreate(['id' => $t['id']], [
                'data' => [
                    'company_name' => $t['name'],
                    'plan' => $t['plan'],
                    'active_season' => 'موسم تمور 2026-2027',
                    'storage_used' => $t['storage_used'],
                    'contracts_count' => $t['contracts_count'],
                    'revenue' => $t['revenue'],
                    'expiry_date' => '2027-12-31',
                    'status' => $t['id'] === 'alfajr' ? 'موقوف' : 'نشط',
                ]
            ]);

            $tenant->domains()->firstOrCreate(['domain' => $t['domain']]);
            $this->info("Tenant {$t['id']} created and seeded successfully!");
        }

        $this->info('All SaaS tenants seeded successfully!');
    }
}
