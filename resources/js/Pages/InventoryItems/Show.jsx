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
    Percent,
    LayoutGrid,
    Table as TableIcon
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
        vName: lang === "ar" ? "حجم الكرتون / الشكل" : "Carton Size / Variant",
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
        cardView: lang === "ar" ? "بطاقات" : "Cards",
        tableView: lang === "ar" ? "جدول" : "Table",
        displayMode: lang === "ar" ? "طريقة العرض" : "View Mode",
        generalSummary: lang === "ar" ? "ملخص الإجمالي العام" : "Grand Total Summary",
        expandAll: lang === "ar" ? "توسيع الكل" : "Expand All",
        collapseAll: lang === "ar" ? "طي الكل" : "Collapse All",
        pkgsLabel: lang === "ar" ? "عبوة" : "pkgs",
        palletsLabel: lang === "ar" ? "طبلية" : "pallets",
        contractsLabel: lang === "ar" ? "عقد" : "contracts",
    };

    // Active Tab state
    const [activeTab, setActiveTab] = useState("report"); // 'report' | 'specs'

    // Display modes: 'auto' (cards on mobile, table on desktop) | 'cards' | 'table'
    const [variantDisplayMode, setVariantDisplayMode] = useState("auto");
    const [contractsDisplayMode, setContractsDisplayMode] = useState("auto");

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

    // Toggle single contract accordion
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

    // Check if all filtered contracts are expanded
    const areAllExpanded = useMemo(() => {
        if (filteredContracts.length === 0) return false;
        return filteredContracts.every((c) => expandedContracts[c.contract_id] !== false);
    }, [filteredContracts, expandedContracts]);

    const toggleAllContracts = () => {
        const nextState = !areAllExpanded;
        const newExpanded = {};
        filteredContracts.forEach((c) => {
            newExpanded[c.contract_id] = nextState;
        });
        setExpandedContracts(newExpanded);
    };

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
                className="max-w-7xl mx-auto pb-12 main-stack-y px-2 sm:px-4"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                {/* Session Alerts */}
                {flash?.success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 p-3 rounded-lg text-xs font-bold flex items-center gap-2 print:hidden">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-lg text-xs font-bold flex items-center gap-2 print:hidden">
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
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
                                <span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-800 font-bold rounded">
                                    {item.code}
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-text">
                                    {getCategoryPath(item.category)}
                                </span>
                                <span>•</span>
                                <span
                                    className={`px-2 py-0.5 text-[10px] font-bold border rounded ${
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
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={handlePrint}
                                    type="button"
                                    className="bg-surface hover:bg-hover text-text border border-border px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
                                >
                                    <Printer className="h-4 w-4 text-primary" />
                                    <span>{t.printReport}</span>
                                </button>
                                <Link
                                    href={route("inventory-items.index")}
                                    className="bg-surface hover:bg-hover text-text border border-border px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all shadow-xs"
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
                    <div className="flex justify-center items-center gap-4 text-xs text-slate-600 mt-2 font-mono flex-wrap">
                        <span>{t.code}: <strong>{item.code}</strong></span>
                        <span>•</span>
                        <span>{t.category}: <strong>{getCategoryPath(item.category)}</strong></span>
                        <span>•</span>
                        <span>تاريخ التقرير: <strong>{new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</strong></span>
                    </div>
                </div>

                {/* ── Top Summary KPI Cards (Responsive 2x2 on Mobile, 4 Cols on Desktop) ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                    {/* Total Stock */}
                    <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl shadow-xs flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-text-muted block truncate mb-0.5">
                                {t.totalStock}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg sm:text-2xl font-black font-mono text-primary truncate">
                                    {Math.round(summary.total_stock).toLocaleString()}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-text-muted font-bold shrink-0">
                                    {t.pkgsLabel}
                                </span>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-emerald-600 font-semibold block mt-0.5 truncate">
                                {lang === "ar" ? "الرصيد الفعلي المتاح" : "Live warehouse balance"}
                            </span>
                        </div>
                        <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 ms-2">
                            <Package className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                        </div>
                    </div>

                    {/* Occupied Pallets */}
                    <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl shadow-xs flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-text-muted block truncate mb-0.5">
                                {t.totalPallets}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 truncate">
                                    {summary.total_pallets.toLocaleString()}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-text-muted font-bold shrink-0">
                                    {t.palletsLabel}
                                </span>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-text-muted font-semibold block mt-0.5 truncate">
                                {lang === "ar" ? "طبالي برصيد موجب" : "Holding positive stock"}
                            </span>
                        </div>
                        <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 ms-2">
                            <Layers className="h-4 w-4 sm:h-6 sm:w-6 text-amber-600" />
                        </div>
                    </div>

                    {/* Active Contracts */}
                    <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl shadow-xs flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-text-muted block truncate mb-0.5">
                                {t.totalContracts}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 truncate">
                                    {summary.total_contracts.toLocaleString()}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-text-muted font-bold shrink-0">
                                    {t.contractsLabel}
                                </span>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-text-muted font-semibold block mt-0.5 truncate">
                                {lang === "ar" ? "عقود تحتفظ برصيد" : "Contracts with stock"}
                            </span>
                        </div>
                        <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 ms-2">
                            <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                    </div>

                    {/* Variants Count */}
                    <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl shadow-xs flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                            <span className="text-[10px] sm:text-[11px] font-bold text-text-muted block truncate mb-0.5">
                                {t.variantsCount}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg sm:text-2xl font-black font-mono text-slate-800 dark:text-slate-200 truncate">
                                    {summary.variants_count}
                                </span>
                                <span className="text-[9px] sm:text-[10px] text-text-muted font-bold shrink-0">
                                    {lang === "ar" ? "أشكال" : "shapes"}
                                </span>
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-text-muted font-semibold block mt-0.5 truncate">
                                {lang === "ar" ? "أحجام وجودات مسجلة" : "Registered variants"}
                            </span>
                        </div>
                        <div className="h-8 w-8 sm:h-11 sm:w-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 ms-2">
                            <Tags className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* ── Navigation Tabs ── */}
                <div className="flex items-center gap-1 border-b border-border print:hidden">
                    <button
                        type="button"
                        onClick={() => setActiveTab("report")}
                        className={`px-3 sm:px-4 py-2 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all ${
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
                        className={`px-3 sm:px-4 py-2 text-xs font-bold flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all ${
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
                        <div className="bg-surface border border-border p-3.5 sm:p-5 shadow-xs rounded-xl space-y-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-primary rounded-full"></div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-bold text-text">
                                            {t.generalStatsTitle}
                                        </h3>
                                        <span className="text-[10px] sm:text-[11px] text-text-muted block sm:inline sm:ms-2">
                                            ({analytics?.variants?.length || 0} {lang === "ar" ? "شكل مسجل" : "variants registered"})
                                        </span>
                                    </div>
                                </div>

                                {/* View Mode Toggle (Cards 📱 vs Table 📊) */}
                                <div className="flex items-center gap-1.5 self-end sm:self-auto print:hidden">
                                    <span className="text-[10px] font-bold text-text-muted me-1 hidden sm:inline">
                                        {t.displayMode}:
                                    </span>
                                    <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-muted/40 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setVariantDisplayMode(variantDisplayMode === "cards" ? "auto" : "cards")}
                                            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                                variantDisplayMode === "cards"
                                                    ? "bg-surface text-primary shadow-xs font-black"
                                                    : "text-text-muted hover:text-text"
                                            }`}
                                            title={lang === "ar" ? "عرض البطاقات الذكية (للشاشات الصغيرة)" : "Cards View (Mobile optimized)"}
                                        >
                                            <LayoutGrid className="h-3.5 w-3.5" />
                                            <span>{t.cardView}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setVariantDisplayMode(variantDisplayMode === "table" ? "auto" : "table")}
                                            className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all ${
                                                variantDisplayMode === "table"
                                                    ? "bg-surface text-primary shadow-xs font-black"
                                                    : "text-text-muted hover:text-text"
                                            }`}
                                            title={lang === "ar" ? "عرض الجدول التفصيلي" : "Table View"}
                                        >
                                            <TableIcon className="h-3.5 w-3.5" />
                                            <span>{t.tableView}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 📱 1. Mobile Cards View (Adaptive: shown on mobile by default or when variantDisplayMode === 'cards') */}
                            {(variantDisplayMode === "cards" || variantDisplayMode === "auto") && (
                                <div className={`space-y-3 ${variantDisplayMode === "auto" ? "block md:hidden" : "block"}`}>
                                    {(!analytics?.variants || analytics.variants.length === 0) ? (
                                        <div className="p-6 text-center text-xs text-text-muted border border-dashed border-border rounded-xl">
                                            {lang === "ar" ? "لا توجد أشكال مسجلة لهذا الصنف." : "No variants registered."}
                                        </div>
                                    ) : (
                                        analytics.variants.map((v, idx) => {
                                            const hasStock = v.balance > 0;
                                            return (
                                                <div
                                                    key={v.id}
                                                    className="p-3.5 bg-surface border border-border rounded-xl shadow-xs space-y-3 hover:border-primary/40 transition-colors"
                                                >
                                                    {/* Card Header */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="font-extrabold text-sm text-text">
                                                                    {displayBilingual(v.name)}
                                                                </span>
                                                                {v.quality && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                                        {displayBilingual(v.quality)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted font-mono">
                                                                <span>{t.vCode}: <strong>{v.code}</strong></span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                                hasStock 
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-300" 
                                                                    : "bg-gray-500/10 text-gray-500 border-gray-300"
                                                            }`}>
                                                                {hasStock ? t.available : t.outOfStock}
                                                            </span>
                                                            <button
                                                                onClick={() => openEditModal(v)}
                                                                type="button"
                                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-border print:hidden"
                                                                aria-label={t.editVariant}
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Hero Stock Banner */}
                                                    <div className="p-2.5 rounded-lg bg-surface-muted/60 border border-border/80 flex items-center justify-between">
                                                        <div>
                                                            <span className="text-[10px] font-bold text-text-muted block">
                                                                {lang === "ar" ? "الرصيد المتاح بالمخزن" : "Available Stock"}
                                                            </span>
                                                            <div className="flex items-baseline gap-1 mt-0.5">
                                                                <span className="text-xl font-black font-mono text-primary">
                                                                    {Math.round(v.balance).toLocaleString()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-text-muted">
                                                                    {t.pkgsLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-end">
                                                            <span className="text-[10px] font-bold text-text-muted block">
                                                                {t.sharePercent}
                                                            </span>
                                                            <span className="text-sm font-black font-mono text-text">
                                                                {v.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Micro Progress Bar */}
                                                    <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full transition-all duration-300 rounded-full"
                                                            style={{ width: `${Math.min(v.percentage, 100)}%` }}
                                                        ></div>
                                                    </div>

                                                    {/* 4 Mini Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-2 text-xs pt-0.5">
                                                        <div className="p-2 rounded-lg bg-surface border border-border/60">
                                                            <span className="text-[10px] text-text-muted font-bold block">{t.totalIn}</span>
                                                            <span className="font-mono font-bold text-text mt-0.5 block">
                                                                {Math.round(v.total_in).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-surface border border-border/60">
                                                            <span className="text-[10px] text-text-muted font-bold block">{t.totalOut}</span>
                                                            <span className="font-mono font-bold text-text mt-0.5 block">
                                                                {Math.round(v.total_out).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-surface border border-border/60">
                                                            <span className="text-[10px] text-text-muted font-bold block">{t.palletsCount}</span>
                                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                                                                {v.pallets_count} {t.palletsLabel}
                                                            </span>
                                                        </div>
                                                        <div className="p-2 rounded-lg bg-surface border border-border/60">
                                                            <span className="text-[10px] text-text-muted font-bold block">{lang === "ar" ? "العقود" : "Contracts"}</span>
                                                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                                                                {v.contracts_count} {t.contractsLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}

                                    {/* Mobile Grand Total Summary Card */}
                                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-primary">
                                            <span>{t.generalSummary}</span>
                                            <span className="text-base font-black font-mono">
                                                {Math.round(summary.total_stock).toLocaleString()} {t.pkgsLabel}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-primary/10">
                                            <div>
                                                <span className="text-text-muted">{t.totalIn}:</span>{" "}
                                                <strong className="font-mono text-text">{Math.round(summary.total_in).toLocaleString()}</strong>
                                            </div>
                                            <div>
                                                <span className="text-text-muted">{t.totalOut}:</span>{" "}
                                                <strong className="font-mono text-text">{Math.round(summary.total_out).toLocaleString()}</strong>
                                            </div>
                                            <div>
                                                <span className="text-text-muted">{t.totalPallets}:</span>{" "}
                                                <strong className="font-mono text-text">{summary.total_pallets}</strong>
                                            </div>
                                            <div>
                                                <span className="text-text-muted">{t.totalContracts}:</span>{" "}
                                                <strong className="font-mono text-text">{summary.total_contracts}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 📊 2. Desktop Table View (Adaptive: shown on md+ by default or when variantDisplayMode === 'table') */}
                            {(variantDisplayMode === "table" || variantDisplayMode === "auto") && (
                                <div className={`overflow-x-auto ${variantDisplayMode === "auto" ? "hidden md:block" : "block"}`}>
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
                            )}
                        </div>

                        {/* ───────────────────────────────────────────────────────────── */}
                        {/* Section 2: Detailed Breakdown by Contract, Carton, Quality  */}
                        {/* ───────────────────────────────────────────────────────────── */}
                        <div className="bg-surface border border-border p-3.5 sm:p-5 shadow-xs rounded-xl space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm font-bold text-text">
                                            {t.contractsBreakdownTitle}
                                        </h3>
                                        <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5">
                                            {lang === "ar"
                                                ? "حصر دقيق لكل عقد يحتفظ برصيد من هذا الصنف مع تفصيل أحجام الكراتين ومستويات الجودة."
                                                : "List of all contracts containing this item grouped by contract, carton size, and quality."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap print:hidden">
                                    <button
                                        type="button"
                                        onClick={toggleAllContracts}
                                        className="text-[11px] font-bold px-2.5 py-1 rounded-md border border-border bg-surface hover:bg-hover text-text transition-colors"
                                    >
                                        {areAllExpanded ? t.collapseAll : t.expandAll}
                                    </button>
                                    <span className="text-[11px] font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md border border-primary/20">
                                        {lang === "ar" ? "العقود:" : "Contracts:"} {filteredTotals.contractsCount}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-500/20">
                                        {lang === "ar" ? "العبوات:" : "Pkgs:"} {Math.round(filteredTotals.packagesCount).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Filters Bar (Responsive Grid) */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 bg-surface-muted/30 p-3 rounded-xl border border-border/80 print:hidden">
                                {/* Search by Contract or Customer */}
                                <div className="sm:col-span-2">
                                    <InputLabel value={lang === "ar" ? "بحث برقم العقد أو اسم العميل" : "Search Contract / Customer"} className="text-[10px] font-bold text-text-muted" />
                                    <div className="relative mt-1">
                                        <TextInput
                                            type="text"
                                            value={searchContract}
                                            onChange={(e) => setSearchContract(e.target.value)}
                                            placeholder={t.searchContractsPlaceholder}
                                            className="w-full text-xs rounded-lg border-border ps-8 h-[34px]"
                                        />
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                                    </div>
                                </div>

                                {/* Filter by Carton Size */}
                                <div>
                                    <InputLabel value={lang === "ar" ? "تصفية بحجم الكرتون" : "Carton Size Filter"} className="text-[10px] font-bold text-text-muted" />
                                    <select
                                        value={selectedCartonSize}
                                        onChange={(e) => setSelectedCartonSize(e.target.value)}
                                        className="mt-1 w-full text-xs h-[34px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                                        className="mt-1 w-full text-xs h-[34px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                                <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-lg text-amber-900 dark:text-amber-300 print:hidden">
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
                                    <div className="p-8 text-center border border-dashed border-border rounded-xl text-xs text-text-muted">
                                        <AlertCircle className="h-6 w-6 text-text-muted mx-auto mb-2 opacity-50" />
                                        <span>{lang === "ar" ? "لا توجد عقود مطابقة لمعايير البحث الحالية." : "No contracts match your search criteria."}</span>
                                    </div>
                                ) : (
                                    filteredContracts.map((c) => {
                                        const isExpanded = expandedContracts[c.contract_id] !== false; // Default expanded
                                        return (
                                            <div
                                                key={c.contract_id}
                                                className="border border-border rounded-xl overflow-hidden bg-surface shadow-xs"
                                            >
                                                {/* Contract Header Bar */}
                                                <div
                                                    onClick={() => toggleContract(c.contract_id)}
                                                    className="p-3 sm:p-3.5 bg-surface-muted/40 hover:bg-surface-muted/70 transition-colors cursor-pointer border-b border-border select-none"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                            <button
                                                                type="button"
                                                                className="text-text-muted hover:text-text print:hidden shrink-0"
                                                                aria-label="Toggle accordion"
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
                                                                className="font-mono font-black text-xs text-primary hover:underline flex items-center gap-1 shrink-0"
                                                                title={lang === "ar" ? "الانتقال لصفحة العقد" : "Go to contract"}
                                                            >
                                                                <span>{c.contract_number}</span>
                                                                <ExternalLink className="h-3 w-3 print:hidden" />
                                                            </Link>

                                                            <span className="text-text font-bold text-xs truncate">
                                                                {c.customer_name}
                                                            </span>
                                                        </div>

                                                        {/* Badges for Total Packages & Pallets */}
                                                        <div className="flex items-center gap-2.5 text-xs pt-1 sm:pt-0 self-end sm:self-auto">
                                                            <div className="flex items-center gap-1 font-bold">
                                                                <span className="text-text-muted text-[11px]">{lang === "ar" ? "العبوات:" : "Pkgs:"}</span>
                                                                <span className="font-mono font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                                                                    {Math.round(c.total_packages).toLocaleString()}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center gap-1 font-bold">
                                                                <span className="text-text-muted text-[11px]">{lang === "ar" ? "الطبالي:" : "Plts:"}</span>
                                                                <span className="font-mono font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-border text-[11px]">
                                                                    {c.pallets_count}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contract Subtable / Sub-cards by Carton Size & Quality */}
                                                {isExpanded && (
                                                    <div>
                                                        {/* 📊 Desktop Table (hidden on mobile) */}
                                                        <div className="hidden md:block overflow-x-auto">
                                                            <table className="w-full text-xs text-start border-collapse">
                                                                <thead>
                                                                    <tr className="bg-background text-text-muted font-bold text-[10px] uppercase border-b border-border">
                                                                        <th className="p-2.5 text-start w-10">#</th>
                                                                        <th className="p-2.5 text-start">{t.vName}</th>
                                                                        <th className="p-2.5 text-start">{t.vQuality}</th>
                                                                        <th className="p-2.5 text-start">{t.vCode}</th>
                                                                        <th className="p-2.5 text-center w-24">{t.totalIn}</th>
                                                                        <th className="p-2.5 text-center w-24">{t.totalOut}</th>
                                                                        <th className="p-2.5 text-center w-28 bg-primary/5 text-primary font-black">
                                                                            {lang === "ar" ? "الرصيد المتاح" : "Balance"}
                                                                        </th>
                                                                        <th className="p-2.5 text-center w-24">{t.palletsCount}</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border">
                                                                    {c.rows.map((row, rIdx) => (
                                                                        <tr key={rIdx} className="hover:bg-hover transition-colors">
                                                                            <td className="p-2.5 font-mono text-text-muted">{rIdx + 1}</td>
                                                                            <td className="p-2.5 font-bold text-text">
                                                                                {displayBilingual(row.carton_size)}
                                                                            </td>
                                                                            <td className="p-2.5">
                                                                                <span className="font-semibold text-text">
                                                                                    {displayBilingual(row.quality) || "—"}
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-2.5 font-mono text-text-muted text-[11px]">
                                                                                {row.variant_code}
                                                                            </td>
                                                                            <td className="p-2.5 text-center font-mono text-text-muted">
                                                                                {Math.round(row.total_in).toLocaleString()}
                                                                            </td>
                                                                            <td className="p-2.5 text-center font-mono text-text-muted">
                                                                                {Math.round(row.total_out).toLocaleString()}
                                                                            </td>
                                                                            <td className="p-2.5 text-center font-mono font-black text-primary bg-primary/5">
                                                                                {Math.round(row.balance).toLocaleString()}
                                                                            </td>
                                                                            <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                                                                                {row.pallets_count}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {/* 📱 Mobile Feed List (shown on mobile) */}
                                                        <div className="block md:hidden divide-y divide-border/60 bg-surface">
                                                            {c.rows.map((row, rIdx) => (
                                                                <div key={rIdx} className="p-3 space-y-2 hover:bg-surface-muted/30 transition-colors">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                                            <span className="font-extrabold text-xs text-text">
                                                                                {displayBilingual(row.carton_size)}
                                                                            </span>
                                                                            {row.quality && (
                                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                                                    {displayBilingual(row.quality)}
                                                                                </span>
                                                                            )}
                                                                            <span className="text-[10px] font-mono text-text-muted">
                                                                                ({row.variant_code})
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-end shrink-0">
                                                                            <span className="font-mono font-black text-sm text-primary">
                                                                                {Math.round(row.balance).toLocaleString()}
                                                                            </span>
                                                                            <span className="text-[10px] text-text-muted ms-1 font-bold">
                                                                                {t.pkgsLabel}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-[11px] text-text-muted bg-surface-muted/50 px-2.5 py-1.5 rounded-lg border border-border/60 font-mono">
                                                                        <span>{lang === "ar" ? "وارد:" : "In:"} <strong className="text-text">{Math.round(row.total_in).toLocaleString()}</strong></span>
                                                                        <span>•</span>
                                                                        <span>{lang === "ar" ? "صادر:" : "Out:"} <strong className="text-text">{Math.round(row.total_out).toLocaleString()}</strong></span>
                                                                        <span>•</span>
                                                                        <span>{lang === "ar" ? "طبالي:" : "Plts:"} <strong className="text-text">{row.pallets_count}</strong></span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        {/* Primary Info Card */}
                        <div className="md:col-span-2 rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Box className="h-4 w-4 text-primary" />
                                <h3 className="text-xs sm:text-sm font-bold text-text">
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
                                        {t.code}
                                    </span>
                                    <span className="font-mono bg-slate-100 border border-slate-200 px-2.5 py-1 text-slate-800 font-bold text-xs inline-block rounded">
                                        {item.code}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-bold text-text-muted mb-1">
                                        {t.category}
                                    </span>
                                    <span className="text-text font-semibold">
                                        {getCategoryPath(item.category)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-bold text-text-muted mb-1">
                                        {t.status}
                                    </span>
                                    <span
                                        className={`px-2.5 py-1 text-[11px] font-bold border inline-block rounded ${
                                            item.is_active 
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                                                : "bg-gray-500/10 text-gray-500 border-gray-200"
                                        }`}
                                    >
                                        {item.is_active ? t.active : t.inactive}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Side Media Card */}
                        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <ImageIcon className="h-4 w-4 text-primary" />
                                <h3 className="text-xs sm:text-sm font-bold text-text">
                                    {lang === "ar" ? "صورة الصنف" : "Item Image"}
                                </h3>
                            </div>

                            <div className="flex justify-center items-center h-48 bg-surface-muted/30 border border-dashed border-border rounded-xl">
                                {item.image_url ? (
                                    <img
                                        src={item.image_url}
                                        alt={displayBilingual(item.name)}
                                        className="h-full w-full object-contain p-2 rounded-xl"
                                    />
                                ) : (
                                    <div className="text-center text-text-muted">
                                        <Box className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <span className="text-[11px]">
                                            {lang === "ar" ? "لا توجد صورة متوفرة" : "No image available"}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Edit Variant Modal ── */}
            <Modal
                show={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                maxWidth="md"
            >
                <form onSubmit={handleFormSubmit} className="p-5 font-sans" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4 text-primary" />
                            <h2 className="text-sm font-bold text-text">
                                {t.editVariant}
                            </h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
                            className="text-text-muted hover:text-text p-1"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-4 space-y-3.5 text-xs">
                        <div>
                            <InputLabel htmlFor="v_name" value={t.vName} className="font-bold" />
                            <TextInput
                                id="v_name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                className="mt-1 w-full text-xs rounded-lg"
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="v_quality" value={t.vQuality} className="font-bold" />
                            <TextInput
                                id="v_quality"
                                type="text"
                                value={data.quality}
                                onChange={(e) => setData("quality", e.target.value)}
                                placeholder="مثال: رقم 1 | ملكي | ناشف"
                                className="mt-1 w-full text-xs rounded-lg"
                            />
                            <InputError message={errors.quality} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="v_price" value={t.vPrice} className="font-bold" />
                            <TextInput
                                id="v_price"
                                type="number"
                                step="0.01"
                                value={data.default_price}
                                onChange={(e) => setData("default_price", e.target.value)}
                                className="mt-1 w-full text-xs rounded-lg font-mono"
                            />
                            <InputError message={errors.default_price} className="mt-1" />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="v_is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <InputLabel htmlFor="v_is_active" value={t.active} className="font-bold cursor-pointer" />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-border">
                        <SecondaryButton
                            onClick={() => setIsEditModalOpen(false)}
                            disabled={processing}
                            className="text-xs"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton
                            type="submit"
                            disabled={processing}
                            className="text-xs"
                        >
                            {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
