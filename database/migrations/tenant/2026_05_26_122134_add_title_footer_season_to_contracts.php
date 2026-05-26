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
        Schema::table('contracts', function (Blueprint $table) {
            $table->string('contract_title')->nullable()->after('contract_number');
            $table->text('footer')->nullable()->after('preamble');
            $table->foreignId('season_id')->nullable()->after('customer_id')->constrained()->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['season_id']);
            $table->dropColumn(['contract_title', 'footer', 'season_id']);
        });
    }
};
