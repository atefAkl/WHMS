<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contract_periods', function (Blueprint $table) {
            $table->text('status_reason')->nullable()->after('status');
            $table->string('remaining_period_action')->nullable()->after('status_reason');
            $table->boolean('terminate_contract')->default(false)->after('remaining_period_action');
            $table->boolean('notify_customer')->default(false)->after('terminate_contract');
        });
    }

    public function down(): void
    {
        Schema::table('contract_periods', function (Blueprint $table) {
            $table->dropColumn([
                'status_reason',
                'remaining_period_action',
                'terminate_contract',
                'notify_customer',
            ]);
        });
    }
};
