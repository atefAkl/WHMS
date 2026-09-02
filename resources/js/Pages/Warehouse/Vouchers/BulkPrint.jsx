import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, ArrowRight, X, FileText } from "lucide-react";

export default function BulkPrint({ vouchers = [], contract, companySettings = {} }) {
    const { lang, __ } = useLang();
    const user = usePage().props.auth.user;

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    // Helper: Format item name, extract capacity/weight
    const formatItemAndPackage = (entry, isReception) => {
        const itemObj = isReception ? entry.inventory_item : (entry.inventoryItem || entry.inventory_item);
        let rawItemName = displayBilingual(itemObj?.name) || "";
        let rawVarName = displayBilingual(entry.variant?.name) || "";
        let boxType = entry.variant?.unit || entry.variant?.package_type || "كرتون";

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

    // Company info defaults
    const compName = companySettings.company_name || "مخازن أيمن محمد عبد الله الغماس للتخزين";
    const compSlogan = companySettings.company_slogan || "تخزين - تبريد - تجميد - تعبئة وتغليف - بيع - تصدير";
    const compCr = companySettings.company_cr || "1131305092";
    const compPhone = companySettings.company_phone || "0568562615";
    const compEmail = companySettings.company_email || "sales@ag-stores.com";
    const compAddress = companySettings.company_address || "1131 - القصيم / ضراس - طريق الملك فهد";
    const compWebsite = companySettings.company_website || "https://web.site";
    const compLogo = companySettings.company_logo || null;

    const [hasReferrer, setHasReferrer] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined" && document.referrer && document.referrer.startsWith(window.location.origin)) {
            setHasReferrer(true);
        }
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

    const renderAuthenticVoucher = (voucher) => {
        const isReception = voucher.voucher_type === 'reception';
        const entries = voucher.inventory_entries || [];
        const totalQty = entries.reduce(
            (sum, entry) => sum + parseFloat(isReception ? (entry.quantity_in || 0) : (entry.quantity_out || 0)), 
            0
        );
        const totalPallets = entries.length;

        const repPart = voucher.representative?.name?.trim() || "---";
        const driverPart = voucher.driver?.name?.trim() || "---";
        const repDriverDisplay = `${repPart} / ${driverPart}`;

        return (
            <div className="bulk-voucher-page max-w-4xl mx-auto w-full flex flex-col justify-between p-6 bg-white text-black font-sans text-xs print:p-0 print:m-0 print:box-border print:min-h-[27cm] border border-gray-200 print:border-none shadow-sm print:shadow-none rounded-xl print:rounded-none">
                {/* ═══ TOP & MAIN CONTENT ═════════════════════════════════ */}
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
                                {isReception 
                                    ? __('vouchers.bulk_print.reception_note')
                                    : __('vouchers.bulk_print.delivery_note')
                                }
                            </h1>
                            <div className="text-xs font-black font-mono text-gray-900">
                                No: {voucher.serial_number}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] border-b border-gray-300 pb-2">
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.client')}</span>
                                <span className="font-bold text-black">{voucher.customer?.name}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.contract_label')}</span>
                                    <span className="font-mono font-bold text-black">{voucher.contract?.contract_number}</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <span className="font-bold text-gray-600">{__('vouchers.bulk_print.period_label')}</span>
                                    <span className="font-mono font-bold text-black">{voucher.period?.period_number ? String(voucher.period.period_number).padStart(2, '0') : '01'}</span>
                                </div>
                            </div>
                            {isReception ? (
                                <>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.rep_driver')}</span>
                                        <span className="font-bold text-black">{repDriverDisplay}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.source')}</span>
                                        <span className="font-medium text-gray-900">{voucher.farm_source || voucher.source_farm || "—"}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex gap-2">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.driver')}</span>
                                    <span className="font-medium text-gray-900">{voucher.driver?.name ? `${voucher.driver.name} (${voucher.driver.vehicle_plate || ''})` : "—"}</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.att')}</span>
                                <span className="font-bold text-black">{voucher.recipient_name || user?.name || "أمين المستودع"}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{isReception ? __('vouchers.bulk_print.reception_date') : __('vouchers.bulk_print.delivery_date')}</span>
                                    <span className="font-mono font-bold text-black">
                                        {isReception 
                                            ? (voucher.reception_date ? new Date(voucher.reception_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—")
                                            : (voucher.delivery_date ? new Date(voucher.delivery_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—")
                                        }
                                    </span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <span className="font-bold text-gray-600">{__('vouchers.bulk_print.shift')}</span>
                                    <span className="font-mono font-bold text-black">{voucher.shift || "م / M"}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{__('vouchers.bulk_print.notes')}</span>
                                <span className="text-[10px] text-gray-800 leading-tight">{voucher.notes || "—"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-1">
                        <table className="w-full text-xs text-center border-b border-gray-400">
                            <thead>
                                <tr className="border-b border-black text-black font-bold">
                                    <th className="py-1.5 text-start w-10">#</th>
                                    <th className="py-1.5 text-start">{__('vouchers.bulk_print.item')}</th>
                                    <th className="py-1.5 w-32">{__('vouchers.bulk_print.grade')}</th>
                                    <th className="py-1.5 w-36">{__('vouchers.bulk_print.table')}</th>
                                    <th className="py-1.5 w-32">{__('vouchers.bulk_print.box')}</th>
                                    <th className="py-1.5 w-24">{isReception ? __('vouchers.bulk_print.total') : __('vouchers.bulk_print.out')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {entries.map((entry, idx) => {
                                    const { cleanItemName, cleanVarName, finalBoxDisplay } = formatItemAndPackage(entry, isReception);
                                    const gradeDisplay = getGradeDisplay(entry);
                                    const palletFormatted = getPalletFormatted(entry);
                                    const qty = Math.round(parseFloat(isReception ? (entry.quantity_in || 0) : (entry.quantity_out || 0)));

                                    return (
                                        <tr key={entry.id || idx} className="text-gray-900">
                                            <td className="py-1.5 text-start font-mono">{String(idx + 1).padStart(2, '0')}</td>
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
                                                {qty}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Summary Row */}
                                <tr className="border-t-2 border-black font-extrabold text-black">
                                    <td colSpan="3" className="py-2 px-4 text-start font-bold">
                                        <span className="text-gray-700 me-2">{__('vouchers.bulk_print.total_tables')}</span>
                                        <span className="font-mono text-sm font-black text-black">{totalPallets}</span>
                                    </td>
                                    <td colSpan="3" className="py-2 px-4 text-end font-bold">
                                        <span className="text-gray-700 me-2">{isReception ? __('vouchers.bulk_print.total_packs') : __('vouchers.bulk_print.total_packs_out')}</span>
                                        <span className="font-mono text-sm font-black text-black">{Math.round(totalQty).toLocaleString()}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* ═══ SIGNATURES & FOOTER PANEL ═════════════════════════ */}
                <div className="mt-auto pt-3 print:pt-2 space-y-2 pb-0 print:pb-0">
                    
                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-8 text-center text-xs">
                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                {__('vouchers.bulk_print.client_represent')}
                            </p>
                            <div className="text-start text-[11px] space-y-0.5">
                                <p className="text-gray-800 font-semibold truncate">
                                    {__('vouchers.bulk_print.name')} {voucher.representative?.name || voucher.driver?.name || voucher.recipient_name || voucher.customer?.name || "________________"}
                                </p>
                                <p className="text-gray-400 font-mono">{__('vouchers.bulk_print.signature')} ________________</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                {__('vouchers.bulk_print.stores_manager')}
                            </p>
                            <div className="text-start text-[11px] space-y-0.5">
                                <p className="text-gray-800 font-semibold">{__('vouchers.bulk_print.name')} ________________</p>
                                <p className="text-gray-400 font-mono">{__('vouchers.bulk_print.signature')} ________________</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                {__('vouchers.bulk_print.stores_admin')}
                            </p>
                            <div className="text-start text-[11px] space-y-0.5">
                                <p className="text-gray-800 font-semibold">{__('vouchers.bulk_print.name')} {voucher.created_by_user?.name || user?.name || "________________"}</p>
                                <p className="text-gray-400 font-mono">{__('vouchers.bulk_print.signature')} ________________</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Metadata */}
                    <div className="border-t border-gray-300 pt-1.5 text-center text-[9px] text-gray-600 space-y-0.5">
                        <p className="font-medium">
                            {compAddress} – Phone: <span className="font-mono font-bold">{compPhone}</span> Email: <span className="font-mono">{compEmail}</span> <span className="font-mono">{compWebsite}</span>
                        </p>
                    </div>

                </div>

            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-lg font-bold leading-tight text-gray-800 flex items-center gap-2">
                    <Printer className="h-5 w-5 text-primary" />
                    {__('vouchers.bulk_print.page_title')}
                </h2>
            }
        >
            <Head title={__('vouchers.bulk_print.page_title')} />

            <div className="py-4 space-y-6 print:py-0 print:space-y-0" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* Clean View Header Bar inside Content Area (Hidden when printing) */}
                <div className="print:hidden bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Printer className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-extrabold text-gray-900">
                                {__('vouchers.bulk_print.view_title')}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="bg-primary/10 text-primary font-mono font-bold text-xs px-2.5 py-0.5 rounded-full">
                                    {vouchers.length} {lang === "ar" ? "سندات جاهزة للطباعة" : "vouchers ready to print"}
                                </span>
                                {contract && (
                                    <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                                        {__('vouchers.bulk_print.contract', { number: contract.contract_number })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            disabled={vouchers.length === 0}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Printer className="h-4 w-4" />
                            <span>
                                {__('vouchers.bulk_print.print_selected', { count: vouchers.length })}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCloseOrBack}
                            className="px-3.5 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                        >
                            {hasReferrer ? (
                                <>
                                    <ArrowRight className={`h-4 w-4 ${lang === "ar" ? "rotate-0" : "rotate-180"}`} />
                                    <span>{__('vouchers.bulk_print.go_back')}</span>
                                </>
                            ) : (
                                <>
                                    <X className="h-4 w-4" />
                                    <span>{__('vouchers.bulk_print.close_window')}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Printable Content Area */}
                {vouchers.length === 0 ? (
                    <div className="print:hidden text-center py-16 bg-white border border-gray-200 rounded-xl text-gray-500 font-bold">
                        {__('vouchers.bulk_print.no_vouchers')}
                    </div>
                ) : (
                    <div className="space-y-6 print:space-y-0">
                        {vouchers.map((voucher) => (
                            <React.Fragment key={`${voucher.voucher_type}-${voucher.id}`}>
                                {renderAuthenticVoucher(voucher)}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            {/* Print CSS Rules - Supports Multi-page Printing per voucher */}
            <style>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 0.6cm;
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
                    .bulk-voucher-page {
                        page-break-after: always !important;
                        break-after: page !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-sizing: border-box !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .bulk-voucher-page:last-child {
                        page-break-after: auto !important;
                        break-after: auto !important;
                    }
                }
            `}</style>
        </AuthenticatedLayout>
    );
}
