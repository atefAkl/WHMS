import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Box,
    Home,
    ChevronRight,
    Tags,
    Image as ImageIcon,
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";

export default function Show({ item }) {
    const { lang } = useLang();

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
    };

    const getCategoryPath = (cat) => {
        if (!cat) return "—";
        return cat.name;
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
                <PageHeader
                    icon={Box}
                    title={item.name}
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
                                    {item.name}
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
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {!item.variants || item.variants.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-3 py-4 text-center text-text-muted">
                                                    {lang === "ar" ? "لا توجد أشكال مضافة لهذا المنتج" : "No variants available for this product"}
                                                </td>
                                            </tr>
                                        ) : (
                                            item.variants.map((v) => (
                                                <tr key={v.id} className="hover:bg-surface-muted/30 transition-colors">
                                                    <td className="px-3 py-2.5 font-bold text-text">{v.name}</td>
                                                    <td className="px-3 py-2.5 font-mono text-text-muted">{v.code}</td>
                                                    <td className="px-3 py-2.5 text-text">{v.quality || "—"}</td>
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
                                    alt={item.name}
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
        </AuthenticatedLayout>
    );
}
