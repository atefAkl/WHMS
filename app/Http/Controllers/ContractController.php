<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Contract;
use App\Models\Customer;
use App\Models\Agent;
use App\Models\Term;
use Carbon\Carbon;

use App\Models\Season;
use App\Models\StorageItem;
use App\Models\ContractSetting;

class ContractController extends Controller
{
    public function create(Request $request)
    {
        $customer = Customer::with(['country','category.parent', 'contacts'])->findOrFail($request->customer_id);
        $storageItems = StorageItem::where('is_active', true)->get();
        $nextSerial = $this->nextSerial();

        // 1. Get Global Defaults
        $globalSettings = ContractSetting::pluck('value', 'key')->all();

        // 2. Get Active Season Defaults (Priority)
        $activeSeason = Season::where('is_active', true)->first();
        
        $defaults = [
            'introduction'     => $activeSeason->introduction ?? $globalSettings['default_introduction'] ?? '',
            'preamble'         => $activeSeason->preamble     ?? $globalSettings['default_preamble']     ?? '',
            'mandatory_period' => $activeSeason->mandatory_period ?? $globalSettings['default_mandatory_period'] ?? 12,
            'renewal_period'   => $activeSeason->renewal_period   ?? $globalSettings['default_renewal_period']   ?? 12,
        ];

        // 3. Get Season Terms (Pre-assigned)
        $seasonTerms = $activeSeason ? $activeSeason->terms()->orderBy('season_terms.sort_order')->get() : collect();

        // 4. Get All Terms for Library
        $allTerms = Term::orderBy('sort_order')->get();

        return Inertia::render('Contracts/Create', [
            'customer'     => $customer,
            'contacts'     => $customer->contacts,
            'storageItems' => $storageItems,
            'nextSerial'   => $nextSerial,
            'seasonTerms'  => $seasonTerms,
            'allTerms'     => $allTerms,
            'defaults'     => $defaults
        ]);
    }

    public function show($id)
    {
        $contract = Contract::with(['customer.category', 'customer.country', 'contact', 'items.storageItem', 'terms', 'payments'])->findOrFail($id);
        return Inertia::render('Contracts/Show', compact('contract'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'      => 'required|exists:customers,id',
            'contract_number'  => 'required|string|unique:contracts,contract_number',
            'write_date'       => 'required|date',
            'write_date_hijri' => 'nullable|string',
            'start_date'       => 'required|date|after_or_equal:write_date',
            'start_date_hijri' => 'nullable|string',
            'mandatory_period' => 'required|integer|min:1|max:12',
            'renewal_period'   => 'required|integer|min:0',
            'contact_id'       => 'nullable|exists:contacts,id',
            'discount'         => 'nullable|numeric|min:0',
            'status'           => 'required|in:draft,active',
            'items'            => 'required|array|min:1',
            'items.*.storage_item_id' => 'required|exists:storage_items,id',
            'items.*.unit_count'      => 'required|integer|min:1',
            'items.*.monthly_rent'    => 'required|numeric|min:0',
            'items.*.discount'        => 'nullable|numeric|min:0',
            'introduction'     => 'nullable|string',
            'preamble'         => 'nullable|string',
            'term_ids'         => 'nullable|array',
            'term_ids.*'       => 'exists:terms,id',
            'payments'         => 'nullable|array',
            'payments.*.amount'       => 'required|numeric|min:0.01',
            'payments.*.payment_date' => 'required|date',
            'payments.*.method'       => 'required|in:cash,bank_transfer,cheque',
            'payments.*.reference'    => 'nullable|string',
            'payments.*.notes'        => 'nullable|string',
        ], [
            'start_date.after_or_equal' => 'تاريخ بداية العقد لا يمكن أن يكون قبل تاريخ الكتابة.',
            'mandatory_period.min'      => 'الفترة الإلزامية يجب أن تكون شهر على الأقل.',
            'mandatory_period.max'      => 'الفترة الإلزامية لا تتجاوز 12 شهراً.',
            'renewal_period.min'        => 'فترة التجديد لا يمكن أن تكون سالبة.',
        ]);

        // create contract
        $contract = Contract::create([
            'customer_id'      => $validated['customer_id'],
            'contact_id'       => $validated['contact_id'] ?? null,
            'contract_number'  => $validated['contract_number'],
            'contract_date'    => $validated['write_date'], // alias for consistency
            'write_date'       => $validated['write_date'],
            'write_date_hijri' => $validated['write_date_hijri'] ?? null,
            'start_date'       => $validated['start_date'],
            'start_date_hijri' => $validated['start_date_hijri'] ?? null,
            'mandatory_period' => $validated['mandatory_period'],
            'renewal_period'   => $validated['renewal_period'],
            'discount'         => $validated['discount'] ?? 0,
            'vat_rate'         => 15,
            'status'           => $validated['status'],
            'introduction'     => $validated['introduction'] ?? null,
            'preamble'         => $validated['preamble'] ?? null,
        ]);

        // items
        foreach ($validated['items'] as $item) {
            // New Calculation Rule: (unit_count * mandatory_period * monthly_rent_inclusive_of_vat) - discount_amount
            $total_inclusive = ($item['unit_count'] * $validated['mandatory_period'] * $item['monthly_rent']) - ($item['discount'] ?? 0);
            $total_before_vat = $total_inclusive / 1.15;

            $contract->items()->create([
                'storage_item_id'     => $item['storage_item_id'],
                'unit_count'          => $item['unit_count'],
                'monthly_rent'        => $item['monthly_rent'],
                'discount'            => $item['discount'] ?? 0,
                'vat_rate'            => 15,
                'subtotal_before_vat' => round($total_before_vat, 2),
                'subtotal'            => round($total_inclusive, 2),
            ]);
        }

        // terms — preserve sort_order from the submitted order
        if (!empty($validated['term_ids'])) {
            $pivot = [];
            foreach ($validated['term_ids'] as $index => $id) {
                $pivot[$id] = ['sort_order' => $index];
            }
            $contract->terms()->sync($pivot);
        }

        // payments
        if (!empty($validated['payments'])) {
            foreach ($validated['payments'] as $payment) {
                $contract->payments()->create($payment);
            }
        }

        return redirect()->route('customers.show', $validated['customer_id'])
            ->with('success', "تم إنشاء العقد {$contract->contract_number} بنجاح.");
    }

    private function nextSerial(): string
    {
        $last = Contract::latest('id')->first();
        $seq  = $last ? ((int) substr($last->contract_number, 5)) + 1 : 1;
        return '10015' . str_pad($seq, 5, '0', STR_PAD_LEFT);
    }
}
