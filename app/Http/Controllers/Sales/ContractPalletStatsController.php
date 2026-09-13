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
use App\Models\InventoryEntry;
use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ContractPalletStatsController extends Controller
{
    public function index(Request $request)
    {
        $query = Contract::with(['customer', 'periods.items.storageItem', 'items.storageItem']);

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

        $contracts = $query->orderBy('contract_number', 'asc')->get();

        // Helper voucher morph classes for contract matching
        $voucherMorphClasses = [
            Reception::class,
            Delivery::class,
            InventoryAdjustment::class,
            PalletRearrangement::class,
            \App\Models\ContractTransfer::class,
        ];

        // Global list of unique pallet size categories found across active/selected contracts
        $allSizesSet = collect(['كبيرة', 'صغيرة']);

        // Calculate detailed stats per contract
        $reportData = $contracts->map(function ($contract) use ($voucherMorphClasses, &$allSizesSet) {
            // Determine active period or contract items
            $activePeriod = $contract->periods->where('status', 'active')->first()
                ?? $contract->periods->sortByDesc('start_date')->first();

            $periodItems = ($activePeriod && $activePeriod->items->count() > 0)
                ? $activePeriod->items 
                : $contract->items;

            // Fetch pallet IDs that have active stock balances for this contract
            $occupiedPalletIds = InventoryEntry::whereHasMorph('voucher', $voucherMorphClasses, function ($vQuery) use ($contract) {
                $vQuery->where('contract_id', $contract->id);
            })
            ->whereNotNull('pallet_id')
            ->select('pallet_id')
            ->groupBy('pallet_id')
            ->havingRaw('SUM(quantity_in - quantity_out) > 0')
            ->pluck('pallet_id');

            $totalOccupiedPalletsCount = $occupiedPalletIds->count();

            // Group occupied pallets by size
            $occupiedPallets = [];
            if ($totalOccupiedPalletsCount > 0) {
                $occupiedPallets = Pallet::whereIn('id', $occupiedPalletIds)
                    ->select('size', DB::raw('count(*) as count'))
                    ->groupBy('size')
                    ->pluck('count', 'size')
                    ->all();
            }

            // Push occupied pallet sizes to global set
            foreach (array_keys($occupiedPallets) as $szName) {
                if ($szName) {
                    $allSizesSet->push($szName);
                }
            }

            $rawBookedBySize = [];
            foreach ($periodItems as $item) {
                $rawLabel = $item->short_name ?: ($item->storageItem->short_name ?? $item->storageItem->name_ar ?? 'طبلية');
                $sizeKey = 'كبيرة';
                if (mb_strpos($rawLabel, 'صغير') !== false || mb_strpos($rawLabel, 'سمول') !== false) {
                    $sizeKey = 'صغيرة';
                } elseif (mb_strpos($rawLabel, 'وسط') !== false || mb_strpos($rawLabel, 'ميديوم') !== false) {
                    $sizeKey = 'وسط';
                }
                $allSizesSet->push($sizeKey);
                $booked = (int) ($item->unit_count ?? 0);
                $rawBookedBySize[$sizeKey] = ($rawBookedBySize[$sizeKey] ?? 0) + $booked;
            }

            // Determine canonical sizes list for this contract
            $currentSizes = $allSizesSet->unique()->values()->all();

            $bookedBySize = [];
            $usedBySize = [];
            $remainingBySize = [];

            foreach ($currentSizes as $sz) {
                $used = $occupiedPallets[$sz] ?? 0;
                $booked = $rawBookedBySize[$sz] ?? ($used > 0 ? $used : 0);
                $remaining = max(0, $booked - $used);

                $bookedBySize[$sz] = $booked;
                $usedBySize[$sz] = $used;
                $remainingBySize[$sz] = $remaining;
            }

            $totalBooked = array_sum($bookedBySize);
            $totalUsed = array_sum($usedBySize);
            $totalRemaining = array_sum($remainingBySize);
            $utilizationRate = $totalBooked > 0 ? round(($totalUsed / $totalBooked) * 100, 1) : 0;

            return [
                'id' => $contract->id,
                'contract_number' => $contract->contract_number,
                'status' => $contract->status,
                'customer_id' => $contract->customer_id,
                'customer_name' => $contract->customer ? $contract->customer->name : '—',
                'customer_phone' => $contract->customer ? $contract->customer->phone_number : '—',
                'booked_by_size' => $bookedBySize,
                'used_by_size' => $usedBySize,
                'remaining_by_size' => $remainingBySize,
                'total_booked' => $totalBooked,
                'total_used' => $totalUsed,
                'total_remaining' => $totalRemaining,
                'utilization_rate' => $utilizationRate,
            ];
        });

        // Unique size columns across all contracts
        $allSizes = $allSizesSet->unique()->values()->all();

        // Overall summary statistics
        $overallBooked = $reportData->sum('total_booked');
        $overallUsed = $reportData->sum('total_used');
        $overallRemaining = $reportData->sum('total_remaining');
        $overallRate = $overallBooked > 0 ? round(($overallUsed / $overallBooked) * 100, 1) : 0;

        $customers = Customer::orderBy('name')->select('id', 'name')->get();
        $companySettings = ContractSetting::pluck('value', 'key')->all();

        return Inertia::render('Sales/ContractPalletStats/Index', [
            'reportData' => $reportData,
            'allSizes' => $allSizes,
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
