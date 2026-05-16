import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Globe, Layers, Settings as SettingsIcon, ChevronRight, Home, Shield, Database, Bell, Box, FileText, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Index() {
    const { lang } = useLang();

    const t = {
        title: lang === 'ar' ? 'الإعدادات العامة' : 'System Settings',
        description: lang === 'ar' ? 'إدارة إعدادات النظام والكيانات الأساسية' : 'Manage system settings and core entities',
        cards: [
            {
                title: lang === 'ar' ? 'المواسم' : 'Seasons',
                desc: lang === 'ar' ? 'إدارة فترات ومواسم العمل' : 'Manage work periods and seasons',
                icon: Calendar,
                route: route('settings.seasons.index'),
                color: 'text-fuchsia-500',
                bg: 'bg-fuchsia-500/10'
            },
            {
                title: lang === 'ar' ? 'إعدادات العقود' : 'Contract Settings',
                desc: lang === 'ar' ? 'إدارة شروط العقود القياسية' : 'Manage standard contract terms',
                icon: FileText,
                route: route('settings.terms.index'),
                color: 'text-amber-500',
                bg: 'bg-amber-500/10'
            },
            {
                title: lang === 'ar' ? 'وحدات التخزين' : 'Storage Allocation Items',
                desc: lang === 'ar' ? 'إدارة المساحات والأسعار' : 'Manage storage units and pricing',
                icon: Box,
                route: route('settings.storage-items.index'),
                color: 'text-sky-500',
                bg: 'bg-sky-500/10'
            },
            {
                title: lang === 'ar' ? 'تصنيفات العملاء' : 'Customer Categories',
                desc: lang === 'ar' ? 'إدارة شجرة التصنيفات' : 'Manage categories tree',
                icon: Layers,
                route: route('settings.categories.index'),
                color: 'text-indigo-500',
                bg: 'bg-indigo-500/10'
            },
            {
                title: lang === 'ar' ? 'الدول والجنسيات' : 'Countries & Nationalities',
                desc: lang === 'ar' ? 'إدارة الدول والمناطق' : 'Manage countries & regions',
                icon: Globe,
                route: route('settings.countries.index'),
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10'
            },
            {
                title: lang === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions',
                desc: lang === 'ar' ? 'إدارة المستخدمين' : 'Manage users access',
                icon: Shield,
                route: '#', // placeholder
                color: 'text-rose-500',
                bg: 'bg-rose-500/10'
            },
            {
                title: lang === 'ar' ? 'إعدادات النظام' : 'General Options',
                desc: lang === 'ar' ? 'خيارات النظام العامة' : 'General system options',
                icon: SettingsIcon,
                route: '#', // placeholder
                color: 'text-amber-500',
                bg: 'bg-amber-500/10'
            },
            {
                title: lang === 'ar' ? 'النسخ الاحتياطي' : 'Database Backups',
                desc: lang === 'ar' ? 'حفظ واسترجاع البيانات' : 'Backup and restore',
                icon: Database,
                route: '#', // placeholder
                color: 'text-cyan-500',
                bg: 'bg-cyan-500/10'
            },
            {
                title: lang === 'ar' ? 'الإشعارات' : 'Notifications',
                desc: lang === 'ar' ? 'قوالب وإعدادات الرسائل' : 'Message templates & settings',
                icon: Bell,
                route: '#', // placeholder
                color: 'text-purple-500',
                bg: 'bg-purple-500/10'
            }
        ]
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={cn("h-4 w-4", lang === 'ar' && "rotate-180")} />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div className="py-4 space-y-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-text">{t.title}</h2>
                        <p className="text-sm text-text-muted mt-1">{t.description}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {t.cards.map((card, idx) => (
                            <Link 
                                key={idx} 
                                href={card.route}
                                className="group flex items-start gap-4 p-5 rounded-xl border border-border bg-surface hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors", card.bg, card.color, "group-hover:bg-primary group-hover:text-white")}>
                                    <card.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text group-hover:text-primary transition-colors">{card.title}</h3>
                                    <p className="text-sm text-text-muted mt-1">{card.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
