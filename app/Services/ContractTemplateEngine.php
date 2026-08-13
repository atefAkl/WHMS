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

        // 1. Evaluate [IF:cond]...[ELSE]...[/IF] conditional blocks
        $template = preg_replace_callback('/\[IF:([^\]]+)\]((?:(?!\[IF:).)*?)(?:\[ELSE\]((?:(?!\[IF:).)*?))?\[\/IF\]/s', function ($matches) use ($data) {
            $conditionExpr = trim($matches[1]);
            $ifTrue = $matches[2] ?? '';
            $ifFalse = $matches[3] ?? '';

            $isTrue = self::evaluateCondition($conditionExpr, $data);
            return $isTrue ? $ifTrue : $ifFalse;
        }, $template);

        // 2. Standard variable replacement
        $replacements = [];
        foreach ($data as $key => $value) {
            $replacements['{$' . $key . '}'] = $value;
            $replacements['{' . $key . '}']  = $value;
        }

        return strtr($template, $replacements);
    }

    /**
     * Evaluate condition expression against data dictionary.
     */
    private static function evaluateCondition(string $expr, array $data): bool
    {
        if (str_contains($expr, '==')) {
            list($key, $expected) = explode('==', $expr, 2);
            $val = trim((string) ($data[trim($key)] ?? ''));
            return $val === trim($expected, " '\"");
        }

        if (str_contains($expr, '!=')) {
            list($key, $expected) = explode('!=', $expr, 2);
            $val = trim((string) ($data[trim($key)] ?? ''));
            return $val !== trim($expected, " '\"");
        }

        $val = $data[trim($expr)] ?? null;
        return !empty($val);
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
            
            // Resolve customer nationality
            $custNationality = '';
            if ($customer && $customer->country) {
                $custNationality = $customer->country->name_ar ?? '';
            }
            if (empty($custNationality)) {
                $custNationality = 'سعودي';
            }

            // Delegate / agent resolver
            $delegateName = $contact->name ?? $contractOrData->contractAgents->first()->name ?? '';
            $delegatePhone = $contact->phone_number ?? $contractOrData->contractAgents->first()->phone_number ?? '';
            $delegateId = $contact->id_number ?? $contractOrData->contractAgents->first()->id_number ?? '';

            // Check if business (has commercial registration number)
            $isBusiness = ($customer && !empty($customer->cr_number));

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
                'customer_name'        => $customer->name ?? '',
                'customer_phone'       => $customer->phone_number ?? '',
                'customer_cr'          => $customer->cr_number ?? '',
                'customer_id'          => $customer->id_number ?? '',
                'customer_id_number'   => $customer->id_number ?? $customer->cr_number ?? '',
                'customer_id_type'     => $isBusiness ? 'سجل تجاري' : 'هوية وطنية',
                'customer_nationality' => $custNationality,

                // Contact / Delegate
                'contact_name'      => $delegateName,
                'contact_phone'     => $delegatePhone,
                'contact_id_number' => $delegateId,

                // Delegate specific mappings
                'customer_delegate_name'        => $delegateName,
                'customer_delegate_phone'       => $delegatePhone,
                'customer_delegate_id'          => $delegateId,
                'customer_delegate_nationality' => $custNationality,

                // Financials
                'grand_total' => $contractOrData->items ? $contractOrData->items->sum('subtotal') : 0,
            ];

            // Merge everything to allow recursion
            $merged = array_merge($data, $contractData);

            $delegateStr = '';
            if (!empty($delegateName)) {
                $delegateStr = "، وينوب عنه/ـا فى هذا العقد ({$delegateName})";
                if (!empty($delegatePhone)) {
                    $delegateStr .= " هاتف: ({$delegatePhone})";
                }
            }

            // Generate introduction dynamically based on Business vs Individual classification
            if ($isBusiness) {
                $introTemplate = "بعون الله وتوفيقه، فى يوم {\$write_date} م، الموافق {\$write_date_hijri} هـ ، قد اجتمع كل من:-\n" .
                    "{\$company_name} سجل تجاري {\$company_cr}، ويمثلها المدير العام - {\$company_gm} وعنوانها الوطنى: {\$company_address}، جوال: {\$company_phone} ، بريد الكتروني: {\$company_email} طرف أول.\n" .
                    "و{\$customer_name}، سجل تجاري: {\$customer_cr}، هاتف: {\$customer_phone}" . $delegateStr . "، طرف ثان.";
            } else {
                $introTemplate = "بعون الله وتوفيقه، فى يوم {\$write_date} م، الموافق {\$write_date_hijri} هـ ، قد اجتمع كل من:-\n" .
                    "{\$company_name} سجل تجاري {\$company_cr}، ويمثلها المدير العام - {\$company_gm} وعنوانها الوطنى: {\$company_address}، جوال: {\$company_phone} ، بريد الكتروني: {\$company_email} طرف أول.\n" .
                    "و{\$customer_name}، هاتف: {\$customer_phone}، هوية رقم {\$customer_id}، الجنسية {\$customer_nationality}" . $delegateStr . "، طرف ثان.";
            }

            // Render variables nested within the introduction template
            $merged['contract_introduction'] = self::render($introTemplate, $merged);

            return $merged;
        }

        return $data;
    }
}
