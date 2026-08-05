<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QueueTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_date',
        'daily_sequence',
        'customer_id',
        'contract_id',
        'period_id',
        'driver_id',
        'driver_name',
        'estimated_load',
        'contract_number_suffix',
        'day_time_str',
        'date_hijri',
        'pallet_balances',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'ticket_date'     => 'date:Y-m-d',
        'daily_sequence'  => 'integer',
        'pallet_balances' => 'array',
    ];

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

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
