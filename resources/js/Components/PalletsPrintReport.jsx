import React, { useState } from "react";
import { useLang } from "@/Contexts/LanguageContext";

export default function PalletsPrintReport({ contract, pallets = [], onClose }) {
    const { lang } = useLang();
    const [showCost, setShowCost] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const getStayDurationMonths = (pallet) => {
        if (pallet.stay_duration_months) return pallet.stay_duration_months;
        const mandatory = parseInt(contract?.mandatory_period || 1, 10);
        if (!pallet?.created_at && !pallet?.reception_date) return mandatory;
        const start = new Date(pallet.created_at || pallet.reception_date);
        const now = new Date();
        const diffDays = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
        const periodsCount = Math.ceil(diffDays / (mandatory * 30));
        return Math.max(mandatory, periodsCount * mandatory);
    };

    const calculatePalletCost = (pallet) => {
        let cost = 0;
        if (pallet.contents && Array.isArray(pallet.contents)) {
            pallet.contents.forEach((c) => {
                const count = parseFloat(c.unit_count || c.quantity || 0);
                const itemRent = parseFloat(c.monthly_rent || c.unit_price || 0);
                cost += count * itemRent;
            });
        }
        return cost > 0 ? cost.toFixed(2) : "—";
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:p-0">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 landscape;
                        margin: 10mm 12mm 10mm 12mm;
                    }
                    html, body {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .pallets-print-container {
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
                    .pallets-print-container table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: auto !important;
                    }
                    .pallets-print-container tr {
                        page-break-inside: avoid !important;
                    }
                }
            ` }} />

            {/* Screen Toolbar */}
            <div className="print:hidden sticky top-0 bg-slate-900 text-white p-4 shadow-xl border-b border-slate-700 flex justify-between items-center max-w-7xl mx-auto my-4 rounded-lg">
                <div className="text-start">
                    <h2 className="text-sm font-extrabold">
                        {lang === "ar" ? "معاينة طباعة ملخص الطبالي (A4 أفقي)" : "Pallets Summary Print Preview (A4 Landscape)"}
                    </h2>
                    <p className="text-xs text-slate-400">
                        {lang === "ar" ? `العقد رقم: ${contract?.contract_number}` : `Contract No: ${contract?.contract_number}`}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-xs bg-slate-800 px-3 py-2 rounded-md border border-slate-700 hover:bg-slate-750 transition-colors">
                        <input
                            type="checkbox"
                            checked={showCost}
                            onChange={(e) => setShowCost(e.target.checked)}
                            className="rounded text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="font-bold">{lang === "ar" ? "إظهار عمود التكلفة التقديرية" : "Show Rent Cost Column"}</span>
                    </label>

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
            <div className="max-w-6xl mx-auto bg-white text-black p-8 shadow-2xl my-6 rounded-sm pallets-print-container" dir={lang === "ar" ? "rtl" : "ltr"}>
                {/* Header */}
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl font-black text-gray-900">
                            {lang === "ar" ? "تقرير ملخص الطبالي المكونة على العقد" : "Contract Pallets Summary Report"}
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
                            {lang === "ar" ? "تاريخ التحرير: " : "Date Written: "}
                            <span className="font-mono">{contract?.write_date || "—"}</span>
                        </p>
                    </div>
                </div>

                {/* Single Row Clean Customer Header */}
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
                            <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet No."}</th>
                            <th className="border border-black px-3 py-2 text-start">{lang === "ar" ? "الأصناف على الطبلية" : "Items on Pallet"}</th>
                            <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "حجم الكرتون / العبوة" : "Variant / Size"}</th>
                            <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "مدة البقاء (شهر)" : "Duration (Mo)"}</th>
                            {showCost && <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "التكلفة التقديرية" : "Est. Rent Cost"}</th>}
                            <th className="border border-black px-3 py-2 text-center w-16">{lang === "ar" ? "المدخلات" : "In"}</th>
                            <th className="border border-black px-3 py-2 text-center w-16">{lang === "ar" ? "المخرجات" : "Out"}</th>
                            <th className="border border-black px-3 py-2 text-center w-20">{lang === "ar" ? "الرصيد" : "Balance"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pallets.length === 0 ? (
                            <tr>
                                <td colSpan={showCost ? 9 : 8} className="text-center py-6 text-gray-500">
                                    {lang === "ar" ? "لا توجد طبالي مسجلة على هذا العقد" : "No pallets found for this contract"}
                                </td>
                            </tr>
                        ) : (
                            pallets.map((pallet, idx) => {
                                const itemNames = pallet.contents
                                    ? pallet.contents.map((c) => c.item_name || c.inventory_item?.name || "").filter(Boolean).join("، ")
                                    : pallet.item_name || "—";
                                const variantNames = pallet.contents
                                    ? pallet.contents.map((c) => c.variant_name || c.quality || "").filter(Boolean).join("، ")
                                    : pallet.variant_name || "—";
                                const durationMonths = getStayDurationMonths(pallet);
                                const cost = calculatePalletCost(pallet);

                                return (
                                    <tr key={pallet.id || idx} className="border-b border-black">
                                        <td className="border border-black px-2 py-2 text-center font-mono font-bold">{idx + 1}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono font-bold text-gray-900">
                                            {pallet.pallet_number || pallet.pallet_code || `P-${pallet.id}`}
                                        </td>
                                        <td className="border border-black px-3 py-2 font-bold text-start">{itemNames || "—"}</td>
                                        <td className="border border-black px-3 py-2 text-center text-gray-700">{variantNames || "—"}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono font-bold">{durationMonths}</td>
                                        {showCost && <td className="border border-black px-3 py-2 text-center font-mono font-semibold" dir="ltr">{cost}</td>}
                                        <td className="border border-black px-3 py-2 text-center font-mono">{pallet.total_in || pallet.quantity_in || 0}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono text-red-600">{pallet.total_out || pallet.quantity_out || 0}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono font-extrabold text-blue-700">
                                            {pallet.balance ?? pallet.total_packages ?? 0}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Footer Metadata */}
                <div className="mt-8 pt-3 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>{lang === "ar" ? "تاريخ التقرير: " : "Report Date: "}{new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US")}</span>
                    <span>{lang === "ar" ? "إجمالي عدد الطبالي: " : "Total Pallets: "}{pallets.length}</span>
                </div>
            </div>
        </div>
    );
}
