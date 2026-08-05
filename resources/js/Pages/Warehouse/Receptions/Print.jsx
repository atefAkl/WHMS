import React, { useEffect } from "react";
import { Head, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, FileText, ArrowRight, FileCheck, List } from "lucide-react";

export default function Print({ reception, companySettings = {} }) {
    const { lang } = useLang();
    const user = usePage().props.auth.user;

    useEffect(() => {
        // Trigger print dialog automatically after component mounts
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        window.close();
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

    // Company info & metadata defaults
    const compName = companySettings.company_name || "اسم الشركة / المستودع الرئيسي";
    const compSlogan = companySettings.company_slogan || "نشاط الشركة / الشعار الرسمي";
    const compCr = companySettings.company_cr || "123456778";
    const compPhone = companySettings.company_phone || "0504121544";
    const compEmail = companySettings.company_email || "dsds@ljkhs.com";
    const compAddress = companySettings.company_address || "Company Nat Address";
    const compWebsite = companySettings.company_website || "https:web.site";
    const compLogo = companySettings.company_logo || null;

    return (
        <div 
            className="min-h-screen bg-white text-black p-4 sm:p-8 font-sans text-xs print:p-0 print:m-0" 
            dir={lang === "ar" ? "rtl" : "ltr"}
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <Head title={lang === "ar" ? `طباعة سند استلام: ${reception.serial_number}` : `Print Reception: ${reception.serial_number}`} />

            {/* Print Control Bar - Hidden when printing */}
            <div className="print:hidden mb-6 flex flex-wrap justify-between items-center bg-gray-50 p-3 border border-gray-200 rounded-xl gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        {lang === "ar" ? "معاينة طباعة سند استلام البضاعة" : "Goods Reception Voucher Print Preview"}
                    </span>

                    {/* Navigation Links requested by user */}
                    <div className="flex items-center gap-2 border-s border-gray-300 ps-3 ms-1">
                        <Link
                            href={route("receptions.index")}
                            className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span>{lang === "ar" ? "العودة إلى السندات" : "Back to Receptions"}</span>
                        </Link>

                        {reception.contract_id && (
                            <Link
                                href={`/contracts/${reception.contract_id}`}
                                className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                            >
                                <FileCheck className="h-3.5 w-3.5 text-blue-600" />
                                <span>{lang === "ar" ? "عرض العقد" : "View Contract"}</span>
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{lang === "ar" ? "طباعة السند" : "Print Voucher"}</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition-all"
                    >
                        {lang === "ar" ? "إغلاق النافذة" : "Close Window"}
                    </button>
                </div>
            </div>

            {/* Clean & Simplified Document Container (No heavy outer boxes) */}
            <div className="max-w-4xl mx-auto space-y-5 print:space-y-4">
                
                {/* ═══ HEADER SECTION (Clean Layout) ═══════════════════════ */}
                <div className="flex justify-between items-start border-b border-gray-400 pb-4">
                    {/* Left: Company Logo & Info */}
                    <div className="flex items-center gap-3">
                        {compLogo ? (
                            <img src={compLogo} alt="Logo" className="w-14 h-14 object-contain" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-300">
                                <FileText className="h-6 w-6 text-gray-800" />
                            </div>
                        )}
                        <div className="space-y-0.5 text-start">
                            <h2 className="font-black text-sm text-black leading-snug">
                                {compName}
                            </h2>
                            <p className="text-[11px] text-gray-600 font-medium">
                                {compSlogan}
                            </p>
                            <p className="text-[10px] text-gray-700 font-mono">
                                CR: <span className="font-bold">{compCr}</span> &nbsp;|&nbsp; TEL: <span className="font-bold">{compPhone}</span>
                            </p>
                        </div>
                    </div>

                    {/* Right: Goods Receipt Title & Serial Number */}
                    <div className="text-end space-y-0.5">
                        <h1 className="text-base font-extrabold uppercase tracking-wide text-black">
                            {lang === "ar" ? "سند استلام بضائع" : "Goods Receipt"}
                        </h1>
                        <div className="text-sm font-black font-mono text-gray-900">
                            No: {reception.serial_number}
                        </div>
                    </div>
                </div>

                {/* ═══ METADATA GRID (Simple Bordered Rows) ═══════════════ */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs border-b border-gray-300 pb-4">
                    
                    {/* Left Column */}
                    <div className="space-y-1.5">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "العميل:" : "Client:"}</span>
                            <span className="font-bold text-black">{reception.customer?.name}</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex gap-2 flex-1">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "العقد:" : "Contract:"}</span>
                                <span className="font-mono font-bold text-black">{reception.contract?.contract_number}</span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <span className="font-bold text-gray-600">{lang === "ar" ? "الفترة:" : "P.No:"}</span>
                                <span className="font-mono font-bold text-black">{reception.period?.period_number ? String(reception.period.period_number).padStart(2, '0') : '01'}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "المندوب:" : "Represent:"}</span>
                            <span className="font-medium text-gray-900">{reception.representative?.name || reception.driver?.name || "—"}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "المصدر:" : "Source:"}</span>
                            <span className="font-medium text-gray-900">{reception.source_farm || reception.notes || "حسب تخصيص العميل"}</span>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-1.5">
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "عناية / المستلم:" : "Att:"}</span>
                            <span className="font-bold text-black">{reception.recipient_name || user?.name || "أمين المستودع"}</span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex gap-2 flex-1">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "تاريخ الاستلام:" : "Date:"}</span>
                                <span className="font-mono font-bold text-black">{reception.reception_date ? new Date(reception.reception_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</span>
                            </div>
                            <div className="flex gap-1 shrink-0">
                                <span className="font-bold text-gray-600">{lang === "ar" ? "الوردية:" : "Shift:"}</span>
                                <span className="font-mono font-bold text-black">{reception.shift || "م / M"}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "ملاحظات:" : "Note:"}</span>
                            <span className="text-[11px] text-gray-800 leading-tight">{reception.notes || "تسجيل ملاحظات الجودة والحالة العامة للبضاعة"}</span>
                        </div>
                    </div>

                </div>

                {/* ═══ ITEMS TABLE (Clean Simple Lines) ═══════════════════ */}
                <div className="space-y-1">
                    <table className="w-full text-xs text-center border-b border-gray-400">
                        <thead>
                            <tr className="border-b border-black text-black font-bold">
                                <th className="py-2 text-start w-10">#</th>
                                <th className="py-2 text-start">{lang === "ar" ? "الصنف (Items)" : "Items"}</th>
                                <th className="py-2 w-28">{lang === "ar" ? "الطبلية (Table)" : "Table"}</th>
                                <th className="py-2 w-28">{lang === "ar" ? "الحجم (Size)" : "Size"}</th>
                                <th className="py-2 w-24">{lang === "ar" ? "العبوة (Box)" : "Box"}</th>
                                <th className="py-2 w-24">{lang === "ar" ? "الإجمالي (Total)" : "Total"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {reception.inventory_entries?.map((entry, idx) => {
                                const sizeDisplay = entry.variant?.size || entry.variant?.quality || entry.pallet?.size || "—";
                                const boxDisplay = entry.variant?.unit || entry.variant?.package_type || "كرتون";
                                return (
                                    <tr key={entry.id || idx} className="text-gray-900">
                                        <td className="py-2 text-start font-mono">{String(idx + 1).padStart(2, '0')}</td>
                                        <td className="py-2 text-start font-bold">
                                            {displayBilingual(entry.inventory_item?.name)}
                                            {entry.variant?.name ? <span className="text-gray-500 text-[10px] font-normal block">{displayBilingual(entry.variant.name)}</span> : null}
                                        </td>
                                        <td className="py-2 font-mono font-bold">
                                            {entry.pallet?.pallet_number || "—"}
                                        </td>
                                        <td className="py-2 font-medium">
                                            {sizeDisplay}
                                        </td>
                                        <td className="py-2 font-medium">
                                            {boxDisplay}
                                        </td>
                                        <td className="py-2 font-mono font-bold">
                                            {Math.round(parseFloat(entry.quantity_in || 0))}
                                        </td>
                                    </tr>
                                );
                            })}

                            {/* Summary Row */}
                            <tr className="border-t-2 border-black font-extrabold text-black">
                                <td colSpan="2" className="py-2.5 text-center">
                                    {lang === "ar" ? "Total Tables / إجمالي الطبالي:" : "Total Tables:"}
                                </td>
                                <td className="py-2.5 font-mono text-sm">
                                    {totalPallets}
                                </td>
                                <td colSpan="2" className="py-2.5 text-center">
                                    {lang === "ar" ? "Total Box / إجمالي العبوات:" : "Total Box:"}
                                </td>
                                <td className="py-2.5 font-mono text-sm">
                                    {Math.round(totalQty).toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ═══ SIGNATURES PANEL (Minimal Lines) ═══════════════════ */}
                <div className="grid grid-cols-3 gap-8 pt-8 text-center text-xs">
                    <div className="space-y-8">
                        <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                            Client/Represent
                        </p>
                        <div className="text-start text-[11px] space-y-1">
                            <p className="text-gray-800 font-semibold truncate">
                                {lang === "ar" ? "الاسم: " : "Name: "}{reception.representative?.name || reception.customer?.name || "________________"}
                            </p>
                            <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                            Stores Manager
                        </p>
                        <div className="text-start text-[11px] space-y-1">
                            <p className="text-gray-800 font-semibold">{lang === "ar" ? "الاسم: ________________" : "Name: ________________"}</p>
                            <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <p className="font-bold text-gray-800 border-b border-gray-300 pb-1">
                            Stores Admin
                        </p>
                        <div className="text-start text-[11px] space-y-1">
                            <p className="text-gray-800 font-semibold">{lang === "ar" ? "الاسم: " : "Name: "}{user?.name || "________________"}</p>
                            <p className="text-gray-400 font-mono">{lang === "ar" ? "التوقيع: ________________" : "Signature: ________________"}</p>
                        </div>
                    </div>
                </div>

                {/* ═══ FOOTER METADATA ═════════════════════════════════════ */}
                <div className="border-t border-gray-300 pt-3 mt-6 text-center text-[10px] text-gray-600 space-y-0.5">
                    <p className="font-medium">
                        {compAddress} – Phone: <span className="font-mono font-bold">{compPhone}</span> Email: <span className="font-mono">{compEmail}</span> <span className="font-mono">{compWebsite}</span>
                    </p>
                </div>

            </div>
        </div>
    );
}
