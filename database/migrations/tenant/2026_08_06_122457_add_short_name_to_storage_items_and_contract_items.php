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
        if (Schema::hasTable('storage_items') && !Schema::hasColumn('storage_items', 'short_name')) {
            Schema::table('storage_items', function (Blueprint $table) {
                $table->string('short_name')->nullable()->after('name');
            });
        }

        if (Schema::hasTable('contract_items') && !Schema::hasColumn('contract_items', 'short_name')) {
            Schema::table('contract_items', function (Blueprint $table) {
                $table->string('short_name')->nullable()->after('storage_item_id');
            });
        }

        if (Schema::hasTable('contract_period_items') && !Schema::hasColumn('contract_period_items', 'short_name')) {
            Schema::table('contract_period_items', function (Blueprint $table) {
                $table->string('short_name')->nullable()->after('storage_item_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storage_items') && Schema::hasColumn('storage_items', 'short_name')) {
            Schema::table('storage_items', function (Blueprint $table) {
                $table->dropColumn('short_name');
            });
        }

        if (Schema::hasTable('contract_items') && Schema::hasColumn('contract_items', 'short_name')) {
            Schema::table('contract_items', function (Blueprint $table) {
                $table->dropColumn('short_name');
            });
        }

        if (Schema::hasTable('contract_period_items') && Schema::hasColumn('contract_period_items', 'short_name')) {
            Schema::table('contract_period_items', function (Blueprint $table) {
                $table->dropColumn('short_name');
            });
        }
    }
};
