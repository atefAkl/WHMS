<?php

namespace App\Http\Controllers;

use App\Models\Delivery;
use App\Models\ExitAuthorization;
use App\Models\InventoryEntry;
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

class DeliveryController extends Controller
{
    use ValidatesSecureDeletion;

    public function index(Request $request)
    {
        $query = Delivery::with(['customer', 'contract', 'driver', 'representative', 'period', 'exitAuthorization'])
            ->withSum('inventoryEntries as total_quantity', 'quantity_out');

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
            $query->whereDate('delivery_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('delivery_date', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                    ->orWhere('written_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($c) use ($search) {
                        $c->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $deliveries = $query->latest()->paginate(15)->withQueryString();

        $customers = Customer::orderBy('name')->get();
        $contracts = Contract::orderBy('contract_number')->get();

        return Inertia::render('Warehouse/Deliveries/Index', [
            'deliveries' => $deliveries,
            'customers' => $customers,
            'contracts' => $contracts,
            'filters' => $request->only(['customer_id', 'contract_id', 'status', 'search', 'date_from', 'date_to'])
        ]);
    }

    public function create()
    {
        $delivery = Delivery::create([
            'status'        => 'draft',
            'delivery_date' => now(),
            'history'       => [],
            'created_by'    => auth()->id(),
            'updated_by'    => auth()->id(),
        ]);

        return redirect()->route('deliveries.edit', $delivery->id);
    }

    public function edit(Delivery $delivery)
    {
        if ($delivery->status === 'approved') {
            return redirect()->route('deliveries.show', $delivery->id)
                ->with('error', 'لا يمكن تعديل السند المعتمد. يرجى إلغاء الاعتماد أولاً.');
        }

        $delivery->load(['inventoryEntries.pallet', 'inventoryEntries.inventoryItem', 'inventoryEntries.variant']);

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

        $draftDeliveries = Delivery::where('status', 'draft')
            ->where('id', '!=', $delivery->id)
            ->with(['customer:id,name', 'contract:id,contract_number'])
            ->orderBy('updated_at', 'desc')
            ->get(['id', 'serial_number', 'customer_id', 'contract_id']);

        // Load exit authorizations for contract selection dropdown
        $exitAuthorizations = ExitAuthorization::where(function ($query) use ($delivery) {
            $query->where('status', 'pending')
                ->where(function ($sub) {
                    $sub->whereNull('expiry_date')
                        ->orWhereDate('expiry_date', '>=', now());
                });

            if (!empty($delivery->exit_authorization_id)) {
                $query->orWhere('id', $delivery->exit_authorization_id);
            }
        })
            ->with(['customer', 'contract', 'items.inventoryItem', 'items.inventoryItemVariant'])
            ->get();

        return Inertia::render('Warehouse/Deliveries/CreateEdit', [
            'customers' => $customers,
            'drivers' => $drivers,
            'inventoryItems' => $inventoryItems,
            'isEdit' => true,
            'delivery' => $delivery,
            'draftDeliveries' => $draftDeliveries,
            'exitAuthorizations' => $exitAuthorizations,
        ]);
    }

    public function update(Request $request, Delivery $delivery)
    {
        if ($delivery->status === 'approved') {
            return redirect()->route('deliveries.show', $delivery->id)
                ->with('error', 'لا يمكن تعديل السند المعتمد.');
        }

        $isDraft = $request->input('status') === 'draft';

        $validated = $request->validate([
            'customer_id'            => $isDraft ? 'nullable|exists:customers,id' : 'required|exists:customers,id',
            'contract_id'            => $isDraft ? 'nullable|exists:contracts,id' : 'required|exists:contracts,id',
            'period_id'              => $isDraft ? 'nullable|exists:contract_periods,id' : 'required|exists:contract_periods,id',
            'exit_authorization_id'  => 'nullable|exists:exit_authorizations,id',
            'written_reference'      => 'nullable|string|max:255',
            'driver_id'              => 'nullable|exists:drivers,id',
            'representative_id'      => 'nullable|exists:contract_agents,id',
            'notes'                  => 'nullable|string',
            'delivery_date'          => 'required|date',
            'status'                 => 'nullable|string|in:draft,approved',
            'modification_reason'    => 'nullable|string',
            'items'                  => $isDraft ? 'nullable|array' : 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_number'             => 'required|string|max:50',
            'items.*.quantity_out'              => 'required|numeric|min:0.01',
        ]);

        if (!$isDraft && !$this->isActiveContractPeriod($request->contract_id, $request->period_id)) {
            return back()->withErrors(['period_id' => 'يجب اختيار فترة نشطة تابعة للعقد.'])->withInput();
        }

        // If not draft and exit_authorization_id is null, require written_reference
        if (!$isDraft && empty($request->exit_authorization_id) && empty($request->written_reference)) {
            return redirect()->back()->withErrors([
                'written_reference' => 'يجب إدخال المرجع الخطي في حال عدم اختيار إذن خروج.'
            ])->withInput();
        }

        if (!empty($request->exit_authorization_id)) {
            $exitAuth = ExitAuthorization::find($request->exit_authorization_id);
            if (!$exitAuth || $exitAuth->status !== 'pending') {
                return redirect()->back()->withErrors([
                    'exit_authorization_id' => 'إذن الخروج المحدد غير صالح أو غير متاح.'
                ])->withInput();
            }
            if ($exitAuth->is_expired) {
                return redirect()->back()->withErrors([
                    'exit_authorization_id' => 'هذا الإذن منتهي الصلاحية ولا يمكن استخدامه.'
                ])->withInput();
            }
        }

        // if delivery date is in active storing period
        $activeStoringPeriod = ContractPeriod::find($request->period_id);
        if ($activeStoringPeriod && (
            $request->delivery_date < $activeStoringPeriod->start_date ||
            $request->delivery_date > $activeStoringPeriod->end_date)) {
            return redirect()->back()->withErrors([
                'delivery_date' => 'تاريخ السند لا يمكن أن يكون قبل تاريخ بداية فترة التخزين النشطة للعقد.'
            ])->withInput();
        }

        try {
            DB::transaction(function () use ($request, $delivery) {
                $reason = $request->modification_reason ?: 'تعديل وحفظ مسودة';

                $history = $delivery->history ?: [];
                $history[] = [
                    'date' => now()->toDateTimeString(),
                    'user' => auth()->user()->name,
                    'reason' => $reason,
                ];

                $delivery->update([
                    'customer_id'            => $request->customer_id,
                    'contract_id'            => $request->contract_id,
                    'period_id'              => $request->period_id,
                    'exit_authorization_id'  => $request->exit_authorization_id,
                    'written_reference'      => $request->written_reference,
                    'driver_id'              => $request->driver_id,
                    'representative_id'      => $request->representative_id,
                    'notes'                  => $request->notes,
                    'delivery_date'          => $request->delivery_date,
                    'status'                 => $request->status ?? $delivery->status,
                    'history'                => $history,
                    'updated_by'             => auth()->id(),
                ]);

                // Clear old entries
                $delivery->inventoryEntries()->delete();

                // Insert new entries
                if ($request->has('items') && is_array($request->items)) {
                    foreach ($request->items as $itemData) {
                        $pallet = Pallet::findOrCreateFromCode($itemData['pallet_number']);

                        // Verify balance on the pallet is not exceeded
                        $balance = $this->calculatePalletVariantBalance(
                            $request->contract_id,
                            $pallet->id,
                            $itemData['inventory_item_id'],
                            $itemData['inventory_item_variant_id'],
                            $delivery->id // Exclude current delivery so we don't count it as already deducted
                        );

                        if ($itemData['quantity_out'] > $balance) {
                            $itemName = InventoryItem::find($itemData['inventory_item_id'])->name;
                            throw new \Exception("الكمية المطلوبة لمخزون الطبلية ({$pallet->pallet_number}) - {$itemName} هي ({$itemData['quantity_out']})، وهي أكبر من الرصيد المتاح حالياً ({$balance}).");
                        }

                        $delivery->inventoryEntries()->create([
                            'inventory_item_id'         => $itemData['inventory_item_id'],
                            'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                            'pallet_id'                 => $pallet->id,
                            'quantity_in'               => 0,
                            'quantity_out'              => $itemData['quantity_out'],
                            'operation_date'            => $request->delivery_date,
                        ]);
                    }
                }

                // If status is approved and there is exit authorization, complete it
                if ($delivery->status === 'approved' && !empty($delivery->exit_authorization_id)) {
                    $exitAuth = ExitAuthorization::find($delivery->exit_authorization_id);
                    if ($exitAuth) {
                        $exitAuth->update(['status' => 'completed']);
                    }
                }
            });
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'items' => $e->getMessage()
            ])->withInput();
        }

        if ($request->input('redirect_to') === 'index') {
            return redirect()->route('deliveries.index')->with('success', 'تم تحديث سند الخروج بنجاح.');
        } elseif ($request->input('redirect_to') === 'edit') {
            return redirect()->route('deliveries.edit', $delivery->id)->with('success', 'تم حفظ التعديلات بنجاح.');
        } elseif ($request->input('redirect_to') === 'print') {
            return redirect()->route('deliveries.print', $delivery->id)->with('success', 'تم تحديث سند الخروج بنجاح وجاري الانتقال للطباعة.');
        }

        if ($request->filled('redirect_to_draft_id')) {
            return redirect()->route('deliveries.edit', $request->redirect_to_draft_id)
                ->with('success', 'تم حفظ السند الحالي كمسودة والانتقال للسند المحدد.');
        }

        if ($delivery->status === 'approved' && !empty($delivery->exit_authorization_id)) {
            return redirect()->route('exit-authorizations.index')->with('success', 'تم تحديث واعتماد سند الخروج بنجاح وجاري إرجاعك لصفحة الطلبات.');
        }

        return redirect()->route('deliveries.show', $delivery->id)->with('success', 'تم تحديث سند الخروج بنجاح.');
    }

