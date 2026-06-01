import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    Boxes,
    Search,
    Filter,
    ShieldAlert,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    Info
} from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";

export default function Index({ pallets = { data: [] }, filters = {} }) {
    const { lang } = useLang();
    const { flash } = usePage().props;

    // Filters state
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedSize, setSelectedSize] = useState(filters.size || "");

    // Pallet Creation / Editing State
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingPallet, setEditingPallet] = useState(null);

    // Secure Deletion State
    const [palletToDelete, setPalletToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [processingDelete, setProcessingDelete] = useState(false);

    // Form setup using Inertia useForm
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        pallet_number: "",
        size: "وسط",
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("pallets.index"),
            {
                search: searchQuery,
                size: selectedSize,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearchQuery("");
        setSelectedSize("");
        router.get(route("pallets.index"));
    };

    const openCreateModal = () => {
        setEditingPallet(null);
        clearErrors();
        reset();
        setFormModalOpen(true);
    };

    const openEditModal = (pallet) => {
        setEditingPallet(pallet);
        clearErrors();
        setData({
            pallet_number: pallet.pallet_number,
            size: pallet.size,
        });
        setFormModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (editingPallet) {
            put(route("pallets.update", editingPallet.id), {
                onSuccess: () => {
                    setFormModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route("pallets.store"), {
                onSuccess: () => {
                    setFormModalOpen(false);
                    reset();
                }
            });
        }
    };

    const confirmDelete = (e) => {
        e.preventDefault();
        setDeleteError("");
        setProcessingDelete(true);

        router.post(
            route("pallets.destroy", palletToDelete.id),
            {
                _method: "DELETE",
                password: deletePassword,
            },
            {
                onSuccess: () => {
                    setPalletToDelete(null);
                    setDeletePassword("");
                    setProcessingDelete(false);
                },
                onError: (errs) => {
                    setProcessingDelete(false);
                    if (errs.error) {
                        setDeleteError(errs.error);
                    } else if (errs.password) {
                        setDeleteError(errs.password);
                    } else {
                        setDeleteError(lang === "ar" ? "حدث خطأ ما." : "An error occurred.");
                    }
                },
            }
        );
    };

    const getSizeBadgeStyle = (size) => {
        switch (size) {
            case "كبيرة":
                return "bg-rose-500/10 text-rose-600 border-rose-200";
            case "وسط":
                return "bg-blue-500/10 text-blue-600 border-blue-200";
            case "صغيرة":
                return "bg-gray-500/10 text-gray-600 border-gray-300";
            case "خشب":
                return "bg-amber-500/10 text-amber-600 border-amber-200";
            case "بلاستيك":
                return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-300";
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إدارة المخازن" : "Warehouse Management"}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "الطبالي" : "Pallets"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "إدارة الطبالي" : "Pallets Management"} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
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

                <PageHeader
                    icon={Boxes}
                    title={lang === "ar" ? "إدارة الطبالي" : "Pallets Management"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تعريف وتعديل الطبالي المخزنية المستقلة وتحديد أحجامها ومواد صنعها."
                                : "Define and manage standalone storage pallets, specifying their sizes and materials."}
                        </p>
                    }
                    actions={
                        <Tooltip text={lang === "ar" ? "إضافة طبلية جديدة" : "Add New Pallet"}>
                            <button
                                onClick={openCreateModal}
                                className="px-4 py-2 bg-primary text-white hover:bg-primary-hover rounded-none text-xs font-bold flex items-center justify-center gap-1.5 h-[36px] transition-all"
                            >
                                <Plus className="h-4 w-4 shrink-0" />
                                <span>{lang === "ar" ? "إضافة طبلية" : "New Pallet"}</span>
                            </button>
                        </Tooltip>
                    }
                />

                {/* Filters Section */}
                <div className="bg-surface border border-border p-4 shadow-sm rounded-none">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="md:col-span-2">
                            <InputLabel value={lang === "ar" ? "بحث برقم أو كود الطبلية" : "Search by Number or Code"} />
                            <div className="relative mt-1">
                                <TextInput
                                    className="w-full text-xs rounded-none border-border ps-8"
                                    placeholder={lang === "ar" ? "مثال: 15 أو PAL0200001..." : "e.g. 15 or PAL0200001..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={lang === "ar" ? "الحجم / النوع" : "Size / Type"} />
                            <select
                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                            >
                                <option value="">{lang === "ar" ? "كل الأحجام والأنواع" : "All Sizes & Types"}</option>
                                <option value="كبيرة">{lang === "ar" ? "كبيرة" : "Large"}</option>
                                <option value="وسط">{lang === "ar" ? "وسط" : "Medium"}</option>
                                <option value="صغيرة">{lang === "ar" ? "صغيرة" : "Small"}</option>
                                <option value="خشب">{lang === "ar" ? "خشب" : "Wood"}</option>
                                <option value="بلاستيك">{lang === "ar" ? "بلاستيك" : "Plastic"}</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <PrimaryButton type="submit" className="px-4 py-2 rounded-none text-xs h-[38px] w-full flex items-center justify-center gap-1">
                                <Filter className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "تصفية" : "Filter"}</span>
                            </PrimaryButton>
                            <SecondaryButton type="button" onClick={handleReset} className="px-3 py-2 rounded-none text-xs h-[38px] w-full flex items-center justify-center gap-1">
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "إعادة" : "Reset"}</span>
                            </SecondaryButton>
                        </div>
                    </form>
                </div>

                {/* Pallets Table */}
                <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-surface-muted/50 text-text-muted text-[11px] font-bold uppercase tracking-wide border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 text-start w-20">ID</th>
                                    <th className="px-4 py-3 text-start">{lang === "ar" ? "رقم الطبلية" : "Pallet Number"}</th>
                                    <th className="px-4 py-3 text-start">{lang === "ar" ? "كود الطبلية (توليد تلقائي)" : "Pallet Code (Auto)"}</th>
                                    <th className="px-4 py-3 text-center w-40">{lang === "ar" ? "الحجم / النوع" : "Size / Type"}</th>
                                    <th className="px-4 py-3 text-end w-28">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pallets.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-xs text-text-muted">
                                            {lang === "ar" ? "لم يتم العثور على أي طبالي مسجلة." : "No pallets registered."}
                                        </td>
                                    </tr>
                                ) : (
                                    pallets.data.map((pallet) => {
                                        return (
                                            <tr key={pallet.id} className="hover:bg-surface-muted/20 transition-colors">
                                                <td className="px-4 py-3 text-xs font-mono text-text-muted">{pallet.id}</td>
                                                <td className="px-4 py-3 font-bold text-text text-xs">{pallet.pallet_number}</td>
                                                <td className="px-4 py-3 font-bold text-primary text-xs font-mono">{pallet.pallet_code}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-[10px] px-2.5 py-0.5 rounded-none font-bold border ${getSizeBadgeStyle(pallet.size)}`}>
                                                        {pallet.size}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                                                    <Tooltip text={lang === "ar" ? "تعديل" : "Edit"}>
                                                        <button
                                                            onClick={() => openEditModal(pallet)}
                                                            className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip text={lang === "ar" ? "حذف" : "Delete"}>
                                                        <button
                                                            onClick={() => setPalletToDelete(pallet)}
                                                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all rounded-none inline-flex items-center"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </Tooltip>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pallets.links && pallets.links.length > 3 && (
                        <div className="bg-surface border-t border-border p-3 flex items-center justify-between">
                            <div className="text-xs text-text-muted">
                                {lang === "ar" ? "عرض الصفحة" : "Showing page"}{" "}
                                <span className="font-bold">{pallets.current_page}</span>{" "}
                                {lang === "ar" ? "من أصل" : "of"}{" "}
                                <span className="font-bold">{pallets.last_page}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {pallets.links.map((link, idx) => (
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

            {/* Modal: Create/Edit Pallet Form */}
            <Modal show={isFormModalOpen} onClose={() => setFormModalOpen(false)} maxWidth="sm">
                <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Boxes className="h-6 w-6 text-primary" />
                        <h3 className="font-bold text-lg text-text">
                            {editingPallet 
                                ? (lang === "ar" ? `تعديل بيانات الطبلية: ${editingPallet.pallet_code}` : `Edit Pallet: ${editingPallet.pallet_code}`)
                                : (lang === "ar" ? "إضافة طبلية جديدة" : "Add New Pallet")}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {/* Pallet Number */}
                        <div>
                            <InputLabel htmlFor="pallet_number" value={lang === "ar" ? "رقم الطبلية (تسلسلي) *" : "Pallet Number (Sequential) *"} />
                            <TextInput
                                id="pallet_number"
                                className="mt-1 block w-full text-xs rounded-none border-border"
                                value={data.pallet_number}
                                onChange={(e) => setData("pallet_number", e.target.value)}
                                placeholder="e.g., 1"
                                required
                            />
                            <InputError message={errors.pallet_number} className="mt-1 font-bold text-danger text-[11px]" />
                        </div>

                        {/* Size / Type */}
                        <div>
                            <InputLabel htmlFor="size" value={lang === "ar" ? "الحجم والنوع *" : "Size & Type *"} />
                            <select
                                id="size"
                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                value={data.size}
                                onChange={(e) => setData("size", e.target.value)}
                                required
                            >
                                <option value="كبيرة">{lang === "ar" ? "كبيرة" : "Large"}</option>
                                <option value="وسط">{lang === "ar" ? "وسط" : "Medium"}</option>
                                <option value="صغيرة">{lang === "ar" ? "صغيرة" : "Small"}</option>
                                <option value="خشب">{lang === "ar" ? "خشب" : "Wood"}</option>
                                <option value="بلاستيك">{lang === "ar" ? "بلاستيك" : "Plastic"}</option>
                            </select>
                            <InputError message={errors.size} className="mt-1 font-bold text-danger text-[11px]" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-2">
                        <SecondaryButton type="button" onClick={() => setFormModalOpen(false)} className="rounded-none text-xs">
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing} className="rounded-none text-xs">
                            {processing ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ البيانات" : "Save Pallet")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Confirm Secure Delete */}
            <Modal show={!!palletToDelete} onClose={() => setPalletToDelete(null)} maxWidth="md">
                <form onSubmit={confirmDelete} className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <ShieldAlert className="h-6 w-6 text-danger" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar" ? "تأكيد حذف الطبلية" : "Confirm Pallet Deletion"}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {lang === "ar"
                            ? "أنت على وشك حذف هذه الطبلية بشكل نهائي. هذا الإجراء يتطلب كلمة مرور العمليات ولا يمكن التراجع عنه."
                            : "You are about to permanently delete this pallet record. This requires secure operations password validation and cannot be undone."}
                    </p>

                    <div className="bg-surface-muted/50 p-3 border border-border text-xs font-mono rounded-none">
                        <div>
                            <span className="font-bold text-text-muted">{lang === "ar" ? "رقم الطبلية: " : "Pallet Number: "}</span>
                            <span className="text-text font-bold">{palletToDelete?.pallet_number}</span>
                        </div>
                        <div className="mt-1">
                            <span className="font-bold text-text-muted">{lang === "ar" ? "كود الطبلية: " : "Pallet Code: "}</span>
                            <span className="text-text font-bold text-primary">{palletToDelete?.pallet_code}</span>
                        </div>
                        <div className="mt-1">
                            <span className="font-bold text-text-muted">{lang === "ar" ? "الحجم والنوع: " : "Size & Type: "}</span>
                            <span className="text-text font-bold">{palletToDelete?.size}</span>
                        </div>
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="delete_password"
                            value={lang === "ar" ? "كلمة مرور العمليات الآمنة *" : "Secure Operations Password *"}
                        />
                        <TextInput
                            id="delete_password"
                            type="password"
                            className="mt-1 block w-full text-sm rounded-none border-border"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {deleteError && <p className="text-xs text-danger mt-1 font-bold">{deleteError}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <SecondaryButton type="button" onClick={() => setPalletToDelete(null)} className="rounded-none text-xs">
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <DangerButton type="submit" disabled={processingDelete} className="rounded-none text-xs">
                            {processingDelete ? (lang === "ar" ? "جاري الحذف..." : "Deleting...") : (lang === "ar" ? "تأكيد الحذف" : "Confirm Delete")}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
