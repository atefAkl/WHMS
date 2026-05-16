import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/Contexts/LanguageContext';

export default function Pagination({ links, total, from, to }) {
    const { lang } = useLang();

    if (!links || links.length <= 3) return null;

    const renderLabel = (link, i, isFirst, isLast) => {
        const rawLabel = link.label ?? '';
        
        // Determine icon or text
        let isIconLabel = false;
        let iconEl = null;
        
        if (typeof rawLabel === 'string' && rawLabel.includes('&laquo;')) {
            isIconLabel = true;
            iconEl = lang === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
        } else if (typeof rawLabel === 'string' && rawLabel.includes('&raquo;')) {
            isIconLabel = true;
            iconEl = lang === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
        }

        const baseClass = "flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm font-medium transition-colors";

        if (link.url === null) {
            return (
                <div key={i} className={`${baseClass} text-text-muted/50 opacity-50`}>
                    {isIconLabel ? iconEl : rawLabel}
                </div>
            );
        }

        return (
            <Link
                key={i}
                href={link.url}
                className={`${baseClass} ${link.active ? 'bg-primary text-white hover:bg-primary-hover' : 'text-text hover:bg-surface-muted'}`}
            >
                {isIconLabel ? iconEl : rawLabel}
            </Link>
        );
    };

    return (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row px-6 py-3 border-t border-border bg-surface">
            {/* Info */}
            <div className="text-sm text-text-muted">
                {lang === 'ar' ? (
                    <span>
                        عرض <span className="font-semibold text-text">{from}</span> إلى{' '}
                        <span className="font-semibold text-text">{to}</span> من أصل{' '}
                        <span className="font-semibold text-text">{total}</span>
                    </span>
                ) : (
                    <span>
                        Showing <span className="font-semibold text-text">{from}</span> to{' '}
                        <span className="font-semibold text-text">{to}</span> of{' '}
                        <span className="font-semibold text-text">{total}</span> results
                    </span>
                )}
            </div>

            {/* Links */}
            <div className="flex items-center gap-1">
                {links.map((link, i) => {
                    const isFirst = i === 0;
                    const isLast = i === links.length - 1;
                    return renderLabel(link, i, isFirst, isLast);
                })}
            </div>
        </div>
    );
}
