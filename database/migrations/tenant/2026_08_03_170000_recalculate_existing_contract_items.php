<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\ContractItem;

return new class extends Migration
{
    public function up(): void
    {
        // Recalculate all contract items
        $items = ContractItem::with('contract')->get();
        foreach ($items as $item) {
            if (!$item->contract) {
                continue;
            }
            $unitCount = $item->unit_count ?? 0;
            $monthlyRent = $item->monthly_rent ?? 0.00;
            $discount = $item->discount ?? 0.00;
            $vatRate = $item->vat_rate ?? 15.00;
            $duration = $item->contract->mandatory_period ?? 1;

            $item->subtotal = round($duration * $unitCount * ($monthlyRent - $discount), 2);
            $item->subtotal_before_vat = round(($item->subtotal * 100) / (100 + $vatRate), 2);
            $item->saveQuietly();
        }
    }

    public function down(): void
    {
        // No rollback needed for data correction
    }
};
