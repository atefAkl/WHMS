<?php

namespace App\Http\Controllers;

use App\Models\Pallet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use App\Traits\ValidatesSecureDeletion;

class PalletController extends Controller
{
    use ValidatesSecureDeletion;

    public function index(Request $request)
    {
        $query = Pallet::query();

        // Filters
        if ($request->filled('size')) {
            $query->where('size', $request->size);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('pallet_number', 'like', "%{$search}%")
                  ->orWhere('pallet_code', 'like', "%{$search}%");
            });
        }

        $pallets = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Pallets/Index', [
            'pallets' => $pallets,
            'filters' => $request->only(['size', 'search'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pallet_number' => 'required|string|max:50',
            'size'          => 'required|string|in:كبيرة,وسط,صغيرة,خشب,بلاستيك',
        ]);

        // Generate and verify unique pallet_code
        $sizeCodes = [
            'كبيرة' => '01',
            'وسط' => '02',
            'صغيرة' => '03',
            'خشب' => '04',
            'بلاستيك' => '05',
        ];
        $code = $sizeCodes[$request->size] ?? '02';
        $num = str_pad((string)$request->pallet_number, 5, '0', STR_PAD_LEFT);
        $palletCode = 'PAL' . $code . $num;

        $exists = Pallet::where('pallet_code', $palletCode)->exists();
        if ($exists) {
            return redirect()->back()->withErrors([
                'pallet_number' => 'كود الطبلية الناتج (' . $palletCode . ') مستخدم بالفعل.'
            ])->withInput();
        }

        Pallet::create($validated);

        return redirect()->back()->with('success', 'تم إنشاء الطبلية بنجاح.');
    }

    public function update(Request $request, Pallet $pallet)
    {
        $validated = $request->validate([
            'pallet_number' => 'required|string|max:50',
            'size'          => 'required|string|in:كبيرة,وسط,صغيرة,خشب,بلاستيك',
        ]);

        // Generate and verify unique pallet_code excluding current pallet
        $sizeCodes = [
            'كبيرة' => '01',
            'وسط' => '02',
            'صغيرة' => '03',
            'خشب' => '04',
            'بلاستيك' => '05',
        ];
        $code = $sizeCodes[$request->size] ?? '02';
        $num = str_pad((string)$request->pallet_number, 5, '0', STR_PAD_LEFT);
        $palletCode = 'PAL' . $code . $num;

        $exists = Pallet::where('pallet_code', $palletCode)
            ->where('id', '!=', $pallet->id)
            ->exists();
            
        if ($exists) {
            return redirect()->back()->withErrors([
                'pallet_number' => 'كود الطبلية الناتج (' . $palletCode . ') مستخدم بالفعل.'
            ])->withInput();
        }

        $pallet->update($validated);

        return redirect()->back()->with('success', 'تم تحديث بيانات الطبلية بنجاح.');
    }

    public function destroy(Request $request, Pallet $pallet)
    {
        $this->validateSecureDelete($request);

        // Verify if pallet has active inventory entries
        $hasEntries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)->exists();
        if ($hasEntries) {
            return redirect()->back()->with('error', 'لا يمكن حذف طبلية مسجل عليها حركات مخزون. يرجى تصفير الحركات أولاً.');
        }

        $pallet->delete();

        return redirect()->back()->with('success', 'تم حذف الطبلية بنجاح.');
    }

    public function show(Pallet $pallet)
    {
        // 1. Fetch all inventory entries for this pallet with vouchers & contracts
        $entries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)
            ->with([
                'inventoryItem',
                'variant',
                'voucher',
            ])
            ->orderBy('created_at', 'asc')
            ->get();

        // Calculate current total balance in warehouse
        $totalIn = (float) $entries->sum('quantity_in');
        $totalOut = (float) $entries->sum('quantity_out');
        $currentBalance = max(0.0, $totalIn - $totalOut);

        // Group entries by contract
        $contractsMap = [];
        $runningGlobalBalance = 0.0;

        foreach ($entries as $entry) {
            $voucher = $entry->voucher;
            $contractId = $voucher ? $voucher->contract_id : null;
            $contract = $voucher ? $voucher->contract : null;

            if (!$contractId || !$contract) {
                continue;
            }

            if (!isset($contractsMap[$contractId])) {
                $contract->load(['customer', 'periods', 'items.storageItem']);
                $contractsMap[$contractId] = [
                    'contract_id' => $contract->id,
                    'contract_number' => $contract->contract_number,
                    'customer_name' => $contract->customer ? $contract->customer->name : 'عميل غير محدد',
                    'start_date' => $contract->start_date ? $contract->start_date->toDateString() : null,
                    'end_date' => $contract->end_date ? $contract->end_date->toDateString() : null,
                    'mandatory_period' => $contract->mandatory_period,
                    'periods' => $contract->periods,
                    'first_registered_at' => $entry->created_at ? $entry->created_at->toDateTimeString() : null,
                    'first_reception_date' => null,
                    'last_activity_date' => null,
                    'entries' => [],
                    'running_contract_balance' => 0.0,
                    'monthly_rent_rate' => 0.0,
                ];

                // Get monthly rent rate for pallet storage in this contract
                $firstItem = $contract->items->first();
                if ($firstItem) {
                    $contractsMap[$contractId]['monthly_rent_rate'] = (float) $firstItem->monthly_rent;
                }
            }

            $in = (float) $entry->quantity_in;
            $out = (float) $entry->quantity_out;

            $contractsMap[$contractId]['running_contract_balance'] += ($in - $out);
            $runningContractBalance = $contractsMap[$contractId]['running_contract_balance'];

            $dateStr = $entry->created_at ? $entry->created_at->toDateString() : now()->toDateString();
            if ($entry->voucher_type === \App\Models\Reception::class && empty($contractsMap[$contractId]['first_reception_date'])) {
                $contractsMap[$contractId]['first_reception_date'] = $voucher->reception_date ?? $dateStr;
            }
            $contractsMap[$contractId]['last_activity_date'] = $dateStr;

            $contractsMap[$contractId]['entries'][] = [
                'id' => $entry->id,
                'voucher_type' => $entry->voucher_type === \App\Models\Reception::class ? 'استلام (إدخال)' : 'تسليم (خروج)',
                'voucher_serial' => $voucher ? $voucher->serial_number : '—',
                'voucher_date' => $voucher->reception_date ?? $voucher->delivery_date ?? $dateStr,
                'item_name' => $entry->inventoryItem ? $entry->inventoryItem->name : 'بضاعة عامة',
                'variant_name' => $entry->variant ? $entry->variant->variant_name : null,
                'quantity_in' => $in,
                'quantity_out' => $out,
                'running_balance' => $runningContractBalance,
                'batch_number' => $entry->batch_number,
                'created_at' => $entry->created_at ? $entry->created_at->toDateTimeString() : null,
            ];
        }

        // Calculate days stayed, periods cost, and timeline charts for each contract
        $contractsList = [];
        foreach ($contractsMap as $cData) {
            $firstDate = \Carbon\Carbon::parse($cData['first_reception_date'] ?? $cData['first_registered_at'] ?? now());
            $lastDate = \Carbon\Carbon::parse($cData['last_activity_date'] ?? now());
            $daysStayed = max(1, $firstDate->diffInDays($lastDate));

            // Calculate billing periods count
            $monthlyRate = $cData['monthly_rent_rate'] > 0 ? $cData['monthly_rent_rate'] : 50.0;
            $mandatoryMonths = max(1, (int) $cData['mandatory_period']);
            $monthsStayed = (int) ceil($daysStayed / 30.0);

            $mandatoryCost = $mandatoryMonths * $monthlyRate;
            $renewalMonths = max(0, $monthsStayed - $mandatoryMonths);
            $renewalCost = $renewalMonths * $monthlyRate;
            $totalCost = $mandatoryCost + $renewalCost;

            // Generate timeline chart points
            $timelineChart = [];
            $cumBalance = 0;
            $entryCount = count($cData['entries']);

            foreach ($cData['entries'] as $idx => $e) {
                $cumBalance = $e['running_balance'];
                $days = $firstDate->diffInDays(\Carbon\Carbon::parse($e['voucher_date']));
                $currentPeriod = $days <= ($mandatoryMonths * 30) ? 'الفترة الإلزامية' : 'فترة تجديد ' . ceil(($days - ($mandatoryMonths * 30)) / 30);
                
                $calcMonths = max(1, (int) ceil($days / 30.0));
                $accCost = $calcMonths * $monthlyRate;

                $timelineChart[] = [
                    'date' => $e['voucher_date'],
                    'days_on_contract' => $days,
                    'balance' => $cumBalance,
                    'accumulated_cost' => $accCost,
                    'period_label' => $currentPeriod,
                ];
            }

            $cData['days_stayed'] = $daysStayed;
            $cData['months_stayed'] = $monthsStayed;
            $cData['mandatory_cost'] = $mandatoryCost;
            $cData['renewal_cost'] = $renewalCost;
            $cData['total_cost'] = $totalCost;
            $cData['timeline_chart'] = $timelineChart;

            $contractsList[] = $cData;
        }

        return Inertia::render('Pallets/Show', [
            'pallet' => $pallet,
            'current_balance' => $currentBalance,
            'total_in' => $totalIn,
            'total_out' => $totalOut,
            'contracts' => $contractsList,
        ]);
    }

    public function lookup(Request $request)
    {
        $request->validate([
            'pallet_number' => 'required|string|max:50',
            'contract_id'   => 'required|integer|exists:contracts,id',
        ]);

        $code = trim($request->pallet_number);

        // Find existing pallet record by number or code without forcing creation if non-existent
        $cleanNumber = preg_replace('/[^0-9]/', '', $code);
        $pallet = Pallet::where('pallet_code', $code)
            ->orWhere('pallet_number', $code)
            ->when($cleanNumber !== '', function($q) use ($cleanNumber) {
                $q->orWhere('pallet_number', (string)(int)$cleanNumber);
            })
            ->first();

        $targetContract = null;
        if ($request->filled('contract_id')) {
            $targetContract = \App\Models\Contract::with('customer')->find($request->input('contract_id'));
        }

        $voucherMorphClasses = [
            \App\Models\Reception::class,
            \App\Models\Delivery::class,
            \App\Models\InventoryAdjustment::class,
            \App\Models\PalletRearrangement::class,
        ];

        $contents = [];
        $otherContractInfo = null;
        $isOccupiedElsewhere = false;

        if ($pallet) {
            // Fetch entries for the specific target contract if provided
            $entries = collect();
            if ($targetContract) {
                $entries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)
                    ->whereHasMorph('voucher', $voucherMorphClasses, function ($q) use ($targetContract) {
                        $q->where('contract_id', $targetContract->id);
                    })
                    ->with(['inventoryItem', 'variant'])
                    ->get();
            } else {
                // If no contract_id specified, fetch entries across vouchers
                $entries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)
                    ->whereHasMorph('voucher', $voucherMorphClasses)
                    ->with(['inventoryItem', 'variant', 'voucher.contract.customer'])
                    ->get();
            }

            $grouped = $entries->groupBy(function ($entry) {
                return $entry->inventory_item_id . '_' . $entry->inventory_item_variant_id;
            });

            foreach ($grouped as $group) {
                $first = $group->first();
                $qtyIn = (float) $group->sum('quantity_in');
                $qtyOut = (float) $group->sum('quantity_out');
                $balance = max(0, $qtyIn - $qtyOut);

                if ($balance > 0) {
                    $contents[] = [
                        'item_id' => $first->inventory_item_id,
                        'item_name' => $first->inventoryItem ? $first->inventoryItem->name : 'صنف غير محدد',
                        'variant_id' => $first->inventory_item_variant_id,
                        'variant_name' => $first->variant ? $first->variant->variant_name : null,
                        'quality' => $first->variant ? $first->variant->quality : null,
                        'quantity' => $balance,
                        'total_in' => $qtyIn,
                        'total_out' => $qtyOut,
                    ];
                }
            }

            // Check if occupied on any other contract
            $allEntries = \App\Models\InventoryEntry::where('pallet_id', $pallet->id)
                ->whereHasMorph('voucher', $voucherMorphClasses)
                ->with(['voucher.contract.customer'])
                ->get();

            $activeByContract = $allEntries->groupBy(function ($entry) {
                return $entry->voucher?->contract_id;
            });

            foreach ($activeByContract as $cId => $cEntries) {
                if (!$cId) continue;
                if ($targetContract && $cId == $targetContract->id) continue;

                $cIn = (float) $cEntries->sum('quantity_in');
                $cOut = (float) $cEntries->sum('quantity_out');
                if ($cIn - $cOut > 0) {
                    $isOccupiedElsewhere = true;
                    $otherVoucher = $cEntries->sortByDesc('created_at')->pluck('voucher')->filter()->first();
                    $otherContract = $otherVoucher?->contract;
                    if ($otherContract) {
                        $otherContractInfo = [
                            'id' => $otherContract->id,
                            'contract_number' => $otherContract->contract_number,
                            'customer_id' => $otherContract->customer_id,
                            'customer_name' => $otherContract->customer?->name,
                            'active_packages' => $cIn - $cOut,
                        ];
                    }
                    break;
                }
            }
        }

        // Determine contract info to return
        $contractPayload = null;
        if ($targetContract) {
            $contractPayload = [
                'id' => $targetContract->id,
                'contract_number' => $targetContract->contract_number,
                'customer_id' => $targetContract->customer_id,
                'customer_name' => $targetContract->customer?->name,
            ];
        } elseif ($otherContractInfo) {
            // Only return contract payload if active on another contract
            $contractPayload = $otherContractInfo;
        }

        return response()->json([
            'id' => $pallet?->id ?? null,
            'pallet_number' => $pallet?->pallet_number ?? $code,
            'pallet_code' => $pallet?->pallet_code ?? null,
            'size' => $pallet?->size ?? 'وسط',
            'contract' => $contractPayload,
            'is_occupied_elsewhere' => $isOccupiedElsewhere,
            'other_contract' => $otherContractInfo,
            'contents' => $contents,
            'total_packages' => array_sum(array_column($contents, 'quantity')),
        ]);
    }
}
