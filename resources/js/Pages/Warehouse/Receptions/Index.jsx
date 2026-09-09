import React, { useState, useEffect, useMemo } from "react";
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
    Monitor,
    Printer,
    FileText,
    Search,
    Filter,
    CheckCircle2,
    RefreshCw,
    Lock,
    Unlock,
    X,
    Activity
} from "lucide-react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import SearchableSelect from "@/Components/SearchableSelect";

export default function Index({ receptions = { data: [] }, customers = [], contracts = [], drivers = [], filters = {} }) {
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
                label: `${c.name} (${t("receptions.customer", "عميل")})`,
                type: "customer",
                searchKeys: [c.name, c.foreign_name || "", c.code || ""].filter(Boolean),
            });
        });
        (contracts || []).forEach((cnt) => {
            const custName = cnt.customer?.name || "";
            options.push({
                id: `cnt_${cnt.id}`,
                value: cnt.contract_number,
                label: `${cnt.contract_number} ${custName ? `- ${custName}` : ""} (${t("receptions.contract", "عقد")})`,
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
    const [qtyOperator, setQtyOperator] = useState(filters.qty_operator || "gte");
    const [qtyValue, setQtyValue] = useState(filters.qty_value || "");

    // Quick View Modal State
    const [quickViewReception, setQuickViewReception] = useState(null);
    const [isQuickViewModalOpen, setIsQuickViewModalOpen] = useState(false);

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

    const submitSearch = () => {
        router.get(
            route("receptions.index"),
            {
                serial_number: serialNumber,
                farm_source: farmSource,
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
        setFarmSource("");
        setCustomerOrContract("");
        setNotes("");
        setSelectedDriver("");
        setSelectedStatus("");
        setDateFrom("");
        setDateTo("");
        setQtyOperator("gte");
        setQtyValue("");
        router.get(route("receptions.index"));
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
    }, [serialNumber, farmSource, customerOrContract, notes, selectedDriver, selectedStatus, dateFrom, dateTo, qtyOperator, qtyValue]);

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
                    setErrorMsg(errs.error || t("receptions.failed_to_approve", "تعذر اعتماد السند."));
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
                        setErrorMsg(t("receptions.failed_to_reopen", "تعذر إلغاء الاعتماد."));
                    }
                }
            }
        );
    };

    const getPalletSizeDisplay = (pallet) => {
        if (!pallet || !pallet.size) return "";
        const sizeMap = {
            كبيرة: t("pallets.large", "كبيرة"),
            وسط: t("pallets.medium", "وسط"),
            صغيرة: t("pallets.small", "صغيرة"),
            خشب: t("pallets.wood", "خشب"),
            بلاستيك: t("pallets.plastic", "بلاستيك"),
        };
        return sizeMap[pallet.size] || pallet.size;
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
                {t("receptions.title", "سندات الاستلام")}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t("receptions.title", "سندات الاستلام")} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={FileText}
                    title={t("receptions.title_header", "سندات وإيصالات الاستلام")}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {t("receptions.description", "تسجيل بضائع وأصناف العملاء المستلمة على طبالي وتثبيتها في حركة المخازن.")}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {receptions?.data?.length > 0 && (
                                <Tooltip text={t("receptions.bulk_print", "طباعة مجمعة للسندات")}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const ids = receptions.data.map((r) => r.id).join(",");
                                            router.get(route("receptions.bulk-print"), { ids });
                                        }}
                                        className="bg-slate-800 hover:bg-slate-700 text-white rounded-none flex items-center justify-center transition-all h-[30px] px-3 gap-1.5 text-xs font-bold"
                                    >
                                        <Printer className="h-4 w-4 shrink-0" />
                                        <span>{t("receptions.bulk_print_btn", "طباعة مجمعة")}</span>
                                    </button>
                                </Tooltip>
                            )}
                            <Tooltip text={t("receptions.new_button", "إنشاء سند استلام جديد")}>
                                <Link
                                    href={route("receptions.create")}
                                    className={`bg-primary text-white hover:bg-primary-hover rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    {showButtonText && <span>{t("common.new", "جديد")}</span>}
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Refactored Search & Filters Section */}
                <div className="bg-surface border border-border p-3 shadow-sm rounded-none">
                    <form onSubmit={handleSearch} className="space-y-3">
                        {/* Row 1: Explicit Search Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                                <InputLabel value={t("receptions.filter_serial", "رقم المسلسل للسند")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("receptions.placeholder_serial", "ابحث برقم المسلسل...")}
                                        value={serialNumber}
                                        onChange={(e) => setSerialNumber(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("receptions.filter_customer_or_contract", "اسم العميل أو رقم العقد")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={customerAndContractOptions}
                                        value={customerOrContract}
                                        valueKey="id"
                                        displayFormat={(item) => item.label || item.value}
                                        searchKeys={["label", "value"]}
                                        placeholder={t("receptions.placeholder_customer_contract", "ادخل العميل أو العقد...")}
                                        className="w-full text-xs rounded-none border-border h-[30px]"
                                        onChange={(selected) => setCustomerOrContract(selected ? selected.value : "")}
                                        onInputChange={(val) => setCustomerOrContract(val)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("receptions.filter_farm_source", "مصدر المزرعة")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("receptions.placeholder_farm_source", "المزرعة أو المصدر...")}
                                        value={farmSource}
                                        onChange={(e) => setFarmSource(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>

                            <div>
                                <InputLabel value={t("receptions.filter_notes", "البحث في الملاحظات")} />
                                <div className="relative mt-1">
                                    <TextInput
                                        className="w-full text-xs rounded-none border-border ps-7 h-[30px]"
                                        placeholder={t("receptions.placeholder_notes", "كلمات من الملاحظات...")}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-text-muted" />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Selects, Sized Dates (10rem), Sized Qty Operator (3rem), and Filter Actions */}
                        <div className="flex flex-wrap items-end gap-3">
                            {/* Driver SearchableSelect */}
                            <div className="flex-1 min-w-[150px]">
                                <InputLabel value={t("receptions.driver", "السائق")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={drivers}
                                        value={selectedDriver}
                                        valueKey="id"
                                        displayFormat={(d) => `${d.name} ${d.vehicle_plate ? `(${d.vehicle_plate})` : ""}`}
                                        searchKeys={["name", "vehicle_plate"]}
                                        placeholder={t("receptions.all_drivers", "كل السائقين")}
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
                                <InputLabel value={t("receptions.status", "حالة السند")} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2.5"
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                >
                                    <option value="">{t("receptions.all_statuses", "كل الحالات")}</option>
                                    <option value="draft">{t("receptions.status_draft", "مسودة")}</option>
                                    <option value="approved">{t("receptions.status_approved", "معتمد ومغلق")}</option>
                                </select>
                            </div>

                            {/* Date From (Max 10rem width) */}
                            <div className="w-[10rem] max-w-[10rem]">
                                <InputLabel value={t("receptions.date_from", "التاريخ من")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2 font-mono"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            {/* Date To (Max 10rem width) */}
                            <div className="w-[10rem] max-w-[10rem]">
                                <InputLabel value={t("receptions.date_to", "التاريخ إلى")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[30px] px-2 font-mono"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            {/* Qty Filter: Sized Operator Dropdown (Max 3.5rem width) + Qty Input */}
                            <div className="flex flex-col">
                                <InputLabel value={t("receptions.qty_filter", "الكمية الواردة")} />
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
                                        placeholder={t("receptions.qty_placeholder", "الكمية...")}
                                        type="number"
                                        value={qtyValue}
                                        onChange={(e) => setQtyValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
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

                {/* Receptions Table */}
                <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-start text-xs border-collapse">
                            <thead>
                                <tr className="bg-background border-b border-border text-text-muted font-bold">
                                    <th className="p-3 text-start w-12">#</th>
                                    <th className="p-3 text-start">{t("receptions.col_document", "المستند والمعرفات")}</th>
                                    <th className="p-3 text-start">{t("receptions.col_notes", "ملاحظات وتفاصيل")}</th>
                                    <th className="p-3 text-start">{t("receptions.col_date", "تاريخ الاستلام")}</th>
                                    <th className="p-3 text-start">{t("receptions.col_driver", "السائق")}</th>
                                    <th className="p-3 text-center">{t("receptions.col_total_qty", "إجمالي الوارد")}</th>
                                    <th className="p-3 text-center">{t("receptions.col_status", "الحالة")}</th>
                                    <th className="p-3 text-center">{t("receptions.col_actions", "الخيارات")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {receptions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="p-8 text-center text-text-muted">
                                            {t("receptions.no_records", "لم يتم العثور على أي سندات استلام.")}
                                        </td>
                                    </tr>
                                ) : (
                                    receptions.data.map((reception, idx) => {
                                        const rowNum = ((receptions.current_page - 1) * receptions.per_page) + idx + 1;
                                        const notesStr = reception.notes || "";
                                        const truncatedNotes = notesStr.length > 50 ? `${notesStr.substring(0, 50)}...` : notesStr;
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
                                                            {reception.farm_source && (
                                                                <>
                                                                    <span>|</span>
                                                                    <span className="text-emerald-600 font-semibold">{reception.farm_source}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-text-muted">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-semibold text-text text-xs">
                                                            {t("receptions.period", "الفترة")} {reception.period?.period_number || 1}
                                                        </span>
                                                        {truncatedNotes ? (
                                                            <span className="text-[11px] text-text-muted font-normal max-w-[220px] truncate" title={notesStr}>
                                                                {truncatedNotes}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-text-muted/60">—</span>
                                                        )}
                                                    </div>
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
                                                        {reception.status === 'approved' ? t("receptions.status_approved", "معتمد") : t("receptions.status_draft", "مسودة")}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        {/* Quick View Modal Icon (Eye) */}
                                                        <Tooltip text={t("receptions.quick_view", "معاينة سريعة للسند")}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setQuickViewReception(reception);
                                                                    setIsQuickViewModalOpen(true);
                                                                }}
                                                                className={`p-1.5 text-slate-700 hover:bg-slate-100 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Eye className="h-4 w-4 text-slate-600" />
                                                                {showButtonText && <span>{t("common.preview", "معاينة")}</span>}
                                                            </button>
                                                        </Tooltip>

                                                        {/* Full Screen Show Page Icon (Monitor) */}
                                                        <Tooltip text={t("receptions.full_view", "فتح الشاشة الكاملة للسند")}>
                                                            <Link
                                                                href={route("receptions.show", reception.id)}
                                                                className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Monitor className="h-4 w-4" />
                                                                {showButtonText && <span>{t("common.show", "عرض")}</span>}
                                                            </Link>
                                                        </Tooltip>

                                                        {reception.status === "draft" && (
                                                            <Tooltip text={t("common.edit", "تعديل")}>
                                                                <Link
                                                                    href={route("receptions.edit", reception.id)}
                                                                    className={`p-1.5 text-primary hover:bg-primary/10 rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                    {showButtonText && <span>{t("common.edit", "تعديل")}</span>}
                                                                </Link>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip text={t("common.print", "طباعة")}>
                                                            <a
                                                                href={route("receptions.print", reception.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`p-1.5 text-text hover:bg-hover rounded-none border border-border flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px]'}`}
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                                {showButtonText && <span>{t("common.print", "طباعة")}</span>}
                                                            </a>
                                                        </Tooltip>
                                                        {reception.status === "draft" ? (
                                                            <Tooltip text={t("common.approve", "اعتماد")}>
                                                                <button
                                                                    onClick={() => {
                                                                        setErrorMsg("");
                                                                        setReceptionToApprove(reception);
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
                                                                        setReceptionToReopen(reception);
                                                                        setReopenModalOpen(true);
                                                                    }}
                                                                    className={`bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none flex items-center justify-center transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-2.5' : 'w-[30px] p-0'}`}
                                                                >
                                                                    <Unlock className="h-4 w-4" />
                                                                    {showButtonText && <span className="text-[11px]">{t("common.reopen", "إعادة فتح")}</span>}
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                        {reception.status === "draft" && (
                                                            <Tooltip text={t("common.delete", "حذف")}>
                                                                <button
                                                                    onClick={() => requestDelete(route("receptions.destroy", reception.id), reception)}
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
                    {receptions.links && receptions.links.length > 3 && (
                        <div className="bg-surface border-t border-border p-3 flex items-center justify-between">
                            <div className="text-xs text-text-muted">
                                {t("common.showing_page", "عرض الصفحة")}{" "}
                                <span className="font-bold">{receptions.current_page}</span>{" "}
                                {t("common.of", "من أصل")}{" "}
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

            {/* Quick View Modal */}
            <Modal show={isQuickViewModalOpen} onClose={() => setIsQuickViewModalOpen(false)} maxWidth="2xl">
                {quickViewReception && (
                    <div className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-base text-text">
                                    {t("receptions.quick_modal_title", "معاينة إيصال الاستلام")}:{" "}
                                    <span className="font-mono text-primary">{quickViewReception.serial_number}</span>
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
                                <span className="text-text-muted block">{t("receptions.customer", "العميل")}:</span>
                                <span className="font-bold text-text">{quickViewReception.customer?.name || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("receptions.contract", "العقد")}:</span>
                                <span className="font-mono font-bold text-primary">{quickViewReception.contract?.contract_number || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("receptions.farm_source", "مصدر المزرعة")}:</span>
                                <span className="font-semibold text-emerald-700">{quickViewReception.farm_source || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("receptions.reception_date", "تاريخ الاستلام")}:</span>
                                <span className="font-mono font-semibold">{quickViewReception.reception_date || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("receptions.driver", "السائق")}:</span>
                                <span className="font-semibold">{quickViewReception.driver?.name || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted block">{t("receptions.status", "الحالة")}:</span>
                                <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-none inline-block ${
                                    quickViewReception.status === 'approved' 
                                        ? 'bg-success/10 text-success border border-success/30' 
                                        : 'bg-warning/10 text-warning border border-warning/30'
                                }`}>
                                    {quickViewReception.status === 'approved' ? t("receptions.status_approved", "معتمد") : t("receptions.status_draft", "مسودة")}
                                </span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-text-muted block">{t("receptions.notes", "الملاحظات")}:</span>
                                <span className="font-normal text-text">{quickViewReception.notes || "—"}</span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                <Activity className="h-4 w-4" />
                                <span>{t("receptions.quick_modal_items", "جدول أصناف وبضائع السند")}</span>
                            </div>
                            <div className="border border-border max-h-[260px] overflow-y-auto">
                                <table className="w-full text-xs text-start border-collapse">
                                    <thead className="bg-surface-muted text-text-muted font-bold sticky top-0">
                                        <tr className="border-b border-border">
                                            <th className="p-2 text-start w-10">#</th>
                                            <th className="p-2 text-start">{t("receptions.col_item", "الصنف المخزني")}</th>
                                            <th className="p-2 text-start">{t("receptions.col_variant", "البديل/الشكل")}</th>
                                            <th className="p-2 text-start">{t("receptions.col_pallet", "رقم الطبلية")}</th>
                                            <th className="p-2 text-end">{t("receptions.col_qty", "الكمية")}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {quickViewReception.inventory_entries && quickViewReception.inventory_entries.length > 0 ? (
                                            quickViewReception.inventory_entries.map((entry, i) => (
                                                <tr key={entry.id || i} className="hover:bg-hover">
                                                    <td className="p-2 font-mono text-text-muted">{i + 1}</td>
                                                    <td className="p-2 font-bold text-text">
                                                        {displayBilingual(entry.inventory_item?.name || entry.inventory_item_id)}
                                                    </td>
                                                    <td className="p-2 text-text-muted">
                                                        {displayBilingual(entry.variant?.name || entry.inventory_item_variant_id)}
                                                    </td>
                                                    <td className="p-2 font-mono font-bold text-primary">
                                                        {entry.pallet?.pallet_number ? `${entry.pallet.pallet_number} / ${getPalletSizeDisplay(entry.pallet)}` : "—"}
                                                    </td>
                                                    <td className="p-2 font-mono font-extrabold text-end text-emerald-600">
                                                        {Math.round(parseFloat(entry.quantity_in) || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="p-4 text-center text-text-muted">
                                                    {t("receptions.no_entries_quick", "لا توجد أسطر حركات مضافة للسند.")}
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
                                href={route("receptions.show", quickViewReception.id)}
                                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 transition-all"
                            >
                                <Monitor className="h-4 w-4" />
                                <span>{t("receptions.go_to_full_page", "الانتقال لصفحة السند الكاملة")}</span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsQuickViewModalOpen(false)}
                                className="bg-surface border border-border hover:bg-surface-muted text-text text-xs font-bold px-4 py-1.5 transition-all"
                            >
                                {t("common.close", "إغلاق النافذة")}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm Secure Delete Modal */}
            <ConfirmationModal
                show={!!receptionToDelete}
                title={t("receptions.confirm_delete_title", "تأكيد حذف سند الاستلام")}
                message={t("receptions.confirm_delete_msg", "أنت على وشك حذف هذا السند وحركات المخزن التابعة له بشكل نهائي. هذا الإجراء غير قابل للتراجع.")}
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
                            {t("receptions.reopen_title", "إعادة فتح السند (إلغاء الاعتماد)")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {t("receptions.reopen_desc", "بإعادة فتح السند، سيعود لحالة المسودة (Draft) لتتمكن من تعديله. يتطلب هذا الإجراء كلمة مرور العمليات وتوثيق السبب.")}
                    </p>

                    <div>
                        <InputLabel
                            htmlFor="reopen_reason"
                            value={t("receptions.reopen_reason_label", "سبب إلغاء الاعتماد وإعادة الفتح *")}
                        />
                        <TextInput
                            id="reopen_reason"
                            type="text"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder={t("receptions.reopen_reason_placeholder", "مثال: تعديل كمية طبلية خاطئة...")}
                            required
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="reopen_password"
                            value={t("receptions.reopen_password_label", "كلمة مرور العمليات الآمنة *")}
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
                        <Tooltip text={t("common.cancel", "إلغاء")}>
                            <button
                                type="button"
                                onClick={() => setReopenModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && <span>{t("common.cancel", "إلغاء")}</span>}
                            </button>
                        </Tooltip>
                        <Tooltip text={t("receptions.confirm_reopen", "تأكيد إعادة الفتح")}>
                            <button
                                type="submit"
                                disabled={processingAction}
                                className={`bg-amber-600 hover:bg-amber-700 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'} disabled:opacity-50`}
                            >
                                <Unlock className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? t("common.processing", "جاري المعالجة...")
                                            : t("receptions.confirm_reopen", "تأكيد إعادة الفتح")}
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
                            {t("receptions.approve_title", "اعتماد وإغلاق سند الاستلام")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {t("receptions.approve_desc", "هل أنت متأكد من اعتماد هذا السند؟ سيتم تثبيت الكميات في المخازن بشكل رسمي، وسيتحول السند إلى حالة القفل ولا يمكن تعديله إلا بكلمة مرور العمليات.")}
                    </p>

                    {errorMsg && <p className="text-xs text-danger mt-1 font-bold">{errorMsg}</p>}

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={t("common.cancel", "إلغاء")}>
                            <button
                                type="button"
                                onClick={() => setApproveModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? 'px-3' : 'w-[30px] p-0'}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && <span>{t("common.cancel", "إلغاء")}</span>}
                            </button>
                        </Tooltip>
                        <Tooltip text={t("receptions.confirm_approve", "تأكيد الاعتماد")}>
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
                                            ? t("common.approving", "جاري الاعتماد...")
                                            : t("receptions.confirm_approve", "تأكيد الاعتماد")}
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
