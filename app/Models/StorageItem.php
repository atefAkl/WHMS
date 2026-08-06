<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StorageItem extends Model
{
    protected $fillable = [
        'name_ar',
        'name_en',
        'short_name',
        'default_price',
        'is_active',
        'code',
        'description_ar',
        'description_en',
        'sales_category_id',
        'type',
        'max_discount_percent'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'default_price' => 'decimal:2',
    ];

    public function salesCategory()
    {
        return $this->belongsTo(SalesCategory::class, 'sales_category_id');
    }
}
