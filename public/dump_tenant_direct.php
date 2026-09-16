<?php

/**
 * Direct Standalone Tenant SQL Dump Generator for cPanel Hosting
 * Bypasses domain scoping and route caching.
 */

try {
    if (!function_exists('app') || !app()) {
        require dirname(__DIR__) . '/vendor/autoload.php';
        $app = require dirname(__DIR__) . '/bootstrap/app.php';
        if (is_object($app) && method_exists($app, 'make')) {
            $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
            $kernel->bootstrap();
        }
    }
} catch (\Throwable $e) {
    // If already booted in web request lifecycle, continue
}

try {
    $tenantId = $_GET['tenant'] ?? request()->query('tenant') ?? null;
    $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : \App\Models\Tenant::first();

    if (!$tenant) {
        if (function_exists('http_response_code')) {
            http_response_code(404);
        }
        die("Error: No tenant found in central database.\n");
    }

    $tenantId = $tenant->id;
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

    $sql = "-- WHMS Standalone Tenant Backup for Tenant: {$tenantId}\n";
    $sql .= "-- Generated at: " . date('Y-m-d H:i:s') . "\n\n";
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

    tenancy()->end();

    if (!headers_sent()) {
        header('Content-Type: text/plain; charset=UTF-8');
        header('Content-Disposition: attachment; filename="tenant_' . $tenantId . '_dump.sql"');
    }
    echo $sql;
    exit;
} catch (\Throwable $e) {
    if (function_exists('http_response_code')) {
        http_response_code(500);
    }
    echo "Error generating dump: " . $e->getMessage();
    exit;
}
