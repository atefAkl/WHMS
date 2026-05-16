<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Agent extends Model {
    protected $fillable = ['name','phone_number','id_number','email','can_sign','can_withdraw_goods','is_active'];
    protected $casts = ['can_sign'=>'boolean','can_withdraw_goods'=>'boolean','is_active'=>'boolean'];
    public function contracts() { return $this->hasMany(Contract::class); }
}
