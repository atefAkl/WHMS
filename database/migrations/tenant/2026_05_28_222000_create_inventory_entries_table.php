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
        Schema::create('inventory_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained()->onDelete('cascade');
            $table->foreignId('inventory_item_variant_id')->constrained('inventory_item_variants')->onDelete('cascade');
            $table->foreignId('pallet_id')->constrained()->onDelete('cascade');
            $table->string('voucher_type');
            $table->unsignedBigInteger('voucher_id');
            $table->decimal('quantity_in', 10, 2)->default(0.00);
            $table->decimal('quantity_out', 10, 2)->default(0.00);
            $table->timestamp('operation_date');
            $table->softDeletes();
            $table->timestamps();

            // Indexing for polymorphic relations and lookup
            $table->index(['voucher_type', 'voucher_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_entries');
    }
};
