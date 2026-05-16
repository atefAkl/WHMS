<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CustomerCategory;

class CustomerCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name_ar' => 'أعمال',
                'name_en' => 'Business',
                'children' => [
                    ['name_ar' => 'شركة', 'name_en' => 'Company'],
                    ['name_ar' => 'مؤسسة', 'name_en' => 'Establishment'],
                    ['name_ar' => 'منظمة', 'name_en' => 'Organization'],
                    ['name_ar' => 'جمعية', 'name_en' => 'Society'],
                    ['name_ar' => 'مصنع', 'name_en' => 'Factory'],
                ]
            ],
            [
                'name_ar' => 'أفراد',
                'name_en' => 'Individual',
                'children' => [
                    ['name_ar' => 'سمسار', 'name_en' => 'Broker'],
                    ['name_ar' => 'تاجر', 'name_en' => 'Merchant'],
                    ['name_ar' => 'صاحب مزرعة', 'name_en' => 'Farm Owner'],
                ]
            ]
        ];

        foreach ($categories as $parentData) {
            $children = $parentData['children'];
            unset($parentData['children']);
            
            $parent = CustomerCategory::firstOrCreate($parentData);
            
            foreach ($children as $childData) {
                $childData['parent_id'] = $parent->id;
                CustomerCategory::firstOrCreate($childData);
            }
        }
    }
}
