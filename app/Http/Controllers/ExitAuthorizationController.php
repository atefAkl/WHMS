<?php

namespace App\Http\Controllers;

use App\Models\ExitAuthorization;
use App\Models\ExitAuthorizationItem;
use App\Models\Customer;
use App\Models\Contract;
use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ExitAuthorizationController extends Controller
{
    public function index(Request $request)
    {
        $query = ExitAuthorization::with(['customer', 'contract', 'items.inventoryItem', 'items.inventoryItemVariant'])
            ->withSum('items as total_quantity', 'quantity');

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
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('serial_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($c) use ($search) {
                      $c->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $authorizations = $query->latest()->paginate(15)->withQueryString();

        $customers = Customer::where('status', 'active')->orderBy('name')->get();
        $contracts = Contract::where('status', 'active')->orderBy('contract_number')->get();

        return Inertia::render('Warehouse/ExitAuthorizations/Index', [
            'authorizations' => $authorizations,
            'customers' => $customers,
            'contracts' => $contracts,
            'filters' => $request->only(['customer_id', 'contract_id', 'status', 'search', 'date_from', 'date_to'])
        ]);
    }

    public function create()
    {
        $customers = Customer::where('status', 'active')
            ->with(['contracts' => function($q) {
                $q->where('status', 'active')->with(['periods', 'contractAgents']);
            }])
            ->orderBy('name')
            ->get();

        $inventoryItems = InventoryItem::where('is_active', true)
            ->with(['variants' => function($v) {
                $v->where('is_active', true);
            }])
            ->orderBy('name')
            ->get();

        $drivers = \App\Models\Driver::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Warehouse/ExitAuthorizations/CreateEdit', [
            'customers' => $customers,
            'inventoryItems' => $inventoryItems,
            'drivers' => $drivers,
            'isEdit' => false,
            'authorization' => null
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'contract_id' => 'required|exists:contracts,id',
            'period_id'   => 'nullable|exists:contract_periods,id',
            'requester_type' => 'nullable|string|in:whatsapp,written,personal',
            'requester_proof' => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,pdf,mp4,mp3,wav,ogg|max:20480',
            'driver_id'   => 'nullable|exists:drivers,id',
            'representative_id' => 'nullable|exists:contract_agents,id',
            'deliver_to_self' => 'nullable|boolean',
            'notes'       => 'nullable|string',
            'items'       => 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_number'             => 'nullable|string|max:50',
            'items.*.quantity'                  => 'required|numeric|min:0.01',
        ]);

        $proofPath = null;
        if ($request->hasFile('requester_proof')) {
            $file = $request->file('requester_proof');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $directory = public_path('uploads/documents/exit_proofs');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            $file->move($directory, $filename);
            $proofPath = '/uploads/documents/exit_proofs/' . $filename;
        }

        $auth = DB::transaction(function () use ($request, $proofPath) {
            $auth = ExitAuthorization::create([
                'customer_id' => $request->customer_id,
                'contract_id' => $request->contract_id,
                'period_id'   => $request->period_id,
                'requester_type' => $request->requester_type,
                'requester_proof' => $proofPath,
                'driver_id'   => $request->driver_id,
                'representative_id' => $request->representative_id,
                'deliver_to_self' => $request->deliver_to_self ? true : false,
                'notes'       => $request->notes,
                'status'      => 'pending',
                'created_by'  => auth()->id(),
                'updated_by'  => auth()->id(),
            ]);

            foreach ($request->items as $itemData) {
                $auth->items()->create([
                    'inventory_item_id'         => $itemData['inventory_item_id'],
                    'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                    'pallet_number'             => $itemData['pallet_number'] ?? null,
                    'quantity'                  => $itemData['quantity'],
                ]);
            }

            return $auth;
        });

        return redirect()->route('exit-authorizations.index')->with('success', 'تم إنشاء إذن الخروج بنجاح.');
    }

    public function edit(ExitAuthorization $exitAuthorization)
    {
        if ($exitAuthorization->status !== 'pending') {
            return redirect()->route('exit-authorizations.index')
                ->with('error', 'يمكن فقط تعديل الأذونات المعلقة.');
        }

        $exitAuthorization->load(['items.inventoryItem', 'items.inventoryItemVariant']);

        $customers = Customer::where('status', 'active')
            ->with(['contracts' => function($q) {
                $q->where('status', 'active')->with(['periods', 'contractAgents']);
            }])
            ->orderBy('name')
            ->get();

        $inventoryItems = InventoryItem::where('is_active', true)
            ->with(['variants' => function($v) {
                $v->where('is_active', true);
            }])
            ->orderBy('name')
            ->get();

        $drivers = \App\Models\Driver::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('Warehouse/ExitAuthorizations/CreateEdit', [
            'customers' => $customers,
            'inventoryItems' => $inventoryItems,
            'drivers' => $drivers,
            'isEdit' => true,
            'authorization' => $exitAuthorization
        ]);
    }

    public function update(Request $request, ExitAuthorization $exitAuthorization)
    {
        if ($exitAuthorization->status !== 'pending') {
            return redirect()->route('exit-authorizations.index')
                ->with('error', 'يمكن فقط تعديل الأذونات المعلقة.');
        }

        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'contract_id' => 'required|exists:contracts,id',
            'period_id'   => 'nullable|exists:contract_periods,id',
            'requester_type' => 'nullable|string|in:whatsapp,written,personal',
            'requester_proof' => 'nullable', // validated separately below if it is a new file
            'driver_id'   => 'nullable|exists:drivers,id',
            'representative_id' => 'nullable|exists:contract_agents,id',
            'deliver_to_self' => 'nullable|boolean',
            'notes'       => 'nullable|string',
            'items'       => 'required|array|min:1',
            'items.*.inventory_item_id'         => 'required|exists:inventory_items,id',
            'items.*.inventory_item_variant_id' => 'required|exists:inventory_item_variants,id',
            'items.*.pallet_number'             => 'nullable|string|max:50',
            'items.*.quantity'                  => 'required|numeric|min:0.01',
        ]);

        $proofPath = null;
        if ($request->hasFile('requester_proof')) {
            $request->validate([
                'requester_proof' => 'file|mimes:jpeg,png,jpg,gif,svg,pdf,mp4,mp3,wav,ogg|max:20480',
            ]);
            $file = $request->file('requester_proof');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $directory = public_path('uploads/documents/exit_proofs');
            if (!file_exists($directory)) {
                mkdir($directory, 0755, true);
            }
            $file->move($directory, $filename);
            $proofPath = '/uploads/documents/exit_proofs/' . $filename;
        }

        DB::transaction(function () use ($request, $exitAuthorization, $proofPath) {
            $updateData = [
                'customer_id' => $request->customer_id,
                'contract_id' => $request->contract_id,
                'period_id'   => $request->period_id,
                'requester_type' => $request->requester_type,
                'driver_id'   => $request->driver_id,
                'representative_id' => $request->representative_id,
                'deliver_to_self' => $request->deliver_to_self ? true : false,
                'notes'       => $request->notes,
                'updated_by'  => auth()->id(),
            ];

            if ($proofPath) {
                if ($exitAuthorization->requester_proof && file_exists(public_path($exitAuthorization->requester_proof))) {
                    @unlink(public_path($exitAuthorization->requester_proof));
                }
                $updateData['requester_proof'] = $proofPath;
            }

            $exitAuthorization->update($updateData);

            $exitAuthorization->items()->delete();

            foreach ($request->items as $itemData) {
                $exitAuthorization->items()->create([
                    'inventory_item_id'         => $itemData['inventory_item_id'],
                    'inventory_item_variant_id' => $itemData['inventory_item_variant_id'],
                    'pallet_number'             => $itemData['pallet_number'] ?? null,
                    'quantity'                  => $itemData['quantity'],
                ]);
            }
        });

        return redirect()->route('exit-authorizations.index')->with('success', 'تم تحديث إذن الخروج بنجاح.');
    }

    public function destroy(Request $request, ExitAuthorization $exitAuthorization)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = auth()->user();
        if (empty($user->secure_password)) {
            return redirect()->back()->with('error', 'يرجى تعيين كلمة مرور الحفظ/الحذف الآمنة أولاً في ملفك الشخصي.');
        }

        if (!Hash::check($request->password, $user->secure_password)) {
            return redirect()->back()->with('error', 'كلمة مرور تأكيد الحذف غير صحيحة.');
        }

        if ($exitAuthorization->status !== 'pending') {
            return redirect()->back()->with('error', 'يمكن فقط حذف الأذونات المعلقة.');
        }

        $exitAuthorization->items()->delete();
        $exitAuthorization->delete();

        return redirect()->route('exit-authorizations.index')->with('success', 'تم حذف إذن الخروج بنجاح.');
    }
}
