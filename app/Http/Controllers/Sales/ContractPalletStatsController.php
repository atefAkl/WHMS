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

        // Global list of unique pallet size categories found across active/selected contracts
        $allSizesSet = collect();

        // Calculate detailed stats per contract
        $reportData = $contracts->map(function ($contract) use ($voucherMorphClasses, &$allSizesSet) {
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
                $q->select('pallet_id')
                  ->groupBy('pallet_id')
                  ->havingRaw('SUM(quantity_in - quantity_out) > 0');
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
                $q->select('pallet_id')
                  ->groupBy('pallet_id')
                  ->havingRaw('SUM(quantity_in - quantity_out) > 0');
            })
            ->count();

            $bookedBySize = [];
            $usedBySize = [];
            $remainingBySize = [];

            $totalBooked = 0;
            $totalUsed = 0;
            $totalRemaining = 0;

            foreach ($periodItems as $item) {
                // Determine size label using short_name or extracted name
                $rawLabel = $item->short_name ?: ($item->storageItem->short_name ?? $item->storageItem->name_ar ?? 'طبلية');
                
                // Clean size label (e.g. "صغيرة", "كبيرة", "وسط")
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

                // Match occupied pallets by sizeKey
                $used = $occupiedPallets[$sizeKey] ?? $occupiedPallets[$rawLabel] ?? 0;
                if ($used === 0) {
                    foreach ($occupiedPallets as $sz => $cnt) {
                        if (str_contains($sizeKey, $sz) || str_contains($sz, $sizeKey) || str_contains($rawLabel, $sz)) {
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
            }

            // Fallback if no items configured but pallets exist
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

        // Ensure default sizes "صغيرة", "كبيرة" exist if set is empty or small
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
