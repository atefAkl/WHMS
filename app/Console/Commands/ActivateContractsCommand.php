<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Contract;
use Carbon\Carbon;

class ActivateContractsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'contracts:activate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check contract start dates and activate draft contracts whose start date has arrived.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $today = Carbon::now()->toDateString();
        $contracts = Contract::where('status', 'draft')
            ->whereDate('start_date', '<=', $today)
            ->get();

        $count = 0;
        foreach ($contracts as $contract) {
            $contract->update(['status' => 'active']);

            $contract->ensureMandatoryPeriod();
            $contract->load('items');
            $contract->syncFirstPeriodItems();
            $count++;
        }

        $this->info("Successfully activated {$count} contracts.");
    }
}
