<?php

namespace Database\Seeders;

use App\Models\Warehouse;
use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $warehouse = Warehouse::where('code', 'WH-01')->first();

        if (!$warehouse) {
            $this->command->warn('Warehouse WH-01 not found. Skipping LocationSeeder.');
            return;
        }

        $locations = [];
        $zones = ['A', 'B', 'C', 'D'];
        $rows = range(1, 10);
        $slots = range(1, 20);

        foreach ($zones as $zone) {
            foreach ($rows as $row) {
                foreach ($slots as $slot) {
                    $locations[] = [
                        'warehouse_id' => $warehouse->id,
                        'code' => "WH-01-{$zone}{$row}-S{$slot}",
                        'zone' => $zone,
                        'row' => (string)$row,
                        'slot' => (string)$slot,
                        'status' => 'available',
                    ];
                }
            }
        }

        foreach ($locations as $location) {
            Location::updateOrCreate(
                ['code' => $location['code']],
                $location
            );
        }

        $this->command->info('Created ' . count($locations) . ' locations for warehouse WH-01');
    }
}
