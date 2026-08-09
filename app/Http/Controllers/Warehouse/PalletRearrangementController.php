<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Contract;
use App\Models\PalletRearrangement;
use App\Models\PalletRearrangementItem;
use App\Models\InventoryItem;
use App\Models\InventoryEntry;
use App\Models\Pallet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PalletRearrangementController extends Controller
{
    public function index(Request $request)
    {
        $query = PalletRearrangement::with(['customer', 'contract', 'createdByUser', 'approvedByUser'])
            ->withCount('items');

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('contract_id')) {
            $query->where('contract_id', $request->contract_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($c) use ($search) {
                        $c->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $rearrangements = $query->latest()->paginate(15)->withQueryString();

        $customers = Customer::where('status', 'active')->orderBy('name')->get();
        $contracts = Contract::where('status', 'active')->orderBy('contract_number')->get();

        return Inertia::render('Warehouse/Rearrangements/Index', [
            'rearrangements' => $rearrangements,
            'customers'      => $customers,
            'contracts'      => $contracts,
            'filters'        => $request->only(['customer_id', 'contract_id', 'status', 'search']),
        ]);
    }

    public function create()
    {
        $customers = Customer::where('status', 'active')
            ->with(['contracts' => function ($q) {
                $q->where('status', 'active')->with(['periods', 'contractAgents']);
            }])
            ->orderBy('name')
            ->get();

        $inventoryItems = InventoryItem::with('variants')->get();
        $pallets = Pallet::all();

        return Inertia::render('Warehouse/Rearrangements/CreateEdit', [
            'customers'      => $customers,
            'inventoryItems' => $inventoryItems,
            'pallets'        => $pallets,
            'isEdit'         => false,
            'rearrangement'  => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'       => 'required|exists:customers,id',
            'contract_id'       => 'required|exists:contracts,id',
            'period_id'         => 'nullable|exists:contract_periods,id',
            'rearrangement_date'=> 'required|date',
            'notes'             => 'nullable|string',
            'items'             => 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_id'                 => 'required|exists:pallets,id',
            'items.*.quantity_in'               => 'nullable|numeric|min:0',
            'items.*.quantity_out'              => 'nullable|numeric|min:0',
            'items.*.notes'                     => 'nullable|string',
        ]);

        // Balance Check: Verify that total quantity_in == total quantity_out per item & variant
        $groupedTotals = [];
        foreach ($request->items as $item) {
            $key = $item['inventory_item_id'] . '_' . $item['inventory_item_variant_id'];
            if (!isset($groupedTotals[$key])) {
                $groupedTotals[$key] = ['in' => 0, 'out' => 0];
            }

            $qtyIn = (float) ($item['quantity_in'] ?? 0);
            $qtyOut = (float) ($item['quantity_out'] ?? 0);
            $groupedTotals[$key]['in'] += $qtyIn;
            $groupedTotals[$key]['out'] += $qtyOut;
        }

        foreach ($groupedTotals as $key => $totals) {
            if (round($totals['in'], 2) !== round($totals['out'], 2) || $totals['in'] == 0) {
                return back()->withErrors([
                    'items' => 'خطأ في التوازن: يجب أن يتساوى إجمالي خانة المدخلات مع خانة المخرجات لكل صنف ودرجة (ويجب ألا يكون صفراً) لضمان عدم تغيير إجمالي كميات العقد!'
                ])->withInput();
            }
        }

        $rearrangement = null;
        DB::transaction(function () use ($request, &$rearrangement) {
            $rearrangement = PalletRearrangement::create([
                'customer_id'       => $request->customer_id,
                'contract_id'       => $request->contract_id,
                'period_id'         => $request->period_id,
                'rearrangement_date'=> $request->rearrangement_date,
                'notes'             => $request->notes,
                'status'            => 'draft',
                'created_by'        => auth()->id(),
            ]);

            foreach ($request->items as $itemData) {
                $qtyIn = (float) ($itemData['quantity_in'] ?? 0);
                $qtyOut = (float) ($itemData['quantity_out'] ?? 0);

                if ($qtyIn > 0 || $qtyOut > 0) {
                    $rearrangement->items()->create([
                        'inventory_item_id'         => $itemData['inventory_item_id'],
                        'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                        'pallet_id'                 => $itemData['pallet_id'],
                        'type'                      => $qtyIn > 0 ? 'in' : 'out',
                        'quantity'                  => $qtyIn > 0 ? $qtyIn : $qtyOut,
                        'quantity_in'               => $qtyIn,
                        'quantity_out'              => $qtyOut,
                        'notes'                     => $itemData['notes'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('pallet-rearrangements.show', $rearrangement->id)->with('success', 'تم حفظ مسودة سند ترتيب ونقل الطبالي بنجاح.');
    }

    public function show(PalletRearrangement $palletRearrangement)
    {
        $palletRearrangement->load([
            'customer',
            'contract',
            'period',
            'createdByUser',
            'approvedByUser',
            'items.inventoryItem',
            'items.variant',
            'items.pallet'
        ]);

        return Inertia::render('Warehouse/Rearrangements/Show', [
            'rearrangement' => $palletRearrangement,
        ]);
    }

    public function edit(PalletRearrangement $palletRearrangement)
    {
        if ($palletRearrangement->status === 'approved') {
            return redirect()->route('pallet-rearrangements.show', $palletRearrangement->id)
                ->with('error', 'لا يمكن تعديل سند ترتيب طبالي معتمد.');
        }

        $customers = Customer::where('status', 'active')
            ->with(['contracts' => function ($q) {
                $q->where('status', 'active')->with(['periods', 'contractAgents']);
            }])
            ->orderBy('name')
            ->get();

        $inventoryItems = InventoryItem::with('variants')->get();
        $pallets = Pallet::all();

        $palletRearrangement->load(['items.inventoryItem', 'items.variant', 'items.pallet']);

        return Inertia::render('Warehouse/Rearrangements/CreateEdit', [
            'customers'      => $customers,
            'inventoryItems' => $inventoryItems,
            'pallets'        => $pallets,
            'isEdit'         => true,
            'rearrangement'  => $palletRearrangement,
        ]);
    }

    public function update(Request $request, PalletRearrangement $palletRearrangement)
    {
        if ($palletRearrangement->status === 'approved') {
            return back()->with('error', 'لا يمكن تعديل سند معتمد ومثبت.');
        }

        $validated = $request->validate([
            'customer_id'       => 'required|exists:customers,id',
            'contract_id'       => 'required|exists:contracts,id',
            'period_id'         => 'nullable|exists:contract_periods,id',
            'rearrangement_date'=> 'required|date',
            'notes'             => 'nullable|string',
            'items'             => 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_id'                 => 'required|exists:pallets,id',
            'items.*.quantity_in'               => 'nullable|numeric|min:0',
            'items.*.quantity_out'              => 'nullable|numeric|min:0',
            'items.*.notes'                     => 'nullable|string',
        ]);

        $groupedTotals = [];
        foreach ($request->items as $item) {
            $key = $item['inventory_item_id'] . '_' . $item['inventory_item_variant_id'];
            if (!isset($groupedTotals[$key])) {
                $groupedTotals[$key] = ['in' => 0, 'out' => 0];
            }

            $qtyIn = (float) ($item['quantity_in'] ?? 0);
            $qtyOut = (float) ($item['quantity_out'] ?? 0);
            $groupedTotals[$key]['in'] += $qtyIn;
            $groupedTotals[$key]['out'] += $qtyOut;
        }

        foreach ($groupedTotals as $key => $totals) {
            if (round($totals['in'], 2) !== round($totals['out'], 2) || $totals['in'] == 0) {
                return back()->withErrors([
                    'items' => 'خطأ في التوازن: يجب أن يتساوى إجمالي المدخلات مع المخرجات لكل صنف ودرجة لضمان عدم تغيير كمية العقد الكلية!'
                ])->withInput();
            }
        }

        DB::transaction(function () use ($request, $palletRearrangement) {
            $palletRearrangement->update([
                'customer_id'       => $request->customer_id,
                'contract_id'       => $request->contract_id,
                'period_id'         => $request->period_id,
                'rearrangement_date'=> $request->rearrangement_date,
                'notes'             => $request->notes,
            ]);

            $palletRearrangement->items()->delete();

            foreach ($request->items as $itemData) {
                $qtyIn = (float) ($itemData['quantity_in'] ?? 0);
                $qtyOut = (float) ($itemData['quantity_out'] ?? 0);

                if ($qtyIn > 0 || $qtyOut > 0) {
                    $palletRearrangement->items()->create([
                        'inventory_item_id'         => $itemData['inventory_item_id'],
                        'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                        'pallet_id'                 => $itemData['pallet_id'],
                        'type'                      => $qtyIn > 0 ? 'in' : 'out',
                        'quantity'                  => $qtyIn > 0 ? $qtyIn : $qtyOut,
                        'quantity_in'               => $qtyIn,
                        'quantity_out'              => $qtyOut,
                        'notes'                     => $itemData['notes'] ?? null,
                    ]);
                }
            }
        });

        return redirect()->route('pallet-rearrangements.show', $palletRearrangement->id)->with('success', 'تم تحديث سند ترتيب الطبالي بنجاح.');
    }

    public function approve(PalletRearrangement $palletRearrangement)
    {
        if ($palletRearrangement->status === 'approved') {
            return back()->with('error', 'السند معتمد مسبقاً.');
        }

        DB::transaction(function () use ($palletRearrangement) {
            $palletRearrangement->update([
                'status'      => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            foreach ($palletRearrangement->items as $item) {
                $qtyIn = (float) $item->quantity_in;
                $qtyOut = (float) $item->quantity_out;

                if ($qtyIn > 0 || $qtyOut > 0) {
                    InventoryEntry::create([
                        'inventory_item_id'         => $item->inventory_item_id,
                        'inventory_item_variant_id' => $item->inventory_item_variant_id,
                        'pallet_id'                 => $item->pallet_id,
                        'voucher_type'              => PalletRearrangement::class,
                        'voucher_id'                => $palletRearrangement->id,
                        'quantity_in'               => $qtyIn,
                        'quantity_out'              => $qtyOut,
                        'operation_date'            => $palletRearrangement->rearrangement_date,
                    ]);

                    $pallet = Pallet::find($item->pallet_id);
                    if ($pallet) {
                        $newQty = max(0, $pallet->current_quantity + $qtyIn - $qtyOut);
                        $pallet->update([
                            'current_quantity' => $newQty,
                        ]);
                    }
                }
            }
        });

        return back()->with('success', 'تم اعتماد وترحيل سند ترتيب ونقل الطبالي وتحديث حركات الطبالي بنجاح دون التأثير على إجمالي العقد.');
    }

    public function reopen(PalletRearrangement $palletRearrangement)
    {
        if ($palletRearrangement->status !== 'approved') {
            return back()->with('error', 'السند غير معتمد لفك اعتماده.');
        }

        DB::transaction(function () use ($palletRearrangement) {
            foreach ($palletRearrangement->items as $item) {
                $pallet = Pallet::find($item->pallet_id);
                if ($pallet) {
                    $qtyIn = (float) $item->quantity_in;
                    $qtyOut = (float) $item->quantity_out;

                    $revertedQty = max(0, $pallet->current_quantity - $qtyIn + $qtyOut);
                    $pallet->update([
                        'current_quantity' => $revertedQty,
                    ]);
                }
            }

            InventoryEntry::where('voucher_type', PalletRearrangement::class)
                ->where('voucher_id', $palletRearrangement->id)
                ->delete();

            $palletRearrangement->update([
                'status'      => 'draft',
                'approved_by' => null,
                'approved_at' => null,
            ]);
        });

        return back()->with('success', 'تم فك اعتماد سند ترتيب الطبالي وإلغاء حركات النقل بنجاح.');
    }

    public function destroy(PalletRearrangement $palletRearrangement)
    {
        if ($palletRearrangement->status === 'approved') {
            return back()->with('error', 'لا يمكن حذف سند معتمد ومثبت.');
        }

        DB::transaction(function () use ($palletRearrangement) {
            $palletRearrangement->items()->delete();
            $palletRearrangement->delete();
        });

        return redirect()->route('pallet-rearrangements.index')->with('success', 'تم حذف سند ترتيب الطبالي.');
    }

    public function getContractRearrangementOptions(Contract $contract)
    {
        $entries = InventoryEntry::query()
            ->whereHasMorph('voucher', [
                \App\Models\Reception::class,
                \App\Models\Delivery::class,
                \App\Models\InventoryAdjustment::class,
                \App\Models\PalletRearrangement::class
            ], function ($q) use ($contract) {
                $q->where('contract_id', $contract->id);
            })
            ->with(['inventoryItem', 'variant', 'pallet'])
            ->get();

        $contractPalletIds = $entries->pluck('pallet_id')->filter()->unique();

        $palletBalances = [];
        $itemVariantBalances = [];

        foreach ($entries as $e) {
            if ($e->pallet_id) {
                if (!isset($palletBalances[$e->pallet_id])) {
                    $palletBalances[$e->pallet_id] = 0;
                }
                $palletBalances[$e->pallet_id] += ($e->quantity_in - $e->quantity_out);
            }

            $itemKey = $e->inventory_item_id . '_' . $e->inventory_item_variant_id;
            if (!isset($itemVariantBalances[$itemKey])) {
                $itemVariantBalances[$itemKey] = [
                    'item' => $e->inventoryItem,
                    'variant' => $e->variant,
                    'balance' => 0,
                ];
            }
            $itemVariantBalances[$itemKey]['balance'] += ($e->quantity_in - $e->quantity_out);
        }

        $availablePalletIds = array_keys(array_filter($palletBalances, fn($bal) => $bal > 0));
        
        $targetPalletIds = count($availablePalletIds) > 0 ? $availablePalletIds : $contractPalletIds;
        $pallets = Pallet::whereIn('id', $targetPalletIds)
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'pallet_number' => $p->pallet_number ?: (string)$p->id,
                'code' => $p->code ?: (string)$p->id,
                'balance' => $palletBalances[$p->id] ?? 0,
            ]);

        $availableItems = [];
        $availableVariants = [];

        foreach ($itemVariantBalances as $key => $data) {
            if ($data['balance'] > 0 && $data['item'] && $data['variant']) {
                $itemObj = $data['item'];
                $varObj = $data['variant'];

                if (!isset($availableItems[$itemObj->id])) {
                    $availableItems[$itemObj->id] = [
                        'id' => $itemObj->id,
                        'name' => $itemObj->name,
                        'code' => $itemObj->code,
                    ];
                }

                $variantDisplayName = $varObj->name;
                if ($varObj->quality && !str_contains($variantDisplayName, $varObj->quality)) {
                    $variantDisplayName .= ' | ' . $varObj->quality;
                }

                $availableVariants[] = [
                    'id' => $varObj->id,
                    'inventory_item_id' => $itemObj->id,
                    'name' => $variantDisplayName,
                    'code' => $varObj->code,
                ];
            }
        }

        if (empty($availableItems)) {
            $allItems = InventoryItem::with('variants')->get();
            foreach ($allItems as $inv) {
                $availableItems[$inv->id] = [
                    'id' => $inv->id,
                    'name' => $inv->name,
                    'code' => $inv->code,
                ];
                foreach ($inv->variants as $v) {
                    $vName = $v->name;
                    if ($v->quality && !str_contains($vName, $v->quality)) {
                        $vName .= ' | ' . $v->quality;
                    }
                    $availableVariants[] = [
                        'id' => $v->id,
                        'inventory_item_id' => $inv->id,
                        'name' => $vName,
                        'code' => $v->code,
                    ];
                }
            }
        }

        if ($pallets->isEmpty()) {
            $pallets = Pallet::all()->map(fn($p) => [
                'id' => $p->id,
                'pallet_number' => $p->pallet_number ?: (string)$p->id,
                'code' => $p->code ?: (string)$p->id,
                'balance' => 0,
            ]);
        }

        return response()->json([
            'pallets'  => array_values($pallets->toArray()),
            'items'    => array_values($availableItems),
            'variants' => $availableVariants,
        ]);
    }
}
