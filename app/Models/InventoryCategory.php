<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryCategory extends Model
{
    protected $fillable = ['parent_id', 'name', 'is_active', 'created_by', 'updated_by'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function parent()
    {
        return $this->belongsTo(InventoryCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(InventoryCategory::class, 'parent_id');
    }

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class, 'category_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
