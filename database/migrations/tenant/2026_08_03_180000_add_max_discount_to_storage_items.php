<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('storage_items', 'max_discount_percent')) {
            Schema::table('storage_items', function (Blueprint $table) {
                $table->decimal('max_discount_percent', 5, 2)->default(0.00);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('storage_items', 'max_discount_percent')) {
            Schema::table('storage_items', function (Blueprint $table) {
                $table->dropColumn('max_discount_percent');
            });
        }
    }
};
