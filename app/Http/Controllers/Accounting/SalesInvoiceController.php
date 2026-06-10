<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Customer;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceLine;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class SalesInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesInvoice::with(['customer', 'contract', 'creator']);

        if ($request->filled('trashed') && $request->trashed === 'true') {
            $query->onlyTrashed();
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
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

        $invoices = $query->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Sales/Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'status', 'from_date', 'to_date', 'trashed'])
        ]);
    }

    public function create()
    {
        $customers = Customer::select('id', 'name')->orderBy('name')->get();
        $accounts = Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();
        
        return Inertia::render('Sales/Invoices/CreateEdit', [
            'customers' => $customers,
            'accounts' => $accounts,
            'invoice' => null,
        ]);
    }

    public function store(Request $request)
    {
        return $this->saveInvoice($request, new SalesInvoice());
    }

    public function show(SalesInvoice $invoice)
    {
        $invoice->load(['customer', 'contract', 'period', 'creator', 'lines.account', 'journalEntry']);
        return Inertia::render('Sales/Invoices/Show', [
            'invoice' => $invoice
        ]);
    }

    public function edit(SalesInvoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return redirect()->route('sales.invoices.index')->with('error', 'لا يمكن تعديل فاتورة تم اعتمادها');
        }
        
        $invoice->load('lines');
        $customers = Customer::select('id', 'name')->orderBy('name')->get();
        $accounts = Account::where('is_transactional', true)->where('is_active', true)->orderBy('code')->get();
        
        return Inertia::render('Sales/Invoices/CreateEdit', [
            'customers' => $customers,
            'accounts' => $accounts,
            'invoice' => $invoice
        ]);
    }

    public function update(Request $request, SalesInvoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'لا يمكن تعديل فاتورة تم اعتمادها'], 403);
            }
            return redirect()->route('sales.invoices.index')->with('error', 'لا يمكن تعديل فاتورة تم اعتمادها');
        }

        return $this->saveInvoice($request, $invoice);
    }

    private function saveInvoice(Request $request, SalesInvoice $invoice)
    {
        $rules = [
            'customer_id' => 'required|exists:customers,id',
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'notes' => 'nullable|string|max:1000',
            'lines' => 'required|array|min:1',
            'lines.*.description' => 'required|string|max:255',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.quantity' => 'required|numeric|min:0.01',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'lines.*.tax_rate' => 'required|numeric|min:0',
        ];

        $validated = $request->validate($rules);

        DB::beginTransaction();
        try {
            if (!$invoice->exists) {
                $year = Carbon::parse($validated['date'])->format('y');
                $month = Carbon::parse($validated['date'])->format('m');
                
                $lastInvoice = SalesInvoice::whereMonth('date', $month)
                    ->whereYear('date', Carbon::parse($validated['date'])->format('Y'))
                    ->orderBy('id', 'desc')
                    ->first();
                
                $serial = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -4)) + 1 : 1;
                $refNumber = "INV-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT);
                
                $invoice->invoice_number = $refNumber;
                $invoice->created_by = auth()->id();
            }

            $invoice->customer_id = $validated['customer_id'];
            $invoice->date = Carbon::parse($validated['date'])->format('Y-m-d');
            $invoice->due_date = Carbon::parse($validated['due_date'])->format('Y-m-d');
            $invoice->notes = $validated['notes'];
            $invoice->status = 'draft';

            // Calculate totals
            $subtotal = 0;
            $taxAmount = 0;
            
            foreach ($validated['lines'] as $line) {
                $lineSubtotal = round($line['quantity'] * $line['unit_price'], 2);
                $lineTax = round($lineSubtotal * ($line['tax_rate'] / 100), 2);
                $subtotal += $lineSubtotal;
                $taxAmount += $lineTax;
            }
            
            $invoice->subtotal = $subtotal;
            $invoice->tax_amount = $taxAmount;
            $invoice->total_amount = $subtotal + $taxAmount;
            
            $invoice->save();

            // Save Lines
            $invoice->lines()->delete(); // clear existing for simplicity
            
            foreach ($validated['lines'] as $line) {
                $lineSubtotal = round($line['quantity'] * $line['unit_price'], 2);
                $lineTax = round($lineSubtotal * ($line['tax_rate'] / 100), 2);
                
                $invoice->lines()->create([
                    'description' => $line['description'],
                    'account_id' => $line['account_id'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price'],
                    'subtotal' => $lineSubtotal,
                    'tax_rate' => $line['tax_rate'],
                    'tax_amount' => $lineTax,
                    'total' => $lineSubtotal + $lineTax,
                ]);
            }

            DB::commit();

            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'تم حفظ الفاتورة بنجاح',
                    'invoice' => $invoice
                ]);
            }

            return redirect()->route('sales.invoices.index')->with('success', 'تم حفظ الفاتورة بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->wantsJson()) {
                return response()->json(['message' => 'حدث خطأ أثناء الحفظ'], 500);
            }
            return redirect()->back()->with('error', 'حدث خطأ أثناء الحفظ: ' . $e->getMessage())->withInput();
        }
    }

    public function destroy(SalesInvoice $invoice)
    {
        if ($invoice->status !== 'draft' && $invoice->status !== 'cancelled') {
            return redirect()->back()->with('error', 'لا يمكن حذف فاتورة معتمدة');
        }

        $invoice->delete();
        return redirect()->route('sales.invoices.index')->with('success', 'تم حذف الفاتورة بنجاح');
    }

    public function approve(SalesInvoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return redirect()->back()->with('error', 'الفاتورة معتمدة مسبقاً');
        }

        DB::beginTransaction();
        try {
            // Generate Journal Entry
            $year = Carbon::parse($invoice->date)->format('y');
            $month = Carbon::parse($invoice->date)->format('m');
            $lastEntry = JournalEntry::withTrashed()->whereMonth('date', $month)
                ->whereYear('date', Carbon::parse($invoice->date)->format('Y'))
                ->orderBy('id', 'desc')->first();
            $serial = $lastEntry ? intval(substr($lastEntry->reference_number, -4)) + 1 : 1;
            $refNumber = "JV-{$year}{$month}-" . str_pad($serial, 4, '0', STR_PAD_LEFT);

            $description = "فاتورة مبيعات رقم {$invoice->invoice_number} - العميل: " . ($invoice->customer->name ?? '');

            $journalEntry = JournalEntry::create([
                'reference_number' => $refNumber,
                'date' => Carbon::parse($invoice->date)->format('Y-m-d H:i:s'),
                'description' => $description,
                'status' => 'posted',
                'created_by' => auth()->id(),
            ]);

            // Accounts mapping (Ideally these are settings, but we assume default mappings or we just use Accounts Receivable)
            // Debit Accounts Receivable (Customer Account or default AR account)
            // For now, let's just pick the first Accounts Receivable type account. 
            $arAccount = Account::where('type', 'asset')->where('name', 'like', '%عملاء%')->first() 
                ?? Account::where('is_transactional', true)->first(); // Fallback

            // Debit AR
            JournalLine::create([
                'journal_entry_id' => $journalEntry->id,
                'account_id' => $arAccount->id,
                'description' => $description,
                'debit' => $invoice->total_amount,
                'credit' => 0,
            ]);

            // Credit Revenue Accounts based on lines
            foreach ($invoice->lines as $line) {
                JournalLine::create([
                    'journal_entry_id' => $journalEntry->id,
                    'account_id' => $line->account_id,
                    'description' => "مبيعات - " . $line->description,
                    'debit' => 0,
                    'credit' => $line->subtotal,
                ]);
            }

            // Credit VAT account if there's VAT
            if ($invoice->tax_amount > 0) {
                $vatAccount = Account::where('type', 'liability')->where('name', 'like', '%ضريبة%')->first();
                if ($vatAccount) {
                    JournalLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'account_id' => $vatAccount->id,
                        'description' => "ضريبة القيمة المضافة - فاتورة {$invoice->invoice_number}",
                        'debit' => 0,
                        'credit' => $invoice->tax_amount,
                    ]);
                } else {
                    // Fallback: add to revenue or error
                    // we'll just use the first line's revenue account if VAT account is not found
                    JournalLine::create([
                        'journal_entry_id' => $journalEntry->id,
                        'account_id' => $invoice->lines->first()->account_id,
                        'description' => "ضريبة القيمة المضافة - فاتورة {$invoice->invoice_number}",
                        'debit' => 0,
                        'credit' => $invoice->tax_amount,
                    ]);
                }
            }

            $invoice->update([
                'status' => 'approved',
                'journal_entry_id' => $journalEntry->id
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'تم اعتماد الفاتورة وإنشاء القيد المحاسبي بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء اعتماد الفاتورة: ' . $e->getMessage());
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

        // abort_unless(auth()->user()->can('revoke_invoice_approve'), 403, 'لا تملك صلاحية فك الاعتماد');

        $invoice = SalesInvoice::findOrFail($id);

        if ($invoice->status !== 'approved') {
            return redirect()->back()->with('error', 'الفاتورة ليست معتمدة');
        }
        
        if ($invoice->paid_amount > 0) {
             return redirect()->back()->with('error', 'لا يمكن فك اعتماد فاتورة تم السداد عليها جزئياً أو كلياً');
        }

        DB::beginTransaction();
        try {
            if ($invoice->journal_entry_id) {
                $journalEntry = JournalEntry::find($invoice->journal_entry_id);
                if ($journalEntry) {
                    $journalEntry->delete();
                }
            }

            $invoice->update([
                'status' => 'cancelled', // or draft
                'journal_entry_id' => null
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'تم فك اعتماد الفاتورة وإلغاء القيد المحاسبي بنجاح');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء فك الاعتماد: ' . $e->getMessage());
        }
    }
}
