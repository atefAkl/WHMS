import React from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Save } from 'lucide-react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const { lang } = useLang();
    const showButtonText = user?.preferences?.show_button_text ?? false;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            id_number: user.id_number || "",
            job_title: user.job_title || "",
        });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true
        });
    };

    return (
        <section className={className}>
            <header className="border-b border-border pb-3 mb-6">
                <h2 className="text-sm font-black text-text">
                    {lang === 'ar' ? 'بيانات الملف الشخصي' : 'Profile Information'}
                </h2>
                <p className="text-[11px] text-text-muted mt-1">
                    {lang === 'ar' ? 'قم بتحديث بيانات حسابك ومعلومات الاتصال المهنية الخاصة بك.' : "Update your account's profile details and professional contact information."}
                </p>
            </header>

            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="name" value={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} />
                        <TextInput
                            id="name"
                            className="mt-1 block w-full text-xs"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            autoComplete="name"
                            placeholder={lang === 'ar' ? "مثال: أحمد محمد" : "e.g. John Doe"}
                        />
                        <InputError className="mt-1" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full text-xs"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                            autoComplete="email"
                            placeholder="example@domain.com"
                        />
                        <InputError className="mt-1" message={errors.email} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="phone" value={lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'} />
                        <TextInput
                            id="phone"
                            type="text"
                            className="mt-1 block w-full text-xs"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            required
                            autoComplete="tel"
                            placeholder="05xxxxxxxx"
                        />
                        <InputError className="mt-1" message={errors.phone} />
                    </div>

                    <div>
                        <InputLabel htmlFor="id_number" value={lang === 'ar' ? 'رقم الهوية / الإقامة' : 'ID Number'} />
                        <TextInput
                            id="id_number"
                            type="text"
                            className="mt-1 block w-full text-xs"
                            value={data.id_number}
                            onChange={(e) => setData('id_number', e.target.value)}
                            required
                            placeholder={lang === 'ar' ? "أدخل رقم الهوية أو الإقامة..." : "Enter national ID or residence number..."}
                        />
                        <InputError className="mt-1" message={errors.id_number} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="job_title" value={lang === 'ar' ? 'المسمى الوظيفي الإداري' : 'Job Title'} />
                        <TextInput
                            id="job_title"
                            type="text"
                            className="mt-1 block w-full text-xs"
                            value={data.job_title}
                            onChange={(e) => setData('job_title', e.target.value)}
                            required
                            placeholder={lang === 'ar' ? "المسمى الوظيفي..." : "Job title..."}
                        />
                        <InputError className="mt-1" message={errors.job_title} />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="p-3 border border-amber-200 bg-amber-50 rounded-xl text-xs text-amber-800">
                        <p>
                            {lang === 'ar' ? 'بريدك الإلكتروني غير مؤكد.' : 'Your email address is unverified.'}{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="font-bold underline hover:text-amber-900"
                            >
                                {lang === 'ar' ? 'اضغط هنا لإعادة إرسال رابط التأكيد.' : 'Click here to re-send the verification email.'}
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 font-bold text-green-600">
                                {lang === 'ar' ? 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.' : 'A new verification link has been sent to your email address.'}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <PrimaryButton 
                        disabled={processing} 
                        className="text-xs flex items-center gap-1.5"
                        tooltip={!showButtonText ? (lang === 'ar' ? 'حفظ البيانات' : 'Save Details') : undefined}
                    >
                        <Save className="h-4 w-4" />
                        {showButtonText && (lang === 'ar' ? 'حفظ البيانات' : 'Save Details')}
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
