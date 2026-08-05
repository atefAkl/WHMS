import React, { useRef } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Lock } from 'lucide-react';

export default function UpdateSecurePasswordForm({ className = '' }) {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;
    const securePasswordInput = useRef();

    const {
        data,
        setData,
        errors,
        post,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        secure_password: '',
        secure_password_confirmation: '',
    });

    const updateSecurePassword = (e) => {
        e.preventDefault();

        post(route('profile.secure-password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.secure_password) {
                    reset('secure_password', 'secure_password_confirmation');
                    securePasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-border pb-3 mb-6">
                <h2 className="text-sm font-black text-text">
                    {lang === 'ar' ? 'كلمة مرور العمليات الآمنة' : 'Secure Operations Password'}
                </h2>

                <p className="text-[11px] text-text-muted mt-1">
                    {lang === 'ar' 
                        ? 'تستخدم لتأكيد وحماية العمليات الحساسة مثل حذف وتعديل الأصناف المخزنية.' 
                        : 'Used to confirm and protect sensitive operations like deleting and updating storage items.'}
                </p>
            </header>

            <form onSubmit={updateSecurePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel
                            htmlFor="secure_password"
                            value={lang === 'ar' ? 'كلمة المرور الآمنة' : 'Secure Password'}
                        />

                        <TextInput
                            id="secure_password"
                            ref={securePasswordInput}
                            value={data.secure_password}
                            onChange={(e) =>
                                setData('secure_password', e.target.value)
                            }
                            type="password"
                            placeholder="••••"
                            className="mt-1 block w-full text-xs placeholder:text-text-muted/50"
                            autoComplete="new-password"
                        />

                        <InputError
                            message={errors.secure_password}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="secure_password_confirmation"
                            value={lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Secure Password'}
                        />

                        <TextInput
                            id="secure_password_confirmation"
                            value={data.secure_password_confirmation}
                            onChange={(e) =>
                                setData('secure_password_confirmation', e.target.value)
                            }
                            type="password"
                            placeholder="••••"
                            className="mt-1 block w-full text-xs placeholder:text-text-muted/50"
                            autoComplete="new-password"
                        />

                        <InputError
                            message={errors.secure_password_confirmation}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton 
                        disabled={processing}
                        className="flex items-center gap-1.5 text-xs"
                        tooltip={!showButtonText ? (lang === 'ar' ? 'حفظ' : 'Save') : undefined}
                    >
                        <Lock className="h-4 w-4" />
                        {showButtonText && (lang === 'ar' ? 'حفظ' : 'Save')}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-text-muted">
                            {lang === 'ar' ? 'تم الحفظ.' : 'Saved.'}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
