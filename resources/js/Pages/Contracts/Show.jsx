import React, { useState, useEffect } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useLang } from "@/Contexts/LanguageContext";
import {
    FileText,
    Calendar,
    Users,
    Box,
    CreditCard,
    Check,
    ChevronRight,
    User,
    Building2,
    Download,
    Printer,
    Play,
    Pause,
    XCircle,
    Trash2,
    Edit3,
    Plus,
    AlertCircle,
    Clock,
    ShieldAlert,
    FileSpreadsheet,
    Layers,
    Package,
    CheckCircle2,
    Ban,
    DollarSign,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import Tooltip from "@/Components/Tooltip";

const SectionCard = ({ title, icon: Icon, children, action }) => (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-surface-muted/30">
            <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <h2 className="text-sm font-bold text-text">{title}</h2>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div className="flex-1 flex flex-col px-2.5 pt-2.5 pb-1">
            {children}
        </div>
    </div>
);

const Field = ({ label, value, dir }) => (
    <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0">
            {label}
        </p>
        <p
            className={`text-xs font-bold text-text ${dir === "ltr" ? "font-mono" : ""}`}
            dir={dir}
        >
            {value || "�"}
        </p>
    </div>
);

export default function Show({
    contract,
    settings,
    storageItems = [],
    allTerms = [],
    translations,
}) {
    const { lang } = useLang();
    const [activeTab, setActiveTab] = useState("view");

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

    // Inline Edit Form State for Draft Contract
    const {
        data,
        setData,
        put: formPut,
        processing: formProcessing,
        errors,
    } = useForm({
        write_date: contract.write_date || "",
        write_date_hijri: contract.write_date_hijri || "",
        start_date: contract.start_date || "",
        start_date_hijri: contract.start_date_hijri || "",
        mandatory_period: contract.mandatory_period || 12,
        renewal_period: contract.renewal_period || 12,
        introduction: contract.introduction || "",
        preamble: contract.preamble || "",
        contract_title: contract.contract_title || "",
        footer: contract.footer || "",
        season_id: contract.season_id || "",
        contact_id: contract.contact_id || "",
        items:
            contract.items?.map((item) => ({
                id: item.id,
                storage_item_id: item.storage_item_id,
                unit_count: item.unit_count,
                monthly_rent: item.monthly_rent,
                discount: item.discount,
            })) || [],
        term_ids: contract.terms?.map((t) => t.id) || [],
    });

    const getHijriDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(d);
    };

    // Auto-update Hijri dates when Gregorian dates change
    useEffect(() => {
        setData("write_date_hijri", getHijriDate(data.write_date));
    }, [data.write_date]);

    useEffect(() => {
        setData("start_date_hijri", getHijriDate(data.start_date));
    }, [data.start_date]);

    const saveSection = (sectionName) => {
        formPut(route("contracts.update", contract.id), {
            preserveScroll: true,
        });
    };

    // Item editing actions
    const addItemRow = () => {
        setData("items", [
            ...data.items,
            {
                storage_item_id: storageItems[0]?.id || "",
                unit_count: 1,
                monthly_rent: storageItems[0]?.default_price || 0,
                discount: 0,
            },
        ]);
    };

    const removeItemRow = (index) => {
        setData(
            "items",
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItemField = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        if (field === "storage_item_id") {
            const selectedItem = storageItems.find(
                (item) => item.id === parseInt(value),
            );
            if (selectedItem) {
                newItems[index].monthly_rent = selectedItem.default_price || 0;
            }
        }
        setData("items", newItems);
    };

    // Term sorting and editing actions
    const moveTerm = (index, direction) => {
        const newTermIds = [...data.term_ids];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newTermIds.length) return;
        const temp = newTermIds[index];
        newTermIds[index] = newTermIds[targetIndex];
        newTermIds[targetIndex] = temp;
        setData("term_ids", newTermIds);
    };

    const removeTerm = (id) => {
        setData(
            "term_ids",
            data.term_ids.filter((tId) => tId !== id),
        );
    };

    const addTermFromLibrary = (id) => {
        if (!data.term_ids.includes(id)) {
            setData("term_ids", [...data.term_ids, id]);
        }
    };

    const [customTermText, setCustomTermText] = useState("");
    const addCustomTerm = () => {
        if (!customTermText.trim()) return;
        const customId = `custom_${customTermText.trim()}`;
        setData("term_ids", [...data.term_ids, customId]);
        setCustomTermText("");
    };

    const getTermText = (id) => {
        if (typeof id === "string" && id.startsWith("custom_")) {
            return id.substring(7);
        }
        const term =
            allTerms.find((t) => t.id === parseInt(id)) ||
            contract.terms?.find((t) => t.id === parseInt(id));
        return term
            ? lang === "ar"
                ? term.text_ar
                : term.text_en || term.text_ar
            : "";
    };

    // Modals state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [showStatusContactModal, setShowStatusContactModal] = useState(false);
    const [selectedContactAgent, setSelectedContactAgent] = useState(null);
    const [contactActionType, setContactActionType] = useState("suspended"); // suspended, deleted
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Form states
    const [editForm, setEditForm] = useState({
        introduction: contract.introduction || "",
        preamble: contract.preamble || "",
        discount: contract.discount || 0,
    });

    const [periodForm, setPeriodForm] = useState({
        duration_months: 12,
        notes: "",
    });

    const [contactForm, setContactForm] = useState({
        contact_id: "",
    });

    const [statusContactForm, setStatusContactForm] = useState({
        status_reason: "",
    });

    const [invoiceForm, setInvoiceForm] = useState({
        invoice_number: `INV-${contract.contract_number}-${(contract.invoices?.length || 0) + 1}`,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        amount: "",
        notes: "",
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        method: "bank_transfer",
        reference: "",
        notes: "",
        invoice_id: "",
    });

    const [processing, setProcessing] = useState(false);

    // Actions handlers
    const handleAction = (
        routeSuffix,
        method = "post",
        data = {},
        onSuccessModalClose = null,
    ) => {
        if (processing) return;
        setProcessing(true);
        router[method](route(`contracts.${routeSuffix}`, contract.id), data, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                if (onSuccessModalClose) onSuccessModalClose(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const handleContactStatusSubmit = (e) => {
        e.preventDefault();
        if (!selectedContactAgent) return;
        setProcessing(true);
        router.patch(
            route("contracts.contacts.status", [
                contract.id,
                selectedContactAgent.id,
            ]),
            {
                status: contactActionType,
                status_reason: statusContactForm.status_reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    setShowStatusContactModal(false);
                    setStatusContactForm({ status_reason: "" });
                },
                onError: () => setProcessing(false),
            },
        );
    };

    const tabs = [
        {
            id: "view",
            label: t("show.tab_view"),
            icon: FileText,
        },
        {
            id: "periods",
            label: t("show.tab_periods"),
            icon: Calendar,
        },
        {
            id: "contacts",
            label: t("show.tab_delegates"),
            icon: Users,
        },
        {
            id: "financials",
            label: t("show.tab_financials"),
            icon: DollarSign,
        },
        {
            id: "vouchers",
            label: t("show.tab_vouchers"),
            icon: FileSpreadsheet,
        },
        {
            id: "pallets",
            label: t("show.tab_pallets"),
            icon: Layers,
        },
        {
            id: "items",
            label: t("show.tab_stored_items"),
            icon: Package,
        },
    ];

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.get(route("customers.index"))}
            >
                {t("show.breadcrumb_customers")}
            </span>
            <ChevronRight
                className={
                    lang === "ar" ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"
                }
            />
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() =>
                    router.get(route("customers.show", contract.customer_id))
                }
            >
                {contract.customer?.name}
            </span>
            <ChevronRight
                className={
                    lang === "ar" ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"
                }
            />
            <span className="text-primary font-bold">
                {contract.contract_number}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={`${t("show.breadcrumb_contract")} ${contract.contract_number}`}
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8 py-2 space-y-2">
                {/* Header Info & Actions Bar */}
                <div className="rounded-xl border border-border bg-surface shadow-sm p-1 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shadow-inner shrink-0 hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer">
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-extrabold text-text font-mono tracking-tight">
                                    {contract.contract_number}
                                </h1>
                                <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                        contract.status === "active"
                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                            : contract.status === "suspended"
                                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                              : contract.status === "ended"
                                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                : contract.status ===
                                                    "cancelled"
                                                  ? "bg-danger/10 text-danger border border-danger/20"
                                                  : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                    }`}
                                >
                                    {contract.status === "active"
                                        ? t("show.status_active")
                                        : contract.status === "suspended"
                                          ? t("show.status_suspended")
                                          : contract.status === "ended"
                                            ? t("show.status_ended")
                                            : contract.status === "cancelled"
                                              ? t("show.status_cancelled")
                                              : t("show.status_draft")}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted">
                                <span
                                    className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors"
                                    onClick={() =>
                                        router.get(
                                            route(
                                                "customers.show",
                                                contract.customer_id,
                                            ),
                                        )
                                    }
                                >
                                    <User className="h-3.5 w-3.5" />
                                    {contract.customer?.name}
                                </span>
                                <span>�</span>
                                <span
                                    className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors"
                                    onClick={() =>
                                        router.get(
                                            route("settings.seasons.index"),
                                        )
                                    }
                                >
                                    <Calendar className="h-3.5 w-3.5" />
                                    {t("show.season_settings")}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-border">
                        {/* Edit */}
                        <Tooltip text={t("show.edit_contract")}>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(true)}
                                disabled={processing || formProcessing}
                                className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-surface text-primary hover:bg-primary/10 transition-colors shadow-sm"
                            >
                                <Edit3 className="h-4 w-4" />
                            </button>
                        </Tooltip>

                        {/* Activate */}
                        {(contract.status === "draft" ||
                            contract.status === "suspended") && (
                            <Tooltip text={t("show.activate")}>
                                <button
                                    type="button"
                                    onClick={() => handleAction("activate")}
                                    disabled={processing || formProcessing}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                >
                                    <Play className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        )}

                        {/* Suspend */}
                        {contract.status === "active" && (
                            <Tooltip text={t("show.suspend_contract")}>
                                <button
                                    type="button"
                                    onClick={() => handleAction("suspend")}
                                    disabled={processing || formProcessing}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 transition-colors shadow-sm"
                                >
                                    <Pause className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        )}

                        {/* End */}
                        {contract.status === "active" && (
                            <Tooltip text={t("show.end_contract")}>
                                <button
                                    type="button"
                                    onClick={() => handleAction("end")}
                                    disabled={processing || formProcessing}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-blue-500/30 text-blue-600 hover:bg-blue-500/10 transition-colors shadow-sm"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        )}

                        {/* Cancel */}
                        {(contract.status === "draft" ||
                            contract.status === "suspended") && (
                            <Tooltip text={t("show.cancel_contract")}>
                                <button
                                    type="button"
                                    onClick={() => handleAction("cancel")}
                                    disabled={processing || formProcessing}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors shadow-sm"
                                >
                                    <Ban className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        )}

                        {/* Delete */}
                        <Tooltip text={t("show.delete_contract")}>
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm(t("show.delete_confirm"))) {
                                        handleAction("destroy", "delete");
                                    }
                                }}
                                disabled={processing || formProcessing}
                                className="flex items-center justify-center h-8 w-8 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors shadow-sm"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* Tabs Navigation Bar */}
                <div className="bg-surface border border-border rounded-xl shadow-sm flex overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all border-b-2 whitespace-nowrap shrink-0 ${
                                activeTab === tab.id
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50"
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content 1: Contract View */}
                {activeTab === "view" &&
                    (contract.status === "draft" ? (
                        <div className="space-y-2">
                            {/* Timing & Stakeholders Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <SectionCard
                                    title={t("show.timing")}
                                    icon={Calendar}
                                >
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveSection("timing");
                                        }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex-1 grid grid-cols-2 gap-2 content-start">
                                            <div>
                                                <InputLabel
                                                    value={t("show.write_date")}
                                                />
                                                <TextInput
                                                    type="date"
                                                    className="mt-1 w-full text-xs"
                                                    value={data.write_date}
                                                    onChange={(e) =>
                                                        setData(
                                                            "write_date",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={errors.write_date}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    value={t("show.hijri_date")}
                                                />
                                                <TextInput
                                                    type="text"
                                                    className="mt-1 w-full bg-surface-muted text-xs font-mono"
                                                    value={
                                                        data.write_date_hijri
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    value={t("show.start_date")}
                                                />
                                                <TextInput
                                                    type="date"
                                                    className="mt-1 w-full text-xs"
                                                    min={data.write_date}
                                                    value={data.start_date}
                                                    onChange={(e) =>
                                                        setData(
                                                            "start_date",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={errors.start_date}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    value={t(
                                                        "show.hijri_start",
                                                    )}
                                                />
                                                <TextInput
                                                    type="text"
                                                    className="mt-1 w-full bg-surface-muted text-xs font-mono"
                                                    value={
                                                        data.start_date_hijri
                                                    }
                                                    readOnly
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    value={t(
                                                        "show.mandatory_period_months",
                                                    )}
                                                />
                                                <TextInput
                                                    type="number"
                                                    min="1"
                                                    max="12"
                                                    className="mt-1 w-full text-xs"
                                                    value={
                                                        data.mandatory_period
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "mandatory_period",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.mandatory_period
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel
                                                    value={t(
                                                        "show.renewal_period_months",
                                                    )}
                                                />
                                                <TextInput
                                                    type="number"
                                                    min="0"
                                                    className="mt-1 w-full text-xs"
                                                    value={data.renewal_period}
                                                    onChange={(e) =>
                                                        setData(
                                                            "renewal_period",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        errors.renewal_period
                                                    }
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-1 border-t border-border mt-2">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {t("show.save_timing")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </SectionCard>

                                <SectionCard
                                    title={t("show.stakeholders")}
                                    icon={Users}
                                >
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveSection("contact");
                                        }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-text mb-1">
                                                        {t("show.institution")}{" "}
                                                        -{" "}
                                                        {settings?.company_name ||
                                                            "Warehouse OS"}
                                                    </p>
                                                    <p
                                                        className="text-xs text-text-muted font-mono"
                                                        dir="ltr"
                                                    >
                                                        CR:{" "}
                                                        {settings?.company_cr ||
                                                            "1010101010"}{" "}
                                                        | VAT:{" "}
                                                        {settings?.company_vat ||
                                                            "300000000000003"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2 pb-1.5 border-b border-border">
                                                <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-text mb-1">
                                                        {t("show.customer")} -{" "}
                                                        {
                                                            contract.customer
                                                                ?.name
                                                        }
                                                    </p>
                                                    <p
                                                        className="text-xs text-text-muted font-mono"
                                                        dir="ltr"
                                                    >
                                                        {
                                                            contract.customer
                                                                ?.phone_number
                                                        }{" "}
                                                        | CR/ID:{" "}
                                                        {contract.customer
                                                            ?.cr_number ||
                                                            contract.customer
                                                                ?.id_number}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <InputLabel
                                                    value={t(
                                                        "show.authorized_rep",
                                                    )}
                                                />
                                                <select
                                                    className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs"
                                                    value={data.contact_id}
                                                    onChange={(e) =>
                                                        setData(
                                                            "contact_id",
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        {t(
                                                            "show.select_representative",
                                                        )}
                                                    </option>
                                                    {contract.customer?.contacts?.map(
                                                        (c) => (
                                                            <option
                                                                key={c.id}
                                                                value={c.id}
                                                            >
                                                                {c.name} (
                                                                {c.job_title ||
                                                                    "�"}
                                                                )
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <InputError
                                                    message={errors.contact_id}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-1 border-t border-border mt-2">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {t("show.save_representative")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </SectionCard>
                            </div>

                            {/* Intro & Preamble */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <SectionCard
                                    title={t("show.introduction_section")}
                                    icon={FileText}
                                >
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveSection("introduction");
                                        }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex-1 flex flex-col">
                                            <textarea
                                                className="w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[80px] flex-1"
                                                value={data.introduction}
                                                onChange={(e) =>
                                                    setData(
                                                        "introduction",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.introduction}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-1 border-t border-border mt-2">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {t("show.save_introduction")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </SectionCard>
                                <SectionCard
                                    title={t("show.preamble_section")}
                                    icon={FileText}
                                >
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveSection("preamble");
                                        }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex-1 flex flex-col">
                                            <textarea
                                                className="w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[80px] flex-1"
                                                value={data.preamble}
                                                onChange={(e) =>
                                                    setData(
                                                        "preamble",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.preamble}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-1 border-t border-border mt-2">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {t("show.save_preamble")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </SectionCard>
                            </div>

                            {/* Title & Footer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <SectionCard
                                    title={lang === "ar" ? "عنوان العقد" : "Contract Title"}
                                    icon={FileText}
                                >
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveSection("contract_title");
                                        }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex-1 flex flex-col">
                                            <TextInput
                                                type="text"
                                                className="w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs flex-1"
                                                value={data.contract_title}
                                                onChange={(e) =>
                                                    setData(
                                                        "contract_title",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.contract_title}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-1 border-t border-border mt-2">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {lang === "ar" ? "حفظ العنوان" : "Save Title"}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </SectionCard>

                                <SectionCard
                                    title={lang === "ar" ? "تذييل العقد" : "Contract Footer"}
                                    icon={FileText}
                                >
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            saveSection("footer");
                                        }}
                                        className="flex flex-col flex-1"
                                    >
                                        <div className="flex-1 flex flex-col">
                                            <textarea
                                                className="w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[80px] flex-1"
                                                value={data.footer}
                                                onChange={(e) =>
                                                    setData(
                                                        "footer",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.footer}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="flex justify-end pt-1 border-t border-border mt-2">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {lang === "ar" ? "حفظ التذييل" : "Save Footer"}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </SectionCard>
                            </div>

                            {/* Storage Allocation Items */}
                            <SectionCard
                                title={t("show.storage_allocation")}
                                icon={Box}
                            >
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        saveSection("items");
                                    }}
                                    className="space-y-2"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-start">
                                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-3 py-1.5">
                                                        {t("show.item")}
                                                    </th>
                                                    <th className="px-3 py-1.5 text-center w-24">
                                                        {t("show.qty")}
                                                    </th>
                                                    <th className="px-3 py-1.5 w-32">
                                                        {t("show.monthly_rent")}
                                                    </th>
                                                    <th className="px-3 py-1.5 w-28">
                                                        {t("show.discount")}
                                                    </th>
                                                    <th className="px-3 py-1.5 text-end w-36">
                                                        {t(
                                                            "show.total_with_vat",
                                                        )}
                                                    </th>
                                                    <th className="px-3 py-1.5 w-16 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {data.items?.length === 0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan="6"
                                                            className="text-center py-3 text-xs text-text-muted"
                                                        >
                                                            {t(
                                                                "show.no_storage",
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    data.items?.map(
                                                        (item, idx) => {
                                                            const rowSubtotal =
                                                                parseFloat(
                                                                    item.unit_count ||
                                                                        0,
                                                                ) *
                                                                    parseInt(
                                                                        data.mandatory_period ||
                                                                            0,
                                                                    ) *
                                                                    parseFloat(
                                                                        item.monthly_rent ||
                                                                            0,
                                                                    ) -
                                                                parseFloat(
                                                                    item.discount ||
                                                                        0,
                                                                );
                                                            return (
                                                                <tr
                                                                    key={idx}
                                                                    className="hover:bg-surface-muted/30 transition-colors"
                                                                >
                                                                    <td className="px-4 py-2">
                                                                        <select
                                                                            className="w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs"
                                                                            value={
                                                                                item.storage_item_id
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateItemField(
                                                                                    idx,
                                                                                    "storage_item_id",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        >
                                                                            {storageItems.map(
                                                                                (
                                                                                    s,
                                                                                ) => (
                                                                                    <option
                                                                                        key={
                                                                                            s.id
                                                                                        }
                                                                                        value={
                                                                                            s.id
                                                                                        }
                                                                                    >
                                                                                        {lang ===
                                                                                        "ar"
                                                                                            ? s.name_ar
                                                                                            : s.name_en ||
                                                                                              s.name_ar}
                                                                                    </option>
                                                                                ),
                                                                            )}
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <TextInput
                                                                            type="number"
                                                                            min="1"
                                                                            className="w-full text-center text-xs"
                                                                            value={
                                                                                item.unit_count
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateItemField(
                                                                                    idx,
                                                                                    "unit_count",
                                                                                    parseInt(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <TextInput
                                                                            type="number"
                                                                            step="0.01"
                                                                            className="w-full text-xs"
                                                                            value={
                                                                                item.monthly_rent
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateItemField(
                                                                                    idx,
                                                                                    "monthly_rent",
                                                                                    parseFloat(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <TextInput
                                                                            type="number"
                                                                            step="0.01"
                                                                            className="w-full text-xs text-danger"
                                                                            value={
                                                                                item.discount
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateItemField(
                                                                                    idx,
                                                                                    "discount",
                                                                                    parseFloat(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    ) ||
                                                                                        0,
                                                                                )
                                                                            }
                                                                        />
                                                                    </td>
                                                                    <td
                                                                        className="px-4 py-2 text-end text-sm font-mono font-extrabold text-emerald-600"
                                                                        dir="ltr"
                                                                    >
                                                                        {rowSubtotal.toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removeItemRow(
                                                                                    idx,
                                                                                )
                                                                            }
                                                                            className="text-danger hover:text-danger/80 transition-colors p-1"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </tbody>
                                            <tfoot className="bg-surface-muted/50 border-t border-border">
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        className="px-4 py-4 text-end text-xs font-extrabold text-text uppercase tracking-wider"
                                                    >
                                                        {t("show.grand_total")}
                                                    </td>
                                                    <td
                                                        className="px-4 py-4 text-base font-mono font-extrabold text-emerald-600 text-end"
                                                        dir="ltr"
                                                    >
                                                        {data.items
                                                            ?.reduce(
                                                                (sum, item) =>
                                                                    sum +
                                                                    (parseFloat(
                                                                        item.unit_count ||
                                                                            0,
                                                                    ) *
                                                                        parseInt(
                                                                            data.mandatory_period ||
                                                                                0,
                                                                        ) *
                                                                        parseFloat(
                                                                            item.monthly_rent ||
                                                                                0,
                                                                        ) -
                                                                        parseFloat(
                                                                            item.discount ||
                                                                                0,
                                                                        )),
                                                                0,
                                                            )
                                                            .toFixed(2)}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-border">
                                        <SecondaryButton
                                            type="button"
                                            onClick={addItemRow}
                                            className="text-xs py-1 px-3"
                                        >
                                            <Plus className="h-4 w-4 me-1.5" />
                                            {t("show.add_storage_item")}
                                        </SecondaryButton>
                                        <PrimaryButton
                                            disabled={formProcessing}
                                            className="text-xs py-1 px-3"
                                        >
                                            {t("show.save_storage")}
                                        </PrimaryButton>
                                    </div>
                                </form>
                            </SectionCard>

                            {/* Terms */}
                            <SectionCard
                                title={t("show.terms_conditions")}
                                icon={FileText}
                            >
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        saveSection("terms");
                                    }}
                                    className="space-y-4"
                                >
                                    {data.term_ids?.length === 0 ? (
                                        <p className="text-xs text-text-muted text-center py-6">
                                            {t("show.no_terms")}
                                        </p>
                                    ) : (
                                        <ul className="space-y-3">
                                            {data.term_ids?.map((id, index) => (
                                                <li
                                                    key={id}
                                                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-muted/30 border border-border"
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                        <span className="text-xs text-text leading-relaxed">
                                                            {getTermText(id)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index === 0
                                                            }
                                                            onClick={() =>
                                                                moveTerm(
                                                                    index,
                                                                    -1,
                                                                )
                                                            }
                                                            className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                index ===
                                                                data.term_ids
                                                                    .length -
                                                                    1
                                                            }
                                                            onClick={() =>
                                                                moveTerm(
                                                                    index,
                                                                    1,
                                                                )
                                                            }
                                                            className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeTerm(id)
                                                            }
                                                            className="text-danger hover:text-danger/80 transition-colors p-0.5 ms-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="pt-1 border-t border-border space-y-2">
                                        <div className="flex gap-2">
                                            <TextInput
                                                type="text"
                                                placeholder={t(
                                                    "show.write_custom_term",
                                                )}
                                                className="flex-1 text-xs"
                                                value={customTermText}
                                                onChange={(e) =>
                                                    setCustomTermText(
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <SecondaryButton
                                                type="button"
                                                onClick={addCustomTerm}
                                                className="text-xs py-1 px-3"
                                            >
                                                {t("show.add_custom_term")}
                                            </SecondaryButton>
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold text-text mb-2">
                                                {t("show.library_terms")}
                                            </p>
                                            <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2.5 bg-surface-muted/20 space-y-2">
                                                {allTerms.filter(
                                                    (t) =>
                                                        !data.term_ids.includes(
                                                            t.id,
                                                        ),
                                                ).length === 0 ? (
                                                    <p className="text-xs text-text-muted text-center py-4">
                                                        {t(
                                                            "show.all_terms_added",
                                                        )}
                                                    </p>
                                                ) : (
                                                    allTerms
                                                        .filter(
                                                            (t) =>
                                                                !data.term_ids.includes(
                                                                    t.id,
                                                                ),
                                                        )
                                                        .map((term) => (
                                                            <div
                                                                key={term.id}
                                                                onClick={() =>
                                                                    addTermFromLibrary(
                                                                        term.id,
                                                                    )
                                                                }
                                                                className="text-xs text-text hover:bg-primary/5 hover:text-primary p-2 rounded border border-transparent hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between"
                                                            >
                                                                <span>
                                                                    {lang ===
                                                                    "ar"
                                                                        ? term.text_ar
                                                                        : term.text_en ||
                                                                          term.text_ar}
                                                                </span>
                                                                <Plus className="h-3.5 w-3.5 text-primary shrink-0 ms-2" />
                                                            </div>
                                                        ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-1">
                                            <PrimaryButton
                                                disabled={formProcessing}
                                                className="text-xs py-1 px-3"
                                            >
                                                {t("show.save_terms")}
                                            </PrimaryButton>
                                        </div>
                                    </div>
                                </form>
                            </SectionCard>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Timing & Stakeholders Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SectionCard
                                    title={t("show.timing")}
                                    icon={Calendar}
                                >
                                    <div className="grid grid-cols-2 gap-6">
                                        <Field
                                            label={t("show.write_date")}
                                            value={`${contract.write_date} ${contract.write_date_hijri ? `/ ${contract.write_date_hijri}` : ""}`}
                                            dir="ltr"
                                        />
                                        <Field
                                            label={t("show.start_date")}
                                            value={`${contract.start_date} ${contract.start_date_hijri ? `/ ${contract.start_date_hijri}` : ""}`}
                                            dir="ltr"
                                        />
                                        <Field
                                            label={t("show.end_date")}
                                            value={contract.end_date}
                                            dir="ltr"
                                        />
                                        <Field
                                            label={t("show.mandatory_period")}
                                            value={`${contract.mandatory_period} ${t("show.months")}`}
                                        />
                                        <Field
                                            label={t("show.renewal_period")}
                                            value={`${contract.renewal_period} ${t("show.months")}`}
                                        />
                                    </div>
                                </SectionCard>

                                <SectionCard
                                    title={t("show.stakeholders")}
                                    icon={Users}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-text mb-1">
                                                    {t("show.institution")} -{" "}
                                                    {settings?.company_name ||
                                                        "Warehouse OS"}
                                                </p>
                                                <p
                                                    className="text-xs text-text-muted font-mono"
                                                    dir="ltr"
                                                >
                                                    CR:{" "}
                                                    {settings?.company_cr ||
                                                        "1010101010"}{" "}
                                                    | VAT:{" "}
                                                    {settings?.company_vat ||
                                                        "300000000000003"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-text mb-1">
                                                    {t("show.customer")} -{" "}
                                                    {contract.customer?.name}
                                                </p>
                                                <p
                                                    className="text-xs text-text-muted font-mono"
                                                    dir="ltr"
                                                >
                                                    {
                                                        contract.customer
                                                            ?.phone_number
                                                    }{" "}
                                                    | CR/ID:{" "}
                                                    {contract.customer
                                                        ?.cr_number ||
                                                        contract.customer
                                                            ?.id_number}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </SectionCard>
                            </div>

                            {/* Intro & Preamble */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SectionCard
                                    title={t("show.introduction_section")}
                                    icon={FileText}
                                >
                                    <p className="text-xs text-text leading-relaxed whitespace-pre-line">
                                        {contract.introduction ||
                                            t("show.no_introduction")}
                                    </p>
                                </SectionCard>
                                <SectionCard
                                    title={t("show.preamble_section")}
                                    icon={FileText}
                                >
                                    <p className="text-xs text-text-relaxed whitespace-pre-line">
                                        {contract.preamble ||
                                            t("show.no_preamble")}
                                    </p>
                                </SectionCard>
                            </div>

                            {/* Title & Footer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <SectionCard
                                    title={lang === "ar" ? "عنوان العقد" : "Contract Title"}
                                    icon={FileText}
                                >
                                    <p className="text-xs text-text leading-relaxed whitespace-pre-line font-bold">
                                        {contract.contract_title || "—"}
                                    </p>
                                </SectionCard>
                                <SectionCard
                                    title={lang === "ar" ? "تذييل العقد" : "Contract Footer"}
                                    icon={FileText}
                                >
                                    <p className="text-xs text-text leading-relaxed whitespace-pre-line">
                                        {contract.footer || "—"}
                                    </p>
                                </SectionCard>
                            </div>

                            {/* Storage Allocation Items */}
                            <SectionCard
                                title={t("show.storage_allocation")}
                                icon={Box}
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-start">
                                        <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    {t("show.item")}
                                                </th>
                                                <th className="px-4 py-3 text-center w-24">
                                                    {t("show.qty")}
                                                </th>
                                                <th className="px-4 py-3 w-36">
                                                    {t("show.monthly_rent")}
                                                </th>
                                                <th className="px-4 py-3 w-28">
                                                    {t("show.discount")}
                                                </th>
                                                <th className="px-4 py-3 text-end">
                                                    {t("show.total_with_vat")}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {contract.items?.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-surface-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-bold">
                                                        {lang === "ar"
                                                            ? item.storage_item
                                                                  ?.name_ar
                                                            : item.storage_item
                                                                  ?.name_en ||
                                                              item.storage_item
                                                                  ?.name_ar}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-semibold">
                                                        {item.unit_count}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 font-mono"
                                                        dir="ltr"
                                                    >
                                                        {item.monthly_rent}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 font-mono text-danger"
                                                        dir="ltr"
                                                    >
                                                        {item.discount > 0
                                                            ? `-${item.discount}`
                                                            : "0"}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-mono font-extrabold text-emerald-600 text-end"
                                                        dir="ltr"
                                                    >
                                                        {item.subtotal}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-surface-muted/50 border-t border-border">
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="px-4 py-4 text-end text-xs font-extrabold text-text uppercase tracking-wider"
                                                >
                                                    {t("show.grand_total")}
                                                </td>
                                                <td
                                                    className="px-4 py-4 text-base font-mono font-extrabold text-emerald-600 text-end"
                                                    dir="ltr"
                                                >
                                                    {contract.items
                                                        ?.reduce(
                                                            (sum, item) =>
                                                                sum +
                                                                parseFloat(
                                                                    item.subtotal,
                                                                ),
                                                            0,
                                                        )
                                                        .toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </SectionCard>

                            {/* Terms */}
                            <SectionCard
                                title={t("show.terms_conditions")}
                                icon={FileText}
                            >
                                {contract.terms?.length === 0 ? (
                                    <p className="text-xs text-text-muted text-center py-6">
                                        {t("show.no_custom_terms")}
                                    </p>
                                ) : (
                                    <ul className="space-y-3">
                                        {contract.terms?.map((term) => (
                                            <li
                                                key={term.id}
                                                className="flex items-start gap-3 text-xs text-text leading-relaxed p-3 rounded-lg bg-surface-muted/30 border border-border"
                                            >
                                                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                <span>
                                                    {lang === "ar"
                                                        ? term.text_ar
                                                        : term.text_en ||
                                                          term.text_ar}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </SectionCard>

                            {/* Print Action Bar */}
                            <div className="flex justify-end print:hidden">
                                <PrimaryButton
                                    type="button"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4 me-2" />
                                    {t("show.print_contract")}
                                </PrimaryButton>
                            </div>
                        </div>
                    ))}

                {/* Tab Content 2: Periods */}
                {activeTab === "periods" && (
                    <SectionCard
                        title={t("show.periods_extension")}
                        icon={Calendar}
                        action={
                            <PrimaryButton
                                type="button"
                                onClick={() => setShowPeriodModal(true)}
                            >
                                <Plus className="h-4 w-4 me-1.5" />
                                {t("show.extend_contract")}
                            </PrimaryButton>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-20 text-center">
                                            #
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.start_date")}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.end_date")}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.status")}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.notes")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {contract.periods?.map((period) => (
                                        <tr
                                            key={period.id}
                                            className="hover:bg-surface-muted/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-center font-mono font-bold">
                                                {period.period_number}
                                            </td>
                                            <td className="px-4 py-3 font-mono">
                                                {period.start_date}
                                            </td>
                                            <td className="px-4 py-3 font-mono font-bold text-primary">
                                                {period.end_date}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                        period.status ===
                                                        "active"
                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                            : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                                    }`}
                                                >
                                                    {period.status === "active"
                                                        ? t(
                                                              "show.status_active_f",
                                                          )
                                                        : t(
                                                              "show.status_ended_f",
                                                          )}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-muted italic">
                                                {period.notes || "�"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 3: Contacts */}
                {activeTab === "contacts" && (
                    <SectionCard
                        title={t("show.delegates_assigned")}
                        icon={Users}
                        action={
                            <PrimaryButton
                                type="button"
                                onClick={() => setShowAddContactModal(true)}
                            >
                                <Plus className="h-4 w-4 me-1.5" />
                                {t("show.add_contract_delegate")}
                            </PrimaryButton>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">
                                            {t("show.delegate_name")}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.phone_number")}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.authorities")}
                                        </th>
                                        <th className="px-4 py-3">
                                            {t("show.status")}
                                        </th>
                                        <th className="px-4 py-3 text-end">
                                            {t("show.actions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {contract.contract_agents?.map((agent) => (
                                        <tr
                                            key={agent.id}
                                            className="hover:bg-surface-muted/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-bold">
                                                <div>{agent.name}</div>
                                                <div className="text-[11px] text-text-muted font-normal">
                                                    {agent.job_title || "�"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-mono">
                                                {agent.phone_number}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    {agent.can_sign && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                                                            {t("show.sign")}
                                                        </span>
                                                    )}
                                                    {agent.can_withdraw_goods && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
                                                            {t("show.withdraw")}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                        agent.status ===
                                                        "active"
                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                            : agent.status ===
                                                                "suspended"
                                                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                              : "bg-danger/10 text-danger border border-danger/20"
                                                    }`}
                                                >
                                                    {agent.status === "active"
                                                        ? t(
                                                              "show.status_active",
                                                          )
                                                        : agent.status ===
                                                            "suspended"
                                                          ? t(
                                                                "show.status_suspended",
                                                            )
                                                          : t("show.deleted")}
                                                </span>
                                                {agent.status_reason && (
                                                    <p className="text-[11px] text-text-muted italic mt-1">
                                                        {agent.status_reason}
                                                    </p>
                                                )}
                                                {agent.deleted_at_custom && (
                                                    <p className="text-[10px] text-danger font-mono mt-0.5">
                                                        {new Date(
                                                            agent.deleted_at_custom,
                                                        ).toLocaleString()}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-end space-x-1 space-x-reverse">
                                                {agent.status === "active" && (
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedContactAgent(
                                                                agent,
                                                            );
                                                            setContactActionType(
                                                                "suspended",
                                                            );
                                                            setShowStatusContactModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="text-xs py-1 px-2 border-amber-500/30 text-amber-600"
                                                    >
                                                        {t(
                                                            "show.suspend_short",
                                                        )}
                                                    </SecondaryButton>
                                                )}
                                                {agent.status ===
                                                    "suspended" && (
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedContactAgent(
                                                                agent,
                                                            );
                                                            setContactActionType(
                                                                "active",
                                                            );
                                                            handleContactStatusSubmit(
                                                                {
                                                                    preventDefault:
                                                                        () => [],
                                                                },
                                                            );
                                                        }}
                                                        className="text-xs py-1 px-2 border-emerald-500/30 text-emerald-600"
                                                    >
                                                        {t(
                                                            "show.activate_short",
                                                        )}
                                                    </SecondaryButton>
                                                )}
                                                {agent.status !== "deleted" && (
                                                    <DangerButton
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedContactAgent(
                                                                agent,
                                                            );
                                                            setContactActionType(
                                                                "deleted",
                                                            );
                                                            setShowStatusContactModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="text-xs py-1 px-2"
                                                    >
                                                        {t("show.remove")}
                                                    </DangerButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 4: Financials */}
                {activeTab === "financials" && (
                    <div className="space-y-6">
                        {/* Invoices */}
                        <SectionCard
                            title={t("show.financial_dues")}
                            icon={DollarSign}
                            action={
                                <PrimaryButton
                                    type="button"
                                    onClick={() => setShowInvoiceModal(true)}
                                >
                                    <Plus className="h-4 w-4 me-1.5" />
                                    {t("show.issue_financial_invoice")}
                                </PrimaryButton>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">
                                                {t("show.invoice_no")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.issue_date")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.due_date")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.amount")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.paid")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.status")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {contract.invoices?.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="6"
                                                    className="text-center py-6 text-xs text-text-muted"
                                                >
                                                    {t("show.no_invoices")}
                                                </td>
                                            </tr>
                                        ) : (
                                            contract.invoices?.map((inv) => (
                                                <tr
                                                    key={inv.id}
                                                    className="hover:bg-surface-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-mono font-bold text-primary">
                                                        {inv.invoice_number}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">
                                                        {inv.issue_date}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono">
                                                        {inv.due_date}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 font-mono font-bold"
                                                        dir="ltr"
                                                    >
                                                        {inv.amount}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 font-mono font-bold text-emerald-600"
                                                        dir="ltr"
                                                    >
                                                        {inv.paid_amount}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                                inv.status ===
                                                                "paid"
                                                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                    : inv.status ===
                                                                        "partially_paid"
                                                                      ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                                      : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                            }`}
                                                        >
                                                            {inv.status ===
                                                            "paid"
                                                                ? t(
                                                                      "show.status_paid",
                                                                  )
                                                                : inv.status ===
                                                                    "partially_paid"
                                                                  ? lang ===
                                                                    "ar"
                                                                      ? "������ ������"
                                                                      : "Partially Paid"
                                                                  : lang ===
                                                                      "ar"
                                                                    ? "��� ������"
                                                                    : "Unpaid"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* Payments */}
                        <SectionCard
                            title={t("show.cash_payments")}
                            icon={CreditCard}
                            action={
                                <PrimaryButton
                                    type="button"
                                    onClick={() => setShowPaymentModal(true)}
                                >
                                    <Plus className="h-4 w-4 me-1.5" />
                                    {t("show.record_cash_payment")}
                                </PrimaryButton>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">
                                                {t("show.date")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.amount")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.payment_method")}
                                            </th>
                                            <th className="px-4 py-3">
                                                {t("show.reference_notes")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {contract.payments?.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="4"
                                                    className="text-center py-6 text-xs text-text-muted"
                                                >
                                                    {t("show.no_payments")}
                                                </td>
                                            </tr>
                                        ) : (
                                            contract.payments?.map((p) => (
                                                <tr
                                                    key={p.id}
                                                    className="hover:bg-surface-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-mono">
                                                        {p.payment_date}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 font-mono font-extrabold text-emerald-600"
                                                        dir="ltr"
                                                    >
                                                        {p.amount}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold">
                                                        {p.method === "cash"
                                                            ? t("show.cash")
                                                            : p.method ===
                                                                "cheque"
                                                              ? t("show.cheque")
                                                              : t(
                                                                    "show.bank_transfer",
                                                                )}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-text-muted italic">
                                                        {p.reference ||
                                                            p.notes ||
                                                            "�"}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {/* Tab Content 5: Vouchers (Placeholder) */}
                {activeTab === "vouchers" && (
                    <SectionCard
                        title={t("show.vouchers_history")}
                        icon={FileSpreadsheet}
                    >
                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                            <FileSpreadsheet className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="text-sm font-bold text-text mb-1">
                                {t("show.vouchers_ready")}
                            </p>
                            <p className="text-xs text-text-muted max-w-md leading-relaxed">
                                {t("show.vouchers_later")}
                            </p>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 6: Pallets (Placeholder) */}
                {activeTab === "pallets" && (
                    <SectionCard
                        title={t("show.pallets_history")}
                        icon={Layers}
                    >
                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                            <Layers className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="text-sm font-bold text-text mb-1">
                                {t("show.pallets_ready")}
                            </p>
                            <p className="text-xs text-text-muted max-w-md leading-relaxed">
                                {t("show.pallets_later")}
                            </p>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 7: Stored Items (Placeholder) */}
                {activeTab === "items" && (
                    <SectionCard
                        title={t("show.stored_items_history")}
                        icon={Package}
                    >
                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                            <Package className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="text-sm font-bold text-text mb-1">
                                {t("show.stored_items_ready")}
                            </p>
                            <p className="text-xs text-text-muted max-w-md leading-relaxed">
                                {t("show.stored_items_later")}
                            </p>
                        </div>
                    </SectionCard>
                )}
            </div>

            {/* Modal: Edit Contract */}
            <Modal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                maxWidth="lg"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "update",
                            "put",
                            editForm,
                            setShowEditModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {/*  Add to lang keys */}
                        {t("show.edit_contract_data")}
                    </h3>
                    <div>
                        <InputLabel
                            value={
                                // Add to lang keys
                                t("show.introduction_section")
                            }
                        />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={editForm.introduction}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    introduction: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <InputLabel
                            // Add to lang keys
                            value={t("show.preamble_section")}
                        />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={editForm.preamble}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    preamble: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowEditModal(false)}
                        >
                            {/* Add to lang keys */}
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {/* Add to lang keys */}
                            {t("show.save_changes")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Extend Contract Period */}
            <Modal
                show={showPeriodModal}
                onClose={() => setShowPeriodModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "periods.store",
                            "post",
                            periodForm,
                            setShowPeriodModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {/* Add to lang keys */}
                        {t("show.extend_period")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.extension_months")} />
                        <TextInput
                            type="number"
                            min="1"
                            className="mt-1 block w-full"
                            value={periodForm.duration_months}
                            onChange={(e) =>
                                setPeriodForm({
                                    ...periodForm,
                                    duration_months: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <InputLabel value={t("show.notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={periodForm.notes}
                            onChange={(e) =>
                                setPeriodForm({
                                    ...periodForm,
                                    notes: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPeriodModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.confirm_extension")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Contract Contact */}
            <Modal
                show={showAddContactModal}
                onClose={() => setShowAddContactModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "contacts.store",
                            "post",
                            contactForm,
                            setShowAddContactModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.add_contract_delegate")}
                    </h3>
                    <div>
                        <InputLabel
                            value={t("show.select_delegate_from_customer")}
                        />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={contactForm.contact_id}
                            onChange={(e) =>
                                setContactForm({ contact_id: e.target.value })
                            }
                            required
                        >
                            <option value="">
                                {t("show.select_delegate")}
                            </option>
                            {contract.customer?.contacts?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.phone_number})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowAddContactModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.add_delegate")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Contact Status / Remove Reason */}
            <Modal
                show={showStatusContactModal}
                onClose={() => setShowStatusContactModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={handleContactStatusSubmit}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {contactActionType === "deleted"
                            ? t("show.remove_delegate")
                            : t("show.suspend_delegate")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.action_reason")} />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={statusContactForm.status_reason}
                            onChange={(e) =>
                                setStatusContactForm({
                                    status_reason: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowStatusContactModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <DangerButton disabled={processing}>
                            {contactActionType === "deleted"
                                ? t("show.confirm_remove")
                                : t("show.confirm_suspend")}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Invoice */}
            <Modal
                show={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "invoices.store",
                            "post",
                            invoiceForm,
                            setShowInvoiceModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.issue_financial_invoice")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.invoice_no")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={invoiceForm.invoice_number}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    invoice_number: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t("show.issue_date")} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={invoiceForm.issue_date}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        issue_date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={t("show.due_date")} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={invoiceForm.due_date}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        due_date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <InputLabel value={t("show.amount_due")} />
                        <TextInput
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full font-mono"
                            value={invoiceForm.amount}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    amount: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <InputLabel value={t("show.notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={invoiceForm.notes}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    notes: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowInvoiceModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.issue_invoice")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Payment */}
            <Modal
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "payments.store",
                            "post",
                            paymentForm,
                            setShowPaymentModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.record_cash_payment")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.amount_paid")} />
                        <TextInput
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full font-mono"
                            value={paymentForm.amount}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    amount: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t("show.payment_date")} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={paymentForm.payment_date}
                                onChange={(e) =>
                                    setPaymentForm({
                                        ...paymentForm,
                                        payment_date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={t("show.payment_method")} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={paymentForm.method}
                                onChange={(e) =>
                                    setPaymentForm({
                                        ...paymentForm,
                                        method: e.target.value,
                                    })
                                }
                            >
                                <option value="bank_transfer">
                                    {t("show.bank_transfer")}
                                </option>
                                <option value="cash">{t("show.cash")}</option>
                                <option value="cheque">
                                    {t("show.cheque")}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <InputLabel value={t("show.link_invoice")} />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={paymentForm.invoice_id}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    invoice_id: e.target.value,
                                })
                            }
                        >
                            <option value="">{t("show.no_link")}</option>
                            {contract.invoices
                                ?.filter((i) => i.status !== "paid")
                                .map((inv) => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoice_number} ({inv.amount} -
                                        �������: {inv.amount - inv.paid_amount})
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel value={t("show.reference_notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={paymentForm.reference}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    reference: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.record_payment")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* A4 Print View Container (Hidden on screen, visible on print) */}
            <div
                className="hidden print:block print:w-full print:bg-white print:text-black print:p-8 font-sans"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-black pb-6 mb-6">
                    {/* Right: Company Info */}
                    <div className="space-y-1 max-w-xs">
                        <h2 className="text-lg font-extrabold text-black">
                            {settings?.company_name ||
                                "����� ���� ��� ���� �������"}
                        </h2>
                        <p className="text-xs text-gray-700 font-bold">
                            {settings?.company_slogan ||
                                "����� - ����� - ����� - ����� - �����"}
                        </p>
                        <div className="text-[11px] text-gray-600 space-y-0.5 pt-1 font-mono">
                            <p>
                                {t("show.cr_short")}{" "}
                                {settings?.company_cr || "1010101010"}
                            </p>
                            <p>
                                {t("show.vat_short")}{" "}
                                {settings?.company_vat || "300000000000003"}
                            </p>
                            {settings?.company_license && (
                                <p>
                                    {t("show.license")}{" "}
                                    {settings?.company_license}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Center: Title & Serial */}
                    <div className="flex flex-col items-center justify-center pt-2">
                        <div className="border-2 border-black px-6 py-2 rounded font-extrabold text-lg tracking-wide uppercase bg-gray-50">
                            {t("show.contract_title")}
                        </div>
                        <div className="mt-2 text-xs font-mono font-bold text-gray-800">
                            {t("show.contract_no")} {contract.contract_number}
                        </div>
                        <div className="text-[11px] font-mono text-gray-600">
                            {t("show.date_label")} {contract.write_date}{" "}
                            {contract.write_date_hijri
                                ? `(${contract.write_date_hijri})`
                                : ""}
                        </div>
                    </div>

                    {/* Left: Logo & Quality System */}
                    <div className="flex flex-col items-end space-y-3">
                        {settings?.company_logo ? (
                            <img
                                src={"/storage/" + settings.company_logo}
                                alt="Company Logo"
                                className="h-16 w-auto object-contain"
                            />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center border border-gray-300 rounded bg-gray-50 text-gray-400">
                                <Building2 className="h-8 w-8" />
                            </div>
                        )}

                        {/* Quality System Box (Conditional) */}
                        {(settings?.quality_system === "1" ||
                            settings?.quality_system === true) && (
                            <div className="border border-black p-2 rounded text-[10px] font-mono text-right bg-gray-50">
                                <p className="font-bold text-black border-b border-gray-200 pb-0.5 mb-0.5">
                                    {t("show.qms_data")}
                                </p>
                                <p>
                                    {t("show.issue_no")}{" "}
                                    {settings?.issue_no || "REV-01"}
                                </p>
                                <p>
                                    {t("show.issue_date_label")}{" "}
                                    {settings?.issue_date || "2026-01-01"}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Introduction & Preamble */}
                <div className="space-y-4 mb-6 text-xs leading-relaxed text-black">
                    {contract.introduction && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <h3 className="font-bold text-black mb-1">
                                {t("show.introduction_label")}
                            </h3>
                            <p className="whitespace-pre-line">
                                {contract.introduction}
                            </p>
                        </div>
                    )}

                    {/* Parties */}
                    <div className="border-l-4 border-r-4 border-black p-4 bg-gray-50/50 my-4 rounded">
                        <h3 className="font-bold text-sm text-black mb-3 border-b border-gray-200 pb-1">
                            {t("show.contract_parties")}
                        </h3>
                        <div className="grid grid-cols-2 gap-6 text-xs">
                            <div className="space-y-1.5">
                                <p className="font-extrabold text-black text-sm">
                                    {t("show.first_party_label")}
                                </p>
                                <p className="font-bold">
                                    {settings?.company_name ||
                                        "����� ���� ��� ���� �������"}
                                </p>
                                <p className="text-gray-600 font-mono">
                                    {t("show.cr_full")}{" "}
                                    {settings?.company_cr || "1010101010"}
                                </p>
                                <p className="text-gray-600 font-mono">
                                    {t("show.vat")}{" "}
                                    {settings?.company_vat || "300000000000003"}
                                </p>
                                <p className="text-gray-700">
                                    {t("show.represented_by")}{" "}
                                    <span className="font-bold">
                                        {settings?.company_gm ||
                                            t("show.general_manager")}
                                    </span>
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="font-extrabold text-black text-sm">
                                    {t("show.second_party_label")}
                                </p>
                                <p className="font-bold">
                                    {contract.customer?.name}
                                </p>
                                <p className="text-gray-600 font-mono">
                                    {t("show.phone")}{" "}
                                    <span dir="ltr">
                                        {contract.customer?.phone_number}
                                    </span>
                                </p>
                                <p className="text-gray-600 font-mono">
                                    {t("show.cr_id")}{" "}
                                    {contract.customer?.cr_number ||
                                        contract.customer?.id_number ||
                                        "�"}
                                </p>
                                <p className="text-gray-700">
                                    {t("show.represented_by")}{" "}
                                    <span className="font-bold">
                                        {contract.contract_agents?.[0]?.name ||
                                            contract.customer?.name}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {contract.preamble && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <h3 className="font-bold text-black mb-1">
                                {t("show.preamble_label")}
                            </h3>
                            <p className="whitespace-pre-line">
                                {contract.preamble}
                            </p>
                        </div>
                    )}
                </div>

                {/* Storage Items Table */}
                <div className="mb-6">
                    <h3 className="font-bold text-xs text-black uppercase tracking-wider mb-2">
                        {t("show.storage_table")}
                    </h3>
                    <table className="w-full text-xs text-start border-collapse border border-black">
                        <thead className="bg-gray-100 text-black uppercase font-bold">
                            <tr>
                                <th className="border border-black px-3 py-2">
                                    {t("show.item")}
                                </th>
                                <th className="border border-black px-3 py-2 text-center w-16">
                                    {t("show.qty")}
                                </th>
                                <th className="border border-black px-3 py-2 text-center w-28">
                                    {t("show.monthly_rent")}
                                </th>
                                <th className="border border-black px-3 py-2 text-center w-24">
                                    {t("show.discount")}
                                </th>
                                <th className="border border-black px-3 py-2 text-end w-32">
                                    {t("show.total_with_vat")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {contract.items?.map((item) => (
                                <tr key={item.id}>
                                    <td className="border border-black px-3 py-2 font-bold">
                                        {lang === "ar"
                                            ? item.storage_item?.name_ar
                                            : item.storage_item?.name_en ||
                                              item.storage_item?.name_ar}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-center font-mono">
                                        {item.unit_count}
                                    </td>
                                    <td
                                        className="border border-black px-3 py-2 text-center font-mono"
                                        dir="ltr"
                                    >
                                        {item.monthly_rent}
                                    </td>
                                    <td
                                        className="border border-black px-3 py-2 text-center font-mono text-red-700"
                                        dir="ltr"
                                    >
                                        {item.discount > 0
                                            ? `-${item.discount}`
                                            : "0"}
                                    </td>
                                    <td
                                        className="border border-black px-3 py-2 text-end font-mono font-bold"
                                        dir="ltr"
                                    >
                                        {item.subtotal}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                            <tr>
                                <td
                                    colSpan="4"
                                    className="border border-black px-3 py-2 text-end uppercase"
                                >
                                    {t("show.grand_total")}
                                </td>
                                <td
                                    className="border border-black px-3 py-2 text-end font-mono text-sm"
                                    dir="ltr"
                                >
                                    {contract.items
                                        ?.reduce(
                                            (sum, item) =>
                                                sum + parseFloat(item.subtotal),
                                            0,
                                        )
                                        .toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-12">
                    <h3 className="font-bold text-xs text-black uppercase tracking-wider mb-3">
                        {t("show.terms_conditions")}
                    </h3>
                    {contract.terms?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">
                            {t("show.no_custom_terms")}
                        </p>
                    ) : (
                        <ol className="list-decimal list-inside space-y-2 text-xs text-black leading-relaxed">
                            {contract.terms?.map((term) => (
                                <li key={term.id} className="pl-1 pr-1">
                                    <span className="font-medium">
                                        {lang === "ar"
                                            ? term.text_ar
                                            : term.text_en || term.text_ar}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* Signatures Footer */}
                <div className="border-t-2 border-black pt-8 mt-8 grid grid-cols-2 gap-12 text-xs text-black">
                    <div className="space-y-4">
                        <p className="font-extrabold text-sm border-b border-gray-300 pb-1">
                            {t("show.first_party")}
                        </p>
                        <p>
                            <span className="font-bold">
                                {t("show.company")}
                            </span>{" "}
                            {settings?.company_name ||
                                "����� ���� ��� ���� �������"}
                        </p>
                        <p>
                            <span className="font-bold">{t("show.name")}</span>{" "}
                            {settings?.company_gm || t("show.general_manager")}
                        </p>
                        <p className="pt-4">
                            <span className="font-bold">
                                {t("show.signature")}
                            </span>{" "}
                            ___________________________
                        </p>
                        <p className="pt-2">
                            <span className="font-bold">
                                {t("show.official_stamp")}
                            </span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <p className="font-extrabold text-sm border-b border-gray-300 pb-1">
                            {t("show.second_party")}
                        </p>
                        <p>
                            <span className="font-bold">
                                {t("show.customer_label")}
                            </span>{" "}
                            {contract.customer?.name}
                        </p>
                        <p>
                            <span className="font-bold">{t("show.name")}</span>{" "}
                            {contract.contract_agents?.[0]?.name ||
                                contract.customer?.name}
                        </p>
                        <p className="pt-4">
                            <span className="font-bold">
                                {t("show.signature")}
                            </span>{" "}
                            ___________________________
                        </p>
                        <p className="pt-2">
                            <span className="font-bold">
                                {t("show.date_label")}
                            </span>{" "}
                            ____ / ____ / ________
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
