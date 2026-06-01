<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Delivery extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'serial_number',
        'exit_authorization_id',
        'written_reference',
        'customer_id',
        'contract_id',
        'period_id',
        'driver_id',
        'representative_id',
        'notes',
        'delivery_date',
        'status', // draft, approved
        'history',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'delivery_date' => 'datetime',
        'history' => 'array',
    ];

    public static function getActiveSeasonCode()
    {
        if (session()->has('active_season_id')) {
            $season = Season::find(session('active_season_id'));
            if ($season && !empty($season->code)) {
                return $season->code;
            }
        }
        $season = Season::where('is_active', true)->whereNotNull('code')->first();
        return $season ? $season->code : 'DTS26';
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($delivery) {
            if (empty($delivery->serial_number)) {
                $seasonCode = self::getActiveSeasonCode();
                $prefix = $seasonCode . '12'; // Doc code '12' for Goods Delivery Note
                $last = self::withTrashed()
                    ->where('serial_number', 'like', $prefix . '%')
                    ->orderBy('serial_number', 'desc')
                    ->first();
                $seq = 1;
                if ($last) {
                    $seq = ((int) substr($last->serial_number, strlen($prefix))) + 1;
                }
                $delivery->serial_number = $prefix . str_pad((string)$seq, 5, '0', STR_PAD_LEFT);
            }
        });
    }

    public function exitAuthorization()
    {
        return $this->belongsTo(ExitAuthorization::class);
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
