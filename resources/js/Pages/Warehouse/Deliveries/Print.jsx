import React, { useEffect } from "react";
import { Head, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, FileText, FileCheck, List } from "lucide-react";

export default function Print({ delivery, companySettings = {} }) {
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
    const totalQty = delivery.inventory_entries?.reduce((sum, entry) => sum + parseFloat(entry.quantity_out || 0), 0) || 0;
    const totalPallets = delivery.inventory_entries?.length || 0;

    // Helper: Format item name, extract capacity/weight, and format package column
    const formatItemAndPackage = (entry) => {
        let rawItemName = displayBilingual(entry.inventoryItem?.name || entry.inventory_item?.name) || "";
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

    // Company info & metadata defaults
    const compName = companySettings.company_name || "مخازن أيمن محمد عبد الله الغماس للتخزين";
    const compSlogan = companySettings.company_slogan || "تخزين - تبريد - تجميد - تعبئة وتغليف - بيع - تصدير";
    const compCr = companySettings.company_cr || "1131305092";
    const compPhone = companySettings.company_phone || "0568562615";
    const compAddress = companySettings.company_address || "1131 - القصيم / ضراس - طريق الملك فهد";
    const compLogo = companySettings.company_logo || null;

    return (
        <div 
            className="min-h-screen bg-white text-black p-4 sm:p-6 font-sans text-xs print:p-0 print:m-0 print:h-full print:overflow-hidden flex flex-col justify-between" 
            dir={lang === "ar" ? "rtl" : "ltr"}
            style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
        >
            <Head title={lang === "ar" ? `طباعة سند تسليم وخروج: ${delivery.serial_number}` : `Print Delivery: ${delivery.serial_number}`} />

            {/* Print Control Bar - Hidden when printing */}
            <div className="print:hidden mb-6 flex flex-wrap justify-between items-center bg-gray-50 p-3 border border-gray-200 rounded-xl gap-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        {lang === "ar" ? "معاينة طباعة سند تسليم وخروج البضائع" : "Goods Delivery & Exit Voucher Print Preview"}
                    </span>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-2 border-s border-gray-300 ps-3 ms-1">
                        <Link
                            href={route("deliveries.index")}
                            className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition-all"
                        >
                            <List className="h-3.5 w-3.5" />
                            <span>{lang === "ar" ? "العودة إلى السندات" : "Back to Deliveries"}</span>
                        </Link>

                        {delivery.contract_id && (
                            <Link
                                href={`/contracts/${delivery.contract_id}`}
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

                        {/* Right: Goods Delivery Title & Serial Number */}
                        <div className="text-end space-y-0.5">
                            <h1 className="text-sm font-extrabold uppercase tracking-wide text-black">
                                {lang === "ar" ? "سند تسليم وخروج بضائع" : "Goods Delivery Note"}
                            </h1>
                            <div className="text-xs font-black font-mono text-gray-900">
                                No: {delivery.serial_number}
                            </div>
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[11px] border-b border-gray-300 pb-2">
                        {/* Left Column */}
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "العميل:" : "Client:"}</span>
                                <span className="font-bold text-black">{delivery.customer?.name}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "العقد:" : "Contract:"}</span>
                                    <span className="font-mono font-bold text-black">{delivery.contract?.contract_number}</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <span className="font-bold text-gray-600">{lang === "ar" ? "الفترة:" : "P.No:"}</span>
                                    <span className="font-mono font-bold text-black">{delivery.period?.period_number ? String(delivery.period.period_number).padStart(2, '0') : '01'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "المستلم / المندوب:" : "Recipient:"}</span>
                                <span className="font-medium text-gray-900">{delivery.representative?.name || delivery.driver?.name || delivery.recipient_name || "—"}</span>
                            </div>
                            {delivery.exit_authorization && (
                                <div className="flex gap-2">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "إذن الخروج:" : "Exit Permit:"}</span>
                                    <span className="font-mono font-bold text-blue-800">{delivery.exit_authorization.serial_number}</span>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-1">
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "المشرف / المسلم:" : "Issuer:"}</span>
                                <span className="font-bold text-black">{delivery.created_by_user?.name || user?.name || "أمين المستودع"}</span>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex gap-2 flex-1">
                                    <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "تاريخ الخروج:" : "Date:"}</span>
                                    <span className="font-mono font-bold text-black">{delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <span className="font-bold text-gray-600">{lang === "ar" ? "الوردية:" : "Shift:"}</span>
                                    <span className="font-mono font-bold text-black">{delivery.shift || "م / M"}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-bold text-gray-600 w-24 shrink-0">{lang === "ar" ? "ملاحظات:" : "Note:"}</span>
                                <span className="text-[10px] text-gray-800 leading-tight">{delivery.notes || "—"}</span>
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
                                    <th className="py-1.5 w-32">{lang === "ar" ? "الدرجة (Grade)" : "Grade"}</th>
                                    <th className="py-1.5 w-36">{lang === "ar" ? "الطبلية (Table)" : "Table"}</th>
                                    <th className="py-1.5 w-32">{lang === "ar" ? "العبوة (Box)" : "Box"}</th>
                                    <th className="py-1.5 w-24">{lang === "ar" ? "الكمية المخرجة (Total)" : "Total"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                                {delivery.inventory_entries && delivery.inventory_entries.length > 0 ? (
                                    delivery.inventory_entries.map((entry, index) => {
                                        const { cleanItemName, finalBoxDisplay } = formatItemAndPackage(entry);
                                        const gradeDisplay = getGradeDisplay(entry);
                                        const palletDisplay = getPalletFormatted(entry);

                                        return (
                                            <tr key={index} className="text-[11px] font-medium text-black">
                                                <td className="py-1 text-start font-mono text-gray-700">{index + 1}</td>
                                                <td className="py-1 text-start font-bold text-black">{cleanItemName}</td>
                                                <td className="py-1 font-semibold text-gray-800">{gradeDisplay}</td>
                                                <td className="py-1 font-mono font-semibold text-gray-800">{palletDisplay}</td>
                                                <td className="py-1 font-semibold text-gray-800">{finalBoxDisplay}</td>
                                                <td className="py-1 font-mono font-black text-black text-xs">
                                                    {parseFloat(entry.quantity_out || 0).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-4 text-center text-gray-500 font-bold italic">
                                            {lang === "ar" ? "لا توجد بنود في هذا السند" : "No items recorded in this delivery note"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {/* Summary Footer */}
                            <tfoot className="border-t-2 border-black font-bold">
                                <tr>
                                    <td colSpan="3" className="py-1.5 text-start font-bold text-black">
                                        {lang === "ar" ? "الإجمالي العام (Total Summary)" : "Total Summary"}
                                    </td>
                                    <td className="py-1.5 font-mono text-black font-bold">
                                        {lang === "ar" ? `${totalPallets} طبلية` : `${totalPallets} Pallets`}
                                    </td>
                                    <td className="py-1.5"></td>
                                    <td className="py-1.5 font-mono font-black text-black text-sm">
                                        {totalQty.toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* ═══ BOTTOM SIGNATURES SECTION ═══════════════════════════ */}
                <div className="pt-2 border-t border-gray-400 space-y-4 print:pt-1">
                    <div className="grid grid-cols-3 gap-4 text-center text-[11px]">
                        {/* Box 1: Receiver */}
                        <div className="border border-gray-400 p-2 space-y-3 bg-gray-50/50">
                            <span className="font-bold text-black block border-b border-gray-300 pb-1">
                                {lang === "ar" ? "مستلم البضاعة (السائق / المندوب)" : "Recipient / Driver"}
                            </span>
                            <div className="text-start space-y-1 text-[10px] text-gray-800 min-h-[35px]">
                                <div><span className="font-semibold text-gray-600">{lang === "ar" ? "الاسم:" : "Name:"}</span> <span className="font-bold">{delivery.representative?.name || delivery.driver?.name || delivery.recipient_name || "—"}</span></div>
                                <div><span className="font-semibold text-gray-600">{lang === "ar" ? "التوقيع:" : "Sign:"}</span> ............................................</div>
                            </div>
                        </div>

                        {/* Box 2: Warehouse Keeper */}
                        <div className="border border-gray-400 p-2 space-y-3 bg-gray-50/50">
                            <span className="font-bold text-black block border-b border-gray-300 pb-1">
                                {lang === "ar" ? "أمين المستودع (المُسلّم)" : "Warehouse Storekeeper"}
                            </span>
                            <div className="text-start space-y-1 text-[10px] text-gray-800 min-h-[35px]">
                                <div><span className="font-semibold text-gray-600">{lang === "ar" ? "الاسم:" : "Name:"}</span> <span className="font-bold">{delivery.created_by_user?.name || user?.name || "أمين المستودع"}</span></div>
                                <div><span className="font-semibold text-gray-600">{lang === "ar" ? "التوقيع:" : "Sign:"}</span> ............................................</div>
                            </div>
                        </div>

                        {/* Box 3: Warehouse Manager */}
                        <div className="border border-gray-400 p-2 space-y-3 bg-gray-50/50">
                            <span className="font-bold text-black block border-b border-gray-300 pb-1">
                                {lang === "ar" ? "اعتماد مدير المستودع" : "Warehouse Manager"}
                            </span>
                            <div className="text-start space-y-1 text-[10px] text-gray-800 min-h-[35px]">
                                <div><span className="font-semibold text-gray-600">{lang === "ar" ? "الاعتماد:" : "Approve:"}</span> <span className="font-bold">معتمد ومسجل إلكترونياً</span></div>
                                <div><span className="font-semibold text-gray-600">{lang === "ar" ? "التوقيع:" : "Sign:"}</span> ............................................</div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Address & Print Stamp */}
                    <div className="flex justify-between items-center text-[9px] text-gray-600 border-t border-gray-300 pt-1 font-mono">
                        <div>{compAddress}</div>
                        <div>
                            {lang === "ar" ? "تاريخ ووقت الطباعة: " : "Printed at: "}
                            {new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
