import React from "react";
import { useLang } from "@/Contexts/LanguageContext";

export default function PalletsPrintReport({ contract, pallets = [], onClose }) {
    const { lang } = useLang();

    const handlePrint = () => {
        window.print();
    };

    const getStayDurationMonths = (createdAt) => {
        if (!createdAt) return 1;
        const start = new Date(createdAt);
        const now = new Date();
        const diffMs = now - start;
        const months = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
        return months;
    };

    const calculatePalletCost = (pallet) => {
        // Calculate total monthly rent / cost for items on this pallet from contract items
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
                    body * {
                        visibility: hidden !important;
                    }
                    .pallets-print-container, .pallets-print-container * {
                        visibility: visible !important;
                    }
                    .pallets-print-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        background: white !important;
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
                            {lang === "ar" ? "تاريخ تحرير العقد: " : "Date Written: "}
                            <span className="font-mono">{contract?.write_date || "—"}</span>
                        </p>
                    </div>
                </div>

                {/* Customer Info Card - Clean, borderless non-table info */}
                <div className="grid grid-cols-3 gap-6 text-xs mb-6 text-start py-2 border-y border-gray-300">
                    <div>
                        <span className="text-gray-500 font-medium block">{lang === "ar" ? "اسم العميل:" : "Customer Name:"}</span>
                        <span className="font-bold text-gray-900 text-sm">{contract?.customer?.name || "—"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 font-medium block">
                            {contract?.customer?.cr_number ? (lang === "ar" ? "السجل التجاري:" : "CR Number:") : (lang === "ar" ? "رقم الهوية:" : "ID Number:")}
                        </span>
                        <span className="font-bold font-mono text-gray-900">{contract?.customer?.cr_number || contract?.customer?.id_number || "—"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 font-medium block">{lang === "ar" ? "رقم الجوال:" : "Phone Number:"}</span>
                        <span className="font-bold font-mono text-gray-900">{contract?.customer?.phone_number || "—"}</span>
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
                            <th className="border border-black px-3 py-2 text-center">{lang === "ar" ? "التكلفة التقديرية" : "Est. Rent Cost"}</th>
                            <th className="border border-black px-3 py-2 text-center w-16">{lang === "ar" ? "المدخلات" : "In"}</th>
                            <th className="border border-black px-3 py-2 text-center w-16">{lang === "ar" ? "المخرجات" : "Out"}</th>
                            <th className="border border-black px-3 py-2 text-center w-20">{lang === "ar" ? "الرصيد" : "Balance"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pallets.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center py-6 text-gray-500">
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
                                const durationMonths = getStayDurationMonths(pallet.created_at || pallet.reception_date);
                                const cost = calculatePalletCost(pallet);

                                return (
                                    <tr key={pallet.id || idx} className="border-b border-black">
                                        <td className="border border-black px-2 py-2 text-center font-mono font-bold">{idx + 1}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono font-bold text-gray-900">
                                            {pallet.pallet_number || pallet.pallet_code || `P-${pallet.id}`}
                                        </td>
                                        <td className="border border-black px-3 py-2 font-bold text-start">{itemNames || "—"}</td>
                                        <td className="border border-black px-3 py-2 text-center text-gray-700">{variantNames || "—"}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono">{durationMonths}</td>
                                        <td className="border border-black px-3 py-2 text-center font-mono font-semibold" dir="ltr">{cost}</td>
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