    public function show(Delivery $delivery)
    {
        $delivery->load([
            'customer',
            'contract',
            'driver',
            'representative',
            'period',
            'inventoryEntries.inventoryItem',
            'inventoryEntries.variant',
            'inventoryEntries.pallet',
            'creator',
            'editor',
            'exitAuthorization'
        ]);

        return Inertia::render('Warehouse/Deliveries/Show', [
            'delivery' => $delivery
        ]);
    }

    public function destroy(Request $request, Delivery $delivery)
    {
        $this->validateSecureDelete($request);

        DB::transaction(function () use ($delivery) {
            // If it was approved, and had an exit authorization, make exit auth pending again
            if ($delivery->status === 'approved' && !empty($delivery->exit_authorization_id)) {
                $exitAuth = ExitAuthorization::find($delivery->exit_authorization_id);
                if ($exitAuth) {
                    $exitAuth->update(['status' => 'pending']);
                }
            }

            $delivery->inventoryEntries()->delete();
            $delivery->delete();
        });

        return redirect()->route('deliveries.index')->with('success', 'تم حذف سند الخروج بنجاح.');
    }

    public function approve(Request $request, Delivery $delivery)
    {
        if (empty($delivery->customer_id) || empty($delivery->contract_id) || empty($delivery->period_id)) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد سند غير مكتمل البيانات.');
        }

