<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('inventory_entries', 'contract_id')) {
            Schema::table('inventory_entries', function (Blueprint $table) {
                $table->foreignId('contract_id')->nullable()->after('pallet_id')->constrained('contracts')->onDelete('cascade');
                $table->index('contract_id');
            });
        }

        // Backfill contract_id for existing inventory_entries from vouchers
        DB::transaction(function () {
            // 1. Receptions
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = receptions.contract_id 
                FROM receptions 
                WHERE (inventory_entries.voucher_type LIKE '%Reception' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Reception')
                AND inventory_entries.voucher_id = receptions.id
                AND inventory_entries.contract_id IS NULL
            ");

            // 2. Deliveries
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = deliveries.contract_id 
                FROM deliveries 
                WHERE (inventory_entries.voucher_type LIKE '%Delivery' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Delivery')
                AND inventory_entries.voucher_id = deliveries.id
                AND inventory_entries.contract_id IS NULL
            ");

            // 3. InventoryAdjustments
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = inventory_adjustments.contract_id 
                FROM inventory_adjustments 
                WHERE (inventory_entries.voucher_type LIKE '%InventoryAdjustment' OR inventory_entries.voucher_type = 'App\\\\Models\\\\InventoryAdjustment')
                AND inventory_entries.voucher_id = inventory_adjustments.id
                AND inventory_entries.contract_id IS NULL
            ");

            // 4. PalletRearrangements
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = pallet_rearrangements.contract_id 
                FROM pallet_rearrangements 
                WHERE (inventory_entries.voucher_type LIKE '%PalletRearrangement' OR inventory_entries.voucher_type = 'App\\\\Models\\\\PalletRearrangement')
                AND inventory_entries.voucher_id = pallet_rearrangements.id
                AND inventory_entries.contract_id IS NULL
            ");

            // 5. Fallback via reception voucher if any entry remained NULL
            DB::statement("
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('inventory_entries', 'contract_id')) {
            Schema::table('inventory_entries', function (Blueprint $table) {
                $table->dropForeign(['contract_id']);
                $table->dropIndex(['contract_id']);
                $table->dropColumn('contract_id');
            });
        }
    }
};
