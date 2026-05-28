import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Bell, Home, ChevronRight, Mail, Server, Save } from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function Notifications() {
    const { lang } = useLang();
    const [events, setEvents] = useState([
        {
            id: 1,
            name: "تسجيل مستأجر جديد (New Tenant Request)",
            email: true,
            sms: false,
        },
        {
            id: 2,
            name: "موافقة وتفعيل الحساب (Account Activated)",
            email: true,
            sms: true,
        },
        {
            id: 3,
            name: "تنبيه انتهاء الاشتراك (Subscription Expired)",
            email: true,
            sms: false,
        },
    ]);

    const handleToggle = (id, type) => {
        setEvents(
            events.map((e) => (e.id === id ? { ...e, [type]: !e[type] } : e)),
        );
    };

    const t = {
        title: lang === "ar" ? "إعدادات التنبيهات" : "Notifications Settings",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "إدارة قوالب التنبيهات، البريد الإلكتروني، وإعدادات خادم SMTP"
                : "Manage notification templates, email templates, and SMTP servers configuration",
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`}
            />
            <Link
                href={route("saas.settings.index")}
                className="hover:text-primary transition-colors"
            >
                {t.parent}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`}
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
                    <PageHeader
                        icon={Bell}
                        title={t.title}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {t.desc}
                            </p>
                        }
                        actions={
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "حفظ إعدادات التنبيه"
                                        : "Save Configurations"
                                }
                            >
                                <PrimaryButton className="px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]">
                                    <Save className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar"
                                            ? "حفظ إعدادات التنبيه"
                                            : "Save Configurations"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[6px]">
                        {/* Event Triggers */}
                        <div className="md:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-surface-muted/20">
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "مخطط التنبيهات والأحداث"
                                        : "Notification Events Scheduler"}
                                </h3>
                            </div>
                            <div className="divide-y divide-border">
                                {events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div>
                                            <p className="font-bold text-text text-[13px]">
                                                {event.name}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={event.email}
                                                    onChange={() =>
                                                        handleToggle(
                                                            event.id,
                                                            "email",
                                                        )
                                                    }
                                                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                                />
                                                <span className="text-[11px] text-text-muted">
                                                    Email
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={event.sms}
                                                    onChange={() =>
                                                        handleToggle(
                                                            event.id,
                                                            "sms",
                                                        )
                                                    }
                                                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                                />
                                                <span className="text-[11px] text-text-muted">
                                                    SMS
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SMTP Server Configuration */}
                        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Server className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "إعدادات خادم SMTP"
                                        : "SMTP Server Settings"}
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1">
                                        {lang === "ar"
                                            ? "خادم البريد (SMTP Host)"
                                            : "SMTP Host"}
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value="smtp.mailtrap.io"
                                        className="w-full text-xs bg-slate-50 border border-border rounded-lg p-2 font-mono text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1">
                                        {lang === "ar"
                                            ? "المنفذ (SMTP Port)"
                                            : "SMTP Port"}
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value="2525"
                                        className="w-full text-xs bg-slate-50 border border-border rounded-lg p-2 font-mono text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1">
                                        {lang === "ar"
                                            ? "البريد الإلكتروني المرسل"
                                            : "From Address"}
                                    </label>
                                    <input
                                        type="email"
                                        readOnly
                                        value="noreply@mawthiq.tech"
                                        className="w-full text-xs bg-slate-50 border border-border rounded-lg p-2 font-mono text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
