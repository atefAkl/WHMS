<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractBlock extends Model
{
    protected $fillable = [
        'season_id', 'contract_id', 'key', 'is_enabled', 'content', 'sort_order'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'sort_order' => 'integer',
        'content'    => 'array'
    ];

    public function season()
    {
        return $this->belongsTo(Season::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
