<?php

// 1. Update routes/web.php
$routesPath = 'C:\laragon\www\WHMS\routes\web.php';
$routesContent = file_get_contents($routesPath);

$targetRoute = <<<'EOF'
    Route::resource('customers', CustomerController::class);
EOF;
$replacementRoute = <<<'EOF'
    Route::get('customers/{customer}/statement', [CustomerController::class, 'statement'])->name('customers.statement');
    Route::resource('customers', CustomerController::class);
EOF;
if (!str_contains($routesContent, 'customers.statement')) {
    $routesContent = str_replace($targetRoute, $replacementRoute, $routesContent);
    file_put_contents($routesPath, $routesContent);
}

// 2. Update CustomerController.php
$controllerPath = 'C:\laragon\www\WHMS\app\Http\Controllers\CustomerController.php';
$controllerContent = file_get_contents($controllerPath);

$newMethod = <<<'EOF'
    public function statement(Customer $customer, Request $request)
    {
        $invoices = \App\Models\SalesInvoice::where('customer_id', $customer->id)
            ->whereIn('status', ['posted', 'paid', 'partially_paid'])
            ->get()
            ->map(function ($inv) {
                return [
                    'id' => $inv->id,
                    'date' => $inv->invoice_date,
                    'type' => 'invoice',
                    'type_ar' => 'فاتورة مبيعات',
                    'type_en' => 'Sales Invoice',
                    'reference' => $inv->invoice_number,
                    'description' => 'فاتورة مبيعات رقم ' . $inv->invoice_number,
                    'debit' => $inv->total_amount,
                    'credit' => 0,
                    'timestamp' => strtotime($inv->invoice_date . ' 00:00:00'),
                ];
            });

        $vouchers = \App\Models\FinancialVoucher::where('customer_id', $customer->id)
            ->whereIn('status', ['approved'])
            ->get()
            ->map(function ($voucher) {
                $isReceipt = $voucher->type === 'receipt';
                return [
                    'id' => $voucher->id,
                    'date' => $voucher->date,
                    'type' => 'voucher',
                    'type_ar' => $isReceipt ? 'سند قبض' : 'سند صرف',
                    'type_en' => $isReceipt ? 'Receipt Voucher' : 'Payment Voucher',
                    'reference' => $voucher->voucher_number,
                    'description' => $voucher->description ?? ($isReceipt ? 'دفعة نقدية/بنكية' : 'رد دفعة'),
                    'debit' => $isReceipt ? 0 : $voucher->amount,
                    'credit' => $isReceipt ? $voucher->amount : 0,
                    'timestamp' => strtotime($voucher->date . ' 00:00:01'), // slightly after invoice if same day
                ];
            });

        $transactions = $invoices->concat($vouchers)->sortBy('timestamp')->values();

        $runningBalance = 0;
        foreach ($transactions as $key => $tx) {
            $runningBalance += $tx['debit'] - $tx['credit'];
            $transactions[$key]['balance'] = $runningBalance;
        }

        return Inertia::render('Customers/Statement', [
            'customer' => $customer,
            'transactions' => $transactions,
            'total_balance' => $runningBalance
        ]);
    }
}
EOF;

// Replace the last closing brace with the new method
if (!str_contains($controllerContent, 'function statement(')) {
    $controllerContent = preg_replace('/\}\s*$/', "\n" . $newMethod, $controllerContent);
    file_put_contents($controllerPath, $controllerContent);
}

echo "Routes and Controller updated.";
