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
        Schema::table('contract_settings', function (Blueprint $table) {
            $table->dropUnique(['key']);
            $table->foreignId('season_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->unique(['season_id', 'key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contract_settings', function (Blueprint $table) {
            $table->dropUnique(['season_id', 'key']);
            $table->dropForeign(['season_id']);
            $table->dropColumn('season_id');
            $table->unique('key');
        });
    }
};
