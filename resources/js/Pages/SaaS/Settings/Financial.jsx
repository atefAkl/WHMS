import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    DollarSign,
    Home,
    ChevronRight,
    CreditCard,
    ShieldCheck,
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function Financial() {
    const { lang } = useLang();
    const [plans, setPlans] = useState([
        {
            id: 1,
            name: "باقة الأعمال (Business)",
            price: "299",
            interval: "شهر",
            storageLimit: "500 طبلية",
            active: true,
        },
        {
            id: 2,
            name: "باقة الشركات (Enterprise)",
            price: "899",
            interval: "شهر",
            storageLimit: "غير محدود",
            active: true,
        },
    ]);

    const t = {
        title: lang === "ar" ? "الإعدادات المالية" : "Financial Settings",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "إدارة الباقات والاشتراكات وإعدادات بوابات الدفع الإلكتروني"
                : "Manage subscription plans, pricing tiers, and payment gateway configurations",
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
                        icon={DollarSign}
                        title={t.title}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {t.desc}
                            </p>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px]">
                        {/* Plans List */}
                        <div className="lg:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-surface-muted/20 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "باقات الاشتراك النشطة"
                                        : "Active Subscription Plans"}
                                </h3>
                                <Tooltip
                                    text={
                                        lang === "ar"
                                            ? "تعديل الباقات"
                                            : "Modify Plans"
                                    }
                                >
                                    <PrimaryButton className="px-3 py-1.5 rounded-lg text-[10px] font-bold h-[30px] flex items-center justify-center">
                                        <span className="display-me">
                                            {lang === "ar"
                                                ? "تعديل الباقات"
                                                : "Modify Plans"}
                                        </span>
                                    </PrimaryButton>
                                </Tooltip>
                            </div>
                            <div className="divide-y divide-border">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100 shrink-0">
                                                {plan.id}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text text-[13px]">
                                                    {plan.name}
                                                </p>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    {lang === "ar"
                                                        ? "الحد الأقصى للتخزين:"
                                                        : "Storage Limit:"}{" "}
                                                    {plan.storageLimit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-sm font-extrabold text-primary">
                                                {plan.price}
                                            </span>
                                            <span className="text-[10px] text-text-muted">
                                                {" "}
                                                ر.س / {plan.interval}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Stripe Gateway Card */}
                        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "بوابة الدفع (Stripe)"
                                        : "Payment Gateway (Stripe)"}
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        Stripe Publishable Key
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value="pk_test_51Ny..."
                                        className="w-full text-xs bg-slate-50 border border-border rounded-lg p-2 font-mono text-slate-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        Stripe Secret Key
                                    </label>
                                    <input
                                        type="password"
                                        readOnly
                                        value="sk_test_••••••••"
                                        className="w-full text-xs bg-slate-50 border border-border rounded-lg p-2 font-mono text-slate-600"
                                    />
                                </div>
                                <div className="p-3 bg-indigo-50 border border-indigo-150 rounded-lg flex items-start gap-2">
                                    <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-indigo-800 leading-normal">
                                        {lang === "ar"
                                            ? "جميع معاملات الدفع والتحصيل مشفرة بالكامل ومتوافقة مع معايير PCI-DSS الأمنية."
                                            : "All transactions and collection credentials are fully encrypted and PCI-DSS compliant."}
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
