<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_requests', function (Blueprint $table) {
            $table->string('setup_token', 60)->nullable()->after('admin_notes');
            $table->string('activation_link', 1000)->nullable()->after('setup_token');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_requests', function (Blueprint $table) {
            $table->dropColumn(['setup_token', 'activation_link']);
        });
    }
};

