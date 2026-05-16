<?php
namespace App\Services;

class ContractTemplateEngine
{
    /**
     * Render a template string by replacing smart variables with actual data.
     *
     * @param string $template
     * @param array $data
     * @return string
     */
    public static function render(string $template, array $data): string
    {
        if (empty($template)) {
            return '';
        }

        $replacements = [];

        foreach ($data as $key => $value) {
            // Support both {$variable} and {variable} for robustness
            $replacements['{$' . $key . '}'] = $value;
            $replacements['{' . $key . '}']  = $value;
        }

        return strtr($template, $replacements);
    }

    /**
     * Build standard replacement data array from models and settings.
     *
     * @param array $settings
     * @param mixed $contractOrData
     * @return array
     */
    public static function buildData(array $settings, $contractOrData = []): array
    {
        $data = [
            // Company defaults
            'company_name'    => $settings['company_name'] ?? '',
            'company_slogan'  => $settings['company_slogan'] ?? '',
            'company_cr'      => $settings['company_cr'] ?? '',
            'company_vat'     => $settings['company_vat'] ?? '',
            'company_license' => $settings['company_license'] ?? '',
            'company_phone'   => $settings['company_phone'] ?? '',
            'company_email'   => $settings['company_email'] ?? '',
            'company_address' => $settings['company_address'] ?? '',
            'company_gm'      => $settings['company_gm'] ?? '',
            'company_dgm'     => $settings['company_dgm'] ?? '',
        ];

        if (is_array($contractOrData)) {
            return array_merge($data, $contractOrData);
        }

        if (is_object($contractOrData)) {
            $customer = $contractOrData->customer;
            $contact  = $contractOrData->contact;
            
            $contractData = [
                'contract_number'  => $contractOrData->contract_number ?? '',
                'write_date'       => $contractOrData->write_date ?? '',
                'write_date_hijri' => $contractOrData->write_date_hijri ?? '',
                'start_date'       => $contractOrData->start_date ?? '',
                'start_date_hijri' => $contractOrData->start_date_hijri ?? '',
                'end_date'         => $contractOrData->end_date ?? '',
                'mandatory_period' => $contractOrData->mandatory_period ?? '',
                'renew_period'     => $contractOrData->renewal_period ?? '',
                'renewal_period'   => $contractOrData->renewal_period ?? '', // alias

                // Customer
                'customer_name'      => $customer->name ?? '',
                'customer_phone'     => $customer->phone_number ?? '',
                'customer_cr'        => $customer->cr_number ?? '',
                'customer_id_number' => $customer->id_number ?? $customer->cr_number ?? '',
                'customer_id_type'   => !empty($customer->cr_number) ? 'سجل تجاري' : 'هوية وطنية',

                // Contact / Delegate
                'contact_name'      => $contact->name ?? $contractOrData->contractAgents->first()->name ?? '',
                'contact_phone'     => $contact->phone_number ?? $contractOrData->contractAgents->first()->phone_number ?? '',
                'contact_id_number' => $contact->id_number ?? $contractOrData->contractAgents->first()->id_number ?? '',

                // Financials
                'grand_total' => $contractOrData->items ? $contractOrData->items->sum('subtotal') : 0,
            ];

            return array_merge($data, $contractData);
        }

        return $data;
    }
}
