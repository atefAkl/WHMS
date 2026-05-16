<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerCategory extends Model
{
    protected $fillable = ['parent_id', 'name_ar', 'name_en'];

    public function parent()
    {
        return $this->belongsTo(CustomerCategory::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CustomerCategory::class, 'parent_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'category_id');
    }
}
