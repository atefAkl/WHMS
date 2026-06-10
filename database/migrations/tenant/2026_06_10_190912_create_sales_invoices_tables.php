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
        // Drop foreign key from contract_payments first
        if (Schema::hasColumn('contract_payments', 'invoice_id')) {
            Schema::table('contract_payments', function (Blueprint $table) {
                $table->dropForeign(['invoice_id']);
                $table->dropColumn('invoice_id');
            });
        }

        // Drop old table if exists
        Schema::dropIfExists('contract_invoices');

        Schema::create('sales_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('restrict');
            $table->foreignId('contract_id')->nullable()->constrained('contracts')->onDelete('set null');
            $table->foreignId('period_id')->nullable()->constrained('contract_periods')->onDelete('set null');
            
            $table->date('date');
            $table->date('due_date');
            
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            
            $table->enum('status', ['draft', 'approved', 'partially_paid', 'paid', 'cancelled'])->default('draft');
            
            $table->text('notes')->nullable();
            
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sales_invoice_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_invoice_id')->constrained('sales_invoices')->onDelete('cascade');
            $table->string('description');
            $table->foreignId('account_id')->nullable()->constrained('accounts')->onDelete('set null'); // Revenue account
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_rate', 5, 2)->default(15); // 15% VAT
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_invoice_lines');
        Schema::dropIfExists('sales_invoices');
    }
};
