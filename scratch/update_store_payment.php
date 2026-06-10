<?php

$path = 'C:\laragon\www\WHMS\app\Http\Controllers\ContractController.php';
$content = file_get_contents($path);

// Define the replacement function for storePayment
$storePaymentReplacement = <<<EOF
    public function storePayment(Request \$request, Contract \$contract)
    {
        \$validated = \$request->validate([
            'period_id' => 'nullable|exists:contract_periods,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method' => 'required|in:cash,bank_transfer,cheque',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
            'invoice_id' => 'nullable|exists:sales_invoices,id',
            'primary_account_id' => 'required|exists:accounts,id',
        ]);

        \$period = null;
        if (!empty(\$validated['period_id'])) {
            \$period = \$contract->periods()->find(\$validated['period_id']);
            if (!\$period) {
                return back()->withErrors(['period_id' => 'الفترة المحددة غير صالحة.']);
            }
        }

        \$invoice = null;
        if (!empty(\$validated['invoice_id'])) {
            // Can pay invoices for this contract (not just this period)
            \$invoice = \$contract->invoices()
                ->find(\$validated['invoice_id']);

            if (!\$invoice) {
                return back()->withErrors(['invoice_id' => 'الفاتورة المحددة غير صالحة.']);
            }
        }

        \Illuminate\Support\Facades\DB::beginTransaction();
        try {
            // Counterpart account logic: Revenue if invoice selected, else Customer.
            \$customerAccount = \App\Models\Account::where('type', 'asset')->where('name', 'like', '%عملاء%')->first() 
                ?? \App\Models\Account::where('is_transactional', true)->first();
            \$revenueAccount = \App\Models\Account::where('type', 'revenue')->first();
            
            \$counterAccountId = (\$invoice && \$revenueAccount) ? \$revenueAccount->id : (\$customerAccount ? \$customerAccount->id : null);

            // Generate Voucher Number
            \$year = \Carbon\Carbon::parse(\$validated['payment_date'])->format('y');
            \$month = \Carbon\Carbon::parse(\$validated['payment_date'])->format('m');
            \$lastVoucher = \App\Models\FinancialVoucher::where('type', 'receipt')
                ->whereMonth('date', \$month)
                ->whereYear('date', \Carbon\Carbon::parse(\$validated['payment_date'])->format('Y'))
                ->orderBy('id', 'desc')
                ->first();
            \$serial = \$lastVoucher ? intval(substr(\$lastVoucher->voucher_number, -4)) + 1 : 1;
            \$refNumber = "RV-{\$year}{\$month}-" . str_pad(\$serial, 4, '0', STR_PAD_LEFT);

            \$description = \$validated['notes'] ?: "دفعة من العميل لعقد رقم {\$contract->contract_number}";
            if (\$invoice) {
                \$description .= " - سداد فاتورة رقم {\$invoice->invoice_number}";
            }

            \$voucher = \App\Models\FinancialVoucher::create([
                'voucher_number' => \$refNumber,
                'type' => 'receipt',
                'date' => \$validated['payment_date'],
                'amount' => \$validated['amount'],
                'primary_account_id' => \$validated['primary_account_id'],
                'counter_account_id' => \$counterAccountId,
                'reference' => \$validated['reference'] ?? null,
                'description' => \$description,
                'status' => 'draft',
                'contract_id' => \$contract->id,
                'customer_id' => \$contract->customer_id,
                'created_by' => auth()->id(),
            ]);

            if (\$invoice || \$period) {
                \App\Models\ContractPayment::create([
                    'contract_id' => \$contract->id,
                    'period_id' => \$period ? \$period->id : (\$invoice ? \$invoice->period_id : null),
                    'invoice_id' => \$invoice ? \$invoice->id : null,
                    'voucher_id' => \$voucher->id,
                    'amount' => \$validated['amount'],
                    'payment_date' => \$validated['payment_date'],
                ]);
            }

            \Illuminate\Support\Facades\DB::commit();

            return redirect()->back()->with('success', 'تم تسجيل الدفعة بنجاح.');
        } catch (\Exception \$e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return redirect()->back()->with('error', 'حدث خطأ أثناء التسجيل: ' . \$e->getMessage());
        }
    }
EOF;

$regex = '/public function storePayment\(Request \$request, Contract \$contract\).*?\n    \}/ms';
$content = preg_replace($regex, trim($storePaymentReplacement), $content, 1);

file_put_contents($path, $content);

echo "Done.";
