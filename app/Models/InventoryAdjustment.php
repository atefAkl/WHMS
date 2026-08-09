<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    use \App\Traits\LogsActivity;

    protected $fillable = [
        'serial_number',
        'customer_id',
        'contract_id',
        'period_id',
        'adjustment_date',
        'adjustment_type',
        'reason',
        'proof_file',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'adjustment_date' => 'date:Y-m-d',
        'approved_at'      => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($adjustment) {
            if (empty($adjustment->serial_number)) {
                $seasonCode = 'DT-SZ';
                if ($adjustment->contract_id) {
                    $contract = Contract::find($adjustment->contract_id);
                    if ($contract && $contract->season_id) {
                        $season = Season::find($contract->season_id);
                        if ($season && $season->code) {
                            $seasonCode = $season->code;
                        }
                    }
                }

                // Month digit (1-12 zero padded to 2 digits) & Hijri Year (e.g., 48)
                $monthStr = date('m');
                $hijriYear = '48'; // Standard Hijri reference
                $prefix = $seasonCode . '-' . $monthStr . $hijriYear . '11';

                $lastAdjustment = self::where('serial_number', 'like', $prefix . '%')
                    ->orderBy('serial_number', 'desc')
                    ->first();

                $sequence = 1;
                if ($lastAdjustment && preg_match('/' . preg_quote($prefix, '/') . '(\d{5})$/', $lastAdjustment->serial_number, $matches)) {
                    $sequence = ((int) $matches[1]) + 1;
                }

                $adjustment->serial_number = $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
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

    public function items()
    {
        return $this->hasMany(InventoryAdjustmentItem::class);
    }

    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
