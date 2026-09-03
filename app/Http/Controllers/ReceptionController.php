<?php

namespace App\Http\Controllers;

use App\Models\Reception;
use App\Models\Customer;
use App\Models\Contract;
use App\Models\Driver;
use App\Models\Pallet;
use App\Models\InventoryItem;
use App\Models\ContractPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Traits\ValidatesSecureDeletion;

class ReceptionController extends Controller
{
    use ValidatesSecureDeletion;

    public function index(Request $request)
    {
        $query = Reception::with(['customer', 'contract', 'driver', 'representative', 'period'])
            ->withSum('inventoryEntries as total_quantity', 'quantity_in');

        // Filters
        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('contract_id')) {
            $query->where('contract_id', $request->contract_id);
        }
        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('reception_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('reception_date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                    ->orWhere('farm_source', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($c) use ($search) {
                        $c->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('driver', function ($d) use ($search) {
                        $d->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('qty_value') && is_numeric($request->qty_value)) {
            $val = (float) $request->qty_value;
            $op = match($request->input('qty_operator')) {
                'gt', '>' => '>',
                'lt', '<' => '<',
                'eq', '=' => '=',
                'lte', '<=' => '<=',
                default => '>=',
            };
            $query->whereRaw(
                '(SELECT COALESCE(SUM(inventory_entries.quantity_in), 0) FROM inventory_entries WHERE inventory_entries.voucher_id = receptions.id AND inventory_entries.voucher_type = ? AND inventory_entries.deleted_at IS NULL) ' . $op . ' ?',
                [\App\Models\Reception::class, $val]
            );
        }

        $receptions = $query->latest()->paginate(15)->withQueryString();

        $customers = Customer::orderBy('name')->get();
        $contracts = Contract::orderBy('contract_number')->get();
        $drivers = \App\Models\Driver::orderBy('name')->get();

        return Inertia::render('Warehouse/Receptions/Index', [
            'receptions' => $receptions,
            'customers' => $customers,
            'contracts' => $contracts,
            'drivers' => $drivers,
            'filters' => $request->only(['customer_id', 'contract_id', 'driver_id', 'status', 'search', 'date_from', 'date_to', 'qty_operator', 'qty_value'])
        ]);
    }

    public function create()
    {
        $reception = Reception::create([
            'status'         => 'draft',
            'reception_date' => now(),
            'history'        => [],
            'created_by'     => auth()->id(),
            'updated_by'     => auth()->id(),
        ]);

        return redirect()->route('receptions.edit', $reception->id);
    }


    public function store(Request $request)
    {
        $isDraft = $request->input('status') === 'draft';

        $validated = $request->validate([
            'customer_id'       => $isDraft ? 'nullable|exists:customers,id' : 'required|exists:customers,id',
            'contract_id'       => $isDraft ? 'nullable|exists:contracts,id' : 'required|exists:contracts,id',
            'period_id'         => $isDraft ? 'nullable|exists:contract_periods,id' : 'required|exists:contract_periods,id',
            'driver_id'         => 'nullable|exists:drivers,id',
            'representative_id' => 'nullable|exists:contract_agents,id',
            'farm_source'       => 'nullable|string|max:255',
            'notes'             => 'nullable|string',
            'reception_date'    => 'required|date',
            'status'            => 'nullable|string|in:draft,approved',
            'items'             => $isDraft ? 'nullable|array' : 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_number'             => 'required|string|max:50',
            'items.*.quantity_in'               => 'required|numeric|min:0.01',
        ]);

        if (!$isDraft && !$this->isActiveContractPeriod($request->contract_id, $request->period_id)) {
            return back()->withErrors(['period_id' => 'يجب اختيار فترة نشطة تابعة للعقد.'])->withInput();
        }

        $activeStoringPeriod = \App\Models\ContractPeriod::find($request->period_id);
        if ($activeStoringPeriod) {
            $recDateStr = \Carbon\Carbon::parse($request->reception_date)->format('Y-m-d');
            $pStartStr  = \Carbon\Carbon::parse($activeStoringPeriod->start_date)->format('Y-m-d');
            $pEndStr    = \Carbon\Carbon::parse($activeStoringPeriod->end_date)->format('Y-m-d');

            if ($recDateStr < $pStartStr || $recDateStr > $pEndStr) {
                return redirect()->back()->withErrors([
                    'reception_date' => 'تاريخ السند لا يمكن أن يكون خارج نطاق تاريخ فترة التخزين النشطة للعقد.'
                ])->withInput();
            }
        }

        $reception = DB::transaction(function () use ($request) {
            $reception = Reception::create([
                'customer_id'       => $request->customer_id,
                'contract_id'       => $request->contract_id,
                'period_id'         => $request->period_id,
                'driver_id'         => $request->driver_id,
                'representative_id' => $request->representative_id,
                'farm_source'       => $request->farm_source,
                'notes'             => $request->notes,
                'reception_date'    => $request->reception_date,
                'status'            => $request->status ?? 'draft',
                'history'           => [],
                'created_by'        => auth()->id(),
                'updated_by'        => auth()->id(),
            ]);

            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $itemData) {
                    $pallet = Pallet::findOrCreateFromCode($itemData['pallet_number']);

                    $reception->inventoryEntries()->create([
                        'contract_id'               => $reception->contract_id,
                        'inventory_item_id'         => $itemData['inventory_item_id'],
                        'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                        'pallet_id'                 => $pallet->id,
                        'quantity_in'               => $itemData['quantity_in'],
                        'quantity_out'              => 0,
                        'operation_date'            => $request->reception_date,
                    ]);
                }
            }
            return $reception;
        });

        try {
            $users = \App\Models\User::all()->filter(fn($u) => $u->id !== auth()->id() && $u->wantsNotification('reception_created'));
            $serial = $reception->serial_number;
            foreach ($users as $user) {
                $user->notify(new \App\Notifications\SystemNotification(
                    'سند استلام جديد 📥',
                    "تم إنشاء سند استلام جديد برقم ({$serial}).",
                    route('receptions.show', $reception->id)
                ));
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Reception notification error: " . $e->getMessage());
        }

        if ($request->input('redirect_to') === 'index') {
            return redirect()->route('receptions.index')->with('success', 'تم إنشاء سند الاستلام بنجاح.');
        } elseif ($request->input('redirect_to') === 'edit') {
            return redirect()->route('receptions.edit', $reception->id)->with('success', 'تم حفظ السند كمسودة بنجاح.');
        } elseif ($request->input('redirect_to') === 'print') {
            return redirect()->route('receptions.print', $reception->id)->with('success', 'تم اعتماد سند الاستلام بنجاح.');
        }

        if ($request->filled('redirect_to_draft_id')) {
            return redirect()->route('receptions.edit', $request->redirect_to_draft_id)
                ->with('success', 'تم حفظ السند الحالي كمسودة والانتقال للسند المحدد.');
        }

        return redirect()->route('receptions.index')->with('success', 'تم إنشاء سند الاستلام بنجاح.');
    }

    public function show(Reception $reception)
    {
        $reception->load([
            'customer',
            'contract',
            'driver',
            'representative',
            'period',
            'inventoryEntries.inventoryItem',
            'inventoryEntries.variant',
            'inventoryEntries.pallet',
            'creator',
            'editor'
        ]);

        return Inertia::render('Warehouse/Receptions/Show', [
            'reception' => $reception
        ]);
    }

    public function edit(Reception $reception)
    {
        if ($reception->status === 'approved') {
            return redirect()->route('receptions.show', $reception->id)
                ->with('error', 'لا يمكن تعديل السند المعتمد. يرجى إلغاء الاعتماد أولاً.');
        }

        $reception->load(['inventoryEntries.pallet']);

        $customers = Customer::where('status', 'active')
            ->orWhereHas('contracts', function ($q) {
                $q->where('status', 'active');
            })
            ->with(['contracts' => function ($q) {
                $q->where('status', 'active')->with(['periods', 'contractAgents']);
            }])
            ->orderBy('name')
            ->get();

        $drivers = Driver::where('is_active', true)->orderBy('name')->get();

        $inventoryItems = InventoryItem::where('is_active', true)
            ->with(['variants' => function ($v) {
                $v->where('is_active', true);
            }])
            ->orderBy('name')
            ->get();

        $draftReceptions = Reception::where('status', 'draft')
            ->where('id', '!=', $reception->id)
            ->with(['customer:id,name', 'contract:id,contract_number'])
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'serial_number', 'customer_id', 'contract_id']);

        return Inertia::render('Warehouse/Receptions/CreateEdit', [
            'customers' => $customers,
            'drivers' => $drivers,
            'inventoryItems' => $inventoryItems,
            'isEdit' => true,
            'reception' => $reception,
            'draftReceptions' => $draftReceptions
        ]);
    }

