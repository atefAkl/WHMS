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
                title: lang === 'ar' ? 'الإعدادات العامة' : 'General Settings',
                desc: lang === 'ar' ? 'هوية المنشأة، تفضيلات النظام، الجودة، والفوترة' : 'Company profile, system preferences, quality & billing',
                icon: SettingsIcon,
                route: route('settings.general.index'),
                color: 'text-amber-500',
                bg: 'bg-amber-500/10'
            },
            {
                title: lang === 'ar' ? 'إدارة المشتركين (SaaS Dashboard)' : 'SaaS Tenants',
                desc: lang === 'ar' ? 'لوحة إدارة الاشتراكات والنطاقات الفرعية' : 'Manage tenants, subdomains & subscriptions',
                icon: Database,
                route: route('saas.tenants.index'),
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

            <div className="pb-4 space-y-3">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
                    
                    {/* Header Banner - matching Customer Show/Index standards */}
                    <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-surface shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <SettingsIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-text leading-tight">{t.title}</h1>
                                <p className="text-[12px] text-text-muted mt-0.5">{t.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {t.cards.map((card, idx) => (
                            <Link 
                                key={idx} 
                                href={card.route}
                                className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors", card.bg, card.color, "group-hover:bg-primary group-hover:text-white")}>
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-text text-[13px] group-hover:text-primary transition-colors">{card.title}</h3>
                                    <p className="text-[11px] text-text-muted mt-0.5">{card.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
