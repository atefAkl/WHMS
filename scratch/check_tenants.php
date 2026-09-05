<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- TENANTS & DOMAINS ---\n";
foreach (\App\Models\Tenant::with('domains')->get() as $t) {
    echo "Tenant ID: " . $t->id . " | Domains: " . $t->domains->pluck('domain')->implode(', ') . "\n";
}

echo "\n--- CHECKING DATA IN TENANTS ---\n";
foreach (\App\Models\Tenant::all() as $t) {
    echo "Initializing tenant: " . $t->id . "\n";
    try {
        tenancy()->initialize($t);
        $custCount = \Illuminate\Support\Facades\Schema::hasTable('customers') ? \App\Models\Customer::count() : 0;
        $contCount = \Illuminate\Support\Facades\Schema::hasTable('contracts') ? \App\Models\Contract::count() : 0;
        $entryCount = \Illuminate\Support\Facades\Schema::hasTable('inventory_entries') ? \App\Models\InventoryEntry::count() : 0;
        echo "  - Customers: {$custCount}\n";
        echo "  - Contracts: {$contCount}\n";
        echo "  - Inventory Entries: {$entryCount}\n";
        tenancy()->end();
    } catch (\Exception $e) {
        echo "  - Error: " . $e->getMessage() . "\n";
    }
}
