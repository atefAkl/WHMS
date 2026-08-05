import React from 'react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <GuestLayout>
            <Head title="استعادة كلمة المرور" />

            <div className="space-y-4 text-start" dir="rtl">
                <div className="space-y-1 text-center border-b border-border pb-4">
                    <h2 className="text-xl font-extrabold text-text">استعادة كلمة المرور</h2>
                    <p className="text-xs text-text-muted">
                        أدخل بريدك الإلكتروني المسجل في النظام وسنرسل لك رابطاً لإعادة تعيين كلمة المرور الخاصة بك.
                    </p>
                </div>

                {status && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="email" value="البريد الإلكتروني المسجل *" className="text-xs font-bold" />
                        <div className="relative mt-1">
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="w-full text-sm py-2 px-3 ps-10"
                                isFocused={true}
                                placeholder="name@company.com"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <Mail className="absolute start-3 top-2.5 h-4 w-4 text-text-muted/60" />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <PrimaryButton className="w-full justify-center text-xs py-2.5" disabled={processing}>
                        إرسال رابط إعادة التعيين
                    </PrimaryButton>

                    <div className="text-center pt-2">
                        <Link
                            href={route('login')}
                            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            العودة إلى صفحة تسجيل الدخول
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
