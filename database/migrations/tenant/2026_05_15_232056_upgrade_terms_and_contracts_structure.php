<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Upgrade terms table
        Schema::table('terms', function (Blueprint $table) {
            $table->boolean('has_variables')->default(false)->after('is_active');
            $table->unsignedInteger('sort_order')->default(0)->after('has_variables');
        });

        // 2. Upgrade contract_terms pivot
        Schema::table('contract_terms', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('term_id');
        });

        // 3. Create season_terms pivot
        Schema::create('season_terms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->constrained()->cascadeOnDelete();
            $table->foreignId('term_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->unique(['season_id', 'term_id']);
        });

        // 4. Add introduction and preamble to contracts
        Schema::table('contracts', function (Blueprint $table) {
            $table->text('introduction')->nullable()->after('vat_rate');
            $table->text('preamble')->nullable()->after('introduction');
        });
    }

    public function down(): void
    {
        Schema::table('terms', function (Blueprint $table) {
            $table->dropColumn(['has_variables', 'sort_order']);
        });
        Schema::table('contract_terms', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
        Schema::dropIfExists('season_terms');
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['introduction', 'preamble']);
        });
    }
};
