<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryEntry extends Model
{
    use SoftDeletes;

    protected static function booted()
    {
        static::creating(function ($entry) {
            if (\Illuminate\Support\Facades\DB::connection()->getDriverName() === 'pgsql') {
                try {
                    $maxId = static::withTrashed()->max('id');
                    if ($maxId !== null && $maxId > 0) {
                        \Illuminate\Support\Facades\DB::statement("SELECT setval('inventory_entries_id_seq', {$maxId}, true)");
                    }
                } catch (\Throwable $e) {
                    // Ignore if sequence not found or already synced
                }
            }
        });
    }

    protected $fillable = [
        'contract_id',
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

    public function contract()
    {
        return $this->belongsTo(Contract::class);
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

    public function voucher()
    {
        return $this->morphTo();
    }
}
