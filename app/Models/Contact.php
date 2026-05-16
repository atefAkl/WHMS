<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    protected $fillable = [
        'customer_id',
        'name',
        'phone_number',
        'id_number',
        'job_title',
        'can_sign',
        'can_withdraw_goods',
    ];

    protected $casts = [
        'can_sign' => 'boolean',
        'can_withdraw_goods' => 'boolean',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
