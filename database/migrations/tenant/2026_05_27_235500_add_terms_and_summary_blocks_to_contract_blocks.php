<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\ContractBlock;
use App\Models\Season;
use App\Models\Contract;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Shift signature and footer orders
        // signature: 8 -> 10
        // footer: 9 -> 11
        ContractBlock::where('key', 'signature')->update(['sort_order' => 10]);
        ContractBlock::where('key', 'footer')->update(['sort_order' => 11]);

        // 2. Add terms and summary blocks for global template (null season, null contract)
        $this->ensureBlocks(null, null);

        // 3. Add terms and summary blocks for existing seasons
        $seasons = Season::all();
        foreach ($seasons as $season) {
            $this->ensureBlocks($season->id, null);
        }

        // 4. Add terms and summary blocks for existing contracts
        $contracts = Contract::all();
        foreach ($contracts as $contract) {
            $this->ensureBlocks(null, $contract->id);
        }
    }

    private function ensureBlocks(?int $seasonId, ?int $contractId): void
    {
        // Add terms block (sort_order = 8)
        ContractBlock::updateOrCreate(
            [
                'season_id' => $seasonId,
                'contract_id' => $contractId,
                'key' => 'terms'
            ],
            [
                'is_enabled' => true,
                'content' => ['text' => ''],
                'sort_order' => 8
            ]
        );

        // Add summary block (sort_order = 9)
        ContractBlock::updateOrCreate(
            [
                'season_id' => $seasonId,
                'contract_id' => $contractId,
                'key' => 'summary'
            ],
            [
                'is_enabled' => true,
                'content' => ['text' => 'يتكون هذا العقد من مقدمة وتمهيد و{$terms_count} شرطاً تم الاتفاق عليها.'],
                'sort_order' => 9
            ]
        );
    }

    public function down(): void
    {
        ContractBlock::whereIn('key', ['terms', 'summary'])->delete();
        ContractBlock::where('key', 'signature')->update(['sort_order' => 8]);
        ContractBlock::where('key', 'footer')->update(['sort_order' => 9]);
    }
};
