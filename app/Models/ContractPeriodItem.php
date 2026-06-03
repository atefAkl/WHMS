<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractPeriodItem extends Model
{
    protected $fillable = [
        'contract_period_id',
        'storage_item_id',
        'unit_count',
        'monthly_rent',
        'discount',
        'vat_rate',
    ];

    protected $casts = [
        'unit_count' => 'integer',
        'monthly_rent' => 'float',
        'discount' => 'float',
        'vat_rate' => 'float',
    ];

    public function period()
    {
        return $this->belongsTo(ContractPeriod::class, 'contract_period_id');
    }

    public function storageItem()
    {
        return $this->belongsTo(StorageItem::class);
    }
}
