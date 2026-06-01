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
        Schema::table('exit_authorizations', function (Blueprint $table) {
            $table->foreignId('period_id')->nullable()->after('contract_id')->constrained('contract_periods')->nullOnDelete();
            $table->string('requester_type')->nullable()->after('period_id'); // whatsapp, written, personal
            $table->string('requester_proof')->nullable()->after('requester_type'); // file upload path
            $table->foreignId('driver_id')->nullable()->after('requester_proof')->constrained('drivers')->nullOnDelete();
            $table->foreignId('representative_id')->nullable()->after('driver_id')->constrained('contract_agents')->nullOnDelete();
            $table->boolean('deliver_to_self')->default(false)->after('representative_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exit_authorizations', function (Blueprint $table) {
            $table->dropForeign(['exit_authorizations_period_id_foreign']);
            $table->dropColumn('period_id');
            $table->dropColumn('requester_type');
            $table->dropColumn('requester_proof');
            $table->dropForeign(['exit_authorizations_driver_id_foreign']);
            $table->dropColumn('driver_id');
            $table->dropForeign(['exit_authorizations_representative_id_foreign']);
            $table->dropColumn('representative_id');
            $table->dropColumn('deliver_to_self');
        });
    }
};
