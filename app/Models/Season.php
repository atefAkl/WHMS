<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Season extends Model
{
    protected $fillable = [
        'name_ar', 'name_en', 'start_date', 'end_date', 'is_active',
        'introduction', 'preamble', 'mandatory_period', 'renewal_period'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_active'  => 'boolean',
    ];

    public function terms()
    {
        return $this->belongsToMany(Term::class, 'season_terms')
                    ->withPivot('sort_order')
                    ->orderByPivot('sort_order');
    }
}
