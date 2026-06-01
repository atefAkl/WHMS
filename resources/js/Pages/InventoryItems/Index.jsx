import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Box,
    Home,
    ChevronRight,
    Plus,
    Edit,
    Trash2,
    X,
    Save,
    Eye,
    Folder,
    FolderOpen,
    FileText,
    Grid,
    List,
    Image as ImageIcon,
    ShieldAlert,
    Tags,
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

export default function Index({ items = [], categories = [] }) {
    const { lang } = useLang();

    // View modes: 'grid' (cards) or 'list' (table)
    const [viewMode, setViewMode] = useState("grid");

    // Selected category filter
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    // Expanded categories in the tree
    const [expandedCategories, setExpandedCategories] = useState({});

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isQuickCategoryModalOpen, setQuickCategoryModalOpen] =
        useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");

    // Form setup using Inertia useForm
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            category_id: "",
            image: null,
            is_active: true,
            variants: [], // Array of { id, name, quality, default_price, is_active }
            _method: "POST", // for method spoofing during file upload
        });

    const {
        data: categoryData,
        setData: setCategoryData,
        post: postCategory,
        processing: categoryProcessing,
        errors: categoryErrors,
        reset: resetCategory,
        clearErrors: clearCategoryErrors,
    } = useForm({
        name: "",
        parent_id: "",
        is_active: true,
    });

    const getCategoryDisplayName = (rawName) => {
        if (!rawName) return "";
        const chunks = rawName
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
        if (chunks.length === 0) return rawName;
        return lang === "ar" ? chunks[0] : (chunks[1] || chunks[0]);
    };

    const toggleExpand = (catId) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [catId]: !prev[catId],
        }));
    };

    // Helper: Build category tree
    const buildTree = () => {
        const level1 = categories.filter((c) => !c.parent_id);
        return level1.map((l1) => {
            const level2 = categories.filter((c) => c.parent_id === l1.id);
            return {
                ...l1,
                children: level2.map((l2) => {
                    const level3 = categories.filter(
                        (c) => c.parent_id === l2.id,
                    );
                    return {
                        ...l2,
                        children: level3,
                    };
                }),
            };
        });
    };

    const categoryTree = buildTree();

    // Helper: Find category level (1-indexed)
    const getCategoryLevel = (category) => {
        if (!category.parent_id) return 1;
        const parent = categories.find((c) => c.id === category.parent_id);
        if (!parent) return 1;
        if (!parent.parent_id) return 2;
        return 3;
    };

    // Filter categories to only level 3 for item assignment
    const level3Categories = categories.filter(
        (c) => getCategoryLevel(c) === 3,
    );

    // Get full category breadcrumbs path for an item or category
    const getCategoryPath = (catId) => {
        if (!catId) return "";
        const cat = categories.find((c) => c.id === catId);
        if (!cat) return "";
        if (!cat.parent_id) return getCategoryDisplayName(cat.name);

        const parent = categories.find((c) => c.id === cat.parent_id);
        if (!parent) return getCategoryDisplayName(cat.name);
        if (!parent.parent_id)
            return `${getCategoryDisplayName(parent.name)} - ${getCategoryDisplayName(cat.name)}`;

        const grandParent = categories.find((c) => c.id === parent.parent_id);
        if (!grandParent)
            return `${getCategoryDisplayName(parent.name)} - ${getCategoryDisplayName(cat.name)}`;

        return `${getCategoryDisplayName(parent.name)} - ${getCategoryDisplayName(cat.name)}`;
    };

    // Filter items based on selected category (including subcategories if selected is lvl 1 or 2)
    const getFilteredItems = () => {
        if (!selectedCategoryId) return items;

        const getDescendentIds = (catId) => {
            let ids = [catId];
            const children = categories.filter((c) => c.parent_id === catId);
            children.forEach((child) => {
                ids = [...ids, ...getDescendentIds(child.id)];
            });
            return ids;
        };

        const activeIds = getDescendentIds(selectedCategoryId);
        return items.filter((item) => activeIds.includes(item.category_id));
    };

    const filteredItems = getFilteredItems();

    const openCreateModal = (presetCategoryId = null) => {
        clearErrors();
        reset();
        const selectedAsString = presetCategoryId
            ? String(presetCategoryId)
            : "";
        const isPresetLevel3 = selectedAsString
            ? level3Categories.some((c) => String(c.id) === selectedAsString)
            : false;

        setData({
            name: "",
            category_id: isPresetLevel3
                ? selectedAsString
                : String(level3Categories[0]?.id || ""),
            image: null,
            is_active: true,
            variants: [
                { name: "", quality: "", default_price: 0, is_active: true },
            ],
            _method: "POST",
        });
        setCreateModalOpen(true);
    };

    const openEditModal = (item) => {
        clearErrors();
        setData({
            name: item.name,
            category_id: String(item.category_id || ""),
            image: null,
            is_active: item.is_active,
            variants:
                item.variants.length > 0
                    ? item.variants.map((v) => ({
                          id: v.id,
                          name: v.name,
                          quality: v.quality || "",
                          default_price: v.default_price,
                          is_active: v.is_active,
                      }))
                    : [
                          {
                              name: "",
                              quality: "",
                              default_price: 0,
                              is_active: true,
                          },
                      ],
            _method: "PUT",
        });
        setItemToEdit(item);
    };

    const openQuickCategoryModal = (presetParentId = "") => {
        clearCategoryErrors();
        resetCategory();
        setCategoryData("name", "");
        setCategoryData(
            "parent_id",
            presetParentId ? String(presetParentId) : "",
        );
        setCategoryData("is_active", true);
        setQuickCategoryModalOpen(true);
    };

    const submitQuickCategory = (e) => {
        e.preventDefault();
        postCategory(route("settings.inventory-categories.store"), {
            preserveScroll: true,
            onSuccess: () => {
                setQuickCategoryModalOpen(false);
                resetCategory();
            },
        });
    };

    const handleAddVariantRow = () => {
        setData("variants", [
            ...data.variants,
            { name: "", quality: "", default_price: 0, is_active: true },
        ]);
    };

    const handleRemoveVariantRow = (index) => {
        const updated = [...data.variants];
        updated.splice(index, 1);
        setData("variants", updated);
    };

    const handleVariantChange = (index, field, value) => {
        const updated = [...data.variants];
        updated[index][field] = value;
        setData("variants", updated);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route("inventory-items.store"), {
            onSuccess: () => setCreateModalOpen(false),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        post(route("inventory-items.update", itemToEdit.id), {
            forceFormData: true,
            onSuccess: () => setItemToEdit(null),
        });
    };

    const confirmDelete = (e) => {
        e.preventDefault();
        setDeleteError("");

        router.post(
            route("inventory-items.destroy", itemToDelete.id),
            {
                _method: "DELETE",
                password: deletePassword,
            },
            {
                onSuccess: () => {
                    setItemToDelete(null);
                    setDeletePassword("");
                },
                onError: (errs) => {
                    if (errs.error) {
                        setDeleteError(errs.error);
                    } else if (errs.password) {
                        setDeleteError(errs.password);
                    } else {
                        setDeleteError(
                            lang === "ar"
                                ? "حدث خطأ ما."
                                : "An error occurred.",
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
            <span className="text-primary font-medium">
                {lang === "ar" ? "الأصناف المخزنية" : "Inventory Items"}
            </span>
        </div>
    );

    const selectedCategory = selectedCategoryId
        ? categories.find((c) => c.id === selectedCategoryId)
        : null;
    const selectedCategoryLevel = selectedCategory
        ? getCategoryLevel(selectedCategory)
        : 0;
    const canCreateFromSelectedCategory = !!selectedCategory;
    const shouldCreateItemForSelectedCategory = selectedCategoryLevel === 3;
    const categoryParentCandidates = categories.filter(
        (c) => getCategoryLevel(c) < 3,
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={lang === "ar" ? "الأصناف المخزنية" : "Inventory Items"}
            />

            <div
                className="max-w-7xl mx-auto pb-8 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                <PageHeader
                    icon={Box}
                    title={
                        lang === "ar" ? "الأصناف المخزنية" : "Inventory Items"
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "إدارة المنتجات والبضائع المخزنية وأشكالها (Variants) في المستودعات"
                                : "Manage physical goods, their packaging formats (Variants), and parameters"}
                        </p>
                    }
                    actions={
                        <Tooltip
                            text={
                                lang === "ar"
                                    ? "إضافة صنف جديد"
                                    : "Add New Item"
                            }
                        >
                            <PrimaryButton
                                onClick={() => openCreateModal()}
                                className="px-4 py-2 rounded-none text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]"
                            >
                                <Plus className="h-4 w-4 shrink-0" />
                                <span className="display-me">
                                    {lang === "ar"
                                        ? "إضافة صنف جديد"
                                        : "Add New Item"}
                                </span>
                            </PrimaryButton>
                        </Tooltip>
                    }
                />

                {/* Main Split Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Panel: Category Tree Hierarchy */}
                    <div className="md:col-span-1 bg-surface border border-border p-4 shadow-sm rounded-none main-stack-y">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                            <span className="font-bold text-xs text-text flex items-center gap-1.5">
                                <Tags className="h-4 w-4 text-primary" />
                                {lang === "ar"
                                    ? "شجرة تصنيفات السلع"
                                    : "Categories Tree"}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openQuickCategoryModal("")}
                                    className="text-[10px] h-6 px-2 border border-primary/25 text-primary hover:bg-primary/10 transition-colors"
                                >
                                    {lang === "ar"
                                        ? "إنشاء فئة"
                                        : "New Category"}
                                </button>
                                {selectedCategoryId && (
                                    <button
                                        onClick={() =>
                                            setSelectedCategoryId(null)
                                        }
                                        className="text-[10px] text-primary hover:underline"
                                    >
                                        {lang === "ar"
                                            ? "إعادة تعيين"
                                            : "Reset"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Flat/Hierarchical Tree */}
                        <div className="space-y-1 text-xs">
                            <button
                                onClick={() => setSelectedCategoryId(null)}
                                className={`w-full text-start px-2 py-1.5 transition-colors flex items-center gap-2 rounded-none font-semibold ${
                                    !selectedCategoryId
                                        ? "bg-primary/10 text-primary border-l-2 border-primary"
                                        : "text-text hover:bg-surface-muted"
                                }`}
                            >
                                <Box className="h-3.5 w-3.5" />
                                <span>
                                    {lang === "ar" ? "كل الأصناف" : "All Items"}
                                </span>
                                <span className="ms-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2">
                                    {items.length}
                                </span>
                            </button>

                            <div className="mt-2 space-y-1">
                                {categoryTree.map((lvl1) => {
                                    const hasLvl2 =
                                        lvl1.children &&
                                        lvl1.children.length > 0;
                                    const isLvl1Expanded =
                                        !!expandedCategories[lvl1.id];

                                    return (
                                        <div
                                            key={lvl1.id}
                                            className="space-y-1"
                                        >
                                            {/* Level 1 Category */}
                                            <div
                                                onClick={() => {
                                                    if (hasLvl2)
                                                        toggleExpand(lvl1.id);
                                                    setSelectedCategoryId(
                                                        lvl1.id,
                                                    );
                                                }}
                                                className={`w-full text-start px-2 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer rounded-none ${
                                                    selectedCategoryId ===
                                                    lvl1.id
                                                        ? "bg-primary/5 text-primary border-s border-primary font-bold"
                                                        : "text-text hover:bg-surface-muted font-medium"
                                                }`}
                                            >
                                                {hasLvl2 ? (
                                                    isLvl1Expanded ? (
                                                        <FolderOpen className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                    ) : (
                                                        <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                    )
                                                ) : (
                                                    <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                )}
                                                <span className="truncate">
                                                    {getCategoryDisplayName(
                                                        lvl1.name,
                                                    )}
                                                </span>
                                            </div>

                                            {/* Level 2 Children */}
                                            {hasLvl2 && isLvl1Expanded && (
                                                <div className="ps-4 space-y-1 border-s border-dashed border-border ms-3.5">
                                                    {lvl1.children.map(
                                                        (lvl2) => {
                                                            const hasLvl3 =
                                                                lvl2.children &&
                                                                lvl2.children
                                                                    .length > 0;
                                                            const isLvl2Expanded =
                                                                !!expandedCategories[
                                                                    lvl2.id
                                                                ];

                                                            return (
                                                                <div
                                                                    key={
                                                                        lvl2.id
                                                                    }
                                                                    className="space-y-1"
                                                                >
                                                                    {/* Level 2 Category */}
                                                                    <div
                                                                        onClick={() => {
                                                                            if (
                                                                                hasLvl3
                                                                            )
                                                                                toggleExpand(
                                                                                    lvl2.id,
                                                                                );
                                                                            setSelectedCategoryId(
                                                                                lvl2.id,
                                                                            );
                                                                        }}
                                                                        className={`w-full text-start px-2 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer rounded-none ${
                                                                            selectedCategoryId ===
                                                                            lvl2.id
                                                                                ? "bg-primary/5 text-primary border-s border-primary font-bold"
                                                                                : "text-text-muted hover:text-text hover:bg-surface-muted font-medium"
                                                                        }`}
                                                                    >
                                                                        {hasLvl3 ? (
                                                                            isLvl2Expanded ? (
                                                                                <FolderOpen className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                                            ) : (
                                                                                <Folder className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                                                            )
                                                                        ) : (
                                                                            <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                                        )}
                                                                        <span className="truncate">
                                                                            {getCategoryDisplayName(
                                                                                lvl2.name,
                                                                            )}
                                                                        </span>
                                                                    </div>

                                                                    {/* Level 3 Children */}
                                                                    {hasLvl3 &&
                                                                        isLvl2Expanded && (
                                                                            <div className="ps-4 space-y-1 border-s border-dashed border-border ms-3.5">
                                                                                {lvl2.children.map(
                                                                                    (
                                                                                        lvl3,
                                                                                    ) => {
                                                                                        const lvl3ItemCount =
                                                                                            items.filter(
                                                                                                (
                                                                                                    i,
                                                                                                ) =>
                                                                                                    i.category_id ===
                                                                                                    lvl3.id,
                                                                                            ).length;
                                                                                        return (
                                                                                            <div
                                                                                                key={
                                                                                                    lvl3.id
                                                                                                }
                                                                                                onClick={() =>
                                                                                                    setSelectedCategoryId(
                                                                                                        lvl3.id,
                                                                                                    )
                                                                                                }
                                                                                                className={`w-full text-start px-2 py-1 transition-colors flex items-center gap-1.5 cursor-pointer rounded-none text-[11px] ${
                                                                                                    selectedCategoryId ===
                                                                                                    lvl3.id
                                                                                                        ? "bg-primary/10 text-primary font-bold border-s-2 border-primary"
                                                                                                        : "text-text-muted hover:text-text hover:bg-surface-muted"
                                                                                                }`}
                                                                                            >
                                                                                                <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                                                                <span className="truncate">
                                                                                                    {getCategoryDisplayName(
                                                                                                        lvl3.name,
                                                                                                    )}
                                                                                                </span>
                                                                                                <span className="ms-auto font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-none">
                                                                                                    {
                                                                                                        lvl3ItemCount
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        );
                                                                                    },
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            );
                                                        },
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Storage Items Area */}
                    <div className="md:col-span-3 main-stack-y">
                        {/* Header bar of area */}
                        <div className="bg-surface border border-border p-3 flex items-center justify-between shadow-sm rounded-none">
                            <div className="text-xs">
                                <span className="text-text-muted">
                                    {lang === "ar"
                                        ? "التصنيف المحدد: "
                                        : "Active Category: "}
                                </span>
                                <span className="font-bold text-text">
                                    {selectedCategoryId
                                        ? getCategoryPath(selectedCategoryId)
                                        : lang === "ar"
                                          ? "كل الأصناف"
                                          : "All Categories"}
                                </span>
                                <span className="mx-2 text-text-muted">|</span>
                                <span className="text-text-muted">
                                    {lang === "ar" ? "العدد: " : "Count: "}
                                </span>
                                <span className="font-bold text-primary">
                                    {filteredItems.length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                {canCreateFromSelectedCategory && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (
                                                shouldCreateItemForSelectedCategory
                                            ) {
                                                openCreateModal(
                                                    selectedCategoryId,
                                                );
                                            } else {
                                                openQuickCategoryModal(
                                                    selectedCategoryId,
                                                );
                                            }
                                        }}
                                        className="inline-flex items-center gap-1.5 h-[28px] px-2.5 border border-primary/30 bg-primary/5 text-primary text-[11px] font-bold hover:bg-primary/10 transition-colors"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        {shouldCreateItemForSelectedCategory
                                            ? lang === "ar"
                                                ? "إضافة صنف جديد"
                                                : "Add New Item"
                                            : lang === "ar"
                                              ? "إضافة فئة فرعية"
                                              : "Add Subcategory"}
                                    </button>
                                )}

                                {/* Toggle View Mode */}
                                <div className="flex items-center gap-1 border border-border p-0.5 rounded-none bg-surface-muted">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-1 rounded-none transition-all ${viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text"}`}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-1 rounded-none transition-all ${viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-text-muted hover:text-text"}`}
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Storage Items Display */}
                        {filteredItems.length === 0 ? (
                            <div className="bg-surface border border-border p-12 text-center shadow-sm rounded-none">
                                <Box className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <h3 className="font-bold text-sm text-text">
                                    {lang === "ar"
                                        ? "لا توجد أصناف مخزنية"
                                        : "No Inventory Items"}
                                </h3>
                                <p className="text-xs text-text-muted mt-1">
                                    {lang === "ar"
                                        ? "لم يتم العثور على أصناف في هذا التصنيف حالياً."
                                        : "No items have been added to this category yet."}
                                </p>
                            </div>
                        ) : viewMode === "grid" ? (
                            /* Primary Cards Grid */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-surface border border-border p-4 shadow-sm flex flex-col justify-between rounded-none hover:border-primary/50 transition-all group"
                                    >
                                        <div className="space-y-3">
                                            {/* Item Image or Placeholder */}
                                            <div className="h-32 w-full bg-slate-50 border border-border flex items-center justify-center overflow-hidden rounded-none relative">
                                                {item.image ? (
                                                    <img
                                                        src={item.image}
                                                        alt={getCategoryDisplayName(item.name)}
                                                        className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-8 w-8 text-slate-300" />
                                                )}
                                                <span className="absolute top-2 right-2 font-mono text-[9px] bg-slate-800 text-white px-1.5 py-0.5 rounded-none font-bold">
                                                    {item.code}
                                                </span>
                                            </div>

                                            {/* Item Details */}
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-[13px] text-text truncate group-hover:text-primary transition-colors">
                                                    {getCategoryDisplayName(item.name)}
                                                </h4>
                                                <div className="text-[10px] text-text-muted truncate">
                                                    {lang === "ar"
                                                        ? "الفئة: "
                                                        : "Category: "}
                                                    {getCategoryPath(
                                                        item.category_id,
                                                    ) || "—"}
                                                </div>
                                            </div>

                                            {/* Variants Badge Count */}
                                            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                                                <span className="text-text-muted">
                                                    {lang === "ar"
                                                        ? "عدد الأشكال:"
                                                        : "Variants count:"}
                                                </span>
                                                <span className="font-bold text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-none">
                                                    {item.variants
                                                        ? item.variants.length
                                                        : 0}{" "}
                                                    {lang === "ar"
                                                        ? "أشكال"
                                                        : "shapes"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="flex items-center justify-between pt-4 mt-2">
                                            <span
                                                className={`text-[9px] px-2 py-0.5 rounded-none font-medium border ${
                                                    item.is_active
                                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                                        : "bg-gray-500/10 text-gray-500 border-gray-200"
                                                }`}
                                            >
                                                {item.is_active
                                                    ? lang === "ar"
                                                        ? "نشط"
                                                        : "Active"
                                                    : lang === "ar"
                                                      ? "غير نشط"
                                                      : "Inactive"}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Tooltip
                                                    text={
                                                        lang === "ar"
                                                            ? "عرض التفاصيل"
                                                            : "Show Details"
                                                    }
                                                >
                                                    <Link
                                                        href={route(
                                                            "inventory-items.show",
                                                            item.id,
                                                        )}
                                                        className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Tooltip>
                                                <Tooltip
                                                    text={
                                                        lang === "ar"
                                                            ? "تعديل"
                                                            : "Edit"
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(item)
                                                        }
                                                        className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none"
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
                                                        onClick={() =>
                                                            setItemToDelete(
                                                                item,
                                                            )
                                                        }
                                                        className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all rounded-none"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Secondary List View (Table) */
                            <div className="bg-surface border border-border shadow-sm rounded-none overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-start">
                                        <thead className="bg-surface-muted/50 text-text-muted text-[11px] font-bold uppercase tracking-wide border-b border-border">
                                            <tr>
                                                <th className="px-4 py-3 text-start w-16">
                                                    {lang === "ar"
                                                        ? "الصورة"
                                                        : "Image"}
                                                </th>
                                                <th className="px-4 py-3 text-start">
                                                    {lang === "ar"
                                                        ? "الاسم"
                                                        : "Name"}
                                                </th>
                                                <th className="px-4 py-3 text-start">
                                                    {lang === "ar"
                                                        ? "كود الصنف"
                                                        : "Code"}
                                                </th>
                                                <th className="px-4 py-3 text-start">
                                                    {lang === "ar"
                                                        ? "الفئة"
                                                        : "Category"}
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    {lang === "ar"
                                                        ? "عدد الأشكال"
                                                        : "Variants"}
                                                </th>
                                                <th className="px-4 py-3 text-center w-24">
                                                    {lang === "ar"
                                                        ? "الحالة"
                                                        : "Status"}
                                                </th>
                                                <th className="px-4 py-3 text-end w-32">
                                                    {lang === "ar"
                                                        ? "الإجراءات"
                                                        : "Actions"}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredItems.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-surface-muted/30 transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="h-10 w-10 bg-slate-50 border border-border flex items-center justify-center overflow-hidden rounded-none">
                                                            {item.image ? (
                                                                <img
                                                                    src={
                                                                        item.image
                                                                    }
                                                                    alt={
                                                                        getCategoryDisplayName(item.name)
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4 text-slate-300" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-text text-[13px]">
                                                        {getCategoryDisplayName(item.name)}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-text-muted">
                                                        {item.code}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-text-muted">
                                                        {getCategoryPath(
                                                            item.category_id,
                                                        ) || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-primary">
                                                        {item.variants
                                                            ? item.variants
                                                                  .length
                                                            : 0}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span
                                                            className={`text-[9px] px-2 py-0.5 rounded-none font-medium border ${
                                                                item.is_active
                                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                                                                    : "bg-gray-500/10 text-gray-500 border-gray-200"
                                                            }`}
                                                        >
                                                            {item.is_active
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
                                                                    ? "عرض التفاصيل"
                                                                    : "Show Details"
                                                            }
                                                        >
                                                            <Link
                                                                href={route(
                                                                    "inventory-items.show",
                                                                    item.id,
                                                                )}
                                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Tooltip>
                                                        <Tooltip
                                                            text={
                                                                lang === "ar"
                                                                    ? "تعديل"
                                                                    : "Edit"
                                                            }
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    openEditModal(
                                                                        item,
                                                                    )
                                                                }
                                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
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
                                                                onClick={() =>
                                                                    setItemToDelete(
                                                                        item,
                                                                    )
                                                                }
                                                                className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all rounded-none inline-flex items-center"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create/Edit Item Modal */}
            <Modal
                show={isCreateModalOpen || !!itemToEdit}
                onClose={() => {
                    setCreateModalOpen(false);
                    setItemToEdit(null);
                }}
                maxWidth="lg"
            >
                <form
                    onSubmit={itemToEdit ? submitEdit : submitCreate}
                    className="p-5 main-stack-y"
                >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-lg text-text">
                            {itemToEdit
                                ? lang === "ar"
                                    ? "تعديل صنف مخزني"
                                    : "Edit Inventory Item"
                                : lang === "ar"
                                  ? "إضافة صنف مخزني جديد"
                                  : "Add New Inventory Item"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => {
                                setCreateModalOpen(false);
                                setItemToEdit(null);
                            }}
                            className="text-text-muted hover:text-text"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "اسم المنتج بالعقد *"
                                        : "Product Name in Contract *"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-sm rounded-none border-border"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "الفئة (المستوى الثالث النهائي) *"
                                        : "Category (Final Level 3) *"
                                }
                            />
                            <select
                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                value={data.category_id}
                                onChange={(e) =>
                                    setData("category_id", e.target.value)
                                }
                                required
                            >
                                <option value="">
                                    {lang === "ar"
                                        ? "-- اختر فئة مستوى 3 --"
                                        : "-- Select Level 3 Category --"}
                                </option>
                                {level3Categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {getCategoryPath(c.id)}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.category_id}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "صورة المنتج"
                                        : "Product Image"
                                }
                            />
                            <input
                                type="file"
                                accept="image/*"
                                className="mt-1 block w-full text-xs text-text border border-border bg-surface focus:outline-none rounded-none cursor-pointer p-2"
                                onChange={(e) => {
                                    if (itemToEdit) {
                                        setData(
                                            "image_file",
                                            e.target.files[0],
                                        );
                                    } else {
                                        setData("image", e.target.files[0]);
                                    }
                                }}
                            />
                            {itemToEdit && itemToEdit.image && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-text-muted">
                                        {lang === "ar"
                                            ? "الصورة الحالية:"
                                            : "Current:"}
                                    </span>
                                    <img
                                        src={itemToEdit.image}
                                        alt={getCategoryDisplayName(itemToEdit.name)}
                                        className="h-10 w-10 object-cover border border-border rounded-none"
                                    />
                                </div>
                            )}
                            <InputError
                                message={errors.image || errors.image_file}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    id="item_is_active"
                                    className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                    checked={data.is_active}
                                    onChange={(e) =>
                                        setData("is_active", e.target.checked)
                                    }
                                />
                                <span className="text-sm text-text font-medium">
                                    {lang === "ar"
                                        ? "نشط (متاح للاستخدام)"
                                        : "Active (available for use)"}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Variants Manager (full width at bottom) */}
                    <div className="border border-border p-4 bg-surface-muted/30 rounded-none main-stack-y">
                        <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                            <span className="font-bold text-xs text-text">
                                {lang === "ar"
                                    ? "أشكال المنتج المتوفرة (Variants) *"
                                    : "Packaging Shapes/Variants *"}
                            </span>
                            <button
                                type="button"
                                onClick={handleAddVariantRow}
                                className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-1 hover:bg-primary/95 transition-all rounded-none h-[24px]"
                            >
                                <Plus className="h-3 w-3" />
                                {lang === "ar" ? "إضافة شكل" : "Add Shape"}
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                            {data.variants.map((variant, idx) => (
                                <div
                                    key={idx}
                                    className="border border-border bg-surface p-3 relative rounded-none shadow-sm"
                                >
                                    {data.variants.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveVariantRow(idx)
                                            }
                                            className="absolute top-2 right-2 text-danger hover:text-danger/80"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs items-end">
                                        <div className="md:col-span-4">
                                            {idx === 0 && (
                                                <label className="block text-[10px] font-bold text-text-muted mb-0.5">
                                                    {lang === "ar"
                                                        ? "الاسم (مثال: 3ك | 3kg)"
                                                        : "Name (e.g. 3kg | 3ك)"}{" "}
                                                    *
                                                </label>
                                            )}
                                            <input
                                                type="text"
                                                required
                                                className="w-full text-xs border-border bg-surface text-text focus:ring-primary focus:border-primary rounded-none p-1.5"
                                                value={variant.name}
                                                onChange={(e) =>
                                                    handleVariantChange(
                                                        idx,
                                                        "name",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            {idx === 0 && (
                                                <label className="block text-[10px] font-bold text-text-muted mb-0.5">
                                                    {lang === "ar"
                                                        ? "الجودة (مثال: ممتاز)"
                                                        : "Quality (e.g. Premium)"}
                                                </label>
                                            )}
                                            <input
                                                type="text"
                                                className="w-full text-xs border-border bg-surface text-text focus:ring-primary focus:border-primary rounded-none p-1.5"
                                                value={variant.quality}
                                                onChange={(e) =>
                                                    handleVariantChange(
                                                        idx,
                                                        "quality",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            {idx === 0 && (
                                                <label className="block text-[10px] font-bold text-text-muted mb-0.5">
                                                    {lang === "ar"
                                                        ? "السعر الافتراضي"
                                                        : "Default Price"}{" "}
                                                    *
                                                </label>
                                            )}
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                required
                                                className="w-full text-xs border-border bg-surface text-text font-mono focus:ring-primary focus:border-primary rounded-none p-1.5"
                                                value={variant.default_price}
                                                onChange={(e) =>
                                                    handleVariantChange(
                                                        idx,
                                                        "default_price",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex items-end pb-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    className="rounded-none border-border text-primary focus:ring-primary h-3.5 w-3.5"
                                                    checked={variant.is_active}
                                                    onChange={(e) =>
                                                        handleVariantChange(
                                                            idx,
                                                            "is_active",
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <span className="text-[10px] font-medium text-text">
                                                    {lang === "ar"
                                                        ? "نشط"
                                                        : "Active"}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <InputError
                            message={errors.variants}
                            className="mt-1 text-xs"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => {
                                setCreateModalOpen(false);
                                setItemToEdit(null);
                            }}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={processing}
                            className="rounded-none"
                        >
                            <Save className="h-4 w-4 me-1.5" />
                            {itemToEdit
                                ? lang === "ar"
                                    ? "حفظ التعديلات"
                                    : "Save Changes"
                                : lang === "ar"
                                  ? "إضافة منتج"
                                  : "Add Product"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Quick Category Create Modal */}
            <Modal
                show={isQuickCategoryModalOpen}
                onClose={() => setQuickCategoryModalOpen(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={submitQuickCategory}
                    className="p-5 main-stack-y"
                >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "إنشاء فئة جديدة"
                                : "Create New Category"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setQuickCategoryModalOpen(false)}
                            className="text-text-muted hover:text-text"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
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
                                value={categoryData.name}
                                onChange={(e) =>
                                    setCategoryData("name", e.target.value)
                                }
                                required
                            />
                            <InputError
                                message={categoryErrors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "الفئة الأب"
                                        : "Parent Category"
                                }
                            />
                            <select
                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                value={categoryData.parent_id}
                                onChange={(e) =>
                                    setCategoryData("parent_id", e.target.value)
                                }
                            >
                                <option value="">
                                    {lang === "ar"
                                        ? "-- بدون فئة أب (مستوى أول) --"
                                        : "-- No parent (Level 1) --"}
                                </option>
                                {categoryParentCandidates.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {getCategoryPath(cat.id)}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={categoryErrors.parent_id}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                            checked={categoryData.is_active}
                            onChange={(e) =>
                                setCategoryData("is_active", e.target.checked)
                            }
                        />
                        <span className="text-sm text-text">
                            {lang === "ar" ? "نشطة" : "Active"}
                        </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setQuickCategoryModalOpen(false)}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={categoryProcessing}
                            className="rounded-none"
                        >
                            <Save className="h-4 w-4 me-1.5" />
                            {lang === "ar" ? "حفظ الفئة" : "Save Category"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Secure Delete Modal (requires password verification) */}
            <Modal
                show={!!itemToDelete}
                onClose={() => {
                    setItemToDelete(null);
                    setDeletePassword("");
                    setDeleteError("");
                }}
                maxWidth="sm"
            >
                <form
                    onSubmit={confirmDelete}
                    className="p-6 text-center space-y-4"
                >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-none bg-danger/10 border border-danger/25">
                        <ShieldAlert className="h-6 w-6 text-danger" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text">
                            {lang === "ar"
                                ? "تأكيد حذف صنف آمن"
                                : "Secure Deletion Confirmation"}
                        </h3>
                        <p className="text-sm text-text-muted mt-2">
                            {lang === "ar"
                                ? "أنت بصدد حذف صنف مخزني بالكامل وأشكاله المرتبطة."
                                : "You are about to permanently delete an inventory item and all its variants."}
                        </p>
                        <p className="text-xs text-danger/80 font-bold bg-danger/5 p-2 border border-danger/10 mt-2 rounded-none">
                            {lang === "ar"
                                ? `الصنف المستهدف: ${getCategoryDisplayName(itemToDelete?.name)}`
                                : `Target Item: ${getCategoryDisplayName(itemToDelete?.name)}`}
                        </p>
                    </div>

                    {/* Secure Deletion Password Input */}
                    <div className="text-start space-y-1">
                        <InputLabel
                            value={
                                lang === "ar"
                                    ? "كلمة مرور الحفظ/الحذف الآمنة للمدير *"
                                    : "Secure Deletion Password *"
                            }
                        />
                        <TextInput
                            type="password"
                            required
                            placeholder={
                                lang === "ar"
                                    ? "أدخل كلمة مرور الحذف الآمنة"
                                    : "Enter Secure password"
                            }
                            className="w-full text-sm rounded-none border-border"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                        />
                        {deleteError && (
                            <p className="text-xs text-danger font-bold mt-1">
                                {deleteError}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center gap-3 pt-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => {
                                setItemToDelete(null);
                                setDeletePassword("");
                                setDeleteError("");
                            }}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <DangerButton type="submit" className="rounded-none">
                            {lang === "ar"
                                ? "تأكيد الحذف الآمن"
                                : "Confirm Secure Delete"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
