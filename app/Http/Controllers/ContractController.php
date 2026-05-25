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
use App\Http\Requests\ContractStoreRequest;
use App\Services\ContractService;

class ContractController extends Controller
{
    protected $contractService;

    public function __construct(ContractService $contractService)
    {
        $this->contractService = $contractService;
    }

    public function index(Request $request)
    {
        $query = Contract::query()->with(['customer', 'items.storageItem']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('contract_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cQuery) use ($search) {
                      $cQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $contracts = $query->latest()->paginate(10)->withQueryString();

        // Calculate KPIs
        $totalContracts = Contract::count();
        $activeContracts = Contract::where('status', 'active')->count();
        $endingContracts = Contract::where('status', 'active')
            ->whereNotNull('end_date')
            ->where('end_date', '<=', now()->addDays(30))
            ->count();
        
        $totalValue = \App\Models\ContractItem::sum('subtotal');

        $stats = [
            'total' => $totalContracts,
            'active' => $activeContracts,
            'ending' => $endingContracts,
            'value' => number_format((float) $totalValue, 2) . ' ' . (app()->getLocale() === 'ar' ? 'ر.س' : 'SAR'),
        ];

        return Inertia::render('Contracts/Index', [
            'contracts' => $contracts,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
            'translations' => __('contracts'),
        ]);
    }

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

    public function store(ContractStoreRequest $request)
    {
        try {
            $contract = $this->contractService->storeContract($request->validated());

            return redirect()->route('customers.show', $contract->customer_id)
                ->with('success', __('contracts.messages.store_success', ['number' => $contract->contract_number]));
        } catch (\Exception $e) {
            return back()->with('error', __('contracts.messages.store_error') . ': ' . $e->getMessage());
        }
    }

    private function nextSerial(): string
    {
        $last = Contract::latest('id')->first();
        $seq  = $last ? ((int) substr($last->contract_number, 5)) + 1 : 1;
        return '10015' . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }

    public function activate(Request $request, Contract $contract)
    {
        $this->contractService->changeStatus($contract, 'active');
        Artisan::call('contracts:activate');
        return back()->with('success', __('contracts.messages.activate_success'));
    }

    public function suspend(Request $request, Contract $contract)
    {
        $this->contractService->changeStatus($contract, 'suspended');
        return back()->with('success', __('contracts.messages.suspend_success'));
    }

    public function endContract(Request $request, Contract $contract)
    {
        $this->contractService->changeStatus($contract, 'ended');
        return back()->with('success', __('contracts.messages.end_success'));
    }

    public function cancelContract(Request $request, Contract $contract)
    {
        $this->contractService->changeStatus($contract, 'cancelled');
        return back()->with('success', __('contracts.messages.cancel_success'));
    }

    public function destroy(Contract $contract)
    {
        $customerId = $contract->customer_id;
        $contract->delete();
        return redirect()->route('customers.show', $customerId)->with('success', __('contracts.messages.destroy_success'));
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
