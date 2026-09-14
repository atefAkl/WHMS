import React, { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { ArrowLeftRight, ArrowRight, CheckCircle2, ChevronRight, Edit, Eye, FileText, Filter, Home, Lock, Monitor, Plus, Printer, RefreshCw, Search, Trash2, Unlock, X } from "lucide-react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import SearchableSelect from "@/Components/SearchableSelect";

export default function Index({ transfers = { data: [] }, contracts = [], customers = [], drivers = [], filters = {} }) {
    const { lang, __ } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;

    // Translation Helper
    const t = (key, fallback) => {
        if (!key) return fallback || "";
        const translated = __ ? __(key) : key;
        return (translated && translated !== key) ? translated : fallback;
    };

    // Combined Customer & Contract Options for SearchableSelect
    const customerAndContractOptions = useMemo(() => {
        const options = [];
        (customers || []).forEach((c) => {
            options.push({
                id: `cust_${c.id}`,
                value: c.name,
                label: `${c.name} (${t("transfers.customer", "عميل")})`,
                type: "customer",
                searchKeys: [c.name, c.foreign_name || "", c.code || ""].filter(Boolean),
            });
        });
        (contracts || []).forEach((cnt) => {
            const custName = cnt.customer?.name || "";
            options.push({
                id: `cnt_${cnt.id}`,
                value: cnt.contract_number,
                label: `${cnt.contract_number} ${custName ? `- ${custName}` : ""} (${t("transfers.contract", "عقد")})`,
                type: "contract",
                searchKeys: [cnt.contract_number, custName].filter(Boolean),
            });
        });
        return options;
    }, [customers, contracts, lang]);

    // Explicit Filter States
    const [serialNumber, setSerialNumber] = useState(filters.serial_number || "");
    const [farmSource, setFarmSource] = useState(filters.farm_source || "");
    const [customerOrContract, setCustomerOrContract] = useState(filters.customer_or_contract || "");
    const [notes, setNotes] = useState(filters.notes || "");
    const [selectedDriver, setSelectedDriver] = useState(filters.driver_id || "");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");

    // Quick View Modal State
    const [quickViewTransfer, setQuickViewTransfer] = useState(null);
    const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);

    // Deletion Security Password Modal
    const {
        itemToDelete: transferToDelete,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing: processingDelete,
        requestDelete,
        confirmDelete,
        cancelDelete
    } = useSecureDelete();

    // Transfer Approve & Reopen State
    const [transferToApprove, setTransferToApprove] = useState(null);
    const [transferToReopen, setTransferToReopen] = useState(null);
    const [isApproveModalOpen, setApproveModalOpen] = useState(false);
    const [isReopenModalOpen, setReopenModalOpen] = useState(false);
    const [securePassword, setSecurePassword] = useState("");
    const [reopenReason, setReopenReason] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [processingAction, setProcessingAction] = useState(false);

    const submitSearch = () => {
        router.get(
            route("contract-transfers.index"),
            {
                serial_number: serialNumber,
                farm_source: farmSource,
                customer_or_contract: customerOrContract,
                notes: notes,
                driver_id: selectedDriver,
                status: selectedStatus,
                date_from: dateFrom,
                date_to: dateTo,
            },
            { preserveState: true }
        );
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        submitSearch();
    };

    const handleReset = () => {
        setSerialNumber("");
        setFarmSource("");
        setCustomerOrContract("");
        setNotes("");
        setSelectedDriver("");
        setSelectedStatus("");
        setDateFrom("");
        setDateTo("");
        router.get(route("contract-transfers.index"));
    };

    // Keyboard Shortcut (CTRL+Enter) for search submission
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                submitSearch();
            }
        };
        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, [serialNumber, farmSource, customerOrContract, notes, selectedDriver, selectedStatus, dateFrom, dateTo]);

    const handleApprove = () => {
        if (!transferToApprove) return;
        setProcessingAction(true);
        setErrorMsg("");
        router.post(
            route("contract-transfers.approve", transferToApprove.id),
            {},
            {
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setTransferToApprove(null);
                    setProcessingAction(false);
                },
                onError: (errs) => {
                    setProcessingAction(false);
                    setErrorMsg(errs.error || t("transfers.failed_to_approve", "تعذر اعتماد السند."));
                }
            }
        );
    };

    const handleReopen = (e) => {
        e.preventDefault();
        if (!transferToReopen) return;
        setErrorMsg("");
        setProcessingAction(true);

        router.post(
            route("contract-transfers.reopen", transferToReopen.id),
            {
                password: securePassword,
                reason: reopenReason
            },
            {
                onSuccess: () => {
                    setReopenModalOpen(false);
                    setTransferToReopen(null);
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
                        setErrorMsg(t("transfers.failed_to_reopen", "تعذر إلغاء الاعتماد."));
                    }
                }
            }
        );
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {t("warehouse.management", "إدارة المخازن")}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {t("transfers.title", "سندات تحويل الطبالي")}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t("transfers.title", "سندات تحويل الطبالي")} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={ArrowLeftRight}
                    title={t("transfers.title_header", "سندات تحويل الطبالي بين العقود")}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {t("transfers.description", "تحويل رصيد طبالي وأصناف مستلمة من عقد مصدر إلى عقد وجهة داخل المخزن وتثبيتها في الحركة.")}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Tooltip text={t("transfers.new_button", "إنشاء سند تحويل جديد")}>
                                <Link
                                    href={route("contract-transfers.create")}
                                    className={`bg-primary text-white hover:bg-primary-hover rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    {showButtonText && <span>{t("common.new", "جديد")}</span>}
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Filters Section */}
                <div className="bg-surface border border-border p-3 shadow-sm rounded-none">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <InputLabel value={t("transfers.filter_serial", "رقم المسلسل للسند")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("transfers.placeholder_serial", "ابحث برقم المسلسل...")}
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("transfers.filter_customer_or_contract", "اسم العميل أو رقم العقد")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={customerAndContractOptions}
                                        value={customerOrContract}
                                        valueKey="id"
                                        displayFormat={(item) => item.label || item.value}
                                        searchKeys={["label", "value"]}
                                        placeholder={t("transfers.placeholder_customer_contract", "ادخل العميل أو العقد...")}
                                        className="w-full text-xs rounded-none border-border h-[30px]"
                                        onChange={(selected) => setCustomerOrContract(selected ? selected.value : "")}
                                        onInputChange={(val) => setCustomerOrContract(val)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("transfers.filter_farm_source", "مصدر المزرعة")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("transfers.placeholder_farm_source", "المزرعة أو المصدر...")}
                                        value={farmSource}
                                        onChange={(e) => setFarmSource(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("transfers.filter_notes", "البحث في الملاحظات")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("transfers.placeholder_notes", "كلمات من الملاحظات...")}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex-1 min-w-[150px]">
                                <InputLabel value={t("transfers.driver", "السائق")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={drivers}
                                        value={selectedDriver}
                                        valueKey="id"
                                        displayFormat={(d) => `${d.name} ${d.vehicle_plate ? `(${d.vehicle_plate})` : ""}`}
                                        searchKeys={["name", "vehicle_plate"]}
                                        placeholder={t("transfers.all_drivers", "كل السائقين")}
                                        className="w-full text-xs rounded-none border-border h-[30px]"
                                        onChange={(d) => setSelectedDriver(d ? d.id : "")}
                                        onInputChange={(val) => {
                                            if (!val) setSelectedDriver("");
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 min-w-[130px]">
                                <InputLabel value={t("transfers.status", "حالة السند")} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">{t("transfers.all_statuses", "كل الحالات")}</option>
                                    <option value="draft">{t("transfers.status_draft", "مسودة")}</option>
                                    <option value="approved">{t("transfers.status_approved", "معتمد ومغلق")}</option>
                                </select>
                            </div>

                            <div className="w-[10rem] max-w-[10rem]">
                                <InputLabel value={t("transfers.date_from", "التاريخ من")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2 font-mono"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="w-[10rem] max-w-[10rem]">
                                <InputLabel value={t("transfers.date_to", "التاريخ إلى")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2 font-mono"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-1.5 h-[30px] shrink-0">
                                <Tooltip text={t("common.filter", "تصفية")}>
                                    <button 
                                        type="submit" 
                                        className={`h-[30px] flex items-center justify-center rounded-none bg-primary text-white hover:bg-primary-hover shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90 gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                    >
                                        <Filter className="h-4 w-4 shrink-0" />
                                        {showButtonText && <span>{t("common.filter", "تصفية")}</span>}
                                    </button>
                                </Tooltip>
                                <Tooltip text={t("common.reset", "إعادة تعيين")}>
                                    <button 
                                        type="button" 
                                        onClick={handleReset} 
                                        className={`h-[30px] flex items-center justify-center rounded-none bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90 gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                    >
                                        <RefreshCw className="h-4 w-4 shrink-0" />
                                        {showButtonText && <span>{t("common.reset", "إعادة تعيين")}</span>}
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Transfers Table */}
                <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-muted font-bold">
                                    <th className="p-3 text-start w-12">#</th>
                                    <th className="p-3 text-start">{t("transfers.col_document", "المستند ورقم السند")}</th>
                                    <th className="p-3 text-start">{t("transfers.col_contracts", "مسار التحويل (المصدر ← الوجهة)")}</th>
                                    <th className="p-3 text-start">{t("transfers.col_date", "تاريخ التحويل")}</th>
                                    <th className="p-3 text-start">{t("transfers.col_driver", "السائق / الملاحظات")}</th>
                                    <th className="p-3 text-center">{t("transfers.col_total_qty", "إجمالي الكمية")}</th>
                                    <th className="p-3 text-center">{t("transfers.col_status", "الحالة")}</th>
                                    <th className="p-3 text-center">{t("transfers.col_actions", "الخيارات")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {transfers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-text-muted">
                                            {t("transfers.no_records", "لم يتم العثور على أي سندات تحويل طبالي.")}
                                        </td>
                                    </tr>
                                ) : (
                                    transfers.data.map((transfer, idx) => {
                                        const rowNum = ((transfers.current_page - 1) * transfers.per_page) + idx + 1;
                                        const notesStr = transfer.notes || "";
                                        const truncatedNotes = notesStr.length > 40 ? `${notesStr.substring(0, 40)}...` : notesStr;
                                        return (
                                            <tr key={transfer.id} className="hover:bg-hover transition-colors">
                                                <td className="p-3 text-text-muted font-mono">{rowNum}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link 
                                                            href={route("contract-transfers.show", transfer.id)} 
                                                            className="font-bold text-primary hover:underline text-xs"
                                                        >
                                                            {transfer.serial_number}
                                                        </Link>
                                                        {transfer.farm_source && (
                                                            <span className="text-[10px] text-emerald-600 font-semibold">{transfer.farm_source}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2 flex-wrap text-xs">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-rose-700">
                                                                {transfer.source_contract?.contract_number}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted">
                                                                {transfer.source_customer?.name || transfer.source_contract?.customer?.name}
                                                            </span>
                                                        </div>
                                                        <ArrowRight className={`h-4 w-4 text-slate-400 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-emerald-700">
                                                                {transfer.destination_contract?.contract_number}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted">
                                                                {transfer.destination_customer?.name || transfer.destination_contract?.customer?.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-text-muted font-mono">
                                                    {transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}
                                                </td>
                                                <td className="p-3 text-text text-xs">
                                                    <div className="flex flex-col gap-0.5">
                                                        {transfer.driver ? (
                                                            <span className="font-semibold">{transfer.driver.name}</span>
                                                        ) : (
                                                            <span className="text-text-muted">—</span>
                                                        )}
                                                        {truncatedNotes && (
                                                            <span className="text-[11px] text-text-muted truncate max-w-[200px]" title={notesStr}>
                                                                {truncatedNotes}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center font-bold text-text">
                                                    {transfer.total_quantity ? parseFloat(transfer.total_quantity).toLocaleString() : 0}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none inline-block ${
                                                        transfer.status === 'approved' 
                                                            ? 'bg-success/10 text-success border border-success/30' 
                                                            : 'bg-warning/10 text-warning border border-warning/30'
                                                    }`}>
                                                        {transfer.status === 'approved' ? t("transfers.status_approved", "معتمد") : t("transfers.status_draft", "مسودة")}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <Tooltip text={t("transfers.quick_view", "معاينة سريعة للسند")}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setQuickViewTransfer(transfer);
                                                                    setIsQuickViewModalOpen(true);
                                                                }}
                                                                className={`p-1.5 text-slate-700 hover:bg-slate-100 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Eye className="h-4 w-4 text-slate-600" />
                                                                {showButtonText && <span>{t("common.preview", "معاينة")}</span>}
                                                            </button>
                                                        </Tooltip>

                                                        <Tooltip text={t("transfers.full_view", "فتح الشاشة الكاملة للسند")}>
                                                            <Link
                                                                href={route("contract-transfers.show", transfer.id)}
                                                                className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Monitor className="h-4 w-4" />
                                                                {showButtonText && <span>{t("common.show", "عرض")}</span>}
                                                            </Link>
                                                        </Tooltip>

                                                        {transfer.status === "draft" && (
                                                            <Tooltip text={t("common.edit", "تعديل")}>
                                                                <Link
                                                                    href={route("contract-transfers.edit", transfer.id)}
                                                                    className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    {showButtonText && <span>{t("common.edit", "تعديل")}</span>}
                                                                </Link>
                                                            </Tooltip>
                                                        )}

                                                        <Tooltip text={t("common.print", "طباعة")}>
                                                            <a
                                                                href={route("contract-transfers.print", transfer.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`p-1.5 text-text hover:bg-hover rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                                {showButtonText && <span>{t("common.print", "طباعة")}</span>}
                                                            </a>
                                                        </Tooltip>

                                                        {transfer.status === "draft" ? (
                                                            <Tooltip text={t("common.approve", "اعتماد")}>
                                                                <button
                                                                    onClick={() => {
                                                                        setErrorMsg("");
                                                                        setTransferToApprove(transfer);
                                                                        setApproveModalOpen(true);
                                                                    }}
                                                                    className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    {showButtonText && <span className="text-[11px]">{t("common.approve", "اعتماد")}</span>}
                                                                </button>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip text={t("common.reopen", "إعادة فتح")}>
                                                                <button
                                                                    onClick={() => {
                                                                        setErrorMsg("");
                                                                        setSecurePassword("");
                                                                        setReopenReason("");
                                                                        setTransferToReopen(transfer);
                                                                        setReopenModalOpen(true);
                                                                    }}
                                                                    className={`bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                >
                                                                    <Unlock className="h-4 w-4" />
                                                                    {showButtonText && <span className="text-[11px]">{t("common.reopen", "إعادة فتح")}</span>}
                                                                </button>
                                                            </Tooltip>
                                                        )}

                                                        {transfer.status === "draft" && (
                                                            <Tooltip text={t("common.delete", "حذف")}>
                                                                <button
                                                                    onClick={() => requestDelete(route("contract-transfers.destroy", transfer.id), transfer)}
                                                                    className={`p-1.5 text-danger hover:bg-danger/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                    {showButtonText && <span>{t("common.delete", "حذف")}</span>}
                                                                </button>
                                                            </Tooltip>
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

                    {/* Pagination */}
                    {transfers.links && transfers.links.length > 3 && (
                        <div className="bg-surface border-t border-border p-3 flex items-center justify-between">
                            <div className="text-xs text-text-muted">
                                {t("common.showing_page", "عرض الصفحة")}{" "}
                                <span className="font-bold">{transfers.current_page}</span>{" "}
                                {t("common.of", "من")}{" "}
                                <span className="font-bold">{transfers.last_page}</span>
                            </div>
                            <div className="flex gap-1">
                                {transfers.links.map((link, key) => (
                                    <Link
                                        key={key}
                                        href={link.url || "#"}
                                        className={`px-3 py-1 text-xs border rounded-none ${
                                            link.active
                                                ? "bg-primary text-white border-primary"
                                                : "bg-surface text-text hover:bg-hover border-border"
                                        } ${!link.url ? "opacity-50 pointer-events-none" : ""}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick View Modal */}
            <Modal show={isQuickViewModalOpen} onClose={() => setIsQuickViewModalOpen(false)} maxWidth="4xl">
                {quickViewTransfer && (
                    <div className="p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                        <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
                            <div className="flex items-center gap-2">
                                <ArrowLeftRight className="h-5 w-5 text-primary" />
                                <h3 className="text-base font-bold text-text">
                                    {t("transfers.quick_view_title", "معاينة سند تحويل رقم")}: {quickViewTransfer.serial_number}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsQuickViewModalOpen(false)}
                                className="text-text-muted hover:text-text p-1 rounded-none"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-background p-3 rounded-none border border-border mb-4 text-xs">
                            <div>
                                <span className="text-text-muted block">{t("transfers.source_contract", "عقد المصدر")}:</span>
                                <span className="font-bold text-rose-700">{quickViewTransfer.source_contract?.contract_number}</span>
                                <span className="block text-[10px] text-text-muted">{quickViewTransfer.source_customer?.name || quickViewTransfer.source_contract?.customer?.name}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("transfers.destination_contract", "عقد الوجهة")}:</span>
                                <span className="font-bold text-emerald-700">{quickViewTransfer.destination_contract?.contract_number}</span>
                                <span className="block text-[10px] text-text-muted">{quickViewTransfer.destination_customer?.name || quickViewTransfer.destination_contract?.customer?.name}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("transfers.transfer_date", "تاريخ التحويل")}:</span>
                                <span className="font-mono">{quickViewTransfer.transfer_date ? new Date(quickViewTransfer.transfer_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US") : "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("transfers.status", "الحالة")}:</span>
                                <span className={`font-bold ${quickViewTransfer.status === 'approved' ? 'text-success' : 'text-warning'}`}>
                                    {quickViewTransfer.status === 'approved' ? t("transfers.status_approved", "معتمد") : t("transfers.status_draft", "مسودة")}
                                </span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-border rounded-none overflow-hidden mb-4">
                            <table className="w-full text-xs text-start">
                                <thead>
                                    <tr className="bg-surface-muted border-b border-border font-bold text-text-muted">
                                        <th className="p-2 text-start">#</th>
                                        <th className="p-2 text-start">{t("transfers.item_name", "الصنف")}</th>
                                        <th className="p-2 text-start">{t("transfers.variant", "الدرجة / النوع")}</th>
                                        <th className="p-2 text-start">{t("transfers.pallet", "رقم الطبلية")}</th>
                                        <th className="p-2 text-center">{t("transfers.quantity", "الكمية المنقولة")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {(quickViewTransfer.items || []).map((item, i) => (
                                        <tr key={item.id || i} className="hover:bg-hover">
                                            <td className="p-2 font-mono text-text-muted">{i + 1}</td>
                                            <td className="p-2 font-bold text-text">{item.inventory_item?.name || "—"}</td>
                                            <td className="p-2 text-text-muted">{item.variant?.name || "—"}</td>
                                            <td className="p-2 font-mono">{item.pallet?.pallet_number || item.pallet?.pallet_code || "—"}</td>
                                            <td className="p-2 text-center font-bold text-primary">
                                                {parseFloat(item.quantity || 0).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                            <Link
                                href={route("contract-transfers.show", quickViewTransfer.id)}
                                className="bg-primary text-white text-xs px-3 py-1.5 rounded-none font-bold hover:bg-primary-hover flex items-center gap-1.5"
                            >
                                <Monitor className="h-4 w-4" />
                                <span>{t("common.show_details", "عرض والتفاصيل الكاملة")}</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsQuickViewModalOpen(false)}
                                className="bg-surface text-text border border-border text-xs px-3 py-1.5 rounded-none hover:bg-hover"
                            >
                                {t("common.close", "إغلاق")}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Approval Modal */}
            <Modal show={isApproveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="md">
                <div className="p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <h3 className="text-base font-bold text-text mb-2">
                        {t("transfers.confirm_approve", "تأكيد اعتماد سند التحويل")}
                    </h3>
                    <p className="text-xs text-text-muted mb-4">
                        {t("transfers.approve_warning", "هل أنت تأكد من اعتماد وتثبيت هذا السند؟ سيتم تسجيل حركة خروج من عقد المصدر وحركة إدخال إلى عقد الوجهة في سجلات الحركة.")}
                    </p>
                    {errorMsg && <div className="text-xs text-danger mb-3 bg-danger/10 p-2 border border-danger/30">{errorMsg}</div>}
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleApprove}
                            disabled={processingAction}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 font-bold rounded-none flex items-center gap-1"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t("common.confirm_approve", "تأكيد الاعتماد")}</span>
                        </button>
                        <button
                            onClick={() => setApproveModalOpen(false)}
                            className="bg-surface text-text border border-border text-xs px-3 py-1.5 rounded-none"
                        >
                            {t("common.cancel", "إلغاء")}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Reopen Modal */}
            <Modal show={isReopenModalOpen} onClose={() => setReopenModalOpen(false)} maxWidth="md">
                <form onSubmit={handleReopen} className="p-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <h3 className="text-base font-bold text-text mb-2">
                        {t("transfers.confirm_reopen", "إلغاء اعتماد السند وتفريغه")}
                    </h3>
                    <p className="text-xs text-text-muted mb-3">
                        {t("transfers.reopen_warning", "إلغاء الاعتماد سيؤدي إلى حذف حركات المخزون المسجلة على العقدين وإعادة السند لحالة مسودة.")}
                    </p>
                    <div className="space-y-3 mb-4">
                        <div>
                            <InputLabel value={t("common.secure_password", "كلمة المرور الأمنية")} />
                            <TextInput
                                type="password"
                                className="w-full text-xs rounded-none border-border mt-1"
                                value={securePassword}
                                onChange={(e) => setSecurePassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={t("common.reopen_reason", "سبب إلغاء الاعتماد")} />
                            <TextInput
                                type="text"
                                className="w-full text-xs rounded-none border-border mt-1"
                                value={reopenReason}
                                onChange={(e) => setReopenReason(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {errorMsg && <div className="text-xs text-danger mb-3 bg-danger/10 p-2 border border-danger/30">{errorMsg}</div>}
                    <div className="flex justify-end gap-2">
                        <button
                            type="submit"
                            disabled={processingAction}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 font-bold rounded-none flex items-center gap-1"
                        >
                            <Unlock className="h-4 w-4" />
                            <span>{t("common.confirm_reopen", "تأكيد إلغاء الاعتماد")}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setReopenModalOpen(false)}
                            className="bg-surface text-text border border-border text-xs px-3 py-1.5 rounded-none"
                        >
                            {t("common.cancel", "إلغاء")}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Secure Delete Confirmation Modal */}
            <ConfirmationModal
                show={!!transferToDelete}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={t("transfers.delete_title", "تأكيد حذف سند التحويل")}
                content={
                    <div>
                        <p className="text-xs text-text-muted mb-2">
                            {t("transfers.delete_confirm_text", "هل أنت تأكد من إرادة حذف سند تحويل الطبالي؟")}
                        </p>
                        <TextInput
                            type="password"
                            placeholder={t("common.enter_secure_password", "ادخل كلمة السر لإنفاذ الحذف...")}
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="w-full text-xs rounded-none border-border"
                        />
                        {deleteError && <p className="text-xs text-danger mt-1">{deleteError}</p>}
                    </div>
                }
                confirmText={t("common.delete", "حذف")}
                cancelText={t("common.cancel", "إلغاء")}
                isLoading={processingDelete}
            />
        </AuthenticatedLayout>
    );
}
