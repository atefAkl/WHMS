import React, { useEffect, useState } from "react";
import { Head, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, FileText, FileCheck, List, Plus, ArrowRight, X } from "lucide-react";

export default function Print({ rearrangement, companySettings = {} }) {
    const { lang } = useLang();
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
    const totalQty = rearrangement.items?.reduce((sum, item) => sum + parseFloat(item.quantity || item.quantity_in || item.quantity_out || 0), 0) || 0;
    const totalPallets = rearrangement.items?.length || 0;

    // Helper: Format item name, extract capacity/weight, and format package column
    const formatItemAndPackage = (item) => {
        let rawItemName = displayBilingual(item.inventoryItem?.name || item.inventory_item?.name) || "";
        let rawVarName = displayBilingual(item.variant?.name) || "";
        let boxType = item.variant?.unit || item.variant?.package_type || "كرتون";

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

    const getGradeDisplay = (item) => {
        return item.variant?.size || item.variant?.quality || item.pallet?.size || "—";
    };

    const getPalletFormatted = (item) => {
        const palletNum = item.pallet?.pallet_number || item.pallet?.code || item.pallet_id || "—";
        const palletSize = item.pallet?.size || item.variant?.size;
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
    const compWebsite = companySettings.company_website || "https:web.site";
    const compLogo = companySettings.company_logo || null;

    return (
        <div 
            className="min-h-screen bg-white text-black p-4 sm:p-6 font-sans text-xs print:p-0 print:m-0 print:h-full print:overflow-hidden flex flex-col justify-between" 
            dir={lang === "ar" ? "rtl" : "ltr"}
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <Head title={lang === "ar" ? `طباعة سند ترتيب ونقل طبالي: ${rearrangement.serial_number}` : `Print Rearrangement: ${rearrangement.serial_number}`} />

            {/* Print Control Bar - Hidden when printing */}
            <div className="print:hidden mb-6 flex flex-wrap justify-between items-center bg-gray-50 p-3 border border-gray-200 rounded-xl gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        {lang === "ar" ? "معاينة طباعة سند نقل وترتيب الطبالي" : "Pallet Rearrangement Voucher Print Preview"}
                    </span>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-2 border-s border-gray-300 ps-3 ms-1">
                        <Link
                            href={route("pallet-rearrangements.index")}
                            className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span>{lang === "ar" ? "العودة إلى السندات" : "Back to Rearrangements"}</span>
                        </Link>

                        {rearrangement.contract_id && (
                            <Link
                                href={`/contracts/${rearrangement.contract_id}`}
                                className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                            >
                                <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                                <span>{lang === "ar" ? "عرض العقد" : "View Contract"}</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href={route("pallet-rearrangements.create")}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{lang === "ar" ? "إضافة سند ترتيب جديد" : "New Rearrangement"}</span>
                    </Link>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{lang === "ar" ? "طباعة السند" : "Print Voucher"}</span>
                    </button>
                    <button
                        onClick={handleCloseOrBack}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                        {hasReferrer ? (
                            <>
                                <ArrowRight className={`h-4 w-4 ${lang === "ar" ? "rotate-0" : "rotate-180"}`} />
                                <span>{lang === "ar" ? "العودة للخلف" : "Go Back"}</span>
                            </>
                        ) : (
                            <>
                                <X className="h-4 w-4" />
                                <span>{lang === "ar" ? "إغلاق النافذة" : "Close Window"}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Document Container strictly fitting Single Page print without overflow */}
            <div className="max-w-4xl mx-auto w-full flex flex-col justify-between flex-1 space-y-3 print:space-y-2 print:h-full print:box-border">
                
                {/* ═══ TOP & MAIN CONTENT ═════════════════════════════════ */}
                <div className="space-y-3 print:space-y-2">
                    
                    {/* Header Section */}
                    <div className="flex justify-between items-start border-b border-gray-400 pb-2">
                        {/* Left: Company Logo & Info */}
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

                        {/* Right: Pallet Rearrangement Title & Serial Number */}
                        <div className="text-end space-y-0.5">
                            <h1 className="text-sm font-extrabold uppercase tracking-wide text-black">
                                {lang === "ar" ? "سند نقل وترتيب طبالي" : "Pallet Rearrangement Note"}
                            </h1>
                            <div className="text-xs font-black font-mono text-gray-900">
                                No: {rearrangement.serial_number}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] border-b border-gray-300 pb-2">
                        {/* Left Column */}
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "العميل:" : "Client:"}</span>
                                <span className="font-bold text-black">{rearrangement.customer?.name}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "العقد:" : "Contract:"}</span>
                                    <span className="font-mono font-bold text-black">{rearrangement.contract?.contract_number}</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <span className="font-bold text-gray-600">{lang === "ar" ? "الفترة:" : "P.No:"}</span>
                                    <span className="font-mono font-bold text-black">{rearrangement.period?.period_number ? String(rearrangement.period.period_number).padStart(2, '0') : '01'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "نوع العملية:" : "Operation:"}</span>
                                <span className="font-medium text-gray-900">{lang === "ar" ? "نقل وترتيب داخلي بين الطبالي" : "Internal Pallet Transfer"}</span>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "منشئ السند:" : "Issuer:"}</span>
                                <span className="font-bold text-black">{rearrangement.created_by_user?.name || user?.name || "أمين المستودع"}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "تاريخ الترتيب:" : "Date:"}</span>
                                    <span className="font-mono font-bold text-black">{rearrangement.rearrangement_date ? new Date(rearrangement.rearrangement_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <span className="font-bold text-gray-600">{lang === "ar" ? "الوردية:" : "Shift:"}</span>
                                    <span className="font-mono font-bold text-black">{rearrangement.shift || "م / M"}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "ملاحظات:" : "Note:"}</span>
                                <span className="text-[10px] text-gray-800 leading-tight">{rearrangement.notes || "—"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-1">
                        <table className="w-full text-xs text-center border-b border-gray-400">
                            <thead>
                                <tr className="border-b border-black text-black font-bold">
                                    <th className="py-1.5 text-start w-10">#</th>
                                    <th className="py-1.5 text-start">{lang === "ar" ? "الصنف (Items)" : "Items"}</th>
                                    <th className="py-1.5 w-28">{lang === "ar" ? "الدرجة (Grade)" : "Grade"}</th>
                                    <th className="py-1.5 w-32">{lang === "ar" ? "الطبلية (Pallet)" : "Pallet"}</th>
                                    <th className="py-1.5 w-28">{lang === "ar" ? "نوع الحركة (Type)" : "Type"}</th>
                                    <th className="py-1.5 w-28">{lang === "ar" ? "الكمية المنقولة (Qty)" : "Qty"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {rearrangement.items?.map((item, idx) => {
                                    const { cleanItemName, cleanVarName } = formatItemAndPackage(item);
                                    const gradeDisplay = getGradeDisplay(item);
                                    const palletFormatted = getPalletFormatted(item);
                                    const qtyIn = parseFloat(item.quantity_in || 0);
                                    const qtyOut = parseFloat(item.quantity_out || 0);
                                    const isAdd = qtyIn > 0;
                                    const val = isAdd ? qtyIn : (qtyOut > 0 ? qtyOut : parseFloat(item.quantity || 0));

                                    return (
                                        <tr key={item.id || idx} className="text-gray-900">
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
                                                {isAdd ? (
                                                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                                        {lang === "ar" ? "+ إضافة للطبلية" : "+ Add to Pallet"}
                                                    </span>
                                                ) : (
                                                    <span className="font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[10px]">
                                                        {lang === "ar" ? "- سحب من الطبلية" : "- Deduct from Pallet"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-1.5 font-mono font-bold">
                                                {Math.round(val)}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {/* Summary Row Split into 2 Equal Halves */}
                                <tr className="border-t-2 border-black font-extrabold text-black">
                                    <td colSpan="3" className="py-2 px-4 text-start font-bold">
                                        <span className="text-gray-700 me-2">{lang === "ar" ? "إجمالي بنود الحركة / Total Entries:" : "Total Entries:"}</span>
                                        <span className="font-mono text-sm font-black text-black">{totalPallets}</span>
                                    </td>
                                    <td colSpan="3" className="py-2 px-4 text-end font-bold">
                                        <span className="text-gray-700 me-2">{lang === "ar" ? "إجمالي الكمية المنقولة / Total Transferred:" : "Total Transferred:"}</span>
                                        <span className="font-mono text-sm font-black text-black">{Math.round(totalQty).toLocaleString()}</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* ═══ SIGNATURES & FOOTER PANEL (Strictly Pinned to Bottom Edge) ═════════ */}
                <div className="mt-auto pt-3 print:pt-2 space-y-2 pb-0 print:pb-0">
                    
                    {/* Signatures */}
                    <div className="grid grid-cols-3 gap-8 text-center text-xs">
                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                Storekeeper
                            </p>
                            <div className="text-start text-[11px] space-y-0.5">
                                <p className="text-gray-800 font-semibold truncate">
                                    {lang === "ar" ? "الاسم: " : "Name: "}{rearrangement.created_by_user?.name || user?.name || "________________"}
                                </p>
                                <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                Stores Manager
                            </p>
                            <div className="text-start text-[11px] space-y-0.5">
                                <p className="text-gray-800 font-semibold">{lang === "ar" ? "الاسم: ________________" : "Name: ________________"}</p>
                                <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                                Stores Admin
                            </p>
                            <div className="text-start text-[11px] space-y-0.5">
                                <p className="text-gray-800 font-semibold">{lang === "ar" ? "الاسم: " : "Name: "}{rearrangement.approved_by_user?.name || user?.name || "________________"}</p>
                                <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
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

            {/* Print CSS Rules - Strictly 1 Page A4 No Extra Blank Page */}
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
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
