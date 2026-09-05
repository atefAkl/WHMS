<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = \App\Models\Tenant::find('aymnosa');
tenancy()->initialize($tenant);

$dumpFile = 'database/tenant_thalaga_dump_fixed.sql';
if (!file_exists($dumpFile)) {
    die("Dump file not found: {$dumpFile}\n");
}

echo "Disabling Foreign Key checks via session_replication_role...\n";
\Illuminate\Support\Facades\DB::statement("SET session_replication_role = 'replica'");

echo "Truncating existing tables to avoid duplicate key conflicts...\n";
$tables = [
    'customers',
    'contracts',
    'contract_periods',
    'contract_agents',
    'drivers',
    'inventory_categories',
    'inventory_items',
    'inventory_item_variants',
    'pallets',
    'receptions',
    'deliveries',
    'inventory_adjustments',
    'pallet_rearrangements',
    'inventory_entries',
    'users',
];

foreach ($tables as $tbl) {
    if (\Illuminate\Support\Facades\Schema::hasTable($tbl)) {
        \Illuminate\Support\Facades\DB::statement('TRUNCATE TABLE "' . $tbl . '" CASCADE');
    }
}

echo "Reading and importing dump file {$dumpFile}...\n";
$sqlContent = file_get_contents($dumpFile);
$lines = explode("\n", $sqlContent);

$inserted = [];
$errors = [];

foreach ($lines as $line) {
    $line = trim($line);
    if (empty($line) || str_starts_with($line, '--')) {
        continue;
    }

    if (str_starts_with($line, 'INSERT INTO')) {
        preg_match('/INSERT INTO "([^"]+)"/', $line, $m);
        $tbl = $m[1] ?? 'unknown';

        try {
            \Illuminate\Support\Facades\DB::statement($line);
            $inserted[$tbl] = ($inserted[$tbl] ?? 0) + 1;
        } catch (\Exception $e) {
            $errors[] = "Table {$tbl} error: " . $e->getMessage();
        }
    }
}

echo "Re-enabling Foreign Key checks...\n";
\Illuminate\Support\Facades\DB::statement("SET session_replication_role = 'origin'");

echo "\n================ IMPORT SUMMARY ================\n";
foreach ($inserted as $tbl => $cnt) {
    echo "  ✔ Table {$tbl}: {$cnt} rows inserted.\n";
}

if (!empty($errors)) {
    echo "\n--- ERRORS (" . count($errors) . ") ---\n";
    foreach (array_slice($errors, 0, 5) as $err) {
        echo "  ✖ {$err}\n";
    }
}

tenancy()->end();
