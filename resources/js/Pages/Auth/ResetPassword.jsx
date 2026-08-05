import React from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Lock, Mail, ArrowLeft } from 'lucide-react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="تحديث كلمة المرور" />

            <div className="space-y-4 text-start" dir="rtl">
                <div className="space-y-1 text-center border-b border-border pb-4">
                    <h2 className="text-xl font-extrabold text-text">تعيين كلمة المرور الجديدة</h2>
                    <p className="text-xs text-text-muted">
                        أدخل كلمة المرور الجديدة وتأكيدها لإكمال عملية الاستعادة.
                    </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <InputLabel htmlFor="email" value="البريد الإلكتروني *" className="text-xs font-bold" />
                        <div className="relative mt-1">
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="w-full text-sm py-2 px-3 ps-10 bg-slate-50"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <Mail className="absolute start-3 top-2.5 h-4 w-4 text-text-muted/60" />
                        </div>
                        <InputError message={errors.email} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="كلمة المرور الجديدة *" className="text-xs font-bold" />
                        <div className="relative mt-1">
                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="w-full text-sm py-2 px-3 ps-10"
                                autoComplete="new-password"
                                isFocused={true}
                                placeholder="••••••••"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <Lock className="absolute start-3 top-2.5 h-4 w-4 text-text-muted/60" />
                        </div>
                        <InputError message={errors.password} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="password_confirmation"
                            value="تأكيد كلمة المرور الجديدة *"
                            className="text-xs font-bold"
                        />
                        <div className="relative mt-1">
                            <TextInput
                                type="password"
                                id="password_confirmation"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                className="w-full text-sm py-2 px-3 ps-10"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                required
                            />
                            <Lock className="absolute start-3 top-2.5 h-4 w-4 text-text-muted/60" />
                        </div>
                        <InputError
                            message={errors.password_confirmation}
                            className="mt-1"
                        />
                    </div>

                    <PrimaryButton className="w-full justify-center text-xs py-2.5" disabled={processing}>
                        حفظ كلمة المرور الجديدة
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
