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
        Schema::create('exit_authorizations', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('contract_id')->nullable()->constrained('contracts')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('status')->default('pending'); // pending, completed, cancelled
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('exit_authorization_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exit_authorization_id')->constrained('exit_authorizations')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('inventory_item_variant_id')->constrained('inventory_item_variants')->cascadeOnDelete();
            $table->string('pallet_number')->nullable();
            $table->double('quantity', 15, 4);
            $table->timestamps();
        });

        Schema::create('deliveries', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number')->unique();
            $table->foreignId('exit_authorization_id')->nullable()->constrained('exit_authorizations')->nullOnDelete();
            $table->string('written_reference')->nullable();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('contract_id')->nullable()->constrained('contracts')->nullOnDelete();
            $table->foreignId('period_id')->nullable()->constrained('contract_periods')->nullOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->foreignId('representative_id')->nullable()->constrained('contract_agents')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->dateTime('delivery_date');
            $table->string('status')->default('draft'); // draft, approved
            $table->json('history')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deliveries');
        Schema::dropIfExists('exit_authorization_items');
        Schema::dropIfExists('exit_authorizations');
    }
};
