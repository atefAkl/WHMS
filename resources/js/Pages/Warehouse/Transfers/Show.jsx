import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    ArrowLeftRight,
    Printer,
    Edit,
    CheckCircle2,
    Unlock,
    ArrowLeft,
    FileText,
    User,
    Calendar,
    Truck,
    ArrowRight
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";

export default function Show({ transfer }) {
    const { lang, __ } = useLang();
    const { auth } = usePage().props;

    const t = (key, fallback) => {
        if (!key) return fallback || "";
        const translated = __ ? __(key) : key;
        return (translated && translated !== key) ? translated : fallback;
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route("contract-transfers.index")} className="text-text hover:text-primary transition-colors">
                {t("transfers.title", "سندات تحويل الطبالي")}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {transfer.serial_number}
            </span>
        </div>
    );

    const totalQuantity = (transfer.items || []).reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${t("transfers.show_title", "سند تحويل طبالي")} - ${transfer.serial_number}`} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={ArrowLeftRight}
                    title={`${t("transfers.show_title", "سند تحويل طبالي رقم")}: ${transfer.serial_number}`}
                    description={
                        <div className="flex items-center gap-3 text-xs text-text-muted mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                            </span>
                            <span>|</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none inline-block ${
                                transfer.status === 'approved' 
                                    ? 'bg-success/10 text-success border border-success/30' 
                                    : 'bg-warning/10 text-warning border border-warning/30'
                            }`}>
                                {transfer.status === 'approved' ? t("transfers.status_approved", "معتمد ومغلق") : t("transfers.status_draft", "مسودة")}
                            </span>
                        </div>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <a
                                href={route("contract-transfers.print", transfer.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-slate-800 hover:bg-slate-700 text-white rounded-none flex items-center justify-center transition-all h-[30px] px-3 gap-1.5 text-xs font-bold"
                            >
                                <Printer className="h-4 w-4 shrink-0" />
                                <span>{t("common.print", "طباعة السند")}</span>
                            </a>

                            {transfer.status === "draft" && (
                                <Link
                                    href={route("contract-transfers.edit", transfer.id)}
                                    className="bg-primary text-white hover:bg-primary-hover rounded-none flex items-center justify-center transition-all h-[30px] px-3 gap-1.5 text-xs font-bold"
                                >
                                    <Edit className="h-4 w-4 shrink-0" />
                                    <span>{t("common.edit", "تعديل")}</span>
                                </Link>
                            )}

                            <Link
                                href={route("contract-transfers.index")}
                                className="bg-surface text-text hover:bg-hover border border-border rounded-none flex items-center justify-center transition-all h-[30px] px-3 gap-1.5 text-xs font-bold"
                            >
                                <ArrowLeft className={`h-4 w-4 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                <span>{t("common.back", "العودة")}</span>
                            </Link>
                        </div>
                    }
                />

                {/* Transfer Overview Path Banner */}
                <div className="bg-surface border border-border p-4 shadow-sm rounded-none">
                    <h3 className="text-xs font-bold text-text-muted mb-3 uppercase tracking-wider">
                        {t("transfers.transfer_path_title", "مسار تحويل الطبالي")}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        {/* Source Contract Box */}
                        <div className="bg-rose-500/5 border border-rose-500/30 p-3 rounded-none">
                            <span className="text-[10px] font-bold uppercase text-rose-700 block mb-1">
                                {t("transfers.source_contract_box", "عقد المصدر (خروج الرصيد منه)")}
                            </span>
                            <div className="flex justify-between items-baseline">
                                <Link
                                    href={route("contracts.show", transfer.source_contract?.id || 0)}
                                    className="text-base font-bold text-rose-800 hover:underline"
                                >
                                    {transfer.source_contract?.contract_number}
                                </Link>
                                <span className="text-xs font-semibold text-text">
                                    {transfer.source_customer?.name || transfer.source_contract?.customer?.name}
                                </span>
                            </div>
                        </div>

                        {/* Destination Contract Box */}
                        <div className="bg-emerald-500/5 border border-emerald-500/30 p-3 rounded-none">
                            <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">
                                {t("transfers.destination_contract_box", "عقد الوجهة (إدخال الرصيد إليه)")}
                            </span>
                            <div className="flex justify-between items-baseline">
                                <Link
                                    href={route("contracts.show", transfer.destination_contract?.id || 0)}
                                    className="text-base font-bold text-emerald-800 hover:underline"
                                >
                                    {transfer.destination_contract?.contract_number}
                                </Link>
                                <span className="text-xs font-semibold text-text">
                                    {transfer.destination_customer?.name || transfer.destination_contract?.customer?.name}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Voucher Meta Info Grid */}
                <div className="bg-surface border border-border p-4 shadow-sm rounded-none">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                            <span className="text-text-muted block">{t("transfers.driver", "السائق الناقل")}:</span>
                            <span className="font-semibold text-text mt-0.5 block">
                                {transfer.driver ? `${transfer.driver.name} ${transfer.driver.vehicle_plate ? `(${transfer.driver.vehicle_plate})` : ''}` : "—"}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted block">{t("transfers.farm_source", "مصدر المزرعة")}:</span>
                            <span className="font-semibold text-emerald-700 mt-0.5 block">
                                {transfer.farm_source || "—"}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted block">{t("transfers.created_by", "أنشئ بواسطة")}:</span>
                            <span className="font-semibold text-text mt-0.5 block">
                                {transfer.creator?.name || "—"}
                            </span>
                        </div>
                        <div>
                            <span className="text-text-muted block">{t("transfers.approved_by", "اعتمد بواسطة")}:</span>
                            <span className="font-semibold text-text mt-0.5 block">
                                {transfer.approver?.name ? `${transfer.approver.name} (${new Date(transfer.approved_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")})` : "—"}
                            </span>
                        </div>
                        {transfer.notes && (
                            <div className="col-span-2 md:col-span-4 border-t border-border pt-2">
                                <span className="text-text-muted block">{t("transfers.notes", "الملاحظات")}:</span>
                                <p className="text-text mt-0.5">{transfer.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transferred Items Table */}
                <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                    <div className="p-3 border-b border-border bg-background flex justify-between items-center">
                        <h4 className="text-xs font-bold text-text flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-primary" />
                            <span>{t("transfers.items_table_title", "تفاصيل الأصناف المنقولة بالسند")}</span>
                        </h4>
                        <span className="text-xs font-mono font-bold text-primary">
                            {t("transfers.total_transferred_quantity", "إجمالي الكمية المنقولة")}: {totalQuantity.toLocaleString()}
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="bg-surface-muted border-b border-border text-text-muted font-bold">
                                    <th className="p-3 text-start w-12">#</th>
                                    <th className="p-3 text-start">{t("transfers.pallet", "رقم الطبلية")}</th>
                                    <th className="p-3 text-start">{t("transfers.item_name", "الصنف والنوع")}</th>
                                    <th className="p-3 text-start">{t("transfers.variant", "الدرجة / المواصفة")}</th>
                                    <th className="p-3 text-center">{t("transfers.quantity", "الكمية المنقولة")}</th>
                                    <th className="p-3 text-start">{t("transfers.notes", "ملاحظات البند")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(transfer.items || []).map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-hover transition-colors">
                                        <td className="p-3 font-mono text-text-muted">{idx + 1}</td>
                                        <td className="p-3 font-bold font-mono text-text">
                                            طبلية #{item.pallet?.pallet_number || item.pallet?.pallet_code || "—"}
                                        </td>
                                        <td className="p-3 font-bold text-text">
                                            {item.inventory_item?.name || "—"}
                                        </td>
                                        <td className="p-3 text-text-muted">
                                            {item.variant?.name || "—"}
                                        </td>
                                        <td className="p-3 text-center font-mono font-bold text-primary text-sm">
                                            {parseFloat(item.quantity || 0).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-text-muted">
                                            {item.notes || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Inventory Entries Movement Log */}
                {transfer.status === "approved" && transfer.inventory_entries && transfer.inventory_entries.length > 0 && (
                    <div className="bg-surface border border-border shadow-sm rounded-none p-4">
                        <h4 className="text-xs font-bold text-text mb-3 pb-2 border-b border-border flex items-center gap-1.5">
                            <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
                            <span>{t("transfers.inventory_log_title", "سجل حركات المخزون الناتجة عن الاعتماد")}</span>
                        </h4>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-background border-b border-border text-text-muted font-bold">
                                        <th className="p-2 text-start">#</th>
                                        <th className="p-2 text-start">{t("transfers.contract", "العقد المربوط")}</th>
                                        <th className="p-2 text-start">{t("transfers.item_name", "الصنف")}</th>
                                        <th className="p-2 text-center">{t("transfers.qty_out", "الكمية الصادرة (Out)")}</th>
                                        <th className="p-2 text-center">{t("transfers.qty_in", "الكمية الواردة (In)")}</th>
                                        <th className="p-2 text-center">{t("transfers.operation_date", "تاريخ الحركة")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {transfer.inventory_entries.map((entry, idx) => {
                                        const isSource = entry.contract_id === transfer.source_contract_id;
                                        return (
                                            <tr key={entry.id || idx} className="hover:bg-hover">
                                                <td className="p-2 font-mono text-text-muted">{idx + 1}</td>
                                                <td className="p-2 font-bold">
                                                    <span className={isSource ? "text-rose-700" : "text-emerald-700"}>
                                                        {isSource ? `${transfer.source_contract?.contract_number} (مصدر - خروج)` : `${transfer.destination_contract?.contract_number} (وجهة - إدخال)`}
                                                    </span>
                                                </td>
                                                <td className="p-2">{entry.inventory_item?.name || "—"}</td>
                                                <td className="p-2 text-center font-mono font-bold text-rose-700">
                                                    {entry.quantity_out > 0 ? parseFloat(entry.quantity_out).toLocaleString() : "—"}
                                                </td>
                                                <td className="p-2 text-center font-mono font-bold text-emerald-700">
                                                    {entry.quantity_in > 0 ? parseFloat(entry.quantity_in).toLocaleString() : "—"}
                                                </td>
                                                <td className="p-2 text-center font-mono text-text-muted">
                                                    {entry.operation_date ? new Date(entry.operation_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
