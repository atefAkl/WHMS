<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExitAuthorizationItem extends Model
{
    protected $fillable = [
        'exit_authorization_id',
        'inventory_item_id',
        'inventory_item_variant_id',
        'pallet_number',
        'quantity',
    ];

    public function exitAuthorization()
    {
        return $this->belongsTo(ExitAuthorization::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function inventoryItemVariant()
    {
        return $this->belongsTo(InventoryItemVariant::class);
    }
}
