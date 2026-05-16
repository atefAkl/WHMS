import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useLang } from '@/Contexts/LanguageContext';
import { 
    FileText, Calendar, Users, Box, CreditCard, Check, ChevronRight, User, Building2, Download
} from 'lucide-react';
import SecondaryButton from '@/Components/SecondaryButton';

const SectionCard = ({ title, icon: Icon, children }) => (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden mb-4">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-muted/30">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-[13px] font-bold text-text">{title}</h2>
        </div>
        <div className="p-4">{children}</div>
    </div>
);

const Field = ({ label, value, dir }) => (
    <div>
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-0.5">{label}</p>
        <p className={`text-[13px] font-semibold text-text ${dir === 'ltr' ? 'font-mono' : ''}`} dir={dir}>{value || '—'}</p>
    </div>
);

export default function Show({ contract }) {
    const { lang } = useLang();

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('customers.index'))}>
                {lang === 'ar' ? 'العملاء' : 'Customers'}
            </span>
            <ChevronRight className={lang === 'ar' ? 'h-3.5 w-3.5 rotate-180' : 'h-3.5 w-3.5'} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('customers.show', contract.customer_id))}>
                {contract.customer?.name}
            </span>
            <ChevronRight className={lang === 'ar' ? 'h-3.5 w-3.5 rotate-180' : 'h-3.5 w-3.5'} />
            <span className="text-primary font-medium">{contract.contract_number}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={contract.contract_number} />

            <div className="max-w-5xl mx-auto pb-8 space-y-4">
                {/* Header Action Card */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface shadow-sm px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-text font-mono leading-tight">{contract.contract_number}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    contract.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'
                                }`}>
                                    {contract.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Download PDF Button (mock for now) */}
                        <SecondaryButton type="button">
                            <Download className="h-4 w-4 me-1.5" />
                            {lang === 'ar' ? 'تحميل العقد' : 'Download PDF'}
                        </SecondaryButton>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timing */}
                    <SectionCard title={lang === 'ar' ? 'التقسيم الزمني' : 'Timing'} icon={Calendar}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label={lang === 'ar' ? 'تاريخ الكتابة' : 'Write Date'} value={`${contract.write_date} / ${contract.write_date_hijri}`} dir="ltr" />
                            <Field label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'} value={`${contract.start_date} / ${contract.start_date_hijri}`} dir="ltr" />
                            <Field label={lang === 'ar' ? 'تاريخ النهاية' : 'End Date'} value={contract.end_date} dir="ltr" />
                            <Field label={lang === 'ar' ? 'الفترة الإلزامية' : 'Mandatory Period'} value={`${contract.mandatory_period} ${lang === 'ar' ? 'أشهر' : 'Months'}`} />
                            <Field label={lang === 'ar' ? 'فترة التجديد' : 'Renewal Period'} value={`${contract.renewal_period} ${lang === 'ar' ? 'أشهر' : 'Months'}`} />
                        </div>
                    </SectionCard>

                    {/* Stakeholders */}
                    <SectionCard title={lang === 'ar' ? 'أصحاب المصلحة' : 'Stakeholders'} icon={Users}>
                        <div className="space-y-4">
                            {/* Institution */}
                            <div className="flex items-start gap-3">
                                <Building2 className="h-4 w-4 text-primary mt-0.5" />
                                <div>
                                    <p className="text-[12px] font-bold text-text mb-1">{lang === 'ar' ? 'المؤسسة' : 'Institution'} - Warehouse OS</p>
                                    <p className="text-[10px] text-text-muted" dir="ltr">CR: 1010101010 | VAT: 300000000000003</p>
                                </div>
                            </div>
                            
                            {/* Customer */}
                            <div className="flex items-start gap-3">
                                <User className="h-4 w-4 text-primary mt-0.5" />
                                <div>
                                    <p className="text-[12px] font-bold text-text mb-1">{lang === 'ar' ? 'العميل' : 'Customer'} - {contract.customer?.name}</p>
                                    <p className="text-[10px] text-text-muted" dir="ltr">{contract.customer?.phone_number} | ID: {contract.customer?.cr_number || contract.customer?.id_number}</p>
                                </div>
                            </div>

                            {/* Agent */}
                            {contract.agent && (
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-[12px] font-bold text-text mb-1">{lang === 'ar' ? 'المندوب' : 'Agent'} - {contract.agent.name}</p>
                                        <p className="text-[10px] text-text-muted" dir="ltr">{contract.agent.phone_number}</p>
                                        <div className="flex gap-2 mt-1">
                                            {contract.agent.can_sign && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">{lang === 'ar' ? 'يوقّع' : 'Signs'}</span>}
                                            {contract.agent.can_withdraw_goods && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">{lang === 'ar' ? 'يسحب' : 'Withdraws'}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>

                {/* Storage Allocation Items */}
                <SectionCard title={lang === 'ar' ? 'وحدات التخزين' : 'Storage Allocation'} icon={Box}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase">
                                <tr>
                                    <th className="px-3 py-2">{lang === 'ar' ? 'الصنف' : 'Item'}</th>
                                    <th className="px-3 py-2 w-24 text-center">{lang === 'ar' ? 'العدد' : 'Qty'}</th>
                                    <th className="px-3 py-2 w-32">{lang === 'ar' ? 'الإيجار الشهري' : 'Monthly Rent'}</th>
                                    <th className="px-3 py-2 w-28">{lang === 'ar' ? 'الخصم' : 'Discount'}</th>
                                    <th className="px-3 py-2">{lang === 'ar' ? 'الإجمالي (شامل الضريبة)' : 'Total (Inc. VAT)'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {contract.items?.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 font-medium">{lang === 'ar' ? item.storage_item?.name_ar : (item.storage_item?.name_en || item.storage_item?.name_ar)}</td>
                                        <td className="px-3 py-2 text-center font-mono">{item.unit_count}</td>
                                        <td className="px-3 py-2 font-mono" dir="ltr">{item.monthly_rent}</td>
                                        <td className="px-3 py-2 font-mono text-danger" dir="ltr">{item.discount > 0 ? `-${item.discount}` : '0'}</td>
                                        <td className="px-3 py-2 text-xs font-mono font-bold text-emerald-600" dir="ltr">{item.subtotal}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-surface-muted/50 border-t border-border">
                                <tr>
                                    <td colSpan="4" className="px-3 py-2 text-end text-[11px] font-bold text-text-muted uppercase tracking-wide">
                                        {lang === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}
                                    </td>
                                    <td className="px-3 py-2 text-[14px] font-mono font-bold text-emerald-600" dir="ltr">
                                        {contract.items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </SectionCard>

                {/* Terms and Payments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Terms */}
                    <SectionCard title={lang === 'ar' ? 'الشروط' : 'Terms'} icon={FileText}>
                        {contract.terms?.length === 0 ? (
                            <p className="text-[12px] text-text-muted text-center py-4">{lang === 'ar' ? 'لا توجد شروط مخصصة.' : 'No custom terms.'}</p>
                        ) : (
                            <ul className="space-y-2">
                                {contract.terms?.map(term => (
                                    <li key={term.id} className="flex items-start gap-2 text-[12px] text-text leading-relaxed">
                                        <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                        <span>{lang === 'ar' ? term.text_ar : (term.text_en || term.text_ar)}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </SectionCard>

                    {/* Payments */}
                    <SectionCard title={lang === 'ar' ? 'المدفوعات الأولية' : 'Initial Payments'} icon={CreditCard}>
                        {contract.payments?.length === 0 ? (
                            <p className="text-[12px] text-text-muted text-center py-4">{lang === 'ar' ? 'لم يتم تسجيل دفعات.' : 'No payments recorded.'}</p>
                        ) : (
                            <div className="space-y-2">
                                {contract.payments?.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface-muted">
                                        <div>
                                            <p className="text-[12px] font-bold text-emerald-600 font-mono mb-0.5">{p.amount}</p>
                                            <p className="text-[10px] text-text-muted">{p.payment_date} | {p.method}</p>
                                        </div>
                                        {p.notes && <p className="text-[10px] text-text-muted italic max-w-[120px] truncate">{p.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
