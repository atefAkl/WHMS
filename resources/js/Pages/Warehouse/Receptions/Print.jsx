import React, { useEffect, useState } from "react";
import { Head, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, FileText, FileCheck, List, Plus, ArrowRight, X } from "lucide-react";

export default function Print({ reception, companySettings = {} }) {
    const { lang, __ } = useLang();

    const user = usePage().props.auth.user;

    const [hasReferrer, setHasReferrer] = useState(false);

    useEffect(() => {
        // Trigger print dialog automatically after component mounts
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        if (typeof window !== "undefined" && document.referrer && document.referrer.startsWith(window.location.origin)) {
            setHasReferrer(true);
        }

        return () => clearTimeout(timer);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleCloseOrBack = () => {
        if (typeof window !== "undefined" && document.referrer && document.referrer.startsWith(window.location.origin)) {
            window.location.href = document.referrer;
        } else {
            window.close();
            setTimeout(() => {
                if (!window.closed) {
                    window.history.back();
                }
            }, 300);
        }
    };

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    // Calculate totals
    const totalQty = reception.inventory_entries?.reduce((sum, entry) => sum + parseFloat(entry.quantity_in || 0), 0) || 0;
    const totalPallets = reception.inventory_entries?.length || 0;

    // Helper: Format item name, extract capacity/weight, and append to package box column
    const formatItemAndPackage = (entry) => {
        let rawItemName = displayBilingual(entry.inventoryItem?.name || entry.inventory_item?.name) || "";
        let rawVarName = displayBilingual(entry.variant?.name) || "";
        let boxType = entry.variant?.unit || entry.variant?.package_type || (__("receptions.print.carton"));

        let extraCap = "";

        const capacityRegex = /(\d+(?:\.\d+)?\s*(?:كجم|ك|kg|k)\s*\w*|ك\s+\w+)/gi;

        const mVar = rawVarName.match(capacityRegex);
        if (mVar) {
            extraCap = mVar[0].trim();
            rawVarName = rawVarName.replace(capacityRegex, "").trim();
        }

        const mItem = rawItemName.match(capacityRegex);
        if (mItem) {
            if (!extraCap) extraCap = mItem[0].trim();
            rawItemName = rawItemName.replace(capacityRegex, "").trim();
        }

        if (rawVarName.toLowerCase() === boxType.toLowerCase()) {
            rawVarName = "";
        }

        let finalBoxDisplay = boxType;
        if (extraCap) {
            finalBoxDisplay = `${boxType} ${extraCap}`;
        } else if (rawVarName) {
            finalBoxDisplay = `${boxType} ${rawVarName}`;
            rawVarName = "";
        }

        return { cleanItemName: rawItemName, cleanVarName: rawVarName, finalBoxDisplay };
    };

    const getGradeDisplay = (entry) => {
        return entry.variant?.size || entry.variant?.quality || entry.pallet?.size || "—";
    };

    const getPalletFormatted = (entry) => {
        const palletNum = entry.pallet?.pallet_number || entry.pallet_number || "—";
        const palletSize = entry.pallet?.size || entry.variant?.size;
        if (palletNum !== "—" && palletSize) {
            return `${palletNum} / ${palletSize}`;
        }
        return palletNum;
    };

    // Company info & metadata defaults
    const compName = companySettings.company_name || "مخازن أيمن محمد عبد الله الغماس للتخزين";
    const compSlogan = companySettings.company_slogan || "تخزين - تبريد - تجميد - تعبئة وتغليف - بيع - تصدير";
    const compCr = companySettings.company_cr || "1131305092";
    const compPhone = companySettings.company_phone || "0568562615";
    const compEmail = companySettings.company_email || "sales@ag-stores.com";
    const compAddress = companySettings.company_address || "1131 - القصيم / ضراس - طريق الملك فهد";
    const compWebsite = companySettings.company_website || "https://web.site";
    const compLogo = companySettings.company_logo || null;

    // Multi-page Chunking (25 items per page for clean A4 printing)
    const ITEMS_PER_PAGE = 25;
    const entriesList = reception.inventory_entries || [];
    const totalEntries = entriesList.length;
    const totalPagesCount = Math.max(1, Math.ceil(totalEntries / ITEMS_PER_PAGE));

    const pageChunks = [];
    for (let p = 0; p < totalPagesCount; p++) {
        const pageItems = entriesList.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);
        pageChunks.push({
            pageIndex: p + 1,
            totalPages: totalPagesCount,
            items: pageItems,
            startIndex: p * ITEMS_PER_PAGE,
            isLastPage: p === totalPagesCount - 1,
        });
    }

    return (
        <div 
            className="min-h-screen bg-white text-black p-4 sm:p-6 font-sans text-xs print:p-0 print:m-0" 
            dir={__("receptions.print.ltr")}
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <Head title={__("receptions.print.print_reception_reception_seri")} />

            {/* Print Control Bar - Hidden when printing */}
            <div className="print:hidden mb-6 flex flex-wrap justify-between items-center bg-gray-50 p-3 border border-gray-200 rounded-xl gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        {__("receptions.print.goods_reception_voucher_print_")}
                    </span>

                    <div className="flex items-center gap-2 border-s border-gray-300 ps-3 ms-1">
                        <Link
                            href={route("receptions.index")}
                            className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span>{__("receptions.print.back_to_receptions")}</span>
                        </Link>

                        {reception.contract_id && (
                            <Link
                                href={`/contracts/${reception.contract_id}`}
                                className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                            >
                                <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                                <span>{__("receptions.print.view_contract")}</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route("receptions.create")}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{__("receptions.print.new_reception")}</span>
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{__("receptions.print.print_voucher")}</span>
                    </button>
                    <button
                        onClick={handleCloseOrBack}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                        {hasReferrer ? (
                            <>
                                <ArrowRight className={`h-4 w-4 ${__("receptions.print.rotate_180")}`} />
                                <span>{__("receptions.print.go_back")}</span>
                            </>
                        ) : (
                            <>
                                <X className="h-4 w-4" />
                                <span>{__("receptions.print.close_window")}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Document Pages Container */}
            <div className="max-w-4xl mx-auto w-full space-y-6 print:space-y-0">
                {pageChunks.map((chunk) => (
                    <div
                        key={chunk.pageIndex}
                        className="print-page-break bg-white border border-gray-200 print:border-none p-6 print:p-0 min-h-[27cm] flex flex-col justify-between"
                    >
                        {/* Page Content Header & Table */}
                        <div className="space-y-3 print:space-y-2">
                            {/* Header Section */}
                            <div className="flex justify-between items-start border-b border-gray-400 pb-2">
                                <div className="flex items-center gap-3">
                                    {compLogo ? (
                                        <img src={compLogo} alt="Logo" className="w-12 h-12 object-contain" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300">
                                            <FileText className="h-5 w-5 text-gray-800" />
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
                                    <h1 className="text-sm font-extrabold uppercase tracking-wide text-black">
                                        {__("receptions.print.goods_reception_note")}
                                    </h1>
                                    <div className="text-xs font-black font-mono text-gray-900">
                                        No: {reception.serial_number}
                                    </div>
                                </div>
                            </div>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] border-b border-gray-300 pb-2">
                                <div className="space-y-1">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.client")}</span>
                                        <span className="font-bold text-black">{reception.customer?.name}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex gap-2 flex-1">
                                            <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.contract")}</span>
                                            <span className="font-mono font-bold text-black">{reception.contract?.contract_number}</span>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <span className="font-bold text-gray-600">{__("receptions.print.p_no")}</span>
                                            <span className="font-mono font-bold text-black">{reception.period?.period_number ? String(reception.period.period_number).padStart(2, '0') : '01'}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.rep_driver")}</span>
                                        <span className="font-bold text-black">
                                            {`${reception.representative?.name?.trim() || "---"} / ${reception.driver?.name?.trim() || "---"}`}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.source")}</span>
                                        <span className="font-medium text-gray-900">{reception.farm_source || "—"}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.receiver")}</span>
                                        <span className="font-bold text-black">{reception.recipient_name || user?.name || (__("receptions.print.warehouse_keeper"))}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex gap-2 flex-1">
                                            <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.date")}</span>
                                            <span className="font-mono font-bold text-black">{reception.reception_date ? new Date(reception.reception_date).toLocaleDateString(__("receptions.print.en_us")) : "—"}</span>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <span className="font-bold text-gray-600">{__("receptions.print.shift")}</span>
                                            <span className="font-mono font-bold text-black">{reception.shift || "م / M"}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__("receptions.print.note")}</span>
                                        <span className="text-[10px] text-gray-800 leading-tight">{reception.notes || "—"}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chunk Items Table */}
                            <div className="space-y-1">
                                <table className="w-full text-xs text-center border-b border-gray-400">
                                    <thead>
                                        <tr className="border-b border-black text-black font-bold">
                                            <th className="py-1.5 text-start w-10">#</th>
                                            <th className="py-1.5 text-start">{__("receptions.print.items")}</th>
                                            <th className="py-1.5 w-32">{__("receptions.print.grade")}</th>
                                            <th className="py-1.5 w-36">{__("receptions.print.table")}</th>
                                            <th className="py-1.5 w-32">{__("receptions.print.box")}</th>
                                            <th className="py-1.5 w-24">{__("receptions.print.total")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {chunk.items.map((entry, idx) => {
                                            const { cleanItemName, cleanVarName, finalBoxDisplay } = formatItemAndPackage(entry);
                                            const gradeDisplay = getGradeDisplay(entry);
                                            const palletFormatted = getPalletFormatted(entry);
                                            const rowNum = chunk.startIndex + idx + 1;

                                            return (
                                                <tr key={entry.id || idx} className="text-gray-900">
                                                    <td className="py-1.5 text-start font-mono">{String(rowNum).padStart(2, '0')}</td>
                                                    <td className="py-1.5 text-start font-bold">
                                                        {cleanItemName}
                                                        {cleanVarName ? <span className="text-gray-500 text-[10px] font-normal block">{cleanVarName}</span> : null}
                                                    </td>
                                                    <td className="py-1.5 font-medium">
                                                        {gradeDisplay}
                                                    </td>
                                                    <td className="py-1.5 font-mono font-bold">
                                                        {palletFormatted}
                                                    </td>
                                                    <td className="py-1.5 font-medium">
                                                        {finalBoxDisplay}
                                                    </td>
                                                    <td className="py-1.5 font-mono font-bold">
                                                        {Math.round(parseFloat(entry.quantity_in || 0))}
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Total Summary Row (Rendered ONLY on Last Page) */}
                                        {chunk.isLastPage && (
                                            <tr className="border-t-2 border-black font-extrabold text-black">
                                                <td colSpan="3" className="py-2 px-4 text-start font-bold">
                                                    <span className="text-gray-700 me-2">{__("receptions.print.total_tables")}</span>
                                                    <span className="font-mono text-sm font-black text-black">{totalPallets}</span>
                                                </td>
                                                <td colSpan="3" className="py-2 px-4 text-end font-bold">
                                                    <span className="text-gray-700 me-2">{__("receptions.print.total_packs")}</span>
                                                    <span className="font-mono text-sm font-black text-black">{Math.round(totalQty).toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Signatures & Footer Panel */}
                        <div className="mt-auto pt-4 space-y-3">
                            {/* Signatures Panel (Rendered ONLY on Last Page) */}
                            {chunk.isLastPage ? (
                                <div className="grid grid-cols-3 gap-8 text-center text-xs">
                                    <div className="space-y-4">
                                        <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                            Client/Represent
                                        </p>
                                        <div className="text-start text-[11px] space-y-0.5">
                                            <p className="text-gray-800 font-semibold truncate">
                                                {__("receptions.print.name")}{reception.representative?.name || reception.customer?.name || "________________"}
                                            </p>
                                            <p className="text-gray-400 font-mono">{__("receptions.print.signature")}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                            Stores Manager
                                        </p>
                                        <div className="text-start text-[11px] space-y-0.5">
                                            <p className="text-gray-800 font-semibold">{__("receptions.print.name")}</p>
                                            <p className="text-gray-400 font-mono">{__("receptions.print.signature")}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                            Stores Admin
                                        </p>
                                        <div className="text-start text-[11px] space-y-0.5">
                                            <p className="text-gray-800 font-semibold">{__("receptions.print.name")}{reception.recipient_name || user?.name || "________________"}</p>
                                            <p className="text-gray-400 font-mono">{__("receptions.print.signature")}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-[10px] text-gray-500 italic">
                                    {__("receptions.print.continued_on_next_page")}
                                </div>
                            )}

                            {/* Page Footer Metadata */}
                            <div className="border-t border-gray-300 pt-1.5 flex justify-between items-center text-[9px] text-gray-600">
                                <div>
                                    {compAddress} – Phone: <span className="font-mono font-bold">{compPhone}</span> | Email: <span className="font-mono">{compEmail}</span>
                                </div>
                                <div className="font-mono font-bold text-gray-700">
                                    {__("receptions.print.page_chunk_pageindex_of_chunk_")}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
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
                        overflow: visible !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print-page-break {
                        page-break-after: always !important;
                        break-after: page !important;
                    }
                    .print-page-break:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }
                }
            `}</style>
        </div>
    );
}
