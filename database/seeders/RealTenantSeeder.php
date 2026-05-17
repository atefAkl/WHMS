<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class RealTenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = [
            [
                'id' => 'ayman',
                'domain' => 'ayman.localhost',
                'data' => [
                    'company_name' => 'شركة مخازن أيمن المتقدمة',
                    'plan' => 'باقة المستودعات المتقدمة (Enterprise)',
                    'status' => 'نشط'
                ]
            ],
            [
                'id' => 'atyaf',
                'domain' => 'atyaf.localhost',
                'data' => [
                    'company_name' => 'شركة أطياف للتبريد والتغليف',
                    'plan' => 'باقة الأعمال (Business)',
                    'status' => 'نشط'
                ]
            ]
        ];

        foreach ($tenants as $tData) {
            if (!Tenant::find($tData['id'])) {
                $tenant = Tenant::create([
                    'id' => $tData['id'],
                    'data' => $tData['data']
                ]);
                
                $tenant->domains()->create(['domain' => $tData['domain']]);
                
                echo "Created Tenant: {$tData['id']} at {$tData['domain']}\n";
                
                // Run migrations for the new tenant
                Artisan::call('tenants:migrate', ['--tenants' => [$tenant->id]]);
                echo Artisan::output();
            }
        }
    }
}
