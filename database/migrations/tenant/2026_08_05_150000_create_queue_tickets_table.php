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
        Schema::create('queue_tickets', function (Blueprint $table) {
            $table->id();
            $table->date('ticket_date');
            $table->integer('daily_sequence'); // Resets daily: 1, 2, 3...
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('contract_id')->constrained('contracts')->onDelete('cascade');
            $table->foreignId('period_id')->nullable()->constrained('contract_periods')->onDelete('set null');
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('set null');
            $table->string('driver_name')->nullable();
            $table->string('contract_number_suffix')->nullable(); // Last 3 digits of contract number e.g. "236"
            $table->string('day_time_str')->nullable(); // e.g. "Wed – 13:43"
            $table->string('date_hijri')->nullable(); // e.g. "22/03/1448"
            $table->json('pallet_balances')->nullable(); // e.g. {"small": 140, "large": 120}
            $table->string('status')->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('queue_tickets');
    }
};
