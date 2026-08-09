<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PalletRearrangementItem extends Model
{
    protected $fillable = [
        'pallet_rearrangement_id',
        'inventory_item_id',
        'inventory_item_variant_id',
        'pallet_id',
        'type',
        'quantity',
        'quantity_in',
        'quantity_out',
        'notes',
    ];

    protected $casts = [
        'quantity'     => 'float',
        'quantity_in'  => 'float',
        'quantity_out' => 'float',
    ];

    public function rearrangement()
    {
        return $this->belongsTo(PalletRearrangement::class, 'pallet_rearrangement_id');
    }

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
}
