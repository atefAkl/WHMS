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
        Schema::create('financial_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_number')->unique();
            $table->enum('type', ['receipt', 'payment']);
            $table->date('date');
            $table->decimal('amount', 15, 2);
            $table->foreignId('primary_account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignId('counter_account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('reference')->nullable();
            $table->string('description')->nullable();
            $table->enum('status', ['draft', 'approved', 'cancelled'])->default('draft');
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->onDelete('set null');
            $table->foreignId('contract_id')->nullable()->constrained('contracts')->onDelete('set null');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_vouchers');
    }
};
