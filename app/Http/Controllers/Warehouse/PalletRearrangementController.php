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
            'items'             => 'required|array|min:2',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_id'                 => 'required|exists:pallets,id',
            'items.*.type'                      => 'required|in:in,out',
            'items.*.quantity'                  => 'required|numeric|gt:0',
            'items.*.notes'                     => 'nullable|string',
        ]);

        // Balance Check: Verify that for each (item + variant), Total OUT == Total IN
        $groupedTotals = [];
        foreach ($request->items as $item) {
            $key = $item['inventory_item_id'] . '_' . $item['inventory_item_variant_id'];
            if (!isset($groupedTotals[$key])) {
                $groupedTotals[$key] = ['in' => 0, 'out' => 0];
            }

            $qty = (float) $item['quantity'];
            if ($item['type'] === 'in') {
                $groupedTotals[$key]['in'] += $qty;
            } else {
                $groupedTotals[$key]['out'] += $qty;
            }
        }

        foreach ($groupedTotals as $key => $totals) {
            if (round($totals['in'], 2) !== round($totals['out'], 2)) {
                return back()->withErrors([
                    'items' => 'خطأ في التوازن: يجب أن تتساوى إجمالي الكميات المحولة للداخل (مدخلات) مع إجمالي الكميات المحولة للخارج (مخرجات) لكل صنف ودرجة لضمان عدم تغيير رصيد العقد!'
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
                $rearrangement->items()->create([
                    'inventory_item_id'         => $itemData['inventory_item_id'],
                    'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                    'pallet_id'                 => $itemData['pallet_id'],
                    'type'                      => $itemData['type'],
                    'quantity'                  => $itemData['quantity'],
                    'notes'                     => $itemData['notes'] ?? null,
                ]);
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
            'items'             => 'required|array|min:2',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_id'                 => 'required|exists:pallets,id',
            'items.*.type'                      => 'required|in:in,out',
            'items.*.quantity'                  => 'required|numeric|gt:0',
            'items.*.notes'                     => 'nullable|string',
        ]);

        $groupedTotals = [];
        foreach ($request->items as $item) {
            $key = $item['inventory_item_id'] . '_' . $item['inventory_item_variant_id'];
            if (!isset($groupedTotals[$key])) {
                $groupedTotals[$key] = ['in' => 0, 'out' => 0];
            }

            $qty = (float) $item['quantity'];
            if ($item['type'] === 'in') {
                $groupedTotals[$key]['in'] += $qty;
            } else {
                $groupedTotals[$key]['out'] += $qty;
            }
        }

        foreach ($groupedTotals as $key => $totals) {
            if (round($totals['in'], 2) !== round($totals['out'], 2)) {
                return back()->withErrors([
                    'items' => 'خطأ في التوازن: يجب أن تتساوى إجمالي المدخلات مع المخرجات لكل صنف ودرجة لضمان عدم تغيير كمية العقد الكلية!'
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
                $palletRearrangement->items()->create([
                    'inventory_item_id'         => $itemData['inventory_item_id'],
                    'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                    'pallet_id'                 => $itemData['pallet_id'],
                    'type'                      => $itemData['type'],
                    'quantity'                  => $itemData['quantity'],
                    'notes'                     => $itemData['notes'] ?? null,
                ]);
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
                $qty = (float) $item->quantity;

                if ($item->type === 'in') {
                    InventoryEntry::create([
                        'inventory_item_id'         => $item->inventory_item_id,
                        'inventory_item_variant_id' => $item->inventory_item_variant_id,
                        'pallet_id'                 => $item->pallet_id,
                        'voucher_type'              => PalletRearrangement::class,
                        'voucher_id'                => $palletRearrangement->id,
                        'quantity_in'               => $qty,
                        'quantity_out'              => 0,
                        'operation_date'            => $palletRearrangement->rearrangement_date,
                    ]);
                } else {
                    InventoryEntry::create([
                        'inventory_item_id'         => $item->inventory_item_id,
                        'inventory_item_variant_id' => $item->inventory_item_variant_id,
                        'pallet_id'                 => $item->pallet_id,
                        'voucher_type'              => PalletRearrangement::class,
                        'voucher_id'                => $palletRearrangement->id,
                        'quantity_in'               => 0,
                        'quantity_out'              => $qty,
                        'operation_date'            => $palletRearrangement->rearrangement_date,
                    ]);
                }

                // Update physical pallet current_quantity in DB
                $pallet = Pallet::find($item->pallet_id);
                if ($pallet) {
                    $newQty = $item->type === 'in' 
                        ? ($pallet->current_quantity + $qty) 
                        : max(0, $pallet->current_quantity - $qty);

                    $pallet->update([
                        'current_quantity' => $newQty,
                    ]);
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
                    $qty = (float) $item->quantity;
                    // Revert current_quantity logic
                    $revertedQty = $item->type === 'in'
                        ? max(0, $pallet->current_quantity - $qty)
                        : ($pallet->current_quantity + $qty);

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
}
