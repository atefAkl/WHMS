import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, FileText, Printer, Search, Filter } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Tooltip from '@/Components/Tooltip';

export default function AccountStatement({ accounts, filters, reportData }) {
    const { lang } = useLang();

    const { data, setData, get, processing } = useForm({
        account_id: filters.account_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('accounting.reports.account-statement'));
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'الحسابات' : 'Accounting'}</span>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'كشف حساب' : 'Account Statement'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'كشف حساب' : 'Account Statement'} />

            <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {lang === 'ar' ? 'كشف حساب (الأستاذ المساعد)' : 'Account Statement (Ledger)'}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'عرض الحركات التفصيلية لحساب محدد' : 'Detailed transaction view for a specific account'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <Tooltip content={lang === 'ar' ? 'طباعة' : 'Print'}>
                            <SecondaryButton onClick={() => window.print()} disabled={!reportData.account} className="h-9 w-9 !p-0 flex items-center justify-center">
                                <Printer className="h-5 w-5" />
                            </SecondaryButton>
                        </Tooltip>
                    </div>
                </div>

                {/* Filters Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-4 print:hidden">
                    <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full">
                            <select 
                                className="block w-full h-[30px] py-0 text-xs border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary"
                                value={data.account_id}
                                onChange={e => setData('account_id', e.target.value)}
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.code} - {lang === 'ar' ? acc.name_ar : acc.name_en}</option>
                                ))}
                            </select>
                        </div>
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
                            <Tooltip content={lang === 'ar' ? 'بحث وعرض' : 'Search and View'}>
                                <PrimaryButton disabled={processing} className="h-[30px] w-[30px] !p-0 flex items-center justify-center">
                                    <Search className="h-4 w-4" />
                                </PrimaryButton>
                            </Tooltip>
                        </div>
                    </form>
                </div>

                {/* Report Content */}
                {reportData.account ? (
                    <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none">
                        <div className="p-6 text-center border-b border-border bg-surface-muted/10 print:bg-transparent">
                            <h2 className="text-xl font-bold text-text mb-2">{lang === 'ar' ? 'كشف حساب' : 'Account Statement'}</h2>
                            <h3 className="text-lg font-bold text-primary mb-2 font-mono">
                                {reportData.account.code} - {lang === 'ar' ? reportData.account.name_ar : reportData.account.name_en}
                            </h3>
                            <p className="text-sm text-text-muted">
                                {lang === 'ar' ? 'الفترة من' : 'Period from'} {filters.start_date} {lang === 'ar' ? 'إلى' : 'to'} {filters.end_date}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border border-b border-border">
                                <thead className="bg-surface-muted/30">
                                    <tr>
                                        <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                                        <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'رقم القيد' : 'Entry #'}</th>
                                        <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase w-1/3">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                                        <th className="px-4 py-3 text-end text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'مدين' : 'Debit'}</th>
                                        <th className="px-4 py-3 text-end text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'دائن' : 'Credit'}</th>
                                        <th className="px-4 py-3 text-end text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'الرصيد' : 'Balance'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-surface">
                                    {/* Opening Balance */}
                                    <tr className="bg-surface-muted/10 font-medium">
                                        <td colSpan="3" className="px-4 py-3 text-end text-sm text-text">
                                            {lang === 'ar' ? 'رصيد افتتاحي (سابق)' : 'Opening Balance'}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-end text-sm font-mono text-text">
                                            <span dir="ltr">{Number(reportData.openingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </td>
                                    </tr>

                                    {/* Transactions */}
                                    {reportData.lines.map((line, idx) => (
                                        <tr key={idx} className="hover:bg-surface-muted/10">
                                            <td className="px-4 py-2 text-sm text-text font-mono">{line.entry.date}</td>
                                            <td className="px-4 py-2 text-sm text-primary font-mono cursor-pointer hover:underline" onClick={() => router.get(route('accounting.journal-entries.show', line.entry.id))}>
                                                {line.entry.reference_number}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-text">{line.description || line.entry.description}</td>
                                            <td className="px-4 py-2 text-sm text-end text-emerald-600 font-mono" dir="ltr">
                                                {Number(line.debit) > 0 ? Number(line.debit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-end text-rose-600 font-mono" dir="ltr">
                                                {Number(line.credit) > 0 ? Number(line.credit).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-end text-text font-bold font-mono" dir="ltr">
                                                {Number(line.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}

                                    {reportData.lines.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-text-muted">
                                                {lang === 'ar' ? 'لا توجد حركات في هذه الفترة' : 'No transactions in this period'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-surface-muted/30 border-t-2 border-border font-bold">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-end text-text uppercase text-sm">
                                            {lang === 'ar' ? 'الإجمالي والرصيد النهائي' : 'Totals & Closing Balance'}
                                        </td>
                                        <td className="px-4 py-3 text-end text-emerald-700 font-mono" dir="ltr">
                                            {Number(reportData.totalDebit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-end text-rose-700 font-mono" dir="ltr">
                                            {Number(reportData.totalCredit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-4 py-3 text-end text-primary text-lg font-mono" dir="ltr">
                                            {Number(reportData.closingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="bg-surface border border-border shadow-sm rounded-xl p-12 text-center flex flex-col items-center">
                        <Filter className="h-12 w-12 text-text-muted/30 mb-4" />
                        <h3 className="text-lg font-bold text-text mb-2">{lang === 'ar' ? 'يرجى اختيار حساب' : 'Please Select an Account'}</h3>
                        <p className="text-text-muted">{lang === 'ar' ? 'قم بتحديد حساب وتاريخ لعرض الحركات المالية الخاصة به.' : 'Select an account and date range to view its financial transactions.'}</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
