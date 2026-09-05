<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tenant = \App\Models\Tenant::find('aymnosa');
tenancy()->initialize($tenant);

echo "=========================================================\n";
echo "       STARTING OFFLINE MIGRATION & AUDIT TEST           \n";
echo "=========================================================\n\n";

// 1. Initial State Audit
$totalEntries = \App\Models\InventoryEntry::count();
$totalIn = \App\Models\InventoryEntry::sum('quantity_in');
$totalOut = \App\Models\InventoryEntry::sum('quantity_out');

echo "[BEFORE MIGRATION AUDIT]\n";
echo "  - Total Inventory Entries: {$totalEntries}\n";
echo "  - Total Packages In: {$totalIn}\n";
echo "  - Total Packages Out: {$totalOut}\n\n";

// Reset contract_id to NULL to simulate fresh unmigrated state
\Illuminate\Support\Facades\DB::table('inventory_entries')->update(['contract_id' => null]);

echo "[EXECUTING MIGRATION & BACKFILL LOGIC...]\n";

if (!\Illuminate\Support\Facades\Schema::hasColumn('inventory_entries', 'contract_id')) {
    \Illuminate\Support\Facades\Schema::table('inventory_entries', function (\Illuminate\Database\Schema\Blueprint $table) {
        $table->foreignId('contract_id')->nullable()->after('pallet_id')->constrained('contracts')->onDelete('cascade');
        $table->index('contract_id');
    });
    echo "  ✔ Added nullable contract_id column & index.\n";
} else {
    echo "  ℹ contract_id column already exists.\n";
}

// Perform Backfill Transactions
\Illuminate\Support\Facades\DB::transaction(function () {
    // 1. Receptions
    \Illuminate\Support\Facades\DB::statement("
        UPDATE inventory_entries 
        SET contract_id = receptions.contract_id 
        FROM receptions 
        WHERE (inventory_entries.voucher_type LIKE '%Reception' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Reception')
        AND inventory_entries.voucher_id = receptions.id
        AND inventory_entries.contract_id IS NULL
    ");

    // 2. Deliveries
    \Illuminate\Support\Facades\DB::statement("
        UPDATE inventory_entries 
        SET contract_id = deliveries.contract_id 
        FROM deliveries 
        WHERE (inventory_entries.voucher_type LIKE '%Delivery' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Delivery')
        AND inventory_entries.voucher_id = deliveries.id
        AND inventory_entries.contract_id IS NULL
    ");

    // 3. InventoryAdjustments
    \Illuminate\Support\Facades\DB::statement("
        UPDATE inventory_entries 
        SET contract_id = inventory_adjustments.contract_id 
        FROM inventory_adjustments 
        WHERE (inventory_entries.voucher_type LIKE '%InventoryAdjustment' OR inventory_entries.voucher_type = 'App\\\\Models\\\\InventoryAdjustment')
        AND inventory_entries.voucher_id = inventory_adjustments.id
        AND inventory_entries.contract_id IS NULL
    ");

    // 4. PalletRearrangements
    \Illuminate\Support\Facades\DB::statement("
        UPDATE inventory_entries 
        SET contract_id = pallet_rearrangements.contract_id 
        FROM pallet_rearrangements 
        WHERE (inventory_entries.voucher_type LIKE '%PalletRearrangement' OR inventory_entries.voucher_type = 'App\\\\Models\\\\PalletRearrangement')
        AND inventory_entries.voucher_id = pallet_rearrangements.id
        AND inventory_entries.contract_id IS NULL
    ");

    // 5. Fallback via reception voucher if any entry remained NULL
    \Illuminate\Support\Facades\DB::statement("
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

echo "  ✔ Backfill completed successfully across all vouchers & fallbacks.\n\n";

// 3. Post-Migration Audit Checks
echo "[POST-MIGRATION AUDIT & INTEGRITY CHECK]\n";

$nullEntriesCount = \App\Models\InventoryEntry::whereNull('contract_id')->count();
$populatedEntriesCount = \App\Models\InventoryEntry::whereNotNull('contract_id')->count();
$afterTotalIn = \App\Models\InventoryEntry::sum('quantity_in');
$afterTotalOut = \App\Models\InventoryEntry::sum('quantity_out');

echo "  - Populated Entries: {$populatedEntriesCount} / {$totalEntries}\n";
echo "  - Remaining NULL Entries: {$nullEntriesCount}\n";
echo "  - Total Packages In (After): {$afterTotalIn} (Match: " . ($totalIn == $afterTotalIn ? 'YES' : 'NO') . ")\n";
echo "  - Total Packages Out (After): {$afterTotalOut} (Match: " . ($totalOut == $afterTotalOut ? 'YES' : 'NO') . ")\n\n";

if ($nullEntriesCount === 0) {
    echo "SUCCESS: 100% of inventory entries were backfilled with their contract_id! Zero NULL entries remain.\n";
} else {
    echo "WARNING: {$nullEntriesCount} entries still have contract_id = NULL!\n";
}

echo "=========================================================\n";

tenancy()->end();
