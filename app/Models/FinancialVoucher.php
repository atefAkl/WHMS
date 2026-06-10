<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancialVoucher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'voucher_number',
        'type',
        'date',
        'amount',
        'primary_account_id',
        'counter_account_id',
        'reference',
        'description',
        'status',
        'journal_entry_id',
        'contract_id',
        'customer_id',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function primaryAccount()
    {
        return $this->belongsTo(Account::class, 'primary_account_id');
    }

    public function counterAccount()
    {
        return $this->belongsTo(Account::class, 'counter_account_id');
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class, 'contract_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
