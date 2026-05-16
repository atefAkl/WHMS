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
                'contract_number' => "CNT-2026-" . str_pad($customer->id, 3, '0', STR_PAD_LEFT),
                'start_date' => Carbon::now()->subMonths(2),
                'end_date' => Carbon::now()->addYear(),
                'status' => 'active',
                'total_capacity' => 500,
            ]);

            // 5. Create Pallets for each customer
            for ($i = 1; $i <= 10; $i++) {
                $location = Location::where('status', 'available')->inRandomOrder()->first();
                
                if ($location) {
                    $pallet = Pallet::create([
                        'pallet_number' => "PAL-" . strtoupper(bin2hex(random_bytes(3))),
                        'customer_id' => $customer->id,
                        'contract_id' => $contract->id,
                        'location_id' => $location->id,
                        'status' => 'occupied',
                        'content_description' => 'بضائع متنوعة للعميل ' . $customer->name,
                        'weight' => rand(100, 1000),
                        'dimensions' => '120x100x150',
                    ]);

                    $location->update(['status' => 'occupied']);
                }
            }
        }
    }
}
