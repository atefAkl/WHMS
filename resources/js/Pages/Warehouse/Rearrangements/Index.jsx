import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { ArrowLeftRight, Plus, Eye, Search, Home, ChevronRight, Edit, Trash2, RotateCcw } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';

export default function Index({ rearrangements = { data: [] }, customers = [], contracts = [], filters = {} }) {
    const { lang } = useLang();

    const handleFilterChange = (key, value) => {
        router.get(
            route('pallet-rearrangements.index'),
            { ...filters, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    const handleReopen = (id) => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من فك اعتماد سند ترتيب ونقل الطبالي؟ سيتم إلغاء حركات النقل الداخلي!" : "Reopen rearrangement voucher?")) {
            router.post(route('pallet-rearrangements.reopen', id));
        }
    };

    const handleDelete = (id) => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من حذف مسودة سند ترتيب ونقل الطبالي؟" : "Delete draft rearrangement voucher?")) {
            router.delete(route('pallet-rearrangements.destroy', id));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "سندات ترتيب ونقل الطبالي" : "Pallet Rearrangements"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "سندات ترتيب ونقل الطبالي (كود 15)" : "Pallet Rearrangements"} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                <PageHeader
                    icon={ArrowLeftRight}
                    title={lang === "ar" ? "سندات ترتيب ونقل الطبالي الداخلية" : "Pallet Rearrangement Vouchers (Code 15)"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تسجيل عمليات نقل وتحويل الكميات بين طبالي العقد داخل المستودع دون التأثير على إجمالي كميات العقد أو الأصناف."
                                : "Record pallet quantity transfers within the warehouse without affecting overall contract balance."}
                        </p>
                    }
                    actions={
                        <Link
                            href={route('pallet-rearrangements.create')}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-2xs"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{lang === "ar" ? "إنشاء سند ترتيب طبالي جديد" : "New Rearrangement Voucher"}</span>
                        </Link>
                    }
                />

                {/* Filters Bar */}
                <div className="bg-surface border border-border p-4 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={lang === "ar" ? "بحث برقم السند أو اسم العميل..." : "Search..."}
                                className="w-full text-xs border-border bg-surface text-text pe-8 font-semibold rounded-none h-[36px]"
                                defaultValue={filters.search || ''}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleFilterChange('search', e.target.value);
                                }}
                            />
                            <Search className="h-3.5 w-3.5 absolute end-2.5 top-3 text-text-muted" />
                        </div>

                        {/* Customer Filter */}
                        <select
                            className="text-xs border-border bg-surface text-text font-bold rounded-none h-[36px]"
                            value={filters.customer_id || ''}
                            onChange={(e) => handleFilterChange('customer_id', e.target.value)}
                        >
                            <option value="">{lang === "ar" ? "جميع العملاء" : "All Customers"}</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        {/* Contract Filter */}
                        <select
                            className="text-xs border-border bg-surface text-text font-bold rounded-none h-[36px]"
                            value={filters.contract_id || ''}
                            onChange={(e) => handleFilterChange('contract_id', e.target.value)}
                        >
                            <option value="">{lang === "ar" ? "جميع العقود" : "All Contracts"}</option>
                            {contracts.map((c) => (
                                <option key={c.id} value={c.id}>{c.contract_number}</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            className="text-xs border-border bg-surface text-text font-bold rounded-none h-[36px]"
                            value={filters.status || ''}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <option value="">{lang === "ar" ? "جميع الحالات" : "All Statuses"}</option>
                            <option value="draft">{lang === "ar" ? "مسودة" : "Draft"}</option>
                            <option value="approved">{lang === "ar" ? "معتمد وممكّن" : "Approved"}</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-surface border border-border overflow-x-auto shadow-2xs">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-surface-muted text-text-muted font-bold border-b border-border">
                            <tr>
                                <th className="px-3 py-3 text-start w-10">#</th>
                                <th className="px-3 py-3 text-start">{lang === "ar" ? "رقم السند (كود 15)" : "Voucher Serial"}</th>
                                <th className="px-3 py-3 text-start">{lang === "ar" ? "العميل والعقد" : "Client & Contract"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "تاريخ الترتيب" : "Date"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "عدد الحركات" : "Transfers Count"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                                <th className="px-3 py-3 text-center w-28">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rearrangements.data.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-3 py-8 text-center text-text-muted italic font-bold">
                                        {lang === "ar" ? "لا توجد سندات ترتيب طبالي مسجلة بعد." : "No pallet rearrangements found."}
                                    </td>
                                </tr>
                            ) : (
                                rearrangements.data.map((re, idx) => (
                                    <tr key={re.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-3 font-mono text-text-muted">{idx + 1}</td>
                                        <td className="px-3 py-3 font-mono font-bold text-primary">{re.serial_number}</td>
                                        <td className="px-3 py-3 font-bold text-text">
                                            <div>{re.customer?.name}</div>
                                            <div className="text-[10px] text-text-muted font-mono">{re.contract?.contract_number}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center font-mono text-text">{re.rearrangement_date}</td>
                                        <td className="px-3 py-3 text-center font-mono font-bold text-text">{re.items_count}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-none border ${
                                                re.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                            }`}>
                                                {re.status === 'approved' ? (lang === "ar" ? "معتمد ومرحل" : "Approved") : (lang === "ar" ? "مسودة" : "Draft")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Link
                                                    href={route('pallet-rearrangements.show', re.id)}
                                                    className="p-1 text-primary hover:bg-primary/10 transition-all"
                                                    title={lang === "ar" ? "عرض التفاصيل" : "View"}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>

                                                {re.status === 'draft' ? (
                                                    <>
                                                        <Link
                                                            href={route('pallet-rearrangements.edit', re.id)}
                                                            className="p-1 text-amber-600 hover:bg-amber-50 transition-all"
                                                            title={lang === "ar" ? "تعديل" : "Edit"}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(re.id)}
                                                            className="p-1 text-rose-600 hover:bg-rose-50 transition-all"
                                                            title={lang === "ar" ? "حذف" : "Delete"}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReopen(re.id)}
                                                        className="p-1 text-amber-600 hover:bg-amber-50 transition-all"
                                                        title={lang === "ar" ? "فك الاعتماد" : "Reopen"}
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={rearrangements.links} />
            </div>
        </AuthenticatedLayout>
    );
}
