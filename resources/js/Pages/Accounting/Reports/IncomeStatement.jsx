import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, PieChart, Printer, Search } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Tooltip from '@/Components/Tooltip';

export default function IncomeStatement({ filters, reportData }) {
    const { lang } = useLang();

    const { data, setData, get, processing } = useForm({
        start_date: filters.start_date || '',
        end_date: filters.end_date || ''
    });

    const submit = (e) => {
        e.preventDefault();
        get(route('accounting.reports.income-statement'));
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'الحسابات' : 'Accounting'}</span>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'قائمة الدخل' : 'Income Statement'}</span>
        </div>
    );

    const isProfit = reportData.netIncome >= 0;

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'قائمة الدخل' : 'Income Statement'} />

            <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <PieChart className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {lang === 'ar' ? 'قائمة الدخل (الأرباح والخسائر)' : 'Income Statement (P&L)'}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'عرض تفصيلي للإيرادات والمصروفات' : 'Detailed view of revenues and expenses'}
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
                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden print:border-none print:shadow-none print:mt-10">
                    <div className="p-6 text-center border-b border-border bg-surface-muted/10 print:bg-transparent">
                        <h2 className="text-xl font-bold text-text mb-2">{lang === 'ar' ? 'قائمة الدخل' : 'Income Statement'}</h2>
                        <p className="text-sm text-text-muted">
                            {lang === 'ar' ? 'عن الفترة المالية من' : 'For the period from'} {filters.start_date} {lang === 'ar' ? 'إلى' : 'to'} {filters.end_date}
                        </p>
                    </div>

                    <div className="p-8">
                        {/* Revenues Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-emerald-600 mb-4 pb-2 border-b-2 border-emerald-500/20">
                                {lang === 'ar' ? 'الإيرادات' : 'Revenues'}
                            </h3>
                            <div className="space-y-3 pl-4 border-l-2 border-border rtl:border-l-0 rtl:border-r-2 rtl:pr-4">
                                {reportData.revenues.map((rev, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex gap-4">
                                            <span className="font-mono text-text-muted w-16">{rev.code}</span>
                                            <span className="text-text font-medium">{lang === 'ar' ? rev.name_ar : rev.name_en}</span>
                                        </div>
                                        <span className="font-mono text-text" dir="ltr">{Number(rev.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                {reportData.revenues.length === 0 && (
                                    <div className="text-sm text-text-muted italic">{lang === 'ar' ? 'لا توجد إيرادات' : 'No revenues found'}</div>
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-border bg-emerald-500/5 px-4 py-2 rounded-lg">
                                <span className="font-bold text-emerald-700">{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenues'}</span>
                                <span className="font-bold font-mono text-emerald-700 text-lg" dir="ltr">
                                    {Number(reportData.totalRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-rose-600 mb-4 pb-2 border-b-2 border-rose-500/20">
                                {lang === 'ar' ? 'المصروفات' : 'Expenses'}
                            </h3>
                            <div className="space-y-3 pl-4 border-l-2 border-border rtl:border-l-0 rtl:border-r-2 rtl:pr-4">
                                {reportData.expenses.map((exp, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex gap-4">
                                            <span className="font-mono text-text-muted w-16">{exp.code}</span>
                                            <span className="text-text font-medium">{lang === 'ar' ? exp.name_ar : exp.name_en}</span>
                                        </div>
                                        <span className="font-mono text-text" dir="ltr">{Number(exp.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                {reportData.expenses.length === 0 && (
                                    <div className="text-sm text-text-muted italic">{lang === 'ar' ? 'لا توجد مصروفات' : 'No expenses found'}</div>
                                )}
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-border bg-rose-500/5 px-4 py-2 rounded-lg">
                                <span className="font-bold text-rose-700">{lang === 'ar' ? 'إجمالي المصروفات' : 'Total Expenses'}</span>
                                <span className="font-bold font-mono text-rose-700 text-lg" dir="ltr">
                                    {Number(reportData.totalExpense).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Net Income */}
                        <div className={`mt-12 flex justify-between items-center p-6 rounded-xl border-2 ${isProfit ? 'border-emerald-500 bg-emerald-500/10' : 'border-rose-500 bg-rose-500/10'}`}>
                            <h2 className={`text-2xl font-bold ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isProfit 
                                    ? (lang === 'ar' ? 'صافي الربح' : 'Net Profit') 
                                    : (lang === 'ar' ? 'صافي الخسارة' : 'Net Loss')}
                            </h2>
                            <span className={`text-3xl font-bold font-mono ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`} dir="ltr">
                                {Number(Math.abs(reportData.netIncome)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Print Signatures Area */}
                <div className="hidden print:flex mt-16 justify-between px-12">
                    <div className="text-center">
                        <div className="mb-8 border-b border-gray-400 w-48 mx-auto"></div>
                        <p className="font-bold text-sm">{lang === 'ar' ? 'المحاسب' : 'Accountant'}</p>
                    </div>
                    <div className="text-center">
                        <div className="mb-8 border-b border-gray-400 w-48 mx-auto"></div>
                        <p className="font-bold text-sm">{lang === 'ar' ? 'المدير المالي' : 'Financial Manager'}</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
