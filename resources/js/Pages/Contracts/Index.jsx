import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { useState } from "react";
import {
    FileText,
    Plus,
    Search,
    Filter,
    Home,
    ChevronRight,
    Eye,
    Play,
    Pause,
    Trash2,
    XCircle,
    CheckCircle2,
    ShieldAlert,
    LayoutGrid,
    List as ListIcon,
    User,
    TrendingUp,
    FileDown,
    CheckSquare,
    Square,
    RefreshCw,
    Hash,
    Calendar,
    Activity,
    Sliders,
} from "lucide-react";
import Pagination from "@/Components/Pagination";
import ConfirmationModal from "@/Components/ConfirmationModal";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a monetary number to a compact representation with at most 3
 * significant digits and a lowercase suffix (k / m).
 * Returns { number: string, suffix: string }
 * e.g.  26600  → { number: '26.6', suffix: 'k' }
 *       1500000 → { number: '1.5',  suffix: 'm' }
 *       850     → { number: '850',  suffix: ''  }
 */
function compactMoney(value) {
    const n = parseFloat(value) || 0;
    if (n >= 1_000_000) {
        const v = n / 1_000_000;
        return { number: parseFloat(v.toPrecision(3)).toString(), suffix: "m" };
    }
    if (n >= 1_000) {
        const v = n / 1_000;
        return { number: parseFloat(v.toPrecision(3)).toString(), suffix: "k" };
    }
    return { number: parseFloat(n.toPrecision(3)).toString(), suffix: "" };
}

