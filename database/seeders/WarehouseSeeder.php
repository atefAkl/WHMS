<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class WarehouseSeeder extends Seeder
{
    public function run(): void
    {
        $warehouses = [
            [
                'code' => 'WH-01',
                'name' => 'المستودع الرئيسي - Main Warehouse',
                'description' => 'المستودع المركزي الرئيسي للعمليات - Central main warehouse for operations',
            ],
            [
                'code' => 'WH-02',
                'name' => 'مستودع التبريد - Cold Storage Warehouse',
                'description' => 'مستودع مبرد للمنتجات الحساسة للحرارة - Cold storage for temperature-sensitive products',
            ],
            [
                'code' => 'WH-03',
                'name' => 'مستودع المواد الخطرة - Hazardous Materials Warehouse',
                'description' => 'مستودع خاص للمواد الخطرة - Special warehouse for hazardous materials',
            ],
        ];

        foreach ($warehouses as $warehouse) {
            Warehouse::updateOrCreate(['code' => $warehouse['code']], $warehouse);
        }
    }
}
