import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Box,
    Home,
    ChevronRight,
    Tags,
    Image as ImageIcon,
    Edit,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Tooltip from "@/Components/Tooltip";

export default function Show({ item }) {
    const { lang } = useLang();
    const { flash } = usePage().props;

    const t = {
        title: lang === "ar" ? "تفاصيل الصنف المخزني" : "Inventory Item Details",
        parent: lang === "ar" ? "الأصناف المخزنية" : "Inventory Items",
        settings: lang === "ar" ? "الإعدادات" : "Settings",
        code: lang === "ar" ? "كود المنتج" : "Product Code",
        name: lang === "ar" ? "اسم الصنف" : "Item Name",
        category: lang === "ar" ? "فئة السلعة" : "Commodity Category",
        status: lang === "ar" ? "الحالة" : "Status",
        active: lang === "ar" ? "نشط" : "Active",
        inactive: lang === "ar" ? "غير نشط" : "Inactive",
        variantsTitle: lang === "ar" ? "الأشكال والأحجام المتوفرة (Variants)" : "Available Shapes / Variants",
        vName: lang === "ar" ? "اسم الشكل" : "Variant Name",
        vCode: lang === "ar" ? "كود الشكل" : "Variant Code",
        vQuality: lang === "ar" ? "الجودة" : "Quality",
        vPrice: lang === "ar" ? "السعر الافتراضي" : "Default Price",
        vStatus: lang === "ar" ? "الحالة" : "Status",
        actions: lang === "ar" ? "الإجراءات" : "Actions",
        editVariant: lang === "ar" ? "تعديل الشكل / الحجم" : "Edit Shape / Variant",
    };

    // State for Variant Edit Modal
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form setup for variant edit
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        name: "",
        quality: "",
        default_price: "",
        is_active: true,
    });

    const openEditModal = (variant) => {
        setSelectedVariant(variant);
        clearErrors();
        setData({
            name: variant.name,
            quality: variant.quality || "",
            default_price: variant.default_price,
            is_active: variant.is_active,
        });
        setIsEditModalOpen(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        put(route("inventory-item-variants.update", selectedVariant.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                reset();
            }
        });
    };

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    const getCategoryPath = (cat) => {
        if (!cat) return "—";
        return displayBilingual(cat.name);
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <Link
                href={route("inventory-items.index")}
                className="hover:text-primary transition-colors"
            >
                {t.parent}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">{item.code}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${t.title} - ${item.code}`} />

            <div
                className="max-w-5xl mx-auto pb-8 main-stack-y"
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

                <PageHeader
                    icon={Box}
                    title={displayBilingual(item.name)}
                    description={
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                            <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-none text-slate-700 font-bold">
                                {item.code}
                            </span>
                            <span>•</span>
                            <span
                                className={`px-2 py-0.5 text-[10px] font-bold border rounded-none ${
                                    item.is_active 
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                                        : "bg-gray-500/10 text-gray-500 border-gray-200"
                                }`}
                            >
                                {item.is_active ? t.active : t.inactive}
                            </span>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primary Info Card */}
                    <div className="md:col-span-2 rounded-none border border-border bg-surface p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Box className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-bold text-text">
                                {lang === "ar"
                                    ? "البيانات الأساسية للصنف"
                                    : "Inventory Item Specifications"}
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div>
                                <span className="block font-bold text-text-muted mb-1">
                                    {t.name}
                                </span>
                                <span className="text-text font-semibold text-[13px]">
                                    {displayBilingual(item.name)}
                                </span>
                            </div>

                            <div>
                                <span className="block font-bold text-text-muted mb-1">
                                    {t.category}
                                </span>
                                <span className="text-text font-semibold text-[13px] flex items-center gap-1.5">
                                    <Tags className="h-3.5 w-3.5 text-primary" />
                                    {getCategoryPath(item.category)}
                                </span>
                            </div>
                        </div>

                        {/* Variants List Section */}
                        <div className="pt-4 border-t border-border space-y-3">
                            <h4 className="font-bold text-xs text-text">
                                {t.variantsTitle}
                            </h4>
                            
                            <div className="border border-border rounded-none overflow-hidden">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted/50 text-text-muted text-[10px] font-bold uppercase tracking-wide border-b border-border">
                                        <tr>
                                            <th className="px-3 py-2 text-start">{t.vName}</th>
                                            <th className="px-3 py-2 text-start">{t.vCode}</th>
                                            <th className="px-3 py-2 text-start">{t.vQuality}</th>
                                            <th className="px-3 py-2 text-start">{t.vPrice}</th>
                                            <th className="px-3 py-2 text-center w-20">{t.vStatus}</th>
                                            <th className="px-3 py-2 text-end w-20">{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {!item.variants || item.variants.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-3 py-4 text-center text-text-muted">
                                                    {lang === "ar" ? "لا توجد أشكال مضافة لهذا المنتج" : "No variants available for this product"}
                                                </td>
                                            </tr>
                                        ) : (
                                            item.variants.map((v) => (
                                                <tr key={v.id} className="hover:bg-surface-muted/30 transition-colors">
                                                    <td className="px-3 py-2.5 font-bold text-text">{displayBilingual(v.name)}</td>
                                                    <td className="px-3 py-2.5 font-mono text-text-muted">{v.code}</td>
                                                    <td className="px-3 py-2.5 text-text">{displayBilingual(v.quality) || "—"}</td>
                                                    <td className="px-3 py-2.5 font-mono text-emerald-600 font-bold">
                                                        {parseFloat(v.default_price).toFixed(2)} {lang === "ar" ? "ر.س" : "SAR"}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        <span
                                                            className={`text-[9px] px-1.5 py-0.2 rounded-none font-medium border ${
                                                                v.is_active 
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" 
                                                                    : "bg-gray-500/10 text-gray-500 border-gray-200"
                                                            }`}
                                                        >
                                                            {v.is_active ? t.active : t.inactive}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-end">
                                                        <Tooltip text={lang === "ar" ? "تعديل الشكل" : "Edit Variant"}>
                                                            <button
                                                                onClick={() => openEditModal(v)}
                                                                className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                        </Tooltip>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Image / Meta Side Card */}
                    <div className="rounded-none border border-border bg-surface p-5 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <ImageIcon className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-bold text-text">
                                {lang === "ar"
                                    ? "صورة المنتج"
                                    : "Product Image"}
                            </h3>
                        </div>

                        <div className="h-56 w-full bg-slate-50 border border-border flex items-center justify-center overflow-hidden rounded-none">
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={displayBilingual(item.name)}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="text-center text-text-muted space-y-2">
                                    <ImageIcon className="h-10 w-10 text-slate-300 mx-auto" />
                                    <span className="text-[10px] block">{lang === "ar" ? "لا توجد صورة للمنتج" : "No product image"}</span>
                                </div>
                            )}
                        </div>

                        <div className="divide-y divide-border border border-border rounded-none px-3 bg-slate-50/30 text-xs">
                            <div className="flex justify-between py-2.5">
                                <span className="font-bold text-text-muted">
                                    {t.code}:
                                </span>
                                <span className="font-mono font-bold text-text">
                                    {item.code}
                                </span>
                            </div>
                            <div className="flex justify-between py-2.5">
                                <span className="font-bold text-text-muted">
                                    {t.status}:
                                </span>
                                <span
                                    className={`font-bold ${item.is_active ? "text-emerald-600" : "text-gray-500"}`}
                                >
                                    {item.is_active ? t.active : t.inactive}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Edit Variant Form */}
            <Modal show={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm">
                <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-start" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <Box className="h-6 w-6 text-primary" />
                        <h3 className="font-bold text-lg text-text">
                            {t.editVariant}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {/* Variant Code (ReadOnly) */}
                        {selectedVariant && (
                            <div>
                                <InputLabel value={t.vCode} />
                                <div className="mt-1 p-2.5 bg-slate-100 border border-border text-xs font-mono rounded-none text-text-muted select-all">
                                    {selectedVariant.code}
                                </div>
                            </div>
                        )}

                        {/* Variant Name */}
                        <div>
                            <InputLabel htmlFor="name" value={t.vName + " *"} />
                            <TextInput
                                id="name"
                                className="mt-1 block w-full text-xs rounded-none border-border"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="5ك | 5kg"
                                required
                            />
                            <InputError message={errors.name} className="mt-1 font-bold text-danger text-[11px]" />
                        </div>

                        {/* Quality */}
                        <div>
                            <InputLabel htmlFor="quality" value={t.vQuality} />
                            <TextInput
                                id="quality"
                                className="mt-1 block w-full text-xs rounded-none border-border"
                                value={data.quality}
                                onChange={(e) => setData("quality", e.target.value)}
                                placeholder="ملكي | Royal"
                            />
                            <InputError message={errors.quality} className="mt-1 font-bold text-danger text-[11px]" />
                        </div>

                        {/* Default Price */}
                        <div>
                            <InputLabel htmlFor="default_price" value={t.vPrice + " *"} />
                            <TextInput
                                id="default_price"
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full text-xs rounded-none border-border"
                                value={data.default_price}
                                onChange={(e) => setData("default_price", e.target.value)}
                                placeholder="0.00"
                                required
                            />
                            <InputError message={errors.default_price} className="mt-1 font-bold text-danger text-[11px]" />
                        </div>

                        {/* Status */}
                        <div>
                            <InputLabel htmlFor="is_active" value={t.vStatus} />
                            <select
                                id="is_active"
                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                value={data.is_active ? "1" : "0"}
                                onChange={(e) => setData("is_active", e.target.value === "1")}
                            >
                                <option value="1">{t.active}</option>
                                <option value="0">{t.inactive}</option>
                            </select>
                            <InputError message={errors.is_active} className="mt-1 font-bold text-danger text-[11px]" />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4 mt-2">
                        <SecondaryButton type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-none text-xs">
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing} className="rounded-none text-xs">
                            {processing ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ البيانات" : "Save Changes")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
