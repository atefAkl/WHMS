import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    FileCheck,
    RefreshCw
} from "lucide-react";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";

export default function Index({ authorizations = { data: [] }, customers = [], contracts = [], filters = {} }) {
    const { lang } = useLang();
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedCustomer, setSelectedCustomer] = useState(filters.customer_id || "");
    const [selectedContract, setSelectedContract] = useState(filters.contract_id || "");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    
    const {
        itemToDelete: authToDelete,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing: processingDelete,
        requestDelete,
        confirmDelete,
        cancelDelete
    } = useSecureDelete();

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("exit-authorizations.index"),
            {
                search: searchQuery,
                customer_id: selectedCustomer,
                contract_id: selectedContract,
                status: selectedStatus,
                date_from: dateFrom,
                date_to: dateTo,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchQuery("");
        setSelectedCustomer("");
        setSelectedContract("");
        setSelectedStatus("");
        setDateFrom("");
        setDateTo("");
        router.get(route("exit-authorizations.index"));
    };
    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إدارة المخازن" : "Warehouse Management"}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "أذونات الخروج" : "Exit Authorizations"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "أذونات خروج البضائع" : "Exit Authorizations"} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={FileCheck}
                    title={lang === "ar" ? "أذونات خروج البضائع (المرخص)" : "Exit Authorizations"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "إدارة أذونات سحب البضائع الصادرة عن مدير العقود لتمكين مسؤول التسليم من الصرف."
                                : "Manage delivery authorization permits issued by Contract Manager to authorize deliveries."}
                        </p>
                    }
                    actions={
                        <Tooltip text={lang === "ar" ? "إنشاء إذن خروج جديد" : "Create New Exit Authorization"}>
                            <Link
                                href={route("exit-authorizations.create")}
                                className="bg-primary text-white hover:bg-primary-hover rounded-none flex items-center justify-center transition-all h-[30px] w-[30px]"
                            >
                                <Plus className="h-4 w-4 shrink-0" />
                            </Link>
                        </Tooltip>
                    }
                />

                {/* Search & Filters Section */}
                <div className="bg-surface border border-border p-3 shadow-sm rounded-none">
                    <form onSubmit={handleSearch} className="space-y-3">
                        {/* Row 1: Search & Date Range */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <InputLabel value={lang === "ar" ? "البحث بالرقم أو العميل" : "Search by Serial / Customer"} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-8 h-[30px]"
                                        placeholder={lang === "ar" ? "أدخل كلمة البحث..." : "Type keyword..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>
                            <div>
                                <InputLabel value={lang === "ar" ? "التاريخ من" : "Date From"} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>
                            <div>
                                <InputLabel value={lang === "ar" ? "التاريخ إلى" : "Date To"} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Row 2: Common Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                                <InputLabel value={lang === "ar" ? "العميل" : "Customer"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedCustomer}
                                    onChange={(e) => setSelectedCustomer(e.target.value)}
                                >
                                    <option value="">{lang === "ar" ? "كل العملاء" : "All Customers"}</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <InputLabel value={lang === "ar" ? "العقد" : "Contract"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedContract}
                                    onChange={(e) => setSelectedContract(e.target.value)}
                                >
                                    <option value="">{lang === "ar" ? "كل العقود" : "All Contracts"}</option>
                                    {contracts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.contract_number}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <InputLabel value={lang === "ar" ? "الحالة" : "Status"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
                                    <option value="pending">{lang === "ar" ? "معلق" : "Pending"}</option>
                                    <option value="completed">{lang === "ar" ? "مكتمل" : "Completed"}</option>
                                    <option value="cancelled">{lang === "ar" ? "ملغي" : "Cancelled"}</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 h-[30px]">
                                <Tooltip text={lang === "ar" ? "تصفية" : "Filter"}>
                                    <button 
                                        type="submit" 
                                        className="h-[30px] w-[30px] p-0 flex items-center justify-center rounded-none bg-primary text-white hover:bg-primary-hover shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90"
                                    >
                                        <Filter className="h-4 w-4 shrink-0" />
                                    </button>
                                </Tooltip>
                                <Tooltip text={lang === "ar" ? "إعادة تعيين" : "Reset"}>
                                    <button 
                                        type="button" 
                                        onClick={handleReset} 
                                        className="h-[30px] w-[30px] p-0 flex items-center justify-center rounded-none bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90"
                                    >
                                        <RefreshCw className="h-4 w-4 shrink-0" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Table Data */}
                <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-muted font-bold">
                                    <th className="p-3 text-start w-12">#</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "المستند والمعرفات" : "Document & Identifiers"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "تاريخ الإنشاء" : "Created At"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "إجمالي المرخص" : "Total Authorized"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الخيارات" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {authorizations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-text-muted">
                                            {lang === "ar" ? "لا توجد أذونات خروج مطابقة للبحث." : "No exit authorizations found."}
                                        </td>
                                    </tr>
                                ) : (
                                    authorizations.data.map((item, idx) => {
                                        const rowNum = ((authorizations.current_page - 1) * authorizations.per_page) + idx + 1;
                                        return (
                                            <tr key={item.id} className="hover:bg-hover transition-colors">
                                                <td className="p-3 text-text-muted font-mono">{rowNum}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link 
                                                            href={route("exit-authorizations.edit", item.id)} 
                                                            className="font-bold text-primary hover:underline text-xs"
                                                        >
                                                            {item.serial_number}
                                                        </Link>
                                                        <div className="text-[10px] text-text-muted flex items-center gap-1.5 flex-wrap">
                                                            {item.customer && (
                                                                <Link 
                                                                    href={route("customers.show", item.customer.id)} 
                                                                    className="hover:underline text-text hover:text-primary font-medium"
                                                                >
                                                                    {item.customer.name}
                                                                </Link>
                                                            )}
                                                            <span>|</span>
                                                            {item.contract && (
                                                                <Link 
                                                                    href={route("contracts.show", item.contract.id)} 
                                                                    className="hover:underline font-mono"
                                                                >
                                                                    {item.contract.contract_number}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-text-muted font-mono">{new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                                                <td className="p-3 text-center font-bold text-text">
                                                    {item.total_quantity ? parseFloat(item.total_quantity).toLocaleString() : 0}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none ${
                                                        item.status === 'completed' 
                                                            ? 'bg-success/10 text-success border border-success/30' 
                                                            : item.status === 'cancelled'
                                                            ? 'bg-danger/10 text-danger border border-danger/30'
                                                            : 'bg-warning/10 text-warning border border-warning/30'
                                                    }`}>
                                                        {item.status === 'completed' && (lang === 'ar' ? 'مكتمل' : 'Completed')}
                                                        {item.status === 'cancelled' && (lang === 'ar' ? 'ملغي' : 'Cancelled')}
                                                        {item.status === 'pending' && (lang === 'ar' ? 'معلق' : 'Pending')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        {item.status === 'pending' && (
                                                            <>
                                                                <Tooltip text={lang === "ar" ? "تعديل الإذن" : "Edit Authorization"}>
                                                                    <Link
                                                                        href={route("exit-authorizations.edit", item.id)}
                                                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] w-[30px]"
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Link>
                                                                </Tooltip>
                                                                <Tooltip text={lang === "ar" ? "حذف الإذن" : "Delete Authorization"}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => requestDelete(route("exit-authorizations.destroy", item.id), item)}
                                                                        className="p-1.5 text-danger hover:bg-danger/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] w-[30px]"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        {item.status !== 'pending' && (
                                                            <span className="text-[11px] text-text-muted italic">
                                                                {lang === "ar" ? "مغلق" : "Locked"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {authorizations.links && authorizations.links.length > 3 && (
                    <div className="flex justify-center mt-6 gap-1" dir="ltr">
                        {authorizations.links.map((link, idx) => {
                            if (link.url === null) {
                                return (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 border border-border text-text-muted cursor-not-allowed bg-background text-xs"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    className={`px-3 py-1.5 border text-xs transition-all ${
                                        link.active
                                            ? "bg-primary text-white border-primary font-bold"
                                            : "border-border hover:bg-hover text-text"
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmationModal
                show={!!authToDelete}
                title={lang === "ar" ? "تأكيد حذف إذن الخروج" : "Confirm Delete Authorization"}
                message={
                    lang === "ar"
                        ? `هل أنت متأكد من رغبتك في حذف إذن الخروج ${authToDelete?.serial_number}؟ لا يمكن التراجع عن هذا الإجراء.`
                        : `Are you sure you want to delete authorization ${authToDelete?.serial_number}? This action cannot be undone.`
                }
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={processingDelete}
            />
        </AuthenticatedLayout>
    );
}
