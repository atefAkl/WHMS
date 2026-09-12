<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractTransferItem extends Model
{
    protected $fillable = [
        'contract_transfer_id',
        'inventory_item_id',
        'inventory_item_variant_id',
        'pallet_id',
        'quantity',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'float',
    ];

    public function transfer()
    {
        return $this->belongsTo(ContractTransfer::class, 'contract_transfer_id');
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
