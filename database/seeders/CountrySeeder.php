<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Country;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            // Gulf
            ['code' => 'SA', 'name_ar' => 'السعودية', 'name_en' => 'Saudi Arabia'],
            ['code' => 'AE', 'name_ar' => 'الإمارات', 'name_en' => 'United Arab Emirates'],
            ['code' => 'KW', 'name_ar' => 'الكويت', 'name_en' => 'Kuwait'],
            ['code' => 'QA', 'name_ar' => 'قطر', 'name_en' => 'Qatar'],
            ['code' => 'BH', 'name_ar' => 'البحرين', 'name_en' => 'Bahrain'],
            ['code' => 'OM', 'name_ar' => 'عمان', 'name_en' => 'Oman'],
            
            // South Asia
            ['code' => 'IN', 'name_ar' => 'الهند', 'name_en' => 'India'],
            ['code' => 'PK', 'name_ar' => 'باكستان', 'name_en' => 'Pakistan'],
            ['code' => 'BD', 'name_ar' => 'بنغلاديش', 'name_en' => 'Bangladesh'],
            ['code' => 'LK', 'name_ar' => 'سريلانكا', 'name_en' => 'Sri Lanka'],
            
            // East/Southeast Asia
            ['code' => 'CN', 'name_ar' => 'الصين', 'name_en' => 'China'],
            ['code' => 'JP', 'name_ar' => 'اليابان', 'name_en' => 'Japan'],
            ['code' => 'KR', 'name_ar' => 'كوريا الجنوبية', 'name_en' => 'South Korea'],
            ['code' => 'PH', 'name_ar' => 'الفلبين', 'name_en' => 'Philippines'],
            ['code' => 'ID', 'name_ar' => 'إندونيسيا', 'name_en' => 'Indonesia'],
            ['code' => 'MY', 'name_ar' => 'ماليزيا', 'name_en' => 'Malaysia'],
        ];

        foreach ($countries as $country) {
            Country::updateOrCreate(['code' => $country['code']], $country);
        }
    }
}
