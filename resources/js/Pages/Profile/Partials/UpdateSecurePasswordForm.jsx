import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { useLang } from '@/Contexts/LanguageContext';

export default function UpdateSecurePasswordForm({ className = '' }) {
    const { lang } = useLang();
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

    const t = {
        title: lang === 'ar' ? 'كلمة مرور العمليات الآمنة' : 'Secure Operations Password',
        description: lang === 'ar' 
            ? 'تستخدم لتأكيد وحماية العمليات الحساسة مثل حذف وتعديل الأصناف المخزنية.' 
            : 'Used to confirm and protect sensitive operations like deleting and updating storage items.',
        labelPassword: lang === 'ar' ? 'كلمة المرور الآمنة' : 'Secure Password',
        labelConfirm: lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Secure Password',
        save: lang === 'ar' ? 'حفظ' : 'Save',
        saved: lang === 'ar' ? 'تم الحفظ.' : 'Saved.',
    };

    return (
        <section className={className} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    {t.title}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    {t.description}
                </p>
            </header>

            <form onSubmit={updateSecurePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="secure_password"
                        value={t.labelPassword}
                    />

                    <TextInput
                        id="secure_password"
                        ref={securePasswordInput}
                        value={data.secure_password}
                        onChange={(e) =>
                            setData('secure_password', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full rounded-none"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.secure_password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="secure_password_confirmation"
                        value={t.labelConfirm}
                    />

                    <TextInput
                        id="secure_password_confirmation"
                        value={data.secure_password_confirmation}
                        onChange={(e) =>
                            setData('secure_password_confirmation', e.target.value)
                        }
                        type="password"
                        className="mt-1 block w-full rounded-none"
                        autoComplete="new-password"
                    />

                    <InputError
                        message={errors.secure_password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing} className="rounded-none">
                        {t.save}
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            {t.saved}
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
