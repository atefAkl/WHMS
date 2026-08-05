<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UnitOfMeasureSeeder extends Seeder
{
    public function run(): void
    {
        // إذا كان نموذج UnitOfMeasure موجوداً
        if (class_exists('App\Models\UnitOfMeasure')) {
            $units = [
                [
                    'code' => 'TON',
                    'name_ar' => 'طن',
                    'name_en' => 'Ton',
                    'abbreviation' => 't',
                    'is_active' => true,
                ],
                [
                    'code' => 'KG',
                    'name_ar' => 'كيلوجرام',
                    'name_en' => 'Kilogram',
                    'abbreviation' => 'kg',
                    'is_active' => true,
                ],
                [
                    'code' => 'PALLET',
                    'name_ar' => 'طبل',
                    'name_en' => 'Pallet',
                    'abbreviation' => 'plt',
                    'is_active' => true,
                ],
                [
                    'code' => 'BAG',
                    'name_ar' => 'كيس',
                    'name_en' => 'Bag',
                    'abbreviation' => 'bg',
                    'is_active' => true,
                ],
                [
                    'code' => 'BOX',
                    'name_ar' => 'صندوق',
                    'name_en' => 'Box',
                    'abbreviation' => 'bx',
                    'is_active' => true,
                ],
            ];

            foreach ($units as $unit) {
                \App\Models\UnitOfMeasure::updateOrCreate(
                    ['code' => $unit['code']],
                    $unit
                );
            }
        }
    }
}
