<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contract_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            // 'large' | 'small'  — static for now, will be dynamic later
            $table->string('pallet_size');          // large / small
            $table->unsignedSmallInteger('unit_count');
            $table->decimal('monthly_rent', 10, 2); // per unit per month
            $table->decimal('discount', 5, 2)->default(0);
            $table->decimal('vat_rate', 5, 2)->default(15);
            $table->decimal('subtotal_before_vat', 10, 2)->storedAs(
                'ROUND(unit_count * monthly_rent * (1 - discount / 100), 2)'
            );
            // subtotal after VAT stored as well for quick retrieval
            $table->decimal('subtotal', 10, 2)->storedAs(
                'ROUND(unit_count * monthly_rent * (1 - discount / 100) * (1 + vat_rate / 100), 2)'
            );
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('contract_items'); }
};
