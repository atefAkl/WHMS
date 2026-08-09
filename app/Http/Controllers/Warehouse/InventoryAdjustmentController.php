<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Contract;
use App\Models\InventoryAdjustment;
use App\Models\InventoryItem;
use App\Models\InventoryEntry;
use App\Models\Reception;
use App\Models\Delivery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryAdjustment::with(['customer', 'contract', 'period', 'createdByUser', 'approvedByUser'])
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

        $adjustments = $query->latest()->paginate(15)->withQueryString();

        $customers = Customer::where('status', 'active')->orderBy('name')->get();
        $contracts = Contract::where('status', 'active')->orderBy('contract_number')->get();

        return Inertia::render('Warehouse/Adjustments/Index', [
            'adjustments' => $adjustments,
            'customers'   => $customers,
            'contracts'   => $contracts,
            'filters'     => $request->only(['customer_id', 'contract_id', 'status', 'search']),
        ]);
    }

    public function create()
    {
        $customers = Customer::where('status', 'active')
            ->with(['contracts' => function ($q) {
                $q->where('status', 'active')->with(['periods']);
            }])
            ->orderBy('name')
            ->get();

        $inventoryItems = InventoryItem::with('variants')->get();
        $pallets = \App\Models\Pallet::all();

        return Inertia::render('Warehouse/Adjustments/CreateEdit', [
            'customers'      => $customers,
            'inventoryItems' => $inventoryItems,
            'pallets'        => $pallets,
            'isEdit'         => false,
            'adjustment'     => null,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'     => 'required|exists:customers,id',
            'contract_id'     => 'required|exists:contracts,id',
            'period_id'       => 'nullable|exists:contract_periods,id',
            'adjustment_date' => 'required|date',
            'reason'          => 'nullable|string',
            'proof_file'      => 'nullable|file|mimes:jpeg,png,jpg,pdf,doc,docx|max:20480',
            'items'           => 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_id'                 => 'required|exists:pallets,id',
            'items.*.system_quantity'           => 'required|numeric',
            'items.*.actual_quantity'           => 'required|numeric|min:0',
            'items.*.variance_quantity'         => 'required|numeric',
            'items.*.notes'                     => 'nullable|string',
        ]);

        $proofPath = null;
        if ($request->hasFile('proof_file')) {
            $file = $request->file('proof_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $directory = public_path('uploads/documents/adjustments');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            $file->move($directory, $filename);
            $proofPath = '/uploads/documents/adjustments/' . $filename;
        }

        // Determine adjustment type
        $hasSurplus = false;
        $hasDeficit = false;

        foreach ($request->items as $item) {
            $var = (float) $item['variance_quantity'];
            if ($var > 0) $hasSurplus = true;
            if ($var < 0) $hasDeficit = true;
        }

        $type = 'surplus';
        if ($hasSurplus && $hasDeficit) {
            $type = 'mixed';
        } elseif ($hasDeficit) {
            $type = 'deficit';
        }

        DB::transaction(function () use ($request, $validated, $proofPath, $type) {
            $adjustment = InventoryAdjustment::create([
                'customer_id'     => $request->customer_id,
                'contract_id'     => $request->contract_id,
                'period_id'       => $request->period_id,
                'adjustment_date' => $request->adjustment_date,
                'adjustment_type' => $type,
                'reason'          => $request->reason,
                'proof_file'      => $proofPath,
                'status'          => 'draft',
                'created_by'      => auth()->id(),
            ]);

            foreach ($request->items as $itemData) {
                $adjustment->items()->create([
                    'inventory_item_id'         => $itemData['inventory_item_id'],
                    'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                    'pallet_id'                 => $itemData['pallet_id'],
                    'system_quantity'           => $itemData['system_quantity'],
                    'actual_quantity'           => $itemData['actual_quantity'],
                    'variance_quantity'         => $itemData['variance_quantity'],
                    'notes'                     => $itemData['notes'] ?? null,
                ]);
            }
        });

        return redirect()->route('inventory-adjustments.index')->with('success', 'تم إنشاء مسودة سند التسوية بنجاح.');
    }

    public function show(InventoryAdjustment $inventoryAdjustment)
    {
        $inventoryAdjustment->load([
            'customer',
            'contract',
            'period',
            'createdByUser',
            'approvedByUser',
            'items.inventoryItem',
            'items.variant',
            'items.pallet'
        ]);

        return Inertia::render('Warehouse/Adjustments/Show', [
            'adjustment' => $inventoryAdjustment,
        ]);
    }

    public function approve(InventoryAdjustment $inventoryAdjustment)
    {
        if ($inventoryAdjustment->status === 'approved') {
            return back()->with('error', 'سند التسوية معتمد مسبقاً.');
        }

        DB::transaction(function () use ($inventoryAdjustment) {
            $inventoryAdjustment->update([
                'status'      => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Post inventory ledger entries for variance
            foreach ($inventoryAdjustment->items as $item) {
                $var = (float) $item->variance_quantity;
                if ($var === 0.0) continue;

                $quantityIn  = $var > 0 ? $var : 0;
                $quantityOut = $var < 0 ? abs($var) : 0;

                InventoryEntry::create([
                    'inventory_item_id'         => $item->inventory_item_id,
                    'inventory_item_variant_id' => $item->inventory_item_variant_id,
                    'pallet_id'                 => $item->pallet_id,
                    'voucher_type'              => InventoryAdjustment::class,
                    'voucher_id'                => $inventoryAdjustment->id,
                    'quantity_in'               => $quantityIn,
                    'quantity_out'              => $quantityOut,
                    'operation_date'            => $inventoryAdjustment->adjustment_date,
                ]);
            }
        });

        return back()->with('success', 'تم اعتماد سند التسوية وقيد الفروقات المخزنية بنجاح.');
    }

    public function destroy(InventoryAdjustment $inventoryAdjustment)
    {
        if ($inventoryAdjustment->status === 'approved') {
            return back()->with('error', 'لا يمكن حذف سند تسوية معتمد ومرحل.');
        }

        $inventoryAdjustment->delete();

        return redirect()->route('inventory-adjustments.index')->with('success', 'تم حذف سند التسوية.');
    }
}
