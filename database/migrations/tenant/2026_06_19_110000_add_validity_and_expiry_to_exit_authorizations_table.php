<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $validityDays = (int) (
            DB::table('contract_settings')
            ->where('key', 'exit_authorization_validity_days')
            ->value('value')
            ?? 2
        );

        Schema::table('exit_authorizations', function (Blueprint $table) {
            $table->integer('validity_days')->nullable()->after('status');
            $table->date('expiry_date')->nullable()->after('validity_days');
        });

        DB::table('exit_authorizations')
            ->whereNull('validity_days')
            ->orderBy('id')
            ->chunkById(500, function ($records) use ($validityDays) {

                foreach ($records as $record) {

                    $expiryDate = Carbon::parse($record->created_at)
                        ->addDays($validityDays)
                        ->toDateString();

                    DB::table('exit_authorizations')
                        ->where('id', $record->id)
                        ->update([
                            'validity_days' => $validityDays,
                            'expiry_date' => $expiryDate,
                        ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exit_authorizations', function (Blueprint $table) {
            $table->dropColumn([
                'validity_days',
                'expiry_date',
            ]);
        });
    }
};
