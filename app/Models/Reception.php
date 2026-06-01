<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reception extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'serial_number',
        'customer_id',
        'contract_id',
        'period_id',
        'driver_id',
        'representative_id',
        'farm_source',
        'notes',
        'reception_date',
        'status',
        'history',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'reception_date' => 'datetime',
        'history'        => 'array',
    ];

    public static function getActiveSeasonCode()
    {
        if (session()->has('active_season_id')) {
            $season = Season::find(session('active_season_id'));
            if ($season) {
                return $season->code;
            }
        }
        $season = Season::where('is_active', true)->first();
        return $season ? $season->code : 'DTS26';
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($reception) {
            if (empty($reception->serial_number)) {
                $seasonCode = self::getActiveSeasonCode();
                $prefix = $seasonCode . '09'; // Doc code '09' for Goods Reception Receipt
                $last = self::withTrashed()
                    ->where('serial_number', 'like', $prefix . '%')
                    ->orderBy('serial_number', 'desc')
                    ->first();
                $seq = 1;
                if ($last) {
                    $seq = ((int) substr($last->serial_number, strlen($prefix))) + 1;
                }
                $reception->serial_number = $prefix . str_pad((string)$seq, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function period()
    {
        return $this->belongsTo(ContractPeriod::class, 'period_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function representative()
    {
        return $this->belongsTo(ContractAgent::class, 'representative_id');
    }

    public function inventoryEntries()
    {
        return $this->morphMany(InventoryEntry::class, 'voucher');
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
