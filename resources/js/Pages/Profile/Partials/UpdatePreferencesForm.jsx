import React from 'react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Save } from 'lucide-react';

export default function UpdatePreferencesForm({ className = '' }) {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;
    
    const isCentral = typeof route !== 'undefined' && (
        route().current('saas.*') || 
        route().current('central.*')
    );

    const { data, setData, post, processing, recentlySuccessful } = useForm({
        preferences: {
            show_button_text: user?.preferences?.show_button_text ?? false,
        }
    });

    const submit = (e) => {
        e.preventDefault();
        const routeName = isCentral ? 'central.profile.preferences' : 'profile.preferences';
        post(route(routeName), {
            preserveScroll: true
        });
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-text">
                    {lang === 'ar' ? 'تفضيلات واجهة المستخدم' : 'UI Preferences'}
                </h2>

                <p className="mt-1 text-sm text-text-muted">
                    {lang === 'ar' ? 'تخصيص تفضيلات العرض والتفاعل في لوحة التحكم الخاصة بك.' : 'Customize view and interaction preferences for your control panel.'}
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="show_button_text" value={lang === 'ar' ? 'نمط عرض أزرار الإجراءات' : 'Action Button Labels Style'} />
                    
                    <select
                        id="show_button_text"
                        className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary text-xs"
                        value={data.preferences.show_button_text ? 'true' : 'false'}
                        onChange={(e) => setData('preferences', {
                            ...data.preferences,
                            show_button_text: e.target.value === 'true'
                        })}
                    >
                        <option value="false">{lang === 'ar' ? 'أيقونات فقط (افتراضي)' : 'Icons only (Default)'}</option>
                        <option value="true">{lang === 'ar' ? 'أيقونات مع نصوص' : 'Icons with text'}</option>
                    </select>
                </div>

                {/* Notifications Customization / Subscriptions */}
                <div className="pt-4 border-t border-border space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-text">
                            {lang === 'ar' ? 'تخصيص التنبيهات المباشرة (Notification Subscriptions)' : 'Notification Subscriptions'}
                        </h3>
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === 'ar' ? 'اختر الأحداث والعمليات التي ترغب في استقبال تنبيهات فورية بها على حسابك.' : 'Select events you wish to receive instant notifications for.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {[
                            { key: 'customer_created', label: lang === 'ar' ? 'إشعارات إضافة عميل جديد' : 'New Customer Alerts', default: true },
                            { key: 'contract_created', label: lang === 'ar' ? 'إشعارات توثيق عقد جديد' : 'New Contract Alerts', default: true },
                            { key: 'reception_created', label: lang === 'ar' ? 'إشعارات سندات الاستلام' : 'Reception Voucher Alerts', default: true },
                            { key: 'delivery_created', label: lang === 'ar' ? 'إشعارات سندات التسليم والعمليات' : 'Delivery Voucher Alerts', default: true },
                        ].map((item) => {
                            const isChecked = data.preferences.notifications?.[item.key] ?? item.default;
                            return (
                                <label key={item.key} className="flex items-center gap-2 p-2.5 rounded border border-border bg-slate-50/50 hover:bg-slate-100/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const currentNotifs = data.preferences.notifications || {};
                                            setData('preferences', {
                                                ...data.preferences,
                                                notifications: {
                                                    ...currentNotifs,
                                                    [item.key]: e.target.checked
                                                }
                                            });
                                        }}
                                    />
                                    <span className="font-medium text-text">{item.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton 
                        disabled={processing}
                        className="flex items-center gap-1.5 text-xs"
                        tooltip={!showButtonText ? (lang === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences') : undefined}
                    >
                        <Save className="h-4 w-4" />
                        {showButtonText && (lang === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences')}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-text-muted">
                            {lang === 'ar' ? 'تم الحفظ بنجاح.' : 'Saved successfully.'}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
