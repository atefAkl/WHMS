import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { useState } from "react";
import {
    FolderTree,
    Plus,
    Edit,
    Trash2,
    Home,
    ChevronRight,
} from "lucide-react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";

export default function InventoryCategories({ auth, categories }) {
    const { lang } = useLang();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);

    const {
        itemToDelete, deletePassword, setDeletePassword, deleteError, processing: deleteProcessing,
        requestDelete, confirmDelete, cancelDelete
    } = useSecureDelete();

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: "",
        parent_id: "",
        is_active: true,
    });

    const t = {
        title: lang === "ar" ? "فئات الأصناف المخزنية" : "Inventory Categories",
        home: lang === "ar" ? "الإعدادات" : "Settings",
        add: lang === "ar" ? "إضافة فئة" : "Add Category",
        columns: {
            index: "#",
            name: lang === "ar" ? "اسم الفئة" : "Category Name",
            level: lang === "ar" ? "المستوى" : "Level",
            parent: lang === "ar" ? "الفئة الأب" : "Parent Category",
            status: lang === "ar" ? "الحالة" : "Status",
            actions: lang === "ar" ? "إجراءات" : "Actions",
        },
    };

    // Helper: Find category level (1-indexed: 1, 2, or 3)
    const getCategoryLevel = (category) => {
        if (!category.parent_id) return 1;
        const parent = categories.find((c) => c.id === category.parent_id);
        if (!parent) return 1;
        if (!parent.parent_id) return 2;
        return 3;
    };

    // Helper: Get level name
    const getLevelBadge = (level) => {
        if (level === 1) {
            return (
                <span className="text-[10px] px-2 py-0.5 rounded-none font-medium bg-blue-500/10 text-blue-600 border border-blue-200">
                    {lang === "ar" ? "مستوى 1 (رئيسي)" : "Level 1 (Main)"}
                </span>
            );
        }
        if (level === 2) {
            return (
                <span className="text-[10px] px-2 py-0.5 rounded-none font-medium bg-amber-500/10 text-amber-600 border border-amber-200">
                    {lang === "ar" ? "مستوى 2 (فرعي)" : "Level 2 (Sub)"}
                </span>
            );
        }
        return (
            <span className="text-[10px] px-2 py-0.5 rounded-none font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                {lang === "ar" ? "مستوى 3 (حفيد)" : "Level 3 (Final)"}
            </span>
        );
    };

    // Filter potential parent categories to only Level 1 and Level 2
    // We also exclude the current category itself (when editing) to prevent recursion
    const allowedParents = categories.filter((c) => {
        if (categoryToEdit && c.id === categoryToEdit.id) return false;
        const lvl = getCategoryLevel(c);
        return lvl < 3; // Only levels 1 and 2 can be parents
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCategoryToEdit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (category) => {
        clearErrors();
        setData({
            name: category.name,
            parent_id: category.parent_id || "",
            is_active: category.is_active,
        });
        setCategoryToEdit(category);
        setIsFormModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setTimeout(() => {
            reset();
            setCategoryToEdit(null);
            clearErrors();
        }, 200);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (categoryToEdit) {
            put(route("settings.inventory-categories.update", categoryToEdit.id), {
                onSuccess: () => closeModals(),
            });
        } else {
            post(route("settings.inventory-categories.store"), {
                onSuccess: () => closeModals(),
            });
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight
                className={lang === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"}
            />
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.get(route("settings.index"))}
            >
                {t.home}
            </span>
            <ChevronRight
                className={lang === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"}
            />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div className="py-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 main-stack-y">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text">
                                {t.title}
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === "ar"
                                    ? "إدارة هيكل فئات الأصناف المخزنية بـ 3 مستويات"
                                    : "Manage 3-level storage categories hierarchy"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 text-sm font-medium rounded-none hover:bg-primary/95 transition-all shadow-sm h-[36px]"
                            >
                                <Plus className="h-4 w-4" />
                                {t.add}
                            </button>
                        </div>
                    </div>

                    <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-surface-muted/50 text-text-muted text-[11px] font-bold uppercase tracking-wide border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 text-start w-12">
                                            {t.columns.index}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t.columns.name}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t.columns.level}
                                        </th>
                                        <th className="px-4 py-3 text-start">
                                            {t.columns.parent}
                                        </th>
                                        <th className="px-4 py-3 text-center w-24">
                                            {t.columns.status}
                                        </th>
                                        <th className="px-4 py-3 text-end w-32">
                                            {t.columns.actions}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan="6"
                                                className="px-4 py-8 text-center text-text-muted"
                                            >
                                                {lang === "ar"
                                                    ? "لا توجد فئات حالياً"
                                                    : "No categories found"}
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((category, index) => {
                                            const level = getCategoryLevel(category);
                                            return (
                                                <tr
                                                    key={category.id}
                                                    className="hover:bg-surface-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="font-bold text-text text-[13px]">
                                                                {category.name}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getLevelBadge(level)}
                                                    </td>
                                                    <td className="px-4 py-3 text-text-muted text-xs">
                                                        {category.parent ? (
                                                            <span className="font-medium text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-none">
                                                                {category.parent.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`text-[10px] px-2 py-0.5 rounded-none font-medium border ${category.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-gray-500/10 text-gray-500 border-gray-200"}`}
                                                        >
                                                            {category.is_active
                                                                ? lang === "ar"
                                                                    ? "نشط"
                                                                    : "Active"
                                                                : lang === "ar"
                                                                  ? "غير نشط"
                                                                  : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                                                        <Tooltip
                                                            text={
                                                                lang === "ar"
                                                                    ? "تعديل"
                                                                    : "Edit"
                                                            }
                                                        >
                                                            <button
                                                                onClick={() => openEditModal(category)}
                                                                className="p-1.5 rounded-none text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-colors inline-flex items-center justify-center"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip
                                                            text={
                                                                lang === "ar"
                                                                    ? "حذف"
                                                                    : "Delete"
                                                            }
                                                        >
                                                            <button
                                                                onClick={() => requestDelete(route("settings.inventory-categories.destroy", category.id), category)}
                                                                className="p-1.5 rounded-none text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-colors inline-flex items-center justify-center"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                show={isFormModalOpen}
                onClose={closeModals}
                maxWidth="md"
            >
                <form
                    onSubmit={submitForm}
                    className="p-5 space-y-4"
                >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-lg text-text">
                            {categoryToEdit
                                ? lang === "ar"
                                    ? "تعديل فئة الأصناف"
                                    : "Edit Category"
                                : lang === "ar"
                                  ? "إضافة فئة جديدة"
                                  : "Add New Category"}
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "اسم الفئة *"
                                        : "Category Name *"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-sm rounded-none border-border"
                                value={data.name}
                                onChange={(e) => setData("name", e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "الفئة الأب (تحديد فئة من المستوى 1 أو 2 فقط لتفادي تخطي 3 مستويات)"
                                        : "Parent Category (Select Level 1 or 2 to maintain max 3 levels)"
                                }
                            />
                            <select
                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                value={data.parent_id}
                                onChange={(e) => setData("parent_id", e.target.value)}
                            >
                                <option value="">
                                    {lang === "ar"
                                        ? "بدون فئة أب (فئة رئيسية - مستوى 1)"
                                        : "No Parent (Main Category - Level 1)"}
                                </option>
                                {allowedParents.map((c) => {
                                    const lvl = getCategoryLevel(c);
                                    return (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({lang === "ar" ? `مستوى ${lvl}` : `Level ${lvl}`})
                                        </option>
                                    );
                                })}
                            </select>
                            <InputError message={errors.parent_id} className="mt-1" />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active_category"
                                className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                            />
                            <label
                                htmlFor="is_active_category"
                                className="text-sm text-text cursor-pointer select-none"
                            >
                                {lang === "ar"
                                    ? "نشط (متاح للاستخدام)"
                                    : "Active (available for use)"}
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={closeModals}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing} className="rounded-none">
                            {categoryToEdit
                                ? lang === "ar"
                                    ? "حفظ التعديلات"
                                    : "Save Changes"
                                : lang === "ar"
                                  ? "إضافة"
                                  : "Add"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <ConfirmationModal
                show={!!itemToDelete}
                title={lang === "ar" ? "حذف فئة الأصناف" : "Delete Category"}
                message={
                    (lang === "ar" ? "هل أنت متأكد من حذف فئة " : "Are you sure you want to delete ") +
                    (itemToDelete?.name || "") + "؟"
                }
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={deleteProcessing}
            />
        </AuthenticatedLayout>
    );
}
