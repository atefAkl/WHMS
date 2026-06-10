import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, BookOpen, Printer, ArrowLeft, Edit, Trash2, CheckCircle } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Tooltip from '@/Components/Tooltip';

export default function JournalEntryShow({ entry }) {
    const { lang } = useLang();

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('accounting.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'الحسابات' : 'Accounting'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('accounting.journal-entries.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'القيود اليومية' : 'Journal Entries'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'تفاصيل القيد' : 'Entry Details'}</span>
        </div>
    );

    const handlePost = () => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من ترحيل هذا القيد؟' : 'Are you sure you want to post this entry?')) {
            router.post(route('accounting.journal-entries.post', entry.id));
        }
    };

    const handleDelete = () => {
        if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا القيد؟' : 'Are you sure you want to delete this entry?')) {
            router.delete(route('accounting.journal-entries.destroy', entry.id));
        }
    };

    const formattedDate = new Date(entry.date).toLocaleString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
    }).replace(',', '');

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${lang === 'ar' ? 'قيد يومية' : 'Journal Entry'} ${entry.reference_number}`} />

            <div className="max-w-5xl mx-auto pb-12 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-start justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                                {lang === 'ar' ? 'قيد يومية رقم' : 'Journal Entry #'} {entry.reference_number}
                            </h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    entry.status === 'posted' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                    {entry.status === 'posted' ? (lang === 'ar' ? 'مرحل' : 'Posted') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                                </span>
                                <span className="text-sm text-text-muted font-mono">{formattedDate}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Tooltip content={lang === 'ar' ? 'رجوع' : 'Back'}>
                            <SecondaryButton onClick={() => router.get(route('accounting.journal-entries.index'))} className="h-9 w-9 !p-0 flex items-center justify-center flex-shrink-0">
                                <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                            </SecondaryButton>
                        </Tooltip>
                        <Tooltip content={lang === 'ar' ? 'طباعة' : 'Print'}>
                            <SecondaryButton onClick={() => window.print()} className="print:hidden h-9 w-9 !p-0 flex items-center justify-center flex-shrink-0">
                                <Printer className="h-4 w-4" />
                            </SecondaryButton>
                        </Tooltip>
                        
                        {entry.status === 'draft' && (
                            <>
                                <Tooltip content={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                    <button 
                                        onClick={() => router.get(route('accounting.journal-entries.edit', entry.id))}
                                        className="inline-flex items-center justify-center h-9 w-9 !p-0 bg-surface border border-border rounded-md text-text hover:bg-surface-muted hover:text-primary transition ease-in-out duration-150 flex-shrink-0"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                                <Tooltip content={lang === 'ar' ? 'حذف' : 'Delete'}>
                                    <button 
                                        onClick={handleDelete}
                                        className="inline-flex items-center justify-center h-9 w-9 !p-0 bg-danger/10 border border-transparent rounded-md text-danger hover:bg-danger hover:text-white transition ease-in-out duration-150 flex-shrink-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                                <Tooltip content={lang === 'ar' ? 'ترحيل القيد' : 'Post Entry'}>
                                    <PrimaryButton onClick={handlePost} className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9 !p-0 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="h-4 w-4" />
                                    </PrimaryButton>
                                </Tooltip>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden print:shadow-none print:border print:border-gray-300">
                    {/* Header Details */}
                    <div className="p-6 border-b border-border bg-surface-muted/10 print:bg-transparent">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{lang === 'ar' ? 'رقم المرجع' : 'Reference Number'}</h3>
                                <p className="font-mono font-bold text-text">{entry.reference_number}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</h3>
                                <p className="font-mono text-text font-medium">{formattedDate}</p>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">{lang === 'ar' ? 'البيان الرئيسي' : 'Main Description'}</h3>
                                <p className="text-text">{entry.description}</p>
                            </div>
                        </div>
                        {entry.creator && (
                            <div className="mt-4 pt-4 border-t border-border/50 text-xs text-text-muted">
                                {lang === 'ar' ? 'بواسطة:' : 'Created By:'} <span className="font-medium text-text">{entry.creator.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Entry Lines */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border print:border-t print:border-gray-200">
                            <thead className="bg-surface-muted/30 print:bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-start text-xs font-semibold text-text-muted uppercase w-16">#</th>
                                    <th className="px-6 py-3 text-start text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'رقم الحساب' : 'Account Code'}</th>
                                    <th className="px-6 py-3 text-start text-xs font-semibold text-text-muted uppercase w-1/3">{lang === 'ar' ? 'اسم الحساب' : 'Account Name'}</th>
                                    <th className="px-6 py-3 text-start text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                                    <th className="px-6 py-3 text-end text-xs font-semibold text-text-muted uppercase w-32">{lang === 'ar' ? 'مدين' : 'Debit'}</th>
                                    <th className="px-6 py-3 text-end text-xs font-semibold text-text-muted uppercase w-32">{lang === 'ar' ? 'دائن' : 'Credit'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-surface print:divide-gray-200">
                                {entry.lines.map((line, index) => (
                                    <tr key={line.id} className="hover:bg-surface-muted/10 print:hover:bg-transparent">
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-text-muted">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-primary font-medium print:text-black">
                                            {line.account?.code}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-text font-medium">
                                            {lang === 'ar' ? line.account?.name_ar : line.account?.name_en}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-text-muted">
                                            {line.description || '-'}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-end font-mono text-emerald-600 font-medium print:text-black">
                                            {Number(line.debit) > 0 ? Number(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-sm text-end font-mono text-rose-600 font-medium print:text-black">
                                            {Number(line.credit) > 0 ? Number(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-surface-muted/50 border-t-2 border-border print:bg-gray-50 print:border-gray-300">
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-end font-bold text-text uppercase tracking-wider text-sm">
                                        {lang === 'ar' ? 'الإجمالي المتزن' : 'Balanced Total'}
                                    </td>
                                    <td className="px-6 py-4 text-end font-bold font-mono text-emerald-700 bg-emerald-500/10 print:bg-transparent print:text-black">
                                        {Number(entry.total_debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-end font-bold font-mono text-rose-700 bg-rose-500/10 print:bg-transparent print:text-black">
                                        {Number(entry.total_credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Print Signatures Area */}
                <div className="hidden print:flex mt-16 justify-between px-12">
                    <div className="text-center">
                        <div className="mb-8 border-b border-gray-400 w-48 mx-auto"></div>
                        <p className="font-bold text-sm text-black">{lang === 'ar' ? 'المحاسب' : 'Accountant'}</p>
                    </div>
                    <div className="text-center">
                        <div className="mb-8 border-b border-gray-400 w-48 mx-auto"></div>
                        <p className="font-bold text-sm text-black">{lang === 'ar' ? 'المدير المالي' : 'Financial Manager'}</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
