import React, { useState, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Printer,
    ArrowRight,
    Search,
    Filter,
    Layers,
    Clock,
    FileText,
    Calendar,
    ArrowDownLeft,
    ArrowUpRight,
    RefreshCw,
    Boxes,
} from "lucide-react";

export default function PalletHistory({ contract, movements = [], summary = {}, companySettings = {} }) {
    const { lang, __ } = useLang();

    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Filter movements
    const filteredMovements = useMemo(() => {
        return movements.filter((m) => {
            // Search text
            if (search) {
                const s = search.toLowerCase();
                const matchPallet = String(m.pallet_number || "").toLowerCase().includes(s);
                const matchItem = String(m.item_name || "").toLowerCase().includes(s);
                const matchVariant = String(m.variant_name || "").toLowerCase().includes(s);
                const matchSerial = String(m.voucher_serial || "").toLowerCase().includes(s);
                const matchNotes = String(m.notes || "").toLowerCase().includes(s);
                if (!matchPallet && !matchItem && !matchVariant && !matchSerial && !matchNotes) {
                    return false;
                }
            }

            // Type filter
            if (filterType && m.voucher_type !== filterType) {
                return false;
            }

            // Date filters
            if (dateFrom && m.operation_date < dateFrom) {
                return false;
            }
            if (dateTo && m.operation_date > dateTo) {
                return false;
            }

            return true;
        });
    }, [movements, search, filterType, dateFrom, dateTo]);

    // Metrics for filtered data
    const filteredSummary = useMemo(() => {
        let totalIn = 0;
        let totalOut = 0;
        const palletSet = new Set();

        filteredMovements.forEach((m) => {
            totalIn += parseFloat(m.quantity_in || 0);
            totalOut += parseFloat(m.quantity_out || 0);
            if (m.pallet_id) palletSet.add(m.pallet_id);
        });

        return {
            total_movements: filteredMovements.length,
            total_pallets: palletSet.size,
            total_in: totalIn,
            total_out: totalOut,
            balance: totalIn - totalOut,
        };
    }, [filteredMovements]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-lg font-bold leading-tight text-gray-800 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {__('contracts.pallet_history.title')}
                    </h2>
                    <span className="bg-primary/10 text-primary font-mono font-bold text-xs px-2.5 py-1 rounded-full">
                        {__('contracts.pallet_history.contract_no', { number: contract?.contract_number })}
                    </span>
                </div>
            }
        >
            <Head title={__('contracts.pallet_history.title')} />

            <div className="py-4 space-y-6 print:py-0 print:space-y-0" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* ═══ Header Action Bar (Hidden when printing) ════════════════ */}
                <div className="print:hidden bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Layers className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold text-gray-900">
                                {__('contracts.pallet_history.view_title')}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-600 font-medium">
                                <span>{lang === "ar" ? `العميل: ${contract?.customer?.name}` : `Client: ${contract?.customer?.name}`}</span>
                                <span>•</span>
                                <span className="font-mono text-primary font-bold">
                                    {__('contracts.pallet_history.contract_no', { number: contract?.contract_number })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Printer className="h-4 w-4" />
                            <span>{__('contracts.pallet_history.print_report')}</span>
                        </button>

                        <a
                            href={route("contracts.show", contract.id)}
                            className="px-3.5 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                        >
                            <ArrowRight className={`h-4 w-4 ${lang === "ar" ? "rotate-0" : "rotate-180"}`} />
                            <span>{__('contracts.pallet_history.back_to_contract')}</span>
                        </a>
                    </div>
                </div>

                {/* ═══ KPI Summary Cards (Hidden when printing) ═══════════════ */}
                <div className="print:hidden grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm text-start">
                        <span className="text-[10px] font-bold text-gray-500 block uppercase">
                            {__('contracts.pallet_history.summary_total_pallets')}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black font-mono text-gray-900">
                                {filteredSummary.total_pallets}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">{lang === "ar" ? "طبلية" : "pallets"}</span>
                        </div>
                    </div>

                    <div className="bg-white border border-emerald-200/60 rounded-xl p-3.5 shadow-sm text-start bg-emerald-50/20">
                        <span className="text-[10px] font-bold text-emerald-700 block uppercase flex items-center gap-1">
                            <ArrowDownLeft className="h-3.5 w-3.5" />
                            {__('contracts.pallet_history.summary_total_in')}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black font-mono text-emerald-800">
                                {Math.round(filteredSummary.total_in).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-rose-200/60 rounded-xl p-3.5 shadow-sm text-start bg-rose-50/20">
                        <span className="text-[10px] font-bold text-rose-700 block uppercase flex items-center gap-1">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            {__('contracts.pallet_history.summary_total_out')}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black font-mono text-rose-800">
                                {Math.round(filteredSummary.total_out).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-blue-200/60 rounded-xl p-3.5 shadow-sm text-start bg-blue-50/20">
                        <span className="text-[10px] font-bold text-blue-700 block uppercase flex items-center gap-1">
                            <Boxes className="h-3.5 w-3.5" />
                            {__('contracts.pallet_history.summary_balance')}
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-xl font-black font-mono text-blue-800">
                                {Math.round(filteredSummary.balance).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ═══ Search & Filters Card (Hidden when printing) ═══════════ */}
                <div className="print:hidden bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Search Input */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">
                                {lang === "ar" ? "البحث بالجدول" : "Search Table"}
                            </label>
                            <div className="relative">
                                <Search className="h-4 w-4 text-gray-400 absolute start-2.5 top-2.5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={__('contracts.pallet_history.search_placeholder')}
                                    className="w-full text-xs h-[34px] ps-8 pe-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                                />
                            </div>
                        </div>

                        {/* Movement Type Filter */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">
                                {lang === "ar" ? "نوع الحركة" : "Movement Type"}
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full text-xs h-[34px] px-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
                            >
                                <option value="">{__('contracts.pallet_history.filter_all_types')}</option>
                                <option value="reception">{__('contracts.pallet_history.type_reception')}</option>
                                <option value="delivery">{__('contracts.pallet_history.type_delivery')}</option>
                                <option value="adjustment">{__('contracts.pallet_history.type_adjustment')}</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">
                                {__('contracts.pallet_history.date_from')}
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full text-xs h-[34px] px-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-600 mb-1 block">
                                {__('contracts.pallet_history.date_to')}
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full text-xs h-[34px] px-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-mono"
                            />
                        </div>
                    </div>
                </div>

                {/* ═══ Main Table Display (Screen & Print) ═════════════════════ */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:shadow-none print:border-none print:rounded-none">
                    
                    {/* Header Banner for Printed View */}
                    <div className="hidden print:block p-4 border-b border-gray-400 mb-4 space-y-2">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 text-start">
                                <h1 className="text-base font-black text-black">
                                    {companySettings.company_name || "مخازن أيمن محمد عبد الله الغماس للتخزين"}
                                </h1>
                                <p className="text-xs font-bold text-gray-800">
                                    {__('contracts.pallet_history.view_title')}
                                </p>
                            </div>
                            <div className="text-end space-y-0.5">
                                <p className="font-mono font-bold text-xs text-black">
                                    {__('contracts.pallet_history.contract_no', { number: contract?.contract_number })}
                                </p>
                                <p className="text-[10px] text-gray-600">
                                    {lang === "ar" ? `العميل: ${contract?.customer?.name}` : `Client: ${contract?.customer?.name}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start border-collapse">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 font-extrabold uppercase">
                                    <th className="px-3 py-2.5 text-start w-10">#</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_date')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_voucher')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_type')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_pallet')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_item')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_variant')}</th>
                                    <th className="px-3 py-2.5 text-center">{__('contracts.pallet_history.col_qty_in')}</th>
                                    <th className="px-3 py-2.5 text-center">{__('contracts.pallet_history.col_qty_out')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_rep_driver')}</th>
                                    <th className="px-3 py-2.5 text-start">{__('contracts.pallet_history.col_notes')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredMovements.length === 0 ? (
                                    <tr>
                                        <td colSpan="11" className="py-12 text-center text-gray-500 font-bold">
                                            {__('contracts.pallet_history.no_movements')}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMovements.map((m, idx) => {
                                        const isRec = m.voucher_type === "reception";

                                        return (
                                            <tr key={m.id || idx} className="hover:bg-gray-50 transition-colors text-gray-800 font-medium">
                                                <td className="px-3 py-2 font-mono font-bold text-gray-500">
                                                    {String(idx + 1).padStart(2, "0")}
                                                </td>
                                                <td className="px-3 py-2 font-mono font-bold text-gray-900">
                                                    {m.operation_date}
                                                </td>
                                                <td className="px-3 py-2 font-mono font-black text-primary">
                                                    {m.voucher_serial}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        isRec 
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                            : "bg-amber-50 text-amber-700 border-amber-200"
                                                    }`}>
                                                        {isRec 
                                                            ? __('contracts.pallet_history.type_reception') 
                                                            : __('contracts.pallet_history.type_delivery')}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 font-bold text-gray-900">
                                                    <span className="font-mono">{m.pallet_number}</span>
                                                    {m.pallet_size !== "—" && (
                                                        <span className="text-[10px] text-gray-500 ms-1 font-normal">
                                                            ({m.pallet_size})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 font-bold text-gray-900">
                                                    {m.item_name}
                                                </td>
                                                <td className="px-3 py-2 text-gray-700">
                                                    {m.variant_name}
                                                </td>
                                                <td className="px-3 py-2 text-center font-mono font-bold text-emerald-700">
                                                    {m.quantity_in > 0 ? Math.round(m.quantity_in).toLocaleString() : "—"}
                                                </td>
                                                <td className="px-3 py-2 text-center font-mono font-bold text-rose-600">
                                                    {m.quantity_out > 0 ? Math.round(m.quantity_out).toLocaleString() : "—"}
                                                </td>
                                                <td className="px-3 py-2 text-[11px] text-gray-700">
                                                    {m.rep_driver}
                                                </td>
                                                <td className="px-3 py-2 text-[11px] text-gray-500 max-w-xs truncate">
                                                    {m.notes}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Summary Bar */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center text-xs font-bold text-gray-800">
                        <span>
                            {lang === "ar" ? `إجمالي الحركات: ${filteredMovements.length}` : `Total Rows: ${filteredMovements.length}`}
                        </span>
                        <div className="flex gap-4 font-mono">
                            <span>{lang === "ar" ? "إجمالي المدخلات: " : "Total In: "}<strong className="text-emerald-700">{Math.round(filteredSummary.total_in).toLocaleString()}</strong></span>
                            <span>{lang === "ar" ? "إجمالي المخرجات: " : "Total Out: "}<strong className="text-rose-600">{Math.round(filteredSummary.total_out).toLocaleString()}</strong></span>
                            <span>{lang === "ar" ? "الرصيد الصافي: " : "Net Balance: "}<strong className="text-blue-700">{Math.round(filteredSummary.balance).toLocaleString()}</strong></span>
                        </div>
                    </div>

                </div>

            </div>

            {/* Print CSS Rules - Supports Multi-page Printing */}
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
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }
                    th, td {
                        border: 1px solid #d1d5db !important;
                        padding: 4px 6px !important;
                        font-size: 10px !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
