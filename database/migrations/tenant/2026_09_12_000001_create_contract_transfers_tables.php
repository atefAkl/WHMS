<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->index();
            $table->date('transfer_date');
            $table->foreignId('source_contract_id')->constrained('contracts')->onDelete('cascade');
            $table->foreignId('destination_contract_id')->constrained('contracts')->onDelete('cascade');
            $table->foreignId('source_customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('destination_customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('period_id')->nullable()->constrained('contract_periods')->onDelete('set null');
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('set null');
            $table->string('farm_source')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('contract_transfer_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_transfer_id')->constrained('contract_transfers')->onDelete('cascade');
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->onDelete('cascade');
            $table->foreignId('inventory_item_variant_id')->nullable()->constrained('inventory_item_variants')->onDelete('set null');
            $table->foreignId('pallet_id')->nullable()->constrained('pallets')->onDelete('set null');
            $table->decimal('quantity', 15, 2)->default(0);
            $table->string('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_transfer_items');
        Schema::dropIfExists('contract_transfers');
    }
};
