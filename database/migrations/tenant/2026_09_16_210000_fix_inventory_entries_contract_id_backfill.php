<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            // 1. Receptions
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = receptions.contract_id 
                FROM receptions 
                WHERE (inventory_entries.voucher_type LIKE '%Reception' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Reception')
                AND inventory_entries.voucher_id = receptions.id
                AND (inventory_entries.contract_id IS NULL OR inventory_entries.contract_id = 0)
                AND receptions.contract_id IS NOT NULL
            ");

            // 2. Deliveries
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = deliveries.contract_id 
                FROM deliveries 
                WHERE (inventory_entries.voucher_type LIKE '%Delivery' OR inventory_entries.voucher_type = 'App\\\\Models\\\\Delivery')
                AND inventory_entries.voucher_id = deliveries.id
                AND (inventory_entries.contract_id IS NULL OR inventory_entries.contract_id = 0)
                AND deliveries.contract_id IS NOT NULL
            ");

            // 3. InventoryAdjustments
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = inventory_adjustments.contract_id 
                FROM inventory_adjustments 
                WHERE (inventory_entries.voucher_type LIKE '%InventoryAdjustment' OR inventory_entries.voucher_type = 'App\\\\Models\\\\InventoryAdjustment')
                AND inventory_entries.voucher_id = inventory_adjustments.id
                AND (inventory_entries.contract_id IS NULL OR inventory_entries.contract_id = 0)
                AND inventory_adjustments.contract_id IS NOT NULL
            ");

            // 4. PalletRearrangements
            DB::statement("
                UPDATE inventory_entries 
                SET contract_id = pallet_rearrangements.contract_id 
                FROM pallet_rearrangements 
                WHERE (inventory_entries.voucher_type LIKE '%PalletRearrangement' OR inventory_entries.voucher_type = 'App\\\\Models\\\\PalletRearrangement')
                AND inventory_entries.voucher_id = pallet_rearrangements.id
                AND (inventory_entries.contract_id IS NULL OR inventory_entries.contract_id = 0)
                AND pallet_rearrangements.contract_id IS NOT NULL
            ");
        } catch (\Throwable $e) {
            // Log or ignore if table/columns differ across environments
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
