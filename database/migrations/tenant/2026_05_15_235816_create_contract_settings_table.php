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
        Schema::create('contract_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed initial defaults
        DB::table('contract_settings')->insert([
            ['key' => 'default_introduction', 'value' => ''],
            ['key' => 'default_preamble', 'value' => ''],
            ['key' => 'default_mandatory_period', 'value' => '12'],
            ['key' => 'default_renewal_period', 'value' => '12'],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_settings');
    }
};
