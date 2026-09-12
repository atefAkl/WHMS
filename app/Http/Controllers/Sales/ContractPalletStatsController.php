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
        $allSizesSet = collect();

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

            $bookedBySize = [];
            $usedBySize = [];
            $remainingBySize = [];

            $totalBooked = 0;
            $totalUsed = 0;
            $totalRemaining = 0;

            if ($periodItems->count() === 1) {
                // Single item in contract: all occupied pallets belong to this item
                $item = $periodItems->first();
                $rawLabel = $item->short_name ?: ($item->storageItem->short_name ?? $item->storageItem->name_ar ?? 'طبلية');
                
                $sizeKey = $rawLabel;
                if (mb_strpos($rawLabel, 'صغير') !== false || mb_strpos($rawLabel, 'سمول') !== false) {
                    $sizeKey = 'صغيرة';
                } elseif (mb_strpos($rawLabel, 'كبير') !== false || mb_strpos($rawLabel, 'لارج') !== false) {
                    $sizeKey = 'كبيرة';
                } elseif (mb_strpos($rawLabel, 'وسط') !== false || mb_strpos($rawLabel, 'ميديوم') !== false) {
                    $sizeKey = 'وسط';
                }

                $allSizesSet->push($sizeKey);

                $booked = (int) ($item->unit_count ?? 0);
                $used = $totalOccupiedPalletsCount;
                $remaining = max(0, $booked - $used);

                $bookedBySize[$sizeKey] = $booked;
                $usedBySize[$sizeKey] = $used;
                $remainingBySize[$sizeKey] = $remaining;

                $totalBooked = $booked;
                $totalUsed = $used;
                $totalRemaining = $remaining;
            } elseif ($periodItems->count() > 1) {
                // Multiple items in contract: match per size category
                $assignedUsedCount = 0;

                foreach ($periodItems as $item) {
                    $rawLabel = $item->short_name ?: ($item->storageItem->short_name ?? $item->storageItem->name_ar ?? 'طبلية');
                    
                    $sizeKey = $rawLabel;
                    if (mb_strpos($rawLabel, 'صغير') !== false || mb_strpos($rawLabel, 'سمول') !== false) {
                        $sizeKey = 'صغيرة';
                    } elseif (mb_strpos($rawLabel, 'كبير') !== false || mb_strpos($rawLabel, 'لارج') !== false) {
                        $sizeKey = 'كبيرة';
                    } elseif (mb_strpos($rawLabel, 'وسط') !== false || mb_strpos($rawLabel, 'ميديوم') !== false) {
                        $sizeKey = 'وسط';
                    }

                    $allSizesSet->push($sizeKey);

                    $booked = (int) ($item->unit_count ?? 0);

                    // Match occupied pallets by sizeKey or label or partial string
                    $used = $occupiedPallets[$sizeKey] ?? $occupiedPallets[$rawLabel] ?? 0;
                    if ($used === 0 && !empty($occupiedPallets)) {
                        foreach ($occupiedPallets as $sz => $cnt) {
                            if ($sz && (str_contains($sizeKey, $sz) || str_contains($sz, $sizeKey) || str_contains($rawLabel, $sz))) {
                                $used += $cnt;
                            }
                        }
                    }

                    $remaining = max(0, $booked - $used);

                    $bookedBySize[$sizeKey] = ($bookedBySize[$sizeKey] ?? 0) + $booked;
                    $usedBySize[$sizeKey] = ($usedBySize[$sizeKey] ?? 0) + $used;
                    $remainingBySize[$sizeKey] = ($remainingBySize[$sizeKey] ?? 0) + $remaining;

                    $totalBooked += $booked;
                    $totalUsed += $used;
                    $totalRemaining += $remaining;

                    $assignedUsedCount += $used;
                }

                // If items exist but size matching didn't catch all occupied pallets (e.g. size string mismatches)
                if ($totalOccupiedPalletsCount > $assignedUsedCount && $totalUsed < $totalOccupiedPalletsCount) {
                    $unassigned = $totalOccupiedPalletsCount - $assignedUsedCount;
                    $totalUsed = $totalOccupiedPalletsCount;
                    $totalRemaining = max(0, $totalBooked - $totalUsed);
                    
                    $firstKey = array_key_first($usedBySize);
                    if ($firstKey) {
                        $usedBySize[$firstKey] += $unassigned;
                        $remainingBySize[$firstKey] = max(0, ($bookedBySize[$firstKey] ?? 0) - $usedBySize[$firstKey]);
                    }
                }
            }

            // Fallback if no items configured at all in contract/periods but occupied pallets exist
            if ($totalBooked === 0 && $totalOccupiedPalletsCount > 0) {
                $sizeKey = 'عامة';
                $allSizesSet->push($sizeKey);
                $bookedBySize[$sizeKey] = $totalOccupiedPalletsCount;
                $usedBySize[$sizeKey] = $totalOccupiedPalletsCount;
                $remainingBySize[$sizeKey] = 0;
                $totalBooked = $totalOccupiedPalletsCount;
                $totalUsed = $totalOccupiedPalletsCount;
                $totalRemaining = 0;
            }

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

        // Ensure default sizes "صغيرة", "كبيرة" exist if set is empty
        $allSizes = $allSizesSet->unique()->values()->all();
        if (empty($allSizes)) {
            $allSizes = ['صغيرة', 'كبيرة'];
        }

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
