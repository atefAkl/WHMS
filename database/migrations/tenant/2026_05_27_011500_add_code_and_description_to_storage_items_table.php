<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('storage_items')) {
            Schema::table('storage_items', function (Blueprint $table) {
                if (!Schema::hasColumn('storage_items', 'code')) {
                    $table->string('code', 20)->nullable()->after('id');
                }
                if (!Schema::hasColumn('storage_items', 'description_ar')) {
                    $table->text('description_ar')->nullable()->after('name_en');
                }
                if (!Schema::hasColumn('storage_items', 'description_en')) {
                    $table->text('description_en')->nullable()->after('description_ar');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('storage_items')) {
            Schema::table('storage_items', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('storage_items', 'code')) {
                    $columns[] = 'code';
                }
                if (Schema::hasColumn('storage_items', 'description_ar')) {
                    $columns[] = 'description_ar';
                }
                if (Schema::hasColumn('storage_items', 'description_en')) {
                    $columns[] = 'description_en';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
