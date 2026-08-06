import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Boxes,
    Calendar,
    User,
    FileText,
    ArrowDownLeft,
    ArrowUpRight,
    Clock,
    DollarSign,
    Layers,
    BarChart3,
    CheckCircle2,
    PackageCheck,
    TrendingUp,
    ShieldCheck
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import Tooltip from "@/Components/Tooltip";

export default function Show({ pallet, current_balance, total_in, total_out, contracts }) {
    const { lang } = useLang();
    const [selectedContractIndex, setSelectedContractIndex] = useState(0);

    const activeContract = contracts && contracts.length > 0 ? contracts[selectedContractIndex] : null;

    const getSizeBadgeStyle = (size) => {
        switch (size) {
            case "كبيرة":
                return "bg-rose-500/10 text-rose-700 border-rose-300";
            case "وسط":
                return "bg-blue-500/10 text-blue-700 border-blue-300";
            case "صغيرة":
                return "bg-gray-500/10 text-gray-700 border-gray-300";
            case "خشب":
                return "bg-amber-500/10 text-amber-700 border-amber-300";
            case "بلاستيك":
                return "bg-emerald-500/10 text-emerald-700 border-emerald-300";
            default:
                return "bg-gray-500/10 text-gray-700 border-gray-300";
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route("pallets.index")} className="hover:text-primary transition-colors font-medium">
                {lang === "ar" ? "الطبالي" : "Pallets"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-bold">{pallet.pallet_number}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${lang === "ar" ? "بيانات الطبلية" : "Pallet Details"} ${pallet.pallet_number}`} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                {/* Page Header */}
                <PageHeader
                    icon={Boxes}
                    title={
                        <div className="flex items-center gap-3">
                            <span>{lang === "ar" ? `بيانات وسجل الطبلية: ${pallet.pallet_number}` : `Pallet Details: ${pallet.pallet_number}`}</span>
                            <span className={`text-xs px-3 py-1 font-bold border rounded-none ${getSizeBadgeStyle(pallet.size)}`}>
                                {pallet.size}
                            </span>
                        </div>
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تتبع تاريخ تسجيل الطبلية بالمستودع، دورة حياتها على العقود، حركاتها المخزنية والمجمع الصاعد للرصيد والتكلفة التراكمية."
                                : "Track pallet warehouse registration history, lifecycle across contracts, inventory movements, running balance, and accumulated cost."}
                        </p>
                    }
                    actions={
                        <Link
                            href={route("pallets.index")}
                            className="px-4 py-2 border border-border bg-surface text-text hover:bg-surface-muted text-xs font-bold transition-all rounded-none"
                        >
                            {lang === "ar" ? "← العودة لقائمة الطبالي" : "← Back to Pallets List"}
                        </Link>
                    }
                />

                {/* Key Metrics Header Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Code & Number */}
                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "كود البار كود الفريد:" : "Unique Pallet Barcode:"}
                            </span>
                            <span className="text-base font-black text-primary font-mono mt-0.5 block">
                                {pallet.pallet_code}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono mt-1 block">
                                {lang === "ar" ? "تاريخ الإضافة:" : "Added Date:"} {pallet.created_at ? new Date(pallet.created_at).toLocaleDateString("ar-SA") : "—"}
                            </span>
                        </div>
                        <div className="p-3 bg-primary/10 text-primary border border-primary/20">
                            <Boxes className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Current Warehouse Balance */}
                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "الحمولة والإشغال الحالي:" : "Current Warehouse Balance:"}
                            </span>
                            <span className={`text-lg font-black font-mono mt-0.5 block ${current_balance > 0 ? "text-emerald-700" : "text-gray-500"}`}>
                                {current_balance} <span className="text-xs font-sans font-bold">{lang === "ar" ? "كرتون/طبلية" : "Packs"}</span>
                            </span>
                            <span className="text-[10px] font-bold mt-1 block text-emerald-600">
                                {current_balance > 0 ? (lang === "ar" ? "● مشغولة حالياً بالمخزن" : "● Currently In Storage") : (lang === "ar" ? "○ غير مشغولة (خالية)" : "○ Empty Pallet")}
                            </span>
                        </div>
                        <div className={`p-3 border ${current_balance > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-300" : "bg-gray-100 text-gray-500 border-gray-300"}`}>
                            <PackageCheck className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Total Inflow */}
                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "إجمالي الوارد الإجمالي (In):" : "Total Received (In):"}
                            </span>
                            <span className="text-base font-black text-emerald-800 font-mono mt-0.5 block">
                                +{total_in}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono mt-1 block">
                                {lang === "ar" ? "مجموع سندات الإدخال" : "All reception receipts"}
                            </span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-700 border border-emerald-300">
                            <ArrowDownLeft className="h-6 w-6" />
                        </div>
                    </div>

                    {/* Total Outflow */}
                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "إجمالي المنصرف (Out):" : "Total Dispatched (Out):"}
                            </span>
                            <span className="text-base font-black text-rose-800 font-mono mt-0.5 block">
                                -{total_out}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono mt-1 block">
                                {lang === "ar" ? "مجموع سندات الخروج" : "All delivery receipts"}
                            </span>
                        </div>
                        <div className="p-3 bg-rose-500/10 text-rose-700 border border-rose-300">
                            <ArrowUpRight className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Contracts Section Header */}
                <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-6">
                    <div className="flex flex-wrap items-center justify-between border-b border-border pb-3 gap-3">
                        <div>
                            <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                                <Layers className="h-4.5 w-4.5 text-primary" />
                                {lang === "ar" ? "سجل دورة حياة الطبلية عبر العقود والمرتبطة بها" : "Pallet Lifecycle Across Linked Contracts"}
                            </h3>
                            <p className="text-xs text-text-muted mt-1">
                                {lang === "ar"
                                    ? "اختر العقد للاطلاع على تفاصيل التسجيل، تاريخ الإدخال، جدول الحركات والمجمع الصاعد للتكلفة والمخطط البياني."
                                    : "Select a contract to view registration info, first entry, running balance table, timeline chart, and billing costs."}
                            </p>
                        </div>
                        <span className="text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20 px-3 py-1">
                            {lang === "ar" ? `عدد العقود المرتبطة: ${contracts ? contracts.length : 0}` : `Linked Contracts: ${contracts ? contracts.length : 0}`}
                        </span>
                    </div>

                    {/* Contract Tabs */}
                    {contracts && contracts.length > 0 ? (
                        <div className="space-y-6">
                            <div className="flex border-b border-border overflow-x-auto gap-2 pb-1">
                                {contracts.map((c, index) => {
                                    const isSelected = selectedContractIndex === index;
                                    return (
                                        <button
                                            key={c.contract_id}
                                            onClick={() => setSelectedContractIndex(index)}
                                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
                                                isSelected
                                                    ? "border-primary text-primary bg-primary/5 shadow-2xs"
                                                    : "border-transparent text-text-muted hover:text-text hover:border-border"
                                            }`}
                                        >
                                            <FileText className="h-4 w-4" />
                                            <span>{lang === "ar" ? `عقد رقم ${c.contract_number}` : `Contract #${c.contract_number}`}</span>
                                            <span className="text-[10px] font-normal px-2 py-0.5 bg-surface border border-border rounded-none text-text">
                                                {c.customer_name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Contract Details */}
                            {activeContract && (
                                <div className="space-y-6">
                                    {/* Contract Summary Banner */}
                                    <div className="bg-slate-50 border border-border p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                                        <div>
                                            <span className="text-text-muted font-sans font-medium block">{lang === "ar" ? "العميل المستأجر:" : "Customer:"}</span>
                                            <span className="font-bold text-text text-sm font-sans block mt-0.5">👤 {activeContract.customer_name}</span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted font-sans font-medium block">{lang === "ar" ? "تاريخ أول تسجيل على العقد:" : "First Registered:"}</span>
                                            <span className="font-bold text-gray-800 block mt-0.5">📅 {activeContract.first_registered_at || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted font-sans font-medium block">{lang === "ar" ? "تاريخ أول عملية إدخال (استلام):" : "First Reception Date:"}</span>
                                            <span className="font-bold text-emerald-700 block mt-0.5">📥 {activeContract.first_reception_date || "—"}</span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted font-sans font-medium block">{lang === "ar" ? "مدة بقاء الطبلية بالعقد:" : "Days Stayed:"}</span>
                                            <span className="font-bold text-primary text-sm block mt-0.5">⏱️ {activeContract.days_stayed} {lang === "ar" ? "يوم" : "Days"}</span>
                                        </div>
                                    </div>

                                    {/* Billing Periods & Accumulated Cost Card */}
                                    <div className="bg-emerald-500/5 border border-emerald-500/25 p-4 rounded-none space-y-3">
                                        <div className="flex flex-wrap items-center justify-between border-b border-emerald-500/20 pb-2 gap-2">
                                            <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5 font-sans">
                                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                                {lang === "ar" ? "حساب تكلفة بقاء الطبلية عبر الفترات الإلزامية والتجديد:" : "Accumulated Pallet Stay Cost Breakdown:"}
                                            </span>
                                            <span className="text-xs font-mono font-black text-emerald-900 bg-white px-3 py-1 border border-emerald-300 shadow-2xs">
                                                {lang === "ar" ? "إجمالي التكلفة الإيجارية التراكمية:" : "Total Accumulated Rent:"}{" "}
                                                <span className="text-emerald-700 text-sm">{activeContract.total_cost.toFixed(2)}</span> ر.س
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                                            <div className="bg-white p-3 border border-emerald-200">
                                                <span className="text-gray-600 font-sans font-medium block">{lang === "ar" ? "الفترة الإلزامية الأولية:" : "Mandatory Period:"}</span>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="font-bold text-gray-800">{activeContract.mandatory_period} {lang === "ar" ? "شهر" : "Months"}</span>
                                                    <span className="font-bold text-emerald-700">{activeContract.mandatory_cost.toFixed(2)} ر.س</span>
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 border border-emerald-200">
                                                <span className="text-gray-600 font-sans font-medium block">{lang === "ar" ? "فترات التجديد اللاحقة:" : "Renewal Periods:"}</span>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="font-bold text-gray-800">{Math.max(0, activeContract.months_stayed - activeContract.mandatory_period)} {lang === "ar" ? "شهر تجديد" : "Renewal Months"}</span>
                                                    <span className="font-bold text-amber-700">{activeContract.renewal_cost.toFixed(2)} ر.س</span>
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 border border-emerald-200">
                                                <span className="text-gray-600 font-sans font-medium block">{lang === "ar" ? "معدل فئة إيجار الطبلية:" : "Pallet Rent Rate:"}</span>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="font-bold text-gray-800">{activeContract.monthly_rent_rate.toFixed(2)} ر.س / شهرياً</span>
                                                    <span className="text-[10px] text-text-muted font-sans">(لكل طبلية)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Interactive Visual Chart */}
                                    {activeContract.timeline_chart && activeContract.timeline_chart.length > 0 && (
                                        <div className="bg-surface border border-border p-4 rounded-none space-y-3">
                                            <h4 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                                <BarChart3 className="h-4 w-4 text-primary" />
                                                {lang === "ar" ? "مخطط بياني لتاريخ حمولة الطبلية وتكلفتها عبر الأيام والفترات" : "Timeline Chart: Load & Cost Over Days & Periods"}
                                            </h4>
                                            
                                            {/* Visual Bar Timeline Graph */}
                                            <div className="pt-4 pb-2 px-2 border border-border bg-slate-50/60 overflow-x-auto">
                                                <div className="min-w-[600px] flex items-end justify-between gap-3 h-44 px-4 pb-4 border-b border-gray-300 relative">
                                                    {activeContract.timeline_chart.map((point, pIdx) => {
                                                        const maxVal = Math.max(...activeContract.timeline_chart.map(p => p.balance || 1), 10);
                                                        const heightPercent = Math.min(100, Math.max(15, (point.balance / maxVal) * 100));

                                                        return (
                                                            <div key={pIdx} className="flex-1 flex flex-col items-center gap-1 group relative">
                                                                {/* Hover Tooltip Popup */}
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-20 z-20 bg-gray-900 text-white text-[10px] p-2 rounded shadow-lg pointer-events-none w-36 text-center font-mono">
                                                                    <div className="font-bold text-emerald-300 font-sans">{point.period_label}</div>
                                                                    <div>التاريخ: {point.date}</div>
                                                                    <div>أيام البقاء: {point.days_on_contract} يوم</div>
                                                                    <div>الرصيد: {point.balance} كرتون</div>
                                                                    <div className="text-amber-300 font-bold">التكلفة: {point.accumulated_cost} ر.س</div>
                                                                </div>

                                                                <span className="text-[10px] font-mono font-bold text-primary">
                                                                    {point.balance}
                                                                </span>

                                                                <div
                                                                    style={{ height: `${heightPercent}%` }}
                                                                    className="w-full bg-gradient-to-t from-primary/80 to-primary hover:from-emerald-600 hover:to-emerald-500 transition-all rounded-t-xs shadow-xs"
                                                                />

                                                                <span className="text-[9px] font-mono text-text-muted mt-1 truncate max-w-[70px]">
                                                                    {point.date}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="flex justify-between items-center text-[10px] text-text-muted px-4 pt-2 font-mono">
                                                    <span>الخط الأفقي: الأيام وتاريخ العمليات عبر الفترات</span>
                                                    <span className="font-bold text-primary">الارتفاع: مجمع رصيد الحمولة (كرتون)</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* All Operations Table & Running Balance */}
                                    <div className="bg-surface border border-border p-4 rounded-none space-y-3">
                                        <h4 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            {lang === "ar" ? "جدول حركات الطبلية والمجمع الصاعد للرصيد (Running Stock Balance)" : "Pallet Movements & Running Balance Ledger"}
                                        </h4>

                                        <div className="overflow-x-auto border border-border">
                                            <table className="w-full text-xs text-start">
                                                <thead className="bg-surface-muted text-text-muted font-bold border-b border-border">
                                                    <tr>
                                                        <th className="px-3 py-2.5 text-center">#</th>
                                                        <th className="px-3 py-2.5 text-start">{lang === "ar" ? "نوع العملية" : "Type"}</th>
                                                        <th className="px-3 py-2.5 text-start">{lang === "ar" ? "رقم السند" : "Voucher Serial"}</th>
                                                        <th className="px-3 py-2.5 text-start">{lang === "ar" ? "تاريخ الحركة" : "Date"}</th>
                                                        <th className="px-3 py-2.5 text-start">{lang === "ar" ? "الصنف/المنتج" : "Item / Product"}</th>
                                                        <th className="px-3 py-2.5 text-center text-emerald-700">{lang === "ar" ? "وارد (+)" : "In (+)"}</th>
                                                        <th className="px-3 py-2.5 text-center text-rose-700">{lang === "ar" ? "صادر (-)" : "Out (-)"}</th>
                                                        <th className="px-3 py-2.5 text-center bg-primary/5 text-primary font-bold">{lang === "ar" ? "المجمع الصاعد للرصيد" : "Running Balance"}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border font-mono">
                                                    {activeContract.entries && activeContract.entries.length > 0 ? (
                                                        activeContract.entries.map((e, idx) => (
                                                            <tr key={e.id} className="hover:bg-surface-muted/30 transition-colors">
                                                                <td className="px-3 py-2 text-center text-text-muted">{idx + 1}</td>
                                                                <td className="px-3 py-2 text-start font-sans">
                                                                    <span className={`text-[10px] px-2 py-0.5 font-bold border ${e.quantity_in > 0 ? "bg-emerald-500/10 text-emerald-700 border-emerald-300" : "bg-rose-500/10 text-rose-700 border-rose-300"}`}>
                                                                        {e.voucher_type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-start font-bold text-text">{e.voucher_serial}</td>
                                                                <td className="px-3 py-2 text-start text-text-muted">{e.voucher_date}</td>
                                                                <td className="px-3 py-2 text-start font-sans font-bold text-text">
                                                                    {e.item_name} {e.variant_name ? `(${e.variant_name})` : ""}
                                                                </td>
                                                                <td className="px-3 py-2 text-center text-emerald-700 font-bold">{e.quantity_in > 0 ? `+${e.quantity_in}` : "—"}</td>
                                                                <td className="px-3 py-2 text-center text-rose-700 font-bold">{e.quantity_out > 0 ? `-${e.quantity_out}` : "—"}</td>
                                                                <td className="px-3 py-2 text-center bg-primary/5 text-primary font-black text-sm">
                                                                    {e.running_balance}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="8" className="py-6 text-center text-text-muted font-sans text-xs">
                                                                {lang === "ar" ? "لا توجد عمليات مسجلة لهذه الطبلية على هذا العقد." : "No operations recorded."}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-text-muted space-y-2">
                            <Boxes className="h-10 w-10 mx-auto text-text-muted/50" />
                            <p className="font-bold text-xs">{lang === "ar" ? "هذه الطبلية مسجلة جديدة ولم يتم ربطها بعد بأي سندات استلام أو عقود." : "This pallet is newly registered and has no contract history yet."}</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
