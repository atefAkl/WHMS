<?php

$path = 'C:\laragon\www\WHMS\app\Http\Controllers\Accounting\FinancialVoucherController.php';
$content = file_get_contents($path);

// Fix journal entry reference number generation
$target2 = <<<'EOF'
            $lastEntry = JournalEntry::whereMonth('date', $month)
                ->whereYear('date', Carbon::parse($financial_voucher->date)->format('Y'))
                ->orderBy('id', 'desc')->first();
EOF;

$replacement2 = <<<'EOF'
            $lastEntry = JournalEntry::withTrashed()
                ->whereMonth('date', $month)
                ->whereYear('date', Carbon::parse($financial_voucher->date)->format('Y'))
                ->orderBy('id', 'desc')->first();
EOF;

$content = str_replace($target2, $replacement2, $content);

// Ensure we also check SalesInvoiceController and other places that might create Journal Entries
// But for now just fix this controller

file_put_contents($path, $content);
echo "FinancialVoucherController JV fix applied.";
