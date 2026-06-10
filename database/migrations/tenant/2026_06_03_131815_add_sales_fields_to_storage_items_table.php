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
        Schema::table('storage_items', function (Blueprint $table) {
            $table->foreignId('sales_category_id')->nullable()->constrained('sales_categories')->nullOnDelete();
            $table->enum('type', ['item', 'service'])->default('item');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('storage_items', function (Blueprint $table) {
            $table->dropForeign(['sales_category_id']);
            $table->dropColumn(['sales_category_id', 'type']);
        });
    }
};
