import { useState, useEffect, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

// ─── Toast Item ────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
    const [exiting, setExiting] = useState(false);

    const handleClose = useCallback(() => {
        setExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    }, [toast.id, onRemove]);

    useEffect(() => {
        const timer = setTimeout(handleClose, toast.duration || 5000);
        return () => clearTimeout(timer);
    }, [handleClose, toast.duration]);

    const config = {
        success: {
            icon: CheckCircle2,
            bg: 'bg-emerald-600',
            border: 'border-emerald-700',
        },
        error: {
            icon: AlertCircle,
            bg: 'bg-red-600',
            border: 'border-red-700',
        },
        warning: {
            icon: AlertTriangle,
            bg: 'bg-amber-600',
            border: 'border-amber-700',
        },
        info: {
            icon: Info,
            bg: 'bg-blue-600',
            border: 'border-blue-700',
        },
    };

    const { icon: Icon, bg, border } = config[toast.type] || config.info;

    return (
        <div
            className={`
                flex items-start gap-2.5 px-4 py-3 rounded-none border shadow-lg
                text-white text-xs font-medium max-w-sm w-full
                ${bg} ${border}
                transition-all duration-300 ease-out
                ${exiting
                    ? 'opacity-0 translate-x-4 scale-95'
                    : 'opacity-100 translate-x-0 scale-100'
                }
            `}
            style={{ animation: exiting ? 'none' : 'toast-in 0.3s ease-out' }}
            role="alert"
        >
            <Icon className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{toast.message}</span>
            <button
                onClick={handleClose}
                className="shrink-0 p-0.5 hover:bg-white/20 rounded transition-colors"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ─── Toast Container ───────────────────────────────────────────
export default function Toast() {
    const { lang } = useLang();
    const { flash, errors } = usePage().props;
    const [toasts, setToasts] = useState([]);
    const lastFlashRef = useRef(null);
    const lastErrorsRef = useRef(null);

    const addToast = useCallback((type, message, duration = 5000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Listen for Inertia flash messages (success, error, warning, info)
    useEffect(() => {
        if (!flash || flash === lastFlashRef.current) return;
        lastFlashRef.current = flash;

        const types = ['success', 'error', 'warning', 'info'];
        types.forEach(type => {
            if (flash[type]) {
                addToast(type, flash[type], type === 'error' ? 8000 : 5000);
            }
        });
    }, [flash, addToast]);

    // Listen for Inertia validation errors and show them as error toasts
    useEffect(() => {
        if (!errors || errors === lastErrorsRef.current) return;
        lastErrorsRef.current = errors;

        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
            // Show first validation error as a toast (avoids spamming multiple)
            const firstError = errors[errorKeys[0]];
            if (firstError) {
                addToast('error', firstError, 8000);
            }
        }
    }, [errors, addToast]);

    // Expose addToast globally so any component can trigger toasts
    useEffect(() => {
        window.__addToast = addToast;
        return () => { delete window.__addToast; };
    }, [addToast]);

    if (toasts.length === 0) return null;

    return (
        <>
            {/* Keyframe animation */}
            <style>{`
                @keyframes toast-in {
                    from {
                        opacity: 0;
                        transform: translateX(${lang === 'ar' ? '-1rem' : '1rem'}) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
            `}</style>

            <div
                className={`fixed top-4 z-[9999] flex flex-col gap-2 pointer-events-none ${
                    lang === 'ar' ? 'left-4' : 'right-4'
                }`}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem toast={toast} onRemove={removeToast} />
                    </div>
                ))}
            </div>
        </>
    );
}

// Helper to trigger toasts from anywhere
export function showToast(type, message, duration) {
    if (window.__addToast) {
        window.__addToast(type, message, duration);
    }
}

