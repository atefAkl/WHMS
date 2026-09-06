<?php

/**
 * Level 2 Backfill Executer for Tenant: thalaga
 * Populates contract_id on all existing inventory_entries rows
 */

require dirname(__DIR__) . '/vendor/autoload.php';
$app = require_once dirname(__DIR__) . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain; charset=utf-8');
echo "=========================================================\n";
echo "      LEVEL 2: BACKFILLING CONTRACT_ID ON LIVE DATA      \n";
echo "=========================================================\n\n";

try {
    $tenantId = $_GET['tenant'] ?? 'thalaga';
    $tenant = \App\Models\Tenant::find($tenantId) ?: \App\Models\Tenant::first();

    if (!$tenant) {
        die("Error: Tenant not found.\n");
    }

    tenancy()->initialize($tenant);

    $totalBefore = \Illuminate\Support\Facades\DB::table('inventory_entries')->count();
    $nullBefore = \Illuminate\Support\Facades\DB::table('inventory_entries')->whereNull('contract_id')->count();

    echo "Before Backfill:\n";
    echo "  - Total Inventory Entries: {$totalBefore}\n";
    echo "  - NULL contract_id Entries: {$nullBefore}\n\n";

    echo "Executing Level 2 Update Queries...\n";

    \Illuminate\Support\Facades\DB::transaction(function () {
        // 1. Receptions
        $q1 = \Illuminate\Support\Facades\DB::statement("
            UPDATE inventory_entries 
            SET contract_id = receptions.contract_id 
            FROM receptions 
            WHERE (inventory_entries.voucher_type LIKE '%Reception' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Reception')
            AND inventory_entries.voucher_id = receptions.id
            AND inventory_entries.contract_id IS NULL
        ");

        // 2. Deliveries
        $q2 = \Illuminate\Support\Facades\DB::statement("
            UPDATE inventory_entries 
            SET contract_id = deliveries.contract_id 
            FROM deliveries 
            WHERE (inventory_entries.voucher_type LIKE '%Delivery' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Delivery')
            AND inventory_entries.voucher_id = deliveries.id
            AND inventory_entries.contract_id IS NULL
        ");

        // 3. InventoryAdjustments
        $q3 = \Illuminate\Support\Facades\DB::statement("
            UPDATE inventory_entries 
            SET contract_id = inventory_adjustments.contract_id 
            FROM inventory_adjustments 
            WHERE (inventory_entries.voucher_type LIKE '%InventoryAdjustment' OR inventory_entries.voucher_type = 'App\\\\Models\\\\InventoryAdjustment')
            AND inventory_entries.voucher_id = inventory_adjustments.id
            AND inventory_entries.contract_id IS NULL
        ");

        // 4. PalletRearrangements
        $q4 = \Illuminate\Support\Facades\DB::statement("
            UPDATE inventory_entries 
            SET contract_id = pallet_rearrangements.contract_id 
            FROM pallet_rearrangements 
            WHERE (inventory_entries.voucher_type LIKE '%PalletRearrangement' OR inventory_entries.voucher_type = 'App\\\\Models\\\\PalletRearrangement')
            AND inventory_entries.voucher_id = pallet_rearrangements.id
            AND inventory_entries.contract_id IS NULL
        ");

        // 5. Fallback via reception voucher if any entry remained NULL
        $q5 = \Illuminate\Support\Facades\DB::statement("
            UPDATE inventory_entries 
            SET contract_id = (
                SELECT r.contract_id 
                FROM receptions r 
                JOIN inventory_entries ie2 ON ie2.voucher_id = r.id AND ie2.voucher_type LIKE '%Reception'
                WHERE ie2.pallet_id = inventory_entries.pallet_id AND r.contract_id IS NOT NULL 
                ORDER BY r.created_at ASC LIMIT 1
            )
            WHERE inventory_entries.contract_id IS NULL
        ");
    });

    $totalAfter = \Illuminate\Support\Facades\DB::table('inventory_entries')->count();
    $nullAfter = \Illuminate\Support\Facades\DB::table('inventory_entries')->whereNull('contract_id')->count();
    $populatedAfter = \Illuminate\Support\Facades\DB::table('inventory_entries')->whereNotNull('contract_id')->count();

    echo "\n=========================================================\n";
    echo "               LEVEL 2 RESULT AUDIT                      \n";
    echo "=========================================================\n";
    echo "  ✔ Populated Entries: {$populatedAfter} / {$totalAfter}\n";
    echo "  ✔ Remaining NULL Entries: {$nullAfter}\n";
    
    if ($nullAfter === 0) {
        echo "\n🎉 SUCCESS: 100% of all entries populated cleanly! Level 2 Complete!\n";
    } else {
        echo "\n⚠️ WARNING: {$nullAfter} entries remain NULL.\n";
    }

    tenancy()->end();
} catch (\Exception $e) {
    echo "\n✖ Error: " . $e->getMessage() . "\n";
}
