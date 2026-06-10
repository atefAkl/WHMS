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
                    });
            });
        }

        $receptions = $query->latest()->paginate(15)->withQueryString();

        $customers = Customer::orderBy('name')->get();
        $contracts = Contract::orderBy('contract_number')->get();

        return Inertia::render('Warehouse/Receptions/Index', [
            'receptions' => $receptions,
            'customers' => $customers,
            'contracts' => $contracts,
            'filters' => $request->only(['customer_id', 'contract_id', 'status', 'search', 'date_from', 'date_to'])
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

        DB::transaction(function () use ($reception) {
            // Delete entries and reception
            $reception->inventoryEntries()->delete();
            $reception->delete();
        });

        return redirect()->route('receptions.index')->with('success', 'تم حذف سند الاستلام بنجاح.');
    }

    public function approve(Reception $reception)
    {
        $reception->update([
            'status' => 'approved',
            'updated_by' => auth()->id()
        ]);

        return redirect()->back()->with('success', 'تم اعتماد السند بنجاح وتثبيت حركات المخزن.');
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

        return Inertia::render('Warehouse/Receptions/Print', [
            'reception' => $reception
        ]);
    }

    public function getOccupancyStats(Contract $contract)
    {
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

        // Financial / Invoice stats
        $totalInvoiced = (float) $contract->invoices()->sum('amount');
        $totalPaid = (float) $contract->invoices()->sum('paid_amount');
        $totalDues = max(0.0, $totalInvoiced - $totalPaid);
        $invoices = $contract->invoices()->orderBy('due_date', 'asc')->get()->map(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'issue_date' => $inv->issue_date ? $inv->issue_date->toDateString() : null,
                'due_date' => $inv->due_date ? $inv->due_date->toDateString() : null,
                'amount' => $inv->amount,
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
            // Standard/Legacy fields for Receptions compatibility
            'total_capacity' => $bookedPallets,
            'currently_in_warehouse' => $utilizedPallets,
            'remaining' => $availablePallets,

            // New fields for Deliveries compatibility
            'booked_capacity' => $bookedPallets,
            'booked_pallets' => $bookedPallets,

            'current_utilized' => $utilizedPallets,
            'utilized_pallets' => $utilizedPallets,

            'capacity_balance' => $availablePallets,
            'available_pallets' => $availablePallets,

            'end_date' => $contract->end_date ? $contract->end_date->toDateString() : null,

            // Financial stats
            'financial' => [
                'total_invoiced' => $totalInvoiced,
                'total_paid' => $totalPaid,
                'total_dues' => $totalDues,
                'invoices' => $invoices,
                'payments' => $payments,
            ]
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
