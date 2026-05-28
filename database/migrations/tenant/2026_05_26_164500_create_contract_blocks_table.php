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
        Schema::create('contract_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('season_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('contract_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->boolean('is_enabled')->default(true);
            $table->text('content')->nullable(); // Stores text or JSON configuration
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            // Prevent duplicate keys for same season/contract
            // In MySQL/PostgreSQL, a partial unique index can be used, or a general unique constraint:
            // But we will use unique constraints to avoid duplicates.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_blocks');
    }
};
