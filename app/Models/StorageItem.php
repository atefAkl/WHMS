<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorageItem extends Model
{
    protected $fillable = ['name_ar', 'name_en', 'default_price', 'is_active'];

    protected $casts = [
        'default_price' => 'float',
        'is_active' => 'boolean',
    ];
}
