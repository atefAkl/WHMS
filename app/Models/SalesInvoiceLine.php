<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesInvoiceLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_invoice_id',
        'description',
        'account_id',
        'quantity',
        'unit_price',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total',
    ];

    public function invoice()
    {
        return $this->belongsTo(SalesInvoice::class, 'sales_invoice_id');
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
