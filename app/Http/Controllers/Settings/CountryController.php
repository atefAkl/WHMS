<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Country;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Artisan;

class CountryController extends Controller
{
    public function index(Request $request)
    {
        $query = Country::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name_ar', 'like', "%{$search}%")
                  ->orWhere('name_en', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
        }

        $countries = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Settings/Countries', [
            'countries' => $countries,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:countries,code',
            'phone_code' => 'nullable|string|max:10',
        ]);

        Country::create($validated);

        return redirect()->back()->with('success', 'Country created successfully.');
    }

    public function update(Request $request, Country $country)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string|max:255',
            'name_en' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:countries,code,' . $country->id,
            'phone_code' => 'nullable|string|max:10',
        ]);

        $country->update($validated);

        return redirect()->back()->with('success', 'Country updated successfully.');
    }

    public function destroy(Country $country)
    {
        $country->delete();
        return redirect()->back()->with('success', 'Country deleted successfully.');
    }

    public function seed()
    {
        Artisan::call('db:seed', ['--class' => 'CountrySeeder']);
        return redirect()->back()->with('success', 'Countries seeded successfully.');
    }
}
