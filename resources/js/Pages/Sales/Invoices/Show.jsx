import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, FileText, ArrowLeft, ArrowRight, Printer, CheckCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Tooltip from '@/Components/Tooltip';

export default function ShowInvoice({ invoice }) {
    const { lang } = useLang();

    const handleApprove = () => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من اعتماد هذه الفاتورة؟ سيتم إنشاء قيد يومية ولا يمكن التراجع.' : 'Are you sure you want to approve this invoice?')) {
            router.post(route('sales.invoices.approve', invoice.id));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted print:hidden">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('sales.invoices.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'فواتير المبيعات' : 'Sales Invoices'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{invoice.invoice_number}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? `فاتورة ${invoice.invoice_number}` : `Invoice ${invoice.invoice_number}`} />

            <div className="max-w-4xl mx-auto pb-12 flex flex-col gap-6 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Header Actions */}
                <div className="flex items-center justify-between print:hidden">
                    <h1 className="text-2xl font-bold text-text">
                        {lang === 'ar' ? `تفاصيل الفاتورة` : `Invoice Details`}
                    </h1>
                    <div className="flex items-center gap-3">
                        <SecondaryButton onClick={() => router.get(route('sales.invoices.index'))}>
                            {lang === 'ar' ? <ArrowRight className="h-4 w-4 ml-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                            {lang === 'ar' ? 'عودة' : 'Back'}
                        </SecondaryButton>
                        <SecondaryButton onClick={handlePrint} className="bg-surface">
                            <Printer className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                            {lang === 'ar' ? 'طباعة' : 'Print'}
                        </SecondaryButton>
                        {invoice.status === 'draft' && !invoice.deleted_at && (
                            <PrimaryButton onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 ring-emerald-600">
                                <CheckCircle className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                                {lang === 'ar' ? 'اعتماد وإنشاء قيد' : 'Approve & Post'}
                            </PrimaryButton>
                        )}
                    </div>
                </div>

                {/* Printable Invoice Area */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-8 print:shadow-none print:border-none print:p-0">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start border-b border-border pb-6 mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-primary mb-1">
                                {lang === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}
                            </h2>
                            <p className="text-text-muted font-mono">{invoice.invoice_number}</p>
                            
                            {invoice.status === 'approved' && (
                                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                    {lang === 'ar' ? 'معتمدة' : 'Approved'}
                                </span>
                            )}
                            {invoice.status === 'draft' && (
                                <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    {lang === 'ar' ? 'مسودة' : 'Draft'}
                                </span>
                            )}
                        </div>
                        <div className="text-end">
                            <div className="mb-2">
                                <span className="text-text-muted text-sm block">{lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</span>
                                <span className="text-text font-bold" dir="ltr">{new Date(invoice.date).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="text-text-muted text-sm block">{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</span>
                                <span className="text-text font-bold" dir="ltr">{new Date(invoice.due_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Info */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">
                                {lang === 'ar' ? 'بيانات العميل' : 'Billed To'}
                            </h3>
                            <p className="text-lg font-bold text-text">{invoice.customer?.name}</p>
                            {/* Can add more customer details here */}
                        </div>
                        {invoice.contract && (
                            <div className="text-end">
                                <h3 className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">
                                    {lang === 'ar' ? 'معلومات العقد' : 'Contract Info'}
                                </h3>
                                <p className="text-text">{lang === 'ar' ? 'رقم العقد:' : 'Contract No:'} <span className="font-bold">{invoice.contract.contract_number}</span></p>
                            </div>
                        )}
                    </div>

                    {/* Lines Table */}
                    <table className="w-full mb-8">
                        <thead className="border-b-2 border-border text-text-muted text-sm">
                            <tr>
                                <th className="py-3 text-start font-semibold">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                                <th className="py-3 text-center font-semibold">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                                <th className="py-3 text-center font-semibold">{lang === 'ar' ? 'السعر' : 'Unit Price'}</th>
                                <th className="py-3 text-center font-semibold">{lang === 'ar' ? 'الضريبة %' : 'Tax %'}</th>
                                <th className="py-3 text-end font-semibold">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invoice.lines?.map(line => (
                                <tr key={line.id}>
                                    <td className="py-4 text-text">{line.description}</td>
                                    <td className="py-4 text-center text-text" dir="ltr">{line.quantity}</td>
                                    <td className="py-4 text-center text-text" dir="ltr">{Number(line.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-4 text-center text-text" dir="ltr">{line.tax_rate}%</td>
                                    <td className="py-4 text-end text-text font-bold" dir="ltr">{Number(line.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64">
                            <div className="flex justify-between py-2 text-text">
                                <span>{lang === 'ar' ? 'الإجمالي قبل الضريبة' : 'Subtotal'}</span>
                                <span dir="ltr">{Number(invoice.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-2 text-text border-b border-border">
                                <span>{lang === 'ar' ? 'قيمة الضريبة المضافة' : 'VAT Amount'}</span>
                                <span dir="ltr">{Number(invoice.tax_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-4 text-lg font-bold text-primary">
                                <span>{lang === 'ar' ? 'الإجمالي الكلي' : 'Total Amount'}</span>
                                <span dir="ltr">{Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {invoice.notes && (
                        <div className="mt-8 pt-8 border-t border-border text-sm text-text-muted">
                            <h4 className="font-bold mb-2">{lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}:</h4>
                            <p className="whitespace-pre-line">{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
