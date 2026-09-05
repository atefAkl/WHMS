<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = \App\Models\Tenant::find('aymnosa');
tenancy()->initialize($tenant);

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

$sql = "-- WHMS Tenant Backup for Tenant: aymnosa\n";
$sql .= "SET session_replication_role = 'replica';\n\n";

foreach ($tables as $table) {
    if (!\Illuminate\Support\Facades\Schema::hasTable($table)) {
        continue;
    }

    $rows = \Illuminate\Support\Facades\DB::table($table)->get();
    if ($rows->isEmpty()) {
        continue;
    }

    $sql .= "-- Data for table {$table}\n";
    foreach ($rows as $row) {
        $array = (array) $row;
        $columns = array_keys($array);
        $escapedColumns = array_map(fn($col) => '"' . $col . '"', $columns);
        
        $values = array_map(function ($val) {
            if (is_null($val)) return 'NULL';
            if (is_bool($val)) return $val ? 'TRUE' : 'FALSE';
            if (is_numeric($val)) return $val;
            $str = (string) $val;
            $str = str_replace(["\r\n", "\r", "\n"], "\\n", $str);
            $str = str_replace("'", "''", $str);
            return "'" . $str . "'";
        }, array_values($array));

        $sql .= 'INSERT INTO "' . $table . '" (' . implode(', ', $escapedColumns) . ') VALUES (' . implode(', ', $values) . ");\n";
    }
    $sql .= "\n";
}

$sql .= "SET session_replication_role = 'origin';\n";

file_put_contents('database/tenant_aymnosa_fresh_dump.sql', $sql);
echo "Fresh dump generated successfully at database/tenant_aymnosa_fresh_dump.sql! Total bytes: " . strlen($sql) . "\n";

tenancy()->end();
