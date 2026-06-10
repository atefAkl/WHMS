import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Scale, Printer, Search } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Tooltip from '@/Components/Tooltip';

export default function TrialBalance({ filters, reportData }) {
    const { lang } = useLang();

    const { data, setData, get, processing } = useForm({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('accounting.reports.trial-balance'));
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'الحسابات' : 'Accounting'}</span>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'} />

            <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Scale className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {lang === 'ar' ? 'ميزان المراجعة بالمجاميع' : 'Trial Balance'}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'عرض أرصدة الحسابات ومطابقتها' : 'View and match account balances'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <Tooltip content={lang === 'ar' ? 'طباعة' : 'Print'}>
                            <SecondaryButton onClick={() => window.print()} className="h-9 w-9 !p-0 flex items-center justify-center">
                                <Printer className="h-5 w-5" />
                            </SecondaryButton>
                        </Tooltip>
                    </div>
                </div>

                {/* Filters Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-4 print:hidden">
                    <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex items-center gap-2 shrink-0">
                            <Tooltip content={lang === 'ar' ? 'من تاريخ' : 'From Date'}>
                                <TextInput 
                                    type="date" 
                                    className="w-[140px] h-[30px] text-xs" 
                                    value={data.start_date} 
                                    onChange={e => setData('start_date', e.target.value)} 
                                />
                            </Tooltip>
                            <span className="text-text-muted">-</span>
                            <Tooltip content={lang === 'ar' ? 'إلى تاريخ' : 'To Date'}>
                                <TextInput 
                                    type="date" 
                                    className="w-[140px] h-[30px] text-xs" 
                                    value={data.end_date} 
                                    onChange={e => setData('end_date', e.target.value)} 
                                />
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Tooltip content={lang === 'ar' ? 'تحديث' : 'Update'}>
                                <PrimaryButton disabled={processing} className="h-[30px] w-[30px] !p-0 flex items-center justify-center">
                                    <Search className="h-4 w-4" />
                                </PrimaryButton>
                            </Tooltip>
                        </div>
                    </form>
                </div>

                {/* Report Content */}
                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none">
                    <div className="p-6 text-center border-b border-border bg-surface-muted/10 print:bg-transparent">
                        <h2 className="text-xl font-bold text-text mb-2">{lang === 'ar' ? 'ميزان المراجعة' : 'Trial Balance'}</h2>
                        <p className="text-sm text-text-muted">
                            {lang === 'ar' ? 'الفترة من' : 'Period from'} {filters.start_date} {lang === 'ar' ? 'إلى' : 'to'} {filters.end_date}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted/30">
                                <tr>
                                    <th className="px-6 py-3 text-start text-xs font-semibold text-text-muted uppercase w-32">{lang === 'ar' ? 'رقم الحساب' : 'Account Code'}</th>
                                    <th className="px-6 py-3 text-start text-xs font-semibold text-text-muted uppercase w-1/2">{lang === 'ar' ? 'اسم الحساب' : 'Account Name'}</th>
                                    <th className="px-6 py-3 text-end text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'إجمالي مدين' : 'Total Debit'}</th>
                                    <th className="px-6 py-3 text-end text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'إجمالي دائن' : 'Total Credit'}</th>
                                    <th className="px-6 py-3 text-end text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'الرصيد' : 'Balance'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-surface">
                                {reportData.lines.map((line, idx) => {
                                    const isMain = !line.is_transactional;
                                    return (
                                        <tr key={idx} className={`hover:bg-surface-muted/10 transition-colors ${isMain ? 'bg-surface-muted/5 font-bold' : ''}`}>
                                            <td className="px-6 py-3 text-sm font-mono text-text" style={{ paddingInlineStart: `${line.level * 1.5 + 1.5}rem` }}>
                                                {line.code}
                                            </td>
                                            <td className={`px-6 py-3 text-sm ${isMain ? 'text-primary' : 'text-text'}`}>
                                                {lang === 'ar' ? line.name_ar : line.name_en}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-end font-mono" dir="ltr">
                                                {Number(line.debit) > 0 ? <span className="text-emerald-600">{Number(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-end font-mono" dir="ltr">
                                                {Number(line.credit) > 0 ? <span className="text-rose-600">{Number(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-sm text-end font-mono font-bold" dir="ltr">
                                                <span className={line.normal_balance === 'debit' ? 'text-emerald-700' : 'text-rose-700'}>
                                                    {Number(line.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {reportData.lines.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-text-muted">
                                            {lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-surface-muted/50 border-t-2 border-border font-bold">
                                <tr>
                                    <td colSpan="2" className="px-6 py-4 text-end text-text uppercase text-sm">
                                        {lang === 'ar' ? 'الإجمالي المتزن' : 'Balanced Totals'}
                                    </td>
                                    <td className="px-6 py-4 text-end text-emerald-700 font-mono text-lg bg-emerald-500/10" dir="ltr">
                                        {Number(reportData.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-end text-rose-700 font-mono text-lg bg-rose-500/10" dir="ltr">
                                        {Number(reportData.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-lg bg-surface-muted/10 text-primary">
                                        {Math.abs(reportData.totalDebit - reportData.totalCredit) < 0.01 ? (
                                            <span className="text-emerald-600 flex items-center justify-center gap-1">✓ {lang === 'ar' ? 'متزن' : 'Balanced'}</span>
                                        ) : (
                                            <span className="text-danger flex items-center justify-center gap-1">✗ {lang === 'ar' ? 'غير متزن' : 'Unbalanced'}</span>
                                        )}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
