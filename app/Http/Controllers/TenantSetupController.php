<?php

namespace App\Http\Controllers;

use App\Models\ContractSetting;
use App\Models\Season;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class TenantSetupController extends Controller
{
    public function create()
    {
        $settings = ContractSetting::pluck('value', 'key')->all();
        
        // جلب تفاصيل التسجيل المركزي من خلال مستند المستأجر النشط
        $registration = [
            'company_name'  => tenant('company_name') ?? '',
            'company_email' => tenant('email') ?? '',
            'company_phone' => tenant('phone') ?? '',
            'plan'          => tenant('plan') ?? 'باقة أعمال (Business)',
        ];

        return Inertia::render('Tenant/Setup', compact('settings', 'registration'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // المرحلة 1: البيانات العامة
            'company_name'             => 'required|string|max:255',
            'company_slogan'           => 'nullable|string|max:255',
            'company_phone'            => 'required|string|max:255',
            'company_logo'             => 'nullable|image|max:2048',

            // المرحلة 2: ملفات الترخيص والتسجيل
            'company_cr'               => 'required|string|max:255',
            'company_vat'              => 'required|string|max:255',
            'company_address'          => 'required|string|max:255',
            'company_license'          => 'nullable|string|max:255',
            'company_cr_file'          => 'nullable|file|max:5120',
            'company_vat_file'         => 'nullable|file|max:5120',
            'company_license_file'     => 'nullable|file|max:5120',
            'company_additional_files' => 'nullable|array',

            // المرحلة 3: المستخدمين وجهات الاتصال
            'users'                    => 'required|array|min:3',
            'users.*.name'             => 'required|string|max:255',
            'users.*.job_title'        => 'required|string|max:255',
            'users.*.id_number'        => 'required|string|max:255',
            'users.*.phone'            => 'required|string|max:255',
            'users.*.email'            => 'required|email|max:255',
            'users.*.password'         => 'nullable|string|min:6',
            'users.*.username'         => 'required|string|max:255',
            'users.*.avatar'           => 'nullable|image|max:2048',

            // المرحلة 4: قنوات الاتصال
            'company_email'            => 'required|email|max:255',
            'company_contacts'         => 'nullable|array',

            // المرحلة 5: أول موسم عمل
            'season_name_ar'           => 'required|string|max:255',
            'season_name_en'           => 'required|string|max:255',
            'season_start'             => 'required|date',
            'season_end'               => 'required|date',
        ]);

        // 1. معالجة وحفظ شعار الشركة
        if ($request->hasFile('company_logo')) {
            $file = $request->file('company_logo');
            $filename = time() . '_logo_' . $file->getClientOriginalName();
            $file->move(public_path('uploads'), $filename);
            $validated['company_logo'] = '/uploads/' . $filename;
        }

        // 2. معالجة ملفات التراخيص والمستندات الرسمية
        foreach (['company_cr_file', 'company_vat_file', 'company_license_file'] as $fileKey) {
            if ($request->hasFile($fileKey)) {
                $file = $request->file($fileKey);
                $filename = time() . '_' . $fileKey . '_' . $file->getClientOriginalName();
                $file->move(public_path('uploads/documents'), $filename);
                $validated[$fileKey] = '/uploads/documents/' . $filename;
            }
        }

        // 3. معالجة السجلات الإضافية للمستندات الاختيارية
        $additionalFiles = [];
        if ($request->has('company_additional_files')) {
            foreach ($request->input('company_additional_files') as $index => $doc) {
                $path = $doc['file_path'] ?? '';
                if ($request->hasFile("company_additional_files.{$index}.file")) {
                    $file = $request->file("company_additional_files.{$index}.file");
                    $filename = time() . '_add_' . $index . '_' . $file->getClientOriginalName();
                    $file->move(public_path('uploads/documents'), $filename);
                    $path = '/uploads/documents/' . $filename;
                }
                $additionalFiles[] = [
                    'name'      => $doc['name'] ?? 'مستند إضافي',
                    'file_path' => $path,
                ];
            }
        }
        $validated['company_additional_files'] = json_encode($additionalFiles, JSON_UNESCAPED_UNICODE);

        // 4. حفظ كافة الحقول كإعدادات عامة في جدول contract_settings
        $settingFields = [
            'company_name', 'company_slogan', 'company_phone', 'company_logo',
            'company_cr', 'company_vat', 'company_address', 'company_license',
            'company_cr_file', 'company_vat_file', 'company_license_file',
            'company_additional_files', 'company_email', 'company_contacts'
        ];

        foreach ($settingFields as $field) {
            if (isset($validated[$field])) {
                ContractSetting::updateOrCreate(['key' => $field], ['value' => $validated[$field] ?? '']);
            }
        }

        // 5. معالجة وتخزين الموظفين في جدول المستخدمين users
        if ($request->has('users')) {
            foreach ($request->input('users') as $index => $u) {
                $avatarPath = $u['avatar_path'] ?? null;
                if ($request->hasFile("users.{$index}.avatar")) {
                    $file = $request->file("users.{$index}.avatar");
                    $filename = time() . '_avatar_' . $index . '_' . $file->getClientOriginalName();
                    $file->move(public_path('uploads/avatars'), $filename);
                    $avatarPath = '/uploads/avatars/' . $filename;
                }

                $password = !empty($u['password']) ? Hash::make($u['password']) : Hash::make('admin123');

                User::updateOrCreate(
                    ['email' => $u['email']],
                    [
                        'name'      => $u['name'],
                        'username'  => $u['username'],
                        'phone'     => $u['phone'],
                        'id_number' => $u['id_number'],
                        'job_title' => $u['job_title'],
                        'avatar'    => $avatarPath,
                        'password'  => $password,
                    ]
                );
            }
        }

        // 6. معالجة وحفظ قنوات الاتصال الاختيارية بصيغة JSON
        if ($request->has('company_contacts')) {
            $contacts = $request->input('company_contacts') ?? [];
            ContractSetting::updateOrCreate(
                ['key' => 'company_contacts'],
                ['value' => json_encode($contacts, JSON_UNESCAPED_UNICODE)]
            );
        }

        // 7. إيقاف تفعيل المواسم القديمة وتأسيس وتفعيل موسم العمل الأول
        Season::where('is_active', true)->update(['is_active' => false]);
        
        $season = Season::create([
            'name_ar'          => $request->input('season_name_ar'),
            'name_en'          => $request->input('season_name_en'),
            'start_date'       => $request->input('season_start'),
            'end_date'         => $request->input('season_end'),
            'is_active'        => true,
            'mandatory_period' => 12,
            'renewal_period'   => 12,
        ]);

        // تسجيل الموسم النشط في الجلسة (Session) لتفادي أي تحويلات خاطئة
        session([
            'active_season_id'   => $season->id,
            'active_season_name' => $season->name_ar,
        ]);

        return redirect()->route('dashboard')->with('success', 'تم إعداد بيانات المنشأة وتفعيل حسابك بنجاح.');
    }
}
