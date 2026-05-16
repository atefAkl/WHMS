<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            
            $table->string('name');
            $table->string('foreign_name')->nullable(); // Same as name if left empty
            
            $table->foreignId('country_id')->constrained('countries');
            $table->foreignId('category_id')->constrained('customer_categories');
            
            $table->string('s_number')->unique(); // Sequence number auto-generated
            
            // Depending on category (Business vs Individual) these will be nullable
            $table->string('email')->nullable(); 
            $table->string('phone_number');
            $table->string('website')->nullable();
            
            $table->string('vat_number')->nullable();
            $table->string('cr_number')->nullable();
            $table->string('id_number')->nullable();
            
            $table->string('status')->default('active'); // active, inactive
            $table->text('address')->nullable();
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
