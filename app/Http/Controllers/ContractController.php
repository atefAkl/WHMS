<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Term;
use Carbon\Carbon;

use App\Models\Season;
use App\Models\StorageItem;
use App\Models\ContractSetting;
use App\Models\Contact;
use App\Models\ContractPeriod;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\ContractStoreRequest;
use App\Services\ContractService;
use App\Traits\ValidatesSecureDeletion;

class ContractController extends Controller
{
    use ValidatesSecureDeletion;

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
        $contractType = $request->input('contract_type', Contract::TYPE_MANAGED);

        $introBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'intro') : null;
        $preambleBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'preamble') : null;
        $titleBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'title') : null;
        $footerBlock = $activeSeason ? $activeSeason->blocks->firstWhere('key', 'footer') : null;

        $typeDefaults = [];
        foreach (Contract::types() as $type) {
            $typeDefaults[$type] = [
                'contract_type' => $type,
                'introduction' => $introBlock ? ($introBlock->content['text'] ?? '') : $this->getSettingByType($globalSettings, 'default_introduction', $type, ''),
                'preamble' => $preambleBlock ? ($preambleBlock->content['text'] ?? '') : $this->getSettingByType($globalSettings, 'default_preamble', $type, ''),
                'mandatory_period' => $activeSeason->mandatory_period ?? $this->getSettingByType($globalSettings, 'default_mandatory_period', $type, 12),
                'renewal_period' => $activeSeason->renewal_period ?? $this->getSettingByType($globalSettings, 'default_renewal_period', $type, 12),
                'contract_title' => $titleBlock ? ($titleBlock->content['text'] ?? '') : $this->getSettingByType($seasonSettings + $globalSettings, 'contract_title', $type, ''),
                'footer' => $footerBlock ? ($footerBlock->content['text'] ?? '') : $this->getSettingByType($seasonSettings + $globalSettings, 'footer', $type, ''),
                'unified_contract_template' => $this->resolveUnifiedTemplate($globalSettings, $type),
                'season_id' => $activeSeason ? $activeSeason->id : null,
            ];
        }

        $defaults = $typeDefaults[$contractType] ?? $typeDefaults[Contract::TYPE_MANAGED];

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
            'typeDefaults' => $typeDefaults,
            'settings'     => $globalSettings,
            'contractTypes' => Contract::types(),
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
            'payments.period',
            'payments.invoice',
            'vouchers.primaryAccount',
            'vouchers.counterAccount',
            'periods.items.storageItem',
            'contractAgents.contact',
            'invoices.period',
            'blocks'
        ])->findOrFail($id);

        // Auto-create first period for legacy contracts
        if ($contract->periods->isEmpty()) {
            $contract->ensureMandatoryPeriod();
            $contract->load('periods.items.storageItem');
        }

        $contract->load('items');
        $contract->syncFirstPeriodItems();
        $contract->load('periods.items.storageItem');

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
        $accounts = \App\Models\Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();

        $centralConnection = config('tenancy.database.central_connection');
        $centralTableColumns = DB::connection($centralConnection)->table('admin_settings')->where('key', 'admin_table_columns')->value('value');
        $tableColumns = $centralTableColumns ? json_decode($centralTableColumns, true) : [
            ["code" => "item_name", "label_ar" => "الصنف والمستودع", "label_en" => "Item & Warehouse", "default_visible" => true],
            ["code" => "qty", "label_ar" => "الكمية", "label_en" => "Qty", "default_visible" => true],
            ["code" => "rent", "label_ar" => "الإيجار الشهري", "label_en" => "Monthly Rent", "default_visible" => true],
            ["code" => "discount", "label_ar" => "الخصم", "label_en" => "Discount", "default_visible" => true],
            ["code" => "total", "label_ar" => "الإجمالي شامل الضريبة", "label_en" => "Total with VAT", "default_visible" => true]
        ];

        return Inertia::render('Contracts/Show', [
            ...compact('contract', 'settings', 'storageItems', 'allTerms', 'tableColumns', 'accounts'),
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

    private function getSettingByType(array $settings, string $baseKey, string $type, mixed $fallback = ''): mixed
    {
        $typedKey = $type . '_' . $baseKey;

        return $settings[$typedKey] ?? $settings[$baseKey] ?? $fallback;
    }

    private function resolveUnifiedTemplate(array $settings, string $type): string
    {
        $template = $this->getSettingByType($settings, 'unified_contract_template', $type, '');

        if (!empty($template)) {
            return $template;
        }

        $defaultIntro = $this->getSettingByType(
            $settings,
            'default_introduction',
            $type,
            "بعون الله وتوفيقه، في يوم {\$write_date} م، الموافق {\$write_date_hijri} هـ ، قد اجتمع كل من:-"
        );
        $defaultPreamble = $this->getSettingByType(
            $settings,
            'default_preamble',
            $type,
            "حيث أن الطرف الأول لديه مخازن تبريد وتجميد ويعمل في مجال التخزين بخدماته، ومرخص له بمزاولة النشاط بموجب الترخيص رقم ({\$company_license}) وحيث أن الطرف الثاني يرغب في استئجار طبالي لدى الطرف الأول، فقد اتفقا وهما بكامل أهليتهما الشرعية المعتبرة للتوقيع على هذا العقد فيما يلي:-"
        );

        return $defaultIntro . "\n\n" . $defaultPreamble . "\n\n[ITEMS_TABLE]\n\n" . "بند الشروط والأحكام:\nيلتزم الطرف الثاني بكافة الشروط المحددة.";
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

    public function destroy(Request $request, Contract $contract)
    {
        $this->validateSecureDelete($request);
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

        $durationMonths = (int) $validated['duration_months'];

        $lastPeriod = $contract->periods()->with('items')->orderByDesc('period_number')->first();
        if (!$lastPeriod) {
            $contract->ensureMandatoryPeriod();
            $contract->syncFirstPeriodItems();
            $lastPeriod = $contract->periods()->with('items')->orderByDesc('period_number')->first();
        }

        $currentEnd = Carbon::parse($lastPeriod->end_date);
        $newStart = $currentEnd->copy()->addDay();
        $newEnd = $newStart->copy()->addMonths($durationMonths)->subDay();

        $nextPeriodNum = (int) $contract->periods()->max('period_number') + 1;

        $contract->periods()->where('status', 'active')->update(['status' => 'expired']);

        $newPeriod = $contract->periods()->create([
            'period_number' => $nextPeriodNum,
            'start_date' => $newStart,
            'end_date' => $newEnd,
            'status' => 'active',
            'notes' => $validated['notes']
        ]);

        foreach ($lastPeriod->items as $item) {
            $newPeriod->items()->create([
                'storage_item_id' => $item->storage_item_id,
                'unit_count' => $item->unit_count,
                'monthly_rent' => $item->monthly_rent,
                'discount' => $item->discount,
                'vat_rate' => $item->vat_rate,
            ]);
        }

        $contract->update(['end_date' => $newEnd]);

        return back()->with('success', 'تم تمديد العقد وإضافة فترة جديدة بنجاح.');
    }

    public function updatePeriod(Request $request, Contract $contract, ContractPeriod $period)
    {
        if ($period->contract_id !== $contract->id) {
            abort(404);
        }

        if ($period->period_number !== (int) $contract->periods()->max('period_number')) {
            return back()->with('error', 'يمكن تعديل مدة آخر فترة فقط للحفاظ على التسلسل الزمني.');
        }

        $validated = $request->validate([
            'duration_months' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $durationMonths = (int) $validated['duration_months'];

        $newEnd = Carbon::parse($period->start_date)
            ->addMonths($durationMonths)
            ->subDay();

        $period->update([
            'end_date' => $newEnd,
            'notes' => $validated['notes'] ?? $period->notes,
        ]);

        if ($period->is($contract->periods()->orderByDesc('period_number')->first())) {
            $contract->update(['end_date' => $newEnd]);
        }

        return back()->with('success', 'تم تحديث بيانات الفترة بنجاح.');
    }

    public function updatePeriodItems(Request $request, Contract $contract, ContractPeriod $period)
    {
        if ($period->contract_id !== $contract->id) {
            abort(404);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:contract_period_items,id',
            'items.*.unit_count' => 'required|integer|min:0',
        ]);

        $periodItems = $period->items()->get()->keyBy('id');

        foreach ($validated['items'] as $itemPayload) {
            $periodItem = $periodItems->get((int) $itemPayload['id']);
            if (!$periodItem) {
                return back()->withErrors(['items' => 'تم العثور على عنصر غير تابع للفترة المحددة.']);
            }

            if ((int) $itemPayload['unit_count'] < (int) $periodItem->unit_count) {
                return back()->withErrors(['items' => 'يمكن تعديل أصناف الفترة بالزيادة فقط.']);
            }

            $periodItem->update([
                'unit_count' => (int) $itemPayload['unit_count'],
            ]);
        }

        return back()->with('success', 'تم تحديث أصناف الفترة بنجاح.');
    }

    public function updatePeriodStatus(Request $request, Contract $contract, ContractPeriod $period)
    {
        if ($period->contract_id !== $contract->id) {
            abort(404);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,suspended,expired',
            'status_reason' => 'nullable|string',
            'remaining_period_action' => 'nullable|in:keep_remaining,end_contract,review_manually',
            'terminate_contract' => 'nullable|boolean',
            'notify_customer' => 'nullable|boolean',
        ]);

        if ($validated['status'] === 'suspended') {
            $request->validate([
                'status_reason' => 'required|string',
                'remaining_period_action' => 'required|in:keep_remaining,end_contract,review_manually',
            ]);
        }

        if ($validated['status'] === 'active') {
            $contract->periods()->where('id', '!=', $period->id)->where('status', 'active')->update(['status' => 'expired']);
            $contract->update(['status' => 'active']);
        }

        if ($validated['status'] === 'suspended' && $period->status === 'active') {
            $contract->update([
                'status' => !empty($validated['terminate_contract']) || ($validated['remaining_period_action'] ?? null) === 'end_contract'
                    ? 'ended'
                    : 'suspended',
            ]);
        }

        $period->update([
            'status' => $validated['status'],
            'status_reason' => $validated['status'] === 'suspended' ? ($validated['status_reason'] ?? null) : null,
            'remaining_period_action' => $validated['status'] === 'suspended' ? ($validated['remaining_period_action'] ?? null) : null,
            'terminate_contract' => $validated['status'] === 'suspended' ? (bool) ($validated['terminate_contract'] ?? false) : false,
            'notify_customer' => $validated['status'] === 'suspended' ? (bool) ($validated['notify_customer'] ?? false) : false,
        ]);

        return back()->with('success', 'تم تحديث حالة الفترة بنجاح.');
    }

    public function destroyPeriod(Request $request, Contract $contract, ContractPeriod $period)
    {
        $this->validateSecureDelete($request);
        if ($period->contract_id !== $contract->id) {
            abort(404);
        }

        $lastPeriodId = $contract->periods()->orderByDesc('period_number')->value('id');
        if ($period->id !== $lastPeriodId) {
            return back()->with('error', 'يمكن حذف آخر فترة فقط.');
        }

        if ($period->status === 'active') {
            return back()->with('error', 'لا يمكن حذف فترة نشطة.');
        }

        if (
            $period->receptions()->exists() ||
            $period->deliveries()->exists() ||
            $period->exitAuthorizations()->exists() ||
            $period->invoices()->exists() ||
            $period->payments()->exists()
        ) {
            return back()->with('error', 'لا يمكن حذف فترة مرتبطة بسجلات تشغيلية أو مالية.');
        }

        $period->delete();

        $latestRemainingPeriod = $contract->periods()->orderByDesc('period_number')->first();
        if ($latestRemainingPeriod) {
            $contract->update(['end_date' => $latestRemainingPeriod->end_date]);
        }

        return back()->with('success', 'تم حذف الفترة بنجاح.');
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
            'period_id' => 'required|exists:contract_periods,id',
            'invoice_number' => 'required|string|unique:sales_invoices,invoice_number',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        $period = $contract->periods()->find($validated['period_id']);
        if (!$period) {
            return back()->withErrors(['period_id' => 'الفترة المختارة لا تتبع هذا العقد.']);
        }

        $contract->invoices()->create($validated);

        return back()->with('success', 'تم إصدار الفاتورة بنجاح.');
    }
    public function storeInvoiceFromPeriod(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'period_id' => 'required|exists:contract_periods,id',
            'invoice_number' => 'nullable|string|unique:sales_invoices,invoice_number',
            'date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        \DB::beginTransaction();
        try {
            $period = \App\Models\ContractPeriod::findOrFail($validated['period_id']);
            $date = $validated['date'] ?? now()->format('Y-m-d');

            $year = \Carbon\Carbon::parse($date)->format('y');
            $month = \Carbon\Carbon::parse($date)->format('m');
            
            $lastInvoice = \App\Models\SalesInvoice::whereMonth('date', $month)
                ->whereYear('date', \Carbon\Carbon::parse($date)->format('Y'))
                ->orderBy('id', 'desc')
                ->first();
            
            $serial = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -4)) + 1 : 1;
            $refNumber = $validated['invoice_number'] ?? ("INV-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT));

            // Calculate subtotal from contract items (or period items if they exist)
            $subtotal = $contract->items->sum(function ($item) {
                return $item->price * $item->quantity;
            }) ?: 0;
            
            $taxRate = 15;
            $taxAmount = $subtotal * ($taxRate / 100);

            $invoice = \App\Models\SalesInvoice::create([
                'invoice_number' => $refNumber,
                'customer_id' => $contract->customer_id,
                'contract_id' => $contract->id,
                'period_id' => $period->id,
                'date' => $validated['date'],
                'due_date' => clone \Carbon\Carbon::parse($validated['date'])->addDays(30),
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $subtotal + $taxAmount,
                'status' => 'draft',
                'created_by' => auth()->id(),
            ]);

            \App\Models\SalesInvoiceLine::create([
                'sales_invoice_id' => $invoice->id,
                'description' => $validated['description'],
                'account_id' => $validated['revenue_account_id'],
                'quantity' => 1,
                'unit_price' => $subtotal,
                'subtotal' => $subtotal,
                'tax_rate' => $validated['tax_rate'],
                'tax_amount' => $taxAmount,
                'total' => $subtotal + $taxAmount,
            ]);

            \DB::commit();
            return redirect()->back()->with('success', 'تم إصدار الفاتورة بنجاح كمسودة');
        } catch (\Exception $e) {
            \DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء إصدار الفاتورة: ' . $e->getMessage());
        }
    }
    public function storePayment(Request $request, Contract $contract)
    {
        $validated = $request->validate([
            'period_id' => 'nullable|exists:contract_periods,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method' => 'required|in:cash,bank_transfer,cheque',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'invoice_id' => 'nullable|exists:sales_invoices,id',
            'primary_account_id' => 'required|exists:accounts,id',
        ]);

        $period = null;
        if (!empty($validated['period_id'])) {
            $period = $contract->periods()->find($validated['period_id']);
            if (!$period) {
                return back()->withErrors(['period_id' => 'الفترة المحددة غير صالحة.']);
            }
        }

        $invoice = null;
        if (!empty($validated['invoice_id'])) {
            // Can pay invoices for this contract (not just this period)
            $invoice = $contract->invoices()
                ->find($validated['invoice_id']);

            if (!$invoice) {
                return back()->withErrors(['invoice_id' => 'الفاتورة المحددة غير صالحة.']);
            }
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Counterpart account logic: Revenue if invoice selected, else Customer.
            $customerAccount = \App\Models\Account::where('type', 'asset')->where('name', 'like', '%عملاء%')->first() 
                ?? \App\Models\Account::where('is_transactional', true)->first();
            $revenueAccount = \App\Models\Account::where('type', 'revenue')->first();
            
            $counterAccountId = ($invoice && $revenueAccount) ? $revenueAccount->id : ($customerAccount ? $customerAccount->id : null);

            // Generate Voucher Number
            $year = \Carbon\Carbon::parse($validated['payment_date'])->format('y');
            $month = \Carbon\Carbon::parse($validated['payment_date'])->format('m');
            $lastVoucher = \App\Models\FinancialVoucher::where('type', 'receipt')
                ->whereMonth('date', $month)
                ->whereYear('date', \Carbon\Carbon::parse($validated['payment_date'])->format('Y'))
                ->orderBy('id', 'desc')
                ->first();
            $serial = $lastVoucher ? intval(substr($lastVoucher->voucher_number, -4)) + 1 : 1;
            $refNumber = "RV-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT);

            $description = $validated['notes'] ?: "دفعة من العميل لعقد رقم {$contract->contract_number}";
            if ($invoice) {
                $description .= " - سداد فاتورة رقم {$invoice->invoice_number}";
            }

            $voucher = \App\Models\FinancialVoucher::create([
                'voucher_number' => $refNumber,
                'type' => 'receipt',
                'date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'primary_account_id' => $validated['primary_account_id'],
                'counter_account_id' => $counterAccountId,
                'reference' => $validated['reference'] ?? null,
                'description' => $description,
                'status' => 'draft',
                'contract_id' => $contract->id,
                'customer_id' => $contract->customer_id,
                'created_by' => auth()->id(),
            ]);

            if ($invoice || $period) {
                \App\Models\ContractPayment::create([
                    'contract_id' => $contract->id,
                    'period_id' => $period ? $period->id : ($invoice ? $invoice->period_id : null),
                    'invoice_id' => $invoice ? $invoice->id : null,
                    'voucher_id' => $voucher->id,
                    'amount' => $validated['amount'],
                    'payment_date' => $validated['payment_date'],
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();

            return redirect()->back()->with('success', 'تم تسجيل الدفعة بنجاح.');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء التسجيل: ' . $e->getMessage());
        }
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

        DB::transaction(function () use ($contract, $validated) {
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

                $contract->load('items');
                $contract->syncFirstPeriodItems();
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

    public function getVouchers(Request $request, Contract $contract)
    {
        $activeSeasonId = session('active_season_id');

        $receptionsQuery = \App\Models\Reception::query()
            ->where('contract_id', $contract->id)
            ->with(['period', 'inventoryEntries.pallet', 'inventoryEntries.inventoryItem', 'inventoryEntries.variant']);

        $deliveriesQuery = \App\Models\Delivery::query()
            ->where('contract_id', $contract->id)
            ->with(['period', 'inventoryEntries.pallet', 'inventoryEntries.inventoryItem', 'inventoryEntries.variant']);

        // Filters:
        // 1. Search serial
        if ($request->filled('search_serial')) {
            $serial = $request->input('search_serial');
            $receptionsQuery->where('serial_number', 'like', "%{$serial}%");
            $deliveriesQuery->where('serial_number', 'like', "%{$serial}%");
        }

        // 2. Billing Period
        if ($request->filled('period_id')) {
            $periodId = $request->input('period_id');
            $receptionsQuery->where('period_id', $periodId);
            $deliveriesQuery->where('period_id', $periodId);
        }

        // 3. Date range
        if ($request->filled('start_date')) {
            $startDate = Carbon::parse($request->input('start_date'))->startOfDay();
            $receptionsQuery->where('reception_date', '>=', $startDate);
            $deliveriesQuery->where('delivery_date', '>=', $startDate);
        }
        if ($request->filled('end_date')) {
            $endDate = Carbon::parse($request->input('end_date'))->endOfDay();
            $receptionsQuery->where('reception_date', '<=', $endDate);
            $deliveriesQuery->where('delivery_date', '<=', $endDate);
        }

        // 4. Pallet Number
        if ($request->filled('search_pallet')) {
            $pallet = $request->input('search_pallet');
            $receptionsQuery->whereHas('inventoryEntries.pallet', function ($q) use ($pallet) {
                $q->where('pallet_number', 'like', "%{$pallet}%")
                    ->orWhere('pallet_code', 'like', "%{$pallet}%");
            });
            $deliveriesQuery->whereHas('inventoryEntries.pallet', function ($q) use ($pallet) {
                $q->where('pallet_number', 'like', "%{$pallet}%")
                    ->orWhere('pallet_code', 'like', "%{$pallet}%");
            });
        }

        // 5. Status
        if ($request->filled('status')) {
            $status = $request->input('status');
            $receptionsQuery->where('status', $status);
            $deliveriesQuery->where('status', $status);
        }

        // 6. Goods Type (Item)
        if ($request->filled('goods_type')) {
            $goodsType = $request->input('goods_type');
            $receptionsQuery->whereHas('inventoryEntries', function ($q) use ($goodsType) {
                $q->where('inventory_item_id', $goodsType);
            });
            $deliveriesQuery->whereHas('inventoryEntries', function ($q) use ($goodsType) {
                $q->where('inventory_item_id', $goodsType);
            });
        }

        // Fetch
        $vouchers = collect();

        $typeFilter = $request->input('type');
        if (empty($typeFilter) || $typeFilter === 'reception') {
            $receptions = $receptionsQuery->get()->map(function ($item) {
                $item->voucher_type = 'reception';
                $item->date = $item->reception_date;
                return $item;
            });
            $vouchers = $vouchers->concat($receptions);
        }

        if (empty($typeFilter) || $typeFilter === 'delivery') {
            $deliveries = $deliveriesQuery->get()->map(function ($item) {
                $item->voucher_type = 'delivery';
                $item->date = $item->delivery_date;
                return $item;
            });
            $vouchers = $vouchers->concat($deliveries);
        }

        // Sort descending by date
        $vouchers = $vouchers->sortByDesc('date')->values();

        // Calculate card content metrics dynamically
        foreach ($vouchers as $voucher) {
            $entries = $voucher->inventoryEntries;
            $voucher->pallet_count = $entries->pluck('pallet_id')->filter()->unique()->count();
            $voucher->item_count = $entries->pluck('inventory_item_id')->filter()->unique()->count();
            $voucher->variant_count = $entries->pluck('inventory_item_variant_id')->filter()->unique()->count();
            $voucher->package_count = $voucher->voucher_type === 'reception'
                ? (float) $entries->sum('quantity_in')
                : (float) $entries->sum('quantity_out');
        }

        // Goods types list for dropdown (distinct items)
        $goodsTypes = \App\Models\InventoryItem::whereHas('inventoryEntries', function ($q) use ($contract) {
            $q->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class], function ($query) use ($contract) {
                $query->where('contract_id', $contract->id);
            });
        })->get(['id', 'name']);

        // Paginate
        $perPage = 24;
        $page = (int) $request->input('page', 1);
        $total = $vouchers->count();
        $paginatedItems = $vouchers->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'vouchers' => $paginatedItems,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage),
            'goods_types' => $goodsTypes,
        ]);
    }

    public function bulkApproveVouchers(Request $request, Contract $contract)
    {
        $request->validate([
            'password' => 'required|string',
            'ids' => 'required|array',
            'ids.*.id' => 'required|integer',
            'ids.*.type' => 'required|string|in:reception,delivery',
        ]);

        $user = auth()->user();
        if (empty($user->secure_password)) {
            return response()->json(['error' => app()->getLocale() === 'ar' ? 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.' : 'Please set your secure password first in your profile.'], 403);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->secure_password)) {
            return response()->json(['error' => app()->getLocale() === 'ar' ? 'كلمة المرور الآمنة غير صحيحة.' : 'Incorrect secure password.'], 403);
        }

        $approvedCount = 0;
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $contract, &$approvedCount) {
            foreach ($request->input('ids') as $item) {
                if ($item['type'] === 'reception') {
                    $reception = \App\Models\Reception::where('contract_id', $contract->id)->find($item['id']);
                    if ($reception && $reception->status === 'draft') {
                        $reception->update([
                            'status' => 'approved',
                            'updated_by' => auth()->id(),
                        ]);
                        $approvedCount++;
                    }
                } elseif ($item['type'] === 'delivery') {
                    $delivery = \App\Models\Delivery::where('contract_id', $contract->id)->find($item['id']);
                    if ($delivery && $delivery->status === 'draft') {
                        $delivery->update([
                            'status' => 'approved',
                            'updated_by' => auth()->id(),
                        ]);
                        $approvedCount++;
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => app()->getLocale() === 'ar'
                ? "تم اعتماد {$approvedCount} من السندات بنجاح."
                : "Successfully approved {$approvedCount} vouchers."
        ]);
    }

    public function bulkReopenVouchers(Request $request, Contract $contract)
    {
        $request->validate([
            'password' => 'required|string',
            'reason' => 'required|string|max:500',
            'ids' => 'required|array',
            'ids.*.id' => 'required|integer',
            'ids.*.type' => 'required|string|in:reception,delivery',
        ]);

        $user = auth()->user();
        if (empty($user->secure_password)) {
            return response()->json(['error' => app()->getLocale() === 'ar' ? 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.' : 'Please set your secure password first in your profile.'], 403);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->secure_password)) {
            return response()->json(['error' => app()->getLocale() === 'ar' ? 'كلمة المرور الآمنة غير صحيحة.' : 'Incorrect secure password.'], 403);
        }

        $reopenedCount = 0;
        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $contract, &$reopenedCount) {
            foreach ($request->input('ids') as $item) {
                if ($item['type'] === 'reception') {
                    $reception = \App\Models\Reception::where('contract_id', $contract->id)->find($item['id']);
                    if ($reception && $reception->status === 'approved') {
                        $history = $reception->history ?: [];
                        $history[] = [
                            'date' => now()->toDateTimeString(),
                            'user' => auth()->user()->name,
                            'reason' => 'إعادة الفتح بالتحديد المجمع: ' . $request->reason,
                        ];
                        $reception->update([
                            'status' => 'draft',
                            'history' => $history,
                            'updated_by' => auth()->id(),
                        ]);
                        $reopenedCount++;
                    }
                } elseif ($item['type'] === 'delivery') {
                    $delivery = \App\Models\Delivery::where('contract_id', $contract->id)->find($item['id']);
                    if ($delivery && $delivery->status === 'approved') {
                        $history = $delivery->history ?: [];
                        $history[] = [
                            'date' => now()->toDateTimeString(),
                            'user' => auth()->user()->name,
                            'reason' => 'إعادة الفتح بالتحديد المجمع: ' . $request->reason,
                        ];
                        $delivery->update([
                            'status' => 'draft',
                            'history' => $history,
                            'updated_by' => auth()->id(),
                        ]);
                        $reopenedCount++;
                    }
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => app()->getLocale() === 'ar'
                ? "تم إعادة فتح {$reopenedCount} من السندات للتعديل بنجاح."
                : "Successfully reopened {$reopenedCount} vouchers to draft."
        ]);
    }

    public function bulkPrintVouchers(Request $request, Contract $contract)
    {
        $request->validate([
            'ids' => 'required|string',
        ]);

        $items = explode(',', $request->input('ids'));
        $vouchers = collect();

        foreach ($items as $item) {
            $parts = explode('-', $item);
            if (count($parts) !== 2) continue;
            $type = $parts[0];
            $id = (int) $parts[1];

            if ($type === 'reception') {
                $reception = \App\Models\Reception::where('contract_id', $contract->id)
                    ->with([
                        'customer',
                        'contract',
                        'driver',
                        'representative',
                        'period',
                        'inventoryEntries.inventoryItem',
                        'inventoryEntries.variant',
                        'inventoryEntries.pallet'
                    ])->find($id);
                if ($reception) {
                    $reception->voucher_type = 'reception';
                    $vouchers->push($reception);
                }
            } elseif ($type === 'delivery') {
                $delivery = \App\Models\Delivery::where('contract_id', $contract->id)
                    ->with([
                        'customer',
                        'contract',
                        'driver',
                        'representative',
                        'period',
                        'inventoryEntries.inventoryItem',
                        'inventoryEntries.variant',
                        'inventoryEntries.pallet'
                    ])->find($id);
                if ($delivery) {
                    $delivery->voucher_type = 'delivery';
                    $vouchers->push($delivery);
                }
            }
        }

        return Inertia::render('Warehouse/Vouchers/BulkPrint', [
            'vouchers' => $vouchers,
            'contract' => $contract
        ]);
    }

    public function getPallets(Request $request, Contract $contract)
    {
        $query = \App\Models\Pallet::query()
            ->whereHas('inventoryEntries', function ($q) use ($contract) {
                $q->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class], function ($query) use ($contract) {
                    $query->where('contract_id', $contract->id);
                });
            });

        // Filter: search by code or number
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('pallet_number', 'like', "%{$search}%")
                    ->orWhere('pallet_code', 'like', "%{$search}%");
            });
        }

        // Filter: size
        if ($request->filled('size')) {
            $query->where('size', $request->input('size'));
        }

        // Fetch all matching pallets
        $allPallets = $query->orderBy('pallet_number', 'asc')->get();

        // Calculate contents for all of them
        $entries = \App\Models\InventoryEntry::whereIn('pallet_id', $allPallets->pluck('id'))
            ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class], function ($query) use ($contract) {
                $query->where('contract_id', $contract->id);
            })
            ->with(['inventoryItem', 'variant'])
            ->get();

        $entriesByPallet = $entries->groupBy('pallet_id');
        $filteredPallets = collect();

        foreach ($allPallets as $pallet) {
            $palletEntries = $entriesByPallet->get($pallet->id, collect());
            $contents = [];
            $grouped = $palletEntries->groupBy(function ($entry) {
                return $entry->inventory_item_id . '_' . $entry->inventory_item_variant_id;
            });
            $palletTotalIn = 0;
            $palletTotalOut = 0;
            foreach ($grouped as $group) {
                $first = $group->first();
                $qtyIn = $group->sum('quantity_in');
                $qtyOut = $group->sum('quantity_out');
                $balance = $qtyIn - $qtyOut;
                $palletTotalIn += $qtyIn;
                $palletTotalOut += $qtyOut;
                $contents[] = [
                    'item_id' => $first->inventory_item_id,
                    'item_name' => $first->inventoryItem->name,
                    'variant_id' => $first->inventory_item_variant_id,
                    'variant_name' => $first->variant?->name,
                    'quality' => $first->variant?->quality,
                    'quantity' => $balance,
                ];
            }

            $pallet->contents = $contents;
            $pallet->total_packages = array_sum(array_column($contents, 'quantity'));
            $pallet->total_in = $palletTotalIn;
            $pallet->total_out = $palletTotalOut;

            // If filter item_id is specified, verify if it is in contents
            if ($request->filled('item_id')) {
                $itemId = (int) $request->input('item_id');
                $hasItem = false;
                foreach ($contents as $c) {
                    if ($c['item_id'] === $itemId) {
                        $hasItem = true;
                        break;
                    }
                }
                if ($hasItem) {
                    $filteredPallets->push($pallet);
                }
            } else {
                $filteredPallets->push($pallet);
            }
        }

        // Get list of all sizes available for contract pallets (only active ones)
        $allSizes = $filteredPallets->pluck('size')->filter()->unique()->values();

        // Get list of distinct items stored for filter dropdown (only active ones)
        $activeItemIds = [];
        foreach ($filteredPallets as $p) {
            foreach ($p->contents as $c) {
                $activeItemIds[] = $c['item_id'];
            }
        }
        $allItems = \App\Models\InventoryItem::whereIn('id', array_unique($activeItemIds))->get(['id', 'name']);

        // Paginate in PHP
        $perPage = 24;
        $page = (int) $request->input('page', 1);
        $total = $filteredPallets->count();
        $paginatedPallets = $filteredPallets->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'pallets' => $paginatedPallets,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage),
            'sizes' => $allSizes,
            'items' => $allItems,
        ]);
    }

    public function getStoredItems(Request $request, Contract $contract)
    {
        // Fetch distinct items and variants stored under the contract
        $entriesQuery = \App\Models\InventoryEntry::query()
            ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class], function ($query) use ($contract) {
                $query->where('contract_id', $contract->id);
            });

        // Search: item name or code
        if ($request->filled('search')) {
            $search = $request->input('search');
            $entriesQuery->whereHas('inventoryItem', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Get aggregate records
        $aggregates = $entriesQuery
            ->selectRaw('inventory_item_id, inventory_item_variant_id, sum(quantity_in) as total_in, sum(quantity_out) as total_out, count(distinct pallet_id) as pallets_count')
            ->groupBy('inventory_item_id', 'inventory_item_variant_id')
            ->with(['inventoryItem', 'variant'])
            ->get();

        // Calculate balance for each item-variant
        $items = collect();
        foreach ($aggregates as $agg) {
            $balance = (float) $agg->total_in - (float) $agg->total_out;
            $items->push([
                'item_id' => $agg->inventory_item_id,
                'item_name' => $agg->inventoryItem->name,
                'item_code' => $agg->inventoryItem->code,
                'variant_id' => $agg->inventory_item_variant_id,
                'variant_name' => $agg->variant?->name,
                'quality' => $agg->variant?->quality,
                'total_in' => (float) $agg->total_in,
                'total_out' => (float) $agg->total_out,
                'balance' => $balance,
                'pallets_count' => $agg->pallets_count,
            ]);
        }

        // Paginate items collection
        $perPage = 24;
        $page = (int) $request->input('page', 1);
        $total = $items->count();
        $paginatedItems = $items->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'items' => $paginatedItems,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage),
        ]);
    }

    public function getItemMovements(Request $request, Contract $contract)
    {
        $request->validate([
            'item_id' => 'required|integer|exists:inventory_items,id',
            'variant_id' => 'required|integer|exists:inventory_item_variants,id',
        ]);

        $itemId = (int) $request->input('item_id');
        $variantId = (int) $request->input('variant_id');

        $entries = \App\Models\InventoryEntry::query()
            ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class], function ($query) use ($contract) {
                $query->where('contract_id', $contract->id);
            })
            ->where('inventory_item_id', $itemId)
            ->where('inventory_item_variant_id', $variantId)
            ->with(['voucher', 'inventoryItem', 'variant'])
            ->orderBy('operation_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $item = \App\Models\InventoryItem::find($itemId);
        $variant = \App\Models\InventoryItemVariant::find($variantId);

        $movements = [];
        $runningBalance = 0;
        $totalIn = 0;
        $totalOut = 0;

        foreach ($entries as $entry) {
            $voucher = $entry->voucher;
            if (!$voucher) continue;

            $voucherType = $entry->voucher_type === 'App\\Models\\Reception' ? 'reception' : 'delivery';
            $operationDate = $entry->operation_date
                ?? ($voucherType === 'reception' ? $voucher->reception_date : $voucher->delivery_date);

            $qtyIn = (float) $entry->quantity_in;
            $qtyOut = (float) $entry->quantity_out;
            $runningBalance += ($qtyIn - $qtyOut);
            $totalIn += $qtyIn;
            $totalOut += $qtyOut;

            $movements[] = [
                'serial_number' => $voucher->serial_number,
                'operation_date' => $operationDate ? Carbon::parse($operationDate)->toDateString() : null,
                'type' => $voucherType,
                'quantity_in' => $qtyIn,
                'quantity_out' => $qtyOut,
                'running_balance' => $runningBalance,
            ];
        }

        return response()->json([
            'item_name' => $item?->name,
            'variant_name' => $variant?->name,
            'quality' => $variant?->quality,
            'movements' => $movements,
            'total_in' => $totalIn,
            'total_out' => $totalOut,
            'balance' => $totalIn - $totalOut,
        ]);
    }

    public function getPalletMovements(Request $request, Contract $contract)
    {
        $request->validate([
            'pallet_id' => 'required|integer|exists:pallets,id',
        ]);

        $palletId = (int) $request->input('pallet_id');
        $pallet = \App\Models\Pallet::findOrFail($palletId);

        $entries = \App\Models\InventoryEntry::query()
            ->whereHasMorph('voucher', [\App\Models\Reception::class, \App\Models\Delivery::class], function ($query) use ($contract) {
                $query->where('contract_id', $contract->id);
            })
            ->where('pallet_id', $palletId)
            ->with(['voucher', 'inventoryItem', 'variant'])
            ->orderBy('operation_date', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        // Build unique contents list
        $contentsMap = [];
        foreach ($entries as $entry) {
            $key = $entry->inventory_item_id . '_' . $entry->inventory_item_variant_id;
            if (!isset($contentsMap[$key])) {
                $contentsMap[$key] = [
                    'item_name' => $entry->inventoryItem->name,
                    'variant_name' => $entry->variant?->name,
                    'quality' => $entry->variant?->quality,
                ];
            }
        }

        $movements = [];
        $runningBalance = 0;
        $totalIn = 0;
        $totalOut = 0;

        foreach ($entries as $entry) {
            $voucher = $entry->voucher;
            if (!$voucher) continue;

            $voucherType = $entry->voucher_type === 'App\\Models\\Reception' ? 'reception' : 'delivery';
            $operationDate = $entry->operation_date
                ?? ($voucherType === 'reception' ? $voucher->reception_date : $voucher->delivery_date);

            $qtyIn = (float) $entry->quantity_in;
            $qtyOut = (float) $entry->quantity_out;
            $runningBalance += ($qtyIn - $qtyOut);
            $totalIn += $qtyIn;
            $totalOut += $qtyOut;

            $movements[] = [
                'serial_number' => $voucher->serial_number,
                'operation_date' => $operationDate ? Carbon::parse($operationDate)->toDateString() : null,
                'type' => $voucherType,
                'quantity_in' => $qtyIn,
                'quantity_out' => $qtyOut,
                'running_balance' => $runningBalance,
            ];
        }

        return response()->json([
            'pallet_number' => $pallet->pallet_number,
            'pallet_code' => $pallet->pallet_code,
            'size' => $pallet->size,
            'contents' => array_values($contentsMap),
            'movements' => $movements,
            'total_in' => $totalIn,
            'total_out' => $totalOut,
            'balance' => $totalIn - $totalOut,
        ]);
    }
}
