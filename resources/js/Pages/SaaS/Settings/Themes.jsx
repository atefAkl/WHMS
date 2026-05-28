import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Sparkles,
    Home,
    ChevronRight,
    Palette,
    Type,
    Save,
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function Themes() {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;

    const [selectedTheme, setSelectedTheme] = useState("blue");
    const [font, setFont] = useState("ibm");

    const { data, setData, post, processing } = useForm({
        preferences: {
            show_button_text: user?.preferences?.show_button_text ?? false,
        },
    });

    const handleSavePreferences = () => {
        post(route("central.profile.preferences"), {
            preserveScroll: true,
        });
    };

    const themesList = [
        {
            id: "blue",
            color: "bg-blue-600",
            label: { ar: "أزرق (الافتراضي)", en: "Blue (Default)" },
        },
        {
            id: "emerald",
            color: "bg-emerald-600",
            label: { ar: "زمردي", en: "Emerald" },
        },
        {
            id: "amber",
            color: "bg-amber-600",
            label: { ar: "كهرماني", en: "Amber" },
        },
        { id: "rose", color: "bg-rose-600", label: { ar: "وردي", en: "Rose" } },
    ];

    const t = {
        title:
            lang === "ar" ? "إعدادات المظهر والهوية" : "Appearance & Branding",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "تخصيص الهوية البصرية، الألوان، تفضيلات عرض الأزرار، ونوع الخط الافتراضي للنظام"
                : "Customize theme colors, visual branding, button label styles, and default typography",
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
                        icon={Sparkles}
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
                                        ? "حفظ التغييرات"
                                        : "Save Changes"
                                }
                            >
                                <PrimaryButton
                                    onClick={handleSavePreferences}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]"
                                >
                                    <Save className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar"
                                            ? "حفظ التغييرات"
                                            : "Save Changes"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[6px]">
                        {/* Themes Selection */}
                        <div className="md:col-span-2 rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Palette className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "مجموعات ألوان النظام"
                                        : "System Color Presets"}
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-[6px]">
                                {themesList.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() =>
                                            setSelectedTheme(theme.id)
                                        }
                                        className={`p-3 rounded-lg border text-right flex items-center justify-between transition-all ${
                                            selectedTheme === theme.id
                                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                : "border-border bg-white hover:border-slate-350"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`h-4 w-4 rounded-full ${theme.color} shrink-0`}
                                            ></span>
                                            <span className="text-xs font-bold text-text">
                                                {theme.label[lang]}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Branding & Font Configurations */}
                        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Type className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "الخط والارتفاعات وتفضيلات الواجهة"
                                        : "UI Spacing & Preferences"}
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        {lang === "ar"
                                            ? "الخط العربي الافتراضي"
                                            : "Default Arabic Font"}
                                    </label>
                                    <select
                                        value={font}
                                        onChange={(e) =>
                                            setFont(e.target.value)
                                        }
                                        className="w-full text-xs bg-white border border-border rounded-lg focus:ring-primary p-2"
                                    >
                                        <option value="ibm">
                                            IBM Plex Sans Arabic
                                        </option>
                                        <option value="cairo">
                                            Cairo (القاهرة)
                                        </option>
                                        <option value="tajawal">
                                            Tajawal (تجول)
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        {lang === "ar"
                                            ? "نمط عرض أزرار الإجراءات"
                                            : "Action Button Labels Style"}
                                    </label>
                                    <select
                                        value={
                                            data.preferences.show_button_text
                                                ? "true"
                                                : "false"
                                        }
                                        onChange={(e) =>
                                            setData("preferences", {
                                                ...data.preferences,
                                                show_button_text:
                                                    e.target.value === "true",
                                            })
                                        }
                                        className="w-full text-xs bg-white border border-border rounded-lg focus:ring-primary p-2"
                                    >
                                        <option value="false">
                                            {lang === "ar"
                                                ? "أيقونات فقط (افتراضي)"
                                                : "Icons only (Default)"}
                                        </option>
                                        <option value="true">
                                            {lang === "ar"
                                                ? "أيقونات مع نصوص"
                                                : "Icons with text"}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-text-muted mb-1.5">
                                        {lang === "ar"
                                            ? "كثافة الهوامش والارتفاعات"
                                            : "UI Spacing Density"}
                                    </label>
                                    <select className="w-full text-xs bg-white border border-border rounded-lg focus:ring-primary p-2">
                                        <option value="dense">
                                            {lang === "ar"
                                                ? "مكثف (Dense - 6px)"
                                                : "Dense (6px)"}
                                        </option>
                                        <option value="default">
                                            {lang === "ar"
                                                ? "افتراضي (Default - 16px)"
                                                : "Default (16px)"}
                                        </option>
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
