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
        // 1. Drop existing pivot tables
        Schema::dropIfExists('season_terms');
        Schema::dropIfExists('contract_terms');

        // 2. Add columns to terms table
        Schema::table('terms', function (Blueprint $table) {
            $table->foreignId('season_id')->nullable()->after('is_active')->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->nullable()->after('season_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->after('contract_id')->constrained('terms')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('terms', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropForeign(['contract_id']);
            $table->dropForeign(['season_id']);
            $table->dropColumn(['parent_id', 'contract_id', 'season_id']);
        });

        Schema::create('season_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unique(['season_id', 'term_id']);
        });

        Schema::create('contract_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unique(['contract_id', 'term_id']);
        });
    }
};
