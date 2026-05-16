<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
    ];

    public function locations()
    {
        return $this->hasMany(Location::class);
    }
}
