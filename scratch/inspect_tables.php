<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

$tenants = Tenant::all();

foreach ($tenants as $tenant) {
    echo "Tenant: {$tenant->id}\n";
    tenancy()->initialize($tenant);

    try {
        $contractsCount = DB::table('contracts')->count();
        $receptionsCount = DB::table('receptions')->count();
        $itemsCount = DB::table('storage_items')->count();
        echo "  contracts: {$contractsCount}, receptions: {$receptionsCount}, storage_items: {$itemsCount}\n";
    } catch (\Exception $e) {
        echo "  [ERROR] " . $e->getMessage() . "\n";
    }

    tenancy()->end();
}
