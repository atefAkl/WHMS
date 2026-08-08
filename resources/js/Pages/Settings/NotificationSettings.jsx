import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Bell, Sliders, Volume2, Save, FileText, UserPlus, Inbox, ChevronRight, Home, ShieldCheck } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';

export default function NotificationSettings({ settings, roles }) {
    const { lang } = useLang();

    const { data, setData, post, processing, recentlySuccessful } = useForm({
        settings: settings || {}
    });

    const handleChange = (key, value) => {
        setData('settings', {
            ...data.settings,
            [key]: value
        });
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.notifications.update'), {
            preserveScroll: true
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <span className="text-text-muted">{lang === "ar" ? "الإعدادات" : "Settings"}</span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "إعدادات التنبيهات والإشعارات" : "Notification Settings"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "إعدادات التنبيهات والنظام" : "Notification Settings"} />

            <div className="pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Page Header */}
                    <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-black text-text flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                {lang === "ar" ? "لوحة إدارة التنبيهات والنظام (Admin Controls)" : "System Notification Controls"}
                            </h1>
                            <p className="text-xs text-text-muted mt-1">
                                {lang === "ar" ? "التحكم في قوالب الإشعارات، السلوك، ومفاتيح التشغيل على مستوى المنشأة بالكامل." : "Configure notification templates, behaviors, and master triggers enterprise-wide."}
                            </p>
                        </div>
                        <PrimaryButton onClick={submit} disabled={processing} className="flex items-center gap-1.5 text-xs">
                            <Save className="h-4 w-4" />
                            {lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
                        </PrimaryButton>
                    </div>

                    <form onSubmit={submit} className="space-y-6">

                        {/* 1. Global Behavior & Sound */}
                        <div className="bg-surface border border-border rounded-xl p-6 space-y-4 shadow-2xs">
                            <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-3">
                                <Sliders className="h-4 w-4 text-primary" />
                                {lang === "ar" ? "سلوك النظام ونمط الفحص (Behavior & Polling)" : "System Behavior & Polling"}
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <InputLabel value={lang === "ar" ? "التنبيه التلقائي كمقروء عند المكوث (Auto Mark Read on 3s Hover)" : "Auto Mark Read on 3s Hover"} />
                                    <select
                                        className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary text-xs"
                                        value={data.settings.notification_auto_mark_read ?? 'true'}
                                        onChange={(e) => handleChange('notification_auto_mark_read', e.target.value)}
                                    >
                                        <option value="true">{lang === "ar" ? "مفعل (تحديد كمقروء بعد 3 ثوانٍ - مفضل)" : "Enabled (Preferred)"}</option>
                                        <option value="false">{lang === "ar" ? "معطل (يدوي فقط)" : "Disabled (Manual only)"}</option>
                                    </select>
                                </div>

                                <div>
                                    <InputLabel value={lang === "ar" ? "نمط التحديث الهادئ بالخلفية (Smart Zero-Load Pulse)" : "Zero-Load Polling Pattern"} />
                                    <select
                                        className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary text-xs"
                                        value={data.settings.notification_polling_interval ?? '30'}
                                        onChange={(e) => handleChange('notification_polling_interval', e.target.value)}
                                    >
                                        <option value="30">{lang === "ar" ? "فحص هادئ كل 30 ثانية (موصى به لبيئة الإنتاج)" : "Gentle 30s Pulse (Recommended)"}</option>
                                        <option value="60">{lang === "ar" ? "فحص اقتصاد كل 60 ثانية" : "Economical 60s Pulse"}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 2. Notification Templates & Master Event Controls */}
                        <div className="bg-surface border border-border rounded-xl p-6 space-y-5 shadow-2xs">
                            <h2 className="text-sm font-bold text-text flex items-center gap-2 border-b border-border pb-3">
                                <FileText className="h-4 w-4 text-blue-600" />
                                {lang === "ar" ? "تخصيص قوالب ومفاتيح تشغيل التنبيهات (Notification Templates & Event Triggers)" : "Custom Notification Templates & Event Triggers"}
                            </h2>

                            <div className="space-y-4">
                                {/* Customer Template */}
                                <div className="p-4 border border-border rounded-lg bg-slate-50/30 space-y-3">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <h3 className="text-xs font-bold text-text flex items-center gap-1.5">
                                            <UserPlus className="h-4 w-4 text-emerald-600" />
                                            {lang === "ar" ? "إشعار إضافة عميل جديد" : "New Customer Alert"}
                                        </h3>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-text">
                                            <input
                                                type="checkbox"
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                checked={data.settings.notification_customer_created === 'true' || data.settings.notification_customer_created === true}
                                                onChange={(e) => handleChange('notification_customer_created', e.target.checked ? 'true' : 'false')}
                                            />
                                            <span className={data.settings.notification_customer_created === 'true' || data.settings.notification_customer_created === true ? "text-emerald-700 font-black" : "text-text-muted"}>
                                                {lang === "ar" ? "تفعيل الإشعار" : "Enable Alert"}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <InputLabel value={lang === "ar" ? "العنوان" : "Title Template"} />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-border bg-surface text-text text-xs font-bold"
                                                value={data.settings.notification_tpl_customer_title ?? ''}
                                                onChange={(e) => handleChange('notification_tpl_customer_title', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value={lang === "ar" ? "نص الرسالة (استخدم {customer_name})" : "Message ({customer_name})"} />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-border bg-surface text-text text-xs"
                                                value={data.settings.notification_tpl_customer_msg ?? ''}
                                                onChange={(e) => handleChange('notification_tpl_customer_msg', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Template */}
                                <div className="p-4 border border-border rounded-lg bg-slate-50/30 space-y-3">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <h3 className="text-xs font-bold text-text flex items-center gap-1.5">
                                            <FileText className="h-4 w-4 text-blue-600" />
                                            {lang === "ar" ? "إشعار توثيق عقد جديد" : "New Contract Alert"}
                                        </h3>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-text">
                                            <input
                                                type="checkbox"
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                checked={data.settings.notification_contract_created === 'true' || data.settings.notification_contract_created === true}
                                                onChange={(e) => handleChange('notification_contract_created', e.target.checked ? 'true' : 'false')}
                                            />
                                            <span className={data.settings.notification_contract_created === 'true' || data.settings.notification_contract_created === true ? "text-emerald-700 font-black" : "text-text-muted"}>
                                                {lang === "ar" ? "تفعيل الإشعار" : "Enable Alert"}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <InputLabel value={lang === "ar" ? "العنوان" : "Title Template"} />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-border bg-surface text-text text-xs font-bold"
                                                value={data.settings.notification_tpl_contract_title ?? ''}
                                                onChange={(e) => handleChange('notification_tpl_contract_title', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value={lang === "ar" ? "نص الرسالة (استخدم {contract_number} و {customer_name})" : "Message ({contract_number}, {customer_name})"} />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-border bg-surface text-text text-xs"
                                                value={data.settings.notification_tpl_contract_msg ?? ''}
                                                onChange={(e) => handleChange('notification_tpl_contract_msg', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Reception Template */}
                                <div className="p-4 border border-border rounded-lg bg-slate-50/30 space-y-3">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                                        <h3 className="text-xs font-bold text-text flex items-center gap-1.5">
                                            <Inbox className="h-4 w-4 text-amber-600" />
                                            {lang === "ar" ? "إشعار سند استلام جديد" : "New Reception Voucher Alert"}
                                        </h3>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-text">
                                            <input
                                                type="checkbox"
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                checked={data.settings.notification_reception_created === 'true' || data.settings.notification_reception_created === true}
                                                onChange={(e) => handleChange('notification_reception_created', e.target.checked ? 'true' : 'false')}
                                            />
                                            <span className={data.settings.notification_reception_created === 'true' || data.settings.notification_reception_created === true ? "text-emerald-700 font-black" : "text-text-muted"}>
                                                {lang === "ar" ? "تفعيل الإشعار" : "Enable Alert"}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        <div>
                                            <InputLabel value={lang === "ar" ? "العنوان" : "Title Template"} />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-border bg-surface text-text text-xs font-bold"
                                                value={data.settings.notification_tpl_reception_title ?? ''}
                                                onChange={(e) => handleChange('notification_tpl_reception_title', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value={lang === "ar" ? "نص الرسالة (استخدم {serial_number})" : "Message ({serial_number})"} />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-border bg-surface text-text text-xs"
                                                value={data.settings.notification_tpl_reception_msg ?? ''}
                                                onChange={(e) => handleChange('notification_tpl_reception_msg', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Footer */}
                        <div className="flex justify-end pt-4">
                            <PrimaryButton disabled={processing} className="flex items-center gap-1.5 text-xs px-6 py-2.5">
                                <Save className="h-4 w-4" />
                                {lang === "ar" ? "حفظ إعدادات التنبيهات والنظام" : "Save Notification Settings"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
