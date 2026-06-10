import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, FolderTree, BookOpen, FileBarChart, Calculator } from 'lucide-react';
import Tooltip from '@/Components/Tooltip';

export default function Dashboard() {
    const { lang } = useLang();

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'الحسابات' : 'Accounting'}</span>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-text font-medium">{lang === 'ar' ? 'الرئيسية' : 'Dashboard'}</span>
        </div>
    );

    const modules = [
        {
            title: lang === 'ar' ? 'شجرة الحسابات' : 'Chart of Accounts',
            description: lang === 'ar' ? 'إدارة الهيكل المالي والحسابات الرئيسية والفرعية' : 'Manage financial structure and main/sub accounts',
            icon: FolderTree,
            route: 'accounting.accounts.index',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: lang === 'ar' ? 'القيود اليومية' : 'Journal Entries',
            description: lang === 'ar' ? 'تسجيل ومراجعة وترحيل القيود المحاسبية' : 'Record, review, and post accounting entries',
            icon: BookOpen,
            route: 'accounting.journal-entries.index',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10'
        },
        {
            title: lang === 'ar' ? 'كشف الحساب' : 'Account Statement',
            description: lang === 'ar' ? 'عرض تفصيلي للحركات المالية الخاصة بحساب معين' : 'Detailed view of financial transactions for a specific account',
            icon: FileBarChart,
            route: 'accounting.reports.account-statement',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        },
        {
            title: lang === 'ar' ? 'ميزان المراجعة' : 'Trial Balance',
            description: lang === 'ar' ? 'عرض أرصدة الحسابات ومطابقتها' : 'View and match account balances',
            icon: Calculator,
            route: 'accounting.reports.trial-balance',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            title: lang === 'ar' ? 'قائمة الدخل' : 'Income Statement',
            description: lang === 'ar' ? 'عرض تفصيلي للإيرادات والمصروفات وصافي الربح/الخسارة' : 'Detailed view of revenues, expenses, and net profit/loss',
            icon: FileBarChart,
            route: 'accounting.reports.income-statement',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10'
        }
    ];

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'النظام المالي' : 'Accounting System'} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Home className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">{lang === 'ar' ? 'النظام المالي' : 'Accounting System'}</h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'إدارة الحسابات، القيود، والتقارير المالية الخاصة بالمنشأة' : 'Manage accounts, journal entries, and financial reports'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod, idx) => {
                        const Icon = mod.icon;
                        return (
                            <Tooltip key={idx} content={lang === 'ar' ? `الذهاب إلى ${mod.title}` : `Go to ${mod.title}`}>
                                <button
                                    onClick={() => mod.route !== '#' && router.get(route(mod.route))}
                                    className={`text-start w-full bg-surface border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 ${mod.route === '#' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${mod.bg} ${mod.color}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-text mb-2">{mod.title}</h3>
                                    <p className="text-sm text-text-muted">{mod.description}</p>
                                    {mod.route === '#' && (
                                        <span className="inline-block mt-4 text-xs font-medium bg-surface-muted px-2 py-1 rounded text-text-muted">
                                            {lang === 'ar' ? 'قريباً' : 'Coming Soon'}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>
                        );
                    })}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
