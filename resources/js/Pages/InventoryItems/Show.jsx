import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Box,
    Home,
    ChevronRight,
    Tags,
    Image as ImageIcon,
    Edit,
    CheckCircle2,
    AlertCircle,
    Layers,
    Package,
    FileText,
    Users,
    Search,
    Filter,
    Printer,
    ArrowDownRight,
    ArrowUpRight,
    ExternalLink,
    X,
    ChevronDown,
    ChevronUp,
    Percent
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Tooltip from "@/Components/Tooltip";

export default function Show({ item, analytics = {} }) {
    const { lang } = useLang();
    const { flash } = usePage().props;

    const t = {
        title: lang === "ar" ? "تفاصيل الصنف المخزني" : "Inventory Item Details",
        parent: lang === "ar" ? "الأصناف المخزنية" : "Inventory Items",
        settings: lang === "ar" ? "الإعدادات" : "Settings",
        code: lang === "ar" ? "كود المنتج" : "Product Code",
        name: lang === "ar" ? "اسم الصنف" : "Item Name",
        category: lang === "ar" ? "فئة السلعة" : "Commodity Category",
        status: lang === "ar" ? "الحالة" : "Status",
        active: lang === "ar" ? "نشط" : "Active",
        inactive: lang === "ar" ? "غير نشط" : "Inactive",
        variantsTitle: lang === "ar" ? "الأشكال والأحجام المتوفرة (Variants)" : "Available Shapes / Variants",
        vName: lang === "ar" ? "اسم الشكل / حجم الكرتون" : "Carton Size / Variant",
        vCode: lang === "ar" ? "كود الشكل" : "Variant Code",
        vQuality: lang === "ar" ? "الجودة" : "Quality",
        vPrice: lang === "ar" ? "السعر الافتراضي" : "Default Price",
        vStatus: lang === "ar" ? "الحالة" : "Status",
        actions: lang === "ar" ? "الإجراءات" : "Actions",
        editVariant: lang === "ar" ? "تعديل الشكل / الحجم" : "Edit Shape / Variant",
        totalStock: lang === "ar" ? "إجمالي الرصيد المخزني" : "Total Current Stock",
        totalIn: lang === "ar" ? "إجمالي الوارد" : "Total Received",
        totalOut: lang === "ar" ? "إجمالي المنصرف" : "Total Delivered",
        totalPallets: lang === "ar" ? "عدد الطبالي المشغولة" : "Occupied Pallets",
        totalContracts: lang === "ar" ? "عدد العقود النشطة" : "Active Contracts",
        variantsCount: lang === "ar" ? "عدد الأشكال والدرجات" : "Available Variants",
        tabReport: lang === "ar" ? "تقرير المخزون وتوزيع العقود" : "Stock & Contracts Report",
        tabBasic: lang === "ar" ? "المواصفات والبيانات الأساسية" : "Specifications & Info",
        generalStatsTitle: lang === "ar" ? "أولاً: إحصائيات الأشكال والأحجام على مستوى المخازن" : "1. Warehouse-Level Variants Overview",
        contractsBreakdownTitle: lang === "ar" ? "ثانياً: تفاصيل التوزيع حسب العقود وحجم الكرتون والجودة" : "2. Detailed Breakdown by Contract, Carton Size & Quality",
        searchContractsPlaceholder: lang === "ar" ? "ابحث برقم العقد أو اسم العميل..." : "Search by contract or customer...",
        allCartons: lang === "ar" ? "كل أحجام الكرتون" : "All Carton Sizes",
        allQualities: lang === "ar" ? "كل مستويات الجودة" : "All Qualities",
        contractNo: lang === "ar" ? "رقم العقد" : "Contract #",
        customer: lang === "ar" ? "العميل" : "Customer",
        packagesCount: lang === "ar" ? "عدد العبوات" : "Packages Count",
        palletsCount: lang === "ar" ? "عدد الطبالي" : "Pallets Count",
        printReport: lang === "ar" ? "طباعة التقرير" : "Print Report",
        sharePercent: lang === "ar" ? "النسبة من المخزون" : "Share of Stock",
        available: lang === "ar" ? "متوفر بالمخزن" : "In Stock",
        outOfStock: lang === "ar" ? "رصيد صفري" : "Out of Stock",
    };

    // Active Tab state
    const [activeTab, setActiveTab] = useState("report"); // 'report' | 'specs'

    // Filter states for Contract Breakdown
    const [searchContract, setSearchContract] = useState("");
    const [selectedCartonSize, setSelectedCartonSize] = useState("");
    const [selectedQuality, setSelectedQuality] = useState("");
    const [expandedContracts, setExpandedContracts] = useState({});

    // State for Variant Edit Modal
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form setup for variant edit
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        name: "",
        quality: "",
        default_price: "",
        is_active: true,
    });

    const openEditModal = (variant) => {
        setSelectedVariant(variant);
        clearErrors();
        setData({
            name: variant.name,
            quality: variant.quality || "",
            default_price: variant.default_price,
            is_active: variant.is_active,
        });
        setIsEditModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        put(route("inventory-item-variants.update", selectedVariant.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
            }
        });
    };

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    const getCategoryPath = (cat) => {
        if (!cat) return "—";
        return displayBilingual(cat.name);
    };

    // Toggle contract accordion
    const toggleContract = (cId) => {
        setExpandedContracts((prev) => ({
            ...prev,
            [cId]: prev[cId] === undefined ? false : !prev[cId],
        }));
    };

    // Filtered Contracts Breakdown
    const filteredContracts = useMemo(() => {
        const list = analytics?.contracts || [];
        return list
            .map((c) => {
                const matchesSearch =
                    !searchContract ||
                    (c.contract_number && c.contract_number.toLowerCase().includes(searchContract.toLowerCase())) ||
                    (c.customer_name && c.customer_name.toLowerCase().includes(searchContract.toLowerCase()));

                if (!matchesSearch) return null;

                // Filter rows inside contract
                const matchingRows = c.rows.filter((r) => {
                    const matchCarton = !selectedCartonSize || r.carton_size === selectedCartonSize;
                    const matchQuality = !selectedQuality || r.quality === selectedQuality;
                    return matchCarton && matchQuality;
                });

                if (matchingRows.length === 0) return null;

                const filteredTotalPkgs = matchingRows.reduce((sum, r) => sum + r.balance, 0);
                const filteredPallets = matchingRows.reduce((sum, r) => sum + r.pallets_count, 0);

                return {
                    ...c,
                    rows: matchingRows,
                    total_packages: filteredTotalPkgs,
                    pallets_count: filteredPallets,
                };
            })
            .filter(Boolean);
    }, [analytics?.contracts, searchContract, selectedCartonSize, selectedQuality]);

    // Filtered totals
    const filteredTotals = useMemo(() => {
        const pkgs = filteredContracts.reduce((sum, c) => sum + c.total_packages, 0);
        const plts = filteredContracts.reduce((sum, c) => sum + c.pallets_count, 0);
        return {
            contractsCount: filteredContracts.length,
            packagesCount: pkgs,
            palletsCount: plts,
        };
    }, [filteredContracts]);

    const handlePrint = () => {
        window.print();
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <Link
                href={route("inventory-items.index")}
                className="hover:text-primary transition-colors"
            >
                {t.parent}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">{item.code}</span>
        </div>
    );

    const summary = analytics?.summary || {
        total_stock: 0,
        total_in: 0,
        total_out: 0,
        total_pallets: 0,
        total_contracts: 0,
        variants_count: 0,
    };

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${t.title} - ${displayBilingual(item.name)} (${item.code})`} />

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm;
                    }
                    nav, header, footer, .print\\:hidden, aside {
                        display: none !important;
                    }
                    body, #app, main {
                        background: white !important;
                        color: black !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-report-container {
                        display: block !important;
                        width: 100% !important;
                    }
                }
            ` }} />

            <div
                className="max-w-7xl mx-auto pb-12 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                {/* Session Alerts */}
                {flash?.success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 p-3 rounded-none text-xs font-bold flex items-center gap-2 print:hidden">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-none text-xs font-bold flex items-center gap-2 print:hidden">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Page Header */}
                <div className="print:hidden">
                    <PageHeader
                        icon={Box}
                        title={displayBilingual(item.name)}
                        description={
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-bold">
                                    {item.code}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-text">
                                    {getCategoryPath(item.category)}
                                </span>
                                <span>•</span>
                                <span
                                    className={`px-2 py-0.5 text-[10px] font-bold border ${
                                        item.is_active 
                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                                            : "bg-gray-500/10 text-gray-500 border-gray-200"
                                    }`}
                                >
                                    {item.is_active ? t.active : t.inactive}
                                </span>
                            </div>
                        }
                        actions={
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrint}
                                    type="button"
                                    className="bg-surface hover:bg-hover text-text border border-border px-3 py-1.5 text-xs font-bold rounded-none flex items-center gap-1.5 transition-all shadow-sm"
                                >
                                    <Printer className="h-4 w-4 text-primary" />
                                    <span>{t.printReport}</span>
                                </button>
                                <Link
                                    href={route("inventory-items.index")}
                                    className="bg-surface hover:bg-hover text-text border border-border px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1 transition-all shadow-sm"
                                >
                                    <X className="h-4 w-4" />
                                    <span>{lang === "ar" ? "إغلاق" : "Close"}</span>
                                </Link>
                            </div>
                        }
                    />
                </div>

                {/* Print Only Header */}
                <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6 text-center">
                    <h1 className="text-xl font-bold text-slate-900">{displayBilingual(item.name)}</h1>
                    <div className="flex justify-center items-center gap-4 text-xs text-slate-600 mt-2 font-mono">
                        <span>{t.code}: <strong>{item.code}</strong></span>
                        <span>•</span>
                        <span>{t.category}: <strong>{getCategoryPath(item.category)}</strong></span>
                        <span>•</span>
                        <span>تاريخ التقرير: <strong>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</strong></span>
                    </div>
                </div>

                {/* ── Top Summary KPI Cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Stock */}
                    <div className="bg-surface border border-border p-4 rounded-none shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold text-text-muted block mb-1">
                                {t.totalStock}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black font-mono text-primary">
                                    {Math.round(summary.total_stock).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-text-muted font-bold">
                                    {lang === "ar" ? "عبوة / كرتون" : "Packages"}
                                </span>
                            </div>
                            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">
                                {lang === "ar" ? "الرصيد الفعلي المتاح حالياً بالمخزن" : "Available live inventory"}
                            </span>
                        </div>
                        <div className="h-11 w-11 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                    </div>

                    {/* Occupied Pallets */}
                    <div className="bg-surface border border-border p-4 rounded-none shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold text-text-muted block mb-1">
                                {t.totalPallets}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">
                                    {summary.total_pallets.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-text-muted font-bold">
                                    {lang === "ar" ? "طبلية مخزنة" : "Pallets"}
                                </span>
                            </div>
                            <span className="text-[10px] text-text-muted font-semibold block mt-1">
                                {lang === "ar" ? "طبالي مشغولة برصيد موجب" : "Holding positive balance"}
                            </span>
                        </div>
                        <div className="h-11 w-11 rounded-none bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <Layers className="h-6 w-6 text-amber-600" />
                        </div>
                    </div>

                    {/* Active Contracts */}
                    <div className="bg-surface border border-border p-4 rounded-none shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold text-text-muted block mb-1">
                                {t.totalContracts}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">
                                    {summary.total_contracts.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-text-muted font-bold">
                                    {lang === "ar" ? "عقد مودع" : "Contracts"}
                                </span>
                            </div>
                            <span className="text-[10px] text-text-muted font-semibold block mt-1">
                                {lang === "ar" ? "عقود عملاء تحتفظ برصيد" : "Customer contracts with stock"}
                            </span>
                        </div>
                        <div className="h-11 w-11 rounded-none bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>

                    {/* Variants Count */}
                    <div className="bg-surface border border-border p-4 rounded-none shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-bold text-text-muted block mb-1">
                                {t.variantsCount}
                            </span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200">
                                    {summary.variants_count}
                                </span>
                                <span className="text-[10px] text-text-muted font-bold">
                                    {lang === "ar" ? "حجم ودرجة" : "Variants"}
                                </span>
                            </div>
                            <span className="text-[10px] text-text-muted font-semibold block mt-1">
                                {lang === "ar" ? "أنواع وأشكال معرفة للصنف" : "Registered carton variants"}
                            </span>
                        </div>
                        <div className="h-11 w-11 rounded-none bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Tags className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex items-center gap-1 border-b border-border print:hidden">
                    <button
                        type="button"
                        onClick={() => setActiveTab("report")}
                        className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === "report"
                                ? "border-primary text-primary bg-surface font-extrabold"
                                : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/40"
                        }`}
                    >
                        <FileText className="h-4 w-4" />
                        <span>{t.tabReport}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("specs")}
                        className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                            activeTab === "specs"
                                ? "border-primary text-primary bg-surface font-extrabold"
                                : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/40"
                        }`}
                    >
                        <Box className="h-4 w-4" />
                        <span>{t.tabBasic}</span>
                    </button>
                </div>

                {/* ── Tab Content: Report & Detailed Breakdown ── */}
                {(activeTab === "report" || typeof window === "undefined") && (
                    <div className="space-y-6">
                        {/* ───────────────────────────────────────────────────────────── */}
                        {/* Section 1: General Stats per Variant on Warehouse Level     */}
                        {/* ───────────────────────────────────────────────────────────── */}
                        <div className="bg-surface border border-border p-4 shadow-sm rounded-none space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-primary"></div>
                                    <h3 className="text-xs font-bold text-text">
                                        {t.generalStatsTitle}
                                    </h3>
                                </div>
                                <span className="text-[11px] font-mono font-bold text-text-muted">
                                    {lang === "ar" ? "إجمالي الأشكال:" : "Total Variants:"} {analytics?.variants?.length || 0}
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start border-collapse">
                                    <thead>
                                        <tr className="bg-surface-muted/60 text-text-muted font-bold text-[10px] uppercase border-b border-border">
                                            <th className="p-2.5 text-start w-10">#</th>
                                            <th className="p-2.5 text-start">{t.vName}</th>
                                            <th className="p-2.5 text-start">{t.vQuality}</th>
                                            <th className="p-2.5 text-start">{t.vCode}</th>
                                            <th className="p-2.5 text-center w-24">{t.totalIn}</th>
                                            <th className="p-2.5 text-center w-24">{t.totalOut}</th>
                                            <th className="p-2.5 text-center w-28 bg-primary/5 text-primary font-black">
                                                {lang === "ar" ? "الرصيد المتاح" : "Balance"}
                                            </th>
                                            <th className="p-2.5 text-start w-36">{t.sharePercent}</th>
                                            <th className="p-2.5 text-center w-20">{t.palletsCount}</th>
                                            <th className="p-2.5 text-center w-20">{lang === "ar" ? "العقود" : "Contracts"}</th>
                                            <th className="p-2.5 text-center w-20">{t.status}</th>
                                            <th className="p-2.5 text-end w-12 print:hidden">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(!analytics?.variants || analytics.variants.length === 0) ? (
                                            <tr>
                                                <td colSpan="12" className="p-6 text-center text-xs text-text-muted">
                                                    {lang === "ar" ? "لا توجد أشكال مسجلة لهذا الصنف." : "No variants registered."}
                                                </td>
                                            </tr>
                                        ) : (
                                            analytics.variants.map((v, idx) => {
                                                const hasStock = v.balance > 0;
                                                return (
                                                    <tr key={v.id} className="hover:bg-hover transition-colors">
                                                        <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                                        <td className="p-2.5 font-bold text-text">
                                                            {displayBilingual(v.name)}
                                                        </td>
                                                        <td className="p-2.5">
                                                            <span className="font-semibold text-text">
                                                                {displayBilingual(v.quality) || "—"}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 font-mono text-text-muted text-[11px]">
                                                            {v.code}
                                                        </td>
                                                        <td className="p-2.5 text-center font-mono font-semibold text-text-muted">
                                                            {Math.round(v.total_in).toLocaleString()}
                                                        </td>
                                                        <td className="p-2.5 text-center font-mono font-semibold text-text-muted">
                                                            {Math.round(v.total_out).toLocaleString()}
                                                        </td>
                                                        <td className="p-2.5 text-center font-mono font-black text-[13px] bg-primary/5 text-primary">
                                                            {Math.round(v.balance).toLocaleString()}
                                                        </td>
                                                        <td className="p-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 bg-border/60 h-2 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="bg-primary h-full transition-all duration-300"
                                                                        style={{ width: `${Math.min(v.percentage, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="font-mono text-[10px] font-bold text-text-muted w-10 text-end">
                                                                    {v.percentage}%
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                            {v.pallets_count}
                                                        </td>
                                                        <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                            {v.contracts_count}
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            <span
                                                                className={`text-[9px] px-2 py-0.5 font-bold rounded-none border ${
                                                                    hasStock
                                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                                                                        : "bg-gray-500/10 text-gray-500 border-gray-300"
                                                                }`}
                                                            >
                                                                {hasStock ? t.available : t.outOfStock}
                                                            </span>
                                                        </td>
                                                        <td className="p-2.5 text-end print:hidden">
                                                            <Tooltip text={t.editVariant}>
                                                                <button
                                                                    onClick={() => openEditModal(v)}
                                                                    type="button"
                                                                    className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-border transition-all"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tooltip>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-surface-muted/40 font-bold text-xs border-t-2 border-border">
                                            <td colSpan="4" className="p-3 text-start">
                                                {lang === "ar" ? "الإجمالي العام على مستوى كافة الأشكال والمخازن:" : "Total Warehouse Inventory:"}
                                            </td>
                                            <td className="p-3 text-center font-mono text-text-muted">
                                                {Math.round(summary.total_in).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center font-mono text-text-muted">
                                                {Math.round(summary.total_out).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center font-mono text-primary text-sm font-black bg-primary/10">
                                                {Math.round(summary.total_stock).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-start font-mono text-text-muted text-[10px]">
                                                100%
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-100 font-extrabold">
                                                {summary.total_pallets}
                                            </td>
                                            <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-100 font-extrabold">
                                                {summary.total_contracts}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* ───────────────────────────────────────────────────────────── */}
                        {/* Section 2: Detailed Breakdown by Contract, Carton, Quality  */}
                        {/* ───────────────────────────────────────────────────────────── */}
                        <div className="bg-surface border border-border p-4 shadow-sm rounded-none space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-emerald-600"></div>
                                    <div>
                                        <h3 className="text-xs font-bold text-text">
                                            {t.contractsBreakdownTitle}
                                        </h3>
                                        <p className="text-[10px] text-text-muted mt-0.5">
                                            {lang === "ar"
                                                ? "حصر دقيق لكل عقد يحتفظ برصيد من هذا الصنف مع تفصيل أحجام الكراتين ومستويات الجودة."
                                                : "List of all contracts containing this item grouped by contract, carton size, and quality."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 print:hidden">
                                    <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 border border-primary/20">
                                        {lang === "ar" ? "العقود المطابقة:" : "Matched Contracts:"} {filteredTotals.contractsCount}
                                    </span>
                                    <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 border border-emerald-500/20">
                                        {lang === "ar" ? "إجمالي العبوات:" : "Total Pkgs:"} {Math.round(filteredTotals.packagesCount).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Filters Bar */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-surface-muted/30 p-3 border border-border/80 print:hidden">
                                {/* Search by Contract or Customer */}
                                <div className="sm:col-span-2">
                                    <InputLabel value={lang === "ar" ? "بحث برقم العقد أو اسم العميل" : "Search Contract / Customer"} className="text-[10px] font-bold text-text-muted" />
                                    <div className="relative mt-1">
                                        <TextInput
                                            type="text"
                                            value={searchContract}
                                            onChange={(e) => setSearchContract(e.target.value)}
                                            placeholder={t.searchContractsPlaceholder}
                                            className="w-full text-xs rounded-none border-border ps-7 h-[32px]"
                                        />
                                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-text-muted" />
                                    </div>
                                </div>

                                {/* Filter by Carton Size */}
                                <div>
                                    <InputLabel value={lang === "ar" ? "تصفية بحجم الكرتون" : "Carton Size Filter"} className="text-[10px] font-bold text-text-muted" />
                                    <select
                                        value={selectedCartonSize}
                                        onChange={(e) => setSelectedCartonSize(e.target.value)}
                                        className="mt-1 w-full text-xs h-[32px] px-2 py-0 border border-border rounded-none bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">{t.allCartons}</option>
                                        {(analytics?.distinctCartonSizes || []).map((size, idx) => (
                                            <option key={idx} value={size}>
                                                {displayBilingual(size)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filter by Quality */}
                                <div>
                                    <InputLabel value={lang === "ar" ? "تصفية بمستوى الجودة" : "Quality Filter"} className="text-[10px] font-bold text-text-muted" />
                                    <select
                                        value={selectedQuality}
                                        onChange={(e) => setSelectedQuality(e.target.value)}
                                        className="mt-1 w-full text-xs h-[32px] px-2 py-0 border border-border rounded-none bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">{t.allQualities}</option>
                                        {(analytics?.distinctQualities || []).map((q, idx) => (
                                            <option key={idx} value={q}>
                                                {displayBilingual(q)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Active Filters Summary if filtered */}
                            {(searchContract || selectedCartonSize || selectedQuality) && (
                                <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 p-2 text-amber-900 dark:text-amber-300 print:hidden">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-3.5 w-3.5" />
                                        <span>
                                            {lang === "ar" ? "تصفية نشطة — تظهر البيانات المطابقة فقط" : "Active Filters — displaying matched rows only"}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchContract("");
                                            setSelectedCartonSize("");
                                            setSelectedQuality("");
                                        }}
                                        className="text-xs underline hover:text-danger font-bold"
                                    >
                                        {lang === "ar" ? "إلغاء التصفية" : "Clear filters"}
                                    </button>
                                </div>
                            )}

                            {/* Contracts Cards List */}
                            <div className="space-y-3">
                                {filteredContracts.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-border text-xs text-text-muted">
                                        <AlertCircle className="h-6 w-6 text-text-muted mx-auto mb-2 opacity-50" />
                                        <span>{lang === "ar" ? "لا توجد عقود مطابقة لمعايير البحث الحالية." : "No contracts match your search criteria."}</span>
                                    </div>
                                ) : (
                                    filteredContracts.map((c) => {
                                        const isExpanded = expandedContracts[c.contract_id] !== false; // Default expanded
                                        return (
                                            <div
                                                key={c.contract_id}
                                                className="border border-border rounded-none overflow-hidden bg-surface shadow-xs"
                                            >
                                                {/* Contract Header Bar */}
                                                <div
                                                    onClick={() => toggleContract(c.contract_id)}
                                                    className="p-3 bg-surface-muted/50 hover:bg-surface-muted transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <button
                                                            type="button"
                                                            className="text-text-muted hover:text-text print:hidden"
                                                        >
                                                            {isExpanded ? (
                                                                <ChevronUp className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4" />
                                                            )}
                                                        </button>

                                                        <Link
                                                            href={route("contracts.show", c.contract_id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="font-mono font-black text-xs text-primary hover:underline flex items-center gap-1"
                                                            title={lang === "ar" ? "الانتقال لصفحة العقد" : "Go to contract"}
                                                        >
                                                            <span>{c.contract_number}</span>
                                                            <ExternalLink className="h-3 w-3 print:hidden" />
                                                        </Link>

                                                        <span className="text-text font-bold text-xs">
                                                            {c.customer_name}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs">
                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            <span className="text-text-muted">{lang === "ar" ? "إجمالي العبوات:" : "Total Pkgs:"}</span>
                                                            <span className="font-mono font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/20">
                                                                {Math.round(c.total_packages).toLocaleString()}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 font-bold">
                                                            <span className="text-text-muted">{lang === "ar" ? "الطبالي:" : "Pallets:"}</span>
                                                            <span className="font-mono font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 border border-border">
                                                                {c.pallets_count}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contract Subtable of Items by Carton Size & Quality */}
                                                {isExpanded && (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-start border-collapse">
                                                            <thead>
                                                                <tr className="bg-background text-text-muted font-bold text-[10px] uppercase border-b border-border">
                                                                    <th className="p-2 text-start w-10">#</th>
                                                                    <th className="p-2 text-start">{t.vName}</th>
                                                                    <th className="p-2 text-start">{t.vQuality}</th>
                                                                    <th className="p-2 text-start">{t.vCode}</th>
                                                                    <th className="p-2 text-center w-24">{t.totalIn}</th>
                                                                    <th className="p-2 text-center w-24">{t.totalOut}</th>
                                                                    <th className="p-2 text-center w-28 bg-primary/5 text-primary font-black">
                                                                        {lang === "ar" ? "الرصيد المتاح" : "Balance"}
                                                                    </th>
                                                                    <th className="p-2 text-center w-24">{t.palletsCount}</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {c.rows.map((row, rIdx) => (
                                                                    <tr key={rIdx} className="hover:bg-hover transition-colors">
                                                                        <td className="p-2 font-mono text-text-muted">{rIdx + 1}</td>
                                                                        <td className="p-2 font-bold text-text">
                                                                            {displayBilingual(row.carton_size)}
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <span className="font-semibold text-text">
                                                                                {displayBilingual(row.quality) || "—"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="p-2 font-mono text-text-muted text-[11px]">
                                                                            {row.variant_code}
                                                                        </td>
                                                                        <td className="p-2 text-center font-mono text-text-muted">
                                                                            {Math.round(row.total_in).toLocaleString()}
                                                                        </td>
                                                                        <td className="p-2 text-center font-mono text-text-muted">
                                                                            {Math.round(row.total_out).toLocaleString()}
                                                                        </td>
                                                                        <td className="p-2 text-center font-mono font-black text-primary bg-primary/5">
                                                                            {Math.round(row.balance).toLocaleString()}
                                                                        </td>
                                                                        <td className="p-2 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                            {row.pallets_count}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab Content: Basic Specifications & Info ── */}
                {activeTab === "specs" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Primary Info Card */}
                        <div className="md:col-span-2 rounded-none border border-border bg-surface p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Box className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "البيانات الأساسية للصنف"
                                        : "Inventory Item Specifications"}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="block font-bold text-text-muted mb-1">
                                        {t.name}
                                    </span>
                                    <span className="text-text font-semibold text-[13px]">
                                        {displayBilingual(item.name)}
                                    </span>
                                </div>

                                <div>
                                    <span className="block font-bold text-text-muted mb-1">
                                        {t.category}
                                    </span>
                                    <span className="text-text font-semibold text-[13px] flex items-center gap-1.5">
                                        <Tags className="h-3.5 w-3.5 text-primary" />
                                        {getCategoryPath(item.category)}
                                    </span>
                                </div>
                            </div>

                            {/* Variants List Section */}
                            <div className="pt-4 border-t border-border space-y-3">
                                <h4 className="font-bold text-xs text-text">
                                    {t.variantsTitle}
                                </h4>
                                
                                <div className="border border-border rounded-none overflow-hidden">
                                    <table className="w-full text-xs text-start">
                                        <thead className="bg-surface-muted/50 text-text-muted text-[10px] font-bold uppercase tracking-wide border-b border-border">
                                            <tr>
                                                <th className="px-3 py-2 text-start">{t.vName}</th>
                                                <th className="px-3 py-2 text-start">{t.vCode}</th>
                                                <th className="px-3 py-2 text-start">{t.vQuality}</th>
                                                <th className="px-3 py-2 text-start">{t.vPrice}</th>
                                                <th className="px-3 py-2 text-center w-20">{t.vStatus}</th>
                                                <th className="px-3 py-2 text-end w-20">{t.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {!item.variants || item.variants.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-3 py-4 text-center text-text-muted">
                                                        {lang === "ar" ? "لا توجد أشكال مضافة لهذا المنتج" : "No variants available for this product"}
                                                    </td>
                                                </tr>
                                            ) : (
                                                item.variants.map((v) => (
                                                    <tr key={v.id} className="hover:bg-surface-muted/30 transition-colors">
                                                        <td className="px-3 py-2.5 font-bold text-text">{displayBilingual(v.name)}</td>
                                                        <td className="px-3 py-2.5 font-mono text-text-muted">{v.code}</td>
                                                        <td className="px-3 py-2.5 text-text">{displayBilingual(v.quality) || "—"}</td>
                                                        <td className="px-3 py-2.5 font-mono text-emerald-600 font-bold">
                                                            {parseFloat(v.default_price).toFixed(2)} {lang === "ar" ? "ر.س" : "SAR"}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <span
                                                                className={`text-[9px] px-1.5 py-0.2 rounded-none font-medium border ${
                                                                    v.is_active 
                                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                                                                        : "bg-gray-500/10 text-gray-500 border-gray-200"
                                                                }`}
                                                            >
                                                                {v.is_active ? t.active : t.inactive}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-end">
                                                            <Tooltip text={lang === "ar" ? "تعديل الشكل" : "Edit Variant"}>
                                                                <button
                                                                    onClick={() => openEditModal(v)}
                                                                    className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tooltip>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Image / Meta Side Card */}
                        <div className="rounded-none border border-border bg-surface p-5 shadow-sm space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "صورة المنتج"
                                        : "Product Image"}
                                </h3>
                            </div>

                            <div className="h-56 w-full bg-slate-50 border border-border flex items-center justify-center overflow-hidden rounded-none">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={displayBilingual(item.name)}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center text-text-muted space-y-2">
                                        <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
                                        <span className="text-[10px] block">{lang === "ar" ? "لا توجد صورة للمنتج" : "No product image"}</span>
                                    </div>
                                )}
                            </div>

                            <div className="divide-y divide-border border border-border rounded-none px-3 bg-slate-50/30 text-xs">
                                <div className="flex justify-between py-2.5">
                                    <span className="font-bold text-text-muted">
                                        {t.code}:
                                    </span>
                                    <span className="font-mono font-bold text-text">
                                        {item.code}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2.5">
                                    <span className="font-bold text-text-muted">
                                        {t.status}:
                                    </span>
                                    <span
                                        className={`font-bold ${item.is_active ? "text-emerald-600" : "text-gray-500"}`}
                                    >
                                        {item.is_active ? t.active : t.inactive}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Edit Variant Modal ── */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="md">
                <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-3">
                        <h3 className="text-xs font-bold text-text flex items-center gap-2">
                            <Edit className="h-4 w-4 text-primary" />
                            <span>{t.editVariant}</span>
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-text-muted hover:text-text"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div>
                        <InputLabel value={t.vName} />
                        <TextInput
                            type="text"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className="w-full text-xs mt-1"
                            required
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value={t.vQuality} />
                        <TextInput
                            type="text"
                            value={data.quality}
                            onChange={(e) => setData("quality", e.target.value)}
                            className="w-full text-xs mt-1"
                        />
                        <InputError message={errors.quality} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel value={t.vPrice} />
                        <TextInput
                            type="number"
                            step="0.01"
                            value={data.default_price}
                            onChange={(e) => setData("default_price", e.target.value)}
                            className="w-full text-xs mt-1 font-mono"
                            required
                        />
                        <InputError message={errors.default_price} className="mt-1" />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="variant_is_active"
                            checked={data.is_active}
                            onChange={(e) => setData("is_active", e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                        />
                        <label htmlFor="variant_is_active" className="text-xs font-semibold text-text">
                            {t.active}
                        </label>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                        <SecondaryButton onClick={() => setIsEditModalOpen(false)}>
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
