import React, { useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, ArrowRight } from "lucide-react";

export default function BulkPrint({ vouchers = [], contract }) {
    const { lang } = useLang();
    const user = usePage().props.auth.user;

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    const getPalletSizeDisplay = (pallet) => {
        if (!pallet || !pallet.size) return "";
        const sizeMap = {
            'كبيرة': lang === 'ar' ? 'كبيرة' : 'Large',
            'وسط': lang === 'ar' ? 'وسط' : 'Medium',
            'صغيرة': lang === 'ar' ? 'صغيرة' : 'Small',
            'خشب': lang === 'ar' ? 'خشب' : 'Wood',
            'بلاستيك': lang === 'ar' ? 'بلاستيك' : 'Plastic',
        };
        return sizeMap[pallet.size] || pallet.size;
    };

    const getSignatoryName = (voucher) => {
        if (voucher.representative?.name) {
            return voucher.representative.name;
        }
        if (voucher.driver?.name) {
            return voucher.driver.name;
        }
        return voucher.customer?.name || "";
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const handleClose = () => {
        window.close();
    };

    const renderDocumentCopy = (voucher, copyTitle) => {
        const isReception = voucher.voucher_type === 'reception';
        const entries = voucher.inventory_entries || [];
        const totalQty = entries.reduce(
            (sum, entry) => sum + parseFloat(isReception ? (entry.quantity_in || 0) : (entry.quantity_out || 0)), 
            0
        );
        const totalPallets = entries.length;

        return (
            <div className="max-w-4xl mx-auto border-2 border-black p-8 space-y-6 bg-white text-black font-sans relative my-4">
                {/* Copy Title indicator */}
                <div className="absolute top-4 right-8 text-[10px] font-bold bg-gray-200 px-2 py-0.5 border border-gray-400 font-mono uppercase">
                    {copyTitle}
                </div>

                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4 pt-2">
                    <div className="space-y-1 text-start">
                        <h2 className="text-lg font-black tracking-wide text-gray-900">
                            {lang === "ar" ? "نظام إدارة المستودعات الذكي" : "WHMS - Intelligent Warehouse System"}
                        </h2>
                        <p className="text-xs text-gray-600">
                            {isReception 
                                ? (lang === "ar" ? "إيصال استلام بضائع للمستودع" : "Warehouse Goods Reception Voucher")
                                : (lang === "ar" ? "سند خروج وتسليم بضاعة" : "Warehouse Goods Delivery Note")}
                        </p>
                    </div>
                    <div className="text-end space-y-1">
                        <div className="text-xs font-bold bg-black text-white px-3 py-1 font-mono uppercase">
                            {voucher.serial_number}
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono">
                            {lang === "ar" ? "حالة السند: " : "Status: "}
                            <span className="font-bold">
                                {voucher.status === "approved" 
                                    ? (lang === "ar" ? "معتمد ومغلق" : "Approved") 
                                    : (lang === "ar" ? "مسودة" : "Draft")}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Sub Header (Title) */}
                <div className="text-center py-2 bg-gray-100 border-y border-black">
                    <h1 className="text-xl font-extrabold uppercase tracking-widest text-gray-900">
                        {isReception 
                            ? (lang === "ar" ? "سند استلام بضائع" : "Goods Reception Voucher")
                            : (lang === "ar" ? "سند خروج بضاعة (تسليم للعميل)" : "Goods Delivery Note")}
                    </h1>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs text-start">
                    {/* Column 1: Customer & Contract */}
                    <div className="space-y-2 border border-gray-400 p-3 rounded-none bg-gray-50/50">
                        <h3 className="font-bold border-b border-gray-400 pb-1 text-gray-800">
                            {lang === "ar" ? "بيانات العميل والعقد" : "Customer & Contract Details"}
                        </h3>
                        <table className="w-full text-start">
                            <tbody>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "العميل:" : "Customer:"}</td>
                                    <td className="font-bold py-1">{voucher.customer?.name}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم العقد:" : "Contract No.:"}</td>
                                    <td className="font-bold font-mono py-1">{voucher.contract?.contract_number}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">
                                        {isReception ? (lang === "ar" ? "الفترة الإلزامية:" : "Billing Period:") : (lang === "ar" ? "فترة التسليم:" : "Billing Period:")}
                                    </td>
                                    <td className="font-semibold py-1">
                                        {lang === "ar" ? "الفترة" : "Period"} {voucher.period?.period_number}{" "}
                                        <span className="text-[10px] text-gray-500 font-mono font-normal">
                                            ({voucher.period?.start_date} - {voucher.period?.end_date})
                                        </span>
                                    </td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">
                                        {isReception ? (lang === "ar" ? "المستلم منه:" : "Representative:") : (lang === "ar" ? "مندوب الاستلام:" : "Representative:")}
                                    </td>
                                    <td className="font-semibold py-1">
                                        {voucher.representative ? `${voucher.representative.name} (${voucher.representative.phone_number})` : "—"}
                                    </td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">
                                        {isReception ? (lang === "ar" ? "تاريخ الاستلام:" : "Date Received:") : (lang === "ar" ? "تاريخ الخروج:" : "Delivery Date:")}
                                    </td>
                                    <td className="font-bold font-mono py-1">
                                        {isReception 
                                            ? (voucher.reception_date ? new Date(voucher.reception_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—")
                                            : (voucher.delivery_date ? new Date(voucher.delivery_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—")
                                        }
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Column 2: Driver & Transport / Permit */}
                    <div className="space-y-2 border border-gray-400 p-3 rounded-none bg-gray-50/50">
                        <h3 className="font-bold border-b border-gray-400 pb-1 text-gray-800">
                            {isReception 
                                ? (lang === "ar" ? "بيانات السائق والنقل" : "Driver & Vehicle Details")
                                : (lang === "ar" ? "بيانات النقل والمرجع" : "Transport & Reference Details")}
                        </h3>
                        <table className="w-full text-start">
                            <tbody>
                                {!isReception && (
                                    <tr className="align-top">
                                        <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "المرجع/الإذن:" : "Permit / Ref:"}</td>
                                        <td className="font-bold py-1">
                                            {voucher.exit_authorization 
                                                ? `${lang === "ar" ? "إذن خروج" : "Exit Permit"} ${voucher.exit_authorization.serial_number}` 
                                                : voucher.written_reference || "—"}
                                        </td>
                                    </tr>
                                )}
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "اسم السائق:" : "Driver Name:"}</td>
                                    <td className="font-bold py-1">{voucher.driver?.name || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم الجوال:" : "Phone No.:"}</td>
                                    <td className="font-bold font-mono py-1">{voucher.driver?.phone_number || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم اللوحة:" : "Plate No.:"}</td>
                                    <td className="font-bold font-mono py-1">{voucher.driver?.vehicle_plate || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "نوع السيارة:" : "Vehicle Type:"}</td>
                                    <td className="font-semibold py-1">{voucher.driver?.vehicle_type || "—"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notes if present */}
                {voucher.notes && (
                    <div className="border border-gray-400 p-3 text-xs bg-gray-50/50 text-start">
                        <span className="font-bold text-gray-700 block mb-1">{lang === "ar" ? "ملاحظات السند:" : "Remarks:"}</span>
                        <p className="leading-relaxed">{voucher.notes}</p>
                    </div>
                )}

                {/* Items Table */}
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider text-start">
                        {isReception 
                            ? (lang === "ar" ? "تفاصيل الأصناف والكميات المستلمة" : "Received Products & Quantities")
                            : (lang === "ar" ? "تفاصيل الأصناف والكميات المصروفة" : "Delivered Products & Quantities")}
                    </h3>
                    <table className="w-full text-xs border border-collapse border-black">
                        <thead>
                            <tr className="bg-gray-100 border-b border-black">
                                <th className="border border-black px-3 py-2 text-start w-12">{lang === "ar" ? "م" : "#"}</th>
                                <th className="border border-black px-3 py-2 text-start">{lang === "ar" ? "الصنف المخزني" : "Inventory Item"}</th>
                                <th className="border border-black px-3 py-2 text-start w-32">{lang === "ar" ? "الشكل/العبوة" : "Variant"}</th>
                                <th className="border border-black px-3 py-2 text-start w-32">{lang === "ar" ? "رقم الطبلية" : "Pallet Number"}</th>
                                <th className="border border-black px-3 py-2 text-end w-28">{lang === "ar" ? "الكمية" : "Quantity"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry, idx) => (
                                <tr key={entry.id} className="border-b border-black text-start">
                                    <td className="border border-black px-3 py-2 font-mono">{idx + 1}</td>
                                    <td className="border border-black px-3 py-2 font-bold">{displayBilingual(entry.inventory_item?.name)}</td>
                                    <td className="border border-black px-3 py-2 text-gray-600">
                                        {displayBilingual(entry.variant?.name)}{entry.variant?.quality ? ` (${displayBilingual(entry.variant.quality)})` : ""}
                                    </td>
                                    <td className="border border-black px-3 py-2 font-mono font-bold">
                                        {entry.pallet?.pallet_number ? `${entry.pallet.pallet_number} / ${getPalletSizeDisplay(entry.pallet)}` : "—"}
                                    </td>
                                    <td className={`border border-black px-3 py-2 font-mono font-bold text-end ${!isReception ? 'text-red-600' : ''}`}>
                                        {Math.round(parseFloat(isReception ? (entry.quantity_in || 0) : (entry.quantity_out || 0)))}
                                    </td>
                                </tr>
                            ))}
                            {/* Totals Row */}
                            <tr className="bg-gray-100 font-bold text-start">
                                <td colSpan="3" className="border border-black px-3 py-2 text-end">
                                    {isReception ? (lang === "ar" ? "الإجمالي الكلي" : "Grand Total") : (lang === "ar" ? "الإجمالي الكلي للمنصرف" : "Grand Total Out")}
                                </td>
                                <td className="border border-black px-3 py-2 font-mono">
                                    {totalPallets} {lang === "ar" ? "طبلية" : "Pallets"}
                                </td>
                                <td className={`border border-black px-3 py-2 font-mono text-end ${!isReception ? 'text-red-700' : ''}`}>
                                    {Math.round(totalQty).toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signatures Panel */}
                <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs">
                    <div className="space-y-12">
                        <p className="font-bold text-gray-700">{lang === "ar" ? "توقيع العميل / المستلم" : "Customer / Recipient Signature"}</p>
                        <div className="pt-2 mx-6 text-start">
                            <p className="font-semibold text-[11px] text-gray-950 mb-6">
                                {lang === "ar" ? "الاسم: " : "Name: "}{getSignatoryName(voucher)}
                            </p>
                            <div className="border-t border-dashed border-black pt-1">
                                <span className="text-[10px] text-gray-400 font-mono">{lang === "ar" ? "التوقيع" : "Signature"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-12">
                        <p className="font-bold text-gray-700">{lang === "ar" ? "توقيع أمين المخزن" : "Storekeeper Signature"}</p>
                        <div className="border-t border-dashed border-black pt-2 mx-6 mt-[42px]">
                            <span className="text-[10px] text-gray-400 font-mono">{lang === "ar" ? "التوقيع والاسم" : "Signature & Name"}</span>
                        </div>
                    </div>
                    <div className="space-y-12">
                        <p className="font-bold text-gray-700">{lang === "ar" ? "توقيع إدارة المخازن" : "Warehouse Management Signature"}</p>
                        <div className="border-t border-dashed border-black pt-2 mx-6 mt-[42px]">
                            <span className="text-[10px] text-gray-400 font-mono">{lang === "ar" ? "التوقيع والاسم" : "Signature & Name"}</span>
                        </div>
                    </div>
                </div>

                {/* Print Footer Metadata */}
                <div className="border-t border-gray-300 pt-3 mt-8 flex justify-between items-center text-[9px] text-gray-500 font-mono">
                    <div>
                        <span>{lang === "ar" ? "طبع بواسطة: " : "Printed by: "}</span>
                        <span className="font-bold">{user?.name}</span>
                    </div>
                    <div>
                        <span>{lang === "ar" ? "تاريخ الطباعة: " : "Print Date: "}</span>
                        <span>{new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</span>
                    </div>
                    <div>
                        <span>{lang === "ar" ? "معرّف السند: " : "Voucher ID: "}</span>
                        <span>{voucher.id}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div 
            className="min-h-screen bg-white text-black p-8 font-sans" 
            dir={lang === "ar" ? "rtl" : "ltr"}
        >
            <Head title={lang === "ar" ? "طباعة مجمعة للسندات" : "Bulk Print Vouchers"} />

            {/* Print control bar - Hidden when printing */}
            <div className="print:hidden mb-6 flex justify-between items-center bg-gray-100 p-3 border border-gray-300 rounded-none">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 text-start">
                        {lang === "ar" 
                            ? `معاينة الطباعة المجمعة لعدد (${vouchers.length}) سند (نسختين لكل سند)` 
                            : `Bulk Print Preview for (${vouchers.length}) vouchers (2 copies each)`}
                    </span>
                </div>
                <div className="flex items-center gap-2 font-bold">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{lang === "ar" ? "طباعة الكل" : "Print All"}</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-none text-xs font-bold transition-all"
                    >
                        {lang === "ar" ? "إغلاق" : "Close"}
                    </button>
                </div>
            </div>

            {/* Print Container */}
            {vouchers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-bold">
                    {lang === "ar" ? "لم يتم تحديد أي سندات للطباعة" : "No vouchers selected for printing"}
                </div>
            ) : (
                <div className="space-y-16">
                    {vouchers.map((voucher, idx) => (
                        <React.Fragment key={`${voucher.voucher_type}-${voucher.id}`}>
                            {/* Copy 1: Customer Copy */}
                            {renderDocumentCopy(voucher, lang === "ar" ? "نسخة العميل" : "Customer Copy")}

                            {/* Print Break between copies */}
                            <div className="page-break" style={{ pageBreakAfter: "always", breakAfter: "page" }}></div>

                            {/* Copy 2: Warehouse Copy */}
                            {renderDocumentCopy(voucher, lang === "ar" ? "نسخة المستودع (التوقيع)" : "Warehouse Copy (Signature)")}

                            {/* Print Break between vouchers (if not last) */}
                            {idx < vouchers.length - 1 && (
                                <div className="page-break" style={{ pageBreakAfter: "always", breakAfter: "page" }}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
