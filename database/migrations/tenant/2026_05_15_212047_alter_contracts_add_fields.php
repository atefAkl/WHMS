<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('contracts', function (Blueprint $table) {
            $table->date('write_date')->nullable()->after('contract_number');
            $table->string('write_date_hijri')->nullable()->after('write_date');
            $table->string('start_date_hijri')->nullable()->after('start_date');
            $table->tinyInteger('mandatory_period')->default(1)->after('end_date');   // 1-12 months
            $table->tinyInteger('renewal_period')->default(0)->after('mandatory_period'); // 0 = no renewal
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete()->after('customer_id');
            $table->decimal('discount', 5, 2)->default(0)->after('renewal_period');
            $table->decimal('vat_rate', 5, 2)->default(15)->after('discount');
        });
    }
    public function down(): void {
        Schema::table('contracts', function (Blueprint $table) {
            $table->dropColumn(['write_date','write_date_hijri','start_date_hijri','mandatory_period','renewal_period','agent_id','discount','vat_rate']);
        });
    }
};
