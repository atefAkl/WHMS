<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\TenantSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class NotificationSettingsController extends Controller
{
    public function index()
    {
        $settings = TenantSetting::where('key', 'like', 'notification_%')
            ->pluck('value', 'key')
            ->all();

        $defaultSettings = [
            'notification_sound_enabled'      => 'true',
            'notification_polling_interval'   => '30',
            'notification_auto_mark_read'     => 'true',

            // Events Triggers & System Master Toggles
            'notification_customer_created'   => 'true',
            'notification_contract_created'   => 'true',
            'notification_reception_created'  => 'true',
            'notification_delivery_created'   => 'true',

            // Custom Notification Templates
            'notification_tpl_customer_title' => 'تسجيل عميل جديد 👤',
            'notification_tpl_customer_msg'   => 'تم إضافة العميل الجديد ({customer_name}) إلى النظام بنجاح.',

            'notification_tpl_contract_title' => 'عقد تخزين جديد 📄',
            'notification_tpl_contract_msg'   => 'تم توثيق عقد جديد برقم ({contract_number}) للعميل ({customer_name}).',

            'notification_tpl_reception_title'=> 'سند استلام جديد 📥',
            'notification_tpl_reception_msg'  => 'تم إنشاء سند استلام جديد برقم ({serial_number}).',
        ];

        $mergedSettings = array_merge($defaultSettings, $settings);
        $roles = Role::pluck('name', 'id')->all();

        return Inertia::render('Settings/NotificationSettings', [
            'settings' => $mergedSettings,
            'roles'    => $roles,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            if (str_starts_with($key, 'notification_')) {
                TenantSetting::updateOrCreate(
                    ['key' => $key],
                    ['value' => is_array($value) ? json_encode($value) : (string) $value]
                );
            }
        }

        return redirect()->back()->with('success', 'تم حفظ إعدادات وسلوك التنبيهات بنجاح.');
    }
}
