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
        $terms = Term::whereNull('season_id')->whereNull('contract_id')->orderBy('id', 'desc')->get();
        $settings = ContractSetting::pluck('value', 'key')->all();

        // Default values for unified editor mode
        $settings['contract_editor_mode'] = 'unified';
        $settings['header_design_id'] = $settings['header_design_id'] ?? '1';
        $settings['footer_design_id'] = $settings['footer_design_id'] ?? '1';
        $settings['show_contract_serial'] = $settings['show_contract_serial'] ?? '1';
        $settings['show_customer_serial'] = $settings['show_customer_serial'] ?? '1';
        $settings['show_certificate_number'] = $settings['show_certificate_number'] ?? '0';

        // Column defaults
        $settings['table_show_item'] = $settings['table_show_item'] ?? '1';
        $settings['table_show_qty'] = $settings['table_show_qty'] ?? '1';
        $settings['table_show_rent'] = $settings['table_show_rent'] ?? '1';
        $settings['table_show_discount'] = $settings['table_show_discount'] ?? '1';
        $settings['table_show_total'] = $settings['table_show_total'] ?? '1';
        $settings['contract_title'] = $settings['contract_title'] ?? 'عقد تخزين وتأجير طبالي';

        if (empty($settings['unified_contract_template'])) {
            $defaultIntro = $settings['default_introduction'] ?? "بعون الله وتوفيقه، في يوم {\$write_date} م، الموافق {\$write_date_hijri} هـ ، قد اجتمع كل من:-";
            $defaultPreamble = $settings['default_preamble'] ?? "حيث أن الطرف الأول لديه مخازن تبريد وتجميد ويعمل في مجال التخزين بخدماته، ومرخص له بمزاولة النشاط بموجب الترخيص رقم ({\$company_license}) وحيث أن الطرف الثاني يرغب في استئجار طبالي لدى الطرف الأول، فقد اتفقا وهما بكامل أهليتهما الشرعية المعتبرة للتوقيع على هذا العقد فيما يلي:-";
            $settings['unified_contract_template'] = $defaultIntro . "\n\n" . $defaultPreamble . "\n\n[ITEMS_TABLE]\n\n" . "بند الشروط والأحكام:\nيلتزم الطرف الثاني بكافة الشروط المحددة.";
        }

        // Fetch SaaS Admin configurations from Central DB
        $centralConnection = config('tenancy.database.central_connection');
        $centralHeaderLayouts = \DB::connection($centralConnection)->table('admin_settings')->where('key', 'admin_header_layouts')->value('value');
        $centralFooterLayouts = \DB::connection($centralConnection)->table('admin_settings')->where('key', 'admin_footer_layouts')->value('value');
        $centralSmartVariables = \DB::connection($centralConnection)->table('admin_settings')->where('key', 'admin_smart_variables')->value('value');
        $centralTableColumns = \DB::connection($centralConnection)->table('admin_settings')->where('key', 'admin_table_columns')->value('value');

        $headerLayouts = $centralHeaderLayouts ? json_decode($centralHeaderLayouts, true) : [
            ["id" => "1", "name_ar" => "تصميم 1: كلاسيكي قياسي (البيانات باليمين والشعار باليسار)", "name_en" => "Design 1: Classic Standard (Split header)"],
            ["id" => "2", "name_ar" => "تصميم 2: متمركز حديث (جميع البيانات متمركزة بالوسط)", "name_en" => "Design 2: Modern Centered (Centered logo & details)"],
            ["id" => "3", "name_ar" => "تصميم 3: بسيط ممتد (شريط ترويسة سطرية أفقي)", "name_en" => "Design 3: Simple Minimalist (Horizontal layout)"],
            ["id" => "4", "name_ar" => "تصميم 4: مؤطر ملون (شريط ترويسة داكن مع الشعار)", "name_en" => "Design 4: Colored Banner (Est. banner header)"],
            ["id" => "5", "name_ar" => "تصميم 5: نظام الجودة (معلومات إصدار الجودة والمستند)", "name_en" => "Design 5: ISO Quality (Boxed document control)"]
        ];

        $footerLayouts = $centralFooterLayouts ? json_decode($centralFooterLayouts, true) : [
            ["id" => "1", "name_ar" => "تعديل 1: تذييل قياسي متمركز (الاسم والتواصل بالوسط)", "name_en" => "Footer 1: Standard Centered (Contacts centered)"],
            ["id" => "2", "name_ar" => "تعديل 2: ثلاثة أعمدة (تواصل | موقع | نظام WHMS)", "name_en" => "Footer 2: Three Columns (Structured contacts)"],
            ["id" => "3", "name_ar" => "تعديل 3: بسيط خط ممتد (سطر أحادي ناعم)", "name_en" => "Footer 3: Minimal Line (Soft rule divider)"],
            ["id" => "4", "name_ar" => "تعديل 4: شريطي ملون (خلفية شريطية لمعلومات التواصل)", "name_en" => "Footer 4: Colored Banner (Est. banner block)"],
            ["id" => "5", "name_ar" => "تعديل 5: ختم رسمي (مربع مخصص للختم والتحقق)", "name_en" => "Footer 5: Official Stamp Box (Stamp space provided)"]
        ];

        $smartVariables = $centralSmartVariables ? json_decode($centralSmartVariables, true) : [
            ["code" => '{$company_name}', "label_ar" => "اسم المنشأة", "label_en" => "Company Name"],
            ["code" => '{$company_cr}', "label_ar" => "سجل المنشأة", "label_en" => "Company CR"],
            ["code" => '{$company_license}', "label_ar" => "ترخيص المنشأة", "label_en" => "License No."],
            ["code" => '{$company_gm}', "label_ar" => "المدير العام", "label_en" => "General Manager"],
            ["code" => '{$company_dgm}', "label_ar" => "نائب المدير", "label_en" => "Deputy GM"],
            ["code" => '{$company_address}', "label_ar" => "العنوان الوطني", "label_en" => "National Address"],
            ["code" => '{$customer_name}', "label_ar" => "اسم العميل", "label_en" => "Customer Name"],
            ["code" => '{$customer_phone}', "label_ar" => "هاتف العميل", "label_en" => "Customer Phone"],
            ["code" => '{$customer_cr}', "label_ar" => "سجل العميل", "label_en" => "Customer CR"],
            ["code" => '{$customer_id}', "label_ar" => "هوية العميل", "label_en" => "Customer ID"],
            ["code" => '{$contract_number}', "label_ar" => "رقم العقد", "label_en" => "Contract No."],
            ["code" => '{$start_date}', "label_ar" => "تاريخ البداية", "label_en" => "Start Date"],
            ["code" => '{$end_date}', "label_ar" => "تاريخ النهاية", "label_en" => "End Date"],
            ["code" => '{$mandatory_period}', "label_ar" => "الفترة الإلزامية", "label_en" => "Mandatory Period"],
            ["code" => '{$renew_period}', "label_ar" => "فترة التجديد", "label_en" => "Renewal Period"],
            ["code" => '{$write_date}', "label_ar" => "تاريخ الكتابة", "label_en" => "Write Date"],
            ["code" => '{$write_date_hijri}', "label_ar" => "تاريخ الكتابة هجري", "label_en" => "Write Date Hijri"],
            ["code" => '{$start_date_hijri}', "label_ar" => "تاريخ البداية هجري", "label_en" => "Start Date Hijri"],
            ["code" => '{$terms_count}', "label_ar" => "عدد الشروط", "label_en" => "Terms Count"]
        ];

        $tableColumns = $centralTableColumns ? json_decode($centralTableColumns, true) : [
            ["code" => "item_name", "label_ar" => "الصنف والمستودع", "label_en" => "Item & Warehouse", "default_visible" => true],
            ["code" => "qty", "label_ar" => "الكمية", "label_en" => "Qty", "default_visible" => true],
            ["code" => "rent", "label_ar" => "الإيجار الشهري", "label_en" => "Monthly Rent", "default_visible" => true],
            ["code" => "discount", "label_ar" => "الخصم", "label_en" => "Discount", "default_visible" => true],
            ["code" => "total", "label_ar" => "الإجمالي شامل الضريبة", "label_en" => "Total with VAT", "default_visible" => true]
        ];

        return Inertia::render('Settings/ContractSettings', compact('terms', 'settings', 'headerLayouts', 'footerLayouts', 'smartVariables', 'tableColumns'));
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
            'show_first_party_cr'      => 'nullable|boolean',
            'show_first_party_vat'     => 'nullable|boolean',
            'show_first_party_license'  => 'nullable|boolean',
            'show_first_party_address'  => 'nullable|boolean',
            'show_first_party_phone'    => 'nullable|boolean',
            'show_first_party_email'    => 'nullable|boolean',
            'show_first_party_gm'       => 'nullable|boolean',
            'show_first_party_dgm'      => 'nullable|boolean',
            'show_second_party_cr'     => 'nullable|boolean',
            'show_second_party_vat'    => 'nullable|boolean',
            'show_second_party_license' => 'nullable|boolean',
            'show_second_party_address' => 'nullable|boolean',
            'show_second_party_phone'   => 'nullable|boolean',
            'show_second_party_email'   => 'nullable|boolean',
            'show_second_party_gm'      => 'nullable|boolean',
            'show_second_party_id'      => 'nullable|boolean',
            'include_second_party_proxy'=> 'nullable|boolean',
            'calendar_type'            => 'nullable|string|in:gregorian,hijri',
            'is_renewable'             => 'nullable|boolean',
            
            // Layout customization fields
            'contract_title'            => 'nullable|string',
            'header_design_id'          => 'required|string',
            'footer_design_id'          => 'required|string',
            'unified_contract_template' => 'nullable|string',
            'show_contract_serial'      => 'nullable|boolean',
            'show_customer_serial'      => 'nullable|boolean',
            'show_certificate_number'   => 'nullable|boolean',

            // Columns visibility
            'table_show_item'           => 'nullable|boolean',
            'table_show_qty'            => 'nullable|boolean',
            'table_show_rent'           => 'nullable|boolean',
            'table_show_discount'       => 'nullable|boolean',
            'table_show_total'          => 'nullable|boolean',
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
            if (is_bool($value)) {
                $value = $value ? '1' : '0';
            }
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
            'season_id' => 'nullable|exists:seasons,id',
        ]);

        $validated['sort_order'] = Term::where('season_id', $request->season_id)
            ->whereNull('contract_id')
            ->max('sort_order') + 1;

        Term::create($validated);

        return redirect()->back()->with('success', 'تم إضافة الشرط بنجاح.');
    }

    public function update(Request $request, Term $term)
    {
        $validated = $request->validate([
            'text_ar'    => 'required|string',
            'text_en'    => 'nullable|string',
            'is_active'  => 'boolean',
            'sort_order' => 'nullable|integer',
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

    public function updateBlock(Request $request, $blockId)
    {
        $block = \App\Models\ContractBlock::whereNull('season_id')
            ->whereNull('contract_id')
            ->findOrFail($blockId);

        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
            'content'    => 'nullable|array',
        ]);

        $block->update($validated);

        return redirect()->back()->with('success', 'تم تحديث جزء العقد بنجاح.');
    }

    public function destroy(Term $term)
    {
        $term->delete();
        return redirect()->back()->with('success', 'تم حذف الشرط.');
    }
}
