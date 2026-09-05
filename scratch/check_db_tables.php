<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = \App\Models\Tenant::find('aymnosa');
tenancy()->initialize($tenant);

$tables = ['customers', 'contracts', 'inventory_entries', 'pallets', 'users'];
foreach ($tables as $tbl) {
    $count = \Illuminate\Support\Facades\DB::table($tbl)->count();
    echo "Table {$tbl} in tenantaymnosa: {$count} rows\n";
}

tenancy()->end();
