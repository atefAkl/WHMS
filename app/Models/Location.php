<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $fillable = [
        'warehouse_id',
        'code',
        'zone',
        'row',
        'slot',
        'status',
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function pallets()
    {
        return $this->hasMany(Pallet::class);
    }
}
