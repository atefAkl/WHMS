<?php

namespace App\Http\Controllers\Warehouse;

use App\Http\Controllers\Controller;
use App\Models\ContractTransfer;
use App\Models\ContractTransferItem;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\InventoryEntry;
use App\Models\Pallet;
use App\Models\InventoryItem;
use App\Models\InventoryItemVariant;
use App\Traits\ValidatesSecureDeletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ContractTransferController extends Controller
{
    use ValidatesSecureDeletion;

    public function index(Request $request)
    {
        $query = ContractTransfer::with([
            'sourceContract.customer',
            'destinationContract.customer',
            'sourceCustomer',
            'destinationCustomer',
            'driver',
            'period',
            'items.inventoryItem',
            'items.variant',
            'items.pallet'
        ])->withSum('items as total_quantity', 'quantity');

        // Explicit Search Filters
        if ($request->filled('serial_number')) {
            $query->where('serial_number', 'like', "%{$request->serial_number}%");
        }

        if ($request->filled('farm_source')) {
            $query->where('farm_source', 'like', "%{$request->farm_source}%");
        }

        if ($request->filled('source_contract_id')) {
            $query->where('source_contract_id', $request->source_contract_id);
        }

        if ($request->filled('destination_contract_id')) {
            $query->where('destination_contract_id', $request->destination_contract_id);
        }

        if ($request->filled('customer_or_contract')) {
            $term = $request->customer_or_contract;
            $query->where(function ($q) use ($term) {
                $q->whereHas('sourceContract', function ($sc) use ($term) {
                    $sc->where('contract_number', 'like', "%{$term}%")
                       ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$term}%"));
                })->orWhereHas('destinationContract', function ($dc) use ($term) {
                    $dc->where('contract_number', 'like', "%{$term}%")
                       ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$term}%"));
                })->orWhereHas('sourceCustomer', fn($c) => $c->where('name', 'like', "%{$term}%"))
                  ->orWhereHas('destinationCustomer', fn($c) => $c->where('name', 'like', "%{$term}%"));
            });
        }

        if ($request->filled('notes')) {
            $query->where('notes', 'like', "%{$request->notes}%");
        }

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('transfer_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('transfer_date', '<=', $request->date_to);
        }

        $transfers = $query->latest()->paginate(15)->withQueryString();

        $contracts = Contract::with('customer')->orderBy('contract_number')->get();
        $customers = Customer::orderBy('name')->get();
        $drivers = Driver::orderBy('name')->get();

        return Inertia::render('Warehouse/Transfers/Index', [
            'transfers' => $transfers,
            'contracts' => $contracts,
            'customers' => $customers,
            'drivers'   => $drivers,
            'filters'   => $request->only([
                'serial_number',
                'farm_source',
                'source_contract_id',
                'destination_contract_id',
                'customer_or_contract',
                'notes',
                'driver_id',
                'status',
                'date_from',
                'date_to',
            ]),
        ]);
    }

    public function create()
    {
        $contracts = Contract::with(['customer', 'periods'])->orderBy('contract_number')->get();
        $customers = Customer::orderBy('name')->get();
        $drivers   = Driver::orderBy('name')->get();

        $nextNum = ContractTransfer::max('id') + 1;
        $year = date('Y');
        $autoSerial = 'TRF-' . $year . '-' . str_pad((string)$nextNum, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Warehouse/Transfers/CreateEdit', [
            'transfer'   => null,
            'contracts'  => $contracts,
            'customers'  => $customers,
            'drivers'    => $drivers,
            'autoSerial' => $autoSerial,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'transfer_date'           => 'required|date',
            'source_contract_id'      => 'required|exists:contracts,id',
            'destination_contract_id' => 'required|exists:contracts,id|different:source_contract_id',
            'driver_id'               => 'nullable|exists:drivers,id',
            'farm_source'             => 'nullable|string|max:255',
            'notes'                   => 'nullable|string',
            'status'                  => 'required|in:draft,approved',
            'items'                   => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.pallet_id'       => 'nullable|exists:pallets,id',
            'items.*.quantity'        => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($request) {
            $sourceContract = Contract::findOrFail($request->source_contract_id);
            $destinationContract = Contract::findOrFail($request->destination_contract_id);

            $serialNumber = $request->serial_number;
            if (empty($serialNumber)) {
                $nextNum = ContractTransfer::max('id') + 1;
                $year = date('Y');
                $serialNumber = 'TRF-' . $year . '-' . str_pad((string)$nextNum, 4, '0', STR_PAD_LEFT);
            }

            $transfer = ContractTransfer::create([
                'serial_number'           => $serialNumber,
                'transfer_date'           => $request->transfer_date,
                'source_contract_id'      => $sourceContract->id,
                'destination_contract_id' => $destinationContract->id,
                'source_customer_id'      => $sourceContract->customer_id,
                'destination_customer_id' => $destinationContract->customer_id,
                'period_id'               => $request->period_id ?? null,
                'driver_id'               => $request->driver_id,
                'farm_source'             => $request->farm_source,
                'notes'                   => $request->notes,
                'status'                  => $request->status === 'approved' ? 'approved' : 'draft',
                'created_by'              => auth()->id(),
                'approved_by'             => $request->status === 'approved' ? auth()->id() : null,
                'approved_at'             => $request->status === 'approved' ? now() : null,
            ]);

            foreach ($request->items as $item) {
                ContractTransferItem::create([
                    'contract_transfer_id'      => $transfer->id,
                    'inventory_item_id'         => $item['inventory_item_id'],
                    'inventory_item_variant_id' => $item['inventory_item_variant_id'] ?? null,
                    'pallet_id'                 => $item['pallet_id'] ?? null,
                    'quantity'                  => $item['quantity'],
                    'notes'                     => $item['notes'] ?? null,
                ]);
            }

            if ($transfer->status === 'approved') {
                $this->postInventoryEntries($transfer);
            }

            return redirect()->route('contract-transfers.index')->with('success', 'تم حفظ سند نقل الطبالي بنجاح.');
        });
    }

    public function show($id)
    {
        $transfer = ContractTransfer::with([
            'sourceContract.customer',
            'destinationContract.customer',
            'sourceCustomer',
            'destinationCustomer',
            'driver',
            'period',
            'creator',
            'approver',
            'items.inventoryItem',
            'items.variant',
            'items.pallet',
            'inventoryEntries'
        ])->findOrFail($id);

        return Inertia::render('Warehouse/Transfers/Show', [
            'transfer' => $transfer,
        ]);
    }

    public function edit($id)
    {
        $transfer = ContractTransfer::with(['items.inventoryItem', 'items.variant', 'items.pallet'])->findOrFail($id);

        if ($transfer->status !== 'draft') {
            return redirect()->route('contract-transfers.show', $id)
                ->with('error', 'لا يمكن تعديل السند المعتمد. يرجى إلغاء الاعتماد أولاً.');
        }

        $contracts = Contract::with(['customer', 'periods'])->orderBy('contract_number')->get();
        $customers = Customer::orderBy('name')->get();
        $drivers   = Driver::orderBy('name')->get();

        return Inertia::render('Warehouse/Transfers/CreateEdit', [
            'transfer'  => $transfer,
            'contracts' => $contracts,
            'customers' => $customers,
            'drivers'   => $drivers,
        ]);
    }

    public function update(Request $request, $id)
    {
        $transfer = ContractTransfer::findOrFail($id);

        if ($transfer->status !== 'draft') {
            return redirect()->route('contract-transfers.show', $id)
                ->with('error', 'لا يمكن تعديل السند المعتمد. يرجى إلغاء الاعتماد أولاً.');
        }

        $request->validate([
            'transfer_date'           => 'required|date',
            'source_contract_id'      => 'required|exists:contracts,id',
            'destination_contract_id' => 'required|exists:contracts,id|different:source_contract_id',
            'driver_id'               => 'nullable|exists:drivers,id',
            'farm_source'             => 'nullable|string|max:255',
            'notes'                   => 'nullable|string',
            'status'                  => 'required|in:draft,approved',
            'items'                   => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.pallet_id'       => 'nullable|exists:pallets,id',
            'items.*.quantity'        => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($request, $transfer) {
            $sourceContract = Contract::findOrFail($request->source_contract_id);
            $destinationContract = Contract::findOrFail($request->destination_contract_id);

            $transfer->update([
                'serial_number'           => $request->serial_number ?: $transfer->serial_number,
                'transfer_date'           => $request->transfer_date,
                'source_contract_id'      => $sourceContract->id,
                'destination_contract_id' => $destinationContract->id,
                'source_customer_id'      => $sourceContract->customer_id,
                'destination_customer_id' => $destinationContract->customer_id,
                'period_id'               => $request->period_id ?? null,
                'driver_id'               => $request->driver_id,
                'farm_source'             => $request->farm_source,
                'notes'                   => $request->notes,
                'status'                  => $request->status === 'approved' ? 'approved' : 'draft',
                'approved_by'             => $request->status === 'approved' ? auth()->id() : null,
                'approved_at'             => $request->status === 'approved' ? now() : null,
            ]);

            $transfer->items()->delete();

            foreach ($request->items as $item) {
                ContractTransferItem::create([
                    'contract_transfer_id'      => $transfer->id,
                    'inventory_item_id'         => $item['inventory_item_id'],
                    'inventory_item_variant_id' => $item['inventory_item_variant_id'] ?? null,
                    'pallet_id'                 => $item['pallet_id'] ?? null,
                    'quantity'                  => $item['quantity'],
                    'notes'                     => $item['notes'] ?? null,
                ]);
            }

            if ($transfer->status === 'approved') {
                $this->postInventoryEntries($transfer);
            }

            return redirect()->route('contract-transfers.index')->with('success', 'تم تحديث سند نقل الطبالي بنجاح.');
        });
    }

    public function destroy(Request $request, $id)
    {
        $transfer = ContractTransfer::findOrFail($id);

        if ($transfer->status === 'approved') {
            return back()->withErrors(['error' => 'لا يمكن حذف سند معتمد ومغلق. يرجى إلغاء الاعتماد أولاً.']);
        }

        $this->validateDeletePassword($request);

        $transfer->delete();

        return redirect()->route('contract-transfers.index')->with('success', 'تم حذف سند نقل الطبالي بنجاح.');
    }

    public function approve($id)
    {
        $transfer = ContractTransfer::with('items')->findOrFail($id);

        if ($transfer->status === 'approved') {
            return back()->with('info', 'السند معتمد بالفعل.');
        }

        DB::transaction(function () use ($transfer) {
            $transfer->update([
                'status'      => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            $this->postInventoryEntries($transfer);
        });

        return back()->with('success', 'تم اعتماد وتثبيت سند نقل الطبالي في سجلات المخازن بنجاح.');
    }

    public function reopen(Request $request, $id)
    {
        $transfer = ContractTransfer::findOrFail($id);

        if ($transfer->status !== 'approved') {
            return back()->with('info', 'السند غير معتمد لكي يتم إعادة فتحه.');
        }

        $this->validateDeletePassword($request);

        DB::transaction(function () use ($transfer) {
            // Delete generated inventory entries
            InventoryEntry::where('voucher_type', ContractTransfer::class)
                ->where('voucher_id', $transfer->id)
                ->delete();

            $transfer->update([
                'status'      => 'draft',
                'approved_by' => null,
                'approved_at' => null,
            ]);
        });

        return back()->with('success', 'تم إلغاء اعتماد السند وتفريغ حركاته بنجاح.');
    }

    public function print($id)
    {
        $transfer = ContractTransfer::with([
            'sourceContract.customer',
            'destinationContract.customer',
            'sourceCustomer',
            'destinationCustomer',
            'driver',
            'period',
            'creator',
            'approver',
            'items.inventoryItem',
            'items.variant',
            'items.pallet'
        ])->findOrFail($id);

        return Inertia::render('Warehouse/Transfers/Print', [
            'transfer' => $transfer,
        ]);
    }

    private function postInventoryEntries(ContractTransfer $transfer)
    {
        // Delete any existing entries first to avoid duplicates
        InventoryEntry::where('voucher_type', ContractTransfer::class)
            ->where('voucher_id', $transfer->id)
            ->delete();

        foreach ($transfer->items as $item) {
            // 1. Source Contract Entry: OUT (quantity_out)
            InventoryEntry::create([
                'contract_id'               => $transfer->source_contract_id,
                'inventory_item_id'         => $item->inventory_item_id,
                'inventory_item_variant_id' => $item->inventory_item_variant_id,
                'pallet_id'                 => $item->pallet_id,
                'voucher_type'              => ContractTransfer::class,
                'voucher_id'                => $transfer->id,
                'quantity_in'               => 0,
                'quantity_out'              => $item->quantity,
                'operation_date'            => $transfer->transfer_date,
            ]);

            // 2. Destination Contract Entry: IN (quantity_in)
            InventoryEntry::create([
                'contract_id'               => $transfer->destination_contract_id,
                'inventory_item_id'         => $item->inventory_item_id,
                'inventory_item_variant_id' => $item->inventory_item_variant_id,
                'pallet_id'                 => $item->pallet_id,
                'voucher_type'              => ContractTransfer::class,
                'voucher_id'                => $transfer->id,
                'quantity_in'               => $item->quantity,
                'quantity_out'              => 0,
                'operation_date'            => $transfer->transfer_date,
            ]);
        }
    }
}
