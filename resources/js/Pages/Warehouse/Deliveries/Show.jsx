import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {  Activity, AlertCircle, ArrowRight, Briefcase, Calendar, CheckCircle2, ChevronRight, Clock, Edit, FileCheck, FileText, Home, Lock, Printer, ShieldAlert, Trash2, Truck, Unlock, User, X } from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";

export default function Show({ delivery }) {
    const { lang } = useLang();
    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };
    const getPalletSizeDisplay = (pallet) => {
        if (!pallet || !pallet.size) return "";
        const sizeMap = {
            كبيرة: __("deliveries.show.large"),
            وسط: __("deliveries.show.medium"),
            صغيرة: __("deliveries.show.small"),
            خشب: __("deliveries.show.wood"),
            بلاستيك: __("deliveries.show.plastic"),
        };
        return sizeMap[pallet.size] || pallet.size;
    };
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;

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

    const handleApprove = (redirectTo = "index") => {
        setProcessingAction(true);
        router.post(
            route("deliveries.approve", delivery.id),
            { redirect_to: redirectTo },
            {
                onSuccess: () => {
                    setApproveModalOpen(false);
                    setProcessingAction(false);
                },
                onError: (errs) => {
                    setProcessingAction(false);
                    setErrorMsg(
                        errs.error ||
                            (__("deliveries.show.failed_to_approve")),
                    );
                },
            },
        );
    };

    const totalReception =
        delivery.inventory_entries?.reduce(
            (sum, entry) => sum + parseFloat(entry.quantity_in || 0),
            0,
        ) || 0;
    const totalDispatch =
        delivery.inventory_entries?.reduce(
            (sum, entry) => sum + parseFloat(entry.quantity_out || 0),
            0,
        ) || 0;

    const handleReopen = (e) => {
        e.preventDefault();
        setErrorMsg("");
        setProcessingAction(true);

        router.post(
            route("deliveries.reopen", delivery.id),
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
                            __("deliveries.show.failed_to_reopen"),
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
            route("deliveries.destroy", delivery.id),
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
                            __("deliveries.show.failed_to_delete"),
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
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <Link
                href={route("deliveries.index")}
                className="hover:text-primary transition-colors"
            >
                {__("deliveries.show.goods_delivery_notes")}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">
                {delivery.serial_number}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    lang === "ar"
                        ? `تفاصيل سند الخروج: ${delivery.serial_number}`
                        : `Delivery Voucher Details: ${delivery.serial_number}`
                }
            />

            <div
                className="max-w-6xl mx-auto pb-12 main-stack-y"
                dir={__("deliveries.show.ltr")}
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
                                {lang === "ar"
                                    ? `سند تسليم خروج بضاعة: ${delivery.serial_number}`
                                    : `Delivery Voucher: ${delivery.serial_number}`}
                            </span>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-none font-bold border ${
                                    delivery.status === "approved"
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                        : "bg-amber-500/10 text-amber-600 border-amber-200"
                                }`}
                            >
                                {delivery.status === "approved" ? (
                                    <span className="flex items-center gap-0.5">
                                        <Lock className="h-2.5 w-2.5" />
                                        {__("deliveries.show.approved_locked")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-0.5">
                                        <Unlock className="h-2.5 w-2.5" />
                                        {__("deliveries.show.draft")}
                                    </span>
                                )}
                            </span>
                        </div>
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? `تم الإنشاء بواسطة: ${delivery.creator?.name || "النظام"} في ${new Date(delivery.created_at).toLocaleString("ar-EG")}`
                                : `Created by: ${delivery.creator?.name || "System"} on ${new Date(delivery.created_at).toLocaleString()}`}
                        </p>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-1.5">
                            {delivery.status === "draft" && (
                                <>
                                    <Tooltip
                                        text={
                                            __("deliveries.show.edit_note")
                                        }
                                    >
                                        <Link
                                            href={route(
                                                "deliveries.edit",
                                                delivery.id,
                                            )}
                                            className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                        >
                                            <Edit className="h-4 w-4" />
                                            {showButtonText && (
                                                <span>
                                                    {__("deliveries.show.edit")}
                                                </span>
                                            )}
                                        </Link>
                                    </Tooltip>
                                    <Tooltip
                                        text={
                                            __("deliveries.show.approve_note")
                                        }
                                    >
                                        <button
                                            onClick={() => {
                                                setErrorMsg("");
                                                setSecurePassword("");
                                                setApproveModalOpen(true);
                                            }}
                                            className={`h-[30px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {showButtonText && (
                                                <span>
                                                    {__("deliveries.show.approve")}
                                                </span>
                                            )}
                                        </button>
                                    </Tooltip>
                                </>
                            )}

                            {delivery.status === "approved" && (
                                <Tooltip
                                    text={
                                        __("deliveries.show.reopen_note")
                                    }
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
                                                {__("deliveries.show.reopen")}
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip text={__("deliveries.show.print")}>
                                <a
                                    href={route(
                                        "deliveries.print",
                                        delivery.id,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <Printer className="h-4 w-4" />
                                    {showButtonText && (
                                        <span>
                                            {__("deliveries.show.print")}
                                        </span>
                                    )}
                                </a>
                            </Tooltip>

                            <Tooltip 
                                text={
                                    delivery.status === "approved" || (delivery.inventory_entries?.length || 0) > 0
                                        ? (__("deliveries.show.blocked_cannot_delete_approve"))
                                        : (__("deliveries.show.delete_voucher"))
                                }
                            >
                                <button
                                    onClick={() => {
                                        if (delivery.status === "approved") {
                                            setErrorMsg(__("deliveries.show.security_error_cannot_delete"));
                                            return;
                                        }
                                        if ((delivery.inventory_entries?.length || 0) > 0) {
                                            setErrorMsg(__("deliveries.show.security_error_cannot_delete"));
                                            return;
                                        }
                                        setErrorMsg("");
                                        setSecurePassword("");
                                        setDeleteModalOpen(true);
                                    }}
                                    disabled={delivery.status === "approved" || (delivery.inventory_entries?.length || 0) > 0}
                                    className={`h-[30px] font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${
                                        delivery.status === "approved" || (delivery.inventory_entries?.length || 0) > 0
                                            ? "bg-gray-400 text-white cursor-not-allowed opacity-60"
                                            : "bg-danger hover:bg-danger-hover text-white"
                                    } ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {showButtonText && (
                                        <span>
                                            {__("deliveries.show.delete")}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>

                            <div className="h-6 w-px bg-border hidden lg:block mx-1" />

                            <Tooltip
                                text={
                                    __("deliveries.show.back_to_list")
                                }
                            >
                                <Link
                                    href={route("deliveries.index")}
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <ArrowRight
                                        className={`h-4 w-4 ${lang === "ar" ? "" : "rotate-180"}`}
                                    />
                                    {showButtonText && (
                                        <span>
                                            {__("deliveries.show.back")}
                                        </span>
                                    )}
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Primary Data Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General details card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Briefcase className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("deliveries.show.voucher_customer_information")}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.customer")}
                                    </span>
                                    <span className="text-text font-bold text-sm">
                                        {delivery.customer?.name}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.linked_contract")}
                                    </span>
                                    {delivery.contract ? (
                                        <Link
                                            href={route(
                                                "contracts.show",
                                                delivery.contract_id,
                                            )}
                                            className="text-primary hover:underline font-bold font-mono text-sm"
                                        >
                                            {delivery.contract.contract_number}
                                        </Link>
                                    ) : (
                                        <span className="text-text-muted font-bold">
                                            —
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.billing_period")}
                                    </span>
                                    <span className="text-text font-semibold">
                                        {__("deliveries.show.period")}{" "}
                                        {delivery.period?.period_number}{" "}
                                        <span className="text-text-muted font-mono font-normal">
                                            ({delivery.period?.start_date}{" "}
                                            {__("deliveries.show.to")}{" "}
                                            {delivery.period?.end_date})
                                        </span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.delivery_date")}
                                    </span>
                                    <span className="text-text font-bold font-mono text-sm">
                                        {delivery.delivery_date
                                            ? new Date(
                                                  delivery.delivery_date,
                                              ).toLocaleDateString(
                                                  __("deliveries.show.en_us"),
                                              )
                                            : "—"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.exit_permit_reference")}
                                    </span>
                                    {delivery.exit_authorization ? (
                                        <span className="text-text font-bold text-primary flex items-center gap-1">
                                            <FileCheck className="h-4 w-4" />
                                            {
                                                delivery.exit_authorization
                                                    .serial_number
                                            }
                                        </span>
                                    ) : (
                                        <span className="text-text font-semibold">
                                            {delivery.written_reference || "—"}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.representative")}
                                    </span>
                                    {delivery.representative ? (
                                        <span className="text-text font-semibold">
                                            {delivery.representative.name}{" "}
                                            <span className="text-text-muted font-mono font-normal">
                                                (
                                                {
                                                    delivery.representative
                                                        .phone_number
                                                }
                                                )
                                            </span>
                                        </span>
                                    ) : (
                                        <span className="text-text-muted font-semibold">
                                            {__("deliveries.show.none")}
                                        </span>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {__("deliveries.show.notes_remarks")}
                                    </span>
                                    <p className="text-text bg-background border border-border p-3 font-semibold text-xs leading-relaxed min-h-[45px]">
                                        {delivery.notes ||
                                            (__("deliveries.show.no_notes_recorded"))}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Items details table */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Activity className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("deliveries.show.delivered_items_pallets_list")}
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted/50 text-text-muted font-bold border-b border-border">
                                        <tr>
                                            <th className="px-3 py-2 text-start">
                                                {__("deliveries.show.row")}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {__("deliveries.show.inventory_item")}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {__("deliveries.show.variant")}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {__("deliveries.show.pallet_number")}
                                            </th>
                                            <th className="px-3 py-2 text-end text-danger">
                                                {__("deliveries.show.qty_delivered")}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {delivery.inventory_entries?.map(
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
                                                    <td className="px-3 py-2.5 font-mono font-extrabold text-end text-danger-600">
                                                        {Math.round(
                                                            parseFloat(
                                                                entry.quantity_out,
                                                            ),
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
                                    {__("deliveries.show.total_in")}{" "}
                                    {Math.round(
                                        totalReception,
                                    ).toLocaleString()}
                                </div>
                                {totalDispatch > 0 && (
                                    <div className="font-semibold text-sm text-text">
                                        {__("deliveries.show.total_out")}{" "}
                                        {Math.round(
                                            totalDispatch,
                                        ).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right stack sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Driver details card */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Truck className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("deliveries.show.carrier_driver_info")}
                                </h3>
                            </div>

                            {delivery.driver ? (
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("deliveries.show.driver_name")}
                                        </span>
                                        <span className="text-text font-bold">
                                            {delivery.driver.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("deliveries.show.phone_number")}
                                        </span>
                                        <span className="text-text font-mono font-bold">
                                            {delivery.driver.phone_number ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("deliveries.show.id_iqama_no")}
                                        </span>
                                        <span className="text-text font-mono font-bold">
                                            {delivery.driver.id_number || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("deliveries.show.plate_number")}
                                        </span>
                                        <span className="text-text font-bold font-mono">
                                            {delivery.driver.vehicle_plate ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {__("deliveries.show.vehicle_type")}
                                        </span>
                                        <span className="text-text font-semibold">
                                            {delivery.driver.vehicle_type ||
                                                "—"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs text-text-muted">
                                    {__("deliveries.show.no_carrier_driver_assigned")}
                                </div>
                            )}
                        </div>

                        {/* Audit and Log tracker */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Clock className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {__("deliveries.show.modification_log")}
                                </h3>
                            </div>

                            {delivery.history && delivery.history.length > 0 ? (
                                <div className="space-y-4 relative border-s border-border ps-4 text-xs rtl:border-s-0 rtl:border-e rtl:pe-4">
                                    {delivery.history.map((log, idx) => (
                                        <div key={idx} className="relative">
                                            <span className="absolute -left-[22px] rtl:-right-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-surface" />
                                            <div className="font-mono text-[10px] text-text-muted">
                                                {new Date(
                                                    log.date,
                                                ).toLocaleString(
                                                    __("deliveries.show.en_us"),
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
                                    {__("deliveries.show.no_previous_adjustments_record")}
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
                    dir={__("deliveries.show.ltr")}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <ShieldAlert className="h-6 w-6 text-danger animate-bounce" />
                        <h3 className="font-bold text-lg text-text">
                            {__("deliveries.show.confirm_voucher_deletion")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {__("deliveries.show.you_are_about_to_permanently_d")}
                    </p>

                    <div className="bg-surface-muted/50 p-3 border border-border text-xs font-mono rounded-none">
                        <div>
                            <span className="font-bold text-text-muted">
                                {__("deliveries.show.voucher_serial")}
                            </span>
                            <span className="text-text font-bold">
                                {delivery.serial_number}
                            </span>
                        </div>
                        <div className="mt-1">
                            <span className="font-bold text-text-muted">
                                {__("deliveries.show.customer")}
                            </span>
                            <span className="text-text font-bold">
                                {delivery.customer?.name}
                            </span>
                        </div>
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="delete_password"
                            value={
                                __("deliveries.show.secure_operations_password")
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
                        <Tooltip text={__("deliveries.show.cancel")}>
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {__("deliveries.show.cancel")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                __("deliveries.show.confirm_delete")
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
                                            ? __("deliveries.show.deleting")
                                            : __("deliveries.show.confirm_delete")}
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
                    dir={__("deliveries.show.ltr")}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Unlock className="h-6 w-6 text-amber-500 animate-pulse" />
                        <h3 className="font-bold text-lg text-text">
                            {__("deliveries.show.reopen_approved_voucher")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {__("deliveries.show.reopening_will_return_the_vouc")}
                    </p>

                    <div>
                        <InputLabel
                            htmlFor="reopen_reason"
                            value={
                                __("deliveries.show.reason_for_reopening")
                            }
                        />
                        <TextInput
                            id="reopen_reason"
                            type="text"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder={
                                __("deliveries.show.e_g_correcting_delivery_quan")
                            }
                            required
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="reopen_password"
                            value={
                                __("deliveries.show.secure_operations_password")
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
                        <Tooltip text={__("deliveries.show.cancel")}>
                            <button
                                type="button"
                                onClick={() => setReopenModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {__("deliveries.show.cancel")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                __("deliveries.show.confirm_reopen")
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
                                            ? __("deliveries.show.processing")
                                            : __("deliveries.show.confirm_reopen")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </form>
            </Modal>

            <Modal
                show={isApproveModalOpen}
                onClose={() => setApproveModalOpen(false)}
                maxWidth="md"
            >
                <div
                    className="p-6 space-y-4 text-start"
                    dir={__("deliveries.show.ltr")}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Lock className="h-6 w-6 text-emerald-500" />
                        <h3 className="font-bold text-lg text-text">
                            {__("deliveries.show.approve_lock_voucher")}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {__("deliveries.show.you_are_about_to_approve_this")}
                    </p>

                    {errorMsg && (
                        <p className="text-xs text-danger mt-1 font-bold">
                            {errorMsg}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={__("deliveries.show.cancel")}>
                            <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => setApproveModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {__("deliveries.show.cancel")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>

                        {/* Approve → Print */}
                        <Tooltip
                            text={
                                __("deliveries.show.approve_print")
                            }
                        >
                            <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => handleApprove("print")}
                                className={`bg-surface border border-border text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 disabled:opacity-50 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <Printer className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? "..."
                                            : __("deliveries.show.approve_print")}
                                    </span>
                                )}
                            </button>
                        </Tooltip>

                        {/* Approve → Index */}
                        <Tooltip
                            text={
                                __("deliveries.show.confirm_approve")
                            }
                        >
                            <button
                                type="button"
                                disabled={processingAction}
                                onClick={() => handleApprove("index")}
                                className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 disabled:opacity-50 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingAction
                                            ? __("deliveries.show.approving")
                                            : __("deliveries.show.confirm_approve")}
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
