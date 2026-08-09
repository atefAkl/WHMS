import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { SlidersHorizontal, CheckCircle2, Printer, FileText, ArrowRight, Home, ChevronRight, Download, Scale } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';

export default function Show({ adjustment }) {
    const { lang } = useLang();

    const handleApprove = () => {
        if (confirm(lang === "ar" ? "هل أنت تأكد من ترحيل واعتماد سند التسوية القيدي؟ سيتم قيد الفروقات في حركات المخزون وتحديث أرصدة الطبالي." : "Are you sure you want to approve and post this adjustment?")) {
            router.post(route('inventory-adjustments.approve', adjustment.id));
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
                            {lang === "ar" ? "عرض الفروقات المخزنية ومحضر الإحصاء والتحقق من القيد قبل الترحيل المالي واللوجستي." : "Review pallet variances before posting."}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="bg-surface border border-border hover:bg-surface-muted text-text text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-2xs"
                            >
                                <Printer className="h-4 w-4" />
                                <span>{lang === "ar" ? "طباعة السند" : "Print Voucher"}</span>
                            </button>

                            {adjustment.status === 'draft' && (
                                <button
                                    onClick={handleApprove}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2 flex items-center gap-1.5 shadow-2xs"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span>{lang === "ar" ? "اعتماد وترحيل سند التسوية" : "Approve & Post"}</span>
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

                {/* Pallets Variances Table */}
                <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                    <h3 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-border pb-2">
                        {lang === "ar" ? "جدول طبالي الفروقات المخزنية الجردية" : "Pallet Inventory Variance Audit Details"}
                    </h3>

                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-surface-muted font-bold border-b border-border text-text-muted">
                                <tr>
                                    <th className="p-3 text-start w-8">#</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "الصنف المخزني" : "Item"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الدرجة / العبوة" : "Grade / Box"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet #"}</th>
                                    <th className="p-3 text-center w-28">{lang === "ar" ? "رصيد النظام" : "System Qty"}</th>
                                    <th className="p-3 text-center w-32">{lang === "ar" ? "الكمية الفعلية" : "Actual Qty"}</th>
                                    <th className="p-3 text-center w-32">{lang === "ar" ? "فرق التسوية" : "Variance"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {adjustment.items?.map((item, idx) => (
                                    <tr key={item.id || idx} className="hover:bg-slate-50">
                                        <td className="p-3 font-mono text-text-muted">{idx + 1}</td>
                                        <td className="p-3 font-bold text-text">{item.inventory_item?.name || '—'}</td>
                                        <td className="p-3 text-center font-semibold text-text-muted">{item.variant?.name || '—'}</td>
                                        <td className="p-3 text-center font-mono font-bold text-primary">طبلية #{item.pallet?.pallet_number || item.pallet?.code || item.pallet_id}</td>
                                        <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50">{item.system_quantity}</td>
                                        <td className="p-3 text-center font-mono font-black text-black bg-emerald-50/40">{item.actual_quantity}</td>
                                        <td className="p-3 text-center font-mono font-black text-sm">
                                            <span className={`px-2 py-1 block rounded-none border ${
                                                item.variance_quantity > 0
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : item.variance_quantity < 0
                                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                {item.variance_quantity > 0 ? `+${item.variance_quantity}` : item.variance_quantity}
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
