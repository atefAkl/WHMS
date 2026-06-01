<?php

namespace Database\Seeders;

use App\Models\Season;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Customer;
use App\Models\Warehouse;
use App\Models\Location;
use App\Models\Contract;
use App\Models\Pallet;
use Carbon\Carbon;

class SeasonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $season = Season::firstOrCreate([
            'code' => 'DTS26',
        ], [
            'name_ar' => 'موسم 2026-2027',
            'name_en' => 'DTS2026-2027',
            'start_date' => '2026-10-01',
            'end_date' => '2027-03-31',
            'is_active' => true,
            'introduction' => 'موسم 2026-2027',
            'preamble' => 'موسم 2026-2027',
            'mandatory_period' => 12,
            'renewal_period' => 12
        ]);
    }
}
