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
            $table->date('contract_date')->after('contract_number')->nullable();
            $table->foreignId('contact_id')->nullable()->after('customer_id')->constrained('contacts')->onDelete('set null');
            $table->integer('mandatory_period')->default(12)->after('end_date');
            $table->integer('renewal_period')->default(12)->after('mandatory_period');
            $table->text('introduction')->nullable()->after('renewal_period');
            $table->text('preamble')->nullable()->after('introduction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropForeign(['contact_id']);
            $table->dropColumn(['contract_date', 'contact_id', 'mandatory_period', 'renewal_period', 'introduction', 'preamble']);
        });
    }
};
