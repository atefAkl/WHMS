<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ContractItem extends Model {
    protected $fillable = ['contract_id','storage_item_id','short_name','unit_count','monthly_rent','discount','vat_rate','subtotal_before_vat','subtotal'];
    protected $casts = ['unit_count'=>'integer','monthly_rent'=>'float','discount'=>'float','vat_rate'=>'float','subtotal_before_vat'=>'float','subtotal'=>'float'];
    protected static function booted()
    {
        static::saving(function ($item) {
            $unitCount = $item->unit_count ?? 0;
            $monthlyRent = $item->monthly_rent ?? 0.00;
            $discount = $item->discount ?? 0.00;
            $vatRate = $item->vat_rate ?? 15.00;
            $duration = $item->contract->mandatory_period ?? 1;

            $item->subtotal = round($duration * $unitCount * $monthlyRent * (1 - $discount / 100), 2);
            $item->subtotal_before_vat = round(($item->subtotal * 100) / (100 + $vatRate), 2);
        });
    }

    public function storageItem() { return $this->belongsTo(StorageItem::class); }
    public function contract() { return $this->belongsTo(Contract::class); }
}
