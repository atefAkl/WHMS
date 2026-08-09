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
        Schema::table('pallet_rearrangement_items', function (Blueprint $table) {
            $table->decimal('quantity_in', 15, 2)->default(0)->after('pallet_id');
            $table->decimal('quantity_out', 15, 2)->default(0)->after('quantity_in');
            $table->string('type')->nullable()->change();
            $table->decimal('quantity', 15, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pallet_rearrangement_items', function (Blueprint $table) {
            $table->dropColumn(['quantity_in', 'quantity_out']);
        });
    }
};