    public function update(Request $request, Reception $reception)
    {
        if ($reception->status === 'approved') {
            return redirect()->route('receptions.show', $reception->id)
                ->with('error', 'لا يمكن تعديل السند المعتمد.');
        }

        $isDraft = $request->input('status') === 'draft';

        $validated = $request->validate([
            'customer_id'         => $isDraft ? 'nullable|exists:customers,id' : 'required|exists:customers,id',
            'contract_id'         => $isDraft ? 'nullable|exists:contracts,id' : 'required|exists:contracts,id',
            'period_id'           => $isDraft ? 'nullable|exists:contract_periods,id' : 'required|exists:contract_periods,id',
            'driver_id'           => 'nullable|exists:drivers,id',
            'representative_id'   => 'nullable|exists:contract_agents,id',
            'farm_source'         => 'nullable|string|max:255',
            'notes'               => 'nullable|string',
            'reception_date'      => 'required|date',
            'status'              => 'nullable|string|in:draft,approved',
            'modification_reason' => 'nullable|string',
            'items'               => $isDraft ? 'nullable|array' : 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_number'             => 'required|string|max:50',
            'items.*.quantity_in'               => 'required|numeric|min:0.01',
        ]);

        if (!$isDraft && !$this->isActiveContractPeriod($request->contract_id, $request->period_id)) {
            return back()->withErrors(['period_id' => 'يجب اختيار فترة نشطة تابعة للعقد.'])->withInput();
        }

        $activeStoringPeriod = \App\Models\ContractPeriod::find($request->period_id);
        if ($activeStoringPeriod) {
            $recDateStr = \Carbon\Carbon::parse($request->reception_date)->format('Y-m-d');
            $pStartStr  = \Carbon\Carbon::parse($activeStoringPeriod->start_date)->format('Y-m-d');
            $pEndStr    = \Carbon\Carbon::parse($activeStoringPeriod->end_date)->format('Y-m-d');

            if ($recDateStr < $pStartStr || $recDateStr > $pEndStr) {
                return redirect()->back()->withErrors([
                    'reception_date' => 'تاريخ السند لا يمكن أن يكون خارج نطاق تاريخ فترة التخزين النشطة للعقد.'
                ])->withInput();
            }
        }

        DB::transaction(function () use ($request, $reception) {
            $reason = $request->modification_reason ?: 'تعديل وحفظ مسودة';

            // Append to history log
            $history = $reception->history ?: [];
            $history[] = [
                'date' => now()->toDateTimeString(),
                'user' => auth()->user()->name,
                'reason' => $reason,
            ];

            $reception->update([
                'customer_id'       => $request->customer_id,
                'contract_id'       => $request->contract_id,
                'period_id'         => $request->period_id,
                'driver_id'         => $request->driver_id,
                'representative_id' => $request->representative_id,
                'farm_source'       => $request->farm_source,
                'notes'             => $request->notes,
                'reception_date'    => $request->reception_date,
                'status'            => $request->status ?? $reception->status,
                'history'           => $history,
                'updated_by'        => auth()->id(),
            ]);

            // Clear old entries
            $reception->inventoryEntries()->delete();

            // Insert new entries
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $itemData) {
                    $pallet = Pallet::findOrCreateFromCode($itemData['pallet_number']);

                    $reception->inventoryEntries()->create([
                        'inventory_item_id'         => $itemData['inventory_item_id'],
                        'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                        'pallet_id'                 => $pallet->id,
                        'quantity_in'               => $itemData['quantity_in'],
                        'quantity_out'              => 0,
                        'operation_date'            => $request->reception_date,
                    ]);
                }
            }
        });

        if ($request->input('redirect_to') === 'index') {
            return redirect()->route('receptions.index')->with('success', 'تم تحديث سند الاستلام بنجاح.');
        } elseif ($request->input('redirect_to') === 'edit') {
            return redirect()->route('receptions.edit', $reception->id)->with('success', 'تم حفظ التعديلات بنجاح.');
        } elseif ($request->input('redirect_to') === 'print') {
            return redirect()->route('receptions.print', $reception->id)->with('success', 'تم تحديث سند الاستلام بنجاح وجاري الانتقال للطباعة.');
        }

        if ($request->filled('redirect_to_draft_id')) {
            return redirect()->route('receptions.edit', $request->redirect_to_draft_id)
                ->with('success', 'تم حفظ السند الحالي كمسودة والانتقال للسند المحدد.');
        }

        return redirect()->route('receptions.show', $reception->id)->with('success', 'تم تحديث سند الاستلام بنجاح.');
    }


    public function destroy(Request $request, Reception $reception)
    {
        $this->validateSecureDelete($request);

        // Security Enforcement Rule 1: Prevent deleting approved vouchers
        if ($reception->status === 'approved') {
            return redirect()->back()->with('error', 'إجراء مرفوض أمنياً: لا يمكن حذف سند معتمد نهائياً! يجب إلغاء اعتماده أولاً.');
        }

        // Security Enforcement Rule 2: Prevent deleting vouchers containing inventory records
        if ($reception->inventoryEntries()->count() > 0) {
            return redirect()->back()->with('error', 'إجراء مرفوض أمنياً: لا يمكن حذف سند يحتوي على مدخلات أو حركات مخزنية! يجب إفراغ الأصناف المسجلة داخل السند وتفريغ محتوياته أولاً قبل الحذف.');
        }

        DB::transaction(function () use ($reception) {
            $reception->delete();
        });

        return redirect()->route('receptions.index')->with('success', 'تم حذف سند الاستلام الخالي بنجاح.');
    }

    public function approve(Reception $reception)
    {
        if (empty($reception->customer_id)) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد السند: يجب تحديد العميل أولاً.');
        }

        if (empty($reception->contract_id)) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد السند: يجب ربطه بعقد تخزيني نشط.');
        }

        if (empty($reception->period_id)) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد السند: يجب تحديد الفترة التخزينية.');
        }

        if ($reception->inventoryEntries()->count() === 0) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد السند: يجب إضافة بنود وبضائع مستلمة أولاً (السند خالٍ من السجلات).');
        }

        $reception->update([
            'status' => 'approved',
            'updated_by' => auth()->id()
        ]);

        return redirect()->back()->with('success', 'تم اعتماد السند بنجاح وتثبيت حركات المخزن.');
    }

    public function cancel(Request $request, Reception $reception)
    {
        $this->validateSecureDelete($request);

        if ($reception->status === 'approved') {
            return redirect()->back()->with('error', 'لا يمكن إلغاء سند معتمد مباشر. يجب إلغاء اعتماده أولاً.');
        }

        DB::transaction(function () use ($reception) {
            // Soft delete entries so they no longer count towards warehouse balances
            $reception->inventoryEntries()->delete();

            $history = $reception->history ?: [];
            $history[] = [
                'date' => now()->toDateTimeString(),
                'user' => auth()->user()->name,
                'reason' => 'إلغاء السند وتجميد حركاته المخزنية أمنياً',
            ];

            $reception->update([
                'status' => 'cancelled',
                'history' => $history,
                'updated_by' => auth()->id()
            ]);
        });

        return redirect()->back()->with('success', 'تم إلغاء السند بنجاح وتجميد حركاته المخزنية دون حذفه.');
    }

    public function reopen(Request $request, Reception $reception)
    {
        $request->validate([
            'password' => 'required|string',
            'reason'   => 'required|string|min:5'
        ]);

        $user = auth()->user();
        if (empty($user->secure_password)) {
            return redirect()->back()->with('error', 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.');
        }

        if (!Hash::check($request->password, $user->secure_password)) {
            return redirect()->back()->with('error', 'كلمة مرور تأكيد إلغاء الاعتماد غير صحيحة.');
        }

        DB::transaction(function () use ($request, $reception) {
            $history = $reception->history ?: [];
            $history[] = [
                'date' => now()->toDateTimeString(),
                'user' => auth()->user()->name,
                'reason' => 'إلغاء الاعتماد وإعادة الفتح: ' . $request->reason,
            ];

            $reception->update([
                'status' => 'draft',
                'history' => $history,
                'updated_by' => auth()->id()
            ]);
        });

        return redirect()->back()->with('success', 'تم إلغاء اعتماد السند وإعادته لحالة المسودة بنجاح.');
    }

    public function print(Reception $reception)
    {
        if (empty($reception->customer_id) || empty($reception->contract_id) || empty($reception->period_id) || $reception->inventoryEntries()->count() === 0) {
            return redirect()->route('receptions.show', $reception->id)
                ->with('error', 'ممنوع طباعة سند غير مكتمل البيانات! (يجب اختيار العميل والعقد والفترة التخزينية وإدخال أصناف البضائع).');
        }

        $reception->load([
            'customer',
            'contract',
            'driver',
            'representative',
            'period',
            'inventoryEntries.inventoryItem',
            'inventoryEntries.variant',
            'inventoryEntries.pallet'
        ]);

        $companySettings = \App\Models\ContractSetting::pluck('value', 'key')->all();

        return Inertia::render('Warehouse/Receptions/Print', [
            'reception' => $reception,
            'companySettings' => $companySettings,
        ]);
    }

    public function getOccupancyStats(Contract $contract)
    {
        try {
            // 1. Booked pallets (total_capacity)
            $bookedPallets = $contract->total_capacity ?: 0;

            // 2. Utilized pallets (pallets under contract with balance > 0)
            $utilizedPallets = \App\Models\InventoryEntry::where(function ($q) use ($contract) {
                $q->where(function ($q1) use ($contract) {
                    $q1->where('voucher_type', \App\Models\Reception::class)
                        ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contract->id)->pluck('id'));
                })->orWhere(function ($q2) use ($contract) {
                    $q2->where('voucher_type', \App\Models\Delivery::class)
                        ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contract->id)->pluck('id'));
                });
            })
                ->select('pallet_id')
                ->groupBy('pallet_id')
                ->having(\Illuminate\Support\Facades\DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
                ->get()
                ->count();

            // 3. Available pallets (booked - utilized)
            $availablePallets = max(0, $bookedPallets - $utilizedPallets);

            // 4. Breakdown by Item Short Name / Size
            $activePalletIds = \App\Models\InventoryEntry::where(function ($q) use ($contract) {
                $q->where(function ($q1) use ($contract) {
                    $q1->where('voucher_type', \App\Models\Reception::class)
                        ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contract->id)->pluck('id'));
                })->orWhere(function ($q2) use ($contract) {
                    $q2->where('voucher_type', \App\Models\Delivery::class)
                        ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contract->id)->pluck('id'));
                });
            })
                ->select('pallet_id')
                ->groupBy('pallet_id')
                ->having(\Illuminate\Support\Facades\DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
                ->pluck('pallet_id');

            $palletSizeCounts = \App\Models\Pallet::whereIn('id', $activePalletIds)
                ->select('size', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                ->groupBy('size')
                ->pluck('count', 'size')
                ->all();

            $contract->load('items.storageItem');
            $itemsBreakdown = [];
            foreach ($contract->items as $cItem) {
                $label = $cItem->short_name ?: ($cItem->storageItem->short_name ?? $cItem->storageItem->name_ar ?? 'طبلية');
                $booked = (int) $cItem->unit_count;
                
                $utilized = $palletSizeCounts[$label] ?? 0;
                if ($utilized === 0) {
                    foreach ($palletSizeCounts as $sz => $cnt) {
                        if (str_contains($label, $sz) || str_contains($sz, $label)) {
                            $utilized += $cnt;
                        }
                    }
                }
                
                $itemsBreakdown[] = [
                    'label' => $label,
                    'full_name' => $cItem->storageItem->name_ar ?? $label,
                    'booked' => $booked,
                    'utilized' => $utilized,
                    'available' => max(0, $booked - $utilized),
                ];
            }

            // Financial / Invoice stats
            $totalInvoiced = (float) $contract->invoices()->sum('total_amount');
            $totalPaid = (float) $contract->invoices()->sum('paid_amount');
            $totalDues = max(0.0, $totalInvoiced - $totalPaid);
            $invoices = $contract->invoices()->orderBy('due_date', 'asc')->get()->map(function ($inv) {
                return [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'issue_date' => $inv->date ? $inv->date->toDateString() : null,
                    'due_date' => $inv->due_date ? $inv->due_date->toDateString() : null,
                    'amount' => $inv->total_amount,
                    'paid_amount' => $inv->paid_amount,
                    'status' => $inv->status,
                ];
            });

            $payments = $contract->payments()->orderBy('payment_date', 'desc')->get()->map(function ($pay) {
                return [
                    'id' => $pay->id,
                    'payment_date' => $pay->payment_date ? $pay->payment_date->toDateString() : null,
                    'amount' => $pay->amount,
                    'method' => $pay->method,
                    'reference' => $pay->reference,
                    'notes' => $pay->notes,
                ];
            });

            return response()->json([
                'total_capacity' => $bookedPallets,
                'currently_in_warehouse' => $utilizedPallets,
                'available_pallets' => $availablePallets,
                'booked_capacity' => $bookedPallets,
                'booked_pallets' => $bookedPallets,
                'current_utilized' => $utilizedPallets,
                'utilized_pallets' => $utilizedPallets,
                'capacity_balance' => $availablePallets,
                'remaining' => $availablePallets,
                'items_breakdown' => $itemsBreakdown,
                'pallet_size_counts' => $palletSizeCounts,
                'end_date' => $contract->end_date ? $contract->end_date->toDateString() : null,
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'total_dues' => $totalDues,
                'invoices' => $invoices,
                'payments' => $payments,
                'financial' => [
                    'total_invoiced' => $totalInvoiced,
                    'total_paid' => $totalPaid,
                    'total_dues' => $totalDues,
                    'invoices' => $invoices,
                    'payments' => $payments,
                ]
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('getOccupancyStats error: ' . $e->getMessage());
            $bookedPallets = $contract->total_capacity ?: 0;
            return response()->json([
                'total_capacity' => $bookedPallets,
                'currently_in_warehouse' => 0,
                'available_pallets' => $bookedPallets,
                'booked_capacity' => $bookedPallets,
                'booked_pallets' => $bookedPallets,
                'current_utilized' => 0,
                'utilized_pallets' => 0,
                'capacity_balance' => $bookedPallets,
                'remaining' => $bookedPallets,
                'end_date' => $contract->end_date ? $contract->end_date->toDateString() : null,
                'total_invoiced' => 0,
                'total_paid' => 0,
                'total_dues' => 0,
                'invoices' => [],
                'payments' => [],
                'financial' => [
                    'total_invoiced' => 0,
                    'total_paid' => 0,
                    'total_dues' => 0,
                    'invoices' => [],
                    'payments' => [],
                ]
            ]);
        }
    }

    public function bulkPrint(Request $request)
    {
        $ids = $request->input('ids');
        $idList = is_string($ids) ? explode(',', $ids) : (array) $ids;

        $receptions = Reception::whereIn('id', array_filter($idList))
            ->with([
                'customer',
                'contract',
                'driver',
                'representative',
                'period',
                'inventoryEntries.inventoryItem',
                'inventoryEntries.variant',
                'inventoryEntries.pallet'
            ])
            ->get()
            ->map(function ($r) {
                $r->voucher_type = 'reception';
                return $r;
            });

        $companySettings = \App\Models\ContractSetting::pluck('value', 'key')->all();

        return Inertia::render('Warehouse/Vouchers/BulkPrint', [
            'vouchers' => $receptions,
            'contract' => null,
            'companySettings' => $companySettings
        ]);
    }

    private function isActiveContractPeriod($contractId, $periodId): bool
    {
        if (empty($contractId) || empty($periodId)) {
            return false;
        }

        return ContractPeriod::where('id', $periodId)
            ->where('contract_id', $contractId)
            ->where('status', 'active')
            ->exists();
    }
}
