<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'name',
        'foreign_name',
        'country_id',
        'category_id',
        's_number',
        'email',
        'phone_number',
        'website',
        'vat_number',
        'cr_number',
        'id_number',
        'status',
        'address',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($customer) {
            if (empty($customer->foreign_name)) {
                $customer->foreign_name = $customer->name;
            }
            if (empty($customer->s_number)) {
                $lastCustomer = self::latest('id')->first();
                if ($lastCustomer && preg_match('/^10014(\d{5})$/', $lastCustomer->s_number, $matches)) {
                    $lastSequence = (int)$matches[1];
                    $nextSequence = $lastSequence + 10;
                } else {
                    $nextSequence = 1;
                }
                $customer->s_number = '10014' . str_pad($nextSequence, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function category()
    {
        return $this->belongsTo(CustomerCategory::class, 'category_id');
    }

    public function contacts()
    {
        return $this->hasMany(Contact::class);
    }

    public function contracts()
    {
        return $this->hasMany(Contract::class);
    }

    public function pallets()
    {
        return $this->hasMany(Pallet::class);
    }
}
