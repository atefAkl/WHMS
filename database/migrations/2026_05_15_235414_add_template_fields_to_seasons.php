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
        Schema::table('seasons', function (Blueprint $table) {
            $table->text('introduction')->nullable()->after('is_active');
            $table->text('preamble')->nullable()->after('introduction');
            $table->integer('mandatory_period')->default(12)->after('preamble');
            $table->integer('renewal_period')->default(12)->after('mandatory_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seasons', function (Blueprint $table) {
            $table->dropColumn(['introduction', 'preamble', 'mandatory_period', 'renewal_period']);
        });
    }
};
