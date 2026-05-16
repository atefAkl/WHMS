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
            'default_introduction'     => 'nullable|string',
            'default_preamble'         => 'nullable|string',
            'default_mandatory_period' => 'integer|min:0',
            'default_renewal_period'   => 'integer|min:0',
        ]);

        foreach ($validated as $key => $value) {
            ContractSetting::updateOrCreate(['key' => $key], ['value' => $value]);
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

        $term->update($validated);

        return redirect()->back()->with('success', 'تم تحديث الشرط بنجاح.');
    }

    public function destroy(Term $term)
    {
        $term->delete();
        return redirect()->back()->with('success', 'تم حذف الشرط.');
    }
}
