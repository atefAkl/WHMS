import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Printer,
    Search,
    Filter,
    Boxes,
    PackageCheck,
    PackageX,
    TrendingUp,
    Building2,
    RotateCcw,
} from "lucide-react";

export default function Index({
    reportData = [],
    allSizes = ["صغيرة", "كبيرة"],
    summary = {},
    customers = [],
    companySettings = {},
    filters = {},
}) {
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

    // Company info defaults
    const compName = companySettings.company_name || "مخازن أيمن محمد عبد الله الغماس للتخزين";
    const compSlogan = companySettings.company_slogan || "تخزين - تبريد - تجميد - تعبئة وتغليف - بيع - تصدير";
    const compCr = companySettings.company_cr || "1131305092";
    const compPhone = companySettings.company_phone || "0568562615";
    const compLogo = companySettings.company_logo || null;

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-xs text-text-muted">
            <Boxes className="h-3.5 w-3.5 text-primary" />
            <span>{lang === "ar" ? "المبيعات" : "Sales"}</span>
            <span>/</span>
            <span className="text-primary font-bold">{lang === "ar" ? "إحصائيات الطبالي" : "Pallet Capacity Stats"}</span>
        </div>
    );

    // Color Tier Determination based on Consumption Rate % (نسبة الاستهلاك)
    const getConsumptionColor = (used, booked) => {
        const rate = booked > 0 ? (used / booked) * 100 : (used > 0 ? 100 : 0);

        if (rate > 100) {
            // أحمر: تجاوز 100%
            return "bg-rose-500/20 text-rose-950 dark:text-rose-200 font-extrabold print:bg-rose-200 print:text-rose-950";
        } else if (rate >= 67) {
            // برتقالي: بين 67% و 100%
            return "bg-amber-500/20 text-amber-950 dark:text-amber-200 font-extrabold print:bg-amber-200 print:text-amber-950";
        } else if (rate >= 10) {
            // أخضر: بين 10% وأقل من 67%
            return "bg-emerald-500/20 text-emerald-950 dark:text-emerald-200 font-extrabold print:bg-emerald-200 print:text-emerald-950";
        } else {
            // أزرق: أقل من 10%
            return "bg-blue-500/20 text-blue-950 dark:text-blue-200 font-extrabold print:bg-blue-200 print:text-blue-950";
        }
    };

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "إحصائيات الطبالي" : "Pallet Capacity Statistics"} />

            <div className="pb-12 space-y-6 font-sans text-xs" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* ═══ TOP TITLE CARD WITH PRINT BUTTON (Match Image Header) ═════════ */}
                <div className="print:hidden bg-surface border border-border rounded-xl p-5 shadow-xs flex items-center justify-between gap-4">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl font-black text-text flex items-center gap-2">
                            {lang === "ar" ? "إحصائيات الطبالي" : "Pallet Capacity Statistics"}
                        </h1>
                        <p className="text-xs text-text-muted">
                            {lang === "ar"
                                ? "عرض تحليلي مفصل لرصيد المحجوزات، الطبالي، والرصيد المتبقي"
                                : "Detailed analytical breakdown of booked, occupied, and remaining pallet balances"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePrint}
                        title={lang === "ar" ? "طباعة التقرير" : "Print Report"}
                        className="p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center shrink-0"
                    >
                        <Printer className="h-5 w-5" />
                    </button>
                </div>

                {/* ═══ TOP 4 SUMMARY STATS CARDS (Match Image Top Row) ═══════════════ */}
                <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Booked */}
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs text-center space-y-1">
                        <p className="text-[11px] font-bold text-text-muted">
                            {lang === "ar" ? "إجمالي الطبالي المحجوزة" : "Total Booked Pallets"}
                        </p>
                        <h3 className="text-2xl font-black text-text font-mono">
                            {(summary.total_booked || 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-text-muted">
                            {lang === "ar" ? "المحجوز بنود عقود الفترات" : "Contracted Capacity"}
                        </p>
                    </div>

                    {/* Card 2: Occupied */}
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs text-center space-y-1">
                        <p className="text-[11px] font-bold text-text-muted">
                            {lang === "ar" ? "الطبالي الممتلئة (المستخدمة)" : "Occupied Pallets"}
                        </p>
                        <h3 className="text-2xl font-black text-amber-700 font-mono">
                            {(summary.total_used || 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-amber-600 font-bold">
                            {lang === "ar" ? "المشغولة بالمخزن حالياً" : "Currently Stored"}
                        </p>
                    </div>

                    {/* Card 3: Remaining */}
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs text-center space-y-1">
                        <p className="text-[11px] font-bold text-text-muted">
                            {lang === "ar" ? "رصيد الطبالي المتبقي" : "Remaining Pallets"}
                        </p>
                        <h3 className="text-2xl font-black text-emerald-700 font-mono">
                            {(summary.total_remaining || 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-emerald-600 font-bold">
                            {lang === "ar" ? "المتاح للإدخال الجديد" : "Available Capacity"}
                        </p>
                    </div>

                    {/* Card 4: Rate */}
                    <div className="bg-surface border border-border rounded-xl p-4 shadow-2xs text-center space-y-1">
                        <p className="text-[11px] font-bold text-text-muted">
                            {lang === "ar" ? "معدل الإشغال العام" : "Occupancy Rate"}
                        </p>
                        <h3 className="text-2xl font-black text-primary font-mono">
                            %{summary.utilization_rate || 0}
                        </h3>
                        <p className="text-[10px] text-text-muted">
                            {lang === "ar" ? "وفقاً لفترات العقود" : "According to contract periods"}
                        </p>
                    </div>
                </div>

                {/* ═══ COLOR GUIDE LEGEND BAR ═══════════════════════════════════════ */}
                <div className="print:hidden bg-surface border border-border rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="font-extrabold text-text text-[11px]">
                        {lang === "ar" ? "دليل دلالة الألوان لنسبة استهلاك الباقة:" : "Consumption Rate Color Guide:"}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-900 border border-blue-500/30">
                            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                            <span>{lang === "ar" ? "استهلاك أقل من 10% (أزرق)" : "< 10% (Blue)"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-900 border border-emerald-500/30">
                            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                            <span>{lang === "ar" ? "استهلاك 10% - 67% (أخضر)" : "10% - 67% (Green)"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-900 border border-amber-500/30">
                            <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                            <span>{lang === "ar" ? "قرب استهلاك الباقة 67% - 100% (برتقالي)" : "67% - 100% (Orange)"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-900 border border-rose-500/30">
                            <span className="h-2 w-2 rounded-full bg-rose-600"></span>
                            <span>{lang === "ar" ? "تجاوز الباقة > 100% (أحمر)" : "> 100% (Red)"}</span>
                        </span>
                    </div>
                </div>

                {/* ═══ FILTERS BOX (Match Image Filter Section) ═════════════════════ */}
                <div className="print:hidden bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
                    <div className="text-start text-xs font-extrabold text-text-muted border-b border-border pb-2">
                        {lang === "ar" ? "تصفية النتائج" : "Filter Results"}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        {/* Contract Status */}
                        <div className="text-start">
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
                                {lang === "ar" ? "حالة العقد" : "Contract Status"}
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full text-xs h-9 rounded-lg border-border bg-surface text-text font-semibold focus:ring-primary focus:border-primary"
                            >
                                <option value="">{lang === "ar" ? "الكل (نشط ومنتهي)" : "All (Active & Ended)"}</option>
                                <option value="active">{lang === "ar" ? "نشط" : "Active"}</option>
                                <option value="ended">{lang === "ar" ? "منتهي" : "Ended"}</option>
                                <option value="draft">{lang === "ar" ? "مسودة" : "Draft"}</option>
                            </select>
                        </div>

                        {/* Customer */}
                        <div className="text-start">
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
                                {lang === "ar" ? "نوع العميل" : "Customer"}
                            </label>
                            <select
                                value={customerIdFilter}
                                onChange={(e) => setCustomerIdFilter(e.target.value)}
                                className="w-full text-xs h-9 rounded-lg border-border bg-surface text-text font-semibold focus:ring-primary focus:border-primary"
                            >
                                <option value="">{lang === "ar" ? "الكل" : "All Customers"}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input */}
                        <div className="text-start">
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
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

                        {/* Apply Filter Button */}
                        <div>
                            <button
                                type="button"
                                onClick={handleFilter}
                                className="w-full h-9 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "تطبيق التصفية" : "Apply Filter"}</span>
                            </button>
                        </div>

                        {/* Reset Button */}
                        <div>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full h-9 border border-border bg-surface hover:bg-surface-muted text-text-muted rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "إعادة تعيين" : "Reset"}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══ PRINTABLE DOCUMENT CONTAINER (A4 Portrait) ══════════════════ */}
                <div className="report-print-container bg-surface border border-border rounded-xl p-6 shadow-xs print:shadow-none print:border-none print:p-0">
                    
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
                                {lang === "ar" ? "إحصائيات الطبالي" : "Pallet Capacity Statistics Report"}
                            </h1>
                            <p className="text-[10px] text-gray-600">
                                {lang === "ar" ? "عرض تحليلي مفصل لرصيد المحجوزات، الطبالي، والرصيد المتبقي" : "Detailed analytical breakdown of booked, occupied, and remaining pallet balances"}
                            </p>
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
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "إجمالي المستخدم:" : "Total Occupied:"}</span>
                            <span className="font-mono font-black text-sm text-black">{(summary.total_used || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "إجمالي المتبقي المتاح:" : "Total Remaining:"}</span>
                            <span className="font-mono font-black text-sm text-black">{(summary.total_remaining || 0).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-bold text-gray-600">{lang === "ar" ? "معدل الإشغال العام:" : "Occupancy Rate:"}</span>
                            <span className="font-mono font-black text-sm text-black">%{summary.utilization_rate || 0}</span>
                        </div>
                    </div>

                    {/* ═══ MULTI-HEADER TABLE EXACTLY MATCHING USER IMAGE ══════════════ */}
                    {reportData.length === 0 ? (
                        <div className="py-16 text-center text-text-muted space-y-2">
                            <Boxes className="h-10 w-10 mx-auto text-text-muted/40" />
                            <p className="font-bold text-sm">
                                {lang === "ar" ? "لا توجد عقود مطابقة لشروط الفلتر التصفية" : "No contracts found matching filter criteria"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-center border-collapse border border-border print:border-gray-800">
                                <thead>
                                    {/* Level 1 Headers */}
                                    <tr className="bg-surface-muted/80 print:bg-gray-200 text-text print:text-black font-black border-b border-border print:border-gray-600">
                                        <th rowSpan={2} className="p-3 text-center align-middle border-e border-border print:border-gray-400 w-12">
                                            #
                                        </th>
                                        <th rowSpan={2} className="p-3 text-center align-middle border-e border-border print:border-gray-400 min-w-[220px]">
                                            {lang === "ar" ? "العقد والعميل" : "Contract & Client"}
                                        </th>
                                        <th colSpan={allSizes.length} className="p-2 text-center border-e border-border print:border-gray-400 bg-blue-500/5 print:bg-transparent">
                                            {lang === "ar" ? "المحجوز" : "Booked"}
                                        </th>
                                        <th colSpan={allSizes.length} className="p-2 text-center border-e border-border print:border-gray-400 bg-amber-500/5 print:bg-transparent">
                                            {lang === "ar" ? "المستخدم" : "Occupied"}
                                        </th>
                                        <th colSpan={allSizes.length} className="p-2 text-center border-e border-border print:border-gray-400 bg-emerald-500/5 print:bg-transparent">
                                            {lang === "ar" ? "المتاح" : "Remaining"}
                                        </th>
                                        <th rowSpan={2} className="p-3 text-center align-middle w-28">
                                            {lang === "ar" ? "نسبة الاستغلال" : "Utilization"}
                                        </th>
                                    </tr>

                                    {/* Level 2 Sub-Headers per Size */}
                                    <tr className="bg-surface-muted/50 print:bg-gray-100 text-text print:text-black font-bold border-b border-border print:border-gray-600">
                                        {/* Under المحجوز */}
                                        {allSizes.map((sz) => (
                                            <th key={`h-booked-${sz}`} className="p-2 text-center border-e border-border print:border-gray-300 min-w-[60px]">
                                                {sz}
                                            </th>
                                        ))}

                                        {/* Under المستخدم */}
                                        {allSizes.map((sz) => (
                                            <th key={`h-used-${sz}`} className="p-2 text-center border-e border-border print:border-gray-300 min-w-[60px]">
                                                {sz}
                                            </th>
                                        ))}

                                        {/* Under المتاح */}
                                        {allSizes.map((sz) => (
                                            <th key={`h-rem-${sz}`} className="p-2 text-center border-e border-border print:border-gray-300 min-w-[60px]">
                                                {sz}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-border print:divide-gray-400">
                                    {reportData.map((row, idx) => (
                                        <tr key={row.id} className="hover:bg-surface-muted/30 print:hover:bg-transparent">
                                            
                                            {/* Serial Number # */}
                                            <td className="p-3 text-center align-middle font-mono font-extrabold text-text-muted print:text-black border-e border-border print:border-gray-300">
                                                {idx + 1}
                                            </td>

                                            {/* Column 1: Client Name + Contract Number + Status Badge */}
                                            <td className="p-3 text-start align-middle border-e border-border print:border-gray-400">
                                                <div className="space-y-0.5">
                                                    <div className="font-extrabold text-text print:text-black text-xs">
                                                        {row.customer_name}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-text-muted print:text-gray-800">
                                                            {row.contract_number}
                                                        </span>
                                                        <span
                                                            className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${
                                                                row.status === "active"
                                                                    ? "bg-emerald-500/15 text-emerald-700 print:bg-emerald-100 print:text-emerald-900 border border-emerald-500/20"
                                                                    : "bg-slate-500/15 text-slate-700 print:bg-gray-100 print:text-gray-900 border border-slate-500/20"
                                                            }`}
                                                        >
                                                            {row.status === "active"
                                                                ? (lang === "ar" ? "نشط" : "Active")
                                                                : (lang === "ar" ? "منتهي" : "Ended")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Columns for المحجوز per size */}
                                            {allSizes.map((sz) => (
                                                <td key={`b-${sz}`} className="p-2 text-center font-mono font-bold text-text print:text-black border-e border-border print:border-gray-300">
                                                    {row.booked_by_size[sz] !== undefined ? row.booked_by_size[sz] : 0}
                                                </td>
                                            ))}

                                            {/* Columns for المستخدم per size (Colored based on consumption rate) */}
                                            {allSizes.map((sz) => {
                                                const usedVal = row.used_by_size[sz] !== undefined ? row.used_by_size[sz] : 0;
                                                const bookedVal = row.booked_by_size[sz] !== undefined ? row.booked_by_size[sz] : 0;
                                                const colorClass = getConsumptionColor(usedVal, bookedVal);
                                                return (
                                                    <td key={`u-${sz}`} className={`p-2 text-center font-mono border-e border-border print:border-gray-300 ${colorClass}`}>
                                                        {usedVal}
                                                    </td>
                                                );
                                            })}

                                            {/* Columns for المتاح per size (Colored with SAME consumption rate color) */}
                                            {allSizes.map((sz) => {
                                                const usedVal = row.used_by_size[sz] !== undefined ? row.used_by_size[sz] : 0;
                                                const bookedVal = row.booked_by_size[sz] !== undefined ? row.booked_by_size[sz] : 0;
                                                const remVal = row.remaining_by_size[sz] !== undefined ? row.remaining_by_size[sz] : 0;
                                                const colorClass = getConsumptionColor(usedVal, bookedVal);
                                                return (
                                                    <td key={`r-${sz}`} className={`p-2 text-center font-mono border-e border-border print:border-gray-300 ${colorClass}`}>
                                                        {remVal}
                                                    </td>
                                                );
                                            })}

                                            {/* Column Last: Utilization Rate % */}
                                            <td className="p-3 text-center align-middle font-mono font-black text-text print:text-black">
                                                %{row.utilization_rate}
                                            </td>

                                        </tr>
                                    ))}

                                    {/* Grand Total Summary Row */}
                                    <tr className="bg-surface-muted/90 print:bg-gray-200 font-black text-text print:text-black border-t-2 border-border print:border-black">
                                        <td colSpan={2} className="p-3 text-start border-e border-border print:border-gray-400 text-xs font-black">
                                            {lang === "ar" ? "الإجمالي الكلي لكافة العقود" : "Grand Total All Contracts"}
                                        </td>

                                        {/* Total Booked per size */}
                                        {allSizes.map((sz) => {
                                            const totBookedSz = reportData.reduce((sum, r) => sum + (r.booked_by_size[sz] || 0), 0);
                                            return (
                                                <td key={`tot-b-${sz}`} className="p-2 text-center font-mono font-black text-blue-700 print:text-black border-e border-border print:border-gray-400">
                                                    {totBookedSz}
                                                </td>
                                            );
                                        })}

                                        {/* Total Used per size with consumption color */}
                                        {allSizes.map((sz) => {
                                            const totBookedSz = reportData.reduce((sum, r) => sum + (r.booked_by_size[sz] || 0), 0);
                                            const totUsedSz = reportData.reduce((sum, r) => sum + (r.used_by_size[sz] || 0), 0);
                                            const totColorClass = getConsumptionColor(totUsedSz, totBookedSz);
                                            return (
                                                <td key={`tot-u-${sz}`} className={`p-2 text-center font-mono border-e border-border print:border-gray-400 ${totColorClass}`}>
                                                    {totUsedSz}
                                                </td>
                                            );
                                        })}

                                        {/* Total Remaining per size with SAME consumption color */}
                                        {allSizes.map((sz) => {
                                            const totBookedSz = reportData.reduce((sum, r) => sum + (r.booked_by_size[sz] || 0), 0);
                                            const totUsedSz = reportData.reduce((sum, r) => sum + (r.used_by_size[sz] || 0), 0);
                                            const totRemSz = reportData.reduce((sum, r) => sum + (r.remaining_by_size[sz] || 0), 0);
                                            const totColorClass = getConsumptionColor(totUsedSz, totBookedSz);
                                            return (
                                                <td key={`tot-r-${sz}`} className={`p-2 text-center font-mono border-e border-border print:border-gray-400 ${totColorClass}`}>
                                                    {totRemSz}
                                                </td>
                                            );
                                        })}

                                        <td className="p-3 text-center font-mono text-sm text-primary print:text-black">
                                            %{summary.utilization_rate || 0}
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

            {/* Print CSS Rules - Strictly A4 Portrait */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
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