        if ($delivery->inventoryEntries()->count() === 0) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد سند لا يحتوي على طبالي/أصناف.');
        }

        if (empty($delivery->exit_authorization_id) && empty($delivery->written_reference)) {
            return redirect()->back()->with('error', 'لا يمكن اعتماد السند بدون إذن خروج أو مرجع خطي.');
        }

        if (!empty($delivery->exit_authorization_id)) {
            $exitAuth = ExitAuthorization::find($delivery->exit_authorization_id);
            if (!$exitAuth || $exitAuth->status !== 'pending') {
                return redirect()->back()->with('error', 'إذن الخروج المحدد غير صالح أو غير متاح.');
            }
            if ($exitAuth->is_expired) {
                return redirect()->back()->with('error', 'هذا الإذن منتهي الصلاحية ولا يمكن اعتماد السند باستخدامه.');
            }
        }

        DB::transaction(function () use ($delivery) {
            $delivery->update([
                'status' => 'approved',
                'updated_by' => auth()->id(),
            ]);

            if (!empty($delivery->exit_authorization_id)) {
                $exitAuth = ExitAuthorization::find($delivery->exit_authorization_id);
                if ($exitAuth) {
                    $exitAuth->update(['status' => 'completed']);
                }
            }
        });

        if (!empty($delivery->exit_authorization_id)) {
            return redirect()->route('exit-authorizations.index')->with('success', 'تم اعتماد السند بنجاح وجاري إرجاعك لصفحة الطلبات.');
        }

        // Support redirect_to param: 'print' goes to print page, anything else goes to index
        if ($request->input('redirect_to') === 'print') {
            return redirect()->route('deliveries.print', $delivery->id)->with('success', 'تم اعتماد سند الخروج بنجاح.');
        }

        return redirect()->route('deliveries.index')->with('success', 'تم اعتماد سند الخروج بنجاح.');
    }

    public function reopen(Request $request, Delivery $delivery)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = auth()->user();
        if (empty($user->secure_password)) {
            return redirect()->back()->with('error', 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.');
        }

        if (!Hash::check($request->password, $user->secure_password)) {
            return redirect()->back()->with('error', 'كلمة مرور تأكيد الإجراء غير صحيحة.');
        }

        DB::transaction(function () use ($delivery) {
            $delivery->update([
                'status' => 'draft',
                'updated_by' => auth()->id(),
            ]);

            if (!empty($delivery->exit_authorization_id)) {
                $exitAuth = ExitAuthorization::find($delivery->exit_authorization_id);
                if ($exitAuth) {
                    $exitAuth->update(['status' => 'pending']);
                }
            }
        });

        return redirect()->route('deliveries.edit', $delivery->id)->with('success', 'تم إلغاء اعتماد السند وإعادته لمسودة بنجاح.');
    }

    public function print(Delivery $delivery)
    {
        $delivery->load([
            'customer',
            'contract',
            'driver',
            'representative',
            'period',
            'inventoryEntries.inventoryItem',
            'inventoryEntries.variant',
            'inventoryEntries.pallet',
        ]);

        return Inertia::render('Warehouse/Deliveries/Print', [
            'delivery' => $delivery
        ]);
    }

    // --- Progressive Loading API Methods ---

    public function getContractPallets($contractId)
    {
        // Get pallets under this contract with balance > 0
        $entries = InventoryEntry::where(function ($q) use ($contractId) {
            $q->where(function ($q1) use ($contractId) {
                $q1->where('voucher_type', \App\Models\Reception::class)
                    ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contractId)->pluck('id'));
            })->orWhere(function ($q2) use ($contractId) {
                $q2->where('voucher_type', \App\Models\Delivery::class)
                    ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contractId)->pluck('id'));
            });
        })
            ->select('pallet_id', DB::raw('SUM(quantity_in) - SUM(quantity_out) as balance'))
            ->groupBy('pallet_id')
            ->having(DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
            ->get();

        $palletIds = $entries->pluck('pallet_id');
        $pallets = Pallet::whereIn('id', $palletIds)->orderBy('pallet_number')->get();

        // Attach balance
        $pallets->map(function ($p) use ($entries) {
            $p->balance = (float) $entries->firstWhere('pallet_id', $p->id)->balance;
            return $p;
        });

        return response()->json($pallets);
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

    public function getPalletItems($contractId, $palletId)
    {
        // Get items on this pallet with balance > 0 under this contract
        $entries = InventoryEntry::where('pallet_id', $palletId)
            ->where(function ($q) use ($contractId) {
                $q->where(function ($q1) use ($contractId) {
                    $q1->where('voucher_type', \App\Models\Reception::class)
                        ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contractId)->pluck('id'));
                })->orWhere(function ($q2) use ($contractId) {
                    $q2->where('voucher_type', \App\Models\Delivery::class)
                        ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contractId)->pluck('id'));
                });
            })
            ->select('inventory_item_id', DB::raw('SUM(quantity_in) - SUM(quantity_out) as balance'))
            ->groupBy('inventory_item_id')
            ->having(DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
            ->get();

        $itemIds = $entries->pluck('inventory_item_id');
        $items = InventoryItem::whereIn('id', $itemIds)->orderBy('name')->get();

        $items->map(function ($item) use ($entries) {
            $item->balance = (float) $entries->firstWhere('inventory_item_id', $item->id)->balance;
            return $item;
        });

        return response()->json($items);
    }

    public function getItemVariants($contractId, $palletId, $itemId)
    {
        // Get variants and balances for this item on this pallet under this contract
        $entries = InventoryEntry::where('pallet_id', $palletId)
            ->where('inventory_item_id', $itemId)
            ->where(function ($q) use ($contractId) {
                $q->where(function ($q1) use ($contractId) {
                    $q1->where('voucher_type', \App\Models\Reception::class)
                        ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contractId)->pluck('id'));
                })->orWhere(function ($q2) use ($contractId) {
                    $q2->where('voucher_type', \App\Models\Delivery::class)
                        ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contractId)->pluck('id'));
                });
            })
            ->select('inventory_item_variant_id', DB::raw('SUM(quantity_in) - SUM(quantity_out) as balance'))
            ->groupBy('inventory_item_variant_id')
            ->having(DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
            ->with('variant')
            ->get();

        return response()->json($entries);
    }

    private function calculatePalletVariantBalance($contractId, $palletId, $itemId, $variantId, $excludeDeliveryId = null)
    {
        $query = InventoryEntry::where('pallet_id', $palletId)
            ->where('inventory_item_id', $itemId)
            ->where('inventory_item_variant_id', $variantId)
            ->where(function ($q) use ($contractId, $excludeDeliveryId) {
                $q->where(function ($q1) use ($contractId) {
                    $q1->where('voucher_type', \App\Models\Reception::class)
                        ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contractId)->pluck('id'));
                })->orWhere(function ($q2) use ($contractId, $excludeDeliveryId) {
                    $q2Query = \App\Models\Delivery::where('contract_id', $contractId);
                    if ($excludeDeliveryId) {
                        $q2Query->where('id', '!=', $excludeDeliveryId);
                    }
                    $q2->where('voucher_type', \App\Models\Delivery::class)
                        ->whereIn('voucher_id', $q2Query->pluck('id'));
                });
            });

        $sums = $query->select(DB::raw('SUM(quantity_in) as total_in'), DB::raw('SUM(quantity_out) as total_out'))->first();
        $totalIn = $sums ? (float) $sums->total_in : 0.0;
        $totalOut = $sums ? (float) $sums->total_out : 0.0;

        return max(0.0, $totalIn - $totalOut);
    }
}
