<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contract_period_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_period_id')->constrained('contract_periods')->cascadeOnDelete();
            $table->foreignId('storage_item_id')->constrained('storage_items')->restrictOnDelete();
            $table->unsignedInteger('unit_count')->default(0);
            $table->decimal('monthly_rent', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('vat_rate', 5, 2)->default(15);
            $table->timestamps();

            $table->unique(['contract_period_id', 'storage_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contract_period_items');
    }
};
