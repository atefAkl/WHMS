<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\ContractSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GeneralSettingsController extends Controller
{
    public function index()
    {
        $settings = ContractSetting::pluck('value', 'key')->all();
        if (isset($settings['company_files'])) {
            $settings['company_files'] = json_decode($settings['company_files'], true) ?? [];
        } else {
            $settings['company_files'] = [];
        }
        return Inertia::render('Settings/General', compact('settings'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Company Profile
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

            // System Preferences
            'app_language'    => 'nullable|string|max:50',
            'app_timezone'    => 'nullable|string|max:100',
            'app_currency'    => 'nullable|string|max:50',
            'app_pagination'  => 'nullable|integer|min:5|max:100',

            // Quality System (QMS)
            'show_quality_data'  => 'nullable|boolean',
            'quality_issue_no'   => 'nullable|string|max:100',
            'quality_issue_date' => 'nullable|string|max:100',
            'iso_code'           => 'nullable|string|max:100',

            // Billing & Payments
            'default_tax_rate' => 'nullable|numeric|min:0|max:100',
            'bank_name'        => 'nullable|string|max:255',
            'bank_iban'        => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('company_logo')) {
            $file = $request->file('company_logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images'), $filename);
            $validated['company_logo'] = '/images/' . $filename;
        } else {
            unset($validated['company_logo']);
        }

        // Convert boolean to string for database storage
        if (isset($validated['show_quality_data'])) {
            $validated['show_quality_data'] = $validated['show_quality_data'] ? '1' : '0';
        }

        foreach ($validated as $key => $value) {
            ContractSetting::updateOrCreate(['key' => $key], ['value' => $value ?? '']);
        }

        return redirect()->back()->with('success', 'تم حفظ الإعدادات العامة بنجاح.');
    }

    public function uploadFile(Request $request)
    {
        $request->validate([
            'file'            => 'required|file|max:5120', // 5MB max (images & PDF)
            'category'        => 'required|string|max:100',
            'custom_category' => 'nullable|string|max:100',
        ]);

        $file = $request->file('file');
        $category = $request->input('category');
        $customCategory = $request->input('custom_category');
        
        $categoryNames = [
            'cr'               => 'السجل التجاري',
            'vat'              => 'الشهادة الضريبية',
            'national_address' => 'العنوان الوطني',
            'license'          => 'رخصة التخزين / البلدية',
            'other'            => 'مستندات أخرى',
        ];

        $categoryName = $categoryNames[$category] ?? $category;
        if ($category === 'custom' && !empty($customCategory)) {
            $category = 'custom_' . time() . '_' . substr(uniqid(), -5);
            $categoryName = $customCategory;
        } elseif (str_starts_with($category, 'custom_')) {
            // If selecting an existing custom category, find its name from existing files
            $setting = ContractSetting::where('key', 'company_files')->first();
            $existingFiles = $setting ? (json_decode($setting->value, true) ?? []) : [];
            foreach ($existingFiles as $ef) {
                if ($ef['category'] === $category) {
                    $categoryName = $ef['category_name'];
                    break;
                }
            }
        }

        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension();
        $filename = time() . '_' . uniqid() . '.' . $extension;
        $file->move(public_path('uploads/company'), $filename);

        $filePath = public_path('uploads/company/' . $filename);
        $size = '0 KB';
        if (file_exists($filePath)) {
            $filesize = filesize($filePath);
            $size = number_format($filesize / 1024, 1) . ' KB';
            if ($filesize > 1024 * 1024) {
                $size = number_format($filesize / (1024 * 1024), 2) . ' MB';
            }
        }

        $newFile = [
            'id'            => 'file_' . time() . '_' . uniqid(),
            'name'          => $originalName,
            'category'      => $category,
            'category_name' => $categoryName,
            'path'          => '/uploads/company/' . $filename,
            'size'          => $size,
            'uploaded_at'   => now()->format('Y-m-d H:i'),
        ];

        $setting = ContractSetting::firstOrCreate(['key' => 'company_files'], ['value' => json_encode([])]);
        $existingFiles = json_decode($setting->value, true) ?? [];
        $existingFiles[] = $newFile;

        $setting->value = json_encode($existingFiles);
        $setting->save();

        return redirect()->back()->with('success', 'تم رفع الملف وتصنيفه بنجاح.');
    }

    public function deleteFile($id)
    {
        $setting = ContractSetting::where('key', 'company_files')->first();
        if (!$setting) {
            return redirect()->back()->with('error', 'الملف غير موجود.');
        }

        $existingFiles = json_decode($setting->value, true) ?? [];
        $updatedFiles = [];

        foreach ($existingFiles as $file) {
            if ($file['id'] === $id) {
                // Delete physical file if exists
                $path = public_path($file['path']);
                if (file_exists($path) && is_file($path)) {
                    @unlink($path);
                }
            } else {
                $updatedFiles[] = $file;
            }
        }

        $setting->value = json_encode($updatedFiles);
        $setting->save();

        return redirect()->back()->with('success', 'تم حذف الملف بنجاح.');
    }
}
