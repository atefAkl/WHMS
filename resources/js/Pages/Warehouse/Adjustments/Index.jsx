import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { SlidersHorizontal, Plus, Eye, CheckCircle2, AlertCircle, FileText, Search, Home, ChevronRight, Scale, Trash2 } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';

export default function Index({ adjustments, customers = [], contracts = [], filters = {} }) {
    const { lang } = useLang();
    const [search, setSearch] = useState(filters.search || '');
    const [customerId, setCustomerId] = useState(filters.customer_id || '');
    const [contractId, setContractId] = useState(filters.contract_id || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('inventory-adjustments.index'), {
            search,
            customer_id: customerId,
            contract_id: contractId,
            status,
        }, { preserveState: true });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "إدارة المخازن" : "Warehouse"}</span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "سندات تسوية وتصحيح الطبالي" : "Pallet Adjustments"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "سندات تسوية وتصحيح الطبالي" : "Inventory Adjustments"} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                <PageHeader
                    icon={SlidersHorizontal}
                    title={lang === "ar" ? "سندات تسوية وتصحيح طبالي المخزون (كود 11)" : "Inventory & Pallet Adjustment Vouchers"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تسوية وتصحيح الفروقات الجردية للطبالي بالزيادة أو النقص بحرفية تامة ودون المساس بالاستلام والتسليم."
                                : "Adjust pallet physical quantities (surplus/deficit) cleanly without altering historical vouchers."}
                        </p>
                    }
                    actions={
                        <Link
                            href={route('inventory-adjustments.create')}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2 flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                            <Plus className="h-4 w-4" />
                            <span>{lang === "ar" ? "إنشاء سند تسوية جديد" : "New Adjustment Voucher"}</span>
                        </Link>
                    }
                />

                {/* Filter Box */}
                <form onSubmit={handleFilter} className="bg-surface border border-border p-4 shadow-2xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                            <label className="block font-bold text-text mb-1">{lang === "ar" ? "البحث بالرقم أو العميل" : "Search"}</label>
                            <input
                                type="text"
                                className="w-full text-xs border-border rounded-none h-[36px] bg-surface"
                                placeholder="DT-SZ-03481100001..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-text mb-1">{lang === "ar" ? "العميل" : "Customer"}</label>
                            <select
                                className="w-full text-xs border-border rounded-none h-[36px] bg-surface"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                            >
                                <option value="">{lang === "ar" ? "-- الكل --" : "-- All --"}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-text mb-1">{lang === "ar" ? "العقد" : "Contract"}</label>
                            <select
                                className="w-full text-xs border-border rounded-none h-[36px] bg-surface"
                                value={contractId}
                                onChange={(e) => setContractId(e.target.value)}
                            >
                                <option value="">{lang === "ar" ? "-- الكل --" : "-- All --"}</option>
                                {contracts.map((c) => (
                                    <option key={c.id} value={c.id}>{c.contract_number}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block font-bold text-text mb-1">{lang === "ar" ? "حالة السند" : "Status"}</label>
                            <select
                                className="w-full text-xs border-border rounded-none h-[36px] bg-surface"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">{lang === "ar" ? "-- الكل --" : "-- All --"}</option>
                                <option value="draft">{lang === "ar" ? "مسودة" : "Draft"}</option>
                                <option value="approved">{lang === "ar" ? "معتمد ومرحل" : "Approved"}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="submit" className="bg-primary text-white text-xs font-bold px-5 py-2 flex items-center gap-1">
                            <Search className="h-3.5 w-3.5" />
                            <span>{lang === "ar" ? "تطبيق التصفية" : "Filter"}</span>
                        </button>
                    </div>
                </form>

                {/* Table list */}
                <div className="bg-surface border border-border overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-start">
                        <thead className="bg-surface-muted text-text-muted font-bold border-b border-border">
                            <tr>
                                <th className="px-3 py-3 text-start w-10">#</th>
                                <th className="px-3 py-3 text-start">{lang === "ar" ? "رقم التسوية (كود 11)" : "Voucher Serial"}</th>
                                <th className="px-3 py-3 text-start">{lang === "ar" ? "العميل والعقد" : "Client & Contract"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "تاريخ التسوية" : "Date"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "نوع التسوية" : "Type"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "عدد الطبالي" : "Pallets Count"}</th>
                                <th className="px-3 py-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                                <th className="px-3 py-3 text-center w-24">{lang === "ar" ? "إجراء" : "Actions"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {adjustments.data.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-3 py-8 text-center text-text-muted italic font-bold">
                                        {lang === "ar" ? "لا توجد سندات تسوية مسجلة بعد." : "No inventory adjustments found."}
                                    </td>
                                </tr>
                            ) : (
                                adjustments.data.map((adj, idx) => (
                                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-3 font-mono text-text-muted">{idx + 1}</td>
                                        <td className="px-3 py-3 font-mono font-bold text-primary">{adj.serial_number}</td>
                                        <td className="px-3 py-3 font-bold text-text">
                                            <div>{adj.customer?.name}</div>
                                            <div className="text-[10px] text-text-muted font-mono">{adj.contract?.contract_number}</div>
                                        </td>
                                        <td className="px-3 py-3 text-center font-mono text-text">{adj.adjustment_date}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-none border ${
                                                adj.adjustment_type === 'surplus'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : adj.adjustment_type === 'deficit'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                                                    : 'bg-amber-50 text-amber-700 border-amber-300'
                                            }`}>
                                                {adj.adjustment_type === 'surplus' ? (lang === "ar" ? "زيادة (+)" : "Surplus (+)")
                                                : adj.adjustment_type === 'deficit' ? (lang === "ar" ? "عجز (-)" : "Deficit (-)")
                                                : (lang === "ar" ? "تسوية قيد مشروكة" : "Mixed")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center font-mono font-bold text-text">{adj.items_count}</td>
                                        <td className="px-3 py-3 text-center">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-none border ${
                                                adj.status === 'approved'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                            }`}>
                                                {adj.status === 'approved' ? (lang === "ar" ? "معتمد ومرحل" : "Approved") : (lang === "ar" ? "مسودة" : "Draft")}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            <Link
                                                href={route('inventory-adjustments.show', adj.id)}
                                                className="p-1.5 text-primary hover:bg-primary/10 inline-flex items-center transition-all"
                                                title={lang === "ar" ? "عرض التفاصيل والاعتماد" : "View & Approve"}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination links={adjustments.links} />
            </div>
        </AuthenticatedLayout>
    );
}
