<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantSetupController extends Controller
{
    public function create()
    {
        $settings = ContractSetting::pluck('value', 'key')->all();
        return Inertia::render('Tenant/Setup', compact('settings'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name'    => 'required|string|max:255',
            'company_slogan'  => 'nullable|string|max:255',
            'company_cr'      => 'required|string|max:255',
            'company_vat'     => 'required|string|max:255',
            'company_license' => 'nullable|string|max:255',
            'company_phone'   => 'required|string|max:255',
            'company_email'   => 'required|email|max:255',
            'company_address' => 'required|string|max:255',
            'company_gm'      => 'required|string|max:255',
            'company_dgm'     => 'nullable|string|max:255',
            'company_logo'    => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('company_logo')) {
            $file = $request->file('company_logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images'), $filename);
            $validated['company_logo'] = '/images/' . $filename;
        } else {
            unset($validated['company_logo']);
        }

        foreach ($validated as $key => $value) {
            ContractSetting::updateOrCreate(['key' => $key], ['value' => $value ?? '']);
        }

        return redirect()->route('dashboard')->with('success', 'تم إعداد بيانات المنشأة بنجاح.');
    }
}
