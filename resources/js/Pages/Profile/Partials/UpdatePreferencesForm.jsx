import React from 'react';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';

export default function UpdatePreferencesForm({ className = '' }) {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    
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

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>
                        {lang === 'ar' ? 'حفظ التفضيلات' : 'Save Preferences'}
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
