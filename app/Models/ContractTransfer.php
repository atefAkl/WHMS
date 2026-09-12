<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\ValidatesSecureDeletion;
use App\Traits\LogsActivity;

class ContractTransfer extends Model
{
    use SoftDeletes, ValidatesSecureDeletion, LogsActivity;

    protected $fillable = [
        'serial_number',
        'transfer_date',
        'source_contract_id',
        'destination_contract_id',
        'source_customer_id',
        'destination_customer_id',
        'period_id',
        'driver_id',
        'farm_source',
        'notes',
        'status',
        'created_by',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'approved_at'   => 'datetime',
    ];

    public function sourceContract()
    {
        return $this->belongsTo(Contract::class, 'source_contract_id');
    }

    public function destinationContract()
    {
        return $this->belongsTo(Contract::class, 'destination_contract_id');
    }

    public function sourceCustomer()
    {
        return $this->belongsTo(Customer::class, 'source_customer_id');
    }

    public function destinationCustomer()
    {
        return $this->belongsTo(Customer::class, 'destination_customer_id');
    }

    public function period()
    {
        return $this->belongsTo(ContractPeriod::class, 'period_id');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class, 'driver_id');
    }

    public function items()
    {
        return $this->hasMany(ContractTransferItem::class, 'contract_transfer_id');
    }

    public function inventoryEntries()
    {
        return $this->morphMany(InventoryEntry::class, 'voucher');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
