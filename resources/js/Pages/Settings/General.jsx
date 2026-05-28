import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Building2,
    Save,
    Upload,
    Settings as SettingsIcon,
    ShieldCheck,
    CreditCard,
    ChevronRight,
    Home,
    FolderOpen,
    FileText,
    Image as ImageIcon,
    Trash2,
    ExternalLink,
    Plus,
    AlertCircle,
} from "lucide-react";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import { useTheme } from "@/Contexts/ThemeContext";

export default function General({ settings }) {
    const { lang } = useLang();
    const {
        theme,
        setTheme,
        bg,
        setBg,
        font,
        setFont,
        verticalSpacing,
        setVerticalSpacing,
    } = useTheme();
    const [activeTab, setActiveTab] = useState("company"); // company, system, quality, billing, files

    // Main Settings Form
    const { data, setData, post, processing, errors } = useForm({
        // Company Profile
        company_name: settings?.company_name || "",
        company_slogan: settings?.company_slogan || "",
        company_cr: settings?.company_cr || "",
        company_vat: settings?.company_vat || "",
        company_license: settings?.company_license || "",
        company_phone: settings?.company_phone || "",
        company_email: settings?.company_email || "",
        company_address: settings?.company_address || "",
        company_gm: settings?.company_gm || "",
        company_dgm: settings?.company_dgm || "",
        company_logo: null,

        // System Preferences
        app_language: settings?.app_language || "ar",
        app_timezone: settings?.app_timezone || "Asia/Riyadh",
        app_currency: settings?.app_currency || "SAR",
        app_pagination: settings?.app_pagination || 10,

        // Quality System
        show_quality_data:
            settings?.show_quality_data === "1" ||
            settings?.show_quality_data === true,
        quality_issue_no: settings?.quality_issue_no || "",
        quality_issue_date: settings?.quality_issue_date || "",
        iso_code: settings?.iso_code || "",

        // Billing
        default_tax_rate: settings?.default_tax_rate || 15,
        bank_name: settings?.bank_name || "",
        bank_iban: settings?.bank_iban || "",
    });

    const [logoPreview, setLogoPreview] = useState(
        settings?.company_logo || null,
    );

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("company_logo", file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("settings.general.store"));
    };

    // Files Upload Form
    const fileForm = useForm({
        file: null,
        category: "cr",
        custom_category: "",
    });

    const [filePreviewName, setFilePreviewName] = useState("");
    const [fileToDelete, setFileToDelete] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            fileForm.setData("file", file);
            setFilePreviewName(file.name);
        }
    };

    const submitFile = (e) => {
        e.preventDefault();
        fileForm.post(route("settings.general.files.upload"), {
            preserveScroll: true,
            onSuccess: () => {
                fileForm.reset();
                setFilePreviewName("");
            },
        });
    };

    const confirmDeleteFile = (file) => {
        setFileToDelete(file);
    };

    const deleteFile = () => {
        if (!fileToDelete) return;
        router.delete(
            route("settings.general.files.destroy", fileToDelete.id),
            {
                preserveScroll: true,
                onSuccess: () => setFileToDelete(null),
            },
        );
    };

    const companyFiles = settings?.company_files || [];
    const standardCategories = [
        "cr",
        "vat",
        "national_address",
        "license",
        "other",
    ];

    const customCategories = companyFiles
        .filter((f) => !standardCategories.includes(f.category))
        .reduce((acc, current) => {
            if (!acc.find((item) => item.category === current.category)) {
                return acc.concat([
                    {
                        category: current.category,
                        category_name: current.category_name,
                    },
                ]);
            }
            return acc;
        }, []);

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <Link
                href={route("settings.index")}
                className="hover:text-primary transition-colors"
            >
                {lang === "ar" ? "الإعدادات" : "Settings"}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">
                {lang === "ar" ? "الإعدادات العامة" : "General Settings"}
            </span>
        </div>
    );

    const tabs = [
        {
            id: "company",
            label: lang === "ar" ? "بيانات المنشأة" : "Company Profile",
            icon: Building2,
            desc:
                lang === "ar"
                    ? "الهوية القانونية والشعار"
                    : "Legal identity & logo",
        },
        {
            id: "system",
            label: lang === "ar" ? "تفضيلات النظام" : "System Preferences",
            icon: SettingsIcon,
            desc:
                lang === "ar"
                    ? "اللغة، التوقيت، والعرض"
                    : "Language, timezone & display",
        },
        {
            id: "quality",
            label: lang === "ar" ? "نظام الجودة (QMS)" : "Quality System",
            icon: ShieldCheck,
            desc:
                lang === "ar"
                    ? "إصدارات الجودة و ISO"
                    : "QMS & ISO certifications",
        },
        {
            id: "billing",
            label: lang === "ar" ? "الفوترة والمالية" : "Billing & Payments",
            icon: CreditCard,
            desc:
                lang === "ar"
                    ? "الضرائب والحسابات البنكية"
                    : "Taxes & bank accounts",
        },
        {
            id: "files",
            label: lang === "ar" ? "إدارة الملفات" : "Files Management",
            icon: FolderOpen,
            desc:
                lang === "ar"
                    ? "السجل، الضريبة، والتراخيص"
                    : "CR, VAT & licenses files",
        },
    ];

    const categoryBadges = {
        cr: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        vat: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        national_address: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        license: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        other: "bg-surface-muted text-text-muted border-border",
    };

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    lang === "ar"
                        ? "الإعدادات العامة للنظام"
                        : "General System Settings"
                }
            />

            <div className="pb-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 main-stack-y">
                    {/* Title Banner - matching Customer Show/Index standards */}
                    <div className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-surface shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                <SettingsIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-text leading-tight">
                                    {lang === "ar"
                                        ? "الإعدادات العامة للنظام والمنشأة"
                                        : "General System & Company Settings"}
                                </h1>
                                <p className="text-[12px] text-text-muted mt-0.5">
                                    {lang === "ar"
                                        ? "إدارة شاملة ومبوبة لهوية المنشأة، خيارات العرض، اعتمادات الجودة، والوثائق الرسمية."
                                        : "Manage company identity, display preferences, QMS certifications, and official documents."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation & Content Container */}
                    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[500px]">
                        {/* Sidebar Tabs Navigation */}
                        <div className="lg:w-1/4 border-b lg:border-b-0 lg:border-e border-border bg-surface-muted/30 p-4 space-y-1">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3 px-2">
                                {lang === "ar"
                                    ? "مجموعات الإعدادات"
                                    : "Settings Groups"}
                            </p>
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-start transition-all ${
                                        activeTab === tab.id
                                            ? "bg-surface border border-border shadow-sm text-primary font-bold"
                                            : "border border-transparent text-text hover:bg-surface-muted/50"
                                    }`}
                                >
                                    <div
                                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${activeTab === tab.id ? "bg-primary/10 text-primary" : "bg-surface-muted text-text-muted"}`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold leading-none">
                                            {tab.label}
                                        </p>
                                        <p
                                            className={`text-[11px] mt-1 ${activeTab === tab.id ? "text-primary/80" : "text-text-muted"}`}
                                        >
                                            {tab.desc}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Form & Tab Content */}
                        <div className="lg:w-3/4 p-4 sm:p-6 flex flex-col justify-between">
                            {/* TAB 1: Company Profile */}
                            {activeTab === "company" && (
                                <form
                                    onSubmit={submit}
                                    className="space-y-6 animate-fadeIn"
                                >
                                    <div className="space-y-4">
                                        <div className="border-b border-border pb-3 mb-4">
                                            <h2 className="text-[13px] font-bold text-text">
                                                {lang === "ar"
                                                    ? "بيانات وهوية المنشأة"
                                                    : "Company Identity Details"}
                                            </h2>
                                            <p className="text-[11px] text-text-muted mt-0.5">
                                                {lang === "ar"
                                                    ? "المعلومات الرسمية التي تظهر في ترويسة العقود والفواتير"
                                                    : "Official information displayed on contract & invoice headers"}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "اسم المنشأة *"
                                                            : "Company Name *"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm"
                                                    value={data.company_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.company_name
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "النشاط / الشعار الوصفي"
                                                            : "Slogan / Activity"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm"
                                                    value={data.company_slogan}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_slogan",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        lang === "ar"
                                                            ? "مثال: تخزين - تبريد - تغليف"
                                                            : "e.g. Storage - Packaging"
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.company_slogan
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "سجل تجاري *"
                                                            : "Commercial Registration *"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm font-mono"
                                                    value={data.company_cr}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_cr",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    dir="ltr"
                                                />
                                                <InputError
                                                    message={errors.company_cr}
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "الرقم الضريبي *"
                                                            : "VAT Number *"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm font-mono"
                                                    value={data.company_vat}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_vat",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    dir="ltr"
                                                />
                                                <InputError
                                                    message={errors.company_vat}
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "رقم ترخيص التخزين"
                                                            : "License Number"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm font-mono"
                                                    value={data.company_license}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_license",
                                                            e.target.value,
                                                        )
                                                    }
                                                    dir="ltr"
                                                />
                                                <InputError
                                                    message={
                                                        errors.company_license
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "رقم الهاتف / الجوال *"
                                                            : "Phone Number *"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm font-mono"
                                                    value={data.company_phone}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_phone",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    dir="ltr"
                                                />
                                                <InputError
                                                    message={
                                                        errors.company_phone
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "البريد الإلكتروني *"
                                                            : "Email Address *"
                                                    }
                                                />
                                                <TextInput
                                                    type="email"
                                                    className="mt-0.5 block w-full text-sm font-mono"
                                                    value={data.company_email}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_email",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                    dir="ltr"
                                                />
                                                <InputError
                                                    message={
                                                        errors.company_email
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "العنوان الوطني *"
                                                            : "National Address *"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm"
                                                    value={data.company_address}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_address",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.company_address
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "المدير العام (الممثل النظامي) *"
                                                            : "General Manager *"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm"
                                                    value={data.company_gm}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_gm",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                <InputError
                                                    message={errors.company_gm}
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "نائب المدير العام"
                                                            : "Deputy GM"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm"
                                                    value={data.company_dgm}
                                                    onChange={(e) =>
                                                        setData(
                                                            "company_dgm",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={errors.company_dgm}
                                                />
                                            </div>

                                            <div className="md:col-span-2 border border-border p-3 rounded-xl bg-surface-muted/30 flex items-center justify-between gap-3 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                                        {logoPreview ? (
                                                            <img
                                                                src={
                                                                    logoPreview
                                                                }
                                                                alt="Logo Preview"
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <Building2 className="h-5 w-5 text-text-muted" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={
                                                                lang === "ar"
                                                                    ? "شعار المنشأة (Logo)"
                                                                    : "Company Logo"
                                                            }
                                                        />
                                                        <p className="text-[11px] text-text-muted mt-0.5">
                                                            {lang === "ar"
                                                                ? "صيغة شفافة PNG أو JPG (الحد الأقصى 2 ميجابايت)"
                                                                : "Transparent PNG or JPG (Max 2MB)"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="cursor-pointer px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 flex items-center gap-1.5 transition-all shadow-sm">
                                                    <Upload className="h-3.5 w-3.5" />
                                                    <span>
                                                        {lang === "ar"
                                                            ? "اختر ملف"
                                                            : "Choose File"}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={
                                                            handleLogoChange
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-end gap-2">
                                        <PrimaryButton
                                            disabled={processing}
                                            className="px-4 py-1.5 text-xs font-medium shadow-sm"
                                        >
                                            <Save className="h-3.5 w-3.5 me-1.5" />
                                            <span>
                                                {lang === "ar"
                                                    ? "حفظ التعديلات العامة"
                                                    : "Save General Settings"}
                                            </span>
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}

                            {/* TAB 2: System Preferences */}
                            {activeTab === "system" && (
                                <form
                                    onSubmit={submit}
                                    className="space-y-6 animate-fadeIn"
                                >
                                    <div className="space-y-4">
                                        <div className="border-b border-border pb-3 mb-4">
                                            <h2 className="text-[13px] font-bold text-text">
                                                {lang === "ar"
                                                    ? "تفضيلات وخيارات النظام"
                                                    : "System Preferences"}
                                            </h2>
                                            <p className="text-[11px] text-text-muted mt-0.5">
                                                {lang === "ar"
                                                    ? "ضبط اللغة، التوقيت الإقليمي، وعرض الجداول الافتراضي"
                                                    : "Configure language, regional timezone, and default table views"}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "لغة واجهة التطبيق"
                                                            : "Application Language"
                                                    }
                                                />
                                                <select
                                                    className="mt-0.5 block w-full rounded-md border border-border bg-surface text-sm py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                    value={data.app_language}
                                                    onChange={(e) =>
                                                        setData(
                                                            "app_language",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="ar">
                                                        العربية (Arabic)
                                                    </option>
                                                    <option value="en">
                                                        English (الإنجليزية)
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={
                                                        errors.app_language
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "المنطقة الزمنية (Timezone)"
                                                            : "Timezone"
                                                    }
                                                />
                                                <select
                                                    className="mt-0.5 block w-full rounded-md border border-border bg-surface text-sm py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm font-mono"
                                                    value={data.app_timezone}
                                                    onChange={(e) =>
                                                        setData(
                                                            "app_timezone",
                                                            e.target.value,
                                                        )
                                                    }
                                                    dir="ltr"
                                                >
                                                    <option value="Asia/Riyadh">
                                                        Asia/Riyadh (توقيت
                                                        السعودية)
                                                    </option>
                                                    <option value="Asia/Dubai">
                                                        Asia/Dubai (توقيت
                                                        الإمارات)
                                                    </option>
                                                    <option value="Africa/Cairo">
                                                        Africa/Cairo (توقيت مصر)
                                                    </option>
                                                    <option value="UTC">
                                                        UTC (التوقيت العالمي)
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={
                                                        errors.app_timezone
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "العملة الافتراضية"
                                                            : "Default Currency"
                                                    }
                                                />
                                                <select
                                                    className="mt-0.5 block w-full rounded-md border border-border bg-surface text-sm py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                    value={data.app_currency}
                                                    onChange={(e) =>
                                                        setData(
                                                            "app_currency",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="SAR">
                                                        ر.س (ريال سعودي)
                                                    </option>
                                                    <option value="USD">
                                                        $ (دولار أمريكي)
                                                    </option>
                                                    <option value="AED">
                                                        د.إ (درهم إماراتي)
                                                    </option>
                                                    <option value="EGP">
                                                        ج.م (جنيه مصري)
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={
                                                        errors.app_currency
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "عدد العناصر الافتراضي في الجداول"
                                                            : "Default Pagination Limit"
                                                    }
                                                />
                                                <select
                                                    className="mt-0.5 block w-full rounded-md border border-border bg-surface text-sm py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                    value={data.app_pagination}
                                                    onChange={(e) =>
                                                        setData(
                                                            "app_pagination",
                                                            parseInt(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <option value="10">
                                                        10 عناصر لكل صفحة
                                                    </option>
                                                    <option value="25">
                                                        25 عنصر لكل صفحة
                                                    </option>
                                                    <option value="50">
                                                        50 عنصر لكل صفحة
                                                    </option>
                                                    <option value="100">
                                                        100 عنصر لكل صفحة
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={
                                                        errors.app_pagination
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {/* مظهر وتخصيص الواجهة (Theme & Appearance) */}
                                        <div className="border-t border-border pt-4 mt-6">
                                            <h3 className="text-xs font-bold text-text mb-1">
                                                {lang === "ar"
                                                    ? "تخصيص مظهر واجهة المستخدم"
                                                    : "Theme & Appearance Customization"}
                                            </h3>
                                            <p className="text-[11px] text-text-muted mb-4">
                                                {lang === "ar"
                                                    ? "اختر الألوان المفضلة، نمط الخلفية، ونوع الخط المناسب لواجهتك."
                                                    : "Choose color themes, background styles, and fonts for your UI."}
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-surface-muted/30 p-4 rounded-xl border border-border">
                                                {/* Theme Color */}
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "لون السمة الرئيسي (Theme)"
                                                                : "Theme Color"
                                                        }
                                                    />
                                                    <div className="flex gap-2.5 mt-2">
                                                        {[
                                                            {
                                                                id: "blue",
                                                                color: "#2563eb",
                                                                label: {
                                                                    ar: "أزرق",
                                                                    en: "Blue",
                                                                },
                                                            },
                                                            {
                                                                id: "emerald",
                                                                color: "#059669",
                                                                label: {
                                                                    ar: "زمردي",
                                                                    en: "Emerald",
                                                                },
                                                            },
                                                            {
                                                                id: "amber",
                                                                color: "#d97706",
                                                                label: {
                                                                    ar: "كهرماني",
                                                                    en: "Amber",
                                                                },
                                                            },
                                                            {
                                                                id: "rose",
                                                                color: "#e11d48",
                                                                label: {
                                                                    ar: "وردي",
                                                                    en: "Rose",
                                                                },
                                                            },
                                                            {
                                                                id: "slate",
                                                                color: "#475569",
                                                                label: {
                                                                    ar: "رمادي",
                                                                    en: "Slate",
                                                                },
                                                            },
                                                        ].map((c) => (
                                                            <button
                                                                key={c.id}
                                                                type="button"
                                                                onClick={() =>
                                                                    setTheme(
                                                                        c.id,
                                                                    )
                                                                }
                                                                className={`h-7 w-7 rounded-full border-2 transition-transform duration-200 hover:scale-110 shadow-sm ${
                                                                    theme ===
                                                                    c.id
                                                                        ? "border-primary scale-110 ring-2 ring-primary/20"
                                                                        : "border-transparent"
                                                                }`}
                                                                style={{
                                                                    backgroundColor:
                                                                        c.color,
                                                                }}
                                                                title={
                                                                    c.label[
                                                                        lang
                                                                    ]
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Background Mode */}
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "وضع الخلفية والسطوع"
                                                                : "Background Mode"
                                                        }
                                                    />
                                                    <select
                                                        className="mt-1.5 block w-full rounded-md border border-border bg-surface text-xs py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                        value={bg}
                                                        onChange={(e) =>
                                                            setBg(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        {[
                                                            {
                                                                id: "flat-light",
                                                                label: {
                                                                    ar: "فاتح",
                                                                    en: "Light",
                                                                },
                                                            },
                                                            {
                                                                id: "warm-cream",
                                                                label: {
                                                                    ar: "دافئ (كريمي)",
                                                                    en: "Warm Cream",
                                                                },
                                                            },
                                                            {
                                                                id: "flat-dark",
                                                                label: {
                                                                    ar: "داكن",
                                                                    en: "Dark",
                                                                },
                                                            },
                                                            {
                                                                id: "deep-blue",
                                                                label: {
                                                                    ar: "ليلي",
                                                                    en: "Deep Blue",
                                                                },
                                                            },
                                                        ].map((b) => (
                                                            <option
                                                                key={b.id}
                                                                value={b.id}
                                                            >
                                                                {b.label[lang]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Font Family */}
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "خط واجهة المستخدم الرئيسي"
                                                                : "UI Font Family"
                                                        }
                                                    />
                                                    <select
                                                        className="mt-1.5 block w-full rounded-md border border-border bg-surface text-xs py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                        value={font}
                                                        onChange={(e) =>
                                                            setFont(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        {[
                                                            {
                                                                id: "noto",
                                                                label: "Noto Sans Arabic (الافتراضي)",
                                                            },
                                                            {
                                                                id: "cairo",
                                                                label: "Cairo (القاهرة)",
                                                            },
                                                            {
                                                                id: "tajawal",
                                                                label: "Tajawal (تجول)",
                                                            },
                                                            {
                                                                id: "alexandria",
                                                                label: "Alexandria (الإسكندرية)",
                                                            },
                                                            {
                                                                id: "readex",
                                                                label: "Readex Pro (ريدكس)",
                                                            },
                                                            {
                                                                id: "ibm",
                                                                label: "IBM Plex Arabic",
                                                            },
                                                        ].map((f) => (
                                                            <option
                                                                key={f.id}
                                                                value={f.id}
                                                            >
                                                                {f.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Vertical Main Gap */}
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "الهامش الرأسي بين العناصر في الواجهات"
                                                                : "Vertical Gap Between Interface Sections"
                                                        }
                                                    />
                                                    <select
                                                        className="mt-1.5 block w-full rounded-md border border-border bg-surface text-xs py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                        value={verticalSpacing}
                                                        onChange={(e) =>
                                                            setVerticalSpacing(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="stacked">
                                                            {lang === "ar"
                                                                ? "مكدس (2 بكسل)"
                                                                : "Stacked (2px)"}
                                                        </option>
                                                        <option value="normal">
                                                            {lang === "ar"
                                                                ? "طبيعي (6 بكسل)"
                                                                : "Normal (6px)"}
                                                        </option>
                                                        <option value="wide">
                                                            {lang === "ar"
                                                                ? "واسع (12 بكسل)"
                                                                : "Wide (12px)"}
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-end gap-2">
                                        <PrimaryButton
                                            disabled={processing}
                                            className="px-4 py-1.5 text-xs font-medium shadow-sm"
                                        >
                                            <Save className="h-3.5 w-3.5 me-1.5" />
                                            <span>
                                                {lang === "ar"
                                                    ? "حفظ التعديلات العامة"
                                                    : "Save General Settings"}
                                            </span>
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}

                            {/* TAB 3: Quality System (QMS) */}
                            {activeTab === "quality" && (
                                <form
                                    onSubmit={submit}
                                    className="space-y-6 animate-fadeIn"
                                >
                                    <div className="space-y-4">
                                        <div className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                                            <div>
                                                <h2 className="text-[13px] font-bold text-text">
                                                    {lang === "ar"
                                                        ? "إعدادات نظام إدارة الجودة (QMS)"
                                                        : "Quality System Settings"}
                                                </h2>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    {lang === "ar"
                                                        ? "التحكم في ظهور بيانات الجودة والاعتمادات في الوثائق المطبوعة"
                                                        : "Control display of QMS & ISO data on printed documents"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 bg-surface-muted px-3 py-1.5 rounded-lg border border-border shadow-sm">
                                                <span className="text-xs font-bold text-text">
                                                    {lang === "ar"
                                                        ? "تفعيل الإظهار"
                                                        : "Enable Display"}
                                                </span>
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        data.show_quality_data
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "show_quality_data",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        {data.show_quality_data ? (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-fadeIn shadow-sm">
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "رقم الإصدار (Issue no)"
                                                                : "Issue Number"
                                                        }
                                                    />
                                                    <TextInput
                                                        className="mt-0.5 block w-full text-sm font-mono"
                                                        value={
                                                            data.quality_issue_no
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "quality_issue_no",
                                                                e.target.value,
                                                            )
                                                        }
                                                        dir="ltr"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.quality_issue_no
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "تاريخ الإصدار (Issue Date)"
                                                                : "Issue Date"
                                                        }
                                                    />
                                                    <TextInput
                                                        className="mt-0.5 block w-full text-sm font-mono"
                                                        value={
                                                            data.quality_issue_date
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                "quality_issue_date",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="YYYY-MM-DD"
                                                        dir="ltr"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.quality_issue_date
                                                        }
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "رمز شهادة الأيزو (ISO Code)"
                                                                : "ISO Code"
                                                        }
                                                    />
                                                    <TextInput
                                                        className="mt-0.5 block w-full text-sm font-mono"
                                                        value={data.iso_code}
                                                        onChange={(e) =>
                                                            setData(
                                                                "iso_code",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="ISO 9001:2015"
                                                        dir="ltr"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors.iso_code
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center bg-surface-muted/50 rounded-xl border border-border shadow-sm">
                                                <ShieldCheck className="h-8 w-8 text-text-muted mx-auto mb-2" />
                                                <p className="text-xs font-bold text-text-muted">
                                                    {lang === "ar"
                                                        ? "بيانات الجودة معطلة حالياً"
                                                        : "QMS data display is currently disabled"}
                                                </p>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    {lang === "ar"
                                                        ? "قم بتفعيل الإظهار من المفتاح العلوي لإدخال أرقام وتواريخ الإصدار"
                                                        : "Enable display from the top toggle to input issue numbers and dates"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-end gap-2">
                                        <PrimaryButton
                                            disabled={processing}
                                            className="px-4 py-1.5 text-xs font-medium shadow-sm"
                                        >
                                            <Save className="h-3.5 w-3.5 me-1.5" />
                                            <span>
                                                {lang === "ar"
                                                    ? "حفظ التعديلات العامة"
                                                    : "Save General Settings"}
                                            </span>
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}

                            {/* TAB 4: Billing & Payments */}
                            {activeTab === "billing" && (
                                <form
                                    onSubmit={submit}
                                    className="space-y-6 animate-fadeIn"
                                >
                                    <div className="space-y-4">
                                        <div className="border-b border-border pb-3 mb-4">
                                            <h2 className="text-[13px] font-bold text-text">
                                                {lang === "ar"
                                                    ? "إعدادات الفوترة والحسابات البنكية"
                                                    : "Billing & Bank Accounts"}
                                            </h2>
                                            <p className="text-[11px] text-text-muted mt-0.5">
                                                {lang === "ar"
                                                    ? "نسبة الضريبة المضافة والبيانات البنكية لتحويل المستحقات"
                                                    : "VAT percentage and bank details for wire transfers"}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "نسبة الضريبة الافتراضية (%)"
                                                            : "Default Tax Rate (%)"
                                                    }
                                                />
                                                <TextInput
                                                    type="number"
                                                    className="mt-0.5 block w-full text-sm font-mono"
                                                    value={
                                                        data.default_tax_rate
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "default_tax_rate",
                                                            e.target.value,
                                                        )
                                                    }
                                                    dir="ltr"
                                                />
                                                <InputError
                                                    message={
                                                        errors.default_tax_rate
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "اسم البنك المعتمد"
                                                            : "Bank Name"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm"
                                                    value={data.bank_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            "bank_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        lang === "ar"
                                                            ? "مصرف الراجحي"
                                                            : "Al Rajhi Bank"
                                                    }
                                                />
                                                <InputError
                                                    message={errors.bank_name}
                                                />
                                            </div>

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "رقم الحساب الدولي (IBAN)"
                                                            : "IBAN"
                                                    }
                                                />
                                                <TextInput
                                                    className="mt-0.5 block w-full text-sm font-mono text-left"
                                                    dir="ltr"
                                                    value={data.bank_iban}
                                                    onChange={(e) =>
                                                        setData(
                                                            "bank_iban",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="SA0000000000000000000000"
                                                />
                                                <InputError
                                                    message={errors.bank_iban}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-end gap-2">
                                        <PrimaryButton
                                            disabled={processing}
                                            className="px-4 py-1.5 text-xs font-medium shadow-sm"
                                        >
                                            <Save className="h-3.5 w-3.5 me-1.5" />
                                            <span>
                                                {lang === "ar"
                                                    ? "حفظ التعديلات العامة"
                                                    : "Save General Settings"}
                                            </span>
                                        </PrimaryButton>
                                    </div>
                                </form>
                            )}

                            {/* TAB 5: Files Management */}
                            {activeTab === "files" && (
                                <div className="space-y-6 animate-fadeIn">
                                    {/* Upload Card */}
                                    <form
                                        onSubmit={submitFile}
                                        className="p-4 rounded-xl border border-border bg-surface-muted/30 space-y-4 shadow-sm"
                                    >
                                        <div className="flex items-center gap-2 border-b border-border pb-2.5">
                                            <Upload className="h-4 w-4 text-primary" />
                                            <h3 className="text-xs font-bold text-text">
                                                {lang === "ar"
                                                    ? "رفع وتصنيف مستند جديد"
                                                    : "Upload & Classify New Document"}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "تصنيف الملف *"
                                                            : "Document Category *"
                                                    }
                                                />
                                                <select
                                                    className="mt-0.5 block w-full rounded-md border border-border bg-surface text-xs py-1.5 px-2 focus:border-primary focus:ring-primary shadow-sm"
                                                    value={
                                                        fileForm.data.category
                                                    }
                                                    onChange={(e) =>
                                                        fileForm.setData(
                                                            "category",
                                                            e.target.value,
                                                        )
                                                    }
                                                    required
                                                >
                                                    <option value="cr">
                                                        {lang === "ar"
                                                            ? "السجل التجاري (CR)"
                                                            : "Commercial Registration (CR)"}
                                                    </option>
                                                    <option value="vat">
                                                        {lang === "ar"
                                                            ? "الشهادة الضريبية (VAT)"
                                                            : "VAT Certificate"}
                                                    </option>
                                                    <option value="national_address">
                                                        {lang === "ar"
                                                            ? "العنوان الوطني"
                                                            : "National Address"}
                                                    </option>
                                                    <option value="license">
                                                        {lang === "ar"
                                                            ? "رخصة التخزين / البلدية"
                                                            : "Storage / Municipal License"}
                                                    </option>
                                                    <option value="other">
                                                        {lang === "ar"
                                                            ? "مستندات أخرى"
                                                            : "Other Documents"}
                                                    </option>
                                                    {customCategories.map(
                                                        (c) => (
                                                            <option
                                                                key={c.category}
                                                                value={
                                                                    c.category
                                                                }
                                                            >
                                                                {
                                                                    c.category_name
                                                                }
                                                            </option>
                                                        ),
                                                    )}
                                                    <option value="custom">
                                                        ➕{" "}
                                                        {lang === "ar"
                                                            ? "إنشاء تصنيف جديد..."
                                                            : "Create New Category..."}
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={
                                                        fileForm.errors.category
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>

                                            {fileForm.data.category ===
                                                "custom" && (
                                                <div className="md:col-span-3 bg-primary/5 p-3 rounded-xl border border-primary/20 animate-fadeIn space-y-1">
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "اسم التصنيف الجديد *"
                                                                : "New Category Name *"
                                                        }
                                                    />
                                                    <TextInput
                                                        className="mt-0.5 block w-full text-xs"
                                                        value={
                                                            fileForm.data
                                                                .custom_category
                                                        }
                                                        onChange={(e) =>
                                                            fileForm.setData(
                                                                "custom_category",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={
                                                            lang === "ar"
                                                                ? "مثال: شهادة الأيزو، عقد الإيجار..."
                                                                : "e.g. ISO Certificate, Lease Agreement..."
                                                        }
                                                        required={
                                                            fileForm.data
                                                                .category ===
                                                            "custom"
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            fileForm.errors
                                                                .custom_category
                                                        }
                                                        className="mt-1"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "اختيار الملف (PDF / صور) *"
                                                            : "Select File (PDF / Images) *"
                                                    }
                                                />
                                                <label className="mt-0.5 block w-full cursor-pointer px-3 py-1.5 bg-surface hover:bg-surface-muted border border-border rounded-md text-xs text-text truncate transition-colors shadow-sm">
                                                    <span>
                                                        {filePreviewName ||
                                                            (lang === "ar"
                                                                ? "انقر لاختيار ملف..."
                                                                : "Click to select file...")}
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept="image/*,application/pdf"
                                                        onChange={
                                                            handleFileChange
                                                        }
                                                        className="hidden"
                                                        required
                                                    />
                                                </label>
                                                <InputError
                                                    message={
                                                        fileForm.errors.file
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>

                                            <div>
                                                <PrimaryButton
                                                    disabled={
                                                        fileForm.processing ||
                                                        !fileForm.data.file ||
                                                        (fileForm.data
                                                            .category ===
                                                            "custom" &&
                                                            !fileForm.data
                                                                .custom_category)
                                                    }
                                                    className="w-full justify-center py-1.5 text-xs font-bold shadow-sm"
                                                >
                                                    <Plus className="h-3.5 w-3.5 me-1" />
                                                    <span>
                                                        {lang === "ar"
                                                            ? "رفع واعتماد الملف"
                                                            : "Upload Document"}
                                                    </span>
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    </form>

                                    {/* Existing Files Grid */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between border-b border-border pb-2">
                                            <h3 className="text-xs font-bold text-text">
                                                {lang === "ar"
                                                    ? "المستندات الرسمية المرفوعة"
                                                    : "Uploaded Official Documents"}
                                            </h3>
                                            <span className="text-[11px] text-text-muted">
                                                {companyFiles.length}{" "}
                                                {lang === "ar"
                                                    ? "ملف معتمد"
                                                    : "files"}
                                            </span>
                                        </div>

                                        {companyFiles.length === 0 ? (
                                            <div className="p-8 text-center bg-surface-muted/50 rounded-xl border border-border shadow-sm">
                                                <FolderOpen className="h-8 w-8 text-text-muted mx-auto mb-2" />
                                                <p className="text-xs font-bold text-text-muted">
                                                    {lang === "ar"
                                                        ? "لا توجد ملفات مرفوعة حالياً"
                                                        : "No documents uploaded yet"}
                                                </p>
                                                <p className="text-[11px] text-text-muted mt-0.5">
                                                    {lang === "ar"
                                                        ? "استخدم الصندوق العلوي لرفع السجل التجاري والشهادة الضريبية وباقي التراخيص"
                                                        : "Use the box above to upload CR, VAT, and other licenses"}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {companyFiles.map((file) => {
                                                    const isPdf = file.name
                                                        .toLowerCase()
                                                        .endsWith(".pdf");
                                                    const badgeClass =
                                                        categoryBadges[
                                                            file.category
                                                        ] ||
                                                        categoryBadges.other;

                                                    return (
                                                        <div
                                                            key={file.id}
                                                            className="p-3.5 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md transition-shadow flex items-start gap-3 justify-between group"
                                                        >
                                                            <div className="flex items-start gap-3 min-w-0">
                                                                <div
                                                                    className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isPdf ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"}`}
                                                                >
                                                                    {isPdf ? (
                                                                        <FileText className="h-5 w-5" />
                                                                    ) : (
                                                                        <ImageIcon className="h-5 w-5" />
                                                                    )}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p
                                                                        className="font-bold text-xs text-text truncate group-hover:text-primary transition-colors"
                                                                        title={
                                                                            file.name
                                                                        }
                                                                    >
                                                                        {
                                                                            file.name
                                                                        }
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span
                                                                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}
                                                                        >
                                                                            {
                                                                                file.category_name
                                                                            }
                                                                        </span>
                                                                        <span className="text-[10px] text-text-muted font-mono">
                                                                            {
                                                                                file.size
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[9px] text-text-muted mt-1 font-mono">
                                                                        {
                                                                            file.uploaded_at
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <a
                                                                    href={
                                                                        file.path
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="p-1.5 rounded text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                                    title={
                                                                        lang ===
                                                                        "ar"
                                                                            ? "عرض / تحميل"
                                                                            : "View / Download"
                                                                    }
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </a>
                                                                <button
                                                                    onClick={() =>
                                                                        confirmDeleteFile(
                                                                            file,
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                                    title={
                                                                        lang ===
                                                                        "ar"
                                                                            ? "حذف الملف"
                                                                            : "Delete File"
                                                                    }
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Delete File Modal */}
                <Modal
                    show={!!fileToDelete}
                    onClose={() => setFileToDelete(null)}
                    maxWidth="sm"
                >
                    <div className="p-5 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 mb-3">
                            <Trash2 className="h-5 w-5 text-danger" />
                        </div>
                        <h3 className="text-xs font-bold text-text mb-1">
                            {lang === "ar"
                                ? "تأكيد حذف المستند"
                                : "Confirm Document Deletion"}
                        </h3>
                        <p className="text-[11px] text-text-muted mb-4 truncate px-4">
                            {fileToDelete?.name}
                        </p>
                        <div className="flex justify-center gap-2">
                            <SecondaryButton
                                onClick={() => setFileToDelete(null)}
                            >
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                            </SecondaryButton>
                            <DangerButton onClick={deleteFile}>
                                {lang === "ar" ? "حذف الملف" : "Delete File"}
                            </DangerButton>
                        </div>
                    </div>
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
