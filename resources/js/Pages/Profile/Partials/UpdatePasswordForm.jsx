import React, { useRef } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Lock } from 'lucide-react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-border pb-3 mb-6">
                <h2 className="text-sm font-black text-text">
                    {lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password'}
                </h2>

                <p className="text-[11px] text-text-muted mt-1">
                    {lang === 'ar' 
                        ? 'تأكد من استخدام كلمة مرور طويلة وعشوائية ليبقى حسابك آمناً.' 
                        : 'Ensure your account is using a long, random password to stay secure.'}
                </p>
            </header>

            <form onSubmit={updatePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel
                            htmlFor="current_password"
                            value={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                        />

                        <TextInput
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            type="password"
                            placeholder="••••••••"
                            className="mt-1 block w-full text-xs placeholder:text-text-muted/50"
                            autoComplete="current-password"
                        />

                        <InputError
                            message={errors.current_password}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="password" value={lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'} />

                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            type="password"
                            placeholder="••••••••"
                            className="mt-1 block w-full text-xs placeholder:text-text-muted/50"
                            autoComplete="new-password"
                        />

                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value={lang === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm Password'}
                        />

                        <TextInput
                            id="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            type="password"
                            placeholder="••••••••"
                            className="mt-1 block w-full text-xs placeholder:text-text-muted/50"
                            autoComplete="new-password"
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton 
                        disabled={processing}
                        className="flex items-center gap-1.5 text-xs"
                        tooltip={!showButtonText ? (lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password') : undefined}
                    >
                        <Lock className="h-4 w-4" />
                        {showButtonText && (lang === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs text-text-muted">
                            {lang === 'ar' ? 'تم الحفظ بنجاح.' : 'Saved successfully.'}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
