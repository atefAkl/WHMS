<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Season extends Model
{
    protected $fillable = [
        'code', 'name_ar', 'name_en', 'start_date', 'end_date', 'is_active',
        'introduction', 'preamble', 'mandatory_period', 'renewal_period'
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
        'is_active'  => 'boolean',
    ];

    public function terms()
    {
        return $this->hasMany(Term::class)->orderBy('sort_order');
    }

    public function settings()
    {
        return $this->hasMany(ContractSetting::class);
    }

    public function blocks()
    {
        return $this->hasMany(ContractBlock::class)->orderBy('sort_order');
    }
}
