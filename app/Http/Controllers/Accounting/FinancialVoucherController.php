<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\FinancialVoucher;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class FinancialVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = FinancialVoucher::with(['primaryAccount', 'counterAccount', 'creator', 'customer']);

        if ($request->filled('trashed') && $request->trashed === 'true') {
            $query->onlyTrashed();
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('voucher_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('date', '<=', $request->to_date);
        }

        $vouchers = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Accounting/Vouchers/Index', [
            'vouchers' => $vouchers,
            'filters' => $request->only(['search', 'type', 'status', 'from_date', 'to_date', 'trashed'])
        ]);
    }

    public function create()
    {
        $accounts = Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();
        $customers = \App\Models\Customer::select('id', 'name')->orderBy('name')->get();
        
        return Inertia::render('Accounting/Vouchers/CreateEdit', [
            'accounts' => $accounts,
            'customers' => $customers,
            'voucher' => null,
        ]);
    }

    public function store(Request $request)
    {
        return $this->saveVoucher($request, new FinancialVoucher());
    }

    public function update(Request $request, FinancialVoucher $financial_voucher)
    {
        if ($financial_voucher->status === 'approved') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'لا يمكن تعديل سند معتمد'], 403);
            }
            return redirect()->route('accounting.financial-vouchers.index')->with('error', 'لا يمكن تعديل سند معتمد');
        }

        return $this->saveVoucher($request, $financial_voucher);
    }

    private function saveVoucher(Request $request, FinancialVoucher $voucher)
    {
        $rules = [
            'type' => 'required|in:receipt,payment',
            'date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'primary_account_id' => 'required|exists:accounts,id',
            'counter_account_id' => 'required|exists:accounts,id',
            'reference' => 'nullable|string|max:255',
            'description' => 'required|string|max:500',
            'customer_id' => 'nullable|exists:customers,id',
        ];

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            if (!$voucher->exists) {
                $year = Carbon::parse($validated['date'])->format('y');
                $month = Carbon::parse($validated['date'])->format('m');
                $prefix = $validated['type'] === 'receipt' ? 'RV' : 'PV';
                
                $lastVoucher = FinancialVoucher::where('type', $validated['type'])
                    ->whereMonth('date', $month)
                    ->whereYear('date', Carbon::parse($validated['date'])->format('Y'))
                    ->orderBy('id', 'desc')
                    ->first();
                
                $serial = $lastVoucher ? intval(substr($lastVoucher->voucher_number, -4)) + 1 : 1;
                $refNumber = "{$prefix}-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT);
                
                $voucher->voucher_number = $refNumber;
                $voucher->created_by = auth()->id();
            }

            $voucher->type = $validated['type'];
            $voucher->date = Carbon::parse($validated['date'])->format('Y-m-d');
            $voucher->amount = $validated['amount'];
            $voucher->primary_account_id = $validated['primary_account_id'];
            $voucher->counter_account_id = $validated['counter_account_id'];
            $voucher->reference = $validated['reference'];
            $voucher->description = $validated['description'];
            $voucher->customer_id = $validated['customer_id'] ?? null;
            $voucher->status = 'draft';
            $voucher->save();

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'تم حفظ السند بنجاح',
                    'voucher' => $voucher
                ]);
            }

            return redirect()->route('accounting.financial-vouchers.index')->with('success', 'تم حفظ السند بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->wantsJson()) {
                return response()->json(['message' => 'حدث خطأ أثناء الحفظ'], 500);
            }
            return redirect()->back()->with('error', 'حدث خطأ أثناء الحفظ: ' . $e->getMessage())->withInput();
        }
    }

    public function show(FinancialVoucher $financial_voucher)
    {
        $financial_voucher->load(['primaryAccount', 'counterAccount', 'creator', 'journalEntry', 'customer', 'contract']);
        return Inertia::render('Accounting/Vouchers/Show', [
            'voucher' => $financial_voucher
        ]);
    }

    public function edit(FinancialVoucher $financial_voucher)
    {
        if ($financial_voucher->status === 'approved') {
            return redirect()->route('accounting.financial-vouchers.index')->with('error', 'لا يمكن تعديل سند معتمد');
        }
        
        $accounts = Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();
        $customers = \App\Models\Customer::select('id', 'name')->orderBy('name')->get();
        
        return Inertia::render('Accounting/Vouchers/CreateEdit', [
            'accounts' => $accounts,
            'customers' => $customers,
            'voucher' => $financial_voucher
        ]);
    }

    public function destroy(FinancialVoucher $financial_voucher)
    {
        if ($financial_voucher->status === 'approved') {
            return redirect()->back()->with('error', 'لا يمكن حذف سند معتمد');
        }

        $financial_voucher->delete();
        return redirect()->route('accounting.financial-vouchers.index')->with('success', 'تم حذف السند بنجاح');
    }

    public function approve(FinancialVoucher $financial_voucher)
    {
        if ($financial_voucher->status === 'approved') {
            return redirect()->back()->with('error', 'السند معتمد بالفعل');
        }

        DB::beginTransaction();
        try {
            // Generate Journal Entry
            $year = Carbon::parse($financial_voucher->date)->format('y');
            $month = Carbon::parse($financial_voucher->date)->format('m');
            $lastEntry = JournalEntry::whereMonth('date', $month)
                ->whereYear('date', Carbon::parse($financial_voucher->date)->format('Y'))
                ->orderBy('id', 'desc')->first();
            $serial = $lastEntry ? intval(substr($lastEntry->reference_number, -4)) + 1 : 1;
            $refNumber = "JV-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT);

            $descPrefix = $financial_voucher->type === 'receipt' ? 'سند قبض' : 'سند صرف';
            $description = "{$descPrefix} رقم {$financial_voucher->voucher_number} - {$financial_voucher->description}";

            $journalEntry = JournalEntry::create([
                'reference_number' => $refNumber,
                'date' => Carbon::parse($financial_voucher->date)->format('Y-m-d H:i:s'),
                'description' => $description,
                'status' => 'posted',
                'created_by' => auth()->id(),
            ]);

            // For Receipt: Debit Primary (Cash), Credit Counter (Revenue/Customer)
            // For Payment: Credit Primary (Cash), Debit Counter (Expense/Supplier)
            $debitAccountId = $financial_voucher->type === 'receipt' ? $financial_voucher->primary_account_id : $financial_voucher->counter_account_id;
            $creditAccountId = $financial_voucher->type === 'receipt' ? $financial_voucher->counter_account_id : $financial_voucher->primary_account_id;

            JournalLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $debitAccountId,
                'description' => $description,
                'debit' => $financial_voucher->amount,
                'credit' => 0,
            ]);

            JournalLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $creditAccountId,
                'description' => $description,
                'debit' => 0,
                'credit' => $financial_voucher->amount,
            ]);

            // Update Voucher
            $financial_voucher->update([
                'status' => 'approved',
                'journal_entry_id' => $journalEntry->id
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'تم اعتماد السند وإنشاء قيد اليومية بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء اعتماد السند: ' . $e->getMessage());
        }
    }

    public function unapprove(Request $request, $id)
    {
        $request->validate([
            'password' => 'required|string'
        ]);

        if (!\Illuminate\Support\Facades\Hash::check($request->password, auth()->user()->password)) {
            return redirect()->back()->with('error', 'كلمة المرور غير صحيحة');
        }

        // Uncomment if you use Spatie permissions
        // abort_unless(auth()->user()->can('revoke_voucher_approve'), 403, 'لا تملك صلاحية فك الاعتماد');

        $financial_voucher = FinancialVoucher::findOrFail($id);

        if ($financial_voucher->status !== 'approved') {
            return redirect()->back()->with('error', 'السند ليس معتمداً');
        }

        DB::beginTransaction();
        try {
            if ($financial_voucher->journal_entry_id) {
                $journalEntry = JournalEntry::find($financial_voucher->journal_entry_id);
                if ($journalEntry) {
                    $journalEntry->delete();
                }
            }

            $financial_voucher->update([
                'status' => 'draft',
                'journal_entry_id' => null
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'تم فك اعتماد السند وإلغاء القيد المحاسبي بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء فك الاعتماد: ' . $e->getMessage());
        }
    }
}
