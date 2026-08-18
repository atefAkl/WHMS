import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    BarChart3,
    Printer,
    Search,
    Filter,
    FileText,
    Boxes,
    PackageCheck,
    PackageX,
    TrendingUp,
    Building2,
    RotateCcw,
    CheckCircle2,
    XCircle,
} from "lucide-react";

export default function Index({ reportData = [], summary = {}, customers = [], companySettings = {}, filters = {} }) {
    const { lang } = useLang();

    const [statusFilter, setStatusFilter] = useState(filters.status || "");
    const [customerIdFilter, setCustomerIdFilter] = useState(filters.customer_id || "");
    const [searchTerm, setSearchTerm] = useState(filters.search || "");

    const handleFilter = () => {
        router.get(
            route("sales.contract-pallet-stats.index"),
            {
                status: statusFilter,
                customer_id: customerIdFilter,
                search: searchTerm,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleReset = () => {
        setStatusFilter("");
        setCustomerIdFilter("");
        setSearchTerm("");
        router.get(route("sales.contract-pallet-stats.index"), {}, { preserveState: true, replace: true });
    };

    const handlePrint = () => {
        window.print();
    };

    // Helper for status badge colors
    const getUtilizationBadge = (rate) => {
        if (rate >= 95) {
            return {
                bg: "bg-rose-500/10 text-rose-700 border-rose-500/20",
                dot: "bg-rose-500",
                label: lang === "ar" ? "ممتلئ شبه كاملاً" : "Full / Critical",
            };
        } else if (rate >= 80) {
            return {
                bg: "bg-amber-500/10 text-amber-700 border-amber-500/20",
                dot: "bg-amber-500",
                label: lang === "ar" ? "إشغال مرتفع" : "High Capacity",
            };
        } else if (rate > 0) {
            return {
                bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
                dot: "bg-emerald-500",
                label: lang === "ar" ? "استغلال متوازن" : "Balanced",
            };
        }
        return {
            bg: "bg-slate-500/10 text-slate-700 border-slate-500/20",
            dot: "bg-slate-400",
            label: lang === "ar" ? "شبه فارغ" : "Empty",
        };
    };

    // Company info defaults
    const compName = companySettings.company_name || "مخازن أيمن محمد عبد الله الغماس للتخزين";
    const compSlogan = companySettings.company_slogan || "تخزين - تبريد - تجميد - تعبئة وتغليف - بيع - تصدير";
    const compCr = companySettings.company_cr || "1131305092";
    const compPhone = companySettings.company_phone || "0568562615";
    const compLogo = companySettings.company_logo || null;

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-xs text-text-muted">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span>{lang === "ar" ? "المبيعات" : "Sales"}</span>
            <span>/</span>
            <span className="text-primary font-bold">{lang === "ar" ? "إحصائيات العقود والطبالي" : "Contract & Pallet Stats"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "تقرير إحصائيات العقود والطبالي" : "Contract & Pallet Statistics Report"} />

            <div className="pb-12 space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* ═══ SCREEN TOP BAR (Hidden on Print) ═════════════════════════════ */}
                <div className="print:hidden bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 text-start">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                            <BarChart3 className="h-4 w-4" />
                            <span>{lang === "ar" ? "تقارير المبيعات والمخزون" : "Sales & Inventory Reports"}</span>
                        </div>
                        <h1 className="text-xl font-black text-text">
                            {lang === "ar" ? "تقرير إحصائيات العقود ورصيد الطبالي" : "Contract & Pallet Capacity Statistics"}
                        </h1>
                        <p className="text-xs text-text-muted">
                            {lang === "ar"
                                ? "عرض تحليلي مفصل لرصيد المحجوزات، الطبالي المستخدمة بالمخزن، والرصيد المتبقي المتاح لكل عقد"
                                : "Detailed analytical report of booked capacity, occupied pallets, and remaining balances per contract"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                        >
                            <Printer className="h-4 w-4" />
                            <span>{lang === "ar" ? "طباعة التقرير (A4 Landscape)" : "Print Report (A4 Landscape)"}</span>
                        </button>
                    </div>
                </div>

                {/* ═══ SUMMARY STATS CARDS (Hidden on Print) ═══════════════════════ */}
                <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                            <Boxes className="h-6 w-6" />
                        </div>
                        <div className="text-start">
                            <p className="text-[11px] font-bold text-text-muted">
                                {lang === "ar" ? "إجمالي الطبالي المحجوزة" : "Total Booked Pallets"}
                            </p>
                            <h3 className="text-lg font-black text-text font-mono mt-0.5">
                                {(summary.total_booked || 0).toLocaleString()}
                            </h3>
                            <p className="text-[10px] text-text-muted">
                                {lang === "ar" ? "المحجوز ببنود عقود الفترات" : "Contracted Capacity"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                            <PackageCheck className="h-6 w-6" />
                        </div>
                        <div className="text-start">
                            <p className="text-[11px] font-bold text-text-muted">
                                {lang === "ar" ? "الطبالي الممتلئة (المستخدمة)" : "Occupied Pallets"}
                            </p>
                            <h3 className="text-lg font-black text-amber-700 font-mono mt-0.5">
                                {(summary.total_used || 0).toLocaleString()}
                            </h3>
                            <p className="text-[10px] text-amber-600 font-bold">
                                {lang === "ar" ? "المشغولة بالمخزن حالياً" : "Currently Stored"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <PackageX className="h-6 w-6" />
                        </div>
                        <div className="text-start">
                            <p className="text-[11px] font-bold text-text-muted">
                                {lang === "ar" ? "رصيد الطبالي المتبقي" : "Remaining Pallet Balance"}
                            </p>
                            <h3 className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                                {(summary.total_remaining || 0).toLocaleString()}
                            </h3>
                            <p className="text-[10px] text-emerald-600 font-bold">
                                {lang === "ar" ? "المتاح للإدخال الجديد" : "Available Capacity"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="text-start">
                            <p className="text-[11px] font-bold text-text-muted">
                                {lang === "ar" ? "معدل الإشغال العام" : "Overall Occupancy Rate"}
                            </p>
                            <h3 className="text-lg font-black text-primary font-mono mt-0.5">
                                {summary.utilization_rate || 0}%
                            </h3>
                            <p className="text-[10px] text-text-muted">
                                {lang === "ar" ? "نسبة استغلال السعة الإجمالية" : "Capacity Utilization %"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ FILTERS BAR (Hidden on Print) ═══════════════════════════════ */}
                <div className="print:hidden bg-surface border border-border rounded-xl p-4 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-text border-b border-border pb-2">
                        <Filter className="h-4 w-4 text-primary" />
                        <span>{lang === "ar" ? "تصفية نتائج التقرير" : "Filter Report Results"}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {/* Status Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted mb-1 text-start">
                                {lang === "ar" ? "حالة العقد" : "Contract Status"}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full text-xs h-9 rounded-lg border-border bg-surface text-text font-semibold focus:ring-primary focus:border-primary"
                            >
                                <option value="">{lang === "ar" ? "النشطة والمنتهية (افتراضي)" : "Active & Ended (Default)"}</option>
                                <option value="active">{lang === "ar" ? "العقود النشطة فقط" : "Active Contracts Only"}</option>
                                <option value="ended">{lang === "ar" ? "العقود المنتهية فقط" : "Ended Contracts Only"}</option>
                                <option value="draft">{lang === "ar" ? "مسودات العقود" : "Draft Contracts"}</option>
                            </select>
                        </div>

                        {/* Customer Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted mb-1 text-start">
                                {lang === "ar" ? "تصفية بالعميل" : "Client"}
                            </label>
                            <select
                                value={customerIdFilter}
                                onChange={(e) => setCustomerIdFilter(e.target.value)}
                                className="w-full text-xs h-9 rounded-lg border-border bg-surface text-text font-semibold focus:ring-primary focus:border-primary"
                            >
                                <option value="">{lang === "ar" ? "جميع العملاء" : "All Customers"}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input */}
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted mb-1 text-start">
                                {lang === "ar" ? "البحث" : "Search"}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={lang === "ar" ? "رقم العقد أو اسم العميل..." : "Contract # or Client Name..."}
                                    className="w-full text-xs h-9 ps-8 rounded-lg border-border bg-surface text-text focus:ring-primary focus:border-primary"
                                />
                                <Search className="h-4 w-4 text-text-muted absolute start-2.5 top-2.5" />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={handleFilter}
                                className="flex-1 h-9 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "تطبيق الفلتر" : "Apply Filter"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="h-9 px-3 border border-border bg-surface hover:bg-surface-muted text-text-muted rounded-lg text-xs font-bold transition-colors"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ PRINTABLE DOCUMENT CONTAINER (A4 Landscape) ═════════════════ */}
                <div className="report-print-container bg-surface border border-border rounded-2xl p-6 shadow-sm print:shadow-none print:border-none print:p-0">
                    
                    {/* PRINT HEADER - Visible on Print */}
                    <div className="hidden print:flex justify-between items-start border-b border-gray-400 pb-3 mb-4">
                        <div className="flex items-center gap-3">
                            {compLogo ? (
                                <img src={compLogo} alt="Logo" className="w-12 h-12 object-contain" />
                            ) : (
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300">
                                    <Building2 className="h-5 w-5 text-gray-800" />
                                </div>
                            )}
                            <div className="space-y-0.5 text-start">
                                <h2 className="font-black text-xs text-black leading-snug">
                                    {compName}
                                </h2>
                                <p className="text-[10px] text-gray-600 font-medium">
                                    {compSlogan}
                                </p>
                                <p className="text-[9px] text-gray-700 font-mono">
                                    CR: <span className="font-bold">{compCr}</span> &nbsp;|&nbsp; TEL: <span className="font-bold">{compPhone}</span>
                                </p>
                            </div>
                        </div>

                        <div className="text-end space-y-0.5">
                            <h1 className="text-sm font-black uppercase tracking-wide text-black">
                                {lang === "ar" ? "تقرير إحصائيات العقود ورصيد الطبالي" : "Contract & Pallet Statistics Report"}
                            </h1>
                            <div className="text-[10px] font-bold text-gray-700">
                                {lang === "ar" ? "تاريخ الإصدار:" : "Date:"} <span className="font-mono">{new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</span>
                            </div>
                        </div>
                    </div>

                    {/* PRINT SUMMARY STATS BAR */}
                    <div className="hidden print:grid grid-cols-4 gap-4 p-3 bg-gray-50 border border-gray-300 rounded-lg mb-4 text-center text-xs">
                        <div>
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "إجمالي المحجوزات:" : "Total Booked:"}</span>
                            <span className="font-mono font-black text-sm text-black">{(summary.total_booked || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "إجمالي المستخدم (المقتبس):" : "Total Occupied:"}</span>
                            <span className="font-mono font-black text-sm text-black">{(summary.total_used || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "إجمالي المتبقي المتاح:" : "Total Remaining:"}</span>
                            <span className="font-mono font-black text-sm text-black">{(summary.total_remaining || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "معدل الاستغلال العام:" : "Occupancy Rate:"}</span>
                            <span className="font-mono font-black text-sm text-black">{summary.utilization_rate || 0}%</span>
                        </div>
                    </div>

                    {/* ═══ DETAILED REPORT TABLE ═════════════════════════════════════ */}
                    {reportData.length === 0 ? (
                        <div className="py-16 text-center text-text-muted space-y-2">
                            <Boxes className="h-10 w-10 mx-auto text-text-muted/40" />
                            <p className="font-bold text-sm">
                                {lang === "ar" ? "لا توجد عقود مطابقة لشروط الفلتر التصفية" : "No contracts found matching filter criteria"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-start border-collapse border border-border print:border-gray-400">
                                <thead>
                                    <tr className="bg-surface-muted/60 print:bg-gray-100 text-text print:text-black font-extrabold border-b border-border print:border-gray-400">
                                        <th className="p-3 text-start w-64 border-e border-border print:border-gray-300">
                                            {lang === "ar" ? "العقد والعميل" : "Contract & Client"}
                                        </th>
                                        <th className="p-3 text-start border-e border-border print:border-gray-300">
                                            {lang === "ar" ? "المحجوزات (أصناف الفترات)" : "Booked Pallets"}
                                        </th>
                                        <th className="p-3 text-start border-e border-border print:border-gray-300">
                                            {lang === "ar" ? "المستخدم (المخزون الفعلي)" : "Occupied Pallets"}
                                        </th>
                                        <th className="p-3 text-start border-e border-border print:border-gray-300">
                                            {lang === "ar" ? "الرصيد الباقي المتاح" : "Remaining Pallets"}
                                        </th>
                                        <th className="p-3 text-center w-36">
                                            {lang === "ar" ? "نسبة الاستغلال" : "Utilization Rate"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border print:divide-gray-300">
                                    {reportData.map((row) => {
                                        const badge = getUtilizationBadge(row.utilization_rate);
                                        return (
                                            <tr key={row.id} className="hover:bg-surface-muted/30 print:hover:bg-transparent text-start">
                                                
                                                {/* 1. العقد والعميل */}
                                                <td className="p-3 align-top border-e border-border print:border-gray-300">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-text print:text-black text-xs">
                                                                {row.customer_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 font-mono text-[11px]">
                                                            <span className="font-bold text-primary print:text-black">
                                                                {row.contract_number}
                                                            </span>
                                                            <span
                                                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                                                    row.status === "active"
                                                                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                                                        : "bg-slate-500/10 text-slate-700 border border-slate-500/20"
                                                                }`}
                                                            >
                                                                {row.status === "active"
                                                                    ? (lang === "ar" ? "نشط" : "Active")
                                                                    : (lang === "ar" ? "منتهي" : "Ended")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. المحجوزات مقسمة حسب الحجم والنوع */}
                                                <td className="p-3 align-top border-e border-border print:border-gray-300">
                                                    <div className="space-y-1.5">
                                                        {row.items_breakdown.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-[11px] gap-3">
                                                                <span className="text-text-muted print:text-gray-700 font-medium">
                                                                    {item.label}:
                                                                </span>
                                                                <span className="font-mono font-bold text-text print:text-black">
                                                                    {item.booked.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-border/60 print:border-gray-300 pt-1 flex justify-between items-center font-extrabold text-xs">
                                                            <span>{lang === "ar" ? "الإجمالي:" : "Total:"}</span>
                                                            <span className="font-mono text-blue-700 print:text-black">
                                                                {row.total_booked.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 3. المستخدم مقسم حسب الحجم والنوع */}
                                                <td className="p-3 align-top border-e border-border print:border-gray-300">
                                                    <div className="space-y-1.5">
                                                        {row.items_breakdown.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-[11px] gap-3">
                                                                <span className="text-text-muted print:text-gray-700 font-medium">
                                                                    {item.label}:
                                                                </span>
                                                                <span className="font-mono font-bold text-amber-700 print:text-black">
                                                                    {item.used.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-border/60 print:border-gray-300 pt-1 flex justify-between items-center font-extrabold text-xs">
                                                            <span>{lang === "ar" ? "الإجمالي:" : "Total:"}</span>
                                                            <span className="font-mono text-amber-700 print:text-black">
                                                                {row.total_used.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 4. الرصيد الباقي مقسم حسب الحجم والنوع */}
                                                <td className="p-3 align-top border-e border-border print:border-gray-300">
                                                    <div className="space-y-1.5">
                                                        {row.items_breakdown.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-center text-[11px] gap-3">
                                                                <span className="text-text-muted print:text-gray-700 font-medium">
                                                                    {item.label}:
                                                                </span>
                                                                <span className="font-mono font-bold text-emerald-700 print:text-black">
                                                                    {item.remaining.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-border/60 print:border-gray-300 pt-1 flex justify-between items-center font-extrabold text-xs">
                                                            <span>{lang === "ar" ? "الإجمالي:" : "Total:"}</span>
                                                            <span className="font-mono text-emerald-700 print:text-black">
                                                                {row.total_remaining.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 5. نسبة الاستغلال مع التلوين */}
                                                <td className="p-3 align-middle text-center">
                                                    <div className="inline-flex flex-col items-center gap-1">
                                                        <span className="font-mono font-black text-sm text-text print:text-black">
                                                            {row.utilization_rate}%
                                                        </span>
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.bg}`}
                                                        >
                                                            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`}></span>
                                                            <span>{badge.label}</span>
                                                        </span>
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })}

                                    {/* Overall Total Row */}
                                    <tr className="bg-surface-muted/90 print:bg-gray-200 font-black text-text print:text-black border-t-2 border-border print:border-black">
                                        <td className="p-3 text-start border-e border-border print:border-gray-400 text-xs">
                                            {lang === "ar" ? "المجموع الكلي لكافة العقود" : "Grand Total All Contracts"}
                                        </td>
                                        <td className="p-3 text-start font-mono text-sm text-blue-700 print:text-black border-e border-border print:border-gray-400">
                                            {(summary.total_booked || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-start font-mono text-sm text-amber-700 print:text-black border-e border-border print:border-gray-400">
                                            {(summary.total_used || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-start font-mono text-sm text-emerald-700 print:text-black border-e border-border print:border-gray-400">
                                            {(summary.total_remaining || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-center font-mono text-sm text-primary print:text-black">
                                            {summary.utilization_rate || 0}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* PRINT FOOTER SIGNATURES */}
                    <div className="hidden print:grid grid-cols-3 gap-8 text-center text-xs mt-12 pt-4 border-t border-gray-300">
                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                {lang === "ar" ? "مدير المبيعات والعقود" : "Sales Manager"}
                            </p>
                            <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                {lang === "ar" ? "أمين المستودع" : "Warehouse Keeper"}
                            </p>
                            <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                        </div>
                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                {lang === "ar" ? "إدارة المستودعات والتخزين" : "Warehouse Administration"}
                            </p>
                            <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                        </div>
                    </div>

                </div>

            </div>

            {/* Print CSS Rules - Strictly A4 Landscape */}
            <style>{`
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 0.8cm;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .report-print-container {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
