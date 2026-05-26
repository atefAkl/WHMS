<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Term;
use Illuminate\Support\Facades\DB;

class ContractService
{
    /**
     * Store a new contract with its items, terms, and payments in a single transaction.
     */
    public function storeContract(array $data): Contract
    {
        return DB::transaction(function () use ($data) {
            // create contract
            $contract = Contract::create([
                'customer_id'      => $data['customer_id'],
                'contact_id'       => $data['contact_id'] ?? null,
                'contract_number'  => $data['contract_number'],
                'contract_date'    => $data['write_date'],
                'write_date'       => $data['write_date'],
                'write_date_hijri' => $data['write_date_hijri'] ?? null,
                'start_date'       => $data['start_date'],
                'start_date_hijri' => $data['start_date_hijri'] ?? null,
                'mandatory_period' => $data['mandatory_period'],
                'renewal_period'   => $data['renewal_period'],
                'discount'         => $data['discount'] ?? 0,
                'vat_rate'         => 15,
                'status'           => $data['status'],
                'introduction'     => $data['introduction'] ?? null,
                'preamble'         => $data['preamble'] ?? null,
                'contract_title'   => $data['contract_title'] ?? null,
                'footer'           => $data['footer'] ?? null,
                'season_id'        => $data['season_id'] ?? null,
            ]);

            // items
            if (!empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    $total_inclusive = ($item['unit_count'] * $data['mandatory_period'] * $item['monthly_rent']) - ($item['discount'] ?? 0);
                    $total_before_vat = $total_inclusive / 1.15;

                    $contract->items()->create([
                        'storage_item_id'     => $item['storage_item_id'],
                        'unit_count'          => $item['unit_count'],
                        'monthly_rent'        => $item['monthly_rent'],
                        'discount'            => $item['discount'] ?? 0,
                        'vat_rate'            => 15,
                        'subtotal_before_vat' => round($total_before_vat, 2),
                        'subtotal'            => round($total_inclusive, 2),
                    ]);
                }
            }

            // terms
            if (!empty($data['term_ids'])) {
                $sortIndex = 0;
                foreach ($data['term_ids'] as $id) {
                    if (empty($id)) continue;
                    
                    if (is_string($id) && str_starts_with($id, 'custom_')) {
                        $text = substr($id, 7);
                        Term::create([
                            'contract_id'   => $contract->id,
                            'parent_id'     => null,
                            'text_ar'       => $text,
                            'text_en'       => null,
                            'is_active'     => true,
                            'has_variables' => str_contains($text, '{$'),
                            'sort_order'    => $sortIndex++,
                        ]);
                    } else {
                        $t = Term::find($id);
                        if ($t) {
                            Term::create([
                                'contract_id'   => $contract->id,
                                'parent_id'     => $t->id,
                                'text_ar'       => $t->text_ar,
                                'text_en'       => $t->text_en,
                                'is_active'     => $t->is_active,
                                'has_variables' => $t->has_variables,
                                'sort_order'    => $sortIndex++,
                            ]);
                        }
                    }
                }
            }

            // payments
            if (!empty($data['payments'])) {
                foreach ($data['payments'] as $payment) {
                    $contract->payments()->create($payment);
                }
            }

            return $contract;
        });
    }

    /**
     * Change status of a contract.
     */
    public function changeStatus(Contract $contract, string $status): bool
    {
        return $contract->update(['status' => $status]);
    }
}
