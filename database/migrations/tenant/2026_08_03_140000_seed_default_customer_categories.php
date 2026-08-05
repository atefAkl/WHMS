<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\CustomerCategory;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
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
            
            // Check if exists by name to prevent duplication
            $parent = CustomerCategory::where('name_ar', $parentData['name_ar'])
                ->orWhere('name_en', $parentData['name_en'])
                ->first();

            if (!$parent) {
                $parent = CustomerCategory::create($parentData);
            } else {
                // Keep the exact names
                $parent->update([
                    'name_ar' => $parentData['name_ar'],
                    'name_en' => $parentData['name_en'],
                ]);
            }
            
            foreach ($children as $childData) {
                $child = CustomerCategory::where('parent_id', $parent->id)
                    ->where(function($q) use ($childData) {
                        $q->where('name_ar', $childData['name_ar'])
                          ->orWhere('name_en', $childData['name_en']);
                    })
                    ->first();

                if (!$child) {
                    $childData['parent_id'] = $parent->id;
                    CustomerCategory::create($childData);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No teardown necessary, safe fallback.
    }
};
