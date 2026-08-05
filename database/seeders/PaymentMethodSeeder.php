<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        // إذا كان نموذج PaymentMethod موجوداً
        if (class_exists('App\Models\PaymentMethod')) {
            $paymentMethods = [
                [
                    'code' => 'CASH',
                    'name_ar' => 'نقدي',
                    'name_en' => 'Cash',
                    'is_active' => true,
                ],
                [
                    'code' => 'BANK_TRANSFER',
                    'name_ar' => 'تحويل بنكي',
                    'name_en' => 'Bank Transfer',
                    'is_active' => true,
                ],
                [
                    'code' => 'CHECK',
                    'name_ar' => 'شيك',
                    'name_en' => 'Check',
                    'is_active' => true,
                ],
                [
                    'code' => 'CREDIT_CARD',
                    'name_ar' => 'بطاقة ائتمان',
                    'name_en' => 'Credit Card',
                    'is_active' => false,
                ],
            ];

            foreach ($paymentMethods as $method) {
                \App\Models\PaymentMethod::updateOrCreate(
                    ['code' => $method['code']],
                    $method
                );
            }
        }
    }
}
