<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PalletRearrangement extends Model
{
    use SoftDeletes, \App\Traits\LogsActivity;

    protected $fillable = [
        'serial_number',
        'customer_id',
        'contract_id',
        'period_id',
        'rearrangement_date',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'rearrangement_date' => 'date:Y-m-d',
        'approved_at'        => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($rearrangement) {
            if (empty($rearrangement->serial_number)) {
                $seasonCode = 'DT-SZ';
                if ($rearrangement->contract_id) {
                    $contract = Contract::find($rearrangement->contract_id);
                    if ($contract && $contract->season_id) {
                        $season = Season::find($contract->season_id);
                        if ($season && $season->code) {
                            $seasonCode = $season->code;
                        }
                    }
                }

                $monthStr = date('m');
                $hijriYear = '48';
                // Code 15 for Pallet Rearrangements
                $prefix = $seasonCode . '-' . $monthStr . $hijriYear . '15';

                $lastVoucher = self::where('serial_number', 'like', $prefix . '%')
                    ->orderBy('serial_number', 'desc')
                    ->first();

                $sequence = 1;
                if ($lastVoucher && preg_match('/' . preg_quote($prefix, '/') . '(\d{5})$/', $lastVoucher->serial_number, $matches)) {
                    $sequence = ((int) $matches[1]) + 1;
                }

                $rearrangement->serial_number = $prefix . str_pad($sequence, 5, '0', STR_PAD_LEFT);
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
        return $this->hasMany(PalletRearrangementItem::class);
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
