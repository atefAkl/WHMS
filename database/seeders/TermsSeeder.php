<?php

namespace Database\Seeders;

use App\Models\Term;
use Illuminate\Database\Seeder;

class TermsSeeder extends Seeder
{
    public function run(): void
    {
        $terms = [
            [
                'text_ar' => 'يجب على العميل دفع كامل المبلغ المستحق قبل استلام البضاعة',
                'text_en' => 'Customer must pay full amount before receiving goods',
                'is_active' => true,
                'has_variables' => false,
                'sort_order' => 1,
            ],
            [
                'text_ar' => 'المدة الافتراضية للتخزين هي {$storage_period} شهر',
                'text_en' => 'Default storage period is {$storage_period} months',
                'is_active' => true,
                'has_variables' => true,
                'sort_order' => 2,
            ],
            [
                'text_ar' => 'رسوم التخزين المتأخر هي {$late_fee} ريال لكل طن يومياً',
                'text_en' => 'Late storage fee is {$late_fee} SAR per ton daily',
                'is_active' => true,
                'has_variables' => true,
                'sort_order' => 3,
            ],
            [
                'text_ar' => 'يحق للمستودع بيع البضائع غير المطالب بها بعد {$grace_period} يوم من تاريخ الاستحقاق',
                'text_en' => 'Warehouse has the right to sell unclaimed goods after {$grace_period} days from due date',
                'is_active' => true,
                'has_variables' => true,
                'sort_order' => 4,
            ],
            [
                'text_ar' => 'العميل مسؤول عن التأمين على بضائعه أثناء فترة التخزين',
                'text_en' => 'Customer is responsible for insuring goods during storage period',
                'is_active' => true,
                'has_variables' => false,
                'sort_order' => 5,
            ],
            [
                'text_ar' => 'يجب إبلاغ المستودع بأي عيوب في البضاعة عند الاستلام خلال {$inspection_period} ساعة',
                'text_en' => 'Customer must report any goods defects upon receipt within {$inspection_period} hours',
                'is_active' => true,
                'has_variables' => true,
                'sort_order' => 6,
            ],
        ];

        foreach ($terms as $term) {
            Term::updateOrCreate(
                ['text_ar' => $term['text_ar']],
                $term
            );
        }
    }
}
