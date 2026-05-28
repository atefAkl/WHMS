import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Shield,
    Home,
    ChevronRight,
    UserPlus,
    Key,
    Check,
    X,
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function RolesPermissions() {
    const { lang } = useLang();
    const [admins, setAdmins] = useState([
        {
            id: 1,
            name: "أحمد القحطاني",
            email: "ahmed@mawthiq.tech",
            role: "Super Admin",
            active: true,
        },
        {
            id: 2,
            name: "سارة العتيبي",
            email: "sara@mawthiq.tech",
            role: "Support",
            active: true,
        },
        {
            id: 3,
            name: "موسى الحربي",
            email: "mosa@mawthiq.tech",
            role: "Billing",
            active: false,
        },
    ]);

    const handleToggle = (id) => {
        setAdmins(
            admins.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
        );
    };

    const t = {
        title: lang === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "إدارة الأدوار الوظيفية وصلاحيات وصول المستخدمين للوحة الإدارة السحابية"
                : "Manage system administrative roles and access permissions for SaaS administrators",
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
                        icon={Shield}
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
                                        ? "إضافة مشرف جديد"
                                        : "Add Administrator"
                                }
                            >
                                <PrimaryButton className="px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]">
                                    <UserPlus className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar"
                                            ? "إضافة مشرف جديد"
                                            : "Add Administrator"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px]">
                        {/* Admins Table */}
                        <div className="lg:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-surface-muted/50 text-[11px] font-bold text-text-muted uppercase">
                                        <tr>
                                            <th className="py-3 px-4 text-right">
                                                {lang === "ar"
                                                    ? "المشرف"
                                                    : "Administrator"}
                                            </th>
                                            <th className="py-3 px-4 text-right">
                                                {lang === "ar"
                                                    ? "الدور الوظيفي"
                                                    : "Role"}
                                            </th>
                                            <th className="py-3 px-4 text-right">
                                                {lang === "ar"
                                                    ? "الحالة"
                                                    : "Status"}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {admins.map((admin) => (
                                            <tr
                                                key={admin.id}
                                                className="hover:bg-slate-50/50 transition-colors"
                                            >
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-bold text-text text-[13px]">
                                                            {admin.name}
                                                        </p>
                                                        <p className="text-[11px] text-text-muted mt-0.5">
                                                            {admin.email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-0.5 rounded bg-primary/5 text-primary text-[10px] font-bold border border-primary/10">
                                                        {admin.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Tooltip
                                                        text={
                                                            admin.active
                                                                ? lang === "ar"
                                                                    ? "نشط"
                                                                    : "Active"
                                                                : lang === "ar"
                                                                  ? "موقوف"
                                                                  : "Suspended"
                                                        }
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                handleToggle(
                                                                    admin.id,
                                                                )
                                                            }
                                                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                                                                admin.active
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                                            }`}
                                                        >
                                                            {admin.active ? (
                                                                <Check className="h-3 w-3 shrink-0" />
                                                            ) : (
                                                                <X className="h-3 w-3 shrink-0" />
                                                            )}
                                                            <span className="display-me">
                                                                {admin.active
                                                                    ? lang ===
                                                                      "ar"
                                                                        ? "نشط"
                                                                        : "Active"
                                                                    : lang ===
                                                                        "ar"
                                                                      ? "موقوف"
                                                                      : "Suspended"}
                                                            </span>
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Roles Description Card */}
                        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Key className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "صلاحيات الأدوار الافتراضية"
                                        : "Default Role Access Levels"}
                                </h3>
                            </div>

                            <div className="space-y-3 text-[11px] leading-relaxed text-text-muted">
                                <div className="p-2 border border-border rounded-lg bg-slate-50">
                                    <p className="font-bold text-text mb-0.5">
                                        Super Admin
                                    </p>
                                    <p>
                                        {lang === "ar"
                                            ? "صلاحيات كاملة للمنصة وتهيئة الخوادم وقبول الطلبات."
                                            : "Full access to platform administration, server settings, and approvals."}
                                    </p>
                                </div>
                                <div className="p-2 border border-border rounded-lg bg-slate-50">
                                    <p className="font-bold text-text mb-0.5">
                                        Support
                                    </p>
                                    <p>
                                        {lang === "ar"
                                            ? "إمكانية مراجعة طلبات الانضمام والمساعدة الفنية وحل مشاكل المستأجرين."
                                            : "Review registration requests, provide support, and resolve tenant queries."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
