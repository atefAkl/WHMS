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
    Wrench,
    Tags,
    Briefcase
} from "lucide-react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
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

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive'
    const [filterType, setFilterType] = useState("all"); // 'all', 'item', 'service'

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isQuickCategoryModalOpen, setQuickCategoryModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [categoryToEdit, setCategoryToEdit] = useState(null);
    
    // Checkbox selections for bulk actions
    const [selectedItems, setSelectedItems] = useState([]);

    // Deletion states
    const [itemToDelete, setItemToDelete] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState(null);
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");

    // Form setup using Inertia useForm
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name_ar: "",
            name_en: "",
            code: "",
            sales_category_id: "",
            type: "item",
            default_price: "",
            description_ar: "",
            is_active: true,
        });

    const {
        data: categoryData,
        setData: setCategoryData,
        post: postCategory,
        put: putCategory,
        processing: categoryProcessing,
        errors: categoryErrors,
        reset: resetCategory,
        clearErrors: clearCategoryErrors,
    } = useForm({
        name_ar: "",
        name_en: "",
        parent_id: "",
        is_active: true,
    });

    const getCategoryDisplayName = (cat) => {
        if (!cat) return "";
        return lang === "ar" ? cat.name_ar : (cat.name_en || cat.name_ar);
    };

    const getItemDisplayName = (item) => {
        if (!item) return "";
        return lang === "ar" ? item.name_ar : (item.name_en || item.name_ar);
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
                    const level3 = categories.filter((c) => c.parent_id === l2.id);
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

    // Get full category breadcrumbs path for an item or category
    const getCategoryPath = (catId) => {
        if (!catId) return "";
        const cat = categories.find((c) => c.id === catId);
        if (!cat) return "";
        if (!cat.parent_id) return getCategoryDisplayName(cat);

        const parent = categories.find((c) => c.id === cat.parent_id);
        if (!parent) return getCategoryDisplayName(cat);
        if (!parent.parent_id)
            return `${getCategoryDisplayName(parent)} - ${getCategoryDisplayName(cat)}`;

        const grandParent = categories.find((c) => c.id === parent.parent_id);
        if (!grandParent)
            return `${getCategoryDisplayName(parent)} - ${getCategoryDisplayName(cat)}`;

        return `${getCategoryDisplayName(parent)} - ${getCategoryDisplayName(cat)}`;
    };

    // Filter items based on selected category, search, and filters
    const getFilteredItems = () => {
        let result = items;

        if (selectedCategoryId) {
            const getDescendentIds = (catId) => {
                let ids = [catId];
                const children = categories.filter((c) => c.parent_id === catId);
                children.forEach((child) => {
                    ids = [...ids, ...getDescendentIds(child.id)];
                });
                return ids;
            };

            const activeIds = getDescendentIds(selectedCategoryId);
            result = result.filter((item) => activeIds.includes(item.sales_category_id));
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((item) => 
                (item.name_ar && item.name_ar.toLowerCase().includes(query)) ||
                (item.name_en && item.name_en.toLowerCase().includes(query)) ||
                (item.code && item.code.toLowerCase().includes(query))
            );
        }

        if (filterStatus !== "all") {
            const isActive = filterStatus === "active";
            result = result.filter(item => item.is_active === isActive);
        }

        if (filterType !== "all") {
            result = result.filter(item => item.type === filterType);
        }

        return result;
    };

    const filteredItems = getFilteredItems();

    const openCreateModal = (presetCategoryId = null) => {
        clearErrors();
        reset();
        const selectedAsString = presetCategoryId ? String(presetCategoryId) : "";

        setData({
            name_ar: "",
            name_en: "",
            code: "",
            sales_category_id: selectedAsString,
            type: "item",
            default_price: "",
            description_ar: "",
            is_active: true,
        });
        setCreateModalOpen(true);
    };

    const openEditModal = (item) => {
        clearErrors();
        setData({
            name_ar: item.name_ar,
            name_en: item.name_en || "",
            code: item.code || "",
            sales_category_id: String(item.sales_category_id || ""),
            type: item.type,
            default_price: item.default_price,
            description_ar: item.description_ar_ar || "",
            is_active: item.is_active,
        });
        setItemToEdit(item);
    };

    const openQuickCategoryModal = (presetParentId = "") => {
        clearCategoryErrors();
        resetCategory();
        setCategoryToEdit(null);
        setCategoryData({
            name_ar: "",
            name_en: "",
            parent_id: presetParentId ? String(presetParentId) : "",
            is_active: true,
        });
        setQuickCategoryModalOpen(true);
    };

    const openEditCategoryModal = (cat, e) => {
        e.stopPropagation();
        clearCategoryErrors();
        setCategoryToEdit(cat);
        setCategoryData({
            name_ar: cat.name_ar,
            name_en: cat.name_en || "",
            parent_id: cat.parent_id ? String(cat.parent_id) : "",
            is_active: cat.is_active,
        });
        setQuickCategoryModalOpen(true);
    };

    const submitQuickCategory = (e) => {
        e.preventDefault();
        if (categoryToEdit) {
            putCategory(route("sales.services-categories.update", categoryToEdit.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setQuickCategoryModalOpen(false);
                    resetCategory();
                    setCategoryToEdit(null);
                },
            });
        } else {
            postCategory(route("sales.services-categories.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    setQuickCategoryModalOpen(false);
                    resetCategory();
                },
            });
        }
    };

    const deleteCategory = (cat, e) => {
        e.stopPropagation();
        setCategoryToDelete(cat);
        setDeletePassword("");
        setDeleteError("");
    };

    const confirmCategoryDelete = () => {
        setDeleteError("");
        router.post(route("sales.services-categories.destroy", categoryToDelete.id), {
            _method: "DELETE",
            password: deletePassword,
        }, {
            onSuccess: () => {
                setCategoryToDelete(null);
                setDeletePassword("");
            },
            onError: (errs) => {
                if (errs.error) setDeleteError(errs.error);
                else if (errs.password) setDeleteError(errs.password);
                else setDeleteError(lang === "ar" ? "حدث خطأ ما." : "An error occurred.");
            },
        });
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route("sales.services.store"), {
            onSuccess: () => setCreateModalOpen(false),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route("sales.services.update", itemToEdit.id), {
            onSuccess: () => setItemToEdit(null),
        });
    };

    const deleteItem = (item) => {
        setItemToDelete(item);
        setDeletePassword("");
        setDeleteError("");
    };

    const confirmItemDelete = () => {
        setDeleteError("");
        router.post(route("sales.services.destroy", itemToDelete.id), {
            _method: "DELETE",
            password: deletePassword,
        }, {
            onSuccess: () => {
                setItemToDelete(null);
                setDeletePassword("");
            },
            onError: (errs) => {
                if (errs.error) setDeleteError(errs.error);
                else if (errs.password) setDeleteError(errs.password);
                else setDeleteError(lang === "ar" ? "حدث خطأ ما." : "An error occurred.");
            },
        });
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(filteredItems.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedItems.length === 0) return;
        setBulkDeleteConfirm(true);
        setDeletePassword("");
        setDeleteError("");
    };

    const confirmBulkDelete = () => {
        setDeleteError("");
        router.post(route('sales.services.bulk-destroy'), { 
            ids: selectedItems,
            password: deletePassword 
        }, {
            onSuccess: () => {
                setBulkDeleteConfirm(false);
                setSelectedItems([]);
                setDeletePassword("");
            },
            onError: (errs) => {
                if (errs.error) setDeleteError(errs.error);
                else if (errs.password) setDeleteError(errs.password);
                else setDeleteError(lang === "ar" ? "حدث خطأ ما." : "An error occurred.");
            },
        });
    };

    const handleBulkStatus = (status) => {
        if (selectedItems.length === 0) return;
        router.post(route('sales.services.bulk-status'), { ids: selectedItems, is_active: status }, {
            onSuccess: () => setSelectedItems([])
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "المبيعات" : "Sales"}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "الخدمات والأصناف" : "Services & Items"}
            </span>
        </div>
    );

    const selectedCategory = selectedCategoryId ? categories.find((c) => c.id === selectedCategoryId) : null;
    const canCreateFromSelectedCategory = !!selectedCategory || true; 

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "الخدمات والأصناف" : "Services & Items"} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={Wrench}
                    title={lang === "ar" ? "أصناف المبيعات والخدمات" : "Sales Items & Services"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "إدارة الأصناف والخدمات التي تقدمها الشركة للعملاء وتصنيفاتها"
                                : "Manage the items and services offered to customers and their categories"}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {selectedItems.length > 0 && (
                                <>
                                    <Tooltip text={lang === 'ar' ? 'تفعيل المحدد' : 'Activate Selected'}>
                                        <button onClick={() => handleBulkStatus(true)} className="h-[36px] px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors rounded-none flex items-center justify-center">
                                            {lang === 'ar' ? 'تفعيل' : 'Activate'}
                                        </button>
                                    </Tooltip>
                                    <Tooltip text={lang === 'ar' ? 'تعطيل المحدد' : 'Deactivate Selected'}>
                                        <button onClick={() => handleBulkStatus(false)} className="h-[36px] px-3 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors rounded-none flex items-center justify-center">
                                            {lang === 'ar' ? 'تعطيل' : 'Deactivate'}
                                        </button>
                                    </Tooltip>
                                    <Tooltip text={lang === 'ar' ? 'حذف المحدد' : 'Delete Selected'}>
                                        <button onClick={handleBulkDelete} className="h-[36px] px-3 bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors rounded-none flex items-center justify-center">
                                            {lang === 'ar' ? 'حذف' : 'Delete'}
                                        </button>
                                    </Tooltip>
                                    <div className="w-px h-6 bg-border mx-1"></div>
                                </>
                            )}
                            <Tooltip text={lang === "ar" ? "إضافة صنف/خدمة جديدة" : "Add New Item/Service"}>
                                <PrimaryButton
                                    onClick={() => openCreateModal()}
                                    className="px-4 py-2 rounded-none text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]"
                                >
                                    <Plus className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar" ? "إضافة صنف/خدمة" : "Add Item/Service"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Main Split Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Panel: Category Tree Hierarchy */}
                    <div className="md:col-span-1 bg-surface border border-border p-4 shadow-sm rounded-none main-stack-y">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                            <span className="font-bold text-xs text-text flex items-center gap-1.5">
                                <Tags className="h-4 w-4 text-primary" />
                                {lang === "ar" ? "شجرة الفئات" : "Categories Tree"}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openQuickCategoryModal("")}
                                    className="text-[10px] h-6 px-2 border border-primary/25 text-primary hover:bg-primary/10 transition-colors rounded-none"
                                >
                                    {lang === "ar" ? "إنشاء فئة" : "New Category"}
                                </button>
                                {selectedCategoryId && (
                                    <button
                                        onClick={() => setSelectedCategoryId(null)}
                                        className="text-[10px] text-primary hover:underline"
                                    >
                                        {lang === "ar" ? "إعادة تعيين" : "Reset"}
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
                                        ? "bg-primary/10 text-primary"
                                        : "text-text hover:bg-surface-muted"
                                }`}
                            >
                                <Box className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "الكل" : "All"}</span>
                                <span className="ms-auto text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2">
                                    {items.length}
                                </span>
                            </button>

                            <div className="mt-2 space-y-1">
                                {categoryTree.map((lvl1) => {
                                    const hasLvl2 = lvl1.children && lvl1.children.length > 0;
                                    const isLvl1Expanded = !!expandedCategories[lvl1.id];

                                    return (
                                        <div key={lvl1.id} className="space-y-1">
                                            {/* Level 1 Category */}
                                            <div
                                                onClick={() => {
                                                    if (hasLvl2) toggleExpand(lvl1.id);
                                                    setSelectedCategoryId(lvl1.id);
                                                }}
                                                className={`group w-full text-start px-2 py-1.5 transition-colors flex items-center gap-1.5 cursor-pointer rounded-none ${
                                                    selectedCategoryId === lvl1.id
                                                        ? "bg-primary/5 text-primary font-bold"
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
                                                <span className="truncate flex-1">{getCategoryDisplayName(lvl1)}</span>
                                                <div className="hidden group-hover:flex items-center gap-1 rtl:flex-row-reverse">
                                                    <button onClick={(e) => openEditCategoryModal(lvl1, e)} className="p-0.5 text-text-muted hover:text-primary"><Edit className="h-3 w-3"/></button>
                                                    <button onClick={(e) => deleteCategory(lvl1, e)} className="p-0.5 text-text-muted hover:text-danger"><Trash2 className="h-3 w-3"/></button>
                                                </div>
                                            </div>

                                            {/* Level 2 Children */}
                                            {hasLvl2 && isLvl1Expanded && (
                                                <div className="ps-4 space-y-1 border-s border-dashed border-border ms-3.5">
                                                    {lvl1.children.map((lvl2) => {
                                                        const lvl2ItemCount = items.filter(i => i.sales_category_id === lvl2.id).length;
                                                        return (
                                                            <div key={lvl2.id} className="space-y-1">
                                                                <div
                                                                    onClick={() => setSelectedCategoryId(lvl2.id)}
                                                                    className={`group w-full text-start px-2 py-1 transition-colors flex items-center gap-1.5 cursor-pointer rounded-none text-[11px] ${
                                                                        selectedCategoryId === lvl2.id
                                                                            ? "bg-primary/10 text-primary font-bold"
                                                                            : "text-text-muted hover:text-text hover:bg-surface-muted"
                                                                    }`}
                                                                >
                                                                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                                    <span className="truncate flex-1">{getCategoryDisplayName(lvl2)}</span>
                                                                    <div className="hidden group-hover:flex items-center gap-1 rtl:flex-row-reverse">
                                                                        <button onClick={(e) => openEditCategoryModal(lvl2, e)} className="p-0.5 text-text-muted hover:text-primary"><Edit className="h-3 w-3"/></button>
                                                                        <button onClick={(e) => deleteCategory(lvl2, e)} className="p-0.5 text-text-muted hover:text-danger"><Trash2 className="h-3 w-3"/></button>
                                                                    </div>
                                                                    <span className="ms-1 font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded-none">
                                                                        {lvl2ItemCount}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Items Area */}
                    <div className="md:col-span-3 main-stack-y">
                        {/* Header bar of area */}
                        <div className="bg-surface border border-border p-3 shadow-sm rounded-none main-stack-y">
                            <div className="flex items-center justify-between">
                                <div className="text-xs">
                                    <span className="text-text-muted">
                                        {lang === "ar" ? "التصنيف المحدد: " : "Active Category: "}
                                    </span>
                                    <span className="font-bold text-text">
                                        {selectedCategoryId
                                            ? getCategoryPath(selectedCategoryId)
                                            : lang === "ar"
                                              ? "الكل"
                                              : "All"}
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
                                    <button
                                        type="button"
                                        onClick={() => openQuickCategoryModal(selectedCategoryId)}
                                        className="inline-flex items-center gap-1.5 h-[28px] px-2.5 border border-primary/30 bg-primary/5 text-primary text-[11px] font-bold hover:bg-primary/10 transition-colors rounded-none"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        {lang === "ar" ? "إضافة فئة فرعية" : "Add Subcategory"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openCreateModal(selectedCategoryId)}
                                        className="inline-flex items-center gap-1.5 h-[28px] px-2.5 border border-primary/30 bg-primary/5 text-primary text-[11px] font-bold hover:bg-primary/10 transition-colors rounded-none"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        {lang === "ar" ? "إضافة صنف/خدمة" : "Add Item/Service"}
                                    </button>

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

                            {/* Filters Bar */}
                            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border mt-3">
                                <TextInput
                                    placeholder={lang === "ar" ? "بحث بالاسم أو الكود..." : "Search by name or code..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-[34px] text-xs w-64 rounded-none border-border"
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="h-[34px] text-xs border-border bg-surface rounded-none focus:border-primary focus:ring-primary px-2"
                                >
                                    <option value="all">{lang === "ar" ? "الحالة: الكل" : "Status: All"}</option>
                                    <option value="active">{lang === "ar" ? "نشط" : "Active"}</option>
                                    <option value="inactive">{lang === "ar" ? "غير نشط" : "Inactive"}</option>
                                </select>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="h-[34px] text-xs border-border bg-surface rounded-none focus:border-primary focus:ring-primary px-2"
                                >
                                    <option value="all">{lang === "ar" ? "النوع: الكل" : "Type: All"}</option>
                                    <option value="item">{lang === "ar" ? "أصناف" : "Items"}</option>
                                    <option value="service">{lang === "ar" ? "خدمات" : "Services"}</option>
                                </select>
                            </div>
                        </div>

                        {/* Items Display */}
                        {filteredItems.length === 0 ? (
                            <div className="bg-surface border border-border p-12 text-center shadow-sm rounded-none">
                                <Box className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <h3 className="font-bold text-sm text-text">
                                    {lang === "ar" ? "لا توجد أصناف/خدمات" : "No Items/Services"}
                                </h3>
                                <p className="text-xs text-text-muted mt-1">
                                    {lang === "ar"
                                        ? "لم يتم العثور على عناصر في هذا التصنيف حالياً."
                                        : "No items have been found in this category yet."}
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
                                            {/* Icon Header */}
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-none bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                    {item.type === 'service' ? <Wrench className="h-5 w-5 text-primary" /> : <Briefcase className="h-5 w-5 text-primary" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-[13px] text-text truncate group-hover:text-primary transition-colors">
                                                        {getItemDisplayName(item)}
                                                    </h4>
                                                    <div className="text-[10px] text-text-muted truncate mt-0.5">
                                                        {lang === "ar" ? "الفئة: " : "Category: "}
                                                        {getCategoryPath(item.sales_category_id) || "—"}
                                                    </div>
                                                </div>
                                                <div className="pt-0.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedItems.includes(item.id)}
                                                        onChange={() => toggleSelectItem(item.id)}
                                                        className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                    />
                                                </div>
                                            </div>

                                            {/* Price Badge */}
                                            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                                                <span className="text-text-muted">
                                                    {lang === "ar" ? "السعر:" : "Price:"}
                                                </span>
                                                <span className="font-bold text-primary bg-primary/5 px-2 py-0.5 border border-primary/10 rounded-none">
                                                    {item.default_price}
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
                                                    ? lang === "ar" ? "نشط" : "Active"
                                                    : lang === "ar" ? "غير نشط" : "Inactive"}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Tooltip text={lang === "ar" ? "عرض التفاصيل" : "Show Details"}>
                                                    <Link
                                                        href={route("sales.services.show", item.id)}
                                                        className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Tooltip>
                                                <Tooltip text={lang === "ar" ? "تعديل" : "Edit"}>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text={lang === "ar" ? "حذف" : "Delete"}>
                                                    <button
                                                        onClick={() => deleteItem(item)}
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
                                                <th className="px-4 py-3 text-start w-10">
                                                    <input 
                                                        type="checkbox" 
                                                        onChange={toggleSelectAll}
                                                        checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                                        className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                    />
                                                </th>
                                                <th className="px-4 py-3 text-start w-12">
                                                    #
                                                </th>
                                                <th className="px-4 py-3 text-start">
                                                    {lang === "ar" ? "الاسم" : "Name"}
                                                </th>
                                                <th className="px-4 py-3 text-start">
                                                    {lang === "ar" ? "الفئة" : "Category"}
                                                </th>
                                                <th className="px-4 py-3 text-start">
                                                    {lang === "ar" ? "النوع" : "Type"}
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    {lang === "ar" ? "السعر" : "Price"}
                                                </th>
                                                <th className="px-4 py-3 text-center w-24">
                                                    {lang === "ar" ? "الحالة" : "Status"}
                                                </th>
                                                <th className="px-4 py-3 text-end w-32">
                                                    {lang === "ar" ? "الإجراءات" : "Actions"}
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
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedItems.includes(item.id)}
                                                            onChange={() => toggleSelectItem(item.id)}
                                                            className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="h-8 w-8 bg-slate-50 border border-border flex items-center justify-center rounded-none">
                                                            {item.type === 'service' ? <Wrench className="h-4 w-4 text-slate-400" /> : <Briefcase className="h-4 w-4 text-slate-400" />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-text text-[13px]">
                                                        {getItemDisplayName(item)}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-text-muted">
                                                        {getCategoryPath(item.sales_category_id) || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-text-muted">
                                                        {item.type === 'service' ? (lang === 'ar' ? 'خدمة' : 'Service') : (lang === 'ar' ? 'صنف' : 'Item')}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold text-primary font-mono text-xs">
                                                        {item.default_price}
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
                                                                ? lang === "ar" ? "نشط" : "Active"
                                                                : lang === "ar" ? "غير نشط" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                                                        <Tooltip text={lang === "ar" ? "عرض التفاصيل" : "Show Details"}>
                                                            <Link
                                                                href={route("sales.services.show", item.id)}
                                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Tooltip>
                                                        <Tooltip text={lang === "ar" ? "تعديل" : "Edit"}>
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all rounded-none inline-flex items-center"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </Tooltip>
                                                        <Tooltip text={lang === "ar" ? "حذف" : "Delete"}>
                                                            <button
                                                                onClick={() => deleteItem(item)}
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
                maxWidth="md"
            >
                <form
                    onSubmit={itemToEdit ? submitEdit : submitCreate}
                    className="p-5 main-stack-y"
                >
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                        <h3 className="font-bold text-lg text-text">
                            {itemToEdit
                                ? lang === "ar"
                                    ? "تعديل الصنف/الخدمة"
                                    : "Edit Item/Service"
                                : lang === "ar"
                                  ? "إضافة صنف/خدمة"
                                  : "Add New Item/Service"}
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={lang === "ar" ? "الاسم (عربي) *" : "Name (Arabic) *"} />
                                <TextInput
                                    className="mt-1 w-full text-sm rounded-none border-border"
                                    value={data.name_ar}
                                    onChange={(e) => setData("name_ar", e.target.value)}
                                    required
                                />
                                <InputError message={errors.name_ar} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} />
                                <TextInput
                                    className="mt-1 w-full text-sm rounded-none border-border"
                                    value={data.name_en}
                                    onChange={(e) => setData("name_en", e.target.value)}
                                />
                                <InputError message={errors.name_en} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={lang === "ar" ? "الكود (اختياري)" : "Code (Optional)"} />
                            <TextInput
                                className="mt-1 w-full text-sm rounded-none border-border font-mono"
                                value={data.code}
                                onChange={(e) => setData("code", e.target.value)}
                                placeholder="SV-001"
                            />
                            <InputError message={errors.code} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={lang === "ar" ? "الفئة *" : "Category *"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                    value={data.sales_category_id}
                                    onChange={(e) => setData("sales_category_id", e.target.value)}
                                    required
                                >
                                    <option value="">{lang === "ar" ? "-- اختر فئة --" : "-- Select Category --"}</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {getCategoryPath(c.id)}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.sales_category_id} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={lang === "ar" ? "النوع *" : "Type *"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                    value={data.type}
                                    onChange={(e) => setData("type", e.target.value)}
                                    required
                                >
                                    <option value="item">{lang === "ar" ? "صنف (ملموس)" : "Item (Physical)"}</option>
                                    <option value="service">{lang === "ar" ? "خدمة (غير ملموس)" : "Service"}</option>
                                </select>
                                <InputError message={errors.type} className="mt-1" />
                            </div>
                        </div>
                        
                        <div>
                            <InputLabel value={lang === "ar" ? "السعر الافتراضي *" : "Default Price *"} />
                            <TextInput
                                type="number"
                                min="0"
                                step="0.01"
                                className="mt-1 w-full text-sm rounded-none border-border font-mono"
                                value={data.default_price}
                                onChange={(e) => setData("price", e.target.value)}
                                required
                            />
                            <InputError message={errors.default_price} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value={lang === "ar" ? "الوصف" : "Description"} />
                            <textarea
                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none p-3"
                                rows="3"
                                value={data.description}
                                onChange={(e) => setData("description", e.target.value)}
                            ></textarea>
                            <InputError message={errors.description} className="mt-1" />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                />
                                <span className="text-sm text-text font-medium">
                                    {lang === "ar" ? "نشط (متاح للاستخدام)" : "Active (available for use)"}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
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
                        <PrimaryButton disabled={processing} className="rounded-none">
                            <Save className="h-4 w-4 me-1.5" />
                            {itemToEdit ? (lang === "ar" ? "حفظ التعديلات" : "Save Changes") : (lang === "ar" ? "إضافة" : "Add")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Quick Category Modal */}
            <Modal
                show={isQuickCategoryModalOpen}
                onClose={() => setQuickCategoryModalOpen(false)}
                maxWidth="sm"
            >
                <form onSubmit={submitQuickCategory} className="p-5 main-stack-y">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                        <h3 className="font-bold text-lg text-text">
                            {categoryToEdit 
                                ? (lang === "ar" ? "تعديل الفئة" : "Edit Category")
                                : (lang === "ar" ? "إنشاء فئة جديدة" : "Create New Category")}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setQuickCategoryModalOpen(false)}
                            className="text-text-muted hover:text-text"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <InputLabel value={lang === "ar" ? "اسم الفئة (عربي) *" : "Category Name (Arabic) *"} />
                            <TextInput
                                className="mt-1 w-full text-sm rounded-none border-border"
                                value={categoryData.name_ar}
                                onChange={(e) => setCategoryData("name_ar", e.target.value)}
                                required
                            />
                            <InputError message={categoryErrors.name_ar} className="mt-1" />
                        </div>
                        
                        <div>
                            <InputLabel value={lang === "ar" ? "اسم الفئة (إنجليزي)" : "Category Name (English)"} />
                            <TextInput
                                className="mt-1 w-full text-sm rounded-none border-border"
                                value={categoryData.name_en}
                                onChange={(e) => setCategoryData("name_en", e.target.value)}
                            />
                            <InputError message={categoryErrors.name_en} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel value={lang === "ar" ? "الفئة الأب" : "Parent Category"} />
                            <select
                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                value={categoryData.parent_id}
                                onChange={(e) => setCategoryData("parent_id", e.target.value)}
                            >
                                <option value="">{lang === "ar" ? "-- فئة رئيسية (مستوى أول) --" : "-- Main Category (Level 1) --"}</option>
                                {categories.filter(c => !c.parent_id && c.id !== categoryToEdit?.id).map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {getCategoryDisplayName(cat)}
                                    </option>
                                ))}
                            </select>
                            <InputError message={categoryErrors.parent_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                    checked={categoryData.is_active}
                                    onChange={(e) => setCategoryData("is_active", e.target.checked)}
                                />
                                <span className="text-sm text-text font-medium">{lang === "ar" ? "نشطة" : "Active"}</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                        <SecondaryButton
                            type="button"
                            onClick={() => setQuickCategoryModalOpen(false)}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={categoryProcessing} className="rounded-none">
                            <Save className="h-4 w-4 me-1.5" />
                            {lang === "ar" ? "حفظ الفئة" : "Save Category"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modals */}
            <ConfirmationModal
                show={!!itemToDelete}
                title={lang === "ar" ? "تأكيد حذف الصنف" : "Confirm Item Deletion"}
                message={lang === "ar" ? "هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this item? This action cannot be undone."}
                onConfirm={confirmItemDelete}
                onCancel={() => { setItemToDelete(null); setDeleteError(""); }}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={processing}
            />

            <ConfirmationModal
                show={!!categoryToDelete}
                title={lang === "ar" ? "تأكيد حذف الفئة" : "Confirm Category Deletion"}
                message={lang === "ar" ? "هل أنت متأكد من حذف هذه الفئة؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this category? This action cannot be undone."}
                onConfirm={confirmCategoryDelete}
                onCancel={() => { setCategoryToDelete(null); setDeleteError(""); }}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={categoryProcessing}
            />

            <ConfirmationModal
                show={bulkDeleteConfirm}
                title={lang === "ar" ? "تأكيد الحذف المجمع" : "Confirm Bulk Deletion"}
                message={lang === "ar" ? `هل أنت متأكد من حذف ${selectedItems.length} عنصر؟ لا يمكن التراجع عن هذا الإجراء.` : `Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`}
                onConfirm={confirmBulkDelete}
                onCancel={() => { setBulkDeleteConfirm(false); setDeleteError(""); }}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}
