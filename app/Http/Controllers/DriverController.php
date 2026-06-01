<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index()
    {
        $drivers = Driver::where('is_active', true)->latest()->get();
        return response()->json($drivers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'phone_number'   => 'nullable|string|max:50',
            'id_number'      => 'nullable|string|max:50',
            'vehicle_plate'  => 'nullable|string|max:50',
            'vehicle_type'   => 'nullable|string|max:50',
            'license_number' => 'nullable|string|max:50',
        ]);

        $driver = Driver::create($validated);

        return response()->json([
            'success' => true,
            'driver'  => $driver,
            'message' => 'تم إضافة السائق بنجاح'
        ]);
    }
}
