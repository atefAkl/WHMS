<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractInvoice extends Model
{
    protected $fillable = [
        'contract_id',
        'period_id',
        'invoice_number',
        'issue_date',
        'due_date',
        'amount',
        'paid_amount',
        'status',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'date:Y-m-d',
        'due_date'   => 'date:Y-m-d',
        'amount'     => 'float',
        'paid_amount' => 'float',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function period()
    {
        return $this->belongsTo(ContractPeriod::class, 'period_id');
    }
}
