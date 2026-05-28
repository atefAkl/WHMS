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
            $query->where(function ($q) use ($search) {
                $q->where('contract_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($cQuery) use ($search) {
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

        $currency = \App\Models\ContractSetting::where('key', 'app_currency')->value('value') ?? 'SAR';
        $currencySymbol = $currency === 'SAR' ? 'ر.س' : $currency;

        $stats = [
            'total'    => $totalContracts,
            'active'   => $activeContracts,
            'ending'   => $endingContracts,
            'value'    => (float) $totalValue,
            'currency' => app()->getLocale() === 'ar' ? $currencySymbol : $currency,
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
        $customer = Customer::with(['country', 'category.parent', 'contacts'])->findOrFail($request->customer_id);
        $storageItems = StorageItem::where('is_active', true)->get();
        
        // 2. Get Active Season Defaults (Priority)
        $activeSeason = Season::with(['blocks'])->where('is_active', true)->first();
        
        $nextSerial = $this->nextSerial($activeSeason ? $activeSeason->id : null);

        // 1. Get Global Defaults
        $globalSettings = ContractSetting::pluck('value', 'key')->all();
        $seasonSettings = $activeSeason ? ContractSetting::where('season_id', $activeSeason->id)->pluck('value', 'key')->all() : [];

        $introBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'intro') : null;
        $preambleBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'preamble') : null;
        $titleBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'title') : null;
        $footerBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'footer') : null;

        $defaults = [
            'introduction'     => $introBlock ? ($introBlock->content['text'] ?? '') : ($globalSettings['default_introduction'] ?? ''),
            'preamble'         => $preambleBlock ? ($preambleBlock->content['text'] ?? '') : ($globalSettings['default_preamble'] ?? ''),
            'mandatory_period' => $activeSeason->mandatory_period ?? $globalSettings['default_mandatory_period'] ?? 12,
            'renewal_period'   => $activeSeason->renewal_period   ?? $globalSettings['default_renewal_period']   ?? 12,
            'contract_title'   => $titleBlock ? ($titleBlock->content['text'] ?? '') : ($seasonSettings['contract_title'] ?? $globalSettings['contract_title'] ?? ''),
            'footer'           => $footerBlock ? ($footerBlock->content['text'] ?? '') : ($seasonSettings['footer'] ?? $globalSettings['footer'] ?? ''),
            'season_id'        => $activeSeason ? $activeSeason->id : null,
        ];

        // 3. Get Season Terms (Pre-assigned)
        $seasonTerms = $activeSeason ? $activeSeason->terms()->orderBy('sort_order')->get() : collect();

        // 4. Get All Terms for Library (Only global terms)
        $allTerms = Term::whereNull('season_id')->whereNull('contract_id')->orderBy('sort_order')->get();

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
            'invoices',
            'blocks'
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
        $storageItems = StorageItem::where('is_active', true)->get();
        $allTerms = Term::orderBy('sort_order')->get();

        $centralConnection = config('tenancy.database.central_connection');
        $centralTableColumns = \DB::connection($centralConnection)->table('admin_settings')->where('key', 'admin_table_columns')->value('value');
        $tableColumns = $centralTableColumns ? json_decode($centralTableColumns, true) : [
            ["code" => "item_name", "label_ar" => "الصنف والمستودع", "label_en" => "Item & Warehouse", "default_visible" => true],
            ["code" => "qty", "label_ar" => "الكمية", "label_en" => "Qty", "default_visible" => true],
            ["code" => "rent", "label_ar" => "الإيجار الشهري", "label_en" => "Monthly Rent", "default_visible" => true],
            ["code" => "discount", "label_ar" => "الخصم", "label_en" => "Discount", "default_visible" => true],
            ["code" => "total", "label_ar" => "الإجمالي شامل الضريبة", "label_en" => "Total with VAT", "default_visible" => true]
        ];

        return Inertia::render('Contracts/Show', [
            ...compact('contract', 'settings', 'storageItems', 'allTerms', 'tableColumns'),
            'translations' => __('contracts'),
        ]);
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

    private function nextSerial($seasonId = null): string
    {
        $season = $seasonId ? Season::find($seasonId) : Season::where('is_active', true)->first();
        if ($season && $season->code) {
            $prefix = $season->code . '14';
            $last = Contract::where('contract_number', 'like', $prefix . '%')
                ->orderBy('contract_number', 'desc')
                ->first();
            $seq = 1;
            if ($last) {
                $seq = ((int) substr($last->contract_number, strlen($prefix))) + 1;
            }
            return $prefix . str_pad($seq, 5, '0', STR_PAD_LEFT);
        }

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

    public function update(Request $request, Contract $contract)
    {
        if ($contract->status !== 'draft') {
            return back()->with('error', app()->getLocale() === 'ar' ? 'لا يمكن تعديل العقد بعد تنشيطه أو اعتماده.' : 'Cannot edit the contract after it is activated or approved.');
        }

        $validated = $request->validate([
            'write_date' => 'sometimes|required|date',
            'write_date_hijri' => 'sometimes|nullable|string',
            'start_date' => 'sometimes|required|date',
            'start_date_hijri' => 'sometimes|nullable|string',
            'mandatory_period' => 'sometimes|required|integer|min:1|max:12',
            'renewal_period' => 'sometimes|required|integer|min:0',
            'introduction' => 'sometimes|nullable|string',
            'preamble' => 'sometimes|nullable|string',
            'contract_title' => 'sometimes|nullable|string',
            'footer' => 'sometimes|nullable|string',
            'season_id' => 'sometimes|nullable|exists:seasons,id',
            'contact_id' => 'sometimes|nullable|exists:contacts,id',
            'items' => 'sometimes|array',
            'items.*.storage_item_id' => 'required|exists:storage_items,id',
            'items.*.unit_count' => 'required|integer|min:1',
            'items.*.monthly_rent' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'term_ids' => 'sometimes|array',
            'term_ids.*' => 'nullable',
        ]);

        \DB::transaction(function () use ($contract, $validated) {
            // Update contract fields
            $contractFields = array_intersect_key($validated, array_flip([
                'write_date',
                'write_date_hijri',
                'start_date',
                'start_date_hijri',
                'mandatory_period',
                'renewal_period',
                'introduction',
                'preamble',
                'contract_title',
                'footer',
                'season_id',
                'contact_id'
            ]));

            if (isset($contractFields['write_date'])) {
                $contractFields['contract_date'] = $contractFields['write_date'];
            }

            $contract->update($contractFields);

            // Update contract blocks text based on updated contract fields
            foreach (['intro' => 'introduction', 'preamble' => 'preamble', 'title' => 'contract_title', 'footer' => 'footer'] as $key => $field) {
                if (array_key_exists($field, $contractFields)) {
                    $block = $contract->blocks()->where('key', $key)->first();
                    if ($block) {
                        $content = $block->content ?? [];
                        $content['text'] = $contractFields[$field] ?? '';
                        $block->update(['content' => $content]);
                    }
                }
            }

            // Recalculate end_date if start_date or mandatory_period changed
            if (isset($validated['start_date']) || isset($validated['mandatory_period'])) {
                $startDate = $contract->start_date;
                $mandatoryPeriod = $contract->mandatory_period;
                $contract->end_date = \Carbon\Carbon::parse($startDate)->addMonths($mandatoryPeriod);
                $contract->save();

                // Update the first period start/end date if it exists
                $firstPeriod = $contract->periods()->where('period_number', 1)->first();
                if ($firstPeriod) {
                    $firstPeriod->update([
                        'start_date' => $startDate,
                        'end_date' => $contract->end_date,
                    ]);
                }
            }

            // Update storage items if provided
            if (isset($validated['items'])) {
                $contract->items()->delete();

                foreach ($validated['items'] as $item) {
                    $total_inclusive = ($item['unit_count'] * $contract->mandatory_period * $item['monthly_rent']) - ($item['discount'] ?? 0);
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
            }

            // Update terms if provided
            if (isset($validated['term_ids'])) {
                $newTermsData = [];
                $sortIndex = 0;
                foreach ($validated['term_ids'] as $id) {
                    if (empty($id)) continue;
                    
                    if (is_string($id) && str_starts_with($id, 'custom_')) {
                        $newTermsData[] = [
                            'contract_id' => $contract->id,
                            'parent_id' => null,
                            'text_ar' => substr($id, 7),
                            'text_en' => null,
                            'is_active' => true,
                            'has_variables' => str_contains($id, '{$'),
                            'sort_order' => $sortIndex++,
                        ];
                    } else {
                        $t = Term::find($id);
                        if ($t) {
                            // If it's already a contract term for this contract, reuse its parent_id and texts
                            if ($t->contract_id == $contract->id) {
                                $newTermsData[] = [
                                    'contract_id' => $contract->id,
                                    'parent_id' => $t->parent_id,
                                    'text_ar' => $t->text_ar,
                                    'text_en' => $t->text_en,
                                    'is_active' => $t->is_active,
                                    'has_variables' => $t->has_variables,
                                    'sort_order' => $sortIndex++,
                                ];
                            } else {
                                // If it's a global or season term, its ID is the parent_id
                                $newTermsData[] = [
                                    'contract_id' => $contract->id,
                                    'parent_id' => $t->id,
                                    'text_ar' => $t->text_ar,
                                    'text_en' => $t->text_en,
                                    'is_active' => $t->is_active,
                                    'has_variables' => $t->has_variables,
                                    'sort_order' => $sortIndex++,
                                ];
                            }
                        }
                    }
                }

                // Delete old terms and insert new ones
                $contract->terms()->delete();
                foreach ($newTermsData as $termData) {
                    Term::create($termData);
                }
            }

            // Update primary contract agent if contact_id changed
            if (isset($validated['contact_id'])) {
                $contact = Contact::find($validated['contact_id']);
                if ($contact) {
                    $agent = $contract->contractAgents()->where('contact_id', $contact->id)->first();
                    if (!$agent) {
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
            }
        });

        return back()->with('success', app()->getLocale() === 'ar' ? 'تم تحديث العقد بنجاح.' : 'Contract updated successfully.');
    }
}
