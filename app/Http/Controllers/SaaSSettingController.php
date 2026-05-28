<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AdminSetting;
use Inertia\Inertia;

class SaaSSettingController extends Controller
{
    private function ensureCentralContext(): void
    {
        if (function_exists('tenancy') && tenancy()->initialized) {
            tenancy()->end();
        }
    }

    public function settingsIndex()
    {
        $this->ensureCentralContext();
        return Inertia::render('SaaS/Settings');
    }

    public function tenantSettings()
    {
        $this->ensureCentralContext();
        $settings = AdminSetting::pluck('value', 'key')->all();
        
        // Cast values to appropriate types
        $settings['auto_approve_tenants'] = isset($settings['auto_approve_tenants']) ? (bool)$settings['auto_approve_tenants'] : false;
        $settings['delete_request_after_approval'] = isset($settings['delete_request_after_approval']) ? (bool)$settings['delete_request_after_approval'] : false;

        return Inertia::render('SaaS/Settings/TenantSettings', compact('settings'));
    }

    public function updateTenantSettings(Request $request)
    {
        $this->ensureCentralContext();
        $validated = $request->validate([
            'auto_approve_tenants' => 'required|boolean',
            'delete_request_after_approval' => 'required|boolean',
        ]);

        foreach ($validated as $key => $value) {
            AdminSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value ? '1' : '0']
            );
        }

        return back()->with('success', 'تم حفظ إعدادات المستأجرين بنجاح.');
    }

    public function termsSettings()
    {
        $this->ensureCentralContext();
        $globalTermsSetting = AdminSetting::where('key', 'global_terms')->value('value');
        $globalTerms = $globalTermsSetting ? json_decode($globalTermsSetting, true) : [];

        return Inertia::render('SaaS/Settings/Terms', compact('globalTerms'));
    }

    public function updateGlobalTerms(Request $request)
    {
        $this->ensureCentralContext();
        $validated = $request->validate([
            'terms' => 'required|array',
            'terms.*' => 'required|string',
        ]);

        AdminSetting::updateOrCreate(
            ['key' => 'global_terms'],
            ['value' => json_encode($validated['terms'], JSON_UNESCAPED_UNICODE)]
        );

        return back()->with('success', 'تم تحديث الشروط العامة بنجاح.');
    }

    public function geoSettings()
    {
        $this->ensureCentralContext();
        return Inertia::render('SaaS/Settings/GeoSettings');
    }

    public function financialSettings()
    {
        $this->ensureCentralContext();
        return Inertia::render('SaaS/Settings/Financial');
    }

    public function themesSettings()
    {
        $this->ensureCentralContext();
        return Inertia::render('SaaS/Settings/Themes');
    }

    public function notificationsSettings()
    {
        $this->ensureCentralContext();
        return Inertia::render('SaaS/Settings/Notifications');
    }

    public function rolesPermissions()
    {
        $this->ensureCentralContext();
        return Inertia::render('SaaS/Settings/RolesPermissions');
    }

    public function contractSettings()
    {
        $this->ensureCentralContext();
        
        $headerLayouts = AdminSetting::where('key', 'admin_header_layouts')->value('value');
        $footerLayouts = AdminSetting::where('key', 'admin_footer_layouts')->value('value');
        $smartVariables = AdminSetting::where('key', 'admin_smart_variables')->value('value');
        $tableColumns = AdminSetting::where('key', 'admin_table_columns')->value('value');

        if (!$headerLayouts) {
            $headerLayouts = json_encode([
                ["id" => "1", "name_ar" => "تصميم 1: كلاسيكي قياسي (البيانات باليمين والشعار باليسار)", "name_en" => "Design 1: Classic Standard (Split header)"],
                ["id" => "2", "name_ar" => "تصميم 2: متمركز حديث (جميع البيانات متمركزة بالوسط)", "name_en" => "Design 2: Modern Centered (Centered logo & details)"],
                ["id" => "3", "name_ar" => "تصميم 3: بسيط ممتد (شريط ترويسة سطرية أفقي)", "name_en" => "Design 3: Simple Minimalist (Horizontal layout)"],
                ["id" => "4", "name_ar" => "تصميم 4: مؤطر ملون (شريط ترويسة داكن مع الشعار)", "name_en" => "Design 4: Colored Banner (Est. banner header)"],
                ["id" => "5", "name_ar" => "تصميم 5: نظام الجودة (معلومات إصدار الجودة والمستند)", "name_en" => "Design 5: ISO Quality (Boxed document control)"]
            ], JSON_UNESCAPED_UNICODE);
        }

        if (!$footerLayouts) {
            $footerLayouts = json_encode([
                ["id" => "1", "name_ar" => "تعديل 1: تذييل قياسي متمركز (الاسم والتواصل بالوسط)", "name_en" => "Footer 1: Standard Centered (Contacts centered)"],
                ["id" => "2", "name_ar" => "تعديل 2: ثلاثة أعمدة (تواصل | موقع | نظام WHMS)", "name_en" => "Footer 2: Three Columns (Structured contacts)"],
                ["id" => "3", "name_ar" => "تعديل 3: بسيط خط ممتد (سطر أحادي ناعم)", "name_en" => "Footer 3: Minimal Line (Soft rule divider)"],
                ["id" => "4", "name_ar" => "تعديل 4: شريطي ملون (خلفية شريطية لمعلومات التواصل)", "name_en" => "Footer 4: Colored Banner (Est. banner block)"],
                ["id" => "5", "name_ar" => "تعديل 5: ختم رسمي (مربع مخصص للختم والتحقق)", "name_en" => "Footer 5: Official Stamp Box (Stamp space provided)"]
            ], JSON_UNESCAPED_UNICODE);
        }

        if (!$smartVariables) {
            $smartVariables = json_encode([
                ["code" => "{$company_name}", "label_ar" => "اسم المنشأة", "label_en" => "Company Name"],
                ["code" => "{$company_cr}", "label_ar" => "سجل المنشأة", "label_en" => "Company CR"],
                ["code" => "{$company_license}", "label_ar" => "ترخيص المنشأة", "label_en" => "License No."],
                ["code" => "{$company_gm}", "label_ar" => "المدير العام", "label_en" => "General Manager"],
                ["code" => "{$company_dgm}", "label_ar" => "نائب المدير", "label_en" => "Deputy GM"],
                ["code" => "{$company_address}", "label_ar" => "العنوان الوطني", "label_en" => "National Address"],
                ["code" => "{$customer_name}", "label_ar" => "اسم العميل", "label_en" => "Customer Name"],
                ["code" => "{$customer_phone}", "label_ar" => "هاتف العميل", "label_en" => "Customer Phone"],
                ["code" => "{$customer_cr}", "label_ar" => "سجل العميل", "label_en" => "Customer CR"],
                ["code" => "{$customer_id}", "label_ar" => "هوية العميل", "label_en" => "Customer ID"],
                ["code" => "{$contract_number}", "label_ar" => "رقم العقد", "label_en" => "Contract No."],
                ["code" => "{$start_date}", "label_ar" => "تاريخ البداية", "label_en" => "Start Date"],
                ["code" => "{$end_date}", "label_ar" => "تاريخ النهاية", "label_en" => "End Date"],
                ["code" => "{$mandatory_period}", "label_ar" => "الفترة الإلزامية", "label_en" => "Mandatory Period"],
                ["code" => "{$renew_period}", "label_ar" => "فترة التجديد", "label_en" => "Renewal Period"],
                ["code" => "{$write_date}", "label_ar" => "تاريخ الكتابة", "label_en" => "Write Date"],
                ["code" => "{$write_date_hijri}", "label_ar" => "تاريخ الكتابة هجري", "label_en" => "Write Date Hijri"],
                ["code" => "{$start_date_hijri}", "label_ar" => "تاريخ البداية هجري", "label_en" => "Start Date Hijri"],
                ["code" => "{$terms_count}", "label_ar" => "عدد الشروط", "label_en" => "Terms Count"]
            ], JSON_UNESCAPED_UNICODE);
        }

        if (!$tableColumns) {
            $tableColumns = json_encode([
                ["code" => "item_name", "label_ar" => "الصنف والمستودع", "label_en" => "Item & Warehouse", "default_visible" => true],
                ["code" => "qty", "label_ar" => "الكمية", "label_en" => "Qty", "default_visible" => true],
                ["code" => "rent", "label_ar" => "الإيجار الشهري", "label_en" => "Monthly Rent", "default_visible" => true],
                ["code" => "discount", "label_ar" => "الخصم", "label_en" => "Discount", "default_visible" => true],
                ["code" => "total", "label_ar" => "الإجمالي شامل الضريبة", "label_en" => "Total with VAT", "default_visible" => true]
            ], JSON_UNESCAPED_UNICODE);
        }

        $headerLayouts = json_decode($headerLayouts, true);
        $footerLayouts = json_decode($footerLayouts, true);
        $smartVariables = json_decode($smartVariables, true);
        $tableColumns = json_decode($tableColumns, true);

        return Inertia::render('SaaS/Settings/ContractAdminSettings', compact('headerLayouts', 'footerLayouts', 'smartVariables', 'tableColumns'));
    }

    public function updateContractSettings(Request $request)
    {
        $this->ensureCentralContext();

        $validated = $request->validate([
            'headerLayouts' => 'required|array',
            'headerLayouts.*.id' => 'required|string',
            'headerLayouts.*.name_ar' => 'required|string',
            'headerLayouts.*.name_en' => 'required|string',

            'footerLayouts' => 'required|array',
            'footerLayouts.*.id' => 'required|string',
            'footerLayouts.*.name_ar' => 'required|string',
            'footerLayouts.*.name_en' => 'required|string',

            'smartVariables' => 'required|array',
            'smartVariables.*.code' => 'required|string',
            'smartVariables.*.label_ar' => 'required|string',
            'smartVariables.*.label_en' => 'required|string',

            'tableColumns' => 'required|array',
            'tableColumns.*.code' => 'required|string',
            'tableColumns.*.label_ar' => 'required|string',
            'tableColumns.*.label_en' => 'required|string',
            'tableColumns.*.default_visible' => 'required|boolean',
        ]);

        AdminSetting::updateOrCreate(
            ['key' => 'admin_header_layouts'],
            ['value' => json_encode($validated['headerLayouts'], JSON_UNESCAPED_UNICODE)]
        );

        AdminSetting::updateOrCreate(
            ['key' => 'admin_footer_layouts'],
            ['value' => json_encode($validated['footerLayouts'], JSON_UNESCAPED_UNICODE)]
        );

        AdminSetting::updateOrCreate(
            ['key' => 'admin_smart_variables'],
            ['value' => json_encode($validated['smartVariables'], JSON_UNESCAPED_UNICODE)]
        );

        AdminSetting::updateOrCreate(
            ['key' => 'admin_table_columns'],
            ['value' => json_encode($validated['tableColumns'], JSON_UNESCAPED_UNICODE)]
        );

        return back()->with('success', 'تم حفظ إعدادات العقود بنجاح.');
    }
}
