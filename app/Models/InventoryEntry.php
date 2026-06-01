<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'inventory_item_id',
        'inventory_item_variant_id',
        'pallet_id',
        'voucher_type',
        'voucher_id',
        'quantity_in',
        'quantity_out',
        'operation_date',
    ];

    protected $casts = [
        'quantity_in'    => 'float',
        'quantity_out'   => 'float',
        'operation_date' => 'datetime',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function variant()
    {
        return $this->belongsTo(InventoryItemVariant::class, 'inventory_item_variant_id');
    }

    public function pallet()
    {
        return $this->belongsTo(Pallet::class);
    }

    public function voucher()
    {
        return $this->morphTo();
    }
}
