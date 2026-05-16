<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContractAgent extends Model
{
    protected $fillable = [
        'contract_id',
        'contact_id',
        'name',
        'phone_number',
        'id_number',
        'job_title',
        'can_sign',
        'can_withdraw_goods',
        'status',
        'status_reason',
        'deleted_at_custom',
    ];

    protected $casts = [
        'can_sign' => 'boolean',
        'can_withdraw_goods' => 'boolean',
        'deleted_at_custom' => 'datetime',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }
}
