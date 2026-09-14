import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Edit,
    Trash2,
    Printer,
    FileText,
    CheckCircle2,
    Lock,
    Unlock,
    Clock,
    User,
    ArrowRight,
    ShieldAlert,
    Calendar,
    Truck,
    Briefcase,
    Activity,
    AlertCircle,
    X,
} from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";

export default function Show({ reception }) {
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

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;
    const getPalletSizeDisplay = (pallet) => {
        if (!pallet || !pallet.size) return "";
        const sizeMap = {
            'كبيرة': __("receptions.show.large"),
            'وسط': __("receptions.show.medium"),
            'صغيرة': __("receptions.show.small"),
            'خشب': __("receptions.show.wood"),
            'بلاستيك': __("receptions.show.plastic"),
        };
        return sizeMap[pallet.size] || pallet.size;
    };
    const { flash } = usePage().props;

    // Modals visibility state
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isReopenModalOpen, setReopenModalOpen] = useState(false);
    const [isApproveModalOpen, setApproveModalOpen] = useState(false);

    // Password fields
    const [securePassword, setSecurePassword] = useState("");
    const [reopenReason, setReopenReason] = useState("");

    // Errors
    const [errorMsg, setErrorMsg] = useState("");
    const [processingAction, setProcessingAction] = useState(false);

    // Action execution helpers
    const handleApprove = () => {
        setProcessingAction(true);
        router.post(
            route("receptions.approve", reception.id),
            {},
            {
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setProcessingAction(false);
                },
                onError: (errs) => {
                    setProcessingAction(false);
                    setErrorMsg(
                        errs.error ||
                        __("receptions.show.failed_to_approve"),
                    );
                },
            },
        );
    };

    const totalReception =
        reception.inventory_entries?.reduce(
            (sum, entry) => sum + parseFloat(entry.quantity_in || 0),
            0,
        ) || 0;
    const totalDispatch =
        reception.inventory_entries?.reduce(
            (sum, entry) => sum + parseFloat(entry.quantity_out || 0),
            0,
        ) || 0;

    const handleReopen = (e) => {
        e.preventDefault();
        setErrorMsg("");
        setProcessingAction(true);

        router.post(
            route("receptions.reopen", reception.id),
            {
                password: securePassword,
                reason: reopenReason,
            },
            {
                onSuccess: () => {
                    setReopenModalOpen(false);
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
                        setErrorMsg(
                            __("receptions.show.failed_to_reopen"),
                        );
                    }
                },
            },
        );
    };

    const handleDelete = (e) => {
        e.preventDefault();
        setErrorMsg("");
        setProcessingAction(true);

        router.post(
            route("receptions.destroy", reception.id),
            {
                _method: "DELETE",
                password: securePassword,
            },
            {
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setSecurePassword("");
                    setProcessingAction(false);
                },
                onError: (errs) => {
                    setProcessingAction(false);
                    if (errs.error) {
                        setErrorMsg(errs.error);
                    } else if (errs.password) {
                        setErrorMsg(errs.password);
                    } else {
                        setErrorMsg(
                            __("receptions.show.failed_to_delete"),
                        );
                    }
                },
            },
        );
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${__("receptions.show.str_9")}`}
            />
            <Link
                href={route("receptions.index")}
                className="hover:text-primary transition-colors"
            >
                {__("receptions.show.reception_vouchers")}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${__("receptions.show.str_9")}`}
            />
            <span className="text-primary font-medium">
                {reception.serial_number}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    __("receptions.show.reception_voucher_details_rece", { serial: reception.serial_number })
                }
            />

            <div
                className="max-w-6xl mx-auto pb-12 main-stack-y"
                dir={__("receptions.show.ltr")}
            >
                {/* Session Alerts */}
                {flash?.success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 p-3 rounded-none text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger p-3 rounded-none text-xs font-bold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Page Header */}
                <PageHeader
                    icon={FileText}
                    title={
                        <div className="flex items-center gap-3">
                            <span className="font-extrabold text-lg text-text">
                                {__("receptions.show.reception_receipt_reception_se", { serial: reception.serial_number })}
                            </span>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-none font-bold border ${reception.status === "approved"
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                    : "bg-amber-500/10 text-amber-600 border-amber-200"
                                    }`}
                            >
                                {reception.status === "approved" ? (
                                    <span className="flex items-center gap-0.5">
                                        <Lock className="h-2.5 w-2.5" />
                                        {__("receptions.show.approved_locked")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-0.5">
                                        <Unlock className="h-2.5 w-2.5" />
                                        {__("receptions.show.draft")}
                                    </span>
                                )}
                            </span>
                        </div>
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {__("receptions.show.created_by_reception_creator_n", {
                                creator: reception.creator?.name || __("receptions.show.system"),
                                date: new Date(reception.created_at).toLocaleString(__("receptions.show.en_us"))
                            })}
                        </p>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-1.5">
                            {reception.status === "draft" && (
                                <>
                                    <Tooltip
                                        text={__("receptions.show.edit_voucher")}
                                    >
                                        <Link
                                            href={route(
                                                "receptions.edit",
                                                reception.id,
                                            )}
                                            className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                        >
                                            <Edit className="h-4 w-4" />
                                            {showButtonText && (
                                                <span>
                                                    {__("receptions.show.edit")}
                                                </span>
                                            )}
                                        </Link>
                                    </Tooltip>
                                    <Tooltip
                                        text={__("receptions.show.approve_voucher")}
                                    >
                                        <button
                                            onClick={() => {
                                                if (!reception.customer_id || !reception.contract_id || !reception.period_id || (reception.inventory_entries?.length || 0) === 0) {
                                                    setErrorMsg(__("receptions.show.incomplete_data_for_approval"));
                                                    return;
                                                }
                                                setErrorMsg("");
                                                setApproveModalOpen(true);
                                            }}
                                            className={`h-[30px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {showButtonText && (
                                                <span>
                                                    {__("receptions.show.approve")}
                                                </span>
                                            )}
                                        </button>
                                    </Tooltip>

                                    {/* Cancel Voucher Button for Drafts with items */}
                                    {(reception.inventory_entries?.length || 0) > 0 && (
                                        <Tooltip
                                            text={__("receptions.show.cancel_voucher")}
                                        >
                                            <button
                                                onClick={() => {
                                                    setErrorMsg("");
                                                    setSecurePassword("");
                                                    setCancelModalOpen(true);
                                                }}
                                                className={`h-[30px] bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                            >
                                                <X className="h-4 w-4" />
                                                {showButtonText && (
                                                    <span>
                                                        {__("receptions.show.cancel")}
                                                    </span>
                                                )}
                                            </button>
                                        </Tooltip>
                                    )}
                                </>
                            )}

                            {reception.status === "approved" && (
                                <Tooltip
                                    text={__("receptions.show.reopen_voucher")}
                                >
                                    <button
                                        onClick={() => {
                                            setErrorMsg("");
                                            setSecurePassword("");
                                            setReopenReason("");
                                            setReopenModalOpen(true);
                                        }}
                                        className={`h-[30px] bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                    >
                                        <Unlock className="h-4 w-4" />
                                        {showButtonText && (
                                            <span>
                                                {__("receptions.show.reopen")}
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip text={__("receptions.show.print")}>
                                <a
                                    href={route(
                                        "receptions.print",
                                        reception.id,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <Printer className="h-4 w-4" />
                                    {showButtonText && (
                                        <span>
                                            {__("receptions.show.print")}
                                        </span>
                                    )}
                                </a>
                            </Tooltip>

                            <Tooltip
                                text={
                                    reception.status === "approved" || (reception.inventory_entries?.length || 0) > 0
                                        ? __("receptions.show.blocked_cannot_delete_approved")
                                        : __("receptions.show.delete_voucher")
                                }
                            >
                                <button
                                    onClick={() => {
                                        if (reception.status === "approved") {
                                            setErrorMsg(__("receptions.show.security_error_cannot_delete_a"));
                                            return;
                                        }
                                        if ((reception.inventory_entries?.length || 0) > 0) {
                                            setErrorMsg(__("receptions.show.security_error_cannot_delete_b"));
                                            return;
                                        }
                                        setErrorMsg("");
                                        setSecurePassword("");
                                        setDeleteModalOpen(true);
                                    }}
                                    disabled={reception.status === "approved" || (reception.inventory_entries?.length || 0) > 0}
                                    className={`h-[30px] font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${reception.status === "approved" || (reception.inventory_entries?.length || 0) > 0
                                        ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                                        : "bg-danger hover:bg-danger-hover text-white"
                                        } ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {showButtonText && (
                                        <span>
                                            {__("receptions.show.delete")}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>

                            <div className="h-6 w-px bg-border hidden lg:block mx-1" />

                            <Tooltip
                                text={
                                    __("receptions.show.back_to_list")
                                }
                            >
                                <Link
                                    href={route("receptions.index")}
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <ArrowRight
                                        className={`h-4 w-4 ${__("receptions.show.rotate_180")}`}
                                    />
                                    {showButtonText && (
                                        <span>
                                            {__("receptions.show.back")}
                                        </span>
                                    )}
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Primary Data Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General Header Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header details card */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("receptions.show.voucher_customer_information")}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("receptions.show.customer")}
                                    </span>
                                    <span className="text-text font-bold text-sm">
                                        {reception.customer?.name}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("receptions.show.linked_contract")}
                                    </span>
                                    {reception.contract ? (
                                        <Link
                                            href={route(
                                                "contracts.show",
                                                reception.contract_id,
                                            )}
                                            className="text-primary hover:underline font-bold font-mono text-sm"
                                        >
                                            {reception.contract.contract_number}
                                        </Link>
                                    ) : (
                                        <span className="text-text-muted font-bold">
                                            —
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("receptions.show.period")}
                                    </span>
                                    <span className="text-text font-semibold">
                                        {__("receptions.show.period")}{" "}
                                        {reception.period?.period_number}{" "}
                                        <span className="text-text-muted font-mono font-normal">
                                            ({reception.period?.start_date}{" "}
                                            {__("receptions.show.to")}{" "}
                                            {reception.period?.end_date})
                                        </span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("receptions.show.actual_date")}
                                    </span>
                                    <span className="text-text font-bold font-mono text-sm">
                                        {reception.reception_date
                                            ? new Date(
                                                reception.reception_date,
                                            ).toLocaleDateString(
                                                __("receptions.show.en_us"),
                                            )
                                            : "—"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("receptions.show.customer_representative")}
                                    </span>
                                    {reception.representative ? (
                                        <span className="text-text font-semibold">
                                            {reception.representative.name}{" "}
                                            <span className="text-text-muted font-mono font-normal">
                                                (
                                                {
                                                    reception.representative
                                                        .phone_number
                                                }
                                                )
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-text-muted font-semibold">
                                            {__("receptions.show.none")}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("receptions.show.last_updated_by")}
                                    </span>
                                    <span className="text-text font-semibold">
                                        {reception.editor?.name || "—"}{" "}
                                        <span className="text-text-muted font-mono font-normal text-[10px]">
                                            (
                                            {new Date(
                                                reception.updated_at,
                                            ).toLocaleString(
                                                __("receptions.show.en_us"),
                                            )}
                                            )
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items Table details */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Activity className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("receptions.show.items_pallets_list")}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted/50 text-text-muted font-bold border-b border-border">
                                        <tr>
                                            <th className="px-3 py-2 text-start">
                                                {__("receptions.show.row")}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {__("receptions.show.inventory_item")}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {__("receptions.show.variant")}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {__("receptions.show.pallet_number")}
                                            </th>
                                            <th className="px-3 py-2 text-end">
                                                {__("receptions.show.qty_received")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {reception.inventory_entries?.map(
                                            (entry, index) => (
                                                <tr
                                                    key={entry.id}
                                                    className="hover:bg-surface-muted/10"
                                                >
                                                    <td className="px-3 py-2.5 font-mono text-text-muted">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-bold text-text">
                                                        {displayBilingual(
                                                            entry.inventory_item
                                                                ?.name,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-text-muted">
                                                        {displayBilingual(
                                                            entry.variant?.name,
                                                        )}
                                                        {entry.variant?.quality
                                                            ? ` (${displayBilingual(entry.variant.quality)})`
                                                            : ""}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-mono font-bold text-primary">
                                                        {entry.pallet
                                                            ?.pallet_number
                                                            ? `${entry.pallet.pallet_number} / ${getPalletSizeDisplay(entry.pallet)}`
                                                            : "—"}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-mono font-extrabold text-end text-emerald-600">
                                                        {Math.round(
                                                            parseFloat(
                                                                entry.quantity_in,
                                                            ) || 0,
                                                        ).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 flex flex-col items-end gap-2 text-xs text-text-muted">
                                <div className="font-semibold text-sm text-text">
                                    {__("receptions.show.total_in")}{" "}
                                    {Math.round(
                                        totalReception,
                                    ).toLocaleString()}
                                </div>
                                {totalDispatch > 0 && (
                                    <div className="font-semibold text-sm text-text">
                                        {__("receptions.show.total_out")}{" "}
                                        {Math.round(
                                            totalDispatch,
                                        ).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Details (Driver + History) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Driver details card */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Truck className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("receptions.show.carrier_driver_info")}
                                </h3>
                            </div>

                            {reception.driver ? (
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("receptions.show.driver_name")}
                                        </span>
                                        <span className="text-text font-bold">
                                            {reception.driver.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("receptions.show.phone_number")}
                                        </span>
                                        <span className="text-text font-mono font-bold">
                                            {reception.driver.phone_number ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("receptions.show.id_iqama_no")}
                                        </span>
                                        <span className="text-text font-mono font-bold">
                                            {reception.driver.id_number || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("receptions.show.plate_number")}
                                        </span>
                                        <span className="text-text font-bold font-mono">
                                            {reception.driver.vehicle_plate ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("receptions.show.vehicle_type")}
                                        </span>
                                        <span className="text-text font-semibold">
                                            {reception.driver.vehicle_type ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("receptions.show.license_no")}
                                        </span>
                                        <span className="text-text font-mono">
                                            {reception.driver.license_number ||
                                                "—"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs text-text-muted">
                                    {__("receptions.show.no_carrier_driver_assigned")}
                                </div>
                            )}
                        </div>

                        {/* History and Logs Card */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Clock className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("receptions.show.modification_log")}
                                </h3>
                            </div>

                            {reception.history &&
                                reception.history.length > 0 ? (
                                <div className="space-y-4 relative border-s border-border ps-4 text-xs rtl:border-s-0 rtl:border-e rtl:pe-4">
                                    {reception.history.map((log, idx) => (
                                        <div key={idx} className="relative">
                                            <span className="absolute -left-[22px] rtl:-right-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface" />
                                            <div className="font-mono text-[10px] text-text-muted">
                                                {new Date(
                                                    log.date,
                                                ).toLocaleString(
                                                    __("receptions.show.en_us"),
                                                )}
                                            </div>
                                            <div className="font-bold text-text mt-0.5">
                                                {log.user}
                                            </div>
                                            <div className="text-text-muted mt-1 bg-surface-muted/30 p-2 border border-border/50">
                                                {log.reason}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs text-text-muted">
                                    {__("receptions.show.no_previous_adjustments_record")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Confirm Deletion */}
            <Modal
                show={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={handleDelete}
                    className="p-6 space-y-4 text-start"
                    dir={__("receptions.show.ltr")}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <ShieldAlert className="h-6 w-6 text-danger animate-bounce" />
                        <h3 className="font-bold text-lg text-text">
                            {__("receptions.show.confirm_voucher_deletion")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {__("receptions.show.you_are_about_to_permanently_d")}
                    </p>

                    <div className="bg-surface-muted/50 p-3 border border-border text-xs font-mono rounded-none">
                        <div>
                            <span className="font-bold text-text-muted">
                                {__("receptions.show.voucher_serial")}
                            </span>
                            <span className="text-text font-bold">
                                {reception.serial_number}
                            </span>
                        </div>
                        <div className="mt-1">
                            <span className="font-bold text-text-muted">
                                {__("receptions.show.customer")}
                            </span>
                            <span className="text-text font-bold">
                                {reception.customer?.name}
                            </span>
                        </div>
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="delete_password"
                            value={
                                __("receptions.show.secure_operations_password")
                            }
                        />
                        <TextInput
                            id="delete_password"
                            type="password"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={securePassword}
                            onChange={(e) => setSecurePassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {errorMsg && (
                            <p className="text-xs text-danger mt-1 font-bold">
                                {errorMsg}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={__("receptions.show.cancel")}>
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {__("receptions.show.cancel")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                __("receptions.show.confirm_delete")
                            }
                        >
                            <button
                                type="submit"
                                disabled={processingAction}
                                className={`bg-danger hover:bg-danger-hover text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"} disabled:opacity-50`}
                            >
                                <Trash2 className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? __("receptions.show.deleting")
                                            : __("receptions.show.confirm_delete")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </form>
            </Modal>

            {/* Modal: Confirm Reopen */}
            <Modal
                show={isReopenModalOpen}
                onClose={() => setReopenModalOpen(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={handleReopen}
                    className="p-6 space-y-4 text-start"
                    dir={__("receptions.show.ltr")}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Unlock className="h-6 w-6 text-amber-500 animate-pulse" />
                        <h3 className="font-bold text-lg text-text">
                            {__("receptions.show.reopen_approved_voucher")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {__("receptions.show.reopening_will_return_the_vouc")}
                    </p>

                    <div>
                        <InputLabel
                            htmlFor="reopen_reason"
                            value={
                                __("receptions.show.reason_for_reopening")
                            }
                        />
                        <TextInput
                            id="reopen_reason"
                            type="text"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder={
                                __("receptions.show.e_g_correcting_incorrect_pal")
                            }
                            required
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="reopen_password"
                            value={
                                __("receptions.show.secure_operations_password")
                            }
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
                        {errorMsg && (
                            <p className="text-xs text-danger mt-1 font-bold">
                                {errorMsg}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={__("receptions.show.cancel")}>
                            <button
                                type="button"
                                onClick={() => setReopenModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {__("receptions.show.cancel")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                __("receptions.show.confirm_reopen")
                            }
                        >
                            <button
                                type="submit"
                                disabled={processingAction}
                                className={`bg-amber-600 hover:bg-amber-700 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"} disabled:opacity-50`}
                            >
                                <Unlock className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? __("receptions.show.processing")
                                            : __("receptions.show.confirm_reopen")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </form>
            </Modal>

            {/* Modal: Confirm Approve */}
            <Modal
                show={isApproveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                maxWidth="sm"
            >
                <div
                    className="p-6 space-y-4 text-start"
                    dir={__("receptions.show.ltr")}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Lock className="h-6 w-6 text-emerald-500" />
                        <h3 className="font-bold text-lg text-text">
                            {__("receptions.show.approve_lock_voucher")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {__("receptions.show.are_you_sure_you_want_to_appro")}
                    </p>

                    {errorMsg && (
                        <p className="text-xs text-danger mt-1 font-bold">
                            {errorMsg}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={__("receptions.show.cancel")}>
                            <button
                                type="button"
                                onClick={() => setApproveModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {__("receptions.show.cancel")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                __("receptions.show.confirm_approve")
                            }
                        >
                            <button
                                type="button"
                                onClick={handleApprove}
                                disabled={processingAction}
                                className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"} disabled:opacity-50`}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? __("receptions.show.approving")
                                            : __("receptions.show.confirm_approve")}
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
