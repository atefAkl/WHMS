<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

use App\Traits\ApiResponse;

class TenantSettingsController extends Controller
{
    use ApiResponse;

    /**
     * Return all contract settings for the current tenant.
     */
    public function index()
    {
        $settings = ContractSetting::pluck('value', 'key');
        return $this->successResponse($settings);
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
        return $this->successResponse(null, 'Settings updated successfully');
    }
}
