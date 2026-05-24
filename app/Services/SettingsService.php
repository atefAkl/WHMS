<?php

namespace App\Services;

use App\Models\AdminSetting;
use App\Models\TenantSetting;

class SettingsService
{
    /**
     * Get the active settings model based on context.
     */
    protected function getModelClass(): string
    {
        if (function_exists('tenancy') && tenancy()->initialized) {
            return TenantSetting::class;
        }
        return AdminSetting::class;
    }

    /**
     * Get a setting by key, with default value fallback.
     */
    public function get(string $key, $default = null)
    {
        $modelClass = $this->getModelClass();
        $setting = $modelClass::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set a setting value.
     */
    public function set(string $key, $value): void
    {
        $modelClass = $this->getModelClass();
        $modelClass::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * Get all settings.
     */
    public function all(): array
    {
        $modelClass = $this->getModelClass();
        return $modelClass::pluck('value', 'key')->all();
    }
}
