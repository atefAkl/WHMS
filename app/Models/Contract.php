<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'customer_id','contact_id','contract_number',
        'write_date','write_date_hijri',
        'start_date','start_date_hijri','end_date',
        'mandatory_period','renewal_period',
        'discount','vat_rate',
        'status','total_capacity','pricing_terms',
        'introduction','preamble','contract_date',
        'contract_title', 'footer', 'season_id'
    ];

    protected $casts = [
        'pricing_terms'    => 'array',
        'write_date'       => 'date:Y-m-d',
        'start_date'       => 'date:Y-m-d',
        'end_date'         => 'date:Y-m-d',
        'mandatory_period' => 'integer',
        'renewal_period'   => 'integer',
        'discount'         => 'float',
        'vat_rate'         => 'float',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($contract) {
            if (empty($contract->contract_number)) {
                if ($contract->season_id) {
                    $season = Season::find($contract->season_id);
                    if ($season && $season->code) {
                        $prefix = $season->code . '14';
                        $last = self::where('contract_number', 'like', $prefix . '%')
                            ->orderBy('contract_number', 'desc')
                            ->first();
                        $seq = 1;
                        if ($last) {
                            $seq = ((int) substr($last->contract_number, strlen($prefix))) + 1;
                        }
                        $contract->contract_number = $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
                    }
                }
                
                // Fallback if still empty
                if (empty($contract->contract_number)) {
                    $last = self::latest('id')->first();
                    $seq  = $last ? ((int) substr($last->contract_number, 5)) + 1 : 1;
                    $contract->contract_number = '10015' . str_pad($seq, 5, '0', STR_PAD_LEFT);
                }
            }
            // Auto-compute end_date from start_date + mandatory_period
            if ($contract->start_date && $contract->mandatory_period) {
                $contract->end_date = \Carbon\Carbon::parse($contract->start_date)
                    ->addMonths($contract->mandatory_period);
            }
        });

        static::created(function ($contract) {
            // Create first period automatically
            $contract->periods()->create([
                'period_number' => 1,
                'start_date' => $contract->start_date,
                'end_date' => $contract->end_date ?? \Carbon\Carbon::parse($contract->start_date)->addMonths($contract->mandatory_period),
                'status' => 'active',
                'notes' => 'الفترة الإلزامية الأولى (تلقائي)'
            ]);

            // Create contract agent if contact_id exists
            if ($contract->contact_id) {
                $contact = Contact::find($contract->contact_id);
                if ($contact) {
                    $contract->contractAgents()->create([
                        'contact_id' => $contact->id,
                        'name' => $contact->name,
                        'phone_number' => $contact->phone_number,
                        'id_number' => $contact->id_number,
                        'job_title' => $contact->job_title,
                        'can_sign' => $contact->can_sign,
                        'can_withdraw_goods' => $contact->can_withdraw_goods,
                        'status' => 'active',
                    ]);
                }
            }
        });
    }

    public function customer()   { return $this->belongsTo(Customer::class); }
    public function contact()    { return $this->belongsTo(Contact::class); }
    public function items()      { return $this->hasMany(ContractItem::class); }
    public function terms()      { return $this->hasMany(Term::class)->orderBy('sort_order'); }
    public function payments()   { return $this->hasMany(ContractPayment::class); }
    public function periods()    { return $this->hasMany(ContractPeriod::class); }
    public function contractAgents() { return $this->hasMany(ContractAgent::class); }
    public function invoices()   { return $this->hasMany(ContractInvoice::class); }
    public function season()     { return $this->belongsTo(Season::class); }
}
