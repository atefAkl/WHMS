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
        Schema::create('contract_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contract_id')->constrained()->onDelete('cascade');
            $table->foreignId('contact_id')->nullable()->constrained('contacts')->onDelete('set null');
            $table->string('name');
            $table->string('phone_number');
            $table->string('id_number')->nullable();
            $table->string('job_title')->nullable();
            $table->boolean('can_sign')->default(false);
            $table->boolean('can_withdraw_goods')->default(false);
            $table->string('status')->default('active'); // active, suspended, deleted
            $table->string('status_reason')->nullable();
            $table->timestamp('deleted_at_custom')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contract_agents');
    }
};
