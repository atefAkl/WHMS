<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItemVariant extends Model
{
    protected $fillable = [
        'inventory_item_id',
        'name',
        'code',
        'quality',
        'default_price',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'default_price' => 'float',
        'is_active' => 'boolean',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($variant) {
            if (empty($variant->code)) {
                $item = InventoryItem::find($variant->inventory_item_id);
                $itemCode = $item ? $item->code : 'GEN';
                
                $nextId = 1;
                $lastVariant = static::where('inventory_item_id', $variant->inventory_item_id)->orderBy('id', 'desc')->first();
                if ($lastVariant) {
                    $nextId = $lastVariant->id + 1;
                }
                
                $variant->code = $itemCode . '-V' . str_pad((string)$nextId, 2, '0', STR_PAD_LEFT);
            }
        });
    }
}
