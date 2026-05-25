<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContractStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'customer_id'      => 'required|exists:customers,id',
            'contract_number'  => 'required|string|unique:contracts,contract_number',
            'write_date'       => 'required|date',
            'write_date_hijri' => 'nullable|string',
            'start_date'       => 'required|date|after_or_equal:write_date',
            'start_date_hijri' => 'nullable|string',
            'mandatory_period' => 'required|integer|min:1|max:12',
            'renewal_period'   => 'required|integer|min:0',
            'contact_id'       => 'nullable|exists:contacts,id',
            'discount'         => 'nullable|numeric|min:0',
            'status'           => 'required|in:draft,active',
            'items'            => 'required|array|min:1',
            'items.*.storage_item_id' => 'required|exists:storage_items,id',
            'items.*.unit_count'      => 'required|integer|min:1',
            'items.*.monthly_rent'    => 'required|numeric|min:0',
            'items.*.discount'        => 'nullable|numeric|min:0',
            'introduction'     => 'nullable|string',
            'preamble'         => 'nullable|string',
            'term_ids'         => 'nullable|array',
            'term_ids.*'       => 'nullable',
            'payments'         => 'nullable|array',
            'payments.*.amount'       => 'required|numeric|min:0.01',
            'payments.*.payment_date' => 'required|date',
            'payments.*.method'       => 'required|in:cash,bank_transfer,cheque',
            'payments.*.reference'    => 'nullable|string',
            'payments.*.notes'        => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        if (app()->getLocale() === 'en') {
            return [
                'start_date.after_or_equal' => 'Contract start date cannot be before the contract writing date.',
                'mandatory_period.min'      => 'Mandatory period must be at least 1 month.',
                'mandatory_period.max'      => 'Mandatory period cannot exceed 12 months.',
                'renewal_period.min'        => 'Renewal period cannot be negative.',
            ];
        }

        return [
            'start_date.after_or_equal' => 'تاريخ بداية العقد لا يمكن أن يكون قبل تاريخ الكتابة.',
            'mandatory_period.min'      => 'الفترة الإلزامية يجب أن تكون شهر على الأقل.',
            'mandatory_period.max'      => 'الفترة الإلزامية لا تتجاوز 12 شهراً.',
            'renewal_period.min'        => 'فترة التجديد لا يمكن أن تكون سالبة.',
        ];
    }
}
