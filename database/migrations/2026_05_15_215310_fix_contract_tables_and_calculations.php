<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Fix discount precision in contracts
        Schema::table('contracts', function (Blueprint $table) {
            $table->decimal('discount', 10, 2)->default(0)->change();
        });

        // Drop stored columns and pallet_size
        Schema::table('contract_items', function (Blueprint $table) {
            $table->dropColumn(['pallet_size', 'subtotal_before_vat', 'subtotal']);
            // Change discount precision
            $table->decimal('discount', 10, 2)->default(0)->change();
        });

        // Add regular columns back
        Schema::table('contract_items', function (Blueprint $table) {
            $table->foreignId('storage_item_id')->nullable()->after('contract_id')->constrained('storage_items')->nullOnDelete();
            $table->decimal('subtotal_before_vat', 10, 2)->default(0)->after('vat_rate');
            $table->decimal('subtotal', 10, 2)->default(0)->after('subtotal_before_vat');
        });
    }

    public function down(): void
    {
        // 
    }
};
