import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Plus, Eye, BookOpen, FileText, Search, Filter, Trash2, CheckCircle, Edit, MoreVertical, X, CheckSquare, Square, MinusSquare, List, Grid } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Pagination from '@/Components/Pagination';
import PageHeader from '@/Components/PageHeader';
import TextInput from '@/Components/TextInput';
import Dropdown from '@/Components/Dropdown';
import Checkbox from '@/Components/Checkbox';
import Tooltip from '@/Components/Tooltip';
import Topbar from '@/Components/Topbar'; // Assuming PageHeader or Topbar is used

export default function JournalEntriesIndex({ entries, filters }) {
    const { lang } = useLang();
    // Search & Filter State
    const [viewMode, setViewMode] = useState('list');
    const [searchParams, setSearchParams] = useState({
        search: filters?.search || '',
        status: filters?.status || '',
        from_date: filters?.from_date || '',
        to_date: filters?.to_date || '',
    });

    // Bulk Selection State
    const [selectedIds, setSelectedIds] = useState([]);
    const isAllSelected = entries.data.length > 0 && selectedIds.length === entries.data.length;

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('accounting.journal-entries.index'), searchParams, { preserveState: true });
    };

    const clearFilters = () => {
        setSearchParams({ search: '', status: '', from_date: '', to_date: '' });
        router.get(route('accounting.journal-entries.index'));
    };

    const toggleAll = () => {
        if (isAllSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(entries.data.map(e => e.id));
        }
    };

    const selectAll = () => setSelectedIds(entries.data.map(e => e.id));
    const selectNone = () => setSelectedIds([]);
    const invertSelection = () => {
        const allIds = entries.data.map(e => e.id);
        setSelectedIds(allIds.filter(id => !selectedIds.includes(id)));
    };

    const toggleOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleBulkAction = (action) => {
        if (selectedIds.length === 0) return;
        
        if (action === 'delete' && !confirm(lang === 'ar' ? 'هل أنت متأكد من حذف القيود المحددة؟' : 'Are you sure you want to delete the selected entries?')) {
            return;
        }

        router.post(route('accounting.journal-entries.bulk-action'), {
            ids: selectedIds,
            action: action
        }, {
            onSuccess: () => setSelectedIds([])
        });
    };

    const handleDelete = (id) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا القيد؟' : 'Are you sure you want to delete this entry?')) {
            router.delete(route('accounting.journal-entries.destroy', id));
        }
    };

    const handlePost = (id) => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من ترحيل هذا القيد؟' : 'Are you sure you want to post this entry?')) {
            router.post(route('accounting.journal-entries.post', id));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('accounting.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'الحسابات' : 'Accounting'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'القيود اليومية' : 'Journal Entries'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'القيود اليومية' : 'Journal Entries'} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {lang === 'ar' ? 'القيود اليومية' : 'Journal Entries'}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'إدارة قيود اليومية، المسودات، والترحيل' : 'Manage journal entries, drafts, and posting'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip content={lang === 'ar' ? 'إنشاء قيد جديد' : 'New Entry'}>
                            <PrimaryButton onClick={() => router.get(route('accounting.journal-entries.create'))} className="h-9 w-9 !p-0 flex items-center justify-center">
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
                                placeholder={lang === 'ar' ? 'ابحث برقم القيد أو البيان...' : 'Search reference or description...'}
                                value={searchParams.search}
                                onChange={e => setSearchParams({...searchParams, search: e.target.value})}
                                icon={<Search className="h-4 w-4 text-text-muted" />}
                            />
                        </div>
                        <div className="w-full md:w-40 shrink-0">
                            <select 
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-xs h-[30px] py-1"
                                value={searchParams.status}
                                onChange={e => setSearchParams({...searchParams, status: e.target.value})}
                            >
                                <option value="">{lang === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
                                <option value="draft">{lang === 'ar' ? 'مسودة' : 'Draft'}</option>
                                <option value="posted">{lang === 'ar' ? 'مرحل' : 'Posted'}</option>
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
                    {/* Card Header: Selection, View, Bulk Actions */}
                    <div className="p-3 border-b border-border bg-surface-muted/30 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            {/* Selection Tools */}
                            <Tooltip content={lang === 'ar' ? 'تحديد الكل' : 'Select All'}>
                                <SecondaryButton onClick={selectAll} className="h-8 w-8 !p-0 flex items-center justify-center text-text-muted hover:text-text">
                                    <CheckSquare className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                            <Tooltip content={lang === 'ar' ? 'إلغاء التحديد' : 'Select None'}>
                                <SecondaryButton onClick={selectNone} className="h-8 w-8 !p-0 flex items-center justify-center text-text-muted hover:text-text">
                                    <Square className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                            <Tooltip content={lang === 'ar' ? 'عكس التحديد' : 'Invert Selection'}>
                                <SecondaryButton onClick={invertSelection} className="h-8 w-8 !p-0 flex items-center justify-center text-text-muted hover:text-text">
                                    <MinusSquare className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Bulk Actions */}
                            {selectedIds.length > 0 && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <div>
                                            <PrimaryButton className="h-8 px-3 text-xs flex items-center gap-2">
                                                <MoreVertical className="h-3 w-3" />
                                                <span>{lang === 'ar' ? 'الإجراءات المجمعة' : 'Bulk Actions'} ({selectedIds.length})</span>
                                            </PrimaryButton>
                                        </div>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <button onClick={() => handleBulkAction('post')} className="block w-full text-start px-4 py-2 text-sm leading-5 text-emerald-600 hover:bg-surface-muted transition duration-150 ease-in-out">
                                            <CheckCircle className="inline-block w-4 h-4 me-2" />
                                            {lang === 'ar' ? 'ترحيل المحدد' : 'Post Selected'}
                                        </button>
                                        <button onClick={() => handleBulkAction('delete')} className="block w-full text-start px-4 py-2 text-sm leading-5 text-danger hover:bg-surface-muted transition duration-150 ease-in-out">
                                            <Trash2 className="inline-block w-4 h-4 me-2" />
                                            {lang === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}
                            
                            {/* View Tools */}
                            <div className="flex items-center bg-surface border border-border rounded-md p-0.5">
                                <Tooltip content={lang === 'ar' ? 'عرض القائمة' : 'List View'}>
                                    <button onClick={() => setViewMode('list')} className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-surface-muted text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>
                                        <List className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                                <Tooltip content={lang === 'ar' ? 'عرض الشبكة' : 'Grid View'}>
                                    <button onClick={() => setViewMode('grid')} className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-surface-muted text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>
                                        <Grid className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-start w-10">
                                        <Checkbox checked={isAllSelected} onChange={toggleAll} />
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'رقم القيد' : 'Reference'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}
                                    </th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'البيان' : 'Description'}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'إجمالي المدين' : 'Total Debit'}
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
                                        {lang === 'ar' ? 'إجمالي الدائن' : 'Total Credit'}
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
                                {entries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-text-muted">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileText className="h-10 w-10 opacity-20 mb-3" />
                                                <p>{lang === 'ar' ? 'لا توجد قيود مسجلة' : 'No journal entries found'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    entries.data.map(entry => (
                                        <tr key={entry.id} className={`hover:bg-surface-muted/30 transition-colors ${selectedIds.includes(entry.id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-4 py-4">
                                                <Checkbox checked={selectedIds.includes(entry.id)} onChange={() => toggleOne(entry.id)} />
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-primary font-mono">
                                                {entry.reference_number}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-text font-mono" dir="ltr">
                                                {new Date(entry.date).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-text max-w-xs truncate" title={entry.description}>
                                                {entry.description}
                                                <div className="text-xs text-text-muted mt-1">
                                                    {entry.lines_count} {lang === 'ar' ? 'أسطر' : 'lines'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-emerald-600 font-mono" dir="ltr">
                                                {Number(entry.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-rose-600 font-mono" dir="ltr">
                                                {Number(entry.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    entry.status === 'posted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                                }`}>
                                                    {entry.status === 'posted' ? (lang === 'ar' ? 'مرحل' : 'Posted') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-end text-sm">
                                                <div className="flex justify-end items-center gap-1">
                                                    {entry.status === 'draft' && (
                                                        <>
                                                            <Tooltip content={lang === 'ar' ? 'ترحيل القيد' : 'Post Entry'}>
                                                                <button 
                                                                    onClick={() => handlePost(entry.id)}
                                                                    className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md transition-colors"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip content={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                                <button 
                                                                    onClick={() => router.get(route('accounting.journal-entries.edit', entry.id))}
                                                                    className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip content={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                                <button 
                                                                    onClick={() => handleDelete(entry.id)}
                                                                    className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    <Tooltip content={lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}>
                                                        <Link href={route('accounting.journal-entries.show', entry.id)} className="text-text hover:text-primary transition-colors h-8 w-8 !p-0 flex items-center justify-center rounded-md hover:bg-surface-muted">
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
                    {entries.data.length > 0 && (
                        <div className="border-t border-border">
                            <Pagination links={entries.links} from={entries.from} to={entries.to} total={entries.total} />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
