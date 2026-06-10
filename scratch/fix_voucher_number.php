<?php

$path = 'C:\laragon\www\WHMS\app\Http\Controllers\Accounting\FinancialVoucherController.php';
$content = file_get_contents($path);

// Fix voucher number generation
$target1 = <<<'EOF'
                $lastVoucher = FinancialVoucher::where('type', $validated['type'])
                    ->whereMonth('date', $month)
                    ->whereYear('date', Carbon::parse($validated['date'])->format('Y'))
                    ->orderBy('id', 'desc')
                    ->first();
EOF;

$replacement1 = <<<'EOF'
                $lastVoucher = FinancialVoucher::withTrashed()
                    ->where('type', $validated['type'])
                    ->whereMonth('date', $month)
                    ->whereYear('date', Carbon::parse($validated['date'])->format('Y'))
                    ->orderBy('id', 'desc')
                    ->first();
EOF;

$content = str_replace($target1, $replacement1, $content);

file_put_contents($path, $content);
echo "FinancialVoucherController fixed.";
