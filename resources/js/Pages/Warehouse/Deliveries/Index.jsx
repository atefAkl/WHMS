import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    Eye,
    Printer,
    FileText,
    Search,
    Filter,
    ShieldAlert,
    CheckCircle2,
    RefreshCw,
    Unlock,
    Lock,
    X
} from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";

export default function Index({ deliveries = { data: [] }, customers = [], contracts = [], filters = {} }) {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedCustomer, setSelectedCustomer] = useState(filters.customer_id || "");
    const [selectedContract, setSelectedContract] = useState(filters.contract_id || "");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    
    // Action security credentials modal (approve/reopen)
    const [actionTarget, setActionTarget] = useState(null); // { type: 'approve'|'reopen', item }
    const [securePassword, setSecurePassword] = useState("");
    const [actionError, setActionError] = useState("");
    const [processingAction, setProcessingAction] = useState(false);

    // Delete Hook
    const {
        itemToDelete,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing: deleteProcessing,
        requestDelete,
        confirmDelete,
        cancelDelete
    } = useSecureDelete();

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("deliveries.index"),
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
        router.get(route("deliveries.index"));
    };

    const handleConfirmAction = (e) => {
        e.preventDefault();
        setActionError("");
        setProcessingAction(true);

        const { type, item } = actionTarget;

        let url = "";
        let dataPayload = {};

        if (type === "approve") {
            url = route("deliveries.approve", item.id);
        } else if (type === "reopen") {
            url = route("deliveries.reopen", item.id);
            dataPayload.password = securePassword;
        }

        router.post(url, dataPayload, {
            onSuccess: () => {
                setActionTarget(null);
                setSecurePassword("");
                setProcessingAction(false);
            },
            onError: (errs) => {
                setProcessingAction(false);
                if (errs.error) {
                    setActionError(errs.error);
                } else if (errs.password) {
                    setActionError(errs.password);
                } else {
                    setActionError(lang === "ar" ? "حدث خطأ ما." : "An error occurred.");
                }
            },
        });
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
                {lang === "ar" ? "سندات التسليم/الخروج" : "Goods Delivery Notes"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "سندات التسليم" : "Goods Delivery Notes"} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={FileText}
                    title={lang === "ar" ? "سندات التسليم والخروج" : "Goods Delivery Notes"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "إدارة وتوثيق سندات تسليم البضائع المصروفة للعملاء من رصيد الطبالي الفعلي."
                                : "Manage and track customer deliveries and exit notes loaded from current pallet stock balances."}
                        </p>
                    }
                    actions={
                        <Tooltip text={lang === "ar" ? "إنشاء سند خروج جديد" : "Create New Delivery Note"}>
                            <Link
                                href={route("deliveries.create")}
                                className={`bg-primary text-white hover:bg-primary-hover rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                            >
                                <Plus className="h-4 w-4 shrink-0" />
                                {showButtonText && <span>{lang === "ar" ? "جديد" : "New"}</span>}
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
                                <InputLabel value={lang === "ar" ? "البحث (الاسم، الرقم المسلسل، المرجع)" : "Search (Name, Serial, Ref)"} />
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
                                <InputLabel value={lang === "ar" ? "حالة السند" : "Status"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
                                    <option value="draft">{lang === "ar" ? "مسودة" : "Draft"}</option>
                                    <option value="approved">{lang === "ar" ? "معتمد" : "Approved"}</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 h-[30px]">
                                <Tooltip text={lang === "ar" ? "تصفية" : "Filter"}>
                                    <button 
                                        type="submit" 
                                        className={`h-[30px] flex items-center justify-center rounded-none bg-primary text-white hover:bg-primary-hover shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90 gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                    >
                                        <Filter className="h-4 w-4 shrink-0" />
                                        {showButtonText && <span>{lang === "ar" ? "تصفية" : "Filter"}</span>}
                                    </button>
                                </Tooltip>
                                <Tooltip text={lang === "ar" ? "إعادة تعيين" : "Reset"}>
                                    <button 
                                        type="button" 
                                        onClick={handleReset} 
                                        className={`h-[30px] flex items-center justify-center rounded-none bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90 gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                    >
                                        <RefreshCw className="h-4 w-4 shrink-0" />
                                        {showButtonText && <span>{lang === "ar" ? "إعادة تعيين" : "Reset"}</span>}
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
                                    <th className="p-3 text-start">{lang === "ar" ? "المرجع/الإذن" : "Reference / Permit"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "تاريخ التسليم" : "Delivery Date"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "إجمالي المنصرف" : "Total Output"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الخيارات" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {deliveries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-text-muted">
                                            {lang === "ar" ? "لا توجد سندات خروج مطابقة للبحث." : "No delivery notes found."}
                                        </td>
                                    </tr>
                                ) : (
                                    deliveries.data.map((item, idx) => {
                                        const rowNum = ((deliveries.current_page - 1) * deliveries.per_page) + idx + 1;
                                        return (
                                            <tr key={item.id} className="hover:bg-hover transition-colors">
                                                <td className="p-3 text-text-muted font-mono">{rowNum}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link 
                                                            href={route("deliveries.show", item.id)} 
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
                                                <td className="p-3 text-text">
                                                    {item.exit_authorization
                                                        ? `${lang === "ar" ? "إذن" : "Permit"}: ${item.exit_authorization.serial_number}`
                                                        : item.written_reference || "-"}
                                                </td>
                                                <td className="p-3 text-text-muted font-mono">
                                                    {item.delivery_date ? new Date(item.delivery_date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US') : "-"}
                                                </td>
                                                <td className="p-3 text-center font-bold text-text">
                                                    {item.total_quantity ? parseFloat(item.total_quantity).toLocaleString() : 0}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none ${
                                                        item.status === 'approved' 
                                                            ? 'bg-success/10 text-success border border-success/30' 
                                                            : 'bg-warning/10 text-warning border border-warning/30'
                                                    }`}>
                                                        {item.status === 'approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <Tooltip text={lang === "ar" ? "عرض التفاصيل" : "View Details"}>
                                                            <Link
                                                                href={route("deliveries.show", item.id)}
                                                                className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                {showButtonText && <span>{lang === "ar" ? "عرض" : "Show"}</span>}
                                                            </Link>
                                                        </Tooltip>

                                                        {item.status === 'draft' ? (
                                                            <>
                                                                <Tooltip text={lang === "ar" ? "تعديل السند" : "Edit Delivery Note"}>
                                                                    <Link
                                                                        href={route("deliveries.edit", item.id)}
                                                                        className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        {showButtonText && <span>{lang === "ar" ? "تعديل" : "Edit"}</span>}
                                                                    </Link>
                                                                </Tooltip>
                                                                <Tooltip text={lang === "ar" ? "اعتماد" : "Approve"}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActionTarget({ type: 'approve', item })}
                                                                        className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                        {showButtonText && <span className="text-[11px]">{lang === "ar" ? "اعتماد" : "Approve"}</span>}
                                                                    </button>
                                                                </Tooltip>
                                                                <Tooltip text={lang === "ar" ? "حذف السند" : "Delete Note"}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => requestDelete(route("deliveries.destroy", item.id), item)}
                                                                        className={`p-1.5 text-danger hover:bg-danger/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        {showButtonText && <span>{lang === "ar" ? "حذف" : "Delete"}</span>}
                                                                    </button>
                                                                </Tooltip>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Tooltip text={lang === "ar" ? "إعادة فتح" : "Reopen"}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActionTarget({ type: 'reopen', item })}
                                                                        className={`bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                    >
                                                                        <Unlock className="h-4 w-4" />
                                                                        {showButtonText && <span className="text-[11px]">{lang === "ar" ? "إعادة فتح" : "Reopen"}</span>}
                                                                    </button>
                                                                </Tooltip>
                                                                <Tooltip text={lang === "ar" ? "طباعة نسختين" : "Print"}>
                                                                    <a
                                                                        href={route("deliveries.print", item.id)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`p-1.5 text-text hover:bg-hover rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                    >
                                                                        <Printer className="h-4 w-4" />
                                                                        {showButtonText && <span>{lang === "ar" ? "طباعة" : "Print"}</span>}
                                                                    </a>
                                                                </Tooltip>
                                                            </>
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
                {deliveries.links && deliveries.links.length > 3 && (
                    <div className="flex justify-center mt-6 gap-1" dir="ltr">
                        {deliveries.links.map((link, idx) => {
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

            {/* Credential Action Modal */}
            <Modal show={!!actionTarget} onClose={() => { setActionTarget(null); setSecurePassword(""); setActionError(""); }}>
                <div className="p-6 font-main" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-3 text-danger mb-4">
                        <ShieldAlert className="h-6 w-6" />
                        <h3 className="text-sm font-bold">
                            {actionTarget?.type === "approve" && (lang === "ar" ? "اعتماد سند الخروج" : "Approve Delivery Note")}
                            {actionTarget?.type === "reopen" && (lang === "ar" ? "إلغاء الاعتماد وإعادة السند لمسودة" : "Reopen Delivery Note")}
                        </h3>
                    </div>

                    <p className="text-xs text-text mb-4">
                        {actionTarget?.type === "approve" && (lang === "ar" ? `هل تريد اعتماد السند ${actionTarget?.item?.serial_number} نهائياً؟ هذا سيخصم الأرصدة من الطبالي ويغلق السند.` : `Are you sure you want to approve delivery note ${actionTarget?.item?.serial_number}? This will lock the document and deduct stocks.`)}
                        {actionTarget?.type === "reopen" && (lang === "ar" ? `هل تريد إلغاء اعتماد السند ${actionTarget?.item?.serial_number}؟ سيتم إرجاع السند لحالة المسودة وإمكانية تعديله.` : `Are you sure you want to revert delivery note ${actionTarget?.item?.serial_number} to draft?`)}
                    </p>

                    <form onSubmit={handleConfirmAction} className="space-y-4">
                        {actionTarget?.type !== "approve" && (
                            <div>
                                <InputLabel value={lang === "ar" ? "رمز التأكيد الأمني (كلمة مرور الحفظ/الحذف)" : "Security Password"} />
                                <TextInput
                                    type="password"
                                    className="w-full text-xs rounded-none mt-1"
                                    placeholder="••••••••"
                                    value={securePassword}
                                    onChange={(e) => setSecurePassword(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        {actionError && <span className="text-xs text-danger mt-1 block">{actionError}</span>}

                        <div className="flex justify-end gap-2 pt-2">
                            <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                                <button
                                    type="button"
                                    onClick={() => { setActionTarget(null); setSecurePassword(""); setActionError(""); }}
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                >
                                    <X className="h-4 w-4" />
                                    {showButtonText && <span>{lang === "ar" ? "إلغاء" : "Cancel"}</span>}
                                </button>
                            </Tooltip>

                            <Tooltip text={
                                actionTarget?.type === "approve"
                                    ? (lang === "ar" ? "تأكيد الاعتماد" : "Confirm Approve")
                                    : (lang === "ar" ? "تأكيد إعادة الفتح" : "Confirm Reopen")
                            }>
                                <button
                                    type="submit"
                                    disabled={processingAction}
                                    className={`rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${
                                        actionTarget?.type === "approve"
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            : "bg-amber-600 hover:bg-amber-700 text-white"
                                    } ${showButtonText ? 'px-3' : 'w-[30px] p-0'} disabled:opacity-50`}
                                >
                                    {actionTarget?.type === "approve" && <CheckCircle2 className="h-4 w-4" />}
                                    {actionTarget?.type === "reopen" && <Unlock className="h-4 w-4" />}

                                    {showButtonText && (
                                        <span>
                                            {processingAction
                                                ? (lang === "ar" ? "جاري المعالجة..." : "Processing...")
                                                : actionTarget?.type === "approve"
                                                ? (lang === "ar" ? "تأكيد الاعتماد" : "Confirm Approve")
                                                : (lang === "ar" ? "تأكيد إعادة الفتح" : "Confirm Reopen")}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Confirm Secure Delete Modal */}
            <ConfirmationModal
                show={!!itemToDelete}
                title={lang === "ar" ? "تأكيد حذف سند التسليم" : "Confirm Delete"}
                message={lang === "ar" 
                    ? `هل أنت متأكد من رغبتك في حذف السند ${itemToDelete?.serial_number}؟ هذا الإجراء يتطلب كلمة مرور العمليات.` 
                    : `Are you sure you want to delete delivery note ${itemToDelete?.serial_number}? This requires secure operations password.`}
                confirmLabel={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                cancelLabel={lang === "ar" ? "إلغاء" : "Cancel"}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                processing={deleteProcessing}
                type="danger"
            />
        </AuthenticatedLayout>
    );
}
