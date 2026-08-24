import React from "react";
import { useLang } from "@/Contexts/LanguageContext";

export default function ItemsPrintReport({ contract, items = [], onClose }) {
    const { lang } = useLang();

    const handlePrint = () => {
        window.print();
    };

    const totalIn = items.reduce((sum, item) => sum + parseFloat(item.total_in || item.quantity_in || 0), 0);
    const totalOut = items.reduce((sum, item) => sum + parseFloat(item.total_out || item.quantity_out || 0), 0);
    const totalBalance = items.reduce((sum, item) => sum + parseFloat(item.balance ?? ((item.total_in || 0) - (item.total_out || 0))), 0);

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:p-0 print:m-0 print:h-auto items-print-modal-root">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 10mm 10mm 10mm 10mm;
                    }
                    html, body, #app, main {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        height: auto !important;
                        min-height: auto !important;
                        overflow: visible !important;
                        display: block !important;
                        position: static !important;
                    }
                    header, nav, sidebar, footer, .print\\:hidden, .contract-print-area, .contract-view-wrapper {
                        display: none !important;
                    }
                    .items-print-modal-root {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: transparent !important;
                        overflow: visible !important;
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
                        page-break-after: avoid !important;
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
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-md shadow transition-all flex items-center gap-1.5"
                    >
                        <span>{lang === "ar" ? "طباعة التقرير" : "Print Report"}</span>
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
                {/* Clean Modern Header */}
                <div className="border-b border-slate-200 pb-4 mb-5 flex justify-between items-start">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl font-black text-slate-900">
                            {lang === "ar" ? "تقرير ملخص الأصناف المخزنة بالعقد" : "Stored Items Summary Report"}
                        </h1>
                        <p className="text-xs text-slate-500 font-semibold">
                            {lang === "ar" ? "نظام إدارة المستودعات والخدمات اللوجستية" : "Warehouse & Logistics Management System"}
                        </p>
                    </div>
                    <div className="text-end space-y-1 text-xs">
                        <p className="font-bold text-slate-800">
                            {lang === "ar" ? "رقم العقد: " : "Contract No: "}
                            <span className="font-mono text-sm font-extrabold">{contract?.contract_number}</span>
                        </p>
                        <p className="text-slate-500">
                            {lang === "ar" ? "تاريخ التحرير: " : "Date Written: "}
                            <span className="font-mono">{contract?.write_date || "—"}</span>
                        </p>
                    </div>
                </div>

                {/* Top Info Bar (Customer & Cold Storage Info) */}
                <div className="flex justify-between items-center py-3 px-4 mb-5 border border-slate-200 rounded-md text-xs bg-slate-50 font-bold">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">{lang === "ar" ? "العميل:" : "Customer:"}</span>
                        <span className="font-black text-sm text-slate-900">{contract?.customer?.name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">{lang === "ar" ? "الثلاجة / المستودع:" : "Warehouse / Cold Storage:"}</span>
                        <span className="font-bold text-slate-800">{contract?.warehouse_name || "ثلاجة حفظ التمور والخدمات اللوجستية"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-500">{lang === "ar" ? "رقم العقد:" : "Contract No:"}</span>
                        <span className="font-mono text-sm font-extrabold text-slate-900">{contract?.contract_number}</span>
                    </div>
                </div>

                {/* Top Item Count Indicator */}
                <div className="flex justify-between items-center mb-3 px-1 text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-1.5">
                        <span>{lang === "ar" ? "عدد السلع المستودعية:" : "Storage Items Count:"}</span>
                        <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{items.length}</span>
                    </div>
                </div>

                {/* Table with Thin Borders */}
                <table className="w-full text-xs text-start border-collapse border border-slate-200">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                            <th className="border border-slate-200 px-2 py-2.5 text-center w-10">#</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-start">{lang === "ar" ? "الصنف" : "Item Name"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center">{lang === "ar" ? "الجودة / الحجم" : "Quality / Variant"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center w-24">{lang === "ar" ? "مدخلات" : "In"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center w-24">{lang === "ar" ? "مخرجات" : "Out"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center w-28">{lang === "ar" ? "الرصيد" : "Balance"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-6 text-slate-500">
                                    {lang === "ar" ? "لا توجد أصناف مخزنة مسجلة على هذا العقد" : "No stored items found for this contract"}
                                </td>
                            </tr>
                        ) : (
                            items.map((item, idx) => {
                                const variantInfo = [item.variant_name || item.variant?.name, item.quality || item.variant?.quality].filter(Boolean).join(" | ");
                                return (
                                    <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="border border-slate-200 px-2 py-2 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                                        <td className="border border-slate-200 px-3 py-2 font-bold text-start text-slate-900">
                                            {item.item_name || item.name_ar || item.name || "—"}
                                        </td>
                                        <td className="border border-slate-200 px-3 py-2 text-center text-slate-700 font-medium">
                                            {variantInfo || "افتراضي"}
                                        </td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-semibold text-emerald-700">
                                            {parseFloat(item.total_in || item.quantity_in || 0).toLocaleString()}
                                        </td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-semibold text-rose-600">
                                            {parseFloat(item.total_out || item.quantity_out || 0).toLocaleString()}
                                        </td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-extrabold text-blue-700">
                                            {parseFloat(item.balance ?? ((item.total_in || 0) - (item.total_out || 0))).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Bottom Summary Section (Matching Attachment 1) */}
                <div className="mt-6 p-4 border border-slate-200 bg-slate-50/50 rounded-md">
                    <div className="flex justify-between items-end mb-3">
                        <div>
                            <h3 className="text-xs font-black text-slate-900">
                                {lang === "ar" ? "إجمالي كراتين الأصناف حسب الحركة" : "Total Item Cartons by Movement"}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium">
                                {lang === "ar" ? "إجمالي المدخلات والمخرجات وصافي رصيد الأصناف بالعقد" : "Total inputs, outputs, and net balance under the contract"}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-center">
                            <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                                {lang === "ar" ? "مدخلات (وارد)" : "Total Inputs (In)"}
                            </span>
                            <span className="text-base font-black font-mono text-emerald-800">
                                {totalIn.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded text-center">
                            <span className="text-[11px] font-bold text-amber-700 block mb-1">
                                {lang === "ar" ? "مخرجات (صادر)" : "Total Outputs (Out)"}
                            </span>
                            <span className="text-base font-black font-mono text-amber-800">
                                {totalOut.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-center">
                            <span className="text-[11px] font-bold text-blue-700 block mb-1">
                                {lang === "ar" ? "الرصيد المتبقي" : "Remaining Balance"}
                            </span>
                            <span className="text-base font-black font-mono text-blue-800">
                                {totalBalance.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-6 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>{lang === "ar" ? "تاريخ التقرير: " : "Report Date: "}{new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}</span>
                    <span>{lang === "ar" ? "نظام إدارة المستودعات والخدمات اللوجستية WHMS" : "WHMS Warehouse System"}</span>
                </div>
            </div>
        </div>
    );
}
