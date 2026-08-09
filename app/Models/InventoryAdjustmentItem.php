<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustmentItem extends Model
{
    protected $fillable = [
        'inventory_adjustment_id',
        'inventory_item_id',
        'inventory_item_variant_id',
        'pallet_id',
        'system_quantity',
        'actual_quantity',
        'variance_quantity',
        'notes',
    ];

    protected $casts = [
        'system_quantity'   => 'float',
        'actual_quantity'   => 'float',
        'variance_quantity' => 'float',
    ];

    public function adjustment()
    {
        return $this->belongsTo(InventoryAdjustment::class, 'inventory_adjustment_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function variant()
    {
        return $this->belongsTo(InventoryItemVariant::class, 'inventory_item_variant_id');
    }

    public function pallet()
    {
        return $this->belongsTo(Pallet::class, 'pallet_id');
    }
}
