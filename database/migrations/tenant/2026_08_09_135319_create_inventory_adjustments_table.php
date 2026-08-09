<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 50)->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->foreignId('period_id')->nullable()->constrained('contract_periods')->nullOnDelete();
            $table->date('adjustment_date');
            $table->string('adjustment_type', 20)->default('surplus'); // surplus, deficit, mixed
            $table->text('reason')->nullable();
            $table->string('proof_file')->nullable();
            $table->string('status', 20)->default('draft'); // draft, approved, cancelled
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_adjustment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_adjustment_id')->constrained('inventory_adjustments')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_item_variant_id')->constrained('inventory_item_variants')->cascadeOnDelete();
            $table->foreignId('pallet_id')->constrained('pallets')->cascadeOnDelete();
            $table->float('system_quantity')->default(0);
            $table->float('actual_quantity')->default(0);
            $table->float('variance_quantity')->default(0); // positive: surplus (in), negative: deficit (out)
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustment_items');
        Schema::dropIfExists('inventory_adjustments');
    }
};
