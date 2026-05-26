<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ContractPayment extends Model {
    protected $fillable = ['contract_id','amount','payment_date','method','reference','notes'];
    protected $casts = ['amount'=>'float','payment_date'=>'date:Y-m-d'];
    public function contract() { return $this->belongsTo(Contract::class); }
}
