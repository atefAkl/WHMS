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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();
            
            $table->string('action'); // e.g. "إنشاء سند استلام", "تعديل عقد", "حذف طبلية"
            $table->string('action_type', 50)->default('other'); // create, update, delete, approve, cancel, login, logout, other
            
            $table->string('subject_type')->nullable(); // Model class e.g. App\Models\Reception
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label')->nullable(); // Human readable reference e.g. "REC-2026-0012"
            
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->timestamps();

            $table->index(['subject_type', 'subject_id']);
            $table->index('action_type');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
