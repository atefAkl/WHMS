<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryCategory;

class InventoryCategorySeeder extends Seeder
{
    public function run(): void
    {
        // Level 1: Agricultural Produce
        $level1 = InventoryCategory::firstOrCreate([
            'name' => 'الحاصلات الزراعية | Agricultural Produce',
        ], [
            'parent_id' => null,
            'is_active' => true,
        ]);

        // Level 2: Dates
        $dates = InventoryCategory::firstOrCreate([
            'name' => 'تمور | Dates',
            'parent_id' => $level1->id,
        ], [
            'is_active' => true,
        ]);

        // Level 3: Dates children
        $datesChildren = [
            'تمور فلة | Loose Dates',
            'تمر مكنوز | Compressed Dates',
            'تمر منزوع النواة | Pitted Dates',
        ];

        foreach ($datesChildren as $name) {
            InventoryCategory::firstOrCreate([
                'name' => $name,
                'parent_id' => $dates->id,
            ], [
                'is_active' => true,
            ]);
        }

        // Level 2: Vegetables
        $vegetables = InventoryCategory::firstOrCreate([
            'name' => 'خضروات | Vegetables',
            'parent_id' => $level1->id,
        ], [
            'is_active' => true,
        ]);

        // Level 3: Vegetables children
        $vegChildren = [
            'خضروات طازجة | Fresh Vegetables',
            'بذور ولقاحات | Seeds & Pollen',
            'حبوب | Grains',
        ];

        foreach ($vegChildren as $name) {
            InventoryCategory::firstOrCreate([
                'name' => $name,
                'parent_id' => $vegetables->id,
            ], [
                'is_active' => true,
            ]);
        }
    }
}
