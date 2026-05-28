<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ContractBlock;
use App\Models\ContractSetting;

class ContractBlocksSeeder extends Seeder
{
    public function run(): void
    {
        $settings = ContractSetting::pluck('value', 'key')->all();

        $defaultIntro = $settings['default_introduction'] ?? 'بعون الله وتوفيقه، في يوم {$write_date} م، الموافق {$write_date_hijri} هـ ، قد اجتمع كل من:-';
        $defaultPreamble = $settings['default_preamble'] ?? 'حيث أن الطرف الأول لديه مخازن تبريد وتجميد ويعمل في مجال التخزين بخدماته، ومرخص له بمزاولة النشاط بموجب الترخيص رقم ({$company_license}) وحيث أن الطرف الثاني يرغب في استئجار (طبالي / غرف) لدى الطرف الأول، فقد اتفقا وهما بكامل أهليتهما الشرعية المعتبرة للتوقيع على هذا العقد فيما يلي:-';
        $companyName = $settings['company_name'] ?? 'مخازن أيمن محمد عبد الله الغماس للتخزين';
        $companyLicense = $settings['company_license'] ?? '4106341856';
        $defaultFooter = $settings['footer'] ?? '';

        $blocks = [
            [
                'key' => 'header',
                'is_enabled' => true,
                'content' => [],
                'sort_order' => 1
            ],
            [
                'key' => 'title',
                'is_enabled' => true,
                'content' => ['text' => $companyName],
                'sort_order' => 2
            ],
            [
                'key' => 'serialize',
                'is_enabled' => true,
                'content' => [],
                'sort_order' => 3
            ],
            [
                'key' => 'intro',
                'is_enabled' => true,
                'content' => ['text' => $defaultIntro],
                'sort_order' => 4
            ],
            [
                'key' => 'parties',
                'is_enabled' => true,
                'content' => [],
                'sort_order' => 5
            ],
            [
                'key' => 'preamble',
                'is_enabled' => true,
                'content' => ['text' => $defaultPreamble],
                'sort_order' => 6
            ],
            [
                'key' => 'los',
                'is_enabled' => true,
                'content' => [],
                'sort_order' => 7
            ],
            [
                'key' => 'signature',
                'is_enabled' => true,
                'content' => [],
                'sort_order' => 8
            ],
            [
                'key' => 'footer',
                'is_enabled' => true,
                'content' => ['text' => $defaultFooter],
                'sort_order' => 9
            ]
        ];

        foreach ($blocks as $block) {
            ContractBlock::updateOrCreate(
                [
                    'season_id' => null,
                    'contract_id' => null,
                    'key' => $block['key']
                ],
                [
                    'is_enabled' => $block['is_enabled'],
                    'content' => $block['content'],
                    'sort_order' => $block['sort_order']
                ]
            );
        }
    }
}
