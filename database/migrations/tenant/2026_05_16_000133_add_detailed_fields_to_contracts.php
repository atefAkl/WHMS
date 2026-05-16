<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->date('contract_date')->after('contract_number')->nullable();
            $table->integer('mandatory_period')->default(12)->change();
            $table->integer('renewal_period')->default(12)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn('contract_date');
            $table->tinyInteger('mandatory_period')->default(1)->change();
            $table->tinyInteger('renewal_period')->default(0)->change();
        });
    }
};
