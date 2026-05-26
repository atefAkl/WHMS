<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractSetting extends Model
{
    protected $fillable = ['key', 'value', 'season_id'];

    public function season()
    {
        return $this->belongsTo(Season::class);
    }
}
