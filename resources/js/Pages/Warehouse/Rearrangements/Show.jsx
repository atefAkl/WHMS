import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { ArrowLeftRight, CheckCircle2, Printer, Home, ChevronRight, RotateCcw, Edit, Trash2, Scale, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';

export default function Show({ rearrangement }) {
    const { lang } = useLang();

    const handleApprove = () => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من ترحيل واعتماد سند ترتيب ونقل الطبالي؟ سيتم تقييد حركات النقل وتحديث الطبالي دون التأثير على إجمالي كميات العقد." : "Approve and post pallet rearrangement?")) {
            router.post(route('pallet-rearrangements.approve', rearrangement.id));
        }
    };

    const handleReopen = () => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من فك اعتماد السند؟ سيتم إلغاء حركات النقل واستعادة كميات الطبالي السابقة!" : "Reopen rearrangement voucher?")) {
            router.post(route('pallet-rearrangements.reopen', rearrangement.id));
        }
    };

    const handleDelete = () => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من حذف مسودة السند؟" : "Delete draft rearrangement voucher?")) {
            router.delete(route('pallet-rearrangements.destroy', rearrangement.id));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route('pallet-rearrangements.index')} className="hover:text-primary transition-colors">
                {lang === "ar" ? "ترتيب الطبالي" : "Rearrangements"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-mono font-medium">{rearrangement.serial_number}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? `سند ترتيب طبالي: ${rearrangement.serial_number}` : `Rearrangement: ${rearrangement.serial_number}`} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                <PageHeader
                    icon={ArrowLeftRight}
                    title={lang === "ar" ? `سند ترتيب ونقل طبالي رقم: ${rearrangement.serial_number}` : `Pallet Rearrangement Voucher: ${rearrangement.serial_number}`}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar" ? "عرض تفاصيل حركات النقل الداخلي بين الطبالي وإجمالي التوازن قبل أو بعد الاعتماد." : "Review pallet transfer rows and total balance."}
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

                            {rearrangement.status === 'draft' ? (
                                <>
                                    <Link
                                        href={route('pallet-rearrangements.edit', rearrangement.id)}
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
                                        <span>{lang === "ar" ? "اعتماد وترحيل النقل" : "Approve & Post"}</span>
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
                                    title={lang === "ar" ? "فك الاعتماد وإلغاء حركات النقل" : "Reopen Voucher"}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span>{lang === "ar" ? "فك اعتماد السند" : "Reopen Voucher"}</span>
                                </button>
                            )}
                        </div>
                    }
                />

                {/* Status Bar */}
                <div className={`p-4 border font-bold text-xs flex justify-between items-center ${
                    rearrangement.status === 'approved'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <div>
                            <span>{lang === "ar" ? "حالة السند الحالي:" : "Voucher Status:"} </span>
                            <span className="font-extrabold uppercase">{rearrangement.status === 'approved' ? (lang === "ar" ? "معتمد ومسجل بالكامل" : "Approved & Posted") : (lang === "ar" ? "مسودة (بانتظار اعتماد مسؤول التخزين)" : "Draft")}</span>
                        </div>
                    </div>
                    {rearrangement.approved_at && (
                        <div className="text-[11px] font-mono">
                            {lang === "ar" ? "تاريخ الاعتماد: " : "Approved at: "} {rearrangement.approved_at}
                        </div>
                    )}
                </div>

                {/* Metadata Info Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-3 text-xs">
                        <h3 className="font-bold border-b border-border pb-2 text-primary uppercase">
                            {lang === "ar" ? "بيانات العقد والعميل" : "Client & Contract Info"}
                        </h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "اسم العميل:" : "Customer:"}</span>
                                <span className="font-bold text-text">{rearrangement.customer?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "رقم العقد:" : "Contract:"}</span>
                                <span className="font-mono font-bold text-primary">{rearrangement.contract?.contract_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "الفترة التخزينية:" : "Period:"}</span>
                                <span className="font-bold text-text">
                                    {rearrangement.period ? (lang === "ar" ? `الفترة ${rearrangement.period.period_number}` : `Period ${rearrangement.period.period_number}`) : '—'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">{lang === "ar" ? "تاريخ النقل:" : "Transfer Date:"}</span>
                                <span className="font-mono font-bold text-text">{rearrangement.rearrangement_date}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-3 text-xs">
                        <h3 className="font-bold border-b border-border pb-2 text-primary uppercase">
                            {lang === "ar" ? "تفاصيل أسباب الترتيب والملاحظات" : "Rearrangement Reason / Notes"}
                        </h3>
                        <div className="space-y-3">
                            <p className="p-3 bg-slate-50 border border-border text-text font-semibold rounded-none leading-relaxed min-h-[90px]">
                                {rearrangement.notes || (lang === "ar" ? "لا توجد ملاحظات مدونة." : "No notes.")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items Transfer Table */}
                <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                    <h3 className="font-bold text-xs text-primary uppercase border-b border-border pb-2">
                        {lang === "ar" ? "جدول حركات ترتيب ونقل كميات الطبالي" : "Pallet Quantity Transfer Movements"}
                    </h3>

                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-surface-muted font-bold border-b border-border text-text-muted">
                                <tr>
                                    <th className="p-2.5 text-start w-8">#</th>
                                    <th className="p-2.5 text-center w-36">{lang === "ar" ? "نوع الحركة" : "Movement Type"}</th>
                                    <th className="p-2.5 text-start">{lang === "ar" ? "الصنف المخزني" : "Inventory Item"}</th>
                                    <th className="p-2.5 text-center">{lang === "ar" ? "الدرجة / العبوة" : "Grade / Box Size"}</th>
                                    <th className="p-2.5 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet #"}</th>
                                    <th className="p-2.5 text-center w-32 font-black">{lang === "ar" ? "الكمية المحولة" : "Transferred Qty"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {rearrangement.items?.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                        <td className="p-2.5 text-center font-bold">
                                            <span className={`px-2 py-1 inline-flex items-center gap-1 border font-black ${
                                                item.type === 'in' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                                            }`}>
                                                {item.type === 'in' ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                                <span>{item.type === 'in' ? (lang === "ar" ? "مدخلات (+ إلى)" : "IN (To)") : (lang === "ar" ? "مخرجات (- من)" : "OUT (From)")}</span>
                                            </span>
                                        </td>
                                        <td className="p-2.5 font-bold text-text">{item.inventory_item?.name || '—'}</td>
                                        <td className="p-2.5 text-center font-semibold text-text-muted">{item.variant?.name || '—'}</td>
                                        <td className="p-2.5 text-center font-mono font-bold text-primary">
                                            طبلية #{item.pallet?.pallet_number || item.pallet?.code || item.pallet_id}
                                        </td>
                                        <td className="p-2.5 text-center font-mono font-black text-slate-900 text-sm">
                                            {item.quantity}
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
