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
    const { lang } = useLang();
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
            كبيرة: lang === "ar" ? "كبيرة" : "Large",
            وسط: lang === "ar" ? "وسط" : "Medium",
            صغيرة: lang === "ar" ? "صغيرة" : "Small",
            خشب: lang === "ar" ? "خشب" : "Wood",
            بلاستيك: lang === "ar" ? "بلاستيك" : "Plastic",
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
                            (lang === "ar"
                                ? "تعذر اعتماد السند."
                                : "Failed to approve."),
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
                            lang === "ar"
                                ? "تعذر إلغاء الاعتماد."
                                : "Failed to reopen.",
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
                            lang === "ar"
                                ? "تعذر حذف السند."
                                : "Failed to delete.",
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
                href={route("receptions.index")}
                className="hover:text-primary transition-colors"
            >
                {lang === "ar" ? "سندات الاستلام" : "Reception Vouchers"}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
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
                    lang === "ar"
                        ? `تفاصيل سند الاستلام: ${reception.serial_number}`
                        : `Reception Voucher Details: ${reception.serial_number}`
                }
            />

            <div
                className="max-w-6xl mx-auto pb-12 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
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
                                    ? `إيصال استلام: ${reception.serial_number}`
                                    : `Reception Receipt: ${reception.serial_number}`}
                            </span>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-none font-bold border ${
                                    reception.status === "approved"
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                        : "bg-amber-500/10 text-amber-600 border-amber-200"
                                }`}
                            >
                                {reception.status === "approved" ? (
                                    <span className="flex items-center gap-0.5">
                                        <Lock className="h-2.5 w-2.5" />
                                        {lang === "ar"
                                            ? "معتمد ومغلق"
                                            : "Approved & Locked"}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-0.5">
                                        <Unlock className="h-2.5 w-2.5" />
                                        {lang === "ar" ? "مسودة" : "Draft"}
                                    </span>
                                )}
                            </span>
                        </div>
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? `تم الإنشاء بواسطة: ${reception.creator?.name || "النظام"} في ${new Date(reception.created_at).toLocaleString("ar-EG")}`
                                : `Created by: ${reception.creator?.name || "System"} on ${new Date(reception.created_at).toLocaleString()}`}
                        </p>
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-1.5">
                            {reception.status === "draft" && (
                                <>
                                    <Tooltip
                                        text={
                                            lang === "ar"
                                                ? "تعديل السند"
                                                : "Edit Voucher"
                                        }
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
                                                    {lang === "ar"
                                                        ? "تعديل"
                                                        : "Edit"}
                                                </span>
                                            )}
                                        </Link>
                                    </Tooltip>
                                    <Tooltip
                                        text={
                                            lang === "ar"
                                                ? "اعتماد السند"
                                                : "Approve Voucher"
                                        }
                                    >
                                        <button
                                            onClick={() => {
                                                setErrorMsg("");
                                                setApproveModalOpen(true);
                                            }}
                                            className={`h-[30px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            {showButtonText && (
                                                <span>
                                                    {lang === "ar"
                                                        ? "اعتماد"
                                                        : "Approve"}
                                                </span>
                                            )}
                                        </button>
                                    </Tooltip>
                                </>
                            )}

                            {reception.status === "approved" && (
                                <Tooltip
                                    text={
                                        lang === "ar"
                                            ? "إعادة فتح السند"
                                            : "Reopen Voucher"
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
                                                {lang === "ar"
                                                    ? "إعادة فتح"
                                                    : "Reopen"}
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>
                            )}

                            <Tooltip text={lang === "ar" ? "طباعة" : "Print"}>
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
                                            {lang === "ar" ? "طباعة" : "Print"}
                                        </span>
                                    )}
                                </a>
                            </Tooltip>

                            <Tooltip text={lang === "ar" ? "حذف" : "Delete"}>
                                <button
                                    onClick={() => {
                                        setErrorMsg("");
                                        setSecurePassword("");
                                        setDeleteModalOpen(true);
                                    }}
                                    className={`h-[30px] bg-danger hover:bg-danger-hover text-white font-bold rounded-none flex items-center justify-center transition-all shadow-sm gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {showButtonText && (
                                        <span>
                                            {lang === "ar" ? "حذف" : "Delete"}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>

                            <div className="h-6 w-px bg-border hidden lg:block mx-1" />

                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "رجوع للقائمة"
                                        : "Back to List"
                                }
                            >
                                <Link
                                    href={route("receptions.index")}
                                    className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center h-[30px] transition-all gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                                >
                                    <ArrowRight
                                        className={`h-4 w-4 ${lang === "ar" ? "" : "rotate-180"}`}
                                    />
                                    {showButtonText && (
                                        <span>
                                            {lang === "ar" ? "العودة" : "Back"}
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
                                    {lang === "ar"
                                        ? "بيانات السند والعميل"
                                        : "Voucher & Customer Information"}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {lang === "ar"
                                            ? "العميل:"
                                            : "Customer:"}
                                    </span>
                                    <span className="text-text font-bold text-sm">
                                        {reception.customer?.name}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {lang === "ar"
                                            ? "العقد المرتبط:"
                                            : "Linked Contract:"}
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
                                        {lang === "ar"
                                            ? "الفترة الإلزامية:"
                                            : "Billing Period:"}
                                    </span>
                                    <span className="text-text font-semibold">
                                        {lang === "ar" ? "الفترة" : "Period"}{" "}
                                        {reception.period?.period_number}{" "}
                                        <span className="text-text-muted font-mono font-normal">
                                            ({reception.period?.start_date}{" "}
                                            {lang === "ar" ? "إلى" : "to"}{" "}
                                            {reception.period?.end_date})
                                        </span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {lang === "ar"
                                            ? "تاريخ الاستلام الفعلي:"
                                            : "Actual Date:"}
                                    </span>
                                    <span className="text-text font-bold font-mono text-sm">
                                        {reception.reception_date
                                            ? new Date(
                                                  reception.reception_date,
                                              ).toLocaleDateString(
                                                  lang === "ar"
                                                      ? "ar-EG"
                                                      : "en-US",
                                              )
                                            : "—"}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {lang === "ar"
                                            ? "مندوب العميل (المستلم منه):"
                                            : "Customer Representative:"}
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
                                            {lang === "ar"
                                                ? "لا يوجد مندوب مسجل"
                                                : "None"}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span className="text-text-muted block font-medium mb-0.5">
                                        {lang === "ar"
                                            ? "آخر تعديل بواسطة:"
                                            : "Last Updated By:"}
                                    </span>
                                    <span className="text-text font-semibold">
                                        {reception.editor?.name || "—"}{" "}
                                        <span className="text-text-muted font-mono font-normal text-[10px]">
                                            (
                                            {new Date(
                                                reception.updated_at,
                                            ).toLocaleString(
                                                lang === "ar"
                                                    ? "ar-EG"
                                                    : "en-US",
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
                                    {lang === "ar"
                                        ? "البضائع والكميات المستلمة"
                                        : "Items & Pallets List"}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted/50 text-text-muted font-bold border-b border-border">
                                        <tr>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "رقم البند"
                                                    : "Row #"}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "الصنف المخزني"
                                                    : "Inventory Item"}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "الشكل/البديل"
                                                    : "Variant"}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "رقم الطبلية"
                                                    : "Pallet Number"}
                                            </th>
                                            <th className="px-3 py-2 text-end">
                                                {lang === "ar"
                                                    ? "الكمية المستلمة"
                                                    : "Qty Received"}
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
                                    {lang === "ar"
                                        ? "إجمالي الوارد:"
                                        : "Total In:"}{" "}
                                    {Math.round(
                                        totalReception,
                                    ).toLocaleString()}
                                </div>
                                {totalDispatch > 0 && (
                                    <div className="font-semibold text-sm text-text">
                                        {lang === "ar"
                                            ? "إجمالي الصادر:"
                                            : "Total Out:"}{" "}
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
                                    {lang === "ar"
                                        ? "بيانات السائق الناقل"
                                        : "Carrier Driver Info"}
                                </h3>
                            </div>

                            {reception.driver ? (
                                <div className="space-y-3 text-xs">
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {lang === "ar"
                                                ? "اسم السائق:"
                                                : "Driver Name:"}
                                        </span>
                                        <span className="text-text font-bold">
                                            {reception.driver.name}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {lang === "ar"
                                                ? "رقم الجوال:"
                                                : "Phone Number:"}
                                        </span>
                                        <span className="text-text font-mono font-bold">
                                            {reception.driver.phone_number ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {lang === "ar"
                                                ? "رقم الهوية / الإقامة:"
                                                : "ID / Iqama No.:"}
                                        </span>
                                        <span className="text-text font-mono font-bold">
                                            {reception.driver.id_number || "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {lang === "ar"
                                                ? "رقم اللوحة:"
                                                : "Plate Number:"}
                                        </span>
                                        <span className="text-text font-bold font-mono">
                                            {reception.driver.vehicle_plate ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {lang === "ar"
                                                ? "نوع السيارة:"
                                                : "Vehicle Type:"}
                                        </span>
                                        <span className="text-text font-semibold">
                                            {reception.driver.vehicle_type ||
                                                "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-text-muted block font-medium">
                                            {lang === "ar"
                                                ? "رقم رخصة السير:"
                                                : "License No.:"}
                                        </span>
                                        <span className="text-text font-mono">
                                            {reception.driver.license_number ||
                                                "—"}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs text-text-muted">
                                    {lang === "ar"
                                        ? "لم يتم تحديد بيانات سائق."
                                        : "No carrier driver assigned."}
                                </div>
                            )}
                        </div>

                        {/* History and Logs Card */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none">
                            <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                                <Clock className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {lang === "ar"
                                        ? "سجل التعديلات والعمليات"
                                        : "Modification Log"}
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
                                                    lang === "ar"
                                                        ? "ar-EG"
                                                        : "en-US",
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
                                    {lang === "ar"
                                        ? "لا توجد تعديلات سابقة مسجلة."
                                        : "No previous adjustments recorded."}
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
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <ShieldAlert className="h-6 w-6 text-danger animate-bounce" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "تأكيد حذف سند الاستلام"
                                : "Confirm Voucher Deletion"}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {lang === "ar"
                            ? "أنت على وشك حذف هذا السند وحركات المخزن التابعة له بشكل نهائي. هذا الإجراء غير قابل للتراجع."
                            : "You are about to permanently delete this reception voucher and all associated inventory entries. This action cannot be undone."}
                    </p>

                    <div className="bg-surface-muted/50 p-3 border border-border text-xs font-mono rounded-none">
                        <div>
                            <span className="font-bold text-text-muted">
                                {lang === "ar"
                                    ? "رقم السند: "
                                    : "Voucher Serial: "}
                            </span>
                            <span className="text-text font-bold">
                                {reception.serial_number}
                            </span>
                        </div>
                        <div className="mt-1">
                            <span className="font-bold text-text-muted">
                                {lang === "ar" ? "العميل: " : "Customer: "}
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
                                lang === "ar"
                                    ? "كلمة مرور العمليات الآمنة *"
                                    : "Secure Operations Password *"
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
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {lang === "ar" ? "إلغاء" : "Cancel"}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"
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
                                            ? lang === "ar"
                                                ? "جاري الحذف..."
                                                : "Deleting..."
                                            : lang === "ar"
                                              ? "تأكيد الحذف"
                                              : "Confirm Delete"}
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
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Unlock className="h-6 w-6 text-amber-500 animate-pulse" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "إعادة فتح السند (إلغاء الاعتماد)"
                                : "Reopen Approved Voucher"}
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
                            value={
                                lang === "ar"
                                    ? "سبب إلغاء الاعتماد وإعادة الفتح *"
                                    : "Reason for Reopening *"
                            }
                        />
                        <TextInput
                            id="reopen_reason"
                            type="text"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={reopenReason}
                            onChange={(e) => setReopenReason(e.target.value)}
                            placeholder={
                                lang === "ar"
                                    ? "مثال: تعديل كمية طبلية خاطئة..."
                                    : "e.g., correcting incorrect pallet quantity..."
                            }
                            required
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="reopen_password"
                            value={
                                lang === "ar"
                                    ? "كلمة مرور العمليات الآمنة *"
                                    : "Secure Operations Password *"
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
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setReopenModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {lang === "ar" ? "إلغاء" : "Cancel"}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                lang === "ar"
                                    ? "تأكيد إعادة الفتح"
                                    : "Confirm Reopen"
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
                                            ? lang === "ar"
                                                ? "جاري المعالجة..."
                                                : "Processing..."
                                            : lang === "ar"
                                              ? "تأكيد إعادة الفتح"
                                              : "Confirm Reopen"}
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
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Lock className="h-6 w-6 text-emerald-500" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "اعتماد وإغلاق سند الاستلام"
                                : "Approve & Lock Voucher"}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {lang === "ar"
                            ? "هل أنت متأكد من اعتماد هذا السند؟ سيتم تثبيت الكميات في المخازن بشكل رسمي، وسيتحول السند إلى حالة القفل ولا يمكن تعديله إلا بكلمة مرور العمليات."
                            : "Are you sure you want to approve this voucher? Items will officially be registered, and the voucher will be locked and cannot be edited without secure supervisor password."}
                    </p>

                    {errorMsg && (
                        <p className="text-xs text-danger mt-1 font-bold">
                            {errorMsg}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setApproveModalOpen(false)}
                                className={`border border-border bg-surface text-text hover:bg-surface-muted rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"}`}
                            >
                                <X className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {lang === "ar" ? "إلغاء" : "Cancel"}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                        <Tooltip
                            text={
                                lang === "ar"
                                    ? "تأكيد الاعتماد"
                                    : "Confirm Approve"
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
                                            ? lang === "ar"
                                                ? "جاري الاعتماد..."
                                                : "Approving..."
                                            : lang === "ar"
                                              ? "تأكيد الاعتماد"
                                              : "Confirm Approve"}
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
