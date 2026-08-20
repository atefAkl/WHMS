import React from "react";
import { useLang } from "@/Contexts/LanguageContext";

export default function ItemsPrintReport({ contract, items = [], onClose }) {
    const { lang } = useLang();

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:p-0">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 12mm 10mm 12mm;
                    }
                    html, body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .items-print-container {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                    }
                    .items-print-container table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                    }
                    .items-print-container tr {
                        page-break-inside: avoid !important;
                    }
                }
            ` }} />

            {/* Screen Toolbar */}
            <div className="print:hidden sticky top-0 bg-slate-900 text-white p-4 shadow-xl border-b border-slate-700 flex justify-between items-center max-w-5xl mx-auto my-4 rounded-lg">
                <div className="text-start">
                    <h2 className="text-sm font-extrabold">
                        {lang === "ar" ? "معاينة طباعة تقرير الأصناف (A4 رأسي)" : "Stored Items Print Preview (A4 Portrait)"}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {lang === "ar" ? `العقد رقم: ${contract?.contract_number}` : `Contract No: ${contract?.contract_number}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md shadow transition-all"
                    >
                        {lang === "ar" ? "طباعة التقرير" : "Print Report"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-md transition-all"
                    >
                        {lang === "ar" ? "إغلاق" : "Close"}
                    </button>
                </div>
            </div>

            {/* Printable Report Canvas */}
            <div className="max-w-4xl mx-auto bg-white text-black p-8 shadow-2xl my-6 rounded-sm items-print-container" dir={lang === "ar" ? "rtl" : "ltr"}>
                {/* Header */}
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl font-black text-gray-900">
                            {lang === "ar" ? "تقرير الأصناف المخزنة وحركتها على العقد" : "Stored Items & Movement Report"}
                        </h1>
                        <p className="text-xs text-gray-600 font-semibold">
                            {lang === "ar" ? "نظام إدارة المستودعات والخدمات اللوجستية" : "Warehouse & Logistics Management System"}
                        </p>
                    </div>
                    <div className="text-end space-y-1 text-xs">
                        <p className="font-bold">
                            {lang === "ar" ? "رقم العقد: " : "Contract No: "}
                            <span className="font-mono text-sm">{contract?.contract_number}</span>
                        </p>
                        <p className="text-gray-600">
                            {lang === "ar" ? "تاريخ العقد: " : "Date: "}
                            <span className="font-mono">{contract?.write_date || "—"}</span>
                        </p>
                    </div>
                </div>

                {/* Single Row Clean Info Bar - Customer Name & Contract info */}
                <div className="flex justify-between items-center py-2.5 px-3 mb-6 border-y-2 border-black text-xs font-bold bg-gray-50">
                    <div>
                        <span className="text-gray-600 me-1.5">{lang === "ar" ? "العميل:" : "Customer:"}</span>
                        <span className="font-black text-sm text-gray-900">{contract?.customer?.name || "—"}</span>
                    </div>
                    <div>
                        <span className="text-gray-600 me-1.5">{lang === "ar" ? "رقم العقد:" : "Contract No:"}</span>
                        <span className="font-mono text-sm font-black text-gray-900">{contract?.contract_number}</span>
                    </div>
                    <div>
                        <span className="text-gray-600 me-1.5">{lang === "ar" ? "تاريخ العقد:" : "Date:"}</span>
                        <span className="font-mono text-gray-900">{contract?.write_date || "—"}</span>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-xs text-start border-collapse border border-black">
                    <thead>
                        <tr className="bg-gray-100 border-b border-black font-bold uppercase">
                            <th className="border border-black px-2 py-2 text-center w-8">#</th>
                            <th className="border border-black px-3 py-2 text-start">{lang === "ar" ? "اسم الصنف" : "Item Name"}</th>
                            <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "حجم الكرتون / العبوة" : "Package Size"}</th>
                            <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "الدرجة / الجودة" : "Quality / Grade"}</th>
                            <th className="border border-black px-3 py-2 text-center w-20">{lang === "ar" ? "المدخلات" : "In"}</th>
                            <th className="border border-black px-3 py-2 text-center w-20">{lang === "ar" ? "المخرجات" : "Out"}</th>
                            <th className="border border-black px-3 py-2 text-center w-24">{lang === "ar" ? "الرصيد" : "Balance"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-6 text-gray-500">
                                    {lang === "ar" ? "لا توجد أصناف مخزنة مسجلة على هذا العقد" : "No stored items found for this contract"}
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => (
                                <tr key={item.id || idx} className="border-b border-black">
                                    <td className="border border-black px-2 py-2 text-center font-mono font-bold">{idx + 1}</td>
                                    <td className="border border-black px-3 py-2 font-bold text-start text-gray-900">
                                        {item.item_name || item.name_ar || item.name || "—"}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-center text-gray-700">
                                        {item.variant_name || item.variant?.name || "افتراضي"}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-center text-gray-700">
                                        {item.quality || item.variant?.quality || "—"}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-center font-mono">{item.total_in || item.quantity_in || 0}</td>
                                    <td className="border border-black px-3 py-2 text-center font-mono text-red-600">{item.total_out || item.quantity_out || 0}</td>
                                    <td className="border border-black px-3 py-2 text-center font-mono font-extrabold text-blue-700">
                                        {item.balance ?? (item.total_in - item.total_out) ?? 0}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer Metadata */}
                <div className="mt-8 pt-3 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>{lang === "ar" ? "تاريخ التقرير: " : "Report Date: "}{new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}</span>
                    <span>{lang === "ar" ? "إجمالي الأنواع/البدائل: " : "Total Items/Variants: "}{items.length}</span>
                </div>
            </div>
        </div>
    );
}
