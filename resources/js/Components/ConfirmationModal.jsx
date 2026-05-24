import Modal from './Modal';
import TextInput from './TextInput';
import InputLabel from './InputLabel';
import InputError from './InputError';
import SecondaryButton from './SecondaryButton';
import DangerButton from './DangerButton';
import PrimaryButton from './PrimaryButton';
import { AlertTriangle, Lock } from 'lucide-react';
import { useLang } from '@/Contexts/LanguageContext';

export default function ConfirmationModal({
    show = false,
    title,
    message,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onCancel,
    requirePassword = false,
    passwordValue = '',
    onPasswordChange = () => {},
    passwordError = '',
    processing = false,
    type = 'danger', // 'danger' | 'warning' | 'info'
}) {
    const { lang } = useLang();

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm();
    };

    return (
        <Modal show={show} onClose={onCancel} maxWidth="md">
            <form onSubmit={handleSubmit} className="p-6">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center border ${
                        type === 'danger'
                            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50'
                            : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                    }`}>
                        <AlertTriangle className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2 text-right">
                        <h3 className="text-lg font-bold text-text">
                            {title || (lang === 'ar' ? 'تأكيد الإجراء' : 'Confirm Action')}
                        </h3>
                        <p className="text-sm text-text-muted leading-relaxed">
                            {message}
                        </p>

                        {/* Password Check */}
                        {requirePassword && (
                            <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
                                <InputLabel htmlFor="confirm_password" value={lang === 'ar' ? 'كلمة مرور الحساب للتأكيد' : 'Account password to confirm'} className="text-xs font-semibold text-text" />
                                <div className="relative">
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted">
                                        <Lock className="h-4 w-4" />
                                    </span>
                                    <TextInput
                                        id="confirm_password"
                                        type="password"
                                        name="password"
                                        value={passwordValue}
                                        onChange={(e) => onPasswordChange(e.target.value)}
                                        className="block w-full pr-10 text-sm border-border bg-surface-muted text-text focus:ring-1 focus:ring-primary focus:border-primary"
                                        placeholder={lang === 'ar' ? 'أدخل كلمة المرور الخاصة بك' : 'Enter your password'}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <InputError message={passwordError} className="mt-1" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 flex justify-end gap-2 border-t border-border/50 pt-4">
                    <SecondaryButton onClick={onCancel} disabled={processing} type="button">
                        {cancelLabel || (lang === 'ar' ? 'إلغاء' : 'Cancel')}
                    </SecondaryButton>

                    {type === 'danger' ? (
                        <DangerButton type="submit" disabled={processing}>
                            {confirmLabel || (lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete')}
                        </DangerButton>
                    ) : (
                        <PrimaryButton type="submit" disabled={processing}>
                            {confirmLabel || (lang === 'ar' ? 'متابعة' : 'Continue')}
                        </PrimaryButton>
                    )}
                </div>
            </form>
        </Modal>
    );
}
