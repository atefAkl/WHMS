<?php

$path = 'C:\laragon\www\WHMS\app\Http\Controllers\CustomerController.php';
$content = file_get_contents($path);

// 1. Add account_id to validation rules
$rulesTarget = <<<'EOF'
            'category_id'  => 'required|exists:customer_categories,id',
        ];
    }
EOF;
$rulesReplacement = <<<'EOF'
            'category_id'  => 'required|exists:customer_categories,id',
            'account_id'   => 'nullable|exists:accounts,id',
        ];
    }
EOF;
$content = str_replace($rulesTarget, $rulesReplacement, $content);

// 2. Add accounts to the index view data
$indexTarget = <<<'EOF'
        $categories = \App\Models\CustomerCategory::all();

        $businessParent      = \App\Models\CustomerCategory::whereNull('parent_id')
EOF;
$indexReplacement = <<<'EOF'
        $categories = \App\Models\CustomerCategory::all();
        $accounts   = \App\Models\Account::where('is_transactional', true)->get();

        $businessParent      = \App\Models\CustomerCategory::whereNull('parent_id')
EOF;
$content = str_replace($indexTarget, $indexReplacement, $content);

// 3. Pass it to Inertia::render
$inertiaTarget = <<<'EOF'
            'customers'  => $customers,
            'countries'  => $countries,
            'categories' => $categories,
            'filters'    => $request->only(['search']),
EOF;
$inertiaReplacement = <<<'EOF'
            'customers'  => $customers,
            'countries'  => $countries,
            'categories' => $categories,
            'accounts'   => $accounts,
            'filters'    => $request->only(['search']),
EOF;
$content = str_replace($inertiaTarget, $inertiaReplacement, $content);

file_put_contents($path, $content);
echo "CustomerController updated.";
