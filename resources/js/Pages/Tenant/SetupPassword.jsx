import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';
import { ShieldAlert, KeyRound } from 'lucide-react';

export default function SetupPassword({ token, email, error }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || '',
        username: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/setup-password');
    };

    return (
        <GuestLayout>
            <Head title="تنشيط الحساب وإعداد كلمة المرور" />

            {error ? (
                <div className="text-center py-4" dir="rtl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center bg-red-100 text-red-600 mb-4 rounded-none">
                        <ShieldAlert className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">رابط غير صالح</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                        {error}
                    </p>
                    <div className="border-t border-gray-100 pt-4 mt-4">
                        <p className="text-xs text-gray-400">
                            WHMS Cloud Warehouse Management System
                        </p>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} className="space-y-4" dir="rtl">
                    <div className="text-center pb-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-primary/10 text-primary mb-3 rounded-none">
                            <KeyRound className="h-6 w-6" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">تنشيط الحساب</h2>
                        <p className="text-xs text-gray-500 mt-1">
                            يرجى تعيين اسم المستخدم وكلمة المرور الخاصة بك لتنشيط الحساب.
                        </p>
                    </div>

                    {/* Email (Readonly) */}
                    <div>
                        <InputLabel htmlFor="email" value="البريد الإلكتروني" />
                        <TextInput
                            id="email"
                            type="email"
                            value={email}
                            className="mt-1 block w-full bg-gray-50 cursor-not-allowed"
                            disabled
                        />
                    </div>

                    {/* Username */}
                    <div>
                        <InputLabel htmlFor="username" value="اسم المستخدم (Username)" />
                        <TextInput
                            id="username"
                            type="text"
                            name="username"
                            value={data.username}
                            className="block w-full mt-1"
                            isFocused={true}
                            onChange={(e) => setData('username', e.target.value)}
                            required
                        />
                        <InputError message={errors.username} className="mt-2" />
                    </div>

                    {/* Password */}
                    <div>
                        <InputLabel htmlFor="password" value="كلمة المرور الجديدة" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    {/* Password Confirmation */}
                    <div>
                        <InputLabel htmlFor="password_confirmation" value="تأكيد كلمة المرور" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end pt-2">
                        <PrimaryButton className="w-full justify-center py-2.5 rounded-none" disabled={processing}>
                            تنشيط الحساب والدخول
                        </PrimaryButton>
                    </div>
                </form>
            )}
        </GuestLayout>
    );
}
