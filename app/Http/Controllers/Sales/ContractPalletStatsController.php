<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Pallet;
use App\Models\Reception;
use App\Models\Delivery;
use App\Models\InventoryAdjustment;
use App\Models\PalletRearrangement;
use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ContractPalletStatsController extends Controller
{
    public function index(Request $request)
    {
        $query = Contract::with(['customer', 'periods' => function ($q) {
            $q->where('status', 'active')->with(['items.storageItem']);
        }, 'items.storageItem']);

        // Default: active and ended contracts only as requested
        if ($request->filled('status') && in_array($request->status, ['active', 'ended', 'draft'])) {
            $query->where('status', $request->status);
        } else {
            $query->whereIn('status', ['active', 'ended']);
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('contract_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($c) use ($search) {
                      $c->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $contracts = $query->orderBy('updated_at', 'desc')->get();

        // Helper voucher morph classes for contract matching
        $voucherMorphClasses = [
            Reception::class,
            Delivery::class,
            InventoryAdjustment::class,
            PalletRearrangement::class,
        ];

        // Calculate detailed stats per contract
        $reportData = $contracts->map(function ($contract) use ($voucherMorphClasses) {
            // Determine active period or contract items
            $activePeriod = $contract->periods->first();
            $periodItems = $activePeriod && $activePeriod->items->count() > 0 
                ? $activePeriod->items 
                : $contract->items;

            // Fetch pallets with active stock balances for this contract via polymorphic voucher relationship
            $occupiedPallets = Pallet::whereHas('inventoryEntries', function ($q) use ($contract, $voucherMorphClasses) {
                $q->whereHasMorph('voucher', $voucherMorphClasses, function ($vQuery) use ($contract) {
                    $vQuery->where('contract_id', $contract->id);
                });
            })
            ->whereHas('inventoryEntries', function ($q) {
                $q->select('pallet_id', DB::raw('SUM(quantity_in - quantity_out) as balance'))
                  ->groupBy('pallet_id')
                  ->having('balance', '>', 0);
            })
            ->select('size', DB::raw('count(*) as count'))
            ->groupBy('size')
            ->pluck('count', 'size')
            ->all();

            $totalOccupiedPalletsCount = Pallet::whereHas('inventoryEntries', function ($q) use ($contract, $voucherMorphClasses) {
                $q->whereHasMorph('voucher', $voucherMorphClasses, function ($vQuery) use ($contract) {
                    $vQuery->where('contract_id', $contract->id);
                });
            })
            ->whereHas('inventoryEntries', function ($q) {
                $q->select('pallet_id', DB::raw('SUM(quantity_in - quantity_out) as balance'))
                  ->groupBy('pallet_id')
                  ->having('balance', '>', 0);
            })
            ->count();

            $itemsBreakdown = [];
            $totalBooked = 0;
            $totalUsed = 0;
            $totalRemaining = 0;

            foreach ($periodItems as $item) {
                $label = $item->short_name ?: ($item->storageItem->short_name ?? $item->storageItem->name_ar ?? 'طبلية');
                $booked = (int) ($item->unit_count ?? 0);

                // Match occupied pallets by size/label
                $used = $occupiedPallets[$label] ?? 0;
                if ($used === 0) {
                    foreach ($occupiedPallets as $sz => $cnt) {
                        if (str_contains($label, $sz) || str_contains($sz, $label)) {
                            $used += $cnt;
                        }
                    }
                }

                $remaining = max(0, $booked - $used);

                $totalBooked += $booked;
                $totalUsed += $used;
                $totalRemaining += $remaining;

                $itemsBreakdown[] = [
                    'label' => $label,
                    'full_name' => $item->storageItem->name_ar ?? $label,
                    'booked' => $booked,
                    'used' => $used,
                    'remaining' => $remaining,
                ];
            }

            // Fallback if no items configured but pallets exist
            if (empty($itemsBreakdown) && $totalOccupiedPalletsCount > 0) {
                $totalUsed = $totalOccupiedPalletsCount;
                $itemsBreakdown[] = [
                    'label' => 'طبالي عامة',
                    'full_name' => 'طبالي عامة',
                    'booked' => $totalUsed,
                    'used' => $totalUsed,
                    'remaining' => 0,
                ];
                $totalBooked = $totalUsed;
            }

            $utilizationRate = $totalBooked > 0 ? round(($totalUsed / $totalBooked) * 100, 1) : 0;

            return [
                'id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'status' => $contract->status,
                'customer_id' => $contract->customer_id,
                'customer_name' => $contract->customer ? $contract->customer->name : '—',
                'customer_phone' => $contract->customer ? $contract->customer->phone_number : '—',
                'items_breakdown' => $itemsBreakdown,
                'total_booked' => $totalBooked,
                'total_used' => $totalUsed,
                'total_remaining' => $totalRemaining,
                'utilization_rate' => $utilizationRate,
            ];
        });

        // Overall summary statistics
        $overallBooked = $reportData->sum('total_booked');
        $overallUsed = $reportData->sum('total_used');
        $overallRemaining = $reportData->sum('total_remaining');
        $overallRate = $overallBooked > 0 ? round(($overallUsed / $overallBooked) * 100, 1) : 0;

        $customers = Customer::orderBy('name')->select('id', 'name')->get();
        $companySettings = ContractSetting::pluck('value', 'key')->all();

        return Inertia::render('Sales/ContractPalletStats/Index', [
            'reportData' => $reportData,
            'summary' => [
                'total_booked' => $overallBooked,
                'total_used' => $overallUsed,
                'total_remaining' => $overallRemaining,
                'utilization_rate' => $overallRate,
            ],
            'customers' => $customers,
            'companySettings' => $companySettings,
            'filters' => $request->only(['status', 'customer_id', 'search']),
        ]);
    }
}
