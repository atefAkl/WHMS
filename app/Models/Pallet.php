<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pallet extends Model
{
    protected $fillable = [
        'pallet_number',
        'customer_id',
        'contract_id',
        'location_id',
        'status',
        'content_description',
        'weight',
        'dimensions',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function movements()
    {
        return $this->hasMany(Movement::class);
    }
}
