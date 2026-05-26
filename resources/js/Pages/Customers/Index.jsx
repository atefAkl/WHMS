import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { useState } from "react";
import {
    UsersRound,
    Plus,
    Search,
    LayoutGrid,
    List as ListIcon,
    Filter,
    ChevronRight,
    Home,
    TrendingUp,
    Users,
    Activity,
    Edit,
    Trash2,
    Eye,
    FileDown,
    CheckSquare,
    Square,
    RefreshCw,
    Hash,
    User,
    Phone,
    CreditCard,
    Sliders,
    X,
    FileText,
    FilePlus,
} from "lucide-react";
import Pagination from "@/Components/Pagination";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import ConfirmationModal from "@/Components/ConfirmationModal";
import PageHeader from "@/Components/PageHeader";

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Index({
    auth,
    customers,
    filters,
    countries = [],
    categories = [],
    stats = {},
}) {
    const { lang, __ } = useLang();
    const [viewMode, setViewMode] = useState("list");
    const [searchQuery, setSearchQuery] = useState(filters?.search || "");
    const [selectedItems, setSelectedItems] = useState([]);

    const [includeInactive, setIncludeInactive] = useState(false);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [selectedCustomerForContracts, setSelectedCustomerForContracts] = useState(null);

    const openContractsModal = (customer) => setSelectedCustomerForContracts(customer);
    const closeContractsModal = () => setSelectedCustomerForContracts(null);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return dateStr;
        }
    };

    const displayedCustomers = customers.data.filter(
        (c) => includeInactive || c.status === "active",
    );

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: "",
        foreign_name: "",
        phone_number: "",
        email: "",
        id_number: "",
        vat_number: "",
        cr_number: "",
        website: "",
        address: "",
        country_id: countries.length > 0 ? countries[0].id : 1,
        parent_category_id: "",
        category_id: "",
        password: "",
    });

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

    const t = {
        title: __('customers.title'),
        home: __('customers.home'),
        add: __('customers.add'),
        search: __('customers.search'),
        stats: {
            total: __('customers.stats.total'),
            business: __('customers.stats.business'),
            individual: __('customers.stats.individual'),
            noContract: __('customers.stats.noContract'),
            newLast30: __('customers.stats.newLast30'),
        },
        columns: {
            code: __('customers.columns.code'),
            name: __('customers.columns.name'),
            contact: __('customers.columns.contact'),
            tax: __('customers.columns.tax'),
            status: __('customers.columns.status'),
            actions: __('customers.columns.actions'),
        },
        status: {
            active: __('customers.status.active'),
            inactive: __('customers.status.inactive'),
        },
        selection: {
            all: __('customers.selection.all'),
            none: __('customers.selection.none'),
            invert: __('customers.selection.invert'),
        },
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("customers.index"),
            { search: searchQuery },
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

    const selectAll = () =>
        setSelectedItems(displayedCustomers.map((c) => c.id));
    const selectNone = () => setSelectedItems([]);
    const invertSelection = () => {
        const allIds = displayedCustomers.map((c) => c.id);
        setSelectedItems(allIds.filter((id) => !selectedItems.includes(id)));
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCustomerToEdit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (customer) => {
        clearErrors();
        const selectedCat = categories.find(
            (c) => c.id === customer.category_id,
        );
        const parentId = selectedCat ? selectedCat.parent_id : "";

        setData({
            name: customer.name,
            foreign_name: customer.foreign_name || customer.name,
            phone_number: customer.phone_number,
            email: customer.email || "",
            id_number: customer.id_number || "",
            vat_number: customer.vat_number || "",
            cr_number: customer.cr_number || "",
            website: customer.website || "",
            address: customer.address || "",
            country_id:
                customer.country_id ||
                (countries.length > 0 ? countries[0].id : 1),
            parent_category_id: parentId,
            category_id: customer.category_id || "",
        });
        setCustomerToEdit(customer);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (customer) => {
        clearErrors();
        setData("password", "");
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            reset();
            setCustomerToEdit(null);
            setCustomerToDelete(null);
            clearErrors();
        }, 200);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (customerToEdit) {
            put(route("customers.update", customerToEdit.id), {
                onSuccess: () => closeModals(),
            });
        } else {
            post(route("customers.store"), {
                onSuccess: () => closeModals(),
            });
        }
    };

    const deleteCustomer = () => {
        if (!customerToDelete) return;
        destroy(route("customers.destroy", customerToDelete.id), {
            data: { password: data.password },
            onSuccess: () => closeModals(),
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight
                className={cn("h-4 w-4", lang === "ar" && "rotate-180")}
            />
            <span>{lang === "ar" ? "المبيعات" : "Sales"}</span>
            <ChevronRight
                className={cn("h-4 w-4", lang === "ar" && "rotate-180")}
            />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div className="pb-2 space-y-2" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* 1. Page Title & Actions */}
                    <PageHeader
                        icon={UsersRound}
                        title={t.title}
                        description={
                            lang === "ar"
                                ? "إدارة بيانات العملاء والجهات المرتبطة بها"
                                : "Manage customers data and related entities"
                        }
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

                                {/* Add Customer Action (Icon only with Tooltip) */}
                                <Tooltip text={t.add}>
                                    <button
                                        onClick={openCreateModal}
                                        className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover shadow-sm"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </Tooltip>
                            </>
                        }
                    />

                    {/* 2. Stats Cards - Real Data */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
                        {[
                            {
                                label: t.stats.total,
                                value: stats.total ?? customers.total,
                                icon: Users,
                                color: "text-primary",
                                bg: "bg-primary/10",
                            },
                            {
                                label: t.stats.business,
                                value: stats.business ?? 0,
                                icon: TrendingUp,
                                color: "text-indigo-500",
                                bg: "bg-indigo-500/10",
                            },
                            {
                                label: t.stats.noContract,
                                value: stats.withoutContracts ?? 0,
                                icon: Activity,
                                color: "text-amber-500",
                                bg: "bg-amber-500/10",
                            },
                            {
                                label: t.stats.newLast30,
                                value: stats.newLast30 ?? 0,
                                icon: UsersRound,
                                color: "text-emerald-500",
                                bg: "bg-emerald-500/10",
                            },
                        ].map(({ label, value, icon: Icon, color, bg }, i) => (
                            <div
                                key={i}
                                className="border border-border bg-surface px-4 py-3 shadow-sm transition-shadow hover:shadow-md flex items-center justify-between rounded-xl"
                            >
                                {/* Icon + label text */}
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

                                {/* Number */}
                                <div className="text-3xl font-black text-text leading-tight">
                                    {value}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 3. Resource Data Layout */}
                    <div className="rounded-xl border border-border bg-surface shadow-sm flex flex-col">
                        {/* Header: Tools, Search, View Toggle */}
                        <div className="border-b border-border px-3 py-1 bg-surface-muted/30 flex flex-col gap-4">
                            {/* Row 1: Search Box (Start / Right in RTL) VS Selection Tools & View Mode Toggle (End / Left in RTL) */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                                {/* Start Side: Search Box */}
                                <form
                                    onSubmit={handleSearch}
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
                                        placeholder={t.search}
                                    />
                                </form>

                                {/* End Side: Selection Tools & View Mode Toggle */}
                                <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
                                    {/* Selection Tools (Icon-only with Tooltips) */}
                                    <div className="flex items-center gap-1.5">
                                        <Tooltip text={t.selection.all}>
                                            <button
                                                onClick={selectAll}
                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface border border-border text-text hover:bg-surface-muted hover:text-primary transition-colors shadow-sm"
                                            >
                                                <CheckSquare className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text={t.selection.none}>
                                            <button
                                                onClick={selectNone}
                                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-surface border border-border text-text hover:bg-surface-muted hover:text-danger transition-colors shadow-sm"
                                            >
                                                <Square className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text={t.selection.invert}>
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
                                {
                                    id: "all",
                                    label: lang === "ar" ? "الكل" : "All",
                                    value: true,
                                },
                                {
                                    id: "active",
                                    label:
                                        lang === "ar"
                                            ? "النشطين فقط"
                                            : "Active Only",
                                    value: false,
                                },
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() =>
                                        setIncludeInactive(filter.value)
                                    }
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold transition-all rounded-lg border",
                                        includeInactive === filter.value
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
                                if (displayedCustomers.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
                                            <UsersRound className="h-12 w-12 opacity-20 mb-4" />
                                            <p className="text-lg font-medium">
                                                {lang === "ar"
                                                    ? "لم يتم العثور على عملاء"
                                                    : "No customers found"}
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
                                                                        displayedCustomers.length &&
                                                                    displayedCustomers.length >
                                                                        0
                                                                }
                                                                onChange={
                                                                    selectedItems.length ===
                                                                    displayedCustomers.length
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
                                                                {t.columns.code}
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
                                                                {t.columns.name}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <Phone className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {
                                                                    t.columns
                                                                        .contact
                                                                }
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <CreditCard className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {t.columns.tax}
                                                            </span>
                                                        </div>
                                                    </th>
                                                    <th
                                                        scope="col"
                                                        className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                    >
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText className="h-3.5 w-3.5 text-text-muted/80 shrink-0" />
                                                            <span>
                                                                {__('customers.columns.contracts')}
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
                                                                {
                                                                    t.columns
                                                                        .status
                                                                }
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
                                                                {
                                                                    t.columns
                                                                        .actions
                                                                }
                                                            </span>
                                                        </div>
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-surface">
                                                {displayedCustomers.map(
                                                    (customer) => (
                                                        <tr
                                                            key={customer.id}
                                                            className={cn(
                                                                "transition-all duration-150 hover:bg-primary/5 cursor-pointer",
                                                                selectedItems.includes(
                                                                    customer.id,
                                                                )
                                                                    ? "bg-primary/10"
                                                                    : "",
                                                            )}
                                                            onClick={() =>
                                                                toggleSelection(
                                                                    customer.id,
                                                                )
                                                            }
                                                        >
                                                            <td
                                                                className="px-4 py-3 w-12"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedItems.includes(
                                                                        customer.id,
                                                                    )}
                                                                    onChange={() =>
                                                                        toggleSelection(
                                                                            customer.id,
                                                                        )
                                                                    }
                                                                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                                                />
                                                            </td>
                                                            <td
                                                                className="whitespace-nowrap px-4 py-3 text-[12px] font-bold text-text"
                                                                dir="ltr"
                                                            >
                                                                {
                                                                    customer.s_number
                                                                }
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                                                        <UsersRound className="h-3.5 w-3.5" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[12px] font-semibold text-text">
                                                                            {
                                                                                customer.name
                                                                            }
                                                                        </div>
                                                                        <div className="text-[10px] text-text-muted">
                                                                            {customer
                                                                                .category
                                                                                ?.name_ar ??
                                                                                "-"}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <div
                                                                    className="text-[12px] text-text font-medium"
                                                                    dir="ltr"
                                                                >
                                                                    {
                                                                        customer.phone_number
                                                                    }
                                                                </div>
                                                                <div className="text-[10px] text-text-muted mt-0.5">
                                                                    {customer.email ||
                                                                        "-"}
                                                                </div>
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-[12px] text-text">
                                                                {customer.vat_number ||
                                                                    customer.id_number ||
                                                                    "-"}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                                {customer.contracts && customer.contracts.length > 0 ? (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                                                            <FileText className="h-3 w-3 shrink-0" />
                                                                            {customer.contracts.length}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => openContractsModal(customer)} 
                                                                            className="text-xs font-semibold text-primary hover:underline hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                                                                        >
                                                                            {__('customers.more')}
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs text-text-muted font-medium">{__('customers.none')}</span>
                                                                        <a 
                                                                            href={route("contracts.create", { customer_id: customer.id })} 
                                                                            className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 hover:bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                                                                        >
                                                                            <Plus className="h-3 w-3 shrink-0" />
                                                                            <span>{__('customers.add')}</span>
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3">
                                                                <span
                                                                    className={cn(
                                                                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border",
                                                                        customer.status ===
                                                                            "active"
                                                                            ? "bg-success/10 text-success border-success/20"
                                                                            : "bg-danger/10 text-danger border-danger/20",
                                                                    )}
                                                                >
                                                                    {t.status[
                                                                        customer
                                                                            .status
                                                                    ] ??
                                                                        customer.status}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-4 py-3 text-end">
                                                                <div
                                                                    className="flex items-center justify-end gap-1"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <Tooltip text={__('customers.view')}>
                                                                        <a
                                                                            href={route(
                                                                                "customers.show",
                                                                                customer.id,
                                                                            )}
                                                                            className="p-1.5 rounded-md text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors inline-flex"
                                                                        >
                                                                            <Eye className="h-3.5 w-3.5" />
                                                                        </a>
                                                                    </Tooltip>
                                                                    <Tooltip text={__('customers.add_contract')}>
                                                                        <a
                                                                            href={route(
                                                                                "contracts.create",
                                                                                { customer_id: customer.id }
                                                                            )}
                                                                            className="p-1.5 rounded-md text-text-muted hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors inline-flex"
                                                                        >
                                                                            <FilePlus className="h-3.5 w-3.5" />
                                                                        </a>
                                                                    </Tooltip>
                                                                    <Tooltip text={__('customers.edit_action')}>
                                                                        <button
                                                                            onClick={() =>
                                                                                openEditModal(
                                                                                    customer,
                                                                                )
                                                                            }
                                                                            className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                                        >
                                                                            <Edit className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        text={__('customers.delete')}
                                                                        placement="top"
                                                                    >
                                                                        <button
                                                                            onClick={() =>
                                                                                openDeleteModal(
                                                                                    customer,
                                                                                )
                                                                            }
                                                                            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </Tooltip>
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
                                        {displayedCustomers.map((customer) => (
                                            <div
                                                key={customer.id}
                                                className={cn(
                                                    "border border-border rounded-xl p-4 flex flex-col gap-4 relative transition-shadow hover:shadow-md cursor-pointer",
                                                    selectedItems.includes(
                                                        customer.id,
                                                    )
                                                        ? "ring-2 ring-primary bg-primary/5"
                                                        : "bg-surface",
                                                )}
                                                onClick={() =>
                                                    toggleSelection(customer.id)
                                                }
                                            >
                                                <div className="absolute top-4 end-4 flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedItems.includes(
                                                            customer.id,
                                                        )}
                                                        onChange={() => {}} // handled by parent onClick
                                                        className="rounded border-border text-primary focus:ring-primary h-5 w-5 pointer-events-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                        <UsersRound className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-text text-base">
                                                            {customer.name}
                                                        </h3>
                                                        <p className="text-xs text-text-muted">
                                                            {customer.s_number}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-text-muted">
                                                            {lang === "ar"
                                                                ? "الهاتف:"
                                                                : "Phone:"}
                                                        </span>
                                                        <span className="font-medium text-text">
                                                            {
                                                                customer.phone_number
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-text-muted">
                                                            {lang === "ar"
                                                                ? "البريد:"
                                                                : "Email:"}
                                                        </span>
                                                        <span className="font-medium text-text">
                                                            {customer.email ||
                                                                "-"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                                                        <span className="text-text-muted">
                                                            {lang === "ar"
                                                                ? "العقود:"
                                                                : "Contracts:"}
                                                        </span>
                                                        {customer.contracts && customer.contracts.length > 0 ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                                                    <FileText className="h-3 w-3 shrink-0" />
                                                                    {customer.contracts.length}
                                                                </span>
                                                                <button 
                                                                    onClick={() => openContractsModal(customer)} 
                                                                    className="text-xs font-semibold text-primary hover:underline hover:bg-primary/5 px-2 py-1 rounded transition-colors"
                                                                >
                                                                    {lang === "ar" ? "المزيد" : "More"}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs text-text-muted font-medium">{__('customers.none')}</span>
                                                                <a 
                                                                    href={route("contracts.create", { customer_id: customer.id })} 
                                                                    className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 hover:bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                                                                >
                                                                    <Plus className="h-3 w-3 shrink-0" />
                                                                    <span>{__('customers.add')}</span>
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                                                        <span className="text-text-muted">
                                                            {__('customers.columns.status') + ":"}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
                                                                customer.status ===
                                                                    "active"
                                                                    ? "bg-success/10 text-success"
                                                                    : "bg-danger/10 text-danger",
                                                            )}
                                                        >
                                                            {
                                                                t.status[
                                                                    customer
                                                                        .status
                                                                ]
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-end gap-2 border-t border-border pt-2 mt-1">
                                                        <a
                                                            href={route("customers.show", customer.id)}
                                                            className="text-xs text-indigo-600 font-bold hover:underline py-1 px-2 hover:bg-indigo-50 transition-colors rounded"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {__('customers.view')}
                                                        </a>
                                                        <a
                                                            href={route("contracts.create", { customer_id: customer.id })}
                                                            className="text-xs text-emerald-600 font-bold hover:underline py-1 px-2 hover:bg-emerald-50 transition-colors rounded"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {__('customers.add_contract')}
                                                        </a>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditModal(
                                                                    customer,
                                                                );
                                                            }}
                                                            className="text-xs text-primary font-bold hover:underline py-1 px-2 hover:bg-primary/5 transition-colors"
                                                        >
                                                            {lang === "ar"
                                                                ? "تعديل"
                                                                : "Edit"}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDeleteModal(
                                                                    customer,
                                                                );
                                                            }}
                                                            className="text-xs text-danger font-bold hover:underline py-1 px-2 hover:bg-danger/5 transition-colors"
                                                        >
                                                            {lang === "ar"
                                                                ? "حذف"
                                                                : "Delete"}
                                                        </button>
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
                            links={customers.links}
                            total={customers.total}
                            from={customers.from}
                            to={customers.to}
                        />
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={isFormModalOpen} onClose={closeModals} maxWidth="2xl">
                <form onSubmit={submitForm} className="p-6">
                    <h2 className="text-lg font-bold text-text mb-6">
                        {customerToEdit
                            ? lang === "ar"
                                ? "تعديل العميل"
                                : "Edit Customer"
                            : lang === "ar"
                              ? "إضافة عميل جديد"
                              : "Add New Customer"}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Row 1 */}
                        <div>
                            <InputLabel
                                htmlFor="name"
                                value={lang === "ar" ? "الاسم" : "Name"}
                            />
                            <TextInput
                                id="name"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                required
                                autoFocus
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="foreign_name"
                                value={
                                    lang === "ar"
                                        ? "الاسم بلغة أخرى"
                                        : "Foreign Name"
                                }
                            />
                            <TextInput
                                id="foreign_name"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.foreign_name}
                                onChange={(e) =>
                                    setData("foreign_name", e.target.value)
                                }
                            />
                            <InputError
                                message={errors.foreign_name}
                                className="mt-1"
                            />
                        </div>

                        {/* Row 2 */}
                        {(() => {
                            const parentCategories = categories.filter(
                                (c) => !c.parent_id,
                            );
                            const subCategories = categories.filter(
                                (c) => c.parent_id == data.parent_category_id,
                            );
                            return (
                                <>
                                    <div>
                                        <InputLabel
                                            htmlFor="parent_category_id"
                                            value={
                                                lang === "ar"
                                                    ? "التصنيف الرئيسي"
                                                    : "Main Category"
                                            }
                                        />
                                        <select
                                            id="parent_category_id"
                                            className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            value={data.parent_category_id}
                                            onChange={(e) => {
                                                setData((data) => ({
                                                    ...data,
                                                    parent_category_id:
                                                        e.target.value,
                                                    category_id: "", // reset sub-category
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">
                                                {lang === "ar"
                                                    ? "-- اختر التصنيف --"
                                                    : "-- Select Category --"}
                                            </option>
                                            {parentCategories.map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {lang === "ar"
                                                        ? cat.name_ar
                                                        : cat.name_en}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel
                                            htmlFor="category_id"
                                            value={
                                                lang === "ar"
                                                    ? "التصنيف الفرعي"
                                                    : "Sub Category"
                                            }
                                        />
                                        <select
                                            id="category_id"
                                            className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:opacity-50"
                                            value={data.category_id}
                                            onChange={(e) =>
                                                setData(
                                                    "category_id",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            disabled={!data.parent_category_id}
                                        >
                                            <option value="">
                                                {lang === "ar"
                                                    ? "-- اختر التصنيف الفرعي --"
                                                    : "-- Select Sub Category --"}
                                            </option>
                                            {subCategories.map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {lang === "ar"
                                                        ? cat.name_ar
                                                        : cat.name_en}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.category_id}
                                            className="mt-1"
                                        />
                                    </div>
                                </>
                            );
                        })()}

                        {/* Row 3 */}
                        <div>
                            <InputLabel
                                htmlFor="s_number"
                                value={
                                    lang === "ar" ? "مسلسل" : "Serial Number"
                                }
                            />
                            <TextInput
                                id="s_number"
                                type="text"
                                className="mt-1 block w-full bg-surface-muted text-text-muted cursor-not-allowed"
                                value={
                                    customerToEdit
                                        ? customerToEdit.s_number
                                        : "10014000xx"
                                }
                                readOnly
                                disabled
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="country_id"
                                value={
                                    lang === "ar"
                                        ? "الجنسية / الدولة"
                                        : "Nationality / Country"
                                }
                            />
                            <select
                                id="country_id"
                                className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={data.country_id}
                                onChange={(e) =>
                                    setData("country_id", e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    {lang === "ar"
                                        ? "-- اختر --"
                                        : "-- Select --"}
                                </option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {lang === "ar"
                                            ? country.name_ar
                                            : country.name_en}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.country_id}
                                className="mt-1"
                            />
                        </div>

                        {/* Row 4 */}
                        <div>
                            <InputLabel
                                htmlFor="phone_number"
                                value={
                                    lang === "ar" ? "الهاتف" : "Phone Number"
                                }
                            />
                            <TextInput
                                id="phone_number"
                                type="text"
                                className="mt-1 block w-full text-left"
                                value={data.phone_number}
                                onChange={(e) =>
                                    setData("phone_number", e.target.value)
                                }
                                required
                                dir="ltr"
                            />
                            <InputError
                                message={errors.phone_number}
                                className="mt-1"
                            />
                        </div>

                        {/* Conditional Fields based on Parent Category */}
                        {(() => {
                            if (!data.parent_category_id) return null;
                            const parentCat = categories.find(
                                (c) => c.id == data.parent_category_id,
                            );
                            if (!parentCat) return null;
                            const isIndividual =
                                parentCat.name_ar.includes("أفراد") ||
                                parentCat.name_ar.includes("فردي") ||
                                parentCat.name_en
                                    .toLowerCase()
                                    .includes("individual");

                            if (isIndividual) {
                                return (
                                    <div>
                                        <InputLabel
                                            htmlFor="id_number"
                                            value={
                                                lang === "ar"
                                                    ? "الهوية/الإقامة"
                                                    : "ID/Iqama Number"
                                            }
                                        />
                                        <TextInput
                                            id="id_number"
                                            type="text"
                                            className="mt-1 block w-full text-left"
                                            value={data.id_number}
                                            onChange={(e) =>
                                                setData(
                                                    "id_number",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                        />
                                        <InputError
                                            message={errors.id_number}
                                            className="mt-1"
                                        />
                                    </div>
                                );
                            } else {
                                return (
                                    <>
                                        <div>
                                            <InputLabel
                                                htmlFor="email"
                                                value={
                                                    lang === "ar"
                                                        ? "البريد الإلكتروني"
                                                        : "Email"
                                                }
                                            />
                                            <TextInput
                                                id="email"
                                                type="email"
                                                className="mt-1 block w-full text-left"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                dir="ltr"
                                            />
                                            <InputError
                                                message={errors.email}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="website"
                                                value={
                                                    lang === "ar"
                                                        ? "الموقع الإلكتروني"
                                                        : "Website"
                                                }
                                            />
                                            <TextInput
                                                id="website"
                                                type="text"
                                                className="mt-1 block w-full text-left"
                                                value={data.website}
                                                onChange={(e) =>
                                                    setData(
                                                        "website",
                                                        e.target.value,
                                                    )
                                                }
                                                dir="ltr"
                                            />
                                            <InputError
                                                message={errors.website}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="cr_number"
                                                value={
                                                    lang === "ar"
                                                        ? "السجل التجاري"
                                                        : "CR Number"
                                                }
                                            />
                                            <TextInput
                                                id="cr_number"
                                                type="text"
                                                className="mt-1 block w-full text-left"
                                                value={data.cr_number}
                                                onChange={(e) =>
                                                    setData(
                                                        "cr_number",
                                                        e.target.value,
                                                    )
                                                }
                                                dir="ltr"
                                            />
                                            <InputError
                                                message={errors.cr_number}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                htmlFor="vat_number"
                                                value={
                                                    lang === "ar"
                                                        ? "الرقم الضريبي"
                                                        : "VAT Number"
                                                }
                                            />
                                            <TextInput
                                                id="vat_number"
                                                type="text"
                                                className="mt-1 block w-full text-left"
                                                value={data.vat_number}
                                                onChange={(e) =>
                                                    setData(
                                                        "vat_number",
                                                        e.target.value,
                                                    )
                                                }
                                                dir="ltr"
                                            />
                                            <InputError
                                                message={errors.vat_number}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <InputLabel
                                                htmlFor="address"
                                                value={
                                                    lang === "ar"
                                                        ? "العنوان الوطني"
                                                        : "National Address"
                                                }
                                            />
                                            <TextInput
                                                id="address"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        "address",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.address}
                                                className="mt-1"
                                            />
                                        </div>
                                    </>
                                );
                            }
                        })()}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                        <SecondaryButton onClick={closeModals}>
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {lang === "ar" ? "حفظ" : "Save"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={isDeleteModalOpen}
                title={
                    lang === "ar"
                        ? "تأكيد حذف العميل"
                        : "Confirm Customer Deletion"
                }
                message={
                    lang === "ar"
                        ? `هل أنت متأكد من حذف العميل "${customerToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة به.`
                        : `Are you sure you want to delete customer "${customerToDelete?.name}"? This action cannot be undone and all associated data will be removed.`
                }
                confirmLabel={
                    lang === "ar" ? "حذف العميل نهائياً" : "Delete Customer"
                }
                cancelLabel={lang === "ar" ? "إلغاء" : "Cancel"}
                requirePassword={true}
                passwordValue={data.password || ""}
                onPasswordChange={(val) => setData("password", val)}
                passwordError={errors.password}
                onConfirm={deleteCustomer}
                onCancel={closeModals}
                processing={processing}
                type="danger"
            />

            {/* Contracts Modal */}
            <Modal show={selectedCustomerForContracts !== null} onClose={closeContractsModal} maxWidth="2xl">
                <div className="p-6">
                    <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                        <h2 className="text-lg font-bold text-text flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <span>
                                {__('customers.contracts_for', { name: selectedCustomerForContracts?.name })}
                            </span>
                        </h2>
                        <button 
                            onClick={closeContractsModal}
                            className="text-text-muted hover:text-text transition-colors p-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="overflow-x-auto min-h-[200px] max-h-[400px]">
                        {selectedCustomerForContracts?.contracts?.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-text-muted">
                                <FileText className="h-10 w-10 opacity-20 mb-2" />
                                <p>{__('customers.no_contracts')}</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-surface-muted/50">
                                    <tr>
                                        <th className="px-4 py-2 text-start text-xs font-bold text-text-muted">{__('customers.contract_no')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-bold text-text-muted">{__('customers.period')}</th>
                                        <th className="px-4 py-2 text-start text-xs font-bold text-text-muted">{__('customers.columns.status')}</th>
                                        <th className="px-4 py-2 text-end text-xs font-bold text-text-muted">{__('customers.action')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {selectedCustomerForContracts?.contracts?.map((contract) => (
                                        <tr key={contract.id} className="hover:bg-surface-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono font-bold text-text">
                                                #{contract.contract_number}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-muted font-mono">
                                                {formatDate(contract.start_date)} {__('customers.to')} {formatDate(contract.end_date)}
                                            </td>
                                            <td className="px-4 py-3 text-xs">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block",
                                                    contract.status === 'active' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                    contract.status === 'draft' && "bg-slate-50 text-slate-700 border-slate-200",
                                                    contract.status === 'suspended' && "bg-amber-50 text-amber-700 border-amber-200",
                                                    (contract.status === 'ended' || contract.status === 'cancelled') && "bg-rose-50 text-rose-700 border-rose-200"
                                                )}>
                                                    {lang === 'ar' 
                                                        ? {
                                                            active: __('customers.status.active'),
                                                            draft: __('contracts.home.status_draft'),
                                                            suspended: __('contracts.home.status_suspended'),
                                                            ended: __('contracts.home.status_ended'),
                                                            cancelled: __('contracts.home.status_cancelled')
                                                          }[contract.status] || contract.status
                                                        : {
                                                            active: __('customers.status.active'),
                                                            draft: __('contracts.home.status_draft'),
                                                            suspended: __('contracts.home.status_suspended'),
                                                            ended: __('contracts.home.status_ended'),
                                                            cancelled: __('contracts.home.status_cancelled')
                                                          }[contract.status] || contract.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <a 
                                                    href={route('contracts.show', contract.id)}
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline hover:bg-primary/5 px-2.5 py-1 rounded transition-colors"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>{__('customers.view')}</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                        <SecondaryButton onClick={closeContractsModal}>{__('customers.close')}</SecondaryButton>
                        <a 
                            href={route('contracts.create', { customer_id: selectedCustomerForContracts?.id })}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold hover:bg-primary-hover shadow-sm transition-colors"
                        >
                            <Plus className="h-4 w-4 me-1.5 shrink-0" />
                            {__('customers.add_new_contract')}
                        </a>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
