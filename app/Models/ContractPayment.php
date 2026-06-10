<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractPayment extends Model
{
    protected $fillable = ['contract_id', 'period_id', 'invoice_id', 'amount', 'payment_date', 'method', 'reference', 'notes'];
    protected $casts = ['amount' => 'float', 'payment_date' => 'date:Y-m-d'];
    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
    public function period()
    {
        return $this->belongsTo(ContractPeriod::class, 'period_id');
    }
    public function invoice()
    {
        return $this->belongsTo(SalesInvoice::class, 'invoice_id');
    }
}
