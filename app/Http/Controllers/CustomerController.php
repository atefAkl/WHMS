<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use Inertia\Inertia;

class CustomerController extends Controller
{
    /** Shared validation rules */
    private function rules(string $mode = 'create', ?int $customerId = null): array
    {
        $ignore = $customerId ? ",{$customerId}" : '';

        return [
            'name'         => "required|string|max:255|unique:customers,name{$ignore}",
            'foreign_name' => 'nullable|string|max:255',
            'phone_number' => [
                'required',
                "unique:customers,phone_number{$ignore}",
                'regex:/^5\d{8}$/',
            ],
            'email'        => ['nullable', 'email:rfc', "unique:customers,email{$ignore}"],
            'id_number'    => ['nullable', 'string', "unique:customers,id_number{$ignore}"],
            'cr_number'    => ['nullable', 'digits:10', "unique:customers,cr_number{$ignore}"],
            'vat_number'   => ['nullable', 'digits:15', "unique:customers,vat_number{$ignore}"],
            'website'      => 'nullable|url:http,https|max:255',
            'address'      => 'nullable|string|max:1000',
            'country_id'   => 'required|exists:countries,id',
            'category_id'  => 'required|exists:customer_categories,id',
        ];
    }

    private function messages(): array
    {
        return [
            'name.unique'         => 'هذا الاسم مسجّل مسبقاً.',
            'phone_number.regex'  => 'رقم الهاتف يجب أن يبدأ بـ 5 ويتكون من 9 أرقام.',
            'phone_number.unique' => 'رقم الهاتف مسجّل مسبقاً.',
            'email.email'         => 'البريد الإلكتروني غير صالح.',
            'email.unique'        => 'البريد الإلكتروني مسجّل مسبقاً.',
            'id_number.unique'    => 'رقم الهوية/الإقامة مسجّل مسبقاً.',
            'cr_number.digits'    => 'رقم السجل التجاري يجب أن يكون 10 أرقام بالضبط.',
            'cr_number.unique'    => 'رقم السجل التجاري مسجّل مسبقاً.',
            'vat_number.digits'   => 'الرقم الضريبي يجب أن يكون 15 رقماً بالضبط.',
            'vat_number.unique'   => 'الرقم الضريبي مسجّل مسبقاً.',
            'website.url'         => 'رابط الموقع الإلكتروني غير صالح.',
        ];
    }

    public function index(Request $request)
    {
        $query = Customer::query();
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q->where('name', 'like', "%$s%")
                ->orWhere('phone_number', 'like', "%$s%")
                ->orWhere('id_number', 'like', "%$s%"));
        }

        $activeSeason = \App\Models\Season::find(session('active_season_id'));
        $seasonStart = $activeSeason?->start_date;
        $seasonEnd = $activeSeason?->end_date;

        $customers  = $query->with([
            'category.parent', 
            'country', 
            'contracts' => function($q) use ($seasonStart, $seasonEnd) {
                if ($seasonStart && $seasonEnd) {
                    $q->where(function($sub) use ($seasonStart, $seasonEnd) {
                        $sub->whereBetween('start_date', [$seasonStart, $seasonEnd])
                            ->orWhereBetween('end_date', [$seasonStart, $seasonEnd])
                            ->orWhere(function($sub2) use ($seasonStart, $seasonEnd) {
                                $sub2->where('start_date', '<=', $seasonStart)
                                     ->where('end_date', '>=', $seasonEnd);
                            });
                    });
                }
            }
        ])->latest()->paginate(10)->withQueryString();
        $countries  = \App\Models\Country::all();
        $categories = \App\Models\CustomerCategory::all();

        $businessParent      = \App\Models\CustomerCategory::whereNull('parent_id')
            ->where(fn($q) => $q->where('name_ar', 'like', '%أعمال%')->orWhere('name_en', 'like', '%business%'))
            ->first();
        $businessCategoryIds = $businessParent
            ? \App\Models\CustomerCategory::where('parent_id', $businessParent->id)->pluck('id')
            : collect();

        return Inertia::render('Customers/Index', [
            'customers'  => $customers,
            'countries'  => $countries,
            'categories' => $categories,
            'filters'    => $request->only(['search']),
            'stats'      => [
                'total'            => Customer::count(),
                'business'         => Customer::whereIn('category_id', $businessCategoryIds)->count(),
                'withoutContracts' => Customer::doesntHave('contracts')->count(),
                'newLast30'        => Customer::where('created_at', '>=', now()->subDays(30))->count(),
            ],
        ]);
    }

    public function show(string $id)
    {
        $customer = Customer::with([
            'country',
            'category.parent',
            'contacts',
            'contracts' => fn($q) => $q->latest()->limit(20),
        ])->findOrFail($id);

        return Inertia::render('Customers/Show', [
            'customer'   => $customer,
            'countries'  => \App\Models\Country::all(),
            'categories' => \App\Models\CustomerCategory::all(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate($this->rules('create'), $this->messages());
        Customer::create($request->all());
        return redirect()->route('customers.index')->with('success', 'تم إضافة العميل بنجاح.');
    }

    public function update(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);
        $request->validate($this->rules('update', (int) $id), $this->messages());
        $customer->update($request->all());
        return redirect()->back()->with('success', 'تم تحديث بيانات العميل بنجاح.');
    }

    public function destroy(\App\Http\Requests\DeleteResourceRequest $request, string $id)
    {
        Customer::findOrFail($id)->delete();
        return redirect()->route('customers.index')->with('success', 'تم حذف العميل بنجاح.');
    }
}
