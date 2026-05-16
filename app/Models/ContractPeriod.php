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
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'period_number' => 'integer',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
