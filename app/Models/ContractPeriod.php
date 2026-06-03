<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractPeriod extends Model
{
    protected $fillable = [
        'contract_id',
        'period_number',
        'start_date',
        'end_date',
        'status',
        'status_reason',
        'remaining_period_action',
        'terminate_contract',
        'notify_customer',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
        'period_number' => 'integer',
        'terminate_contract' => 'boolean',
        'notify_customer' => 'boolean',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function items()
    {
        return $this->hasMany(\App\Models\ContractPeriodItem::class, 'contract_period_id');
    }

    public function invoices()
    {
        return $this->hasMany(ContractInvoice::class, 'period_id');
    }

    public function payments()
    {
        return $this->hasMany(ContractPayment::class, 'period_id');
    }

    public function receptions()
    {
        return $this->hasMany(Reception::class, 'period_id');
    }

    public function deliveries()
    {
        return $this->hasMany(Delivery::class, 'period_id');
    }

    public function exitAuthorizations()
    {
        return $this->hasMany(ExitAuthorization::class, 'period_id');
    }
}
