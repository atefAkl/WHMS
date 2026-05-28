import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { useState } from "react";
import {
    Layers,
    Plus,
    Edit,
    Trash2,
    Home,
    ChevronRight,
    FolderTree,
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

export default function Categories({ auth, categories, parentCategories }) {
    const { lang } = useLang();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

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
        name_ar: "",
        name_en: "",
        parent_id: "",
    });

    const t = {
        title: lang === "ar" ? "تصنيفات العملاء" : "Customer Categories",
        home: lang === "ar" ? "الإعدادات" : "Settings",
        add: lang === "ar" ? "إضافة تصنيف" : "Add Category",
        columns: {
            name: lang === "ar" ? "اسم التصنيف" : "Category Name",
            parent: lang === "ar" ? "التصنيف الرئيسي" : "Main Category",
            actions: lang === "ar" ? "إجراءات" : "Actions",
        },
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCategoryToEdit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (category) => {
        clearErrors();
        setData({
            name_ar: category.name_ar,
            name_en: category.name_en,
            parent_id: category.parent_id || "",
        });
        setCategoryToEdit(category);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (category) => {
        setCategoryToDelete(category);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            reset();
            setCategoryToEdit(null);
            setCategoryToDelete(null);
            clearErrors();
        }, 200);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (categoryToEdit) {
            put(route("settings.categories.update", categoryToEdit.id), {
                onSuccess: () => closeModals(),
            });
        } else {
            post(route("settings.categories.store"), {
                onSuccess: () => closeModals(),
            });
        }
    };

    const deleteCategory = () => {
        if (!categoryToDelete) return;
        destroy(route("settings.categories.destroy", categoryToDelete.id), {
            onSuccess: () => closeModals(),
        });
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

            <div className="py-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 main-stack-y">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text">
                                {t.title}
                            </h2>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === "ar"
                                    ? "إدارة الهيكل التنظيمي لتصنيفات العملاء"
                                    : "Manage customer categories hierarchy"}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={openCreateModal}
                                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                {t.add}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
                        <div className="border-b border-border p-4 bg-surface-muted/30 flex items-center justify-between">
                            <h3 className="font-semibold text-text flex items-center gap-2">
                                <FolderTree className="h-5 w-5 text-primary" />
                                {lang === "ar"
                                    ? "المخطط العام للتصنيفات"
                                    : "Categories Hierarchy"}
                            </h3>
                            <span className="text-sm text-text-muted font-medium">
                                {categories.total}{" "}
                                {lang === "ar" ? "تصنيف" : "Categories"}
                            </span>
                        </div>

                        <div className="flex-1 bg-surface p-0 min-h-[400px]">
                            {categories.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
                                    <Layers className="h-12 w-12 opacity-20 mb-4" />
                                    <p className="text-lg font-medium">
                                        {lang === "ar"
                                            ? "لم يتم العثور على بيانات"
                                            : "No data found"}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-surface-muted/50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                >
                                                    {t.columns.name}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                >
                                                    {t.columns.parent}
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-text-muted"
                                                >
                                                    {t.columns.actions}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-surface">
                                            {categories.data.map((category) => (
                                                <tr
                                                    key={category.id}
                                                    className="transition-colors hover:bg-surface-muted/50"
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={
                                                                    category.parent_id
                                                                        ? "h-2 w-2 rounded-full bg-emerald-500"
                                                                        : "h-2 w-2 rounded-full bg-primary"
                                                                }
                                                            />
                                                            <div>
                                                                <div className="text-sm font-bold text-text">
                                                                    {lang ===
                                                                    "ar"
                                                                        ? category.name_ar
                                                                        : category.name_en}
                                                                </div>
                                                                <div className="text-xs text-text-muted">
                                                                    {lang ===
                                                                    "ar"
                                                                        ? category.name_en
                                                                        : category.name_ar}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text font-medium">
                                                        {category.parent ? (
                                                            <span className="inline-flex items-center rounded-md bg-surface-muted px-2 py-1 text-xs font-medium text-text-muted ring-1 ring-inset ring-border">
                                                                {lang === "ar"
                                                                    ? category
                                                                          .parent
                                                                          .name_ar
                                                                    : category
                                                                          .parent
                                                                          .name_en}
                                                            </span>
                                                        ) : (
                                                            <span className="text-text-muted text-xs italic">
                                                                -
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-end text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Tooltip
                                                                text={
                                                                    lang ===
                                                                    "ar"
                                                                        ? "تعديل"
                                                                        : "Edit"
                                                                }
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        openEditModal(
                                                                            category,
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip
                                                                text={
                                                                    lang ===
                                                                    "ar"
                                                                        ? "حذف"
                                                                        : "Delete"
                                                                }
                                                            >
                                                                <button
                                                                    onClick={() =>
                                                                        openDeleteModal(
                                                                            category,
                                                                        )
                                                                    }
                                                                    className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <Pagination
                            links={categories.links}
                            total={categories.total}
                            from={categories.from}
                            to={categories.to}
                        />
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={isFormModalOpen} onClose={closeModals} maxWidth="md">
                <form onSubmit={submitForm} className="p-6">
                    <h2 className="text-lg font-bold text-text mb-6">
                        {categoryToEdit
                            ? lang === "ar"
                                ? "تعديل التصنيف"
                                : "Edit Category"
                            : t.add}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                htmlFor="name_ar"
                                value={
                                    lang === "ar"
                                        ? "الاسم بالعربية"
                                        : "Arabic Name"
                                }
                            />
                            <TextInput
                                id="name_ar"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.name_ar}
                                onChange={(e) =>
                                    setData("name_ar", e.target.value)
                                }
                                required
                                autoFocus
                            />
                            <InputError
                                message={errors.name_ar}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="name_en"
                                value={
                                    lang === "ar"
                                        ? "الاسم بالإنجليزية"
                                        : "English Name"
                                }
                            />
                            <TextInput
                                id="name_en"
                                type="text"
                                className="mt-1 block w-full text-left"
                                value={data.name_en}
                                onChange={(e) =>
                                    setData("name_en", e.target.value)
                                }
                                required
                                dir="ltr"
                            />
                            <InputError
                                message={errors.name_en}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <InputLabel
                                htmlFor="parent_id"
                                value={
                                    lang === "ar"
                                        ? "التصنيف الرئيسي (اختياري)"
                                        : "Parent Category (Optional)"
                                }
                            />
                            <select
                                id="parent_id"
                                className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={data.parent_id}
                                onChange={(e) =>
                                    setData("parent_id", e.target.value)
                                }
                            >
                                <option value="">
                                    {lang === "ar"
                                        ? "-- بدون تصنيف رئيسي --"
                                        : "-- No Parent --"}
                                </option>
                                {parentCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {lang === "ar"
                                            ? cat.name_ar
                                            : cat.name_en}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.parent_id}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModals}>
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {lang === "ar" ? "حفظ" : "Save"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={isDeleteModalOpen} onClose={closeModals} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 mb-4">
                        <Trash2 className="h-6 w-6 text-danger" />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">
                        {lang === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
                    </h3>
                    <p className="text-sm text-text-muted mb-6">
                        {lang === "ar"
                            ? "هل أنت متأكد من حذف هذا التصنيف؟"
                            : "Are you sure you want to delete this category?"}
                    </p>
                    <div className="flex justify-center gap-3">
                        <SecondaryButton type="button" onClick={closeModals}>
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <DangerButton
                            onClick={deleteCategory}
                            disabled={processing}
                        >
                            {lang === "ar" ? "حذف" : "Delete"}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
