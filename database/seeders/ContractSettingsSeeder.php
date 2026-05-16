<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ContractSetting;

class ContractSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // Company / SaaS Tenant Details
            ['key' => 'company_name', 'value' => 'مخازن أيمن محمد عبد الله الغماس للتخزين'],
            ['key' => 'company_slogan', 'value' => 'تخزين - تبريد - تغليف - تصدير - تجارة'],
            ['key' => 'company_cr', 'value' => '7016846037'],
            ['key' => 'company_vat', 'value' => '300000000000003'],
            ['key' => 'company_license', 'value' => '4106341856'],
            ['key' => 'company_phone', 'value' => '0566509314449'],
            ['key' => 'company_email', 'value' => 'admin@ag-stores.com'],
            ['key' => 'company_address', 'value' => 'القصيم - البصر - طريق الملك فهد'],
            ['key' => 'company_gm', 'value' => 'أيمن محمد عبد الله الغماس'],
            ['key' => 'company_dgm', 'value' => 'أحمد محمد عبد الله الغماس'],
            ['key' => 'company_logo', 'value' => '/images/ags_logo.png'],
            
            // Quality System Issue Data
            ['key' => 'show_quality_data', 'value' => '1'],
            ['key' => 'quality_issue_no', 'value' => '123456'],
            ['key' => 'quality_issue_date', 'value' => '20-12-2020'],

            // Default Contract Templates
            ['key' => 'default_introduction', 'value' => 'بعون الله وتوفيقه، في يوم {$write_date} م، الموافق {$write_date_hijri} هـ ، قد اجتمع كل من:-'],
            ['key' => 'default_preamble', 'value' => 'حيث أن الطرف الأول لديه مخازن تبريد وتجميد ويعمل في مجال التخزين بخدماته، ومرخص له بمزاولة النشاط بموجب الترخيص رقم ({$company_license}) وحيث أن الطرف الثاني يرغب في استئجار (طبالي / غرف) لدى الطرف الأول، فقد اتفقا وهما بكامل أهليتهما الشرعية المعتبرة للتوقيع على هذا العقد فيما يلي:-'],
            ['key' => 'default_mandatory_period', 'value' => '4'],
            ['key' => 'default_renewal_period', 'value' => '1'],
        ];

        foreach ($settings as $setting) {
            ContractSetting::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }
    }
}
