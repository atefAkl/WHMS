import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Globe, Home, ChevronRight, Plus, Check, X } from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function GeoSettings() {
    const { lang } = useLang();
    const [countries, setCountries] = useState([
        {
            id: 1,
            nameAr: "المملكة العربية السعودية",
            nameEn: "Saudi Arabia",
            code: "SA",
            currency: "SAR",
            timezone: "Asia/Riyadh",
            active: true,
        },
        {
            id: 2,
            nameAr: "الإمارات العربية المتحدة",
            nameEn: "United Arab Emirates",
            code: "AE",
            currency: "AED",
            timezone: "Asia/Dubai",
            active: true,
        },
        {
            id: 3,
            nameAr: "جمهورية مصر العربية",
            nameEn: "Egypt",
            code: "EG",
            currency: "EGP",
            timezone: "Africa/Cairo",
            active: false,
        },
    ]);

    const handleToggle = (id) => {
        setCountries(
            countries.map((c) =>
                c.id === id ? { ...c, active: !c.active } : c,
            ),
        );
    };

    const t = {
        title: lang === "ar" ? "الإعدادات الجغرافية" : "Geographical Settings",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "إدارة الدول والعملات والمناطق الزمنية المدعومة في النظام السحابي"
                : "Manage countries, currencies, and timezones supported in the SaaS platform",
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
                        icon={Globe}
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
                                        ? "إضافة دولة جديدة"
                                        : "Add Country"
                                }
                            >
                                <PrimaryButton className="px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]">
                                    <Plus className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar"
                                            ? "إضافة دولة جديدة"
                                            : "Add Country"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[6px]">
                        {/* List Countries */}
                        <div className="md:col-span-2 rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-border bg-surface-muted/20">
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "الدول النشطة والمتاحة"
                                        : "Active & Supported Countries"}
                                </h3>
                            </div>
                            <div className="divide-y divide-border">
                                {countries.map((country) => (
                                    <div
                                        key={country.id}
                                        className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100 shrink-0">
                                                {country.code}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text text-[13px]">
                                                    {lang === "ar"
                                                        ? country.nameAr
                                                        : country.nameEn}
                                                </p>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    {country.timezone} •{" "}
                                                    {country.currency}
                                                </p>
                                            </div>
                                        </div>

                                        <Tooltip
                                            text={
                                                country.active
                                                    ? lang === "ar"
                                                        ? "نشط"
                                                        : "Active"
                                                    : lang === "ar"
                                                      ? "معطل"
                                                      : "Disabled"
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    handleToggle(country.id)
                                                }
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center justify-center gap-1 ${
                                                    country.active
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                                }`}
                                            >
                                                {country.active ? (
                                                    <Check className="h-3 w-3 shrink-0" />
                                                ) : (
                                                    <X className="h-3 w-3 shrink-0" />
                                                )}
                                                <span className="display-me">
                                                    {country.active
                                                        ? lang === "ar"
                                                            ? "نشط"
                                                            : "Active"
                                                        : lang === "ar"
                                                          ? "معطل"
                                                          : "Disabled"}
                                                </span>
                                            </button>
                                        </Tooltip>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Configurations Card */}
                        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "التفضيلات الجغرافية"
                                        : "Geographical Preferences"}
                                </h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {lang === "ar"
                                        ? "ضبط الدولة الافتراضية والعملة الأساسية"
                                        : "Configure default country and primary currency"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        {lang === "ar"
                                            ? "الدولة الافتراضية"
                                            : "Default Country"}
                                    </label>
                                    <select className="w-full text-xs bg-white border border-border rounded-lg focus:ring-primary p-2">
                                        <option value="SA">
                                            {lang === "ar"
                                                ? "المملكة العربية السعودية"
                                                : "Saudi Arabia"}
                                        </option>
                                        <option value="AE">
                                            {lang === "ar"
                                                ? "الإمارات العربية المتحدة"
                                                : "United Arab Emirates"}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        {lang === "ar"
                                            ? "العملة الافتراضية"
                                            : "Primary Currency"}
                                    </label>
                                    <select className="w-full text-xs bg-white border border-border rounded-lg focus:ring-primary p-2">
                                        <option value="SAR">SAR (ر.س)</option>
                                        <option value="AED">AED (د.إ)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
