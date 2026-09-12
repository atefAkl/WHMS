import React, { useEffect } from "react";
import { Head } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Printer } from "lucide-react";

export default function Print({ transfer }) {
    const { lang, __ } = useLang();

    const t = (key, fallback) => {
        if (!key) return fallback || "";
        const translated = __ ? __(key) : key;
        return (translated && translated !== key) ? translated : fallback;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 500);
        return () => clearTimeout(timer);
    }, []);

    const totalQuantity = (transfer.items || []).reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans" dir="rtl">
            <Head title={`طباعة سند نقل طبالي - ${transfer.serial_number}`} />

            {/* Print action button for screen view */}
            <div className="no-print mb-6 flex justify-end">
                <button
                    onClick={() => window.print()}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 font-bold rounded-none flex items-center gap-2 shadow"
                >
                    <Printer className="h-4 w-4" />
                    <span>{t("common.print", "طباعة السند")}</span>
                </button>
            </div>

            {/* Print Header */}
            <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-extrabold tracking-tight">مخازن أيمن محمد عبد الله الغماس للتخزين</h1>
                    <p className="text-xs text-gray-600 mt-1">تخزين - تبريد - تجميد - تعبئة وتغليف - بيع - تصدير</p>
                    <p className="text-xs text-gray-600 font-mono mt-0.5">ست: 1131305092 | جوال: 0568562615</p>
                </div>
                <div className="text-end">
                    <div className="border-2 border-black px-4 py-2 font-bold text-base inline-block">
                        سند نقل طبالي بين العقود
                    </div>
                    <p className="text-xs font-mono font-bold mt-2">رقم السند: {transfer.serial_number}</p>
                    <p className="text-xs font-mono mt-0.5">
                        التاريخ: {transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString("ar-EG") : "—"}
                    </p>
                </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 border border-black p-4 mb-6 text-xs">
                {/* Source Side */}
                <div className="border-e border-black pe-4">
                    <span className="font-bold text-gray-700 block mb-1">بيانات عقد المصدر (منه):</span>
                    <p className="font-bold text-sm">رقم العقد: {transfer.source_contract?.contract_number}</p>
                    <p className="mt-1">اسم العميل: {transfer.source_customer?.name || transfer.source_contract?.customer?.name}</p>
                    {transfer.farm_source && <p className="mt-1">المزرعة / البيان: {transfer.farm_source}</p>}
                </div>

                {/* Destination Side */}
                <div>
                    <span className="font-bold text-gray-700 block mb-1">بيانات عقد الوجهة (إليه):</span>
                    <p className="font-bold text-sm">رقم العقد: {transfer.destination_contract?.contract_number}</p>
                    <p className="mt-1">اسم العميل: {transfer.destination_customer?.name || transfer.destination_contract?.customer?.name}</p>
                    {transfer.driver && (
                        <p className="mt-1">السائق الناقل: {transfer.driver.name} {transfer.driver.vehicle_plate ? `(${transfer.driver.vehicle_plate})` : ""}</p>
                    )}
                </div>

                {transfer.notes && (
                    <div className="col-span-2 border-t border-black pt-2 mt-1">
                        <span className="font-bold block">ملاحظات السند:</span>
                        <p className="mt-0.5">{transfer.notes}</p>
                    </div>
                )}
            </div>

            {/* Transferred Items Table */}
            <table className="w-full text-xs border-collapse border border-black mb-8">
                <thead>
                    <tr className="bg-gray-100 border-b border-black font-bold text-black">
                        <th className="border border-black p-2 text-start w-10">#</th>
                        <th className="border border-black p-2 text-start">رقم الطبلية</th>
                        <th className="border border-black p-2 text-start">الصنف</th>
                        <th className="border border-black p-2 text-start">الدرجة / النوع</th>
                        <th className="border border-black p-2 text-center w-28">الكمية المنقولة</th>
                        <th className="border border-black p-2 text-start">ملاحظات البند</th>
                    </tr>
                </thead>
                <tbody>
                    {(transfer.items || []).map((item, idx) => (
                        <tr key={item.id || idx} className="border-b border-black">
                            <td className="border border-black p-2 text-center font-mono">{idx + 1}</td>
                            <td className="border border-black p-2 font-bold font-mono">
                                طبلية #{item.pallet?.pallet_number || item.pallet?.pallet_code || "—"}
                            </td>
                            <td className="border border-black p-2 font-bold">{item.inventory_item?.name || "—"}</td>
                            <td className="border border-black p-2">{item.variant?.name || "—"}</td>
                            <td className="border border-black p-2 text-center font-mono font-bold text-sm">
                                {parseFloat(item.quantity || 0).toLocaleString()}
                            </td>
                            <td className="border border-black p-2">{item.notes || "—"}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold border-t-2 border-black bg-gray-50">
                        <td colSpan="4" className="border border-black p-2 text-start">إجمالي الكمية المنقولة للسند:</td>
                        <td className="border border-black p-2 text-center font-mono text-base">{totalQuantity.toLocaleString()}</td>
                        <td className="border border-black p-2"></td>
                    </tr>
                </tfoot>
            </table>

            {/* Signatures Footer */}
            <div className="grid grid-cols-3 gap-8 text-xs font-bold text-center mt-12 pt-4">
                <div>
                    <p className="mb-12">تسليم / عميل المصدر</p>
                    <p className="border-t border-black pt-1">التوقيع: ............................</p>
                </div>
                <div>
                    <p className="mb-12">استلام / عميل الوجهة</p>
                    <p className="border-t border-black pt-1">التوقيع: ............................</p>
                </div>
                <div>
                    <p className="mb-12">أمين / مسئول المخزن</p>
                    <p className="border-t border-black pt-1">التوقيع: ............................</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
