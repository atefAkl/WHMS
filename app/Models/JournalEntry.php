<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JournalEntry extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'reference_number', 'date', 'description', 
        'status', 'created_by'
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function lines()
    {
        return $this->hasMany(JournalLine::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getTotalDebitAttribute()
    {
        return $this->lines()->sum('debit');
    }

    public function getTotalCreditAttribute()
    {
        return $this->lines()->sum('credit');
    }
}
