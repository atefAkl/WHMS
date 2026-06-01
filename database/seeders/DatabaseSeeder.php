<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Only seed central admin user if tenancy is NOT initialized
        if (!function_exists('tenancy') || !tenancy()->initialized) {
            User::firstOrCreate([
                'email' => 'admin@wms.com',
            ], [
                'name' => 'Admin',
                'password' => bcrypt('admin123'),
            ]);
        }

        // Only run tenant seeders if tenancy is initialized
        if (function_exists('tenancy') && tenancy()->initialized) {
            $this->call([
                SeasonSeeder::class,
                CountrySeeder::class,
                CustomerCategorySeeder::class,
                PalletSeeder::class,
                InventoryCategorySeeder::class,
                InventoryItemSeeder::class,
            ]);
        }
    }
}
