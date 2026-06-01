<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'phone_number',
        'id_number',
        'vehicle_plate',
        'vehicle_type',
        'license_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function receptions()
    {
        return $this->hasMany(Reception::class);
    }
}
