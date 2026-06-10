import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Plus, Eye, FileText, Search, X, Edit, Trash2, CheckCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import Tooltip from '@/Components/Tooltip';
import Modal from '@/Components/Modal';

export default function InvoicesIndex({ invoices, filters }) {
    const { lang } = useLang();
    const [searchParams, setSearchParams] = useState({
        search: filters?.search || '',
        status: filters?.status || '',
        from_date: filters?.from_date || '',
        to_date: filters?.to_date || '',
        trashed: filters?.trashed || '',
    });

    const [unapproveModal, setUnapproveModal] = useState({ isOpen: false, invoiceId: null, password: '', processing: false, error: '' });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('sales.invoices.index'), searchParams, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchParams({ search: '', status: '', from_date: '', to_date: '', trashed: '' });
        router.get(route('sales.invoices.index'));
    };

    const handleDelete = (id) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
            router.delete(route('sales.invoices.destroy', id));
        }
    };

    const handleApprove = (id) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من اعتماد هذه الفاتورة؟ سيتم إنشاء قيد يومية ولا يمكن التراجع بعد الاعتماد إلا بصلاحية.' : 'Are you sure you want to approve this invoice? A journal entry will be created.')) {
            router.post(route('sales.invoices.approve', id));
        }
    };

    const handleUnapproveSubmit = (e) => {
        e.preventDefault();
        setUnapproveModal(prev => ({ ...prev, processing: true, error: '' }));
        
        router.post(route('sales.invoices.unapprove', unapproveModal.invoiceId), { password: unapproveModal.password }, {
            preserveScroll: true,
            onSuccess: () => {
                setUnapproveModal({ isOpen: false, invoiceId: null, password: '', processing: false, error: '' });
            },
            onError: (errors) => {
                setUnapproveModal(prev => ({ ...prev, processing: false, error: errors.password || (lang === 'ar' ? 'كلمة المرور غير صحيحة' : 'Invalid password') }));
            }
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'فواتير المبيعات' : 'Sales Invoices'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'فواتير المبيعات' : 'Sales Invoices'} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {lang === 'ar' ? 'فواتير المبيعات' : 'Sales Invoices'}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'إدارة فواتير المبيعات والإيجارات' : 'Manage Sales and Rent Invoices'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip content={lang === 'ar' ? 'إنشاء فاتورة' : 'New Invoice'}>
                            <PrimaryButton onClick={() => router.get(route('sales.invoices.create'))} className="h-9 w-9 !p-0 flex items-center justify-center">
                                <Plus className="h-4 w-4" />
                            </PrimaryButton>
                        </Tooltip>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <TextInput
                                className="w-full h-[30px] text-xs"
                                placeholder={lang === 'ar' ? 'ابحث برقم الفاتورة أو العميل...' : 'Search invoice no or customer...'}
                                value={searchParams.search}
                                onChange={e => setSearchParams({...searchParams, search: e.target.value})}
                                icon={<Search className="h-4 w-4 text-text-muted" />}
                            />
                        </div>
                        <div className="w-full md:w-32 shrink-0">
                            <select 
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-xs h-[30px] py-1"
                                value={searchParams.status}
                                onChange={e => setSearchParams({...searchParams, status: e.target.value})}
                            >
                                <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                                <option value="draft">{lang === 'ar' ? 'مسودة' : 'Draft'}</option>
                                <option value="approved">{lang === 'ar' ? 'معتمد' : 'Approved'}</option>
                                <option value="paid">{lang === 'ar' ? 'مدفوع' : 'Paid'}</option>
                                <option value="partially_paid">{lang === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid'}</option>
                                <option value="cancelled">{lang === 'ar' ? 'ملغي' : 'Cancelled'}</option>
                            </select>
                        </div>
                        <div className="w-full md:w-32 shrink-0">
                            <select 
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-xs h-[30px] py-1"
                                value={searchParams.trashed}
                                onChange={e => setSearchParams({...searchParams, trashed: e.target.value})}
                            >
                                <option value="">{lang === 'ar' ? 'بدون المحذوف' : 'Without Deleted'}</option>
                                <option value="true">{lang === 'ar' ? 'إظهار المحذوف' : 'Show Deleted'}</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Tooltip content={lang === 'ar' ? 'من تاريخ' : 'From Date'}>
                                <TextInput type="date" className="w-[120px] text-xs h-[30px]" value={searchParams.from_date} onChange={e => setSearchParams({...searchParams, from_date: e.target.value})} />
                            </Tooltip>
                            <span className="text-text-muted">-</span>
                            <Tooltip content={lang === 'ar' ? 'إلى تاريخ' : 'To Date'}>
                                <TextInput type="date" className="w-[120px] text-xs h-[30px]" value={searchParams.to_date} onChange={e => setSearchParams({...searchParams, to_date: e.target.value})} />
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Tooltip content={lang === 'ar' ? 'بحث' : 'Search'}>
                                <PrimaryButton type="submit" className="h-[30px] w-[30px] !p-0 flex items-center justify-center flex-shrink-0">
                                    <Search className="h-4 w-4" />
                                </PrimaryButton>
                            </Tooltip>
                            <Tooltip content={lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}>
                                <SecondaryButton type="button" onClick={clearFilters} className="h-[30px] w-[30px] !p-0 flex items-center justify-center flex-shrink-0">
                                    <X className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                        </div>
                    </form>
                </div>

                {/* Content Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'رقم الفاتورة' : 'Invoice No'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'التاريخ' : 'Date'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'العميل' : 'Customer'}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'المبلغ' : 'Amount'}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'الحالة' : 'Status'}
                                    </th>
                                    <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'إجراءات' : 'Actions'}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-surface">
                                {invoices.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-text-muted">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="h-10 w-10 opacity-20 mb-3" />
                                                <p>{lang === 'ar' ? 'لا توجد فواتير مسجلة' : 'No invoices found'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.data.map(invoice => (
                                        <tr key={invoice.id} className={`hover:bg-surface-muted/30 transition-colors ${invoice.deleted_at ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary font-mono">
                                                {invoice.invoice_number}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-text font-mono" dir="ltr">
                                                {new Date(invoice.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text max-w-xs truncate" title={invoice.customer?.name}>
                                                {invoice.customer?.name || '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-text font-mono" dir="ltr">
                                                {Number(invoice.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    invoice.deleted_at ? 'bg-danger/10 text-danger border border-danger/20' :
                                                    (invoice.status === 'approved' || invoice.status === 'paid') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                                                    invoice.status === 'cancelled' ? 'bg-danger/10 text-danger border border-danger/20' :
                                                    'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                }`}>
                                                    {invoice.deleted_at ? (lang === 'ar' ? 'محذوف' : 'Deleted') : 
                                                     invoice.status === 'approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') : 
                                                     invoice.status === 'paid' ? (lang === 'ar' ? 'مدفوع' : 'Paid') :
                                                     invoice.status === 'partially_paid' ? (lang === 'ar' ? 'مدفوع جزئياً' : 'Partially Paid') :
                                                     invoice.status === 'cancelled' ? (lang === 'ar' ? 'ملغي' : 'Cancelled') :
                                                     (lang === 'ar' ? 'مسودة' : 'Draft')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-end text-sm">
                                                <div className="flex justify-end items-center gap-1">
                                                    {invoice.status === 'draft' && !invoice.deleted_at && (
                                                        <>
                                                            <Tooltip content={lang === 'ar' ? 'اعتماد الفاتورة' : 'Approve'}>
                                                                <button 
                                                                    onClick={() => handleApprove(invoice.id)}
                                                                    className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md transition-colors"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip content={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                                <button 
                                                                    onClick={() => router.get(route('sales.invoices.edit', invoice.id))}
                                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip content={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                                <button 
                                                                    onClick={() => handleDelete(invoice.id)}
                                                                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {invoice.status === 'approved' && !invoice.deleted_at && (
                                                        <Tooltip content={lang === 'ar' ? 'فك الاعتماد (إلغاء الترحيل)' : 'Unapprove (Revoke)'}>
                                                            <button 
                                                                onClick={() => setUnapproveModal({ isOpen: true, invoiceId: invoice.id, password: '', processing: false, error: '' })}
                                                                className="p-1.5 text-text-muted hover:text-amber-600 hover:bg-amber-500/10 rounded-md transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    {invoice.status === 'cancelled' && !invoice.deleted_at && (
                                                        <Tooltip content={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                            <button 
                                                                onClick={() => handleDelete(invoice.id)}
                                                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content={lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}>
                                                        <Link href={route('sales.invoices.show', invoice.id)} className="text-text hover:text-primary transition-colors h-8 w-8 !p-0 flex items-center justify-center rounded-md hover:bg-surface-muted">
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {invoices.data.length > 0 && (
                        <div className="border-t border-border">
                            <Pagination links={invoices.links} from={invoices.from} to={invoices.to} total={invoices.total} />
                        </div>
                    )}
                </div>
            </div>

            <Modal show={unapproveModal.isOpen} onClose={() => setUnapproveModal(prev => ({...prev, isOpen: false}))} maxWidth="sm">
                <form onSubmit={handleUnapproveSubmit} className="p-6">
                    <h2 className="text-lg font-bold text-text mb-4">
                        {lang === 'ar' ? 'تأكيد فك الاعتماد' : 'Confirm Unapprove'}
                    </h2>
                    <p className="text-sm text-text-muted mb-4">
                        {lang === 'ar' ? 'سيتم إلغاء قيد اليومية المرتبط وتغيير حالة الفاتورة إلى ملغية. يرجى إدخال كلمة المرور الخاصة بك لتأكيد الإجراء (يتطلب صلاحية فك الاعتماد).' : 'The associated journal entry will be deleted and the invoice will be cancelled. Please enter your password to confirm (requires unapprove permission).'}
                    </p>
                    <div className="mb-4">
                        <TextInput
                            type="password"
                            placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
                            className="w-full text-center"
                            value={unapproveModal.password}
                            onChange={(e) => setUnapproveModal(prev => ({...prev, password: e.target.value}))}
                            required
                            autoFocus
                        />
                        {unapproveModal.error && <p className="text-danger text-xs mt-1">{unapproveModal.error}</p>}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <SecondaryButton type="button" onClick={() => setUnapproveModal(prev => ({...prev, isOpen: false}))}>
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={unapproveModal.processing} className="bg-amber-600 hover:bg-amber-700 ring-amber-600">
                            {unapproveModal.processing ? (lang === 'ar' ? 'جاري الفك...' : 'Processing...') : (lang === 'ar' ? 'تأكيد فك الاعتماد' : 'Confirm Unapprove')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
