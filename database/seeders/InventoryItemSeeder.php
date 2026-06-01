<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryItemVariant;

class InventoryItemSeeder extends Seeder
{
    public function run(): void
    {
        // Delete old items and variants to avoid duplication
        InventoryItemVariant::query()->delete();
        InventoryItem::query()->delete();

        // 1. Find the "تمور فلة" category
        $category = InventoryCategory::where('name', 'like', '%تمور فلة%')->first();
        if (!$category) {
            $category = InventoryCategory::create([
                'name' => 'تمور فلة | Loose Dates',
                'is_active' => true,
            ]);
        }

        $itemsData = [
            [
                'name' => 'سكري مفتل | Sukkari Mufattal',
                'variants' => [
                    ['name' => '5ك | 5kg', 'quality' => 'ملكي | Royal', 'price' => 1.00],
                    ['name' => '5ك | 5kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'سكري رطب | Sukkari Rutab',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'فاخر | Premium', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'سكري جلاكسي | Sukkari Galaxy',
                'variants' => [
                    ['name' => '5ك | 5kg', 'quality' => 'ملكي | Royal', 'price' => 1.00],
                    ['name' => '5ك | 5kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'خلاص | Khalas',
                'variants' => [
                    ['name' => 'ك موز | Banana Carton', 'quality' => 'رقم | No.', 'price' => 1.00],
                    ['name' => 'ك موز | Banana Carton', 'quality' => 'رقم | No.', 'price' => 2.00],
                    ['name' => 'ك موز | Banana Carton', 'quality' => 'رقم | No.', 'price' => 3.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'صقعي | Sagai',
                'variants' => [
                    ['name' => '5ك | 5kg', 'quality' => 'ملكي | Royal', 'price' => 1.00],
                    ['name' => '5ك | 5kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'مجدول | Medjool',
                'variants' => [
                    ['name' => '5ك | 5kg', 'quality' => 'ملكي | Royal', 'price' => 1.00],
                    ['name' => 'ك موز | Banana Carton', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'ونانة | Wananah',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'برحي | Barhi',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'نبتة علي | Nabtat Ali',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'نبتة سيف | Nabtat Saif',
                'variants' => [
                    ['name' => 'ك موز | Banana Carton', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'عجوة المدينة | Ajwa Al Madinah',
                'variants' => [
                    ['name' => '5ك | 5kg', 'quality' => 'ملكي | Royal', 'price' => 1.00],
                    ['name' => '5ك | 5kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'خضري | Khodri',
                'variants' => [
                    ['name' => 'ك موز | Banana Carton', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'شيشي | Shishi',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'عسيلة | Aseelah',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'رشودية | Rashodiah',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ],
            [
                'name' => 'روتانة | Rotana',
                'variants' => [
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 1 | No.1', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 2 | No.2', 'price' => 1.00],
                    ['name' => '3ك | 3kg', 'quality' => 'رقم 3 | No.3', 'price' => 1.00],
                ]
            ]
        ];

        foreach ($itemsData as $itemData) {
            $item = InventoryItem::create([
                'name' => $itemData['name'],
                'category_id' => $category->id,
                'is_active' => true,
            ]);

            foreach ($itemData['variants'] as $v) {
                InventoryItemVariant::create([
                    'inventory_item_id' => $item->id,
                    'name' => $v['name'],
                    'quality' => $v['quality'],
                    'default_price' => $v['price'],
                    'is_active' => true,
                ]);
            }
        }
    }
}
