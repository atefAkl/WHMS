<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = \App\Models\Tenant::find('aymnosa');
tenancy()->initialize($tenant);

$types = \Illuminate\Support\Facades\DB::table('inventory_entries')
    ->select('voucher_type', \Illuminate\Support\Facades\DB::raw('count(*) as cnt'))
    ->groupBy('voucher_type')
    ->get();

echo "DISTINCT VOUCHER TYPES IN INVENTORY_ENTRIES:\n";
foreach ($types as $t) {
    echo "  - Type: '{$t->voucher_type}' | Count: {$t->cnt}\n";
}

$sample = \Illuminate\Support\Facades\DB::table('inventory_entries')->first();
if ($sample) {
    echo "\nSAMPLE ROW:\n";
    print_r($sample);
}

tenancy()->end();
