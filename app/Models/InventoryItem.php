<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    protected $fillable = ['category_id', 'name', 'code', 'image', 'is_active', 'created_by', 'updated_by'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(InventoryCategory::class, 'category_id');
    }

    public function variants()
    {
        return $this->hasMany(InventoryItemVariant::class);
    }

    public function inventoryEntries()
    {
        return $this->hasMany(InventoryEntry::class, 'inventory_item_id');
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

        static::creating(function ($item) {
            if (empty($item->code)) {
                $seasonCode = 'GEN';
                if (\Schema::hasTable('seasons')) {
                    $activeSeasonId = session('active_season_id');
                    $season = null;
                    if ($activeSeasonId) {
                        $season = \App\Models\Season::find($activeSeasonId);
                    }
                    if (!$season) {
                        $season = \App\Models\Season::where('is_active', true)->first() ?: \App\Models\Season::first();
                    }
                    if ($season && !empty($season->code)) {
                        $seasonCode = $season->code;
                    }
                }

                $modelCode = '12';

                // Get next auto-increment id value or max id
                $nextId = 1;
                $lastItem = static::orderBy('id', 'desc')->first();
                if ($lastItem) {
                    $nextId = $lastItem->id + 1;
                }

                $paddingLength = 12 - strlen($seasonCode) - strlen($modelCode);
                if ($paddingLength < 1) {
                    $paddingLength = 5;
                }

                $serialStr = str_pad((string)$nextId, $paddingLength, '0', STR_PAD_LEFT);
                $item->code = strtoupper($seasonCode . $modelCode . $serialStr);
            }
        });
    }
}
