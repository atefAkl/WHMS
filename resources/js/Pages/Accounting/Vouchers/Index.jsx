import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Plus, Eye, Receipt, Search, X, Edit, Trash2, CheckCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import Tooltip from '@/Components/Tooltip';
import Modal from '@/Components/Modal';

export default function VouchersIndex({ vouchers, filters }) {
    const { lang } = useLang();
    const [searchParams, setSearchParams] = useState({
        search: filters?.search || '',
        type: filters?.type || '',
        status: filters?.status || '',
        from_date: filters?.from_date || '',
        to_date: filters?.to_date || '',
        trashed: filters?.trashed || '',
    });

    const [unapproveModal, setUnapproveModal] = useState({ isOpen: false, voucherId: null, password: '', processing: false, error: '' });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('accounting.financial-vouchers.index'), searchParams, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchParams({ search: '', type: '', status: '', from_date: '', to_date: '', trashed: '' });
        router.get(route('accounting.financial-vouchers.index'));
    };

    const handleDelete = (id) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا السند؟' : 'Are you sure you want to delete this voucher?')) {
            router.delete(route('accounting.financial-vouchers.destroy', id));
        }
    };

    const handleApprove = (id) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من اعتماد هذا السند؟ سيتم إنشاء قيد يومية ولا يمكن التراجع بعد الاعتماد.' : 'Are you sure you want to approve this voucher? A journal entry will be created and this cannot be undone.')) {
            router.post(route('accounting.financial-vouchers.approve', id));
        }
    };

    const handleUnapproveSubmit = (e) => {
        e.preventDefault();
        setUnapproveModal(prev => ({ ...prev, processing: true, error: '' }));
        
        router.post(route('accounting.financial-vouchers.unapprove', unapproveModal.voucherId), { password: unapproveModal.password }, {
            preserveScroll: true,
            onSuccess: () => {
                setUnapproveModal({ isOpen: false, voucherId: null, password: '', processing: false, error: '' });
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
            <Link href={route('accounting.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'الحسابات' : 'Accounting'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'السندات المالية' : 'Financial Vouchers'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'السندات المالية' : 'Financial Vouchers'} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {lang === 'ar' ? 'السندات المالية' : 'Financial Vouchers'}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'إدارة سندات القبض والصرف' : 'Manage Receipt and Payment Vouchers'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip content={lang === 'ar' ? 'إنشاء سند جديد' : 'New Voucher'}>
                            <PrimaryButton onClick={() => router.get(route('accounting.financial-vouchers.create'))} className="h-9 w-9 !p-0 flex items-center justify-center">
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
                                placeholder={lang === 'ar' ? 'ابحث برقم السند أو البيان...' : 'Search reference or description...'}
                                value={searchParams.search}
                                onChange={e => setSearchParams({...searchParams, search: e.target.value})}
                                icon={<Search className="h-4 w-4 text-text-muted" />}
                            />
                        </div>
                        <div className="w-full md:w-32 shrink-0">
                            <select 
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-xs h-[30px] py-1"
                                value={searchParams.type}
                                onChange={e => setSearchParams({...searchParams, type: e.target.value})}
                            >
                                <option value="">{lang === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
                                <option value="receipt">{lang === 'ar' ? 'سند قبض' : 'Receipt'}</option>
                                <option value="payment">{lang === 'ar' ? 'سند صرف' : 'Payment'}</option>
                            </select>
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
                                        {lang === 'ar' ? 'رقم السند' : 'Voucher No'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'التاريخ' : 'Date'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'النوع' : 'Type'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'البيان' : 'Description'}
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
                                {vouchers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-text-muted">
                                            <div className="flex flex-col items-center justify-center">
                                                <Receipt className="h-10 w-10 opacity-20 mb-3" />
                                                <p>{lang === 'ar' ? 'لا توجد سندات مسجلة' : 'No vouchers found'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    vouchers.data.map(voucher => (
                                        <tr key={voucher.id} className={`hover:bg-surface-muted/30 transition-colors ${voucher.deleted_at ? 'opacity-50' : ''}`}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary font-mono">
                                                {voucher.voucher_number}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-text font-mono" dir="ltr">
                                                {new Date(voucher.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                                    voucher.type === 'receipt' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                    {voucher.type === 'receipt' ? (lang === 'ar' ? 'سند قبض' : 'Receipt') : (lang === 'ar' ? 'سند صرف' : 'Payment')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text max-w-xs truncate" title={voucher.description}>
                                                {voucher.description}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-text font-mono" dir="ltr">
                                                {Number(voucher.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    voucher.deleted_at ? 'bg-danger/10 text-danger border border-danger/20' :
                                                    voucher.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                }`}>
                                                    {voucher.deleted_at ? (lang === 'ar' ? 'محذوف' : 'Deleted') : voucher.status === 'approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-end text-sm">
                                                <div className="flex justify-end items-center gap-1">
                                                    {voucher.status === 'draft' && (
                                                        <>
                                                            <Tooltip content={lang === 'ar' ? 'اعتماد وإنشاء قيد' : 'Approve & Post'}>
                                                                <button 
                                                                    onClick={() => handleApprove(voucher.id)}
                                                                    className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md transition-colors"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip content={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                                <button 
                                                                    onClick={() => router.get(route('accounting.financial-vouchers.edit', voucher.id))}
                                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip content={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                                <button 
                                                                    onClick={() => handleDelete(voucher.id)}
                                                                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {voucher.status === 'approved' && !voucher.deleted_at && (
                                                        <Tooltip content={lang === 'ar' ? 'فك الاعتماد (إلغاء الترحيل)' : 'Unapprove (Revoke)'}>
                                                            <button 
                                                                onClick={() => setUnapproveModal({ isOpen: true, voucherId: voucher.id, password: '', processing: false, error: '' })}
                                                                className="p-1.5 text-text-muted hover:text-amber-600 hover:bg-amber-500/10 rounded-md transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip content={lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}>
                                                        <Link href={route('accounting.financial-vouchers.show', voucher.id)} className="text-text hover:text-primary transition-colors h-8 w-8 !p-0 flex items-center justify-center rounded-md hover:bg-surface-muted">
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
                    {vouchers.data.length > 0 && (
                        <div className="border-t border-border">
                            <Pagination links={vouchers.links} from={vouchers.from} to={vouchers.to} total={vouchers.total} />
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
                        {lang === 'ar' ? 'سيتم إلغاء قيد اليومية المرتبط وتغيير حالة السند إلى مسودة. يرجى إدخال كلمة المرور الخاصة بك لتأكيد الإجراء (يتطلب صلاحية فك الاعتماد).' : 'The associated journal entry will be deleted and the voucher will revert to draft. Please enter your password to confirm (requires unapprove permission).'}
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
