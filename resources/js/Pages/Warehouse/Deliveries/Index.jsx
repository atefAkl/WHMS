import React, { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Activity, CheckCircle2, ChevronRight, Edit, Eye, FileText, Filter, Home, Lock, Monitor, Plus, Printer, RefreshCw, Search, ShieldAlert, Trash2, Unlock, X } from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import SearchableSelect from "@/Components/SearchableSelect";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";

export default function Index({ deliveries = { data: [] }, customers = [], contracts = [], drivers = [], filters = {} }) {
    const { lang, __ } = useLang();

    // Translation Helper
    const t = (key, fallbackAr = "", fallbackEn = "") => {
        if (key && __) {
            const translated = __(key);
            if (translated && translated !== key) {
                return translated;
            }
        }
        return lang === "en" ? (fallbackEn || fallbackAr || key) : (fallbackAr || fallbackEn || key);
    };

    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;

    // Translation Helper for bilingual strings
    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    // Combined Customer & Contract Options for SearchableSelect
    const customerAndContractOptions = useMemo(() => {
        const options = [];
        (customers || []).forEach((c) => {
            options.push({
                id: `cust_${c.id}`,
                value: c.name,
                label: `${c.name} (${t("deliveries.customer", "العميل", "Customer")})`,
                type: "customer",
                searchKeys: [c.name, c.foreign_name || "", c.code || ""].filter(Boolean),
            });
        });
        (contracts || []).forEach((cnt) => {
            const custName = cnt.customer?.name || "";
            options.push({
                id: `cnt_${cnt.id}`,
                value: cnt.contract_number,
                label: `${cnt.contract_number} ${custName ? `- ${custName}` : ""} (${t("deliveries.contract", "العقد", "Contract")})`,
                type: "contract",
                searchKeys: [cnt.contract_number, custName].filter(Boolean),
            });
        });
        return options;
    }, [customers, contracts, lang]);

    // Explicit Filter States
    const [serialNumber, setSerialNumber] = useState(filters.serial_number || "");
    const [writtenReference, setWrittenReference] = useState(filters.written_reference || "");
    const [customerOrContract, setCustomerOrContract] = useState(filters.customer_or_contract || "");
    const [notes, setNotes] = useState(filters.notes || "");
    const [selectedDriver, setSelectedDriver] = useState(filters.driver_id || "");
    const [selectedStatus, setSelectedStatus] = useState(filters.status || "");
    const [dateFrom, setDateFrom] = useState(filters.date_from || "");
    const [dateTo, setDateTo] = useState(filters.date_to || "");
    const [qtyOperator, setQtyOperator] = useState(filters.qty_operator || "gte");
    const [qtyValue, setQtyValue] = useState(filters.qty_value || "");

    // Quick View Modal State
    const [quickViewDelivery, setQuickViewDelivery] = useState(null);
    const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);

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

    const submitSearch = () => {
        router.get(
            route("deliveries.index"),
            {
                serial_number: serialNumber,
                written_reference: writtenReference,
                customer_or_contract: customerOrContract,
                notes: notes,
                driver_id: selectedDriver,
                status: selectedStatus,
                date_from: dateFrom,
                date_to: dateTo,
                qty_operator: qtyOperator,
                qty_value: qtyValue,
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
        setWrittenReference("");
        setCustomerOrContract("");
        setNotes("");
        setSelectedDriver("");
        setSelectedStatus("");
        setDateFrom("");
        setDateTo("");
        setQtyOperator("gte");
        setQtyValue("");
        router.get(route("deliveries.index"));
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
    }, [serialNumber, writtenReference, customerOrContract, notes, selectedDriver, selectedStatus, dateFrom, dateTo, qtyOperator, qtyValue]);

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
                    setActionError(t("deliveries.an_error_occurred", "حدث خطأ غير متوقع", "An unexpected error occurred"));
                }
            },
        });
    };

    const getPalletSizeDisplay = (pallet) => {
        if (!pallet || !pallet.size) return "";
        const sizeMap = {
            كبيرة: t("pallets.large", "كبيرة", "Large"),
            وسط: t("pallets.medium", "وسط", "Medium"),
            صغيرة: t("pallets.small", "صغيرة", "Small"),
            خشب: t("pallets.wood", "خشب", "Wood"),
            بلاستيك: t("pallets.plastic", "بلاستيك", "Plastic"),
        };
        return sizeMap[pallet.size] || pallet.size;
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {t("warehouse.management", "إدارة المخازن", "Warehouse Management")}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {t("deliveries.title", "سندات تسليم البضائع", "Goods Delivery Notes")}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t("deliveries.title", "سندات تسليم البضائع", "Goods Delivery Notes")} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={FileText}
                    title={t("deliveries.title_header", "سندات تسليم البضائع", "Goods Delivery Notes")}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {t("deliveries.description", "إدارة وتتبع تسليم بضائع العملاء وإصدار إذن الخروج من المخزن.", "Manage and track customer goods deliveries and issue warehouse exit permits.")}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {deliveries?.data?.length > 0 && (
                                <Tooltip text={t("deliveries.bulk_print", "طباعة مجمعة للسندات", "Bulk Print Delivery Notes")}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const ids = deliveries.data.map((d) => d.id).join(",");
                                            router.get(route("deliveries.bulk-print"), { ids });
                                        }}
                                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-none flex items-center justify-center transition-all h-[30px] px-3 gap-1.5 text-xs font-bold"
                                    >
                                        <Printer className="h-4 w-4 shrink-0" />
                                        <span>{t("common.bulk_print", "طباعة مجمعة", "Bulk Print")}</span>
                                    </button>
                                </Tooltip>
                            )}
                            <Tooltip text={t("deliveries.new_button", "إنشاء سند تسليم جديد", "Create New Delivery Note")}>
                                <Link
                                    href={route("deliveries.create")}
                                    className={`bg-primary text-white hover:bg-primary-hover rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    {showButtonText && <span>{t("common.new", "جديد", "New")}</span>}
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Refactored Search & Filters Section (Matching Receptions Layout) */}
                <div className="bg-surface border border-border p-3 shadow-sm rounded-none">
                    <form onSubmit={handleSearch} className="space-y-3">
                        {/* Row 1: Explicit Search Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <InputLabel value={t("deliveries.filter_serial", "رقم المسلسل للسند", "Voucher Serial No.")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("deliveries.placeholder_serial", "ابحث برقم المسلسل...", "Search by serial no...")}
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("deliveries.filter_customer_or_contract", "اسم العميل أو رقم العقد", "Customer Name or Contract No.")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={customerAndContractOptions}
                                        value={customerOrContract}
                                        valueKey="id"
                                        displayFormat={(item) => item.label || item.value}
                                        searchKeys={["label", "value"]}
                                        placeholder={t("deliveries.placeholder_customer_contract", "ادخل العميل أو العقد...", "Enter customer or contract...")}
                                        className="w-full text-xs rounded-none border-border h-[30px]"
                                        onChange={(selected) => setCustomerOrContract(selected ? selected.value : "")}
                                        onInputChange={(val) => setCustomerOrContract(val)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("deliveries.filter_reference", "إذن الخروج / المرجع", "Permit / Written Reference")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("deliveries.placeholder_reference", "رقم إذن الخروج أو المرجع...", "Permit no. or reference...")}
                                        value={writtenReference}
                                        onChange={(e) => setWrittenReference(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("deliveries.filter_notes", "البحث في الملاحظات", "Search Notes")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("deliveries.placeholder_notes", "كلمات من الملاحظات...", "Keywords from notes...")}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Selects, Sized Dates (10rem), Sized Qty Operator (3.5rem), and Filter Actions */}
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Driver SearchableSelect */}
                            <div className="flex-1 min-w-[150px]">
                                <InputLabel value={t("deliveries.driver", "السائق", "Driver")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={drivers}
                                        value={selectedDriver}
                                        valueKey="id"
                                        displayFormat={(d) => `${d.name} ${d.vehicle_plate ? `(${d.vehicle_plate})` : ""}`}
                                        searchKeys={["name", "vehicle_plate"]}
                                        placeholder={t("deliveries.all_drivers", "كل السائقين", "All Drivers")}
                                        className="w-full text-xs rounded-none border-border h-[30px]"
                                        onChange={(d) => setSelectedDriver(d ? d.id : "")}
                                        onInputChange={(val) => {
                                            if (!val) setSelectedDriver("");
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            {/* Status Select */}
                            <div className="flex-1 min-w-[130px]">
                                <InputLabel value={t("deliveries.status", "الحالة", "Status")} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">{t("deliveries.all_statuses", "كل الحالات", "All Statuses")}</option>
                                    <option value="draft">{t("deliveries.status_draft", "مسودة", "Draft")}</option>
                                    <option value="approved">{t("deliveries.status_approved", "معتمد", "Approved")}</option>
                                </select>
                            </div>

                            {/* Date From (Max 10rem width) */}
                            <div className="w-[10rem] max-w-[10rem]">
                                <InputLabel value={t("deliveries.date_from", "التاريخ من", "Date From")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2 font-mono"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            {/* Date To (Max 10rem width) */}
                            <div className="w-[10rem] max-w-[10rem]">
                                <InputLabel value={t("deliveries.date_to", "التاريخ إلى", "Date To")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2 font-mono"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            {/* Qty Filter: Sized Operator Dropdown (Max 3.5rem width) + Qty Input */}
                            <div className="flex flex-col">
                                <InputLabel value={t("deliveries.qty_filter", "الكمية المسلمة", "Outgoing Qty")} />
                                <div className="flex gap-1 mt-1 items-center">
                                    <select
                                        className="w-[3.5rem] max-w-[3.5rem] border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-1 font-bold text-center shrink-0"
                                        value={qtyOperator}
                                        onChange={(e) => setQtyOperator(e.target.value)}
                                    >
                                        <option value="gte">≥</option>
                                        <option value="gt">&gt;</option>
                                        <option value="lte">≤</option>
                                        <option value="lt">&lt;</option>
                                        <option value="eq">=</option>
                                    </select>
                                    <TextInput
                                        className="w-[7rem] text-xs rounded-none border-border h-[30px] px-2 font-mono"
                                        placeholder={t("deliveries.qty_placeholder", "الكمية...", "Quantity...")}
                                        type="number"
                                        value={qtyValue}
                                        onChange={(e) => setQtyValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 h-[30px] shrink-0">
                                <Tooltip text={t("common.filter", "تصفية", "Filter")}>
                                    <button 
                                        type="submit" 
                                        className={`h-[30px] flex items-center justify-center rounded-none bg-primary text-white hover:bg-primary-hover shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90 gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                    >
                                        <Filter className="h-4 w-4 shrink-0" />
                                        {showButtonText && <span>{t("common.filter", "تصفية", "Filter")}</span>}
                                    </button>
                                </Tooltip>
                                <Tooltip text={t("common.reset", "إعادة تعيين", "Reset")}>
                                    <button 
                                        type="button" 
                                        onClick={handleReset} 
                                        className={`h-[30px] flex items-center justify-center rounded-none bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 shadow-sm transition duration-150 ease-in-out font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:opacity-90 gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                    >
                                        <RefreshCw className="h-4 w-4 shrink-0" />
                                        {showButtonText && <span>{t("common.reset", "إعادة تعيين", "Reset")}</span>}
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
                                    <th className="p-3 text-start">{t("deliveries.col_document", "المستند والمعرفات", "Document & Identifiers")}</th>
                                    <th className="p-3 text-start">{t("deliveries.col_reference", "إذن الخروج والملاحظات", "Permit & Notes")}</th>
                                    <th className="p-3 text-start">{t("deliveries.col_date", "تاريخ التسليم", "Delivery Date")}</th>
                                    <th className="p-3 text-center">{t("deliveries.col_total_qty", "إجمالي المخرج", "Total Out")}</th>
                                    <th className="p-3 text-center">{t("deliveries.col_status", "الحالة", "Status")}</th>
                                    <th className="p-3 text-center">{t("deliveries.col_actions", "الخيارات", "Actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {deliveries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-text-muted">
                                            {t("deliveries.no_records", "لم يتم العثور على أي سندات تسليم.", "No delivery notes found.")}
                                        </td>
                                    </tr>
                                ) : (
                                    deliveries.data.map((item, idx) => {
                                        const rowNum = ((deliveries.current_page - 1) * deliveries.per_page) + idx + 1;
                                        const notesStr = item.notes || "";
                                        const truncatedNotes = notesStr.length > 50 ? `${notesStr.substring(0, 50)}...` : notesStr;
                                        return (
                                            <tr key={item.id} className="hover:bg-hover transition-colors">
                                                <td className="p-3 text-text-muted font-mono">{rowNum}</td>
                                                <td className="p-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link
                                                            href={route("deliveries.show", item.id)}
                                                            className="font-bold text-primary hover:underline text-xs text-start"
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
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-xs">
                                                            {item.exit_authorization
                                                                ? `${t("deliveries.permit", "إذن خروج", "Permit")}: ${item.exit_authorization.serial_number}`
                                                                : item.written_reference || "—"}
                                                        </span>
                                                        {truncatedNotes && (
                                                            <span className="text-[11px] text-text-muted font-normal max-w-[200px] truncate" title={notesStr}>
                                                                {truncatedNotes}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-text-muted font-mono">
                                                    {item.delivery_date ? String(item.delivery_date).substring(0, 10) : "-"}
                                                </td>
                                                <td className="p-3 text-center font-bold text-text">
                                                    {item.total_quantity ? Math.round(parseFloat(item.total_quantity)).toLocaleString() : 0}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-none ${item.status === 'approved'
                                                            ? 'bg-success/10 text-success border border-success/30'
                                                            : 'bg-warning/10 text-warning border border-warning/30'
                                                        }`}>
                                                        {item.status === 'approved' ? (t("deliveries.status_approved", "معتمد", "Approved")) : (t("deliveries.status_draft", "مسودة", "Draft"))}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        {/* Quick View Icon (Eye) */}
                                                        <Tooltip text={t("deliveries.quick_view", "معاينة سريعة للسند", "Quick View")}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setQuickViewDelivery(item);
                                                                    setIsQuickViewModalOpen(true);
                                                                }}
                                                                className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                {showButtonText && <span>{t("common.preview", "معاينة", "Preview")}</span>}
                                                            </button>
                                                        </Tooltip>

                                                        {/* Full Screen Show Page Icon (Monitor) */}
                                                        <Tooltip text={t("deliveries.full_view", "فتح الشاشة الكاملة للسند", "Open full voucher view")}>
                                                            <Link
                                                                href={route("deliveries.show", item.id)}
                                                                className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Monitor className="h-4 w-4" />
                                                                {showButtonText && <span>{t("common.show", "عرض", "Show")}</span>}
                                                            </Link>
                                                        </Tooltip>

                                                        {item.status === 'draft' ? (
                                                            <>
                                                                <Tooltip text={t("deliveries.edit", "تعديل السند", "Edit Note")}>
                                                                    <Link
                                                                        href={route("deliveries.edit", item.id)}
                                                                        className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                        {showButtonText && <span>{t("common.edit", "تعديل", "Edit")}</span>}
                                                                    </Link>
                                                                </Tooltip>
                                                                <Tooltip text={t("deliveries.approve", "اعتماد السند", "Approve Note")}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActionTarget({ type: 'approve', item })}
                                                                        className={`bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                    >
                                                                        <CheckCircle2 className="h-4 w-4" />
                                                                        {showButtonText && <span className="text-[11px]">{t("common.approve", "اعتماد", "Approve")}</span>}
                                                                    </button>
                                                                </Tooltip>
                                                                <Tooltip text={t("deliveries.delete", "حذف السند", "Delete Note")}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => requestDelete(route("deliveries.destroy", item.id), item)}
                                                                        className={`p-1.5 text-danger hover:bg-danger/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                        {showButtonText && <span>{t("common.delete", "حذف", "Delete")}</span>}
                                                                    </button>
                                                                </Tooltip>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Tooltip text={t("deliveries.reopen", "إعادة فتح السند", "Reopen Note")}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActionTarget({ type: 'reopen', item })}
                                                                        className={`bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                    >
                                                                        <Unlock className="h-4 w-4" />
                                                                        {showButtonText && <span className="text-[11px]">{t("common.reopen", "إعادة فتح", "Reopen")}</span>}
                                                                    </button>
                                                                </Tooltip>
                                                                <Tooltip text={t("deliveries.print", "طباعة السند", "Print Note")}>
                                                                    <a
                                                                        href={route("deliveries.print", item.id)}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                    >
                                                                        <Printer className="h-4 w-4" />
                                                                        {showButtonText && <span className="text-[11px]">{t("common.print", "طباعة", "Print")}</span>}
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
                                    className={`px-3 py-1.5 border text-xs transition-all ${link.active
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

            {/* Quick View Modal */}
            <Modal show={isQuickViewModalOpen} onClose={() => setIsQuickViewModalOpen(false)} maxWidth="4xl">
                {quickViewDelivery && (
                    <div className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-base text-text">
                                    {t("deliveries.quick_modal_title", "معاينة سند التسليم", "Delivery Note Preview")}:{" "}
                                    <span className="font-mono text-primary">{quickViewDelivery.serial_number}</span>
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsQuickViewModalOpen(false)}
                                className="text-text-muted hover:text-text p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Summary Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-muted/30 border border-border p-3 text-xs">
                            <div>
                                <span className="text-text-muted block">{t("deliveries.customer", "العميل", "Customer")}:</span>
                                <span className="font-bold text-text">{quickViewDelivery.customer?.name || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("deliveries.contract", "العقد", "Contract")}:</span>
                                <span className="font-mono font-bold text-primary">{quickViewDelivery.contract?.contract_number || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("deliveries.filter_reference", "إذن الخروج / المرجع", "Permit / Reference")}:</span>
                                <span className="font-semibold text-emerald-700">
                                    {quickViewDelivery.exit_authorization
                                        ? `${t("deliveries.permit", "إذن خروج", "Permit")}: ${quickViewDelivery.exit_authorization.serial_number}`
                                        : quickViewDelivery.written_reference || "—"}
                                </span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("deliveries.delivery_date", "تاريخ التسليم", "Delivery Date")}:</span>
                                <span className="font-mono font-semibold">{quickViewDelivery.delivery_date ? String(quickViewDelivery.delivery_date).substring(0, 10) : "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("deliveries.driver", "السائق", "Driver")}:</span>
                                <span className="font-semibold">{quickViewDelivery.driver?.name || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("deliveries.status", "الحالة", "Status")}:</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-none inline-block ${
                                    quickViewDelivery.status === 'approved' 
                                        ? 'bg-success/10 text-success border border-success/30' 
                                        : 'bg-warning/10 text-warning border border-warning/30'
                                }`}>
                                    {quickViewDelivery.status === 'approved' ? t("deliveries.status_approved", "معتمد", "Approved") : t("deliveries.status_draft", "مسودة", "Draft")}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-text-muted block">{t("deliveries.notes", "الملاحظات", "Notes")}:</span>
                                <span className="font-normal text-text">{quickViewDelivery.notes || "—"}</span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                <Activity className="h-4 w-4" />
                                <span>{t("deliveries.quick_modal_items", "جدول أصناف وبضائع السند", "Items & Goods Table")}</span>
                            </div>
                            <div className="border border-border max-h-[260px] overflow-y-auto">
                                <table className="w-full text-xs text-start border-collapse">
                                    <thead className="bg-surface-muted text-text-muted font-bold sticky top-0">
                                        <tr className="border-b border-border">
                                            <th className="p-2 text-start w-10">#</th>
                                            <th className="p-2 text-start">{t("deliveries.col_item", "الصنف المخزني", "Inventory Item")}</th>
                                            <th className="p-2 text-start">{t("deliveries.col_variant", "البديل/الشكل", "Variant")}</th>
                                            <th className="p-2 text-start">{t("deliveries.quality", "الدرجة", "Grade")}</th>
                                            <th className="p-2 text-start">{t("deliveries.col_pallet", "رقم الطبلية", "Pallet No.")}</th>
                                            <th className="p-2 text-end">{t("deliveries.col_qty", "الكمية المخرجة", "Outgoing Qty")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {quickViewDelivery.inventory_entries && quickViewDelivery.inventory_entries.length > 0 ? (
                                            quickViewDelivery.inventory_entries.map((entry, i) => (
                                                <tr key={entry.id || i} className="hover:bg-hover">
                                                    <td className="p-2 font-mono text-text-muted">{i + 1}</td>
                                                    <td className="p-2 font-bold text-text">
                                                        {displayBilingual(entry.inventory_item?.name || entry.inventory_item_id)}
                                                    </td>
                                                    <td className="p-2 text-text-muted">
                                                        {displayBilingual(entry.variant?.name || entry.inventory_item_variant_id)}
                                                    </td>
                                                    <td className="p-2 text-text-muted">
                                                        {displayBilingual(entry.variant?.quality) || entry.variant?.size || entry.pallet?.size || "—"}
                                                    </td>
                                                    <td className="p-2 font-mono font-bold text-primary">
                                                        {entry.pallet?.pallet_number ? `${entry.pallet.pallet_number} / ${getPalletSizeDisplay(entry.pallet)}` : "—"}
                                                    </td>
                                                    <td className="p-2 font-mono font-extrabold text-end text-emerald-600">
                                                        {Math.round(parseFloat(entry.quantity_out) || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="p-4 text-center text-text-muted">
                                                    {t("deliveries.no_entries_quick", "لا توجد أسطر حركات مضافة للسند.", "No item rows added to this note.")}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <Link
                                href={route("deliveries.show", quickViewDelivery.id)}
                                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 transition-all"
                            >
                                <Monitor className="h-4 w-4" />
                                <span>{t("deliveries.go_to_full_page", "الانتقال لصفحة السند الكاملة", "Go to Full Voucher Page")}</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsQuickViewModalOpen(false)}
                                className="bg-surface border border-border hover:bg-surface-muted text-text text-xs font-bold px-4 py-1.5 transition-all"
                            >
                                {t("common.close", "إغلاق النافذة", "Close Window")}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Credential Action Modal */}
            <Modal show={!!actionTarget} onClose={() => { setActionTarget(null); setSecurePassword(""); setActionError(""); }}>
                <div className="p-6 font-main" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-3 text-danger mb-4">
                        <ShieldAlert className="h-6 w-6" />
                        <h3 className="text-sm font-bold">
                            {actionTarget?.type === "approve" && t("deliveries.approve_title", "اعتماد وإغلاق سند التسليم", "Approve & Lock Delivery Note")}
                            {actionTarget?.type === "reopen" && t("deliveries.reopen_title", "إعادة فتح السند (إلغاء الاعتماد)", "Reopen Delivery Note")}
                        </h3>
                    </div>

                    <p className="text-xs text-text mb-4">
                        {actionTarget?.type === "approve" && (lang === "ar" ? `هل تريد اعتماد السند ${actionTarget?.item?.serial_number} نهائياً؟ هذا سيخصم الأرصدة من الطبالي ويغلق السند.` : `Are you sure you want to approve delivery note ${actionTarget?.item?.serial_number}? This will lock the document and deduct stocks.`)}
                        {actionTarget?.type === "reopen" && (lang === "ar" ? `هل تريد إلغاء اعتماد السند ${actionTarget?.item?.serial_number}؟ سيتم إرجاع السند لحالة المسودة وإمكانية تعديله.` : `Are you sure you want to revert delivery note ${actionTarget?.item?.serial_number} to draft?`)}
                    </p>

                    <form onSubmit={handleConfirmAction} className="space-y-4">
                        {actionTarget?.type !== "approve" && (
                            <div>
                                <InputLabel value={t("deliveries.security_password", "كلمة مرور العمليات الآمنة *", "Security Password *")} />
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
                            <Tooltip text={t("common.cancel", "إلغاء", "Cancel")}>
                                <button
                                    type="button"
                                    onClick={() => { setActionTarget(null); setSecurePassword(""); setActionError(""); }}
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                >
                                    <X className="h-4 w-4" />
                                    {showButtonText && <span>{t("common.cancel", "إلغاء", "Cancel")}</span>}
                                </button>
                            </Tooltip>

                            <Tooltip text={
                                actionTarget?.type === "approve"
                                    ? t("deliveries.confirm_approve", "تأكيد الاعتماد", "Confirm Approval")
                                    : t("deliveries.confirm_reopen", "تأكيد إعادة الفتح", "Confirm Reopen")
                            }>
                                <button
                                    type="submit"
                                    disabled={processingAction}
                                    className={`rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${actionTarget?.type === "approve"
                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                            : "bg-amber-600 hover:bg-amber-700 text-white"
                                        } ${showButtonText ? 'px-3' : 'w-[30px] p-0'} disabled:opacity-50`}
                                >
                                    {actionTarget?.type === "approve" && <CheckCircle2 className="h-4 w-4" />}
                                    {actionTarget?.type === "reopen" && <Unlock className="h-4 w-4" />}

                                    {showButtonText && (
                                        <span>
                                            {processingAction
                                                ? t("common.processing", "جاري المعالجة...", "Processing...")
                                                : actionTarget?.type === "approve"
                                                    ? t("deliveries.confirm_approve", "تأكيد الاعتماد", "Confirm Approval")
                                                    : t("deliveries.confirm_reopen", "تأكيد إعادة الفتح", "Confirm Reopen")}
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
                title={t("deliveries.confirm_delete_title", "تأكيد حذف سند التسليم", "Confirm Delivery Note Deletion")}
                message={lang === "ar"
                    ? `هل أنت متأكد من رغبتك في حذف السند ${itemToDelete?.serial_number}؟ هذا الإجراء يتطلب كلمة مرور العمليات.`
                    : `Are you sure you want to delete delivery note ${itemToDelete?.serial_number}? This requires secure operations password.`}
                confirmLabel={t("common.confirm_delete", "تأكيد الحذف", "Confirm Deletion")}
                cancelLabel={t("common.cancel", "إلغاء", "Cancel")}
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
