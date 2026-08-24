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
        const renewal = parseInt(contract?.renewal_period || mandatory, 10);
        if (!pallet?.created_at && !pallet?.reception_date) return mandatory;
        const start = new Date(pallet.created_at || pallet.reception_date);
        const now = new Date();
        const diffDays = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
        const mandatoryDays = mandatory * 30;
        if (diffDays <= mandatoryDays) {
            return mandatory;
        }
        const remainingDays = diffDays - mandatoryDays;
        const renewalCount = Math.ceil(remainingDays / (renewal * 30));
        return mandatory + (renewalCount * renewal);
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

    // Calculate Summary Metrics
    const largePalletsCount = pallets.filter((p) => {
        const sz = String(p.size || p.pallet_size || "").toLowerCase();
        return sz.includes("كبير") || sz.includes("large") || sz === "وسط";
    }).length;

    const smallPalletsCount = pallets.filter((p) => {
        const sz = String(p.size || p.pallet_size || "").toLowerCase();
        return sz.includes("صغير") || sz.includes("small");
    }).length;

    const distinctItemNames = new Set();
    const distinctVariantNames = new Set();
    let totalIn = 0;
    let totalOut = 0;
    let totalBalance = 0;

    pallets.forEach((p) => {
        totalIn += parseFloat(p.total_in || p.quantity_in || 0);
        totalOut += parseFloat(p.total_out || p.quantity_out || 0);
        totalBalance += parseFloat(p.balance ?? p.total_packages ?? ((p.total_in || 0) - (p.total_out || 0)));

        if (p.contents && Array.isArray(p.contents)) {
            p.contents.forEach((c) => {
                if (c.item_name || c.inventory_item?.name) distinctItemNames.add(c.item_name || c.inventory_item?.name);
                if (c.variant_name || c.quality) distinctVariantNames.add(c.variant_name || c.quality);
            });
        } else {
            if (p.item_name) distinctItemNames.add(p.item_name);
            if (p.variant_name) distinctVariantNames.add(p.variant_name);
        }
    });

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm overflow-y-auto print:static print:bg-white print:p-0 print:m-0 print:h-auto pallets-print-modal-root">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 auto;
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
                    .pallets-print-modal-root {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: transparent !important;
                        overflow: visible !important;
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
                        page-break-after: avoid !important;
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
                        {lang === "ar" ? "معاينة طباعة ملخص الطبالي" : "Pallets Summary Print Preview"}
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
                <div className="border-b border-slate-200 pb-4 mb-5 flex justify-between items-start">
                    <div className="space-y-1 text-start">
                        <h1 className="text-xl font-black text-slate-900">
                            {lang === "ar" ? "تقرير ملخص الطبالي المكونة على العقد" : "Contract Pallets Summary Report"}
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
                <div className="flex justify-between items-center py-3 px-4 mb-4 border border-slate-200 rounded-md text-xs bg-slate-50 font-bold">
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

                {/* Summary Metrics Bar (Per User Directive) */}
                <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 mb-5 border border-slate-200 bg-slate-100/70 rounded-md text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                        <span>{lang === "ar" ? "عدد الطبالي الكبيرة:" : "Large Pallets:"}</span>
                        <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">{largePalletsCount}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1.5">
                        <span>{lang === "ar" ? "عدد الطبالي الصغيرة:" : "Small Pallets:"}</span>
                        <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">{smallPalletsCount}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1.5">
                        <span>{lang === "ar" ? "عدد الأصناف:" : "Distinct Items:"}</span>
                        <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">{distinctItemNames.size}</span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1.5">
                        <span>{lang === "ar" ? "عدد أحجام الكرتون:" : "Carton Sizes:"}</span>
                        <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">{distinctVariantNames.size}</span>
                    </div>
                </div>

                {/* Table with Thin Borders */}
                <table className="w-full text-xs text-start border-collapse border border-slate-200">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                            <th className="border border-slate-200 px-2 py-2.5 text-center w-10">#</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet No."}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-start">{lang === "ar" ? "الأصناف على الطبلية" : "Items on Pallet"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center">{lang === "ar" ? "حجم الكرتون / العبوة" : "Variant / Size"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center">{lang === "ar" ? "مدة البقاء (شهر)" : "Duration (Mo)"}</th>
                            {showCost && <th className="border border-slate-200 px-3 py-2.5 text-center">{lang === "ar" ? "التكلفة التقديرية" : "Est. Rent Cost"}</th>}
                            <th className="border border-slate-200 px-3 py-2.5 text-center w-20">{lang === "ar" ? "المدخلات" : "In"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center w-20">{lang === "ar" ? "المخرجات" : "Out"}</th>
                            <th className="border border-slate-200 px-3 py-2.5 text-center w-24">{lang === "ar" ? "الرصيد" : "Balance"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {pallets.length === 0 ? (
                            <tr>
                                <td colSpan={showCost ? 9 : 8} className="text-center py-6 text-slate-500">
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
                                    <tr key={pallet.id || idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="border border-slate-200 px-2 py-2 text-center font-mono font-bold text-slate-600">{idx + 1}</td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-extrabold text-slate-900">
                                            {pallet.pallet_number || pallet.pallet_code || `P-${pallet.id}`}
                                        </td>
                                        <td className="border border-slate-200 px-3 py-2 font-bold text-start text-slate-900">{itemNames || "—"}</td>
                                        <td className="border border-slate-200 px-3 py-2 text-center text-slate-700 font-medium">{variantNames || "—"}</td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-bold text-slate-800">{durationMonths}</td>
                                        {showCost && <td className="border border-slate-200 px-3 py-2 text-center font-mono font-semibold text-slate-800" dir="ltr">{cost}</td>}
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-semibold text-emerald-700">{parseFloat(pallet.total_in || pallet.quantity_in || 0).toLocaleString()}</td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-semibold text-rose-600">{parseFloat(pallet.total_out || pallet.quantity_out || 0).toLocaleString()}</td>
                                        <td className="border border-slate-200 px-3 py-2 text-center font-mono font-extrabold text-blue-700">
                                            {parseFloat(pallet.balance ?? pallet.total_packages ?? 0).toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>

                {/* Bottom KPI Cards */}
                <div className="mt-6 p-4 border border-slate-200 bg-slate-50/50 rounded-md">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-center">
                            <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                                {lang === "ar" ? "إجمالي وارد الطبالي" : "Total Pallets (In)"}
                            </span>
                            <span className="text-base font-black font-mono text-emerald-800">
                                {totalIn.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded text-center">
                            <span className="text-[11px] font-bold text-amber-700 block mb-1">
                                {lang === "ar" ? "إجمالي صادر الطبالي" : "Total Pallets (Out)"}
                            </span>
                            <span className="text-base font-black font-mono text-amber-800">
                                {totalOut.toLocaleString()}
                            </span>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-center">
                            <span className="text-[11px] font-bold text-blue-700 block mb-1">
                                {lang === "ar" ? "إجمالي رصيد الطبالي" : "Total Remaining Pallets"}
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
