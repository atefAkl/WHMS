import React, { useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer, ArrowRight, FileText } from "lucide-react";

export default function Print({ reception }) {
    const { lang } = useLang();
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
    const getSignatoryName = () => {
        if (reception.representative?.name) {
            return reception.representative.name;
        }
        if (reception.driver?.name) {
            return reception.driver.name;
        }
        return reception.customer?.name || "";
    };
    const user = usePage().props.auth.user;

    useEffect(() => {
        // Trigger print dialog automatically after component mounts and resources load
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

    // Calculate totals
    const totalQty = reception.inventory_entries?.reduce((sum, entry) => sum + parseFloat(entry.quantity_in || 0), 0) || 0;
    const totalPallets = reception.inventory_entries?.length || 0;

    return (
        <div 
            className="min-h-screen bg-white text-black p-8 font-sans" 
            dir={lang === "ar" ? "rtl" : "ltr"}
        >
            <Head title={lang === "ar" ? `طباعة سند استلام: ${reception.serial_number}` : `Print Reception: ${reception.serial_number}`} />

            {/* Print control bar - Hidden when printing */}
            <div className="print:hidden mb-6 flex justify-between items-center bg-gray-100 p-3 border border-gray-300 rounded-none">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                        {lang === "ar" ? "معاينة الطباعة لسند الاستلام" : "Reception Voucher Print Preview"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                        <Printer className="h-4 w-4" />
                        <span>{lang === "ar" ? "طباعة" : "Print"}</span>
                    </button>
                    <button
                        onClick={handleClose}
                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-none text-xs font-bold transition-all"
                    >
                        {lang === "ar" ? "إغلاق النافذة" : "Close Window"}
                    </button>
                </div>
            </div>

            {/* Document Container */}
            <div className="max-w-4xl mx-auto border-2 border-black p-8 space-y-6">
                
                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-black pb-4">
                    <div className="space-y-1">
                        <h2 className="text-lg font-black tracking-wide text-gray-900">
                            {lang === "ar" ? "نظام إدارة المستودعات الذكي" : "WHMS - Intelligent Warehouse System"}
                        </h2>
                        <p className="text-xs text-gray-600">
                            {lang === "ar" ? "إيصال استلام بضائع للمستودع" : "Warehouse Goods Reception Voucher"}
                        </p>
                    </div>
                    <div className="text-end space-y-1">
                        <div className="text-xs font-bold bg-black text-white px-3 py-1 font-mono uppercase">
                            {reception.serial_number}
                        </div>
                        <p className="text-[10px] text-gray-600 font-mono">
                            {lang === "ar" ? "حالة السند: " : "Status: "}
                            <span className="font-bold">{reception.status === "approved" ? (lang === "ar" ? "معتمد ومغلق" : "Approved") : (lang === "ar" ? "مسودة" : "Draft")}</span>
                        </p>
                    </div>
                </div>

                {/* Sub Header (Title) */}
                <div className="text-center py-2 bg-gray-100 border-y border-black">
                    <h1 className="text-xl font-extrabold uppercase tracking-widest text-gray-900">
                        {lang === "ar" ? "سند استلام بضائع" : "Goods Reception Voucher"}
                    </h1>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6 text-xs">
                    
                    {/* Column 1: Customer & Contract */}
                    <div className="space-y-2 border border-gray-400 p-3 rounded-none bg-gray-50/50">
                        <h3 className="font-bold border-b border-gray-400 pb-1 text-gray-800">
                            {lang === "ar" ? "بيانات العميل والعقد" : "Customer & Contract Details"}
                        </h3>
                        <table className="w-full text-start">
                            <tbody>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "العميل:" : "Customer:"}</td>
                                    <td className="font-bold py-1">{reception.customer?.name}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم العقد:" : "Contract No.:"}</td>
                                    <td className="font-bold font-mono py-1">{reception.contract?.contract_number}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "الفترة الإلزامية:" : "Billing Period:"}</td>
                                    <td className="font-semibold py-1">
                                        {lang === "ar" ? "الفترة" : "Period"} {reception.period?.period_number}{" "}
                                        <span className="text-[10px] text-gray-500 font-mono font-normal">
                                            ({reception.period?.start_date} - {reception.period?.end_date})
                                        </span>
                                    </td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "المستلم منه:" : "Representative:"}</td>
                                    <td className="font-semibold py-1">
                                        {reception.representative ? `${reception.representative.name} (${reception.representative.phone_number})` : "—"}
                                    </td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "تاريخ الاستلام:" : "Date Received:"}</td>
                                    <td className="font-bold font-mono py-1">
                                        {reception.reception_date ? new Date(reception.reception_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Column 2: Driver & Transport */}
                    <div className="space-y-2 border border-gray-400 p-3 rounded-none bg-gray-50/50">
                        <h3 className="font-bold border-b border-gray-400 pb-1 text-gray-800">
                            {lang === "ar" ? "بيانات السائق والنقل" : "Driver & Vehicle Details"}
                        </h3>
                        <table className="w-full text-start">
                            <tbody>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "اسم السائق:" : "Driver Name:"}</td>
                                    <td className="font-bold py-1">{reception.driver?.name || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم الجوال:" : "Phone No.:"}</td>
                                    <td className="font-bold font-mono py-1">{reception.driver?.phone_number || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم اللوحة:" : "Plate No.:"}</td>
                                    <td className="font-bold font-mono py-1">{reception.driver?.vehicle_plate || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "نوع السيارة:" : "Vehicle Type:"}</td>
                                    <td className="font-semibold py-1">{reception.driver?.vehicle_type || "—"}</td>
                                </tr>
                                <tr className="align-top">
                                    <td className="w-24 text-gray-500 font-medium py-1">{lang === "ar" ? "رقم الرخصة/الهوية:" : "License/ID No.:"}</td>
                                    <td className="font-mono py-1">
                                        {reception.driver?.license_number || reception.driver?.id_number || "—"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* Items Table */}
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        {lang === "ar" ? "تفاصيل الأصناف والكميات المستلمة" : "Received Products & Quantities"}
                    </h3>
                    <table className="w-full text-xs border border-collapse border-black">
                        <thead>
                            <tr className="bg-gray-100 border-b border-black">
                                <th className="border border-black px-3 py-2 text-start w-12">{lang === "ar" ? "م" : "#"}</th>
                                <th className="border border-black px-3 py-2 text-start">{lang === "ar" ? "الصنف المخزني" : "Inventory Item"}</th>
                                <th className="border border-black px-3 py-2 text-start w-32">{lang === "ar" ? "الشكل/البديل" : "Variant"}</th>
                                <th className="border border-black px-3 py-2 text-start w-32">{lang === "ar" ? "رقم الطبلية" : "Pallet Number"}</th>
                                <th className="border border-black px-3 py-2 text-end w-28">{lang === "ar" ? "الكمية" : "Quantity"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reception.inventory_entries?.map((entry, idx) => (
                                <tr key={entry.id} className="border-b border-black">
                                    <td className="border border-black px-3 py-2 font-mono">{idx + 1}</td>
                                    <td className="border border-black px-3 py-2 font-bold">{displayBilingual(entry.inventory_item?.name)}</td>
                                    <td className="border border-black px-3 py-2 text-gray-600">
                                        {displayBilingual(entry.variant?.name)}{entry.variant?.quality ? ` (${displayBilingual(entry.variant.quality)})` : ""}
                                    </td>
                                    <td className="border border-black px-3 py-2 font-mono font-bold">
                                        {entry.pallet?.pallet_number ? `${entry.pallet.pallet_number} / ${getPalletSizeDisplay(entry.pallet)}` : "—"}
                                    </td>
                                    <td className="border border-black px-3 py-2 font-mono font-bold text-end">
                                        {Math.round(parseFloat(entry.quantity_in))}
                                    </td>
                                </tr>
                            ))}
                            {/* Totals Row */}
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan="3" className="border border-black px-3 py-2 text-end">
                                    {lang === "ar" ? "الإجمالي الكلي" : "Grand Total"}
                                </td>
                                <td className="border border-black px-3 py-2 font-mono">
                                    {totalPallets} {lang === "ar" ? "طبلية" : "Pallets"}
                                </td>
                                <td className="border border-black px-3 py-2 font-mono text-end">
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
                                {lang === "ar" ? "الاسم: " : "Name: "}{getSignatoryName()}
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
                        <span>{reception.id}</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
