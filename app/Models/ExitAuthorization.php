<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExitAuthorization extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'serial_number',
        'customer_id',
        'contract_id',
        'period_id',
        'requester_type',
        'requester_proof',
        'driver_id',
        'representative_id',
        'deliver_to_self',
        'notes',
        'status', // pending, completed, cancelled
        'validity_days',
        'expiry_date',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'deliver_to_self' => 'boolean',
        'expiry_date' => 'date',
    ];

    public function period()
    {
        return $this->belongsTo(ContractPeriod::class, 'period_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function representative()
    {
        return $this->belongsTo(ContractAgent::class, 'representative_id');
    }

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

        static::creating(function ($auth) {
            if (empty($auth->serial_number)) {
                $seasonCode = self::getActiveSeasonCode();
                $prefix = $seasonCode . '11'; // Doc code '11' for Exit Authorization
                $last = self::withTrashed()
                    ->where('serial_number', 'like', $prefix . '%')
                    ->orderBy('serial_number', 'desc')
                    ->first();
                $seq = 1;
                if ($last) {
                    $seq = ((int) substr($last->serial_number, strlen($prefix))) + 1;
                }
                $auth->serial_number = $prefix . str_pad((string)$seq, 5, '0', STR_PAD_LEFT);
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

    public function items()
    {
        return $this->hasMany(ExitAuthorizationItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function editor()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getIsExpiredAttribute()
    {
        if (!$this->expiry_date) {
            return false;
        }

        return now()->greaterThan($this->expiry_date->endOfDay());
    }

    public function scopePendingActive($query)
    {
        return $query->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('expiry_date')
                    ->orWhereDate('expiry_date', '>=', now());
            });
    }
}
