<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use App\Traits\ValidatesSecureDeletion;

class InventoryItemController extends Controller
{
    use ValidatesSecureDeletion;

    public function index()
    {
        $items = InventoryItem::with(['category', 'variants'])->latest()->get();
        $categories = InventoryCategory::with('parent')->latest()->get();
        
        return Inertia::render('InventoryItems/Index', compact('items', 'categories'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'category_id'    => 'nullable|exists:inventory_categories,id',
            'image'          => 'nullable|image|max:2048',
            'is_active'      => 'boolean',
            'variants'       => 'nullable|array',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.quality' => 'nullable|string|max:255',
            'variants.*.default_price' => 'required|numeric|min:0',
            'variants.*.is_active' => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['updated_by'] = auth()->id();

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_inv_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/inventory_items'), $filename);
            $validated['image'] = '/uploads/inventory_items/' . $filename;
        }

        $item = InventoryItem::create($validated);

        if (!empty($request->variants)) {
            foreach ($request->variants as $v) {
                $item->variants()->create([
                    'name'          => $v['name'],
                    'quality'       => $v['quality'] ?? null,
                    'default_price' => $v['default_price'],
                    'is_active'     => $v['is_active'] ?? true,
                    'created_by'    => auth()->id(),
                    'updated_by'    => auth()->id(),
                ]);
            }
        }

        return redirect()->back()->with('success', 'تم إضافة الصنف المخزني بنجاح.');
    }

    public function show(Request $request, InventoryItem $inventory_item)
    {
        $inventory_item->load(['category', 'variants']);

        // 1. General Aggregates per Variant (Total In, Total Out, Balance)
        $variantAggregates = \App\Models\InventoryEntry::where('inventory_item_id', $inventory_item->id)
            ->selectRaw('
                inventory_item_variant_id,
                SUM(quantity_in) as total_in,
                SUM(quantity_out) as total_out,
                (SUM(quantity_in) - SUM(quantity_out)) as current_balance,
                COUNT(DISTINCT contract_id) as contracts_count
            ')
            ->groupBy('inventory_item_variant_id')
            ->get()
            ->keyBy('inventory_item_variant_id');

        // Active pallets holding positive stock per variant
        $activePalletsByVariant = \App\Models\InventoryEntry::where('inventory_item_id', $inventory_item->id)
            ->whereNotNull('pallet_id')
            ->selectRaw('inventory_item_variant_id, pallet_id, (SUM(quantity_in) - SUM(quantity_out)) as bal')
            ->groupBy('inventory_item_variant_id', 'pallet_id')
            ->havingRaw('(SUM(quantity_in) - SUM(quantity_out)) > 0')
            ->get()
            ->groupBy('inventory_item_variant_id')
            ->map(fn($group) => $group->count());

        $totalStock = 0;
        $totalIn = 0;
        $totalOut = 0;

        $variantsData = $inventory_item->variants->map(function ($variant) use ($variantAggregates, $activePalletsByVariant, &$totalStock, &$totalIn, &$totalOut) {
            $agg = $variantAggregates->get($variant->id);
            $in = $agg ? (float) $agg->total_in : 0.0;
            $out = $agg ? (float) $agg->total_out : 0.0;
            $bal = $agg ? (float) $agg->current_balance : 0.0;
            $contracts = $agg ? (int) $agg->contracts_count : 0;
            $pallets = $activePalletsByVariant->get($variant->id, 0);

            if ($bal > 0) {
                $totalStock += $bal;
            }
            $totalIn += $in;
            $totalOut += $out;

            return [
                'id'              => $variant->id,
                'name'            => $variant->name,
                'carton_size'     => $variant->name,
                'quality'         => $variant->quality,
                'code'            => $variant->code,
                'default_price'   => (float) $variant->default_price,
                'is_active'       => $variant->is_active,
                'total_in'        => $in,
                'total_out'       => $out,
                'balance'         => $bal,
                'pallets_count'   => $pallets,
                'contracts_count' => $contracts,
            ];
        });

        // Compute percentage of total stock for each variant
        $variantsData = $variantsData->map(function ($v) use ($totalStock) {
            $v['percentage'] = $totalStock > 0 && $v['balance'] > 0 
                ? round(($v['balance'] / $totalStock) * 100, 1) 
                : 0;
            return $v;
        });

        // Distinct overall pallets currently holding positive stock of this item
        $totalActivePallets = \App\Models\InventoryEntry::where('inventory_item_id', $inventory_item->id)
            ->whereNotNull('pallet_id')
            ->selectRaw('pallet_id, (SUM(quantity_in) - SUM(quantity_out)) as bal')
            ->groupBy('pallet_id')
            ->havingRaw('(SUM(quantity_in) - SUM(quantity_out)) > 0')
            ->get()
            ->count();

        // 2. Detailed Breakdown: Grouped by Contract, Carton Size (Variant Name), and Quality
        $breakdownRows = \App\Models\InventoryEntry::where('inventory_item_id', $inventory_item->id)
            ->whereNotNull('contract_id')
            ->selectRaw('
                contract_id,
                inventory_item_variant_id,
                SUM(quantity_in) as total_in,
                SUM(quantity_out) as total_out,
                (SUM(quantity_in) - SUM(quantity_out)) as current_balance
            ')
            ->groupBy('contract_id', 'inventory_item_variant_id')
            ->havingRaw('(SUM(quantity_in) - SUM(quantity_out)) > 0')
            ->with([
                'contract.customer',
                'variant'
            ])
            ->get();

        // Active pallets holding positive stock per (contract_id, variant_id)
        $activePalletsByContractVariant = \App\Models\InventoryEntry::where('inventory_item_id', $inventory_item->id)
            ->whereNotNull('contract_id')
            ->whereNotNull('pallet_id')
            ->selectRaw('contract_id, inventory_item_variant_id, pallet_id, (SUM(quantity_in) - SUM(quantity_out)) as bal')
            ->groupBy('contract_id', 'inventory_item_variant_id', 'pallet_id')
            ->havingRaw('(SUM(quantity_in) - SUM(quantity_out)) > 0')
            ->get();

        $palletsCountLookup = [];
        $contractDistinctPallets = [];
        foreach ($activePalletsByContractVariant as $pEntry) {
            $key = $pEntry->contract_id . '_' . $pEntry->inventory_item_variant_id;
            $palletsCountLookup[$key] = ($palletsCountLookup[$key] ?? 0) + 1;

            if (!isset($contractDistinctPallets[$pEntry->contract_id])) {
                $contractDistinctPallets[$pEntry->contract_id] = [];
            }
            $contractDistinctPallets[$pEntry->contract_id][$pEntry->pallet_id] = true;
        }

        // Group rows by contract
        $groupedContracts = [];
        foreach ($breakdownRows as $row) {
            $cId = $row->contract_id;
            if (!isset($groupedContracts[$cId])) {
                $contract = $row->contract;
                $groupedContracts[$cId] = [
                    'contract_id'     => $cId,
                    'contract_number' => $contract ? $contract->contract_number : "CNT-{$cId}",
                    'customer_id'     => $contract ? $contract->customer_id : null,
                    'customer_name'   => $contract && $contract->customer ? $contract->customer->name : '—',
                    'contract_status' => $contract ? $contract->status : '—',
                    'total_packages'  => 0,
                    'pallets_count'   => isset($contractDistinctPallets[$cId]) ? count($contractDistinctPallets[$cId]) : 0,
                    'rows'            => [],
                ];
            }

            $bal = (float) $row->current_balance;
            $groupedContracts[$cId]['total_packages'] += $bal;

            $pCountKey = $cId . '_' . $row->inventory_item_variant_id;
            $rowPallets = $palletsCountLookup[$pCountKey] ?? 0;

            $groupedContracts[$cId]['rows'][] = [
                'variant_id'   => $row->inventory_item_variant_id,
                'carton_size'  => $row->variant ? $row->variant->name : '—',
                'quality'      => $row->variant ? $row->variant->quality : '—',
                'variant_code' => $row->variant ? $row->variant->code : '—',
                'balance'      => $bal,
                'total_in'     => (float) $row->total_in,
                'total_out'    => (float) $row->total_out,
                'pallets_count'=> $rowPallets,
            ];
        }

        $contractsList = collect(array_values($groupedContracts))->sortByDesc('total_packages')->values();

        // Extract distinct carton sizes and qualities for filter dropdowns in UI
        $distinctCartonSizes = $inventory_item->variants->pluck('name')->filter()->unique()->values();
        $distinctQualities = $inventory_item->variants->pluck('quality')->filter()->unique()->values();

        return Inertia::render('InventoryItems/Show', [
            'item' => $inventory_item,
            'analytics' => [
                'summary' => [
                    'total_stock'     => $totalStock,
                    'total_in'        => $totalIn,
                    'total_out'       => $totalOut,
                    'total_pallets'   => $totalActivePallets,
                    'total_contracts' => count($contractsList),
                    'variants_count'  => $inventory_item->variants->count(),
                ],
                'variants'             => $variantsData,
                'contracts'            => $contractsList,
                'distinctCartonSizes'  => $distinctCartonSizes,
                'distinctQualities'    => $distinctQualities,
            ]
        ]);
    }

    public function update(Request $request, InventoryItem $inventory_item)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'category_id'    => 'nullable|exists:inventory_categories,id',
            'image_file'     => 'nullable|image|max:2048',
            'is_active'      => 'boolean',
            'variants'       => 'nullable|array',
            'variants.*.id'  => 'nullable|integer',
            'variants.*.name' => 'required|string|max:255',
            'variants.*.quality' => 'nullable|string|max:255',
            'variants.*.default_price' => 'required|numeric|min:0',
            'variants.*.is_active' => 'boolean',
        ]);

        $validated['updated_by'] = auth()->id();

        $imageKey = $request->hasFile('image_file') ? 'image_file' : ($request->hasFile('image') ? 'image' : null);
        if ($imageKey) {
            if (!empty($inventory_item->image) && File::exists(public_path($inventory_item->image))) {
                File::delete(public_path($inventory_item->image));
            }
            $file = $request->file($imageKey);
            $filename = time() . '_inv_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/inventory_items'), $filename);
            $validated['image'] = '/uploads/inventory_items/' . $filename;
        }

        $inventory_item->update($validated);

        $variantIds = [];
        if (!empty($request->variants)) {
            foreach ($request->variants as $v) {
                $variantData = [
                    'name'          => $v['name'],
                    'quality'       => $v['quality'] ?? null,
                    'default_price' => $v['default_price'],
                    'is_active'     => $v['is_active'] ?? true,
                    'updated_by'    => auth()->id(),
                ];

                if (empty($v['id'])) {
                    $variantData['created_by'] = auth()->id();
                    $newVariant = $inventory_item->variants()->create($variantData);
                    $variantIds[] = $newVariant->id;
                } else {
                    $variant = $inventory_item->variants()->find($v['id']);
                    if ($variant) {
                        $variant->update($variantData);
                        $variantIds[] = $variant->id;
                    }
                }
            }
        }
        
        $inventory_item->variants()->whereNotIn('id', $variantIds)->delete();

        return redirect()->back()->with('success', 'تم تحديث الصنف المخزني بنجاح.');
    }

    public function destroy(Request $request, InventoryItem $inventory_item)
    {
        $this->validateSecureDelete($request);

        if (!empty($inventory_item->image) && File::exists(public_path($inventory_item->image))) {
            File::delete(public_path($inventory_item->image));
        }

        $inventory_item->delete();

        return redirect()->back()->with('success', 'تم حذف الصنف المخزني بنجاح.');
    }

    public function updateVariant(Request $request, \App\Models\InventoryItemVariant $variant)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'quality'       => 'nullable|string|max:255',
            'default_price' => 'required|numeric|min:0',
            'is_active'     => 'required|boolean',
        ]);

        $variant->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الشكل بنجاح.');
    }
}
