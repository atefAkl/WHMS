import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Globe,
    Database,
    Settings as SettingsIcon,
    ChevronRight,
    Home,
    Shield,
    Bell,
    DollarSign,
    FileText,
    LayoutDashboard,
    Sparkles,
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Settings() {
    const { lang } = useLang();

    const t = {
        title:
            lang === "ar"
                ? "إعدادات النظام (الإدارة العامة)"
                : "SaaS System Settings",
        description:
            lang === "ar"
                ? "إدارة إعدادات منصة SaaS والخيارات المركزية للتطبيق"
                : "Manage central SaaS platform configurations and system properties",
        cards: [
            {
                title: lang === "ar" ? "إعدادات المستأجرين" : "Tenant Settings",
                desc:
                    lang === "ar"
                        ? "تهيئة شروط تفعيل الحسابات وقبول الطلبات تلقائياً للمستأجرين"
                        : "Configure account activation parameters and automatic request approvals",
                icon: LayoutDashboard,
                route: route("saas.settings.tenants"),
                color: "text-primary",
                bg: "bg-primary/10",
            },
            {
                title:
                    lang === "ar"
                        ? "الشروط العامة للمستأجرين"
                        : "Global Seeding Terms",
                desc:
                    lang === "ar"
                        ? "إدارة شروط العقود المجهزة للبذر للمستأجرين الجدد"
                        : "Manage default contract terms ready for seeding to new tenants",
                icon: FileText,
                route: route("saas.settings.terms"),
                color: "text-amber-500",
                bg: "bg-amber-500/10",
            },
            {
                title:
                    lang === "ar"
                        ? "إعدادات هياكل العقود الموحدة"
                        : "Central Contract Layout Settings",
                desc:
                    lang === "ar"
                        ? "إدارة مخططات الترويسة والتذييل، المتغيرات الذكية، وجداول أصناف العقود الافتراضية"
                        : "Manage default print layouts, smart variables, and storage items table structure",
                icon: SettingsIcon,
                route: route("saas.settings.contracts"),
                color: "text-violet-500",
                bg: "bg-violet-500/10",
            },
            {
                title:
                    lang === "ar"
                        ? "الإعدادات الجغرافية"
                        : "Geographical Settings",
                desc:
                    lang === "ar"
                        ? "إدارة الدول والعملات والمناطق المدعومة سحابياً"
                        : "Manage supported countries, currencies, and regions",
                icon: Globe,
                route: route("saas.settings.geo"),
                color: "text-emerald-500",
                bg: "bg-emerald-500/10",
            },
            {
                title:
                    lang === "ar" ? "الإعدادات المالية" : "Financial Settings",
                desc:
                    lang === "ar"
                        ? "إدارة الباقات والأسعار وخطط الاشتراك والفوترة"
                        : "Manage plans, pricing, subscriptions, and billing",
                icon: DollarSign,
                route: route("saas.settings.financial"),
                color: "text-sky-500",
                bg: "bg-sky-500/10",
            },
            {
                title: lang === "ar" ? "إعدادات المظهر" : "Appearance Settings",
                desc:
                    lang === "ar"
                        ? "تخصيص الهوية البصرية والشعارات ولوحة الألوان"
                        : "Customize visual identity, logos, and color palette",
                icon: Sparkles,
                route: route("saas.settings.themes"),
                color: "text-fuchsia-500",
                bg: "bg-fuchsia-500/10",
            },
            {
                title:
                    lang === "ar"
                        ? "إعدادات التنبيهات"
                        : "Notifications Settings",
                desc:
                    lang === "ar"
                        ? "تخصيص قوالب البريد الإلكتروني والإشعارات الفورية"
                        : "Customize email templates and instant notifications",
                icon: Bell,
                route: route("saas.settings.notifications"),
                color: "text-purple-500",
                bg: "bg-purple-500/10",
            },
            {
                title:
                    lang === "ar"
                        ? "الأدوار والصلاحيات"
                        : "Roles & Permissions",
                desc:
                    lang === "ar"
                        ? "تحديد صلاحيات مديري النظام المركزيين"
                        : "Define roles and access permissions for SaaS administrators",
                icon: Shield,
                route: route("saas.settings.roles"),
                color: "text-rose-500",
                bg: "bg-rose-500/10",
            },
        ],
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={cn("h-3.5 w-3.5", lang === "ar" && "rotate-180")}
            />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div
                className="pb-4 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-[6px]">
                    {/* Header Banner - standard PageHeader component */}
                    <PageHeader
                        icon={SettingsIcon}
                        title={t.title}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {t.description}
                            </p>
                        }
                    />

                    {/* Settings Grid - 6px margins/gaps between elements */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[6px]">
                        {t.cards.map((card, idx) => (
                            <Link
                                key={idx}
                                href={card.route}
                                className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-surface hover:border-primary/50 hover:shadow-md transition-all duration-200"
                            >
                                <div
                                    className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                                        card.bg,
                                        card.color,
                                        "group-hover:bg-primary group-hover:text-white",
                                    )}
                                >
                                    <card.icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-text text-[13px] group-hover:text-primary transition-colors truncate">
                                        {card.title}
                                    </h3>
                                    <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                                        {card.desc}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
