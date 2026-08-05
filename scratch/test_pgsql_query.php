<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

try {
    $tenant = Tenant::first();
    if (!$tenant) {
        throw new \Exception("No tenant found");
    }
    tenancy()->initialize($tenant);
    echo "Tenancy initialized for: {$tenant->id}\n";
    
    // Run a dry run of the query with a dummy contract ID (e.g. 1)
    $contractId = 1;
    
    $query = \App\Models\InventoryEntry::where(function ($q) use ($contractId) {
        $q->where(function ($q1) use ($contractId) {
            $q1->where('voucher_type', \App\Models\Reception::class)
                ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contractId)->pluck('id'));
        })->orWhere(function ($q2) use ($contractId) {
            $q2->where('voucher_type', \App\Models\Delivery::class)
                ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contractId)->pluck('id'));
        });
    })
        ->select('pallet_id')
        ->groupBy('pallet_id')
        ->having(DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0);
        
    echo "Query SQL: " . $query->toSql() . "\n";
    
    // Execute the query
    $results = $query->get();
    echo "Query executed successfully. Result count: " . $results->count() . "\n";
    
} catch (\Exception $e) {
    echo "Query failed with error: " . $e->getMessage() . "\n";
}
