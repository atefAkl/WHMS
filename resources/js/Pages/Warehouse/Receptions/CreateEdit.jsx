import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, Link, router, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Plus,
    Trash2,
    Save,
    ArrowRight,
    UserPlus,
    X,
    FolderSync,
    Layers,
    Calculator,
    AlertCircle,
    CheckCircle2,
    ChevronUp,
    ChevronDown,
    ShieldAlert,
    Printer,
    Unlock,
} from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import PageHeader from "@/Components/PageHeader";
import Tooltip from "@/Components/Tooltip";
import axios from "axios";

export default function CreateEdit({
    customers = [],
    drivers = [],
    inventoryItems = [],
    isEdit = false,
    reception = null,
    draftReceptions = [],
}) {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;
    const showButtonText = user?.preferences?.show_button_text ?? false;

    // Driver quick creation modal
    const [isDriverModalOpen, setDriverModalOpen] = useState(false);
    const [driverList, setDriverList] = useState(drivers);
    const [newDriverData, setNewDriverData] = useState({
        name: "",
        phone_number: "",
        id_number: "",
        vehicle_plate: "",
        vehicle_type: "",
        license_number: "",
    });
    const [driverError, setDriverError] = useState("");
    const [addingDriver, setAddingDriver] = useState(false);

    // Dynamic Lists based on selection
    const [availableContracts, setAvailableContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [availableRepresentatives, setAvailableRepresentatives] = useState(
        [],
    );

    // Live occupancy stats for selected contract
    const [contractStats, setContractStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Customer Autocomplete state
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // POS Row temporary inputs state
    const [posPalletNumber, setPosPalletNumber] = useState("");
    const [posPalletSize, setPosPalletSize] = useState("وسط");
    const [posItemSearch, setPosItemSearch] = useState("");
    const [showPosItemDropdown, setShowPosItemDropdown] = useState(false);
    const [posItemId, setPosItemId] = useState("");
    const [posVariantId, setPosVariantId] = useState("");
    const [posQuality, setPosQuality] = useState("");
    const [posQuantity, setPosQuantity] = useState("");
    const [posRowError, setPosRowError] = useState("");
    const [loadingPallet, setLoadingPallet] = useState(false);

    // Active autocomplete indexes for ArrowUp/ArrowDown selection
    const [customerActiveIndex, setCustomerActiveIndex] = useState(-1);
    const [posItemActiveIndex, setPosItemActiveIndex] = useState(-1);

    // Sidebar stats collapse state (toggled by user to save screen space)
    const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);

    // General information panel collapse state (toggled by user to save screen space)
    const [isGeneralCollapsed, setIsGeneralCollapsed] = useState(false);

    // Deletion Modal state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [processingDelete, setProcessingDelete] = useState(false);

    // Reset active index when search text changes or dropdown toggles
    useEffect(() => {
        setCustomerActiveIndex(-1);
    }, [customerSearch, showCustomerDropdown]);

    useEffect(() => {
        setPosItemActiveIndex(-1);
    }, [posItemSearch, showPosItemDropdown]);

    // Refs for keyboard navigation
    const palletInputRef = useRef(null);
    const sizeSelectRef = useRef(null);
    const itemSearchRef = useRef(null);
    const variantSelectRef = useRef(null);
    const qualityInputRef = useRef(null);
    const qtyInputRef = useRef(null);
    const addButtonRef = useRef(null);

    // Form setup using Inertia useForm
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: reception?.customer_id || "",
        contract_id: reception?.contract_id || "",
        period_id: reception?.period_id || "",
        driver_id: reception?.driver_id || "",
        representative_id: reception?.representative_id || "",
        farm_source: reception?.farm_source || "",
        notes: reception?.notes || "",
        reception_date: reception?.reception_date
            ? new Date(reception.reception_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        modification_reason: "",
        status: reception?.status || "draft",
        items: reception?.inventory_entries
            ? reception.inventory_entries.map((e) => ({
                  id: e.id,
                  inventory_item_id: e.inventory_item_id,
                  inventory_item_variant_id: e.inventory_item_variant_id,
                  pallet_number: e.pallet?.pallet_number || "",
                  pallet_size: e.pallet?.size || "وسط",
                  quantity_in: e.quantity_in,
              }))
            : [],
        redirect_to_draft_id: "",
    });

    // Bilingual display utility
    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    // Global keyboard shortcuts (Ctrl+S: stay in Edit, Ctrl+Shift+S: go to Index, Ctrl+E: go to Print, Ctrl+D: Delete)
    useEffect(() => {
        const handleGlobalShortcuts = (e) => {
            if (!e.ctrlKey) return;

            if (e.code === "KeyS") {
                e.preventDefault();
                if (e.shiftKey) {
                    // Ctrl + Shift + S: Save draft and go to Index
                    handleFormSubmitWithStatus("draft", "index");
                } else {
                    // Ctrl + S: Save draft and remain in Edit
                    handleFormSubmitWithStatus("draft", "edit");
                }
            } else if (e.code === "KeyE") {
                e.preventDefault();
                // Ctrl + E: Save approved and go to Print
                handleFormSubmitWithStatus("approved", "print");
            } else if (e.code === "KeyD") {
                e.preventDefault();
                // Ctrl + D: Open delete confirmation modal
                if (reception) {
                    setIsDeleteModalOpen(true);
                }
            }
        };
        window.addEventListener("keydown", handleGlobalShortcuts);
        return () =>
            window.removeEventListener("keydown", handleGlobalShortcuts);
    }, [data, reception]);

    // Populate initial customer autocomplete search field if editing
    useEffect(() => {
        if (data.customer_id) {
            const customer = customers.find(
                (c) => c.id === parseInt(data.customer_id),
            );
            if (customer) {
                setCustomerSearch(customer.name);
                setAvailableContracts(customer.contracts || []);
            }
        }
    }, [data.customer_id, customers]);

    // Handle customer contracts change
    useEffect(() => {
        if (data.customer_id) {
            const customer = customers.find(
                (c) => c.id === parseInt(data.customer_id),
            );
            if (customer) {
                setAvailableContracts(customer.contracts || []);
                if (
                    !isEdit &&
                    !customer.contracts?.some(
                        (c) => c.id === parseInt(data.contract_id),
                    )
                ) {
                    setData((d) => ({
                        ...d,
                        contract_id: "",
                        period_id: "",
                        representative_id: "",
                    }));
                }
            }
        } else {
            setAvailableContracts([]);
            setAvailablePeriods([]);
            setAvailableRepresentatives([]);
        }
    }, [data.customer_id]);

    // Handle contract dependencies
    useEffect(() => {
        if (data.contract_id) {
            const contract = availableContracts.find(
                (c) => c.id === parseInt(data.contract_id),
            );
            if (contract) {
                const activePeriods = (contract.periods || []).filter(
                    (period) => period.status === "active",
                );
                setAvailablePeriods(activePeriods);
                setAvailableRepresentatives(contract.contract_agents || []);

                if (!isEdit) {
                    setData((d) => ({
                        ...d,
                        period_id: activePeriods?.[0]?.id || "",
                        representative_id:
                            contract.contract_agents?.[0]?.id || "",
                    }));
                }

                // Fetch occupancy stats
                setLoadingStats(true);
                axios
                    .get(route("api.contracts.occupancy-stats", contract.id))
                    .then((res) => {
                        setContractStats(res.data);
                        setLoadingStats(false);
                    })
                    .catch((err) => {
                        console.error(err);
                        setLoadingStats(false);
                    });
            }
        } else {
            setAvailablePeriods([]);
            setAvailableRepresentatives([]);
            setContractStats(null);
        }
    }, [data.contract_id, availableContracts]);

    // Autocomplete filter for customer
    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()),
    );

    // Autocomplete filter for inventory item in POS Row
    const filteredPOSItems = inventoryItems.filter(
        (item) =>
            item.name.toLowerCase().includes(posItemSearch.toLowerCase()) ||
            item.code.toLowerCase().includes(posItemSearch.toLowerCase()),
    );

    // Selected POS item variants
    const selectedPOSItem = inventoryItems.find(
        (i) => i.id === parseInt(posItemId),
    );
    const posVariants = selectedPOSItem?.variants || [];

    // Trigger auto-quality loading when variant changes
    useEffect(() => {
        if (posVariantId && posVariants.length > 0) {
            const variant = posVariants.find(
                (v) => v.id === parseInt(posVariantId),
            );
            if (variant) {
                setPosQuality(displayBilingual(variant.quality) || "");
            }
        } else {
            setPosQuality("");
        }
    }, [posVariantId, posVariants]);

    // Handle Pallet blur to lookup details
    const handlePalletBlur = () => {
        const number = posPalletNumber.trim();
        if (!number) return;

        setLoadingPallet(true);
        setPosRowError("");

        axios
            .get(route("api.pallets.lookup", { pallet_number: number }))
            .then((res) => {
                setLoadingPallet(false);
                if (res.data) {
                    setPosPalletSize(res.data.size);
                }
            })
            .catch((err) => {
                setLoadingPallet(false);
                console.error(err);
                setPosRowError(
                    lang === "ar"
                        ? "خطأ في الاتصال بالخادم للتحقق من الطبلية."
                        : "Error checking pallet code.",
                );
            });
    };

    // Driver creation handler
    const handleCreateDriver = (e) => {
        e.preventDefault();
        setDriverError("");
        setAddingDriver(true);

        axios
            .post(route("api.drivers.store"), newDriverData)
            .then((res) => {
                setAddingDriver(false);
                if (res.data.success) {
                    setDriverList((prev) => [...prev, res.data.driver]);
                    setData("driver_id", res.data.driver.id);
                    setDriverModalOpen(false);
                    setNewDriverData({
                        name: "",
                        phone_number: "",
                        id_number: "",
                        vehicle_plate: "",
                        vehicle_type: "",
                        license_number: "",
                    });
                }
            })
            .catch((err) => {
                setAddingDriver(false);
                if (err.response?.data?.message) {
                    setDriverError(err.response.data.message);
                } else {
                    setDriverError(
                        lang === "ar"
                            ? "تعذر إضافة السائق. يرجى التحقق من المدخلات."
                            : "Could not add driver.",
                    );
                }
            });
    };

    // Switch draft and auto-save current as draft
    const handleSwitchDraft = (targetDraftId) => {
        const currentData = {
            ...data,
            status: "draft",
            redirect_to_draft_id: targetDraftId,
        };

        if (isEdit) {
            router.put(route("receptions.update", reception.id), currentData);
        } else {
            router.post(route("receptions.store"), currentData);
        }
    };

    // Save and submit form with specific status
    const handleFormSubmitWithStatus = (statusValue, redirectTo = "") => {
        const currentData = {
            ...data,
            status: statusValue,
            redirect_to: redirectTo,
        };

        if (isEdit) {
            router.put(route("receptions.update", reception.id), currentData);
        } else {
            router.post(route("receptions.store"), currentData);
        }
    };

    // Confirm Secure Delete
    const confirmDelete = (e) => {
        if (e) e.preventDefault();
        setDeleteError("");
        setProcessingDelete(true);

        router.post(
            route("receptions.destroy", reception.id),
            {
                _method: "DELETE",
                password: deletePassword,
            },
            {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
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

    // Default form submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        handleFormSubmitWithStatus(data.status);
    };

    // Add POS Row to reception items array
    const handleAddPOSRow = () => {
        setPosRowError("");
        if (!posPalletNumber.trim()) {
            setPosRowError(
                lang === "ar"
                    ? "يجب إدخال رقم الطبلية."
                    : "Pallet number is required.",
            );
            palletInputRef.current?.focus();
            return;
        }
        if (!posItemId) {
            setPosRowError(
                lang === "ar"
                    ? "يجب اختيار الصنف المخزني."
                    : "Inventory item is required.",
            );
            itemSearchRef.current?.focus();
            return;
        }
        if (!posVariantId) {
            setPosRowError(
                lang === "ar"
                    ? "يجب اختيار عبوة الصنف."
                    : "Variant is required.",
            );
            variantSelectRef.current?.focus();
            return;
        }
        if (!posQuantity || parseFloat(posQuantity) <= 0) {
            setPosRowError(
                lang === "ar"
                    ? "الكمية يجب أن تكون أكبر من الصفر."
                    : "Quantity must be greater than zero.",
            );
            qtyInputRef.current?.focus();
            return;
        }

        // Add to items
        const newItem = {
            inventory_item_id: parseInt(posItemId),
            inventory_item_variant_id: parseInt(posVariantId),
            pallet_number: posPalletNumber.trim(),
            pallet_size: posPalletSize,
            quantity_in: parseFloat(posQuantity),
        };

        setData("items", [...data.items, newItem]);

        // Retain old values to speed up sequential entry (do not reset fields)
        // Focus back to Pallet Number input and highlight/select its content for quick overwrite
        palletInputRef.current?.focus();
        palletInputRef.current?.select();
    };

    const handleRemoveItemRow = (index) => {
        const updated = [...data.items];
        updated.splice(index, 1);
        setData("items", updated);
    };

    // Handle keydown navigation (Arrows navigation)
    const handleKeyNavigation = (e, nextRef, prevRef) => {
        if (e.key === "ArrowRight" && nextRef) {
            e.preventDefault();
            nextRef.current?.focus();
        } else if (e.key === "ArrowLeft" && prevRef) {
            e.preventDefault();
            prevRef.current?.focus();
        }
    };

    // Calculate live occupancy stats based on unsaved/modified items in the form
    const initialPalletsCount = reception?.inventory_entries?.length || 0;
    const netChange = data.items.length - initialPalletsCount;
    const liveCurrentlyInWarehouse = contractStats
        ? Math.max(0, contractStats.currently_in_warehouse + netChange)
        : 0;
    const liveRemaining = contractStats
        ? Math.max(0, contractStats.total_capacity - liveCurrentlyInWarehouse)
        : 0;

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
                {isEdit
                    ? lang === "ar"
                        ? "تعديل سند"
                        : "Edit Voucher"
                    : lang === "ar"
                      ? "إنشاء سند جديد"
                      : "New Voucher"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    isEdit
                        ? lang === "ar"
                            ? "تعديل سند استلام"
                            : "Edit Reception Voucher"
                        : lang === "ar"
                          ? "إنشاء سند استلام"
                          : "New Reception Voucher"
                }
            />

            <div
                className="max-w-6xl mx-auto pb-12 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                {/* Page header title bar */}
                <PageHeader
                    icon={Layers}
                    title={
                        isEdit
                            ? lang === "ar"
                                ? `تعديل إيصال استلام: ${reception.serial_number}`
                                : `Edit Receipt: ${reception.serial_number}`
                            : lang === "ar"
                              ? "إنشاء إيصال استلام جديد"
                              : "Create New Reception Receipt"
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "قم بتعبئة بيانات السند الرئيسي ثم أضف البنود المستلمة على الطبالي (POS style)."
                                : "Fill out the reception header, then add items using the quick keyboard interface."}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            {/* Save Draft button abbreviated to icon with hover tooltip */}
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "حفظ كمسودة (Ctrl+S)"
                                        : "Save Draft (Ctrl+S)"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFormSubmitWithStatus(
                                            "draft",
                                            "edit",
                                        )
                                    }
                                    className="rounded-none h-[30px] w-[30px] p-0 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                            </Tooltip>

                            {/* Approve & Print button abbreviated to icon with hover tooltip */}
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "اعتماد وطباعة (Ctrl+E)"
                                        : "Approve & Print (Ctrl+E)"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFormSubmitWithStatus(
                                            "approved",
                                            "print",
                                        )
                                    }
                                    className="rounded-none h-[30px] w-[30px] p-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white transition-colors"
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                            </Tooltip>

                            <div className="h-6 w-px bg-border mx-1" />

                            {/* Back button abbreviated to icon with hover tooltip */}
                            <Tooltip text={lang === "ar" ? "رجوع" : "Back"}>
                                <Link
                                    href={
                                        isEdit
                                            ? route(
                                                  "receptions.show",
                                                  reception.id,
                                              )
                                            : route("receptions.index")
                                    }
                                    className="border border-border bg-surface text-text hover:bg-surface-muted rounded-none h-[30px] w-[30px] flex items-center justify-center transition-all"
                                >
                                    <ArrowRight
                                        className={`h-4 w-4 ${lang === "ar" ? "rotate-0" : "rotate-180"}`}
                                    />
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                {/* Draft switcher placed below the header title bar */}
                {draftReceptions.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/25 p-3 rounded-none flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                            <FolderSync className="h-4 w-4" />
                            {lang === "ar"
                                ? "المسودات النشطة المعلقة:"
                                : "Active Pending Drafts:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {draftReceptions.map((draft) => {
                                const draftTooltipText = draft.customer
                                    ? draft.contract
                                        ? `${draft.customer.name} (${draft.contract.contract_number})`
                                        : `${draft.customer.name} - ${lang === "ar" ? "لم يتم تعيين عقد" : "No contract assigned"}`
                                    : lang === "ar"
                                      ? "لم يتم تعيين عقد"
                                      : "Contract not assigned yet";

                                return (
                                    <Tooltip
                                        key={draft.id}
                                        text={draftTooltipText}
                                    >
                                        <Link
                                            href={route(
                                                "receptions.edit",
                                                draft.id,
                                            )}
                                            className="px-2 py-1 text-[10px] font-bold border border-amber-400 bg-amber-100/50 hover:bg-amber-100 hover:text-amber-800 transition-all rounded-none text-amber-700 inline-block"
                                        >
                                            {draft.serial_number}
                                        </Link>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 lg:grid-cols-4 gap-6"
                >
                    {/* General Inputs Panel */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Voucher Header Details (collapsible card to optimize vertical layout space) */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                            {/* Collapsible header section */}
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {lang === "ar"
                                        ? "معلومات السند الأساسية"
                                        : "Voucher General Information"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsGeneralCollapsed(
                                            !isGeneralCollapsed,
                                        )
                                    }
                                    className="text-text-muted hover:text-text focus:outline-none transition-colors"
                                    title={
                                        lang === "ar"
                                            ? "طي/عرض معلومات السند"
                                            : "Collapse/Expand Voucher Info"
                                    }
                                >
                                    {isGeneralCollapsed ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {/* Render general info fields conditionally if not collapsed */}
                            {!isGeneralCollapsed && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Serial Number */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "رقم السند"
                                                        : "Serial Number"
                                                }
                                            />
                                            <TextInput
                                                type="text"
                                                className="mt-1 w-full text-sm rounded-none border-border bg-slate-50 text-slate-500 font-mono font-bold"
                                                value={
                                                    reception?.serial_number ||
                                                    (lang === "ar"
                                                        ? "سيتم توليده تلقائياً"
                                                        : "Auto-generated")
                                                }
                                                disabled
                                                readOnly
                                            />
                                        </div>

                                        {/* Customer Autocomplete Field */}
                                        <div className="relative">
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "العميل *"
                                                        : "Customer *"
                                                }
                                            />
                                            <TextInput
                                                type="text"
                                                className="mt-1 w-full text-sm rounded-none border-border"
                                                placeholder={
                                                    lang === "ar"
                                                        ? "ابحث عن اسم العميل..."
                                                        : "Type customer name..."
                                                }
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    setCustomerSearch(
                                                        e.target.value,
                                                    );
                                                    setShowCustomerDropdown(
                                                        true,
                                                    );
                                                }}
                                                onFocus={() =>
                                                    setShowCustomerDropdown(
                                                        true,
                                                    )
                                                }
                                                onBlur={() =>
                                                    setShowCustomerDropdown(
                                                        false,
                                                    )
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        !showCustomerDropdown ||
                                                        filteredCustomers.length ===
                                                            0
                                                    )
                                                        return;
                                                    if (e.key === "ArrowDown") {
                                                        e.preventDefault();
                                                        setCustomerActiveIndex(
                                                            (prev) =>
                                                                prev <
                                                                filteredCustomers.length -
                                                                    1
                                                                    ? prev + 1
                                                                    : 0,
                                                        );
                                                    } else if (
                                                        e.key === "ArrowUp"
                                                    ) {
                                                        e.preventDefault();
                                                        setCustomerActiveIndex(
                                                            (prev) =>
                                                                prev > 0
                                                                    ? prev - 1
                                                                    : filteredCustomers.length -
                                                                      1,
                                                        );
                                                    } else if (
                                                        e.key === "Enter"
                                                    ) {
                                                        if (
                                                            customerActiveIndex >=
                                                                0 &&
                                                            customerActiveIndex <
                                                                filteredCustomers.length
                                                        ) {
                                                            e.preventDefault();
                                                            const selected =
                                                                filteredCustomers[
                                                                    customerActiveIndex
                                                                ];
                                                            setData(
                                                                "customer_id",
                                                                selected.id,
                                                            );
                                                            setCustomerSearch(
                                                                selected.name,
                                                            );
                                                            setShowCustomerDropdown(
                                                                false,
                                                            );
                                                        }
                                                    } else if (
                                                        e.key === "Escape"
                                                    ) {
                                                        setShowCustomerDropdown(
                                                            false,
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    reception?.status ===
                                                    "approved"
                                                }
                                                required
                                            />
                                            {showCustomerDropdown &&
                                                customerSearch &&
                                                filteredCustomers.length >
                                                    0 && (
                                                    <div className="absolute z-10 w-full bg-surface border border-border shadow-md max-h-48 overflow-y-auto mt-1 divide-y divide-border">
                                                        {filteredCustomers.map(
                                                            (c, idx) => (
                                                                <div
                                                                    key={c.id}
                                                                    className={`p-2 text-xs font-semibold cursor-pointer text-text transition-colors ${
                                                                        idx ===
                                                                        customerActiveIndex
                                                                            ? "bg-primary/10 text-primary font-bold"
                                                                            : "hover:bg-surface-muted"
                                                                    }`}
                                                                    onMouseDown={(
                                                                        e,
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        setData(
                                                                            "customer_id",
                                                                            c.id,
                                                                        );
                                                                        setCustomerSearch(
                                                                            c.name,
                                                                        );
                                                                        setShowCustomerDropdown(
                                                                            false,
                                                                        );
                                                                    }}
                                                                >
                                                                    {c.name}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            <InputError
                                                message={errors.customer_id}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Contract Select */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "العقد المرتبط *"
                                                        : "Linked Contract *"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                                value={data.contract_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "contract_id",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={
                                                    reception?.status ===
                                                        "approved" ||
                                                    !data.customer_id
                                                }
                                                required
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- اختر العقد --"
                                                        : "-- Select Contract --"}
                                                </option>
                                                {availableContracts.map((c) => (
                                                    <option
                                                        key={c.id}
                                                        value={c.id}
                                                    >
                                                        {c.contract_number} (حتى{" "}
                                                        {c.end_date})
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.contract_id}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Period Select */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "فترة الفوترة المرتبطة *"
                                                        : "Linked Period *"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                                value={data.period_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "period_id",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!data.contract_id}
                                                required
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- اختر الفترة --"
                                                        : "-- Select Period --"}
                                                </option>
                                                {availablePeriods.map((p) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {lang === "ar"
                                                            ? "فترة"
                                                            : "Period"}{" "}
                                                        {p.period_number} (
                                                        {p.start_date} إلى{" "}
                                                        {p.end_date})
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.period_id}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Driver Select */}
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "السائق الناقل"
                                                            : "Carrier Driver"
                                                    }
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setDriverModalOpen(true)
                                                    }
                                                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                    {lang === "ar"
                                                        ? "سائق جديد"
                                                        : "New Driver"}
                                                </button>
                                            </div>
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                                value={data.driver_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "driver_id",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- لا يوجد سائق مسجل --"
                                                        : "-- No Driver --"}
                                                </option>
                                                {driverList.map((d) => (
                                                    <option
                                                        key={d.id}
                                                        value={d.id}
                                                    >
                                                        {d.name} (
                                                        {d.vehicle_plate} -{" "}
                                                        {d.vehicle_type || "—"})
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.driver_id}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Representative Select */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "مندوب العميل (المستلم منه)"
                                                        : "Customer Agent"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-sm focus:border-primary focus:ring-primary rounded-none h-[42px] px-3"
                                                value={data.representative_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "representative_id",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={!data.contract_id}
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- لا يوجد مندوب محدد --"
                                                        : "-- No Representative --"}
                                                </option>
                                                {availableRepresentatives.map(
                                                    (r) => (
                                                        <option
                                                            key={r.id}
                                                            value={r.id}
                                                        >
                                                            {r.name} (
                                                            {r.phone_number})
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <InputError
                                                message={
                                                    errors.representative_id
                                                }
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Farm / Source Text Input */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "المزرعة أو المصدر"
                                                        : "Farm / Source"
                                                }
                                            />
                                            <TextInput
                                                type="text"
                                                className="mt-1 w-full text-sm rounded-none border-border"
                                                placeholder={
                                                    lang === "ar"
                                                        ? "مصدر البضاعة (مثال: مزرعة القصيم)"
                                                        : "e.g. Al-Qassim Farm"
                                                }
                                                value={data.farm_source}
                                                onChange={(e) =>
                                                    setData(
                                                        "farm_source",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.farm_source}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Date Input */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "تاريخ الاستلام الفعلي *"
                                                        : "Reception Date *"
                                                }
                                            />
                                            <TextInput
                                                type="date"
                                                className="mt-1 w-full text-sm rounded-none border-border"
                                                value={data.reception_date}
                                                onChange={(e) =>
                                                    setData(
                                                        "reception_date",
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={errors.reception_date}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes (الملاحظات) */}
                                    <div className="pt-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "ملاحظات السند"
                                                    : "Voucher Notes"
                                            }
                                        />
                                        <textarea
                                            className="mt-1 w-full text-sm rounded-none border-border bg-surface text-text focus:border-primary focus:ring-primary min-h-[60px] p-2"
                                            value={data.notes}
                                            onChange={(e) =>
                                                setData("notes", e.target.value)
                                            }
                                            placeholder={
                                                lang === "ar"
                                                    ? "اكتب أي ملاحظات أو تفاصيل إضافية حول هذا السند..."
                                                    : "Write any additional notes or details about this voucher..."
                                            }
                                        />
                                        <InputError
                                            message={errors.notes}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Modification Reason (OPTIONAL in Edit mode) */}
                                    {isEdit && (
                                        <div className="pt-2">
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "سبب التعديل (يسجل في سجل المراجعة)"
                                                        : "Modification Reason"
                                                }
                                            />
                                            <TextInput
                                                className="mt-1 w-full text-sm rounded-none border-border"
                                                value={data.modification_reason}
                                                onChange={(e) =>
                                                    setData(
                                                        "modification_reason",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "اكتب سبب تعديل هذا السند بالتفصيل..."
                                                        : "Write why you are editing..."
                                                }
                                                required={false}
                                            />
                                            <InputError
                                                message={
                                                    errors.modification_reason
                                                }
                                                className="mt-1"
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* POS Row Input Bar */}
                        <div className="bg-surface border border-primary/20 p-5 shadow-sm rounded-none space-y-4">
                            <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-4 w-4 text-primary" />
                                {lang === "ar"
                                    ? "إدخال البند السريع (POS Bar)"
                                    : "Quick POS Item Entry"}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                {/* Pallet Code/Number input */}
                                <div className="sm:col-span-2">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "رقم الطبلية *"
                                                : "Pallet No. *"
                                        }
                                    />
                                    <input
                                        ref={palletInputRef}
                                        type="text"
                                        className="mt-1 block w-full text-xs rounded-none border-border h-[38px] px-2 bg-surface text-text"
                                        placeholder="102"
                                        value={posPalletNumber}
                                        onChange={(e) =>
                                            setPosPalletNumber(e.target.value)
                                        }
                                        onBlur={handlePalletBlur}
                                        onKeyDown={(e) =>
                                            handleKeyNavigation(
                                                e,
                                                sizeSelectRef,
                                                null,
                                            )
                                        }
                                        disabled={loadingPallet}
                                        required
                                    />
                                </div>

                                {/* Size Select */}
                                <div className="sm:col-span-2">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "الحجم والنوع *"
                                                : "Size & Type *"
                                        }
                                    />
                                    <select
                                        ref={sizeSelectRef}
                                        className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                        value={posPalletSize}
                                        onChange={(e) =>
                                            setPosPalletSize(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyNavigation(
                                                e,
                                                itemSearchRef,
                                                palletInputRef,
                                            )
                                        }
                                        required
                                    >
                                        <option value="صغيرة">
                                            {lang === "ar" ? "صغيرة" : "Small"}
                                        </option>
                                        <option value="وسط">
                                            {lang === "ar" ? "وسط" : "Medium"}
                                        </option>
                                        <option value="كبيرة">
                                            {lang === "ar" ? "كبيرة" : "Large"}
                                        </option>
                                        <option value="خشب">
                                            {lang === "ar" ? "خشب" : "Wood"}
                                        </option>
                                        <option value="بلاستيك">
                                            {lang === "ar"
                                                ? "بلاستيك"
                                                : "Plastic"}
                                        </option>
                                    </select>
                                </div>

                                {/* Item Autocomplete */}
                                <div className="sm:col-span-3 relative">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "الصنف المخزني *"
                                                : "Inventory Item *"
                                        }
                                    />
                                    <input
                                        ref={itemSearchRef}
                                        type="text"
                                        className="mt-1 block w-full text-xs rounded-none border-border h-[38px] px-2 bg-surface text-text"
                                        placeholder={
                                            lang === "ar"
                                                ? "ابحث عن الصنف..."
                                                : "Search item..."
                                        }
                                        value={posItemSearch}
                                        onChange={(e) => {
                                            setPosItemSearch(e.target.value);
                                            setShowPosItemDropdown(true);
                                        }}
                                        onFocus={() =>
                                            setShowPosItemDropdown(true)
                                        }
                                        onBlur={() =>
                                            setShowPosItemDropdown(false)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                showPosItemDropdown &&
                                                filteredPOSItems.length > 0
                                            ) {
                                                if (e.key === "ArrowDown") {
                                                    e.preventDefault();
                                                    setPosItemActiveIndex(
                                                        (prev) =>
                                                            prev <
                                                            filteredPOSItems.length -
                                                                1
                                                                ? prev + 1
                                                                : 0,
                                                    );
                                                    return;
                                                } else if (
                                                    e.key === "ArrowUp"
                                                ) {
                                                    e.preventDefault();
                                                    setPosItemActiveIndex(
                                                        (prev) =>
                                                            prev > 0
                                                                ? prev - 1
                                                                : filteredPOSItems.length -
                                                                  1,
                                                    );
                                                    return;
                                                } else if (e.key === "Enter") {
                                                    if (
                                                        posItemActiveIndex >=
                                                            0 &&
                                                        posItemActiveIndex <
                                                            filteredPOSItems.length
                                                    ) {
                                                        e.preventDefault();
                                                        const selected =
                                                            filteredPOSItems[
                                                                posItemActiveIndex
                                                            ];
                                                        setPosItemId(
                                                            selected.id,
                                                        );
                                                        setPosItemSearch(
                                                            displayBilingual(
                                                                selected.name,
                                                            ),
                                                        );
                                                        setShowPosItemDropdown(
                                                            false,
                                                        );
                                                        variantSelectRef.current?.focus();
                                                        return;
                                                    }
                                                } else if (e.key === "Escape") {
                                                    setShowPosItemDropdown(
                                                        false,
                                                    );
                                                    return;
                                                }
                                            }
                                            // Fallback to left/right arrow navigation
                                            handleKeyNavigation(
                                                e,
                                                variantSelectRef,
                                                sizeSelectRef,
                                            );
                                        }}
                                        required
                                    />
                                    {showPosItemDropdown &&
                                        posItemSearch &&
                                        filteredPOSItems.length > 0 && (
                                            <div className="absolute z-20 w-full bg-surface border border-border shadow-md max-h-48 overflow-y-auto mt-1 divide-y divide-border">
                                                {filteredPOSItems.map(
                                                    (item, idx) => (
                                                        <div
                                                            key={item.id}
                                                            className={`p-2 text-xs font-semibold cursor-pointer text-text transition-colors ${
                                                                idx ===
                                                                posItemActiveIndex
                                                                    ? "bg-primary/10 text-primary font-bold"
                                                                    : "hover:bg-surface-muted"
                                                            }`}
                                                            onMouseDown={(
                                                                e,
                                                            ) => {
                                                                e.preventDefault();
                                                                setPosItemId(
                                                                    item.id,
                                                                );
                                                                setPosItemSearch(
                                                                    displayBilingual(
                                                                        item.name,
                                                                    ),
                                                                );
                                                                setShowPosItemDropdown(
                                                                    false,
                                                                );
                                                                variantSelectRef.current?.focus();
                                                            }}
                                                        >
                                                            {displayBilingual(
                                                                item.name,
                                                            )}{" "}
                                                            ({item.code})
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* Variant Select (عبوة) */}
                                <div className="sm:col-span-2">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "العبوة *"
                                                : "Variant *"
                                        }
                                    />
                                    <select
                                        ref={variantSelectRef}
                                        className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                        value={posVariantId}
                                        onChange={(e) =>
                                            setPosVariantId(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyNavigation(
                                                e,
                                                qtyInputRef,
                                                itemSearchRef,
                                            )
                                        }
                                        disabled={!posItemId}
                                        required
                                    >
                                        <option value="">
                                            {lang === "ar"
                                                ? "-- عبوة --"
                                                : "-- Variant --"}
                                        </option>
                                        {posVariants.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {displayBilingual(v.name)}
                                                {v.quality
                                                    ? ` - ${displayBilingual(v.quality)}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quality Text Input (درجة) */}
                                <div className="sm:col-span-1">
                                    <InputLabel
                                        value={
                                            lang === "ar" ? "الدرجة" : "Quality"
                                        }
                                    />
                                    <TextInput
                                        ref={qualityInputRef}
                                        className="mt-1 block w-full text-xs rounded-none border-border h-[38px] bg-slate-50 text-slate-600 font-bold"
                                        value={posQuality}
                                        readOnly
                                    />
                                </div>

                                {/* Quantity Input */}
                                <div className="sm:col-span-1">
                                    <InputLabel
                                        value={
                                            lang === "ar" ? "الكمية *" : "Qty *"
                                        }
                                    />
                                    <input
                                        ref={qtyInputRef}
                                        type="number"
                                        step="0.01"
                                        className="mt-1 block w-full text-xs rounded-none border-border h-[38px] px-2 bg-surface text-text font-mono"
                                        placeholder="0.00"
                                        value={posQuantity}
                                        onChange={(e) =>
                                            setPosQuantity(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddPOSRow();
                                            } else {
                                                handleKeyNavigation(
                                                    e,
                                                    addButtonRef,
                                                    variantSelectRef,
                                                );
                                            }
                                        }}
                                        required
                                    />
                                </div>

                                {/* Add Button */}
                                <div className="sm:col-span-1">
                                    <button
                                        ref={addButtonRef}
                                        type="button"
                                        onClick={handleAddPOSRow}
                                        className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold h-[38px] flex items-center justify-center rounded-none transition-all"
                                        onKeyDown={(e) =>
                                            handleKeyNavigation(
                                                e,
                                                null,
                                                qtyInputRef,
                                            )
                                        }
                                    >
                                        {lang === "ar" ? "إدراج" : "Insert"}
                                    </button>
                                </div>
                            </div>

                            {posRowError && (
                                <div className="bg-danger/10 border border-danger/20 text-danger p-2 text-xs font-bold rounded-none flex items-center gap-1.5">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{posRowError}</span>
                                </div>
                            )}
                        </div>

                        {/* List of Added Receptions Items */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                            <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider">
                                {lang === "ar"
                                    ? "البنود المدرجة حالياً بالسند"
                                    : "Pallets List in this Voucher"}
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start border border-border">
                                    <thead className="bg-surface-muted text-text-muted font-bold border-b border-border">
                                        <tr>
                                            <th className="px-3 py-2 text-start w-10">
                                                #
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "رقم الطبلية"
                                                    : "Pallet No."}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "حجم/نوع الطبلية"
                                                    : "Pallet Size"}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "الصنف المخزني"
                                                    : "Inventory Item"}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "العبوة"
                                                    : "Variant"}
                                            </th>
                                            <th className="px-3 py-2 text-start">
                                                {lang === "ar"
                                                    ? "الدرجة"
                                                    : "Quality"}
                                            </th>
                                            <th className="px-3 py-2 text-end">
                                                {lang === "ar"
                                                    ? "الكمية المستلمة"
                                                    : "Qty Received"}
                                            </th>
                                            <th className="px-3 py-2 text-center w-16">
                                                {lang === "ar"
                                                    ? "إجراء"
                                                    : "Action"}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan="8"
                                                    className="px-3 py-6 text-center text-text-muted font-bold"
                                                >
                                                    {lang === "ar"
                                                        ? "لا توجد بنود مضافة لهذا السند بعد. استخدم الشريط السريع بالأعلى لإدخال البنود."
                                                        : "No items added yet. Use the POS bar to add items."}
                                                </td>
                                            </tr>
                                        ) : (
                                            data.items.map((item, index) => {
                                                const inventoryItem =
                                                    inventoryItems.find(
                                                        (i) =>
                                                            i.id ===
                                                            item.inventory_item_id,
                                                    );
                                                const variant =
                                                    inventoryItem?.variants?.find(
                                                        (v) =>
                                                            v.id ===
                                                            item.inventory_item_variant_id,
                                                    );

                                                return (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="px-3 py-2.5 font-mono text-text-muted">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-primary">
                                                            {item.pallet_number}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-bold text-text-muted">
                                                            {item.pallet_size}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-bold text-text">
                                                            {displayBilingual(
                                                                inventoryItem?.name,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-text-muted font-semibold">
                                                            {displayBilingual(
                                                                variant?.name,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-text-muted">
                                                            {displayBilingual(
                                                                variant?.quality,
                                                            ) || "—"}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono font-extrabold text-end text-emerald-600">
                                                            {parseFloat(
                                                                item.quantity_in,
                                                            ).toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveItemRow(
                                                                        index,
                                                                    )
                                                                }
                                                                className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/25 transition-all rounded-none inline-flex items-center"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {errors.items && (
                                <p className="text-xs text-danger font-bold mt-1">
                                    {errors.items}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Stats Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contract Occupancy Stats Sidebar */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                        {lang === "ar"
                                            ? "سعة وحالة إشغال العقد"
                                            : "Contract Capacity Stats"}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsStatsCollapsed(!isStatsCollapsed)
                                    }
                                    className="text-text-muted hover:text-text focus:outline-none transition-colors"
                                >
                                    {isStatsCollapsed ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {!isStatsCollapsed && (
                                <>
                                    {loadingStats ? (
                                        <div className="py-6 text-center text-xs text-text-muted">
                                            {lang === "ar"
                                                ? "جاري تحميل إحصاءات السعة..."
                                                : "Loading stats..."}
                                        </div>
                                    ) : contractStats ? (
                                        <div className="space-y-4 text-xs">
                                            <div className="bg-slate-50 border border-border p-3 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-muted font-medium">
                                                        {lang === "ar"
                                                            ? "السعة الكلية للعقد:"
                                                            : "Total Capacity:"}
                                                    </span>
                                                    <span className="font-bold text-text font-mono text-sm">
                                                        {
                                                            contractStats.total_capacity
                                                        }{" "}
                                                        {lang === "ar"
                                                            ? "طبلية"
                                                            : "Pallets"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-muted font-medium">
                                                        {lang === "ar"
                                                            ? "المستلم بالمخازن:"
                                                            : "Received in Store:"}
                                                    </span>
                                                    <span className="font-bold text-amber-600 font-mono text-sm">
                                                        {
                                                            liveCurrentlyInWarehouse
                                                        }{" "}
                                                        {lang === "ar"
                                                            ? "طبلية"
                                                            : "Pallets"}
                                                    </span>
                                                </div>
                                                <hr className="border-border" />
                                                <div className="flex justify-between items-center">
                                                    <span className="text-text-muted font-bold">
                                                        {lang === "ar"
                                                            ? "السعة المتبقية:"
                                                            : "Remaining Space:"}
                                                    </span>
                                                    <span
                                                        className={`font-black font-mono text-[15px] ${liveRemaining > 0 ? "text-emerald-600" : "text-danger"}`}
                                                    >
                                                        {liveRemaining}{" "}
                                                        {lang === "ar"
                                                            ? "طبلية"
                                                            : "Pallets"}
                                                    </span>
                                                </div>
                                            </div>

                                            {liveRemaining <= 0 && (
                                                <div className="bg-danger/10 border border-danger/25 text-danger font-bold p-3 rounded-none flex items-start gap-1.5 text-[11px]">
                                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <span>
                                                        {lang === "ar"
                                                            ? "لقد تم استهلاك كامل سعة العقد، استمرار الاستلام قد يتجاوز السقف المحدد."
                                                            : "Contract has reached full capacity. Proceeding may exceed terms limit."}
                                                    </span>
                                                </div>
                                            )}

                                            {liveRemaining > 0 && (
                                                <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 font-bold p-3 rounded-none flex items-start gap-1.5 text-[11px]">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <span>
                                                        {lang === "ar"
                                                            ? "السعة كافية والربط القانوني والفوترة سليم للاستلام."
                                                            : "Capacity is sufficient for receiving pallets under contract."}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-xs text-text-muted">
                                            {lang === "ar"
                                                ? "يرجى تحديد العقد لإظهار إحصاءات الإشغال."
                                                : "Select contract to calculate capacity stats."}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>

            {/* Quick Create Driver Modal */}
            <Modal
                show={isDriverModalOpen}
                onClose={() => setDriverModalOpen(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={handleCreateDriver}
                    className="p-6 space-y-4 text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "إضافة سائق ناقل جديد"
                                : "Add New Carrier Driver"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setDriverModalOpen(false)}
                            className="text-text-muted hover:text-text"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "اسم السائق *"
                                        : "Driver Name *"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-xs rounded-none border-border"
                                value={newDriverData.name}
                                onChange={(e) =>
                                    setNewDriverData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                required
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "رقم الجوال"
                                        : "Phone Number"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-xs rounded-none border-border"
                                value={newDriverData.phone_number}
                                onChange={(e) =>
                                    setNewDriverData((prev) => ({
                                        ...prev,
                                        phone_number: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "رقم الهوية / الإقامة"
                                        : "ID / Iqama Number"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-xs rounded-none border-border"
                                value={newDriverData.id_number}
                                onChange={(e) =>
                                    setNewDriverData((prev) => ({
                                        ...prev,
                                        id_number: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "رقم اللوحة"
                                        : "Vehicle Plate No."
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-xs rounded-none border-border"
                                value={newDriverData.vehicle_plate}
                                onChange={(e) =>
                                    setNewDriverData((prev) => ({
                                        ...prev,
                                        vehicle_plate: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "نوع السيارة"
                                        : "Vehicle Type"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-xs rounded-none border-border"
                                value={newDriverData.vehicle_type}
                                onChange={(e) =>
                                    setNewDriverData((prev) => ({
                                        ...prev,
                                        vehicle_type: e.target.value,
                                    }))
                                }
                                placeholder="دينا، تريلا، لوري..."
                            />
                        </div>

                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "رقم رخصة القيادة"
                                        : "Driver License No."
                                }
                            />
                            <TextInput
                                className="mt-1 w-full text-xs rounded-none border-border"
                                value={newDriverData.license_number}
                                onChange={(e) =>
                                    setNewDriverData((prev) => ({
                                        ...prev,
                                        license_number: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {driverError && (
                        <p className="text-xs text-danger font-bold">
                            {driverError}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setDriverModalOpen(false)}
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
                            text={lang === "ar" ? "إضافة السائق" : "Add Driver"}
                        >
                            <button
                                type="submit"
                                disabled={addingDriver}
                                className={`bg-primary hover:bg-primary/95 text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"} disabled:opacity-50`}
                            >
                                <Plus className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {addingDriver
                                            ? lang === "ar"
                                                ? "جاري الإضافة..."
                                                : "Adding..."
                                            : lang === "ar"
                                              ? "إضافة السائق"
                                              : "Add Driver"}
                                    </span>
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </form>
            </Modal>

            {/* Confirm Secure Delete Modal */}
            <Modal
                show={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={confirmDelete}
                    className="p-6 space-y-4 text-start"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <div className="flex items-center gap-2 border-b border-border pb-3">
                        <ShieldAlert className="h-6 w-6 text-danger" />
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "تأكيد حذف سند الاستلام"
                                : "Confirm Reception Deletion"}
                        </h3>
                    </div>

                    <p className="text-xs text-text-muted">
                        {lang === "ar"
                            ? "أنت على وشك حذف هذا السند وحركات المخزن التابعة له بشكل نهائي. هذا الإجراء غير قابل للتراجع."
                            : "You are about to permanently delete this reception voucher and all associated inventory entries. This action cannot be undone."}
                    </p>

                    {reception && (
                        <div className="bg-surface-muted/50 p-3 border border-border text-xs font-mono rounded-none">
                            <div>
                                <span className="font-bold text-text-muted">
                                    {lang === "ar" ? "رقم السند: " : "Serial: "}
                                </span>
                                <span className="text-text font-bold">
                                    {reception.serial_number}
                                </span>
                            </div>
                            {reception.customer && (
                                <div className="mt-1">
                                    <span className="font-bold text-text-muted">
                                        {lang === "ar"
                                            ? "العميل: "
                                            : "Customer: "}
                                    </span>
                                    <span className="text-text font-bold">
                                        {reception.customer.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

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
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                        {deleteError && (
                            <p className="text-xs text-danger mt-1 font-bold">
                                {deleteError}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Tooltip text={lang === "ar" ? "إلغاء" : "Cancel"}>
                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(false)}
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
                                disabled={processingDelete}
                                className={`bg-danger hover:bg-danger-hover text-white rounded-none flex items-center justify-center font-bold text-xs transition-all h-[30px] gap-1.5 ${showButtonText ? "px-3" : "w-[30px] p-0"} disabled:opacity-50`}
                            >
                                <Trash2 className="h-4 w-4" />
                                {showButtonText && (
                                    <span>
                                        {processingDelete
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
        </AuthenticatedLayout>
    );
}
