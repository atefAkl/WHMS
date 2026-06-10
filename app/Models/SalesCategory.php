<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesCategory extends Model
{
    protected $fillable = ['parent_id', 'name_ar', 'name_en', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function parent()
    {
        return $this->belongsTo(SalesCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(SalesCategory::class, 'parent_id');
    }

    public function items()
    {
        return $this->hasMany(StorageItem::class, 'sales_category_id');
    }
}
