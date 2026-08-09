<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pallet_rearrangements', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('contract_id')->constrained('contracts')->cascadeOnDelete();
            $table->foreignId('period_id')->nullable()->constrained('contract_periods')->nullOnDelete();
            $table->date('rearrangement_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['draft', 'approved'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('pallet_rearrangement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pallet_rearrangement_id')->constrained('pallet_rearrangements')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_item_variant_id')->constrained('inventory_item_variants')->cascadeOnDelete();
            $table->foreignId('pallet_id')->constrained('pallets')->cascadeOnDelete();
            $table->enum('type', ['in', 'out']); // 'out' = transferred from this pallet, 'in' = transferred into this pallet
            $table->decimal('quantity', 15, 2);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pallet_rearrangement_items');
        Schema::dropIfExists('pallet_rearrangements');
    }
};
