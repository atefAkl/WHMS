<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ContractItem extends Model {
    protected $fillable = ['contract_id','storage_item_id','unit_count','monthly_rent','discount','vat_rate','subtotal_before_vat','subtotal'];
    protected $casts = ['unit_count'=>'integer','monthly_rent'=>'float','discount'=>'float','vat_rate'=>'float','subtotal_before_vat'=>'float','subtotal'=>'float'];
    public function storageItem() { return $this->belongsTo(StorageItem::class); }
    public function contract() { return $this->belongsTo(Contract::class); }
}
