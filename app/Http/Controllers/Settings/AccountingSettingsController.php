<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ContractSetting;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountingSettingsController extends Controller
{
    public function index()
    {
        $settings = ContractSetting::pluck('value', 'key')->all();
        $accounts = Account::where('is_transactional', true)->get(['id', 'code', 'name_ar', 'name_en', 'type']);
        
        return Inertia::render('Settings/Accounting', compact('settings', 'accounts'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_default_revenue_account' => 'nullable|exists:accounts,id',
            'invoice_default_ar_account'      => 'nullable|exists:accounts,id',
            'invoice_default_cash_account'    => 'nullable|exists:accounts,id',
            'invoice_default_bank_account'    => 'nullable|exists:accounts,id',
            'invoice_allow_override_revenue'  => 'nullable|boolean',
            'invoice_auto_post'               => 'nullable|boolean',
        ]);

        if (isset($validated['invoice_allow_override_revenue'])) {
            $validated['invoice_allow_override_revenue'] = $validated['invoice_allow_override_revenue'] ? '1' : '0';
        }
        if (isset($validated['invoice_auto_post'])) {
            $validated['invoice_auto_post'] = $validated['invoice_auto_post'] ? '1' : '0';
        }

        foreach ($validated as $key => $value) {
            ContractSetting::updateOrCreate(['key' => $key], ['value' => $value ?? '']);
        }

        return redirect()->back()->with('success', 'تم حفظ إعدادات المالية بنجاح.');
    }
}
