import React, { useRef, useState } from 'react';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Trash2, X } from 'lucide-react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header className="border-b border-border pb-3 mb-6">
                <h2 className="text-sm font-black text-rose-800">
                    {lang === 'ar' ? 'حذف الحساب نهائياً' : 'Delete Account'}
                </h2>

                <p className="text-[11px] text-rose-700/80 mt-1">
                    {lang === 'ar' 
                        ? 'بمجرد حذف حسابك، سيتم حذف جميع موارده وبياناته نهائياً. يرجى تنزيل أي بيانات ترغب في الاحتفاظ بها قبل الإجراء.' 
                        : 'Once your account is deleted, all of its resources and data will be permanently deleted. Please download any data you wish to retain.'}
                </p>
            </header>

            <DangerButton 
                onClick={confirmUserDeletion}
                className="flex items-center gap-1.5 text-xs"
                tooltip={!showButtonText ? (lang === 'ar' ? 'حذف الحساب نهائياً' : 'Delete Account') : undefined}
            >
                <Trash2 className="h-4 w-4" />
                {showButtonText && (lang === 'ar' ? 'حذف الحساب نهائياً' : 'Delete Account')}
            </DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <form onSubmit={deleteUser} className="flex flex-col h-full bg-white rounded-lg overflow-hidden text-start" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
                        <h2 className="text-sm font-bold text-text">
                            {lang === 'ar' ? 'تأكيد حذف الحساب' : 'Confirm Account Deletion'}
                        </h2>
                        <button type="button" onClick={closeModal} className="text-text-muted hover:text-text">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 space-y-4">
                        <p className="text-xs text-text-muted leading-relaxed">
                            {lang === 'ar' 
                                ? 'بمجرد حذف حسابك، سيتم إزالة جميع السجلات المرتبطة بك نهائياً. يرجى إدخال كلمة المرور لتأكيد رغبتك في الحذف.' 
                                : 'Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.'}
                        </p>

                        <div className="mt-2">
                            <InputLabel
                                htmlFor="password"
                                value={lang === 'ar' ? 'كلمة المرور لتأكيد الحذف' : 'Password'}
                                className="sr-only"
                            />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                className="mt-1 block w-full sm:w-3/4 text-xs placeholder:text-text-muted/50"
                                isFocused
                                placeholder="••••••••"
                            />

                            <InputError
                                message={errors.password}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3.5 bg-slate-50 border-t border-border flex justify-end gap-2">
                        <SecondaryButton onClick={closeModal} className="text-xs flex items-center gap-1">
                            <X className="h-3.5 w-3.5" />
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </SecondaryButton>

                        <DangerButton 
                            className="flex items-center gap-1 text-xs" 
                            disabled={processing}
                            tooltip={!showButtonText ? (lang === 'ar' ? 'حذف الحساب' : 'Delete Account') : undefined}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {showButtonText && (lang === 'ar' ? 'حذف الحساب' : 'Delete Account')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
