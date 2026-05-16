<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Agent;
use App\Models\Term;
use Carbon\Carbon;

use App\Models\Season;
use App\Models\StorageItem;
use App\Models\ContractSetting;
use App\Models\Contact;
use App\Models\ContractPeriod;
use App\Models\ContractAgent;
use App\Models\ContractInvoice;
use Illuminate\Support\Facades\Artisan;

class ContractController extends Controller
{
    public function create(Request $request)
    {
        $customer = Customer::with(['country','category.parent', 'contacts'])->findOrFail($request->customer_id);
        $storageItems = StorageItem::where('is_active', true)->get();
        $nextSerial = $this->nextSerial();

        // 1. Get Global Defaults
        $globalSettings = ContractSetting::pluck('value', 'key')->all();

        // 2. Get Active Season Defaults (Priority)
        $activeSeason = Season::where('is_active', true)->first();
        
        $defaults = [
            'introduction'     => $activeSeason->introduction ?? $globalSettings['default_introduction'] ?? '',
            'preamble'         => $activeSeason->preamble     ?? $globalSettings['default_preamble']     ?? '',
            'mandatory_period' => $activeSeason->mandatory_period ?? $globalSettings['default_mandatory_period'] ?? 12,
            'renewal_period'   => $activeSeason->renewal_period   ?? $globalSettings['default_renewal_period']   ?? 12,
        ];

        // 3. Get Season Terms (Pre-assigned)
        $seasonTerms = $activeSeason ? $activeSeason->terms()->orderBy('season_terms.sort_order')->get() : collect();

        // 4. Get All Terms for Library
        $allTerms = Term::orderBy('sort_order')->get();

        return Inertia::render('Contracts/Create', [
            'customer'     => $customer,
            'contacts'     => $customer->contacts,
            'storageItems' => $storageItems,
            'nextSerial'   => $nextSerial,
            'seasonTerms'  => $seasonTerms,
            'allTerms'     => $allTerms,
            'defaults'     => $defaults,
            'settings'     => $globalSettings,
        ]);
    }

    public function show($id)
    {
        $contract = Contract::with([
            'customer.category', 
            'customer.country', 
            'customer.contacts',
            'contact', 
            'items.storageItem', 
            'terms', 
            'payments',
            'periods',
            'contractAgents.contact',
            'invoices'
        ])->findOrFail($id);

        // Auto-create first period for legacy contracts
        if ($contract->periods->isEmpty()) {
            $contract->periods()->create([
                'period_number' => 1,
                'start_date' => $contract->start_date,
                'end_date' => $contract->end_date ?? Carbon::parse($contract->start_date)->addMonths($contract->mandatory_period),
                'status' => 'active',
                'notes' => 'الفترة الإلزامية الأولى (تلقائي)'
            ]);
            $contract->load('periods');
        }

        // Auto-create contract agent for legacy contracts if contact_id exists
        if ($contract->contractAgents->isEmpty() && $contract->contact_id) {
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
                $contract->load('contractAgents.contact');
            }
        }

        $settings = ContractSetting::pluck('value', 'key')->all();

