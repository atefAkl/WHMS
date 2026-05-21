<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class TenantSettingsController extends Controller
{
    /**
     * Return all contract settings for the current tenant.
     */
    public function index()
    {
        $settings = ContractSetting::pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update or create contract settings.
     * Expected payload: { key1: value1, key2: value2, ... }
     */
    public function store(Request $request)
    {
        $data = $request->all();
        foreach ($data as $key => $value) {
            ContractSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
        return response()->json(['message' => 'Settings updated successfully']);
    }
}
