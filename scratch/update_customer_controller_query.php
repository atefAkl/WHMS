<?php

$path = 'C:\laragon\www\WHMS\app\Http\Controllers\CustomerController.php';
$content = file_get_contents($path);

// Update accounts query in index method
$target = <<<'EOF'
        $accounts   = \App\Models\Account::where('is_transactional', true)->get();
EOF;

$replacement = <<<'EOF'
        $accounts   = \App\Models\Account::where('is_transactional', true)
            ->where(function ($query) {
                $query->where('code', 'like', '1103%') // العملاء / الذمم المدينة
                      ->orWhere('code', 'like', '2101%'); // الموردين / الذمم الدائنة
            })
            ->get();
EOF;

$content = str_replace($target, $replacement, $content);

file_put_contents($path, $content);
echo "CustomerController accounts query updated.";
