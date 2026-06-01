<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Customer;
use App\Models\Warehouse;
use App\Models\Location;
use App\Models\Contract;
use App\Models\Pallet;
use Carbon\Carbon;

class PalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Warehouse
        $warehouse = Warehouse::create([
            'code' => 'WH-01',
            'name' => 'مستودع الرياض الرئيسي',
            'description' => 'المستودع المركزي لخدمات التخزين',
        ]);

        // 2. Create Locations
        $zones = ['A', 'B', 'C'];
        foreach ($zones as $zone) {
            for ($row = 1; $row <= 5; $row++) {
                for ($slot = 1; $slot <= 4; $slot++) {
                    Location::create([
                        'warehouse_id' => $warehouse->id,
                        'code' => "WH-01-{$zone}-R" . str_pad($row, 2, '0', STR_PAD_LEFT) . "-S" . str_pad($slot, 2, '0', STR_PAD_LEFT),
                        'zone' => $zone,
                        'row' => "R{$row}",
                        'slot' => "S{$slot}",
                        'status' => 'available',
                    ]);
                }
            }
        }

        // Get basic entities
        $saudiArabia = \App\Models\Country::where('code', 'SA')->first();
        $businessCategory = \App\Models\CustomerCategory::where('name_en', 'Business')->first();
        $companyCat = \App\Models\CustomerCategory::where('name_en', 'Company')->where('parent_id', $businessCategory->id)->first();
        
        // 3. Create Customers
        $customers = [
            [
                'name' => 'شركة الأغذية المتحدة', 
                'email' => 'info@food.com',
                'phone_number' => '+966500000001',
                'country_id' => $saudiArabia->id,
                'category_id' => $companyCat->id,
            ],
            [
                'name' => 'مؤسسة التوريدات اللوجستية', 
                'email' => 'sales@logistics.com',
                'phone_number' => '+966500000002',
                'country_id' => $saudiArabia->id,
                'category_id' => $companyCat->id,
            ],
            [
                'name' => 'مصنع البلاستيك الوطني', 
                'email' => 'contact@plastic.com',
                'phone_number' => '+966500000003',
                'country_id' => $saudiArabia->id,
                'category_id' => $companyCat->id,
            ],
        ];

        foreach ($customers as $c) {
            $customer = Customer::create($c);

            // 4. Create Contract for each customer
            $contract = Contract::create([
                'customer_id' => $customer->id,
                'contract_number' => "CNT-2026-" . str_pad((string)$customer->id, 3, '0', STR_PAD_LEFT),
                'start_date' => Carbon::now()->subMonths(2),
                'end_date' => Carbon::now()->addYear(),
                'status' => 'active',
                'total_capacity' => 500,
            ]);
        }

        // 5. Create Standalone Pallets
        // First delete existing pallets
        Pallet::query()->delete();

        $palletsData = [];

        // 2000 small (صغيرة) with numbers < 3000 -> loop 1 to 2000
        for ($i = 1; $i <= 2000; $i++) {
            $palletsData[] = [
                'pallet_number' => (string)$i,
                'size' => 'صغيرة',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 2000 large (كبيرة) with numbers >= 3001 and < 13000 -> loop 3001 to 5000
        for ($i = 3001; $i <= 5000; $i++) {
            $palletsData[] = [
                'pallet_number' => (string)$i,
                'size' => 'كبيرة',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 500 wood (خشب) with numbers >= 13001 and < 15000 -> loop 13001 to 13500
        for ($i = 13001; $i <= 13500; $i++) {
            $palletsData[] = [
                'pallet_number' => (string)$i,
                'size' => 'خشب',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // 500 plastic (بلاستيك) with numbers >= 15001 and < 20000 -> loop 15001 to 15500
        for ($i = 15001; $i <= 15500; $i++) {
            $palletsData[] = [
                'pallet_number' => (string)$i,
                'size' => 'بلاستيك',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Insert in chunks for performance
        $chunks = array_chunk($palletsData, 500);
        foreach ($chunks as $chunk) {
            $sizeCodes = [
                'كبيرة' => '01',
                'وسط' => '02',
                'صغيرة' => '03',
                'خشب' => '04',
                'بلاستيك' => '05',
            ];
            foreach ($chunk as &$pallet) {
                $code = $sizeCodes[$pallet['size']] ?? '02';
                $num = str_pad($pallet['pallet_number'], 5, '0', STR_PAD_LEFT);
                $pallet['pallet_code'] = 'PAL' . $code . $num;
            }
            Pallet::insert($chunk);
        }
    }
}