        return Inertia::render('Contracts/Show', compact('contract', 'settings'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'      => 'required|exists:customers,id',
            'contract_number'  => 'required|string|unique:contracts,contract_number',
            'write_date'       => 'required|date',
            'write_date_hijri' => 'nullable|string',
            'start_date'       => 'required|date|after_or_equal:write_date',
            'start_date_hijri' => 'nullable|string',
            'mandatory_period' => 'required|integer|min:1|max:12',
            'renewal_period'   => 'required|integer|min:0',
            'contact_id'       => 'nullable|exists:contacts,id',
            'discount'         => 'nullable|numeric|min:0',
            'status'           => 'required|in:draft,active',
            'items'            => 'required|array|min:1',
            'items.*.storage_item_id' => 'required|exists:storage_items,id',
            'items.*.unit_count'      => 'required|integer|min:1',
            'items.*.monthly_rent'    => 'required|numeric|min:0',
            'items.*.discount'        => 'nullable|numeric|min:0',
            'introduction'     => 'nullable|string',
            'preamble'         => 'nullable|string',
            'term_ids'         => 'nullable|array',
            'term_ids.*'       => 'nullable',
            'payments'         => 'nullable|array',
            'payments.*.amount'       => 'required|numeric|min:0.01',
            'payments.*.payment_date' => 'required|date',
            'payments.*.method'       => 'required|in:cash,bank_transfer,cheque',
            'payments.*.reference'    => 'nullable|string',
            'payments.*.notes'        => 'nullable|string',
        ], [
            'start_date.after_or_equal' => 'تاريخ بداية العقد لا يمكن أن يكون قبل تاريخ الكتابة.',
            'mandatory_period.min'      => 'الفترة الإلزامية يجب أن تكون شهر على الأقل.',
            'mandatory_period.max'      => 'الفترة الإلزامية لا تتجاوز 12 شهراً.',
            'renewal_period.min'        => 'فترة التجديد لا يمكن أن تكون سالبة.',
        ]);

        // create contract
        $contract = Contract::create([
            'customer_id'      => $validated['customer_id'],
            'contact_id'       => $validated['contact_id'] ?? null,
            'contract_number'  => $validated['contract_number'],
            'contract_date'    => $validated['write_date'], // alias for consistency
            'write_date'       => $validated['write_date'],
            'write_date_hijri' => $validated['write_date_hijri'] ?? null,
            'start_date'       => $validated['start_date'],
            'start_date_hijri' => $validated['start_date_hijri'] ?? null,
            'mandatory_period' => $validated['mandatory_period'],
            'renewal_period'   => $validated['renewal_period'],
            'discount'         => $validated['discount'] ?? 0,
            'vat_rate'         => 15,
            'status'           => $validated['status'],
            'introduction'     => $validated['introduction'] ?? null,
            'preamble'         => $validated['preamble'] ?? null,
        ]);

        // items
        foreach ($validated['items'] as $item) {
            // New Calculation Rule: (unit_count * mandatory_period * monthly_rent_inclusive_of_vat) - discount_amount
            $total_inclusive = ($item['unit_count'] * $validated['mandatory_period'] * $item['monthly_rent']) - ($item['discount'] ?? 0);
            $total_before_vat = $total_inclusive / 1.15;

            $contract->items()->create([
                'storage_item_id'     => $item['storage_item_id'],
                'unit_count'          => $item['unit_count'],
                'monthly_rent'        => $item['monthly_rent'],
                'discount'            => $item['discount'] ?? 0,
                'vat_rate'            => 15,
                'subtotal_before_vat' => round($total_before_vat, 2),
                'subtotal'            => round($total_inclusive, 2),
            ]);
        }

        // terms — preserve sort_order from the submitted order
        if (!empty($validated['term_ids'])) {
            $pivot = [];
            $sortIndex = 0;
            foreach ($validated['term_ids'] as $id) {
                if (is_string($id) && str_starts_with($id, 'custom_')) {
                    $text = substr($id, 7);
                    $newTerm = Term::create(['text_ar' => $text, 'is_active' => true]);
                    $id = $newTerm->id;
                }
                $pivot[$id] = ['sort_order' => $sortIndex++];
            }
            $contract->terms()->sync($pivot);
        }

        // payments
        if (!empty($validated['payments'])) {
            foreach ($validated['payments'] as $payment) {
                $contract->payments()->create($payment);
            }
        }

