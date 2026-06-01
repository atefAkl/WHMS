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
        Schema::table('receptions', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->change();
            $table->foreignId('contract_id')->nullable()->change();
            $table->foreignId('period_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receptions', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable(false)->change();
            $table->foreignId('contract_id')->nullable(false)->change();
            $table->foreignId('period_id')->nullable(false)->change();
        });
    }
};
