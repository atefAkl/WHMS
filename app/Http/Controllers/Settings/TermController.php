<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Term;
use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TermController extends Controller
{
    public function index()
    {
        $terms = Term::orderBy('sort_order')->get();
        $settings = ContractSetting::pluck('value', 'key')->all();
        return Inertia::render('Settings/ContractSettings', compact('terms', 'settings'));
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'company_name'    => 'nullable|string',
            'company_slogan'  => 'nullable|string',
            'company_cr'      => 'nullable|string',
            'company_vat'     => 'nullable|string',
            'company_license' => 'nullable|string',
            'company_phone'   => 'nullable|string',
            'company_email'   => 'nullable|string',
            'company_address' => 'nullable|string',
            'company_gm'      => 'nullable|string',
            'company_dgm'     => 'nullable|string',
            'company_logo'    => 'nullable|image|max:2048',
            'show_quality_data'  => 'nullable|boolean',
            'quality_issue_no'   => 'nullable|string',
            'quality_issue_date' => 'nullable|string',
            'default_introduction'     => 'nullable|string',
            'default_preamble'         => 'nullable|string',
            'default_mandatory_period' => 'nullable|integer|min:0',
            'default_renewal_period'   => 'nullable|integer|min:0',
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

        return redirect()->back()->with('success', 'تم تحديث الإعدادات العامة بنجاح.');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'text_ar'   => 'required|string',
            'text_en'   => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Term::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الشرط بنجاح.');
    }

    public function update(Request $request, Term $term)
    {
        $validated = $request->validate([
            'text_ar'   => 'required|string',
            'text_en'   => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $oldTextAr = $term->text_ar;
        $oldTextEn = $term->text_en;

        $term->update($validated);

        // Propagate season term text updates to unmodified contract-level terms
        if ($term->season_id && !$term->contract_id) {
            $contractIds = \App\Models\Contract::where('season_id', $term->season_id)->pluck('id')->toArray();
            
            if (!empty($contractIds)) {
                Term::whereIn('contract_id', $contractIds)
                    ->where('parent_id', $term->id)
                    ->where('text_ar', $oldTextAr)
                    ->update([
                        'text_ar' => $term->text_ar,
                        'text_en' => $term->text_en,
                    ]);
            }
        }

        return redirect()->back()->with('success', 'تم تحديث الشرط بنجاح.');
    }

    public function destroy(Term $term)
    {
        $term->delete();
        return redirect()->back()->with('success', 'تم حذف الشرط.');
    }
}