        return redirect()->route('customers.show', $validated['customer_id'])
            ->with('success', "تم إنشاء العقد {$contract->contract_number} بنجاح.");
    }

    private function nextSerial(): string
    {
        $last = Contract::latest('id')->first();
        $seq  = $last ? ((int) substr($last->contract_number, 5)) + 1 : 1;
        return '10015' . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    public function activate(Request $request, Contract $contract)
    {
        $contract->update(['status' => 'active']);
        Artisan::call('contracts:activate');
        return back()->with('success', 'تم تنشيط العقد بنجاح.');
    }

    public function suspend(Request $request, Contract $contract)
    {
        $contract->update(['status' => 'suspended']);
        return back()->with('success', 'تم إيقاف العقد بنجاح.');
    }

    public function endContract(Request $request, Contract $contract)
    {
        $contract->update(['status' => 'ended']);
        return back()->with('success', 'تم إنهاء العقد بنجاح.');
    }

    public function cancelContract(Request $request, Contract $contract)
    {
        $contract->update(['status' => 'cancelled']);
        return back()->with('success', 'تم إلغاء العقد بنجاح.');
    }

    public function destroy(Contract $contract)
    {
        $customerId = $contract->customer_id;
        $contract->delete();
        return redirect()->route('customers.show', $customerId)->with('success', 'تم حذف العقد بنجاح.');
    }

    public function addPeriod(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'duration_months' => 'required|integer|min:1',
            'notes' => 'nullable|string'
        ]);

        $currentEnd = $contract->end_date ? Carbon::parse($contract->end_date) : Carbon::parse($contract->start_date)->addMonths($contract->mandatory_period);
        $newStart = $currentEnd->copy()->addDay();
        $newEnd = $newStart->copy()->addMonths($validated['duration_months'])->subDay();

        $nextPeriodNum = $contract->periods()->count() + 1;

        $contract->periods()->create([
            'period_number' => $nextPeriodNum,
            'start_date' => $newStart,
            'end_date' => $newEnd,
            'status' => 'active',
            'notes' => $validated['notes']
        ]);

        $contract->update(['end_date' => $newEnd]);

        return back()->with('success', 'تم تمديد العقد وإضافة فترة جديدة بنجاح.');
    }

    public function addContact(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'contact_id' => 'required|exists:contacts,id'
        ]);

        $contact = Contact::findOrFail($validated['contact_id']);

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

        return back()->with('success', 'تم إضافة المندوب إلى العقد بنجاح.');
    }

    public function updateContactStatus(Request $request, Contract $contract, $contractAgentId)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,suspended,deleted',
            'status_reason' => 'required_if:status,suspended,deleted|nullable|string'
        ]);

        $agent = $contract->contractAgents()->findOrFail($contractAgentId);
        $agent->status = $validated['status'];
        $agent->status_reason = $validated['status_reason'] ?? null;
        if ($validated['status'] === 'deleted') {
            $agent->deleted_at_custom = now();
        }
        $agent->save();

        $msg = $validated['status'] === 'deleted' ? 'تم إزالة المندوب من العقد.' : 'تم تحديث حالة المندوب.';
        return back()->with('success', $msg);
    }

    public function storeInvoice(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|unique:contract_invoices,invoice_number',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        $contract->invoices()->create($validated);

        return back()->with('success', 'تم إصدار الفاتورة بنجاح.');
    }

    public function storePayment(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method' => 'required|in:cash,bank_transfer,cheque',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'invoice_id' => 'nullable|exists:contract_invoices,id'
        ]);

        $payment = $contract->payments()->create([
            'amount' => $validated['amount'],
            'payment_date' => $validated['payment_date'],
            'method' => $validated['method'],
            'reference' => $validated['reference'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['invoice_id'])) {
            $invoice = $contract->invoices()->find($validated['invoice_id']);
            if ($invoice) {
                $invoice->paid_amount += $validated['amount'];
                if ($invoice->paid_amount >= $invoice->amount) {
                    $invoice->status = 'paid';
                } elseif ($invoice->paid_amount > 0) {
                    $invoice->status = 'partially_paid';
                }
                $invoice->save();
            }
        }

        return back()->with('success', 'تم تسجيل الدفعة النقدية بنجاح.');
    }
}
