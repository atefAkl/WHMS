import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { SlidersHorizontal, CheckCircle2, Printer, FileText, Home, ChevronRight, Download, RotateCcw, Edit, Trash2 } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';

export default function Show({ adjustment }) {
    const { lang } = useLang();

    const handleApprove = () => {
        if (confirm(lang === "ar" ? "هل أنت تأكد من ترحيل واعتماد سند التسوية القيدي؟ سيتم قيد الفروقات في حركات المخزون وتحديث أرصدة الطبالي." : "Are you sure you want to approve and post this adjustment?")) {
            router.post(route('inventory-adjustments.approve', adjustment.id));
        }
    };

    const handleReopen = () => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من فك اعتماد سند التسوية؟ سيتم إلغاء قيد حركات المخزون واستعادة أرصدة الطبالي إلى ما كانت عليه قبل التسوية!" : "Are you sure you want to reopen this adjustment and revert stock movements?")) {
            router.post(route('inventory-adjustments.reopen', adjustment.id));
        }
    };

    const handleDelete = () => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من حذف مسودة سند التسوية نهائياً؟" : "Are you sure you want to delete this draft adjustment?")) {
            router.delete(route('inventory-adjustments.destroy', adjustment.id));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route('inventory-adjustments.index')} className="hover:text-primary transition-colors">
                {lang === "ar" ? "سندات التسوية" : "Adjustments"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-mono font-medium">{adjustment.serial_number}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? `سند تسوية: ${adjustment.serial_number}` : `Adjustment: ${adjustment.serial_number}`} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                <PageHeader
                    icon={SlidersHorizontal}
                    title={lang === "ar" ? `سند تسوية وتصحيح طبالي رقم: ${adjustment.serial_number}` : `Inventory Adjustment Voucher: ${adjustment.serial_number}`}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar" ? "عرض الفروقات المخزنية ومحضر الإحصاء والتحقق من القيد قبل أو بعد الترحيل المالي واللوجستي." : "Review pallet variances before or after posting."}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="bg-surface border border-border hover:bg-surface-muted text-text text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 shadow-2xs"
                            >
                                <Printer className="h-4 w-4" />
                                <span>{lang === "ar" ? "طباعة السند" : "Print Voucher"}</span>
                            </button>

                            {adjustment.status === 'draft' ? (
                                <>
                                    <Link
                                        href={route('inventory-adjustments.edit', adjustment.id)}
                                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <Edit className="h-4 w-4" />
                                        <span>{lang === "ar" ? "تعديل السند" : "Edit Voucher"}</span>
                                    </Link>

                                    <button
                                        onClick={handleApprove}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>{lang === "ar" ? "اعتماد وترحيل سند التسوية" : "Approve & Post"}</span>
                                    </button>

                                    <button
                                        onClick={handleDelete}
                                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>{lang === "ar" ? "حذف" : "Delete"}</span>
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleReopen}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-2xs"
                                    title={lang === "ar" ? "فك الاعتماد وإلغاء القيد وإعادة المخزون لحالته السابقة" : "Reopen Voucher"}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span>{lang === "ar" ? "فك اعتماد السند" : "Reopen Voucher"}</span>
                                </button>
                            )}
                        </div>
                    }
                />

                {/* Status Bar Banner */}
                <div className={`p-4 border font-bold text-xs flex justify-between items-center ${
                    adjustment.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <div>
                            <span>{lang === "ar" ? "حالة المستند الحالي:" : "Voucher Status:"} </span>
                            <span className="font-extrabold uppercase">{adjustment.status === 'approved' ? (lang === "ar" ? "معتمد ومسجل إلكترونياً" : "Approved & Posted") : (lang === "ar" ? "مسودة (بانتظار الاعتماد الإداري)" : "Draft")}</span>
                        </div>
                    </div>
                    {adjustment.approved_at && (
                        <div className="text-[11px] font-mono">
                            {lang === "ar" ? "تاريخ الاعتماد: " : "Approved at: "} {adjustment.approved_at}
                        </div>
                    )}
                </div>

                {/* Metadata Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-3 text-xs">
                        <h3 className="font-bold border-b border-border pb-2 text-primary uppercase">
                            {lang === "ar" ? "بيانات العقد والتعاقد" : "Client & Contract Info"}
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "اسم العميل:" : "Customer:"}</span>
                                <span className="font-bold text-text">{adjustment.customer?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "رقم العقد:" : "Contract:"}</span>
                                <span className="font-mono font-bold text-primary">{adjustment.contract?.contract_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "الفترة التخزينية:" : "Period:"}</span>
                                <span className="font-bold text-text">
                                    {adjustment.period ? (lang === "ar" ? `الفترة ${adjustment.period.period_number}` : `Period ${adjustment.period.period_number}`) : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "تاريخ إجراء التسوية:" : "Adjustment Date:"}</span>
                                <span className="font-mono font-bold text-text">{adjustment.adjustment_date}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-3 text-xs">
                        <h3 className="font-bold border-b border-border pb-2 text-primary uppercase">
                            {lang === "ar" ? "سبب وبيان الفحص والمحضر" : "Reason & Proof File"}
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <span className="text-text-muted block mb-1 font-bold">{lang === "ar" ? "سبب التسوية وبيان الفحص:" : "Audit Reason:"}</span>
                                <p className="p-3 bg-slate-50 border border-border text-text font-semibold rounded-none leading-relaxed">
                                    {adjustment.reason || (lang === "ar" ? "لا توجد ملاحظات مدونة." : "No notes.")}
                                </p>
                            </div>
                            {adjustment.proof_file && (
                                <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200">
                                    <span className="font-bold text-blue-900">{lang === "ar" ? "محضر الفحص والجرد المرفق:" : "Attached Proof File:"}</span>
                                    <a
                                        href={adjustment.proof_file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 text-xs flex items-center gap-1"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>{lang === "ar" ? "تحميل المحضر" : "Download"}</span>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Variances Table */}
                <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                    <h3 className="font-bold text-xs text-primary uppercase border-b border-border pb-2">
                        {lang === "ar" ? "جدول طبالي الفروقات المخزنية الجردية" : "Inventory Adjustment Items & Variances"}
                    </h3>

                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-surface-muted font-bold border-b border-border text-text-muted">
                                <tr>
                                    <th className="p-2.5 text-start w-8">#</th>
                                    <th className="p-2.5 text-start">{lang === "ar" ? "الصنف المخزني" : "Inventory Item"}</th>
                                    <th className="p-2.5 text-center">{lang === "ar" ? "الدرجة / العبوة" : "Variant"}</th>
                                    <th className="p-2.5 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet #"}</th>
                                    <th className="p-2.5 text-center w-32 bg-slate-100">{lang === "ar" ? "رصيد النظام" : "System Qty"}</th>
                                    <th className="p-2.5 text-center w-32 font-bold">{lang === "ar" ? "الكمية الفعلية" : "Actual Count"}</th>
                                    <th className="p-2.5 text-center w-32 font-black">{lang === "ar" ? "فرق التسوية" : "Variance"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {adjustment.items?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                        <td className="p-2.5 font-bold text-text">{item.inventory_item?.name || '—'}</td>
                                        <td className="p-2.5 text-center font-semibold text-text-muted">{item.variant?.name || '—'}</td>
                                        <td className="p-2.5 text-center font-mono font-bold text-primary">
                                            طبلية #{item.pallet?.pallet_number || item.pallet?.code || item.pallet_id}
                                        </td>
                                        <td className="p-2.5 text-center font-mono font-bold text-slate-700 bg-slate-100/60">
                                            {item.system_quantity}
                                        </td>
                                        <td className="p-2.5 text-center font-mono font-black text-slate-900">
                                            {item.actual_quantity}
                                        </td>
                                        <td className="p-2.5 text-center font-mono font-black">
                                            <span className={`px-2 py-1 block rounded-none border ${
                                                item.variance_quantity > 0
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : item.variance_quantity < 0
                                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {item.variance_quantity > 0 ? `+${item.variance_quantity}` : item.variance_quantity < 0 ? `${item.variance_quantity}` : '0'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