export default function Index({ contracts, stats, filters, translations }) {
    const { lang } = useLang();
    const { auth } = usePage().props;

    const [viewMode, setViewMode] = useState("list");
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState(filters?.search || "");
    const [selectedStatus, setSelectedStatus] = useState(filters?.status || "");
    const [actionContract, setActionContract] = useState(null);
    const [actionType, setActionType] = useState(null); // 'activate', 'suspend', 'end', 'cancel', 'delete'
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

    // Helpers
    const handleExport = (format) => {
        setIsExportDropdownOpen(false);
        if (format === "pdf") {
            window.print();
        } else {
            alert(
                lang === "ar"
                    ? `جاري تصدير البيانات بصيغة ${format.toUpperCase()}...`
                    : `Exporting data as ${format.toUpperCase()}...`,
            );
        }
    };

    const t = (key) => {
        const parts = key.split(".");
        let current = translations;
        for (const part of parts) {
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                return key;
            }
        }
        return current;
    };

    const hasPermission = (permission) => {
        return auth.permissions?.includes(permission) ?? false;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        } catch (e) {
            return dateStr;
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        router.get(
            route("contracts.index"),
            {
                search: searchQuery,
                status: selectedStatus,
            },
            { preserveState: true },
        );
    };

    const handleFilterChange = (status) => {
        setSelectedStatus(status);
        router.get(
            route("contracts.index"),
            {
                search: searchQuery,
                status: status,
            },
            { preserveState: true },
        );
    };

    const toggleSelection = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter((item) => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const selectAll = () => setSelectedItems(contracts.data.map((c) => c.id));
    const selectNone = () => setSelectedItems([]);
    const invertSelection = () => {
        const allIds = contracts.data.map((c) => c.id);
        setSelectedItems(allIds.filter((id) => !selectedItems.includes(id)));
    };

    const openConfirmModal = (contract, type) => {
        setActionContract(contract);
        setActionType(type);
        setIsConfirmOpen(true);
    };

    const closeConfirmModal = () => {
        setIsConfirmOpen(false);
        setActionContract(null);
        setActionType(null);
    };

    const handleActionConfirm = () => {
        if (!actionContract || !actionType) return;

        let url = "";
        if (actionType === "activate")
            url = route("contracts.activate", actionContract.id);
        else if (actionType === "suspend")
            url = route("contracts.suspend", actionContract.id);
        else if (actionType === "end")
            url = route("contracts.end", actionContract.id);
        else if (actionType === "cancel")
            url = route("contracts.cancel", actionContract.id);
        else if (actionType === "delete") {
            router.delete(route("contracts.destroy", actionContract.id), {
                onSuccess: () => closeConfirmModal(),
                onError: () => closeConfirmModal(),
            });
            return;
        }

        if (url) {
            router.post(
                url,
                {},
                {
                    onSuccess: () => closeConfirmModal(),
                    onError: () => closeConfirmModal(),
                },
            );
        }
    };

    // Breadcrumbs matching Naming & Layout
    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight
                className={cn("h-4 w-4", lang === "ar" && "rotate-180")}
            />
            <span>{t("home.parent_link")}</span>
            <ChevronRight
                className={cn("h-4 w-4", lang === "ar" && "rotate-180")}
            />
            <span className="text-primary font-medium">
                {t("home.page_title")}
            </span>
        </div>
    );

    // Permission Guard for Page Content
    if (!hasPermission("contracts.view")) {
        return (
            <AuthenticatedLayout header={breadcrumbs}>
                <div
                    className="mx-auto max-w-7xl px-4 py-8 text-center"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                        <span className="font-bold text-sm">
                            {t("home.unauthorized")}
                        </span>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // Modal Details based on action type
    const getModalDetails = () => {
        if (lang === "ar") {
            switch (actionType) {
                case "activate":
                    return {
                        title: "تنشيط العقد",
                        message: `هل أنت متأكد من رغبتك في تنشيط العقد رقم ${actionContract?.contract_number}؟ سيتم تغيير الحالة إلى نشط.`,
                        confirmLabel: "تنشيط العقد",
                        type: "info",
                    };
                case "suspend":
                    return {
                        title: "إيقاف مؤقت للعقد",
                        message: `هل أنت متأكد من رغبتك في إيقاف العقد رقم ${actionContract?.contract_number} مؤقتاً؟`,
                        confirmLabel: "إيقاف مؤقت",
                        type: "warning",
                    };
                case "end":
                    return {
                        title: "إنهاء العقد",
                        message: `هل أنت متأكد من إنهاء العقد رقم ${actionContract?.contract_number}؟ هذا الإجراء يسجل انتهاء فترة العقد.`,
                        confirmLabel: "إنهاء العقد",
                        type: "warning",
                    };
                case "cancel":
                    return {
                        title: "إلغاء العقد",
                        message: `هل أنت متأكد من إلغاء العقد رقم ${actionContract?.contract_number}؟ لا يمكن التراجع عن هذا الإجراء.`,
                        confirmLabel: "إلغاء العقد",
                        type: "danger",
                    };
                case "delete":
                    return {
                        title: "حذف العقد نهائياً",
                        message: `هل أنت متأكد من حذف العقد رقم ${actionContract?.contract_number} نهائياً من النظام؟ لا يمكن استعادة البيانات المحذوفة.`,
                        confirmLabel: "حذف العقد",
                        type: "danger",
                    };
                default:
                    return {
                        title: "",
                        message: "",
                        confirmLabel: "",
                        type: "warning",
                    };
            }
        } else {
            switch (actionType) {
                case "activate":
                    return {
                        title: "Activate Contract",
                        message: `Are you sure you want to activate contract no. ${actionContract?.contract_number}?`,
                        confirmLabel: "Activate",
                        type: "info",
                    };
                case "suspend":
                    return {
                        title: "Suspend Contract",
                        message: `Are you sure you want to suspend contract no. ${actionContract?.contract_number}?`,
                        confirmLabel: "Suspend",
                        type: "warning",
                    };
                case "end":
                    return {
                        title: "End Contract",
                        message: `Are you sure you want to mark contract no. ${actionContract?.contract_number} as ended?`,
                        confirmLabel: "End Contract",
                        type: "warning",
                    };
                case "cancel":
                    return {
                        title: "Cancel Contract",
                        message: `Are you sure you want to cancel contract no. ${actionContract?.contract_number}? This cannot be undone.`,
                        confirmLabel: "Cancel",
                        type: "danger",
                    };
                case "delete":
                    return {
                        title: "Delete Contract",
                        message: `Are you sure you want to delete contract no. ${actionContract?.contract_number}? All data will be permanently removed.`,
                        confirmLabel: "Delete",
                        type: "danger",
                    };
                default:
                    return {
                        title: "",
                        message: "",
                        confirmLabel: "",
                        type: "warning",
                    };
            }
        }
    };

    const modalDetails = getModalDetails();

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t("home.page_title")} />

            <div className="pb-2 space-y-2" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* 1. Page Title & Actions */}
                    <PageHeader
                        icon={FileText}
                        title={t("home.page_title")}
                        description={t("home.subtitle")}
                        actions={
                            <>
                                {/* Export Dropdown Action */}
                                <div className="relative">
                                    <Tooltip
                                        text={
                                            lang === "ar"
                                                ? "تصدير البيانات"
                                                : "Export Data"
                                        }
                                    >
                                        <button
                                            onClick={() =>
                                                setIsExportDropdownOpen(
                                                    !isExportDropdownOpen,
                                                )
                                            }
                                            className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-surface text-text hover:bg-surface-muted transition-colors shadow-sm"
                                        >
                                            <FileDown className="h-5 w-5" />
                                        </button>
                                    </Tooltip>

                                    {isExportDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() =>
                                                    setIsExportDropdownOpen(false)
                                                }
                                            ></div>
                                            <div
                                                className={cn(
                                                    "absolute z-20 mt-1 w-32 rounded-lg border border-border bg-surface shadow-md py-1",
                                                    lang === "ar"
                                                        ? "left-0"
                                                        : "right-0",
                                                )}
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleExport("pdf")
                                                    }
                                                    className="w-full text-start px-4 py-2 text-sm text-text hover:bg-surface-muted transition-colors flex items-center justify-between"
                                                >
                                                    <span>PDF</span>
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                        (.pdf)
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleExport("excel")
                                                    }
                                                    className="w-full text-start px-4 py-2 text-sm text-text hover:bg-surface-muted transition-colors flex items-center justify-between"
                                                >
                                                    <span>Excel</span>
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                        (.xlsx)
                                                    </span>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleExport("csv")
                                                    }
                                                    className="w-full text-start px-4 py-2 text-sm text-text hover:bg-surface-muted transition-colors flex items-center justify-between"
                                                >
                                                    <span>CSV</span>
                                                    <span className="text-[10px] text-text-muted font-mono">
                                                        (.csv)
                                                    </span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Add Contract Action (Icon only with Tooltip) */}
                                {hasPermission("contracts.create") && (
                                    <Tooltip text={t("home.add_contract")}>
                                        <Link
                                            href={route("customers.index")}
                                            className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover shadow-sm"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </Link>
                                    </Tooltip>
                                )}
                            </>
                        }
                    />

                    {/* 2. Stats Cards (Real Data, swapped layout: icon & text on the right/start, number on the left/end in RTL) */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                        {[
                            {
                                label: t("home.stats_total"),
                                value: stats.total,
                                icon: FileText,
                                color: "text-primary",
                                bg: "bg-primary/10",
                            },
                            {
                                label: t("home.stats_active"),
                                value: stats.active,
                                icon: CheckCircle2,
                                color: "text-emerald-500",
                                bg: "bg-emerald-500/10",
                            },
                            {
                                label: t("home.stats_ending"),
                                value: stats.ending,
                                icon: ShieldAlert,
                                color: "text-amber-500",
                                bg: "bg-amber-500/10",
                            },
                            {
                                label: `${t("home.stats_value")} (${stats.currency ?? "SAR"})`,
                                value: stats.value,
                                icon: TrendingUp,
                                color: "text-cyan-500",
                                bg: "bg-cyan-500/10",
                                isCurrency: true,
                            },
                        ].map(
                            (
                                {
                                    label,
                                    value,
                                    icon: Icon,
                                    color,
                                    bg,
                                    isCurrency,
                                },
                                i,
                            ) => (
                                <div
                                    key={i}
                                    className="border border-border bg-surface px-4 py-3 shadow-sm transition-shadow hover:shadow-md flex items-center justify-between rounded-xl"
                                >
                                    {/* Icon + label text (Renders on Right in RTL, Left in LTR) */}
                                    <div className="flex flex-col items-start gap-1 min-w-0">
                                        <div
                                            className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-lg",
                                                bg,
                                                color,
                                            )}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase truncate max-w-[120px]">
                                            {label}
                                        </p>
                                    </div>

                                    {/* Number (Renders on Left in RTL, Right in LTR) */}
                                    <div className="text-3xl font-black text-text leading-tight flex items-end gap-0.5">
                                        {isCurrency ? (
                                            <>
                                                {compactMoney(value).number}
                                                {compactMoney(value).suffix && (
                                                    <span className="text-base font-bold text-text-muted mb-0.5">
                                                        {
                                                            compactMoney(value)
                                                                .suffix
                                                        }
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            value
                                        )}
                                    </div>
                                </div>
                            ),
                        )}
                    </div>

                    {/* 3. Resource Data Layout */}
                    <div className="rounded-xl border border-border bg-surface shadow-sm flex flex-col">
                        {/* Header: Tools, Search, View Toggle */}
                        <div className="border-b border-border  px-3 py-1 bg-surface-muted/30 flex flex-col gap-4">
                            {/* Row 1: Search Box (Start / Right in RTL) VS Selection Tools & View Mode Toggle (End / Left in RTL) */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                                {/* Start Side: Search Box */}
                                <form
                                    onSubmit={handleSearchSubmit}
                                    className="relative w-full md:w-80"
                                >
                                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                                        <Search className="h-4 w-4 text-text-muted" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="block w-full rounded-lg border border-border bg-surface py-1.5 ps-9 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder={t(
                                            "home.search_placeholder",
                                        )}
                                    />
                                </form>

                                {/* End Side: Selection Tools & View Mode Toggle */}
                                <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
                                    {/* Selection Tools (Icon-only with Tooltips) */}
                                    <div className="flex items-center gap-1.5">
                                        <Tooltip
                                            text={
                                                lang === "ar"
                                                    ? "اختيار الكل"
                                                    : "Select All"
                                            }
                                        >
                                            <button
                                                onClick={selectAll}
                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface border border-border text-text hover:bg-surface-muted hover:text-primary transition-colors shadow-sm"
                                            >
                                                <CheckSquare className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip
                                            text={
                                                lang === "ar"
                                                    ? "إلغاء الاختيار"
                                                    : "Clear Selection"
                                            }
                                        >
                                            <button
                                                onClick={selectNone}
                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface border border-border text-text hover:bg-surface-muted hover:text-danger transition-colors shadow-sm"
                                            >
                                                <Square className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip
                                            text={
                                                lang === "ar"
                                                    ? "عكس الاختيار"
                                                    : "Invert Selection"
                                            }
                                        >
                                            <button
                                                onClick={invertSelection}
                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface border border-border text-text hover:bg-surface-muted hover:text-indigo-500 transition-colors shadow-sm"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        {selectedItems.length > 0 && (
                                            <span className="text-xs font-bold text-primary px-2 bg-primary/10 rounded-full py-0.5">
                                                {selectedItems.length}{" "}
                                                {lang === "ar"
                                                    ? "محدد"
                                                    : "Selected"}
                                            </span>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="h-4 w-px bg-border hidden sm:block"></div>

                                    {/* View Mode Toggle */}
                                    <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
                                        <Tooltip
                                            text={
                                                lang === "ar"
                                                    ? "عرض شبكي"
                                                    : "Grid View"
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    setViewMode("grid")
                                                }
                                                className={cn(
                                                    "p-1.5 rounded-md transition-colors",
                                                    viewMode === "grid"
                                                        ? "bg-surface-muted text-primary shadow-sm"
                                                        : "text-text-muted hover:text-text",
                                                )}
                                            >
                                                <LayoutGrid className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip
                                            text={
                                                lang === "ar"
                                                    ? "عرض قائمة"
                                                    : "List View"
                                            }
                                        >
                                            <button
                                                onClick={() =>
                                                    setViewMode("list")
                                                }
                                                className={cn(
                                                    "p-1.5 rounded-md transition-colors",
                                                    viewMode === "list"
                                                        ? "bg-surface-muted text-primary shadow-sm"
                                                        : "text-text-muted hover:text-text",
                                                )}
                                            >
                                                <ListIcon className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Filters Row (Inside body, directly above table with pill buttons) */}
                        <div className="border-b border-border px-3 py-1 bg-surface-muted/10 flex flex-wrap gap-1.5 justify-start">
                            {[
                                { id: "", label: t("home.filter_all") },
                                { id: "draft", label: t("home.status_draft") },
                                {
                                    id: "active",
                                    label: t("home.status_active"),
                                },
                                {
                                    id: "suspended",
                                    label: t("home.status_suspended"),
                                },
                                { id: "ended", label: t("home.status_ended") },
                                {
                                    id: "cancelled",
                                    label: t("home.status_cancelled"),
                                },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() =>
                                        handleFilterChange(filter.id)
                                    }
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold transition-all rounded-lg border",
                                        selectedStatus === filter.id
                                            ? "bg-primary text-white border-primary shadow-sm"
                                            : "bg-surface border-border text-text-muted hover:text-text hover:bg-surface-muted",
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Body: Data Presentation */}
                        <div className="flex-1 bg-surface p-0 min-h-[400px]">
                            {(() => {
                                if (contracts.data.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
                                            <FileText className="h-12 w-12 opacity-20 mb-4" />
                                            <p className="text-lg font-medium">
                                                {t("home.no_contracts")}
                                            </p>
                                        </div>
                                    );
                                }

                                return viewMode === "list" ? (
                                    /* List View */
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-border">
                                            <thead className="bg-surface-muted/50">
                                                <tr>
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-start w-12"
                                                    >
                                                        <div className="flex items-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    selectedItems.length ===
                                                                        contracts
                                                                            .data
                                                                            .length &&
                                                                    contracts
                                                                        .data
                                                                        .length >
                                                                        0
                                                                }
                                                                onChange={
                                                                    selectedItems.length ===
                                                                    contracts
                                                                        .data
                                                                        .length
                                                                        ? selectNone
                                                                        : selectAll
                                                                }
                                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                            />
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Hash className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {t(
                                                                    "home.col_number",
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <User className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {t(
                                                                    "home.col_customer",
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {t(
                                                                    "home.col_dates",
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Activity className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {t(
                                                                    "home.col_status",
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5 justify-end">
                                                            <Sliders className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {t(
                                                                    "home.col_actions",
                                                                )}
                                                            </span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-surface">
                                                {contracts.data.map(
                                                    (contract) => (
                                                        <tr
                                                            key={contract.id}
                                                            className={cn(
                                                                "transition-all duration-150 hover:bg-primary/5 cursor-pointer",
                                                                selectedItems.includes(
                                                                    contract.id,
                                                                )
                                                                    ? "bg-primary/10"
                                                                    : "",
                                                            )}
                                                        >
                                                            <td className="px-4 py-3 w-12">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItems.includes(
                                                                        contract.id,
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleSelection(
                                                                            contract.id,
                                                                        )
                                                                    }
                                                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                                />
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-3 text-sm font-mono font-bold text-text">
                                                                #
                                                                {
                                                                    contract.contract_number
                                                                }
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-3 text-sm font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                                                        <User className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <span className="text-text font-semibold">
                                                                        {
                                                                            contract
                                                                                .customer
                                                                                ?.name
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-3 text-sm font-mono text-text-muted">
                                                                {formatDate(
                                                                    contract.start_date,
                                                                )}{" "}
                                                                {lang === "ar"
                                                                    ? "إلى"
                                                                    : "to"}{" "}
                                                                {formatDate(
                                                                    contract.end_date,
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-3">
                                                                <span
                                                                    className={cn(
                                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold inline-block border",
                                                                        contract.status ===
                                                                            "active" &&
                                                                            "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                                        contract.status ===
                                                                            "draft" &&
                                                                            "bg-slate-50 text-slate-700 border-slate-200",
                                                                        contract.status ===
                                                                            "suspended" &&
                                                                            "bg-amber-50 text-amber-700 border-amber-200",
                                                                        (contract.status ===
                                                                            "ended" ||
                                                                            contract.status ===
                                                                                "cancelled") &&
                                                                            "bg-rose-50 text-rose-700 border-rose-200",
                                                                    )}
                                                                >
                                                                    {t(
                                                                        `home.status_${contract.status}`,
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-6 py-3 text-end">
                                                                <div
                                                                    className="flex items-center justify-end gap-1"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <Tooltip
                                                                        text={t(
                                                                            "home.action_view",
                                                                        )}
                                                                    >
                                                                        <Link
                                                                            href={route(
                                                                                "contracts.show",
                                                                                contract.id,
                                                                            )}
                                                                            className="p-1.5 rounded-md text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors inline-flex"
                                                                        >
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        </Link>
                                                                    </Tooltip>

                                                                    {hasPermission(
                                                                        "contracts.activate",
                                                                    ) &&
                                                                        contract.status !==
                                                                            "active" && (
                                                                            <Tooltip
                                                                                text={t(
                                                                                    "home.action_activate",
                                                                                )}
                                                                            >
                                                                                <button
                                                                                    onClick={() =>
                                                                                        openConfirmModal(
                                                                                            contract,
                                                                                            "activate",
                                                                                        )
                                                                                    }
                                                                                    className="p-1.5 rounded-md text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                                                                >
                                                                                    <Play className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </Tooltip>
                                                                        )}

                                                                    {hasPermission(
                                                                        "contracts.activate",
                                                                    ) &&
                                                                        contract.status ===
                                                                            "active" && (
                                                                            <Tooltip
                                                                                text={t(
                                                                                    "home.action_suspend",
                                                                                )}
                                                                            >
                                                                                <button
                                                                                    onClick={() =>
                                                                                        openConfirmModal(
                                                                                            contract,
                                                                                            "suspend",
                                                                                        )
                                                                                    }
                                                                                    className="p-1.5 rounded-md text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                                                >
                                                                                    <Pause className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </Tooltip>
                                                                        )}

                                                                    {hasPermission(
                                                                        "contracts.activate",
                                                                    ) &&
                                                                        contract.status ===
                                                                            "active" && (
                                                                            <Tooltip
                                                                                text={t(
                                                                                    "home.action_end",
                                                                                )}
                                                                            >
                                                                                <button
                                                                                    onClick={() =>
                                                                                        openConfirmModal(
                                                                                            contract,
                                                                                            "end",
                                                                                        )
                                                                                    }
                                                                                    className="p-1.5 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                                >
                                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </Tooltip>
                                                                        )}

                                                                    {hasPermission(
                                                                        "contracts.delete",
                                                                    ) && (
                                                                        <Tooltip
                                                                            text={t(
                                                                                "home.action_delete",
                                                                            )}
                                                                        >
                                                                            <button
                                                                                onClick={() =>
                                                                                    openConfirmModal(
                                                                                        contract,
                                                                                        "delete",
                                                                                    )
                                                                                }
                                                                                className="p-1.5 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    /* Grid View */
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                        {contracts.data.map((contract) => (
                                            <div
                                                key={contract.id}
                                                className={cn(
                                                    "border border-border rounded-xl p-4 flex flex-col gap-4 relative transition-shadow hover:shadow-md cursor-pointer",
                                                    selectedItems.includes(
                                                        contract.id,
                                                    )
                                                        ? "ring-2 ring-primary bg-primary/5"
                                                        : "bg-surface",
                                                )}
                                                onClick={() =>
                                                    toggleSelection(contract.id)
                                                }
                                            >
                                                <div
                                                    className="absolute top-4 end-4 flex items-center gap-2"
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(
                                                            contract.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleSelection(
                                                                contract.id,
                                                            )
                                                        }
                                                        className="rounded border-border text-primary focus:ring-primary h-5 w-5 cursor-pointer"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                        <FileText className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-text text-base">
                                                            #
                                                            {
                                                                contract.contract_number
                                                            }
                                                        </h3>
                                                        <p className="text-xs text-text-muted mt-0.5 truncate max-w-[150px]">
                                                            {
                                                                contract
                                                                    .customer
                                                                    ?.name
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-text-muted">
                                                            {lang === "ar"
                                                                ? "البداية:"
                                                                : "Start:"}
                                                        </span>
                                                        <span className="font-medium text-text font-mono">
                                                            {formatDate(
                                                                contract.start_date,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-text-muted">
                                                            {lang === "ar"
                                                                ? "النهاية:"
                                                                : "End:"}
                                                        </span>
                                                        <span className="font-medium text-text font-mono">
                                                            {formatDate(
                                                                contract.end_date,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                                                        <span className="text-text-muted">
                                                            {lang === "ar"
                                                                ? "الحالة:"
                                                                : "Status:"}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "px-2 py-0.5 rounded-full text-[10px] font-bold inline-block border",
                                                                contract.status ===
                                                                    "active" &&
                                                                    "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                                contract.status ===
                                                                    "draft" &&
                                                                    "bg-slate-50 text-slate-700 border-slate-200",
                                                                contract.status ===
                                                                    "suspended" &&
                                                                    "bg-amber-50 text-amber-700 border-amber-200",
                                                                (contract.status ===
                                                                    "ended" ||
                                                                    contract.status ===
                                                                        "cancelled") &&
                                                                    "bg-rose-50 text-rose-700 border-rose-200",
                                                            )}
                                                        >
                                                            {t(
                                                                `home.status_${contract.status}`,
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className="flex justify-end gap-1 border-t border-border pt-2 mt-1"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Tooltip
                                                            text={t(
                                                                "home.action_view",
                                                            )}
                                                        >
                                                            <Link
                                                                href={route(
                                                                    "contracts.show",
                                                                    contract.id,
                                                                )}
                                                                className="p-1.5 rounded-md text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors inline-flex"
                                                            >
                                                                <Eye className="h-3.5 w-3.5" />
                                                            </Link>
                                                        </Tooltip>

                                                        {hasPermission(
                                                            "contracts.activate",
                                                        ) &&
                                                            contract.status !==
                                                                "active" && (
                                                                <Tooltip
                                                                    text={t(
                                                                        "home.action_activate",
                                                                    )}
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            openConfirmModal(
                                                                                contract,
                                                                                "activate",
                                                                            )
                                                                        }
                                                                        className="p-1.5 rounded-md text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                                                    >
                                                                        <Play className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </Tooltip>
                                                            )}

                                                        {hasPermission(
                                                            "contracts.activate",
                                                        ) &&
                                                            contract.status ===
                                                                "active" && (
                                                                <Tooltip
                                                                    text={t(
                                                                        "home.action_suspend",
                                                                    )}
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            openConfirmModal(
                                                                                contract,
                                                                                "suspend",
                                                                            )
                                                                        }
                                                                        className="p-1.5 rounded-md text-text-muted hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                                                                    >
                                                                        <Pause className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </Tooltip>
                                                            )}

                                                        {hasPermission(
                                                            "contracts.activate",
                                                        ) &&
                                                            contract.status ===
                                                                "active" && (
                                                                <Tooltip
                                                                    text={t(
                                                                        "home.action_end",
                                                                    )}
                                                                >
                                                                    <button
                                                                        onClick={() =>
                                                                            openConfirmModal(
                                                                                contract,
                                                                                "end",
                                                                            )
                                                                        }
                                                                        className="p-1.5 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </Tooltip>
                                                            )}

                                                        {hasPermission(
                                                            "contracts.delete",
                                                        ) && (
                                                            <Tooltip
                                                                text={t(
                                                                    "home.action_delete",
                                                                )}
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        openConfirmModal(
                                                                            contract,
                                                                            "delete",
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Footer: Pagination */}
                        <Pagination
                            links={contracts.links}
                            total={contracts.total}
                            from={contracts.from}
                            to={contracts.to}
                        />
                    </div>
                </div>

                {/* DOM-based Custom Confirmation Modal (Bypasses browser BOM alerts/confirms) */}
                <ConfirmationModal
                    show={isConfirmOpen}
                    title={modalDetails.title}
                    message={modalDetails.message}
                    confirmLabel={modalDetails.confirmLabel}
                    cancelLabel={lang === "ar" ? "إلغاء" : "Cancel"}
                    type={modalDetails.type}
                    onConfirm={handleActionConfirm}
                    onCancel={closeConfirmModal}
                    processing={false}
                />
            </div>
        </AuthenticatedLayout>
    );
}
