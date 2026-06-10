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
    Lock,
    Unlock,
    X
} from "lucide-react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";

export default function Index({ receptions = { data: [] }, customers = [], contracts = [], filters = {} }) {
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
    
    // Deletion Security Password Modal
    const {
        itemToDelete: receptionToDelete,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing: processingDelete,
        requestDelete,
        confirmDelete,
        cancelDelete
    } = useSecureDelete();

    // Receptions Approve & Reopen State
    const [receptionToApprove, setReceptionToApprove] = useState(null);
    const [receptionToReopen, setReceptionToReopen] = useState(null);
    const [isApproveModalOpen, setApproveModalOpen] = useState(false);
    const [isReopenModalOpen, setReopenModalOpen] = useState(false);
    const [securePassword, setSecurePassword] = useState("");
    const [reopenReason, setReopenReason] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [processingAction, setProcessingAction] = useState(false);

    const handleApprove = () => {
        if (!receptionToApprove) return;
        setProcessingAction(true);
        setErrorMsg("");
        router.post(
            route("receptions.approve", receptionToApprove.id),
            {},
            {
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setReceptionToApprove(null);
                    setProcessingAction(false);
                },
                onError: (errs) => {
                    setProcessingAction(false);
                    setErrorMsg(errs.error || (lang === "ar" ? "تعذر اعتماد السند." : "Failed to approve."));
                }
            }
        );
    };

    const handleReopen = (e) => {
        e.preventDefault();
        if (!receptionToReopen) return;
        setErrorMsg("");
        setProcessingAction(true);

        router.post(
            route("receptions.reopen", receptionToReopen.id),
            {
                password: securePassword,
                reason: reopenReason
            },
            {
                onSuccess: () => {
                    setReopenModalOpen(false);
                    setReceptionToReopen(null);
                    setSecurePassword("");
                    setReopenReason("");
                    setProcessingAction(false);
                },
                onError: (errs) => {
                    setProcessingAction(false);
                    if (errs.error) {
                        setErrorMsg(errs.error);
                    } else if (errs.password) {
                        setErrorMsg(errs.password);
                    } else if (errs.reason) {
                        setErrorMsg(errs.reason);
                    } else {
                        setErrorMsg(lang === "ar" ? "تعذر إلغاء الاعتماد." : "Failed to reopen.");
                    }
                }
            }
        );
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("receptions.index"),
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
        router.get(route("receptions.index"));
    };

    // Delete function handled by useSecureDelete hook

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إدارة المخازن" : "Warehouse Management"}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إيصالات الاستلام" : "Reception Vouchers"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "سندات الاستلام" : "Reception Vouchers"} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={FileText}
                    title={lang === "ar" ? "سندات وإيصالات الاستلام" : "Reception Vouchers"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تسجيل بضائع وأصناف العملاء المستلمة على طبالي وتثبيتها في حركة المخازن."
                                : "Record customers' physical goods on pallets and log them in warehouse inventory entries."}
                        </p>
                    }
                    actions={
                        <Tooltip text={lang === "ar" ? "إنشاء سند استلام جديد" : "Create New Reception"}>
                            <Link
                                href={route("receptions.create")}
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
                                <InputLabel value={lang === "ar" ? "البحث (الاسم، الرقم المسلسل، مصدر المزرعة)" : "Search (Name, Serial, Farm Source)"} />
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
                                    <option value="approved">{lang === "ar" ? "معتمد ومغلق" : "Approved & Locked"}</option>
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

                {/* Receptions Table */}
                <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-muted font-bold">
                                    <th className="p-3 text-start w-12">#</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "المستند والمعرفات" : "Document & Identifiers"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "الفترة الإلزامية" : "Period"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "تاريخ الاستلام" : "Reception Date"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "السائق" : "Driver"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "إجمالي الوارد" : "Total Input"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الحالة" : "Status"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الخيارات" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {receptions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-text-muted">
                                            {lang === "ar" ? "لم يتم العثور على أي سندات استلام." : "No reception vouchers found."}
                                        </td>
                                    </tr>
                                ) : (
                                    receptions.data.map((reception, idx) => {
                                        const rowNum = ((receptions.current_page - 1) * receptions.per_page) + idx + 1;
                                        return (
                                            <tr key={reception.id} className="hover:bg-hover transition-colors">
                                                <td className="p-3 text-text-muted font-mono">{rowNum}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link 
                                                            href={route("receptions.show", reception.id)} 
                                                            className="font-bold text-primary hover:underline text-xs"
                                                        >
                                                            {reception.serial_number}
                                                        </Link>
                                                        <div className="text-[10px] text-text-muted flex items-center gap-1.5 flex-wrap">
                                                            {reception.customer && (
                                                                <Link 
                                                                    href={route("customers.show", reception.customer.id)} 
                                                                    className="hover:underline text-text hover:text-primary font-medium"
                                                                >
                                                                    {reception.customer.name}
                                                                </Link>
                                                            )}
                                                            <span>|</span>
                                                            {reception.contract && (
                                                                <Link 
                                                                    href={route("contracts.show", reception.contract.id)} 
                                                                    className="hover:underline font-mono"
                                                                >
                                                                    {reception.contract.contract_number}
                                                                </Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-text-muted">
                                                    {lang === "ar" ? "الفترة" : "Period"} {reception.period?.period_number}
                                                </td>
                                                <td className="p-3 text-text-muted font-mono">
                                                    {reception.reception_date ? new Date(reception.reception_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                                                </td>
                                                <td className="p-3 text-text text-xs">
                                                    {reception.driver ? (
                                                        <span className="flex flex-col">
                                                            <span className="font-semibold">{reception.driver.name}</span>
                                                            <span className="text-[10px] text-text-muted font-mono">{reception.driver.vehicle_plate}</span>
                                                        </span>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>
                                                <td className="p-3 text-center font-bold text-text">
                                                    {reception.total_quantity ? parseFloat(reception.total_quantity).toLocaleString() : 0}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none inline-block ${
                                                        reception.status === 'approved' 
                                                            ? 'bg-success/10 text-success border border-success/30' 
                                                            : 'bg-warning/10 text-warning border border-warning/30'
                                                    }`}>
                                                        {reception.status === 'approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <Tooltip text={lang === "ar" ? "عرض التفاصيل" : "Show Details"}>
                                                            <Link
                                                                href={route("receptions.show", reception.id)}
                                                                className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                {showButtonText && <span>{lang === "ar" ? "عرض" : "Show"}</span>}
                                                            </Link>
                                                        </Tooltip>
                                                        {reception.status === "draft" && (
                                                            <Tooltip text={lang === "ar" ? "تعديل" : "Edit"}>
                                                                <Link
                                                                    href={route("receptions.edit", reception.id)}
                                                                    className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    {showButtonText && <span>{lang === "ar" ? "تعديل" : "Edit"}</span>}
                                                                </Link>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip text={lang === "ar" ? "طباعة" : "Print"}>
                                                            <a
                                                                href={route("receptions.print", reception.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`p-1.5 text-text hover:bg-hover rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                                {showButtonText && <span>{lang === "ar" ? "طباعة" : "Print"}</span>}
                                                            </a>
                                                        </Tooltip>
                                                        {reception.status === "draft" ? (
                                                            <Tooltip text={lang === "ar" ? "اعتماد" : "Approve"}>
                                                                <button
                                                                    onClick={() => {
                                                                        setErrorMsg("");
                                                                        setReceptionToApprove(reception);
                                                                        setApproveModalOpen(true);
                                                                    }}
                                                                    className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    {showButtonText && <span className="text-[11px]">{lang === "ar" ? "اعتماد" : "Approve"}</span>}
                                                                </button>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip text={lang === "ar" ? "إعادة فتح" : "Reopen"}>
                                                                <button
                                                                    onClick={() => {
                                                                        setErrorMsg("");
                                                                        setSecurePassword("");
                                                                        setReopenReason("");
                                                                        setReceptionToReopen(reception);
                                                                        setReopenModalOpen(true);
                                                                    }}
                                                                    className={`bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                >
                                                                    <Unlock className="h-4 w-4" />
                                                                    {showButtonText && <span className="text-[11px]">{lang === "ar" ? "إعادة فتح" : "Reopen"}</span>}
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip text={lang === "ar" ? "حذف" : "Delete"}>
                                                            <button
                                                                onClick={() => requestDelete(route("receptions.destroy", reception.id), reception)}
                                                                className={`p-1.5 text-danger hover:bg-danger/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                {showButtonText && <span>{lang === "ar" ? "حذف" : "Delete"}</span>}
                                                            </button>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {receptions.links && receptions.links.length > 3 && (
                        <div className="bg-surface border-t border-border p-3 flex items-center justify-between">
                            <div className="text-xs text-text-muted">
                                {lang === "ar" ? "عرض الصفحة" : "Showing page"}{" "}
                                <span className="font-bold">{receptions.current_page}</span>{" "}
                                {lang === "ar" ? "من أصل" : "of"}{" "}
                                <span className="font-bold">{receptions.last_page}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {receptions.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || "#"}
                                        className={`px-3 py-1.5 border text-xs font-medium rounded-none transition-all ${
                                            link.active
                                                ? "bg-primary text-white border-primary"
                                                : link.url
                                                ? "bg-surface border-border text-text hover:bg-surface-muted"
                                                : "bg-surface-muted text-text-muted border-border cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Secure Delete Modal */}
            <ConfirmationModal
                show={!!receptionToDelete}
                title={lang === "ar" ? "تأكيد حذف سند الاستلام" : "Confirm Reception Deletion"}
                message={lang === "ar"
                            ? "أنت على وشك حذف هذا السند وحركات المخزن التابعة له بشكل نهائي. هذا الإجراء غير قابل للتراجع."
                            : "You are about to permanently delete this reception voucher and all associated inventory entries. This action cannot be undone."}
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={processingDelete}
            />

            {/* Modal: Confirm Reopen */}
            <Modal show={isReopenModalOpen} onClose={() => setReopenModalOpen(false)} maxWidth="md">
                <form onSubmit={handleReopen} className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Unlock className="h-6 w-6 text-amber-500 animate-pulse" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar" ? "إعادة فتح السند (إلغاء الاعتماد)" : "Reopen Approved Voucher"}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {lang === "ar"
                            ? "بإعادة فتح السند، سيعود لحالة المسودة (Draft) لتتمكن من تعديله. يتطلب هذا الإجراء كلمة مرور العمليات وتوثيق السبب."
                            : "Reopening will return the voucher to Draft status, allowing modifications. This requires the secure password and a documented reason."}
                    </p>

                    <div>
                        <InputLabel
                            htmlFor="reopen_reason"
                            value={lang === "ar" ? "سبب إلغاء الاعتماد وإعادة الفتح *" : "Reason for Reopening *"}
                        />
                        <TextInput
                            id="reopen_reason"
                            type="text"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder={lang === "ar" ? "مثال: تعديل كمية طبلية خاطئة..." : "e.g., correcting incorrect pallet quantity..."}
                            required
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="reopen_password"
                            value={lang === "ar" ? "كلمة مرور العمليات الآمنة *" : "Secure Operations Password *"}
                        />
                        <TextInput
                            id="reopen_password"
                            type="password"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={securePassword}
                            onChange={(e) => setSecurePassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {errorMsg && <p className="text-xs text-danger mt-1 font-bold">{errorMsg}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setReopenModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && <span>{lang === "ar" ? "إلغاء" : "Cancel"}</span>}
                            </button>
                        </Tooltip>
                        <Tooltip text={lang === "ar" ? "تأكيد إعادة الفتح" : "Confirm Reopen"}>
                            <button
                                type="submit"
                                disabled={processingAction}
                                className={`bg-amber-600 hover:bg-amber-700 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'} disabled:opacity-50`}
                            >
                                <Unlock className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? (lang === "ar" ? "جاري المعالجة..." : "Processing...")
                                            : (lang === "ar" ? "تأكيد إعادة الفتح" : "Confirm Reopen")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </form>
            </Modal>

            {/* Modal: Confirm Approve */}
            <Modal show={isApproveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="sm">
                <div className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Lock className="h-6 w-6 text-emerald-500" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar" ? "اعتماد وإغلاق سند الاستلام" : "Approve & Lock Voucher"}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {lang === "ar"
                            ? "هل أنت متأكد من اعتماد هذا السند؟ سيتم تثبيت الكميات في المخازن بشكل رسمي، وسيتحول السند إلى حالة القفل ولا يمكن تعديله إلا بكلمة مرور العمليات."
                            : "Are you sure you want to approve this voucher? Items will officially be registered, and the voucher will be locked and cannot be edited without secure supervisor password."}
                    </p>

                    {errorMsg && <p className="text-xs text-danger mt-1 font-bold">{errorMsg}</p>}

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setApproveModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && <span>{lang === "ar" ? "إلغاء" : "Cancel"}</span>}
                            </button>
                        </Tooltip>
                        <Tooltip text={lang === "ar" ? "تأكيد الاعتماد" : "Confirm Approve"}>
                            <button
                                type="button"
                                onClick={handleApprove}
                                disabled={processingAction}
                                className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'} disabled:opacity-50`}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? (lang === "ar" ? "جاري الاعتماد..." : "Approving...")
                                            : (lang === "ar" ? "تأكيد الاعتماد" : "Confirm Approve")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
