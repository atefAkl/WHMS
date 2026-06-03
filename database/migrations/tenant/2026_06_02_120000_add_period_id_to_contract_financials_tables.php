<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_invoices', function (Blueprint $table) {
            $table->foreignId('period_id')
                ->nullable()
                ->after('contract_id')
                ->constrained('contract_periods')
                ->nullOnDelete();
            $table->index(['contract_id', 'period_id']);
        });

        Schema::table('contract_payments', function (Blueprint $table) {
            $table->foreignId('period_id')
                ->nullable()
                ->after('contract_id')
                ->constrained('contract_periods')
                ->nullOnDelete();
            $table->foreignId('invoice_id')
                ->nullable()
                ->after('period_id')
                ->constrained('contract_invoices')
                ->nullOnDelete();
            $table->index(['contract_id', 'period_id']);
        });
    }

    public function down(): void
    {
        Schema::table('contract_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invoice_id');
            $table->dropConstrainedForeignId('period_id');
        });

        Schema::table('contract_invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('period_id');
        });
    }
};
