<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Contract;
use App\Models\Tenant;

$tenants = Tenant::all();

foreach ($tenants as $tenant) {
    echo "Testing Tenant: {$tenant->id}\n";
    tenancy()->initialize($tenant);

    try {
        $contracts = Contract::all();
        foreach ($contracts as $contract) {
            echo "  Contract ID: {$contract->id} ({$contract->contract_number})\n";
            
            // Try to run the query
            $bookedPallets = $contract->total_capacity ?: 0;
            
            $utilizedPallets = \App\Models\InventoryEntry::where(function ($q) use ($contract) {
                $q->where(function ($q1) use ($contract) {
                    $q1->where('voucher_type', \App\Models\Reception::class)
                        ->whereIn('voucher_id', \App\Models\Reception::where('contract_id', $contract->id)->pluck('id'));
                })->orWhere(function ($q2) use ($contract) {
                    $q2->where('voucher_type', \App\Models\Delivery::class)
                        ->whereIn('voucher_id', \App\Models\Delivery::where('contract_id', $contract->id)->pluck('id'));
                });
            })
                ->select('pallet_id')
                ->groupBy('pallet_id')
                ->having(\Illuminate\Support\Facades\DB::raw('SUM(quantity_in) - SUM(quantity_out)'), '>', 0)
                ->get()
                ->count();
                
            echo "    Booked: {$bookedPallets}, Utilized: {$utilizedPallets}\n";
        }
    } catch (\Exception $e) {
        echo "  [ERROR] " . $e->getMessage() . "\n";
    }

    tenancy()->end();
}
