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
    Printer,
    RefreshCw,
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
import PageHeader from "@/Components/PageHeader";
import Tooltip from "@/Components/Tooltip";
import axios from "axios";

export default function CreateEdit({
    customers = [],
    drivers = [],
    isEdit = false,
    delivery = null,
    draftDeliveries = [],
    exitAuthorizations = [],
    inventoryItems = [],
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

    // Dynamic lists based on selection
    const [availableContracts, setAvailableContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [availableRepresentatives, setAvailableRepresentatives] = useState(
        [],
    );

    // Live contract occupancy stats
    const [contractStats, setContractStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Customer autocomplete
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [customerActiveIndex, setCustomerActiveIndex] = useState(-1);

    // Pallet autocomplete
    const [palletSearch, setPalletSearch] = useState("");
    const [showPalletDropdown, setShowPalletDropdown] = useState(false);
    const [palletActiveIndex, setPalletActiveIndex] = useState(-1);

    // POS Row temporary inputs state (progressive loading)
    const [posPallets, setPosPallets] = useState([]);
    const [posItems, setPosItems] = useState([]);
    const [posVariants, setPosVariants] = useState([]);
    const [loadingPallets, setLoadingPallets] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingVariants, setLoadingVariants] = useState(false);

    const [posPalletId, setPosPalletId] = useState("");
    const [posPalletNumber, setPosPalletNumber] = useState("");
    const [posPalletSize, setPosPalletSize] = useState("");
    const [posItemId, setPosItemId] = useState("");
    const [posVariantId, setPosVariantId] = useState("");
    const [posQuality, setPosQuality] = useState("");
    const [posMaxBalance, setPosMaxBalance] = useState(0);
    const [posQuantity, setPosQuantity] = useState("");
    const [posRowError, setPosRowError] = useState("");

    // Collapsible states
    const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
    const [isGeneralCollapsed, setIsGeneralCollapsed] = useState(isEdit);

    // Deletion Modal state
    const {
        itemToDelete: deleteItem,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing: processingDelete,
        requestDelete,
        confirmDelete,
        cancelDelete
    } = useSecureDelete();

    // Keyboard navigation refs
    const palletSelectRef = useRef(null);
    const itemSelectRef = useRef(null);
    const variantSelectRef = useRef(null);
    const qtyInputRef = useRef(null);
    const insertBtnRef = useRef(null);

    // Ref to always hold latest submit handler (avoids stale closure in keyboard shortcut useEffect)
    const submitRef = useRef(null);
    // Ref to always hold latest collapse action for Ctrl+S
    const ctrlSRef = useRef(null);

    // Form setup using Inertia useForm
    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: delivery?.customer_id || "",
        contract_id: delivery?.contract_id || "",
        period_id: delivery?.period_id || "",
        exit_authorization_id: delivery?.exit_authorization_id || "",
        written_reference: delivery?.written_reference || "",
        driver_id: delivery?.driver_id || "",
        representative_id: delivery?.representative_id || "",
        notes: delivery?.notes || "",
        delivery_date: delivery?.delivery_date
            ? new Date(delivery.delivery_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        modification_reason: "",
        status: delivery?.status || "draft",
        items: delivery?.inventory_entries
            ? delivery.inventory_entries.map((e) => ({
                  id: e.id,
                  inventory_item_id: e.inventory_item_id,
                  inventory_item_variant_id: e.inventory_item_variant_id,
                  pallet_number: e.pallet?.pallet_number || "",
                  pallet_size: e.pallet?.size || "وسط",
                  quantity_out: parseInt(e.quantity_out, 10),
              }))
            : [],
    });

    // Sync items with delivery.inventory_entries when updated on the server
    useEffect(() => {
        if (delivery?.inventory_entries) {
            setData(
                "items",
                delivery.inventory_entries.map((e) => ({
                    id: e.id,
                    inventory_item_id: e.inventory_item_id,
                    inventory_item_variant_id: e.inventory_item_variant_id,
                    pallet_number: e.pallet?.pallet_number || "",
                    pallet_size: e.pallet?.size || "وسط",
                    quantity_out: parseInt(e.quantity_out, 10),
                })),
            );
        }
    }, [delivery.inventory_entries]);

    // Auto-expand general section when validation errors exist (so user sees what's missing)
    useEffect(() => {
        const generalFields = [
            "customer_id",
            "contract_id",
            "period_id",
            "written_reference",
            "delivery_date",
            "driver_id",
            "representative_id",
            "exit_authorization_id",
        ];
        const hasGeneralErrors = generalFields.some((f) => errors[f]);
        if (hasGeneralErrors && isGeneralCollapsed) {
            setIsGeneralCollapsed(false);
        }
    }, [errors]);

    const displayBilingual = (rawText) => {
        if (!rawText) return "";
        const parts = rawText.split("|").map((s) => s.trim());
        if (parts.length > 1) {
            return lang === "ar" ? parts[0] : parts[1];
        }
        return rawText;
    };

    // Global keyboard shortcuts (Ctrl+S: save draft + collapse, Ctrl+Shift+S: approve+Index, Ctrl+E: approve+Print, Ctrl+D: Delete)
    // We use submitRef / ctrlSRef so the handler always calls the latest version (avoids stale closure)
    useEffect(() => {
        const handleGlobalShortcuts = (e) => {
            if (!e.ctrlKey) return;

            if (e.code === "KeyS") {
                e.preventDefault();
                if (e.shiftKey) {
                    // Ctrl+Shift+S → approve and go to index
                    submitRef.current?.("approved", "index");
                } else {
                    // Ctrl+S → save draft, stay on edit, collapse general section
                    ctrlSRef.current?.();
                }
            } else if (e.code === "KeyE") {
                e.preventDefault();
                // Ctrl+E → approve and print
                submitRef.current?.("approved", "print");
            } else if (e.code === "KeyD") {
                e.preventDefault();
                if (delivery) {
                    requestDelete(route("deliveries.destroy", delivery.id), delivery);
                }
            }
        };
        window.addEventListener("keydown", handleGlobalShortcuts);
        return () =>
            window.removeEventListener("keydown", handleGlobalShortcuts);
    }, []); // empty deps – always uses refs which are kept fresh below

    // Handle initial customer display
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

    // Handle customer contracts
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

    const loadPallets = (contractId) => {
        if (!contractId) return;
        setLoadingPallets(true);
        axios
            .get(route("api.contracts.pallets", contractId))
            .then((res) => {
                setPosPallets(res.data);
                setLoadingPallets(false);
            })
            .catch((err) => {
                console.error(err);
                setLoadingPallets(false);
            });
    };

    const loadContractStats = (contractId) => {
        if (!contractId) return;
        setLoadingStats(true);
        axios
            .get(route("api.contracts.occupancy-stats", contractId))
            .then((res) => {
                setContractStats(res.data);
                setLoadingStats(false);
            })
            .catch((err) => {
                console.error(err);
                setLoadingStats(false);
            });
    };

    // Handle contract change dependencies
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

                if (!isEdit && !data.period_id) {
                    setData((d) => ({
                        ...d,
                        period_id: activePeriods?.[0]?.id || "",
                        representative_id:
                            contract.contract_agents?.[0]?.id || "",
                    }));
                }

                // Fetch occupancy stats
                loadContractStats(contract.id);

                // Load pallets with balance > 0
                loadPallets(contract.id);
            }
        } else {
            setAvailablePeriods([]);
            setAvailableRepresentatives([]);
            setContractStats(null);
            setPosPallets([]);
        }
        setPosPalletId("");
        setPalletSearch("");
        setPosItemId("");
        setPosVariantId("");
        setPosMaxBalance(0);
        setPosQuantity("");
        setPosRowError("");
    }, [data.contract_id, availableContracts]);

    // Fetch items when pallet selection changes
    useEffect(() => {
        if (posPalletId && data.contract_id) {
            const selectedPallet = posPallets.find(
                (p) => p.id === parseInt(posPalletId),
            );
            if (selectedPallet) {
                setPosPalletNumber(selectedPallet.pallet_number);
                setPosPalletSize(selectedPallet.size);
            }

            setLoadingItems(true);
            setPosItems([]);
            setPosVariants([]);
            setPosItemId("");
            setPosVariantId("");
            setPosMaxBalance(0);

            axios
                .get(
                    route("api.contracts.pallets.items", [
                        data.contract_id,
                        posPalletId,
                    ]),
                )
                .then((res) => {
                    setPosItems(res.data);
                    setLoadingItems(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoadingItems(false);
                });
        }
    }, [posPalletId]);

    // Fetch variants when item selection changes
    useEffect(() => {
        if (posItemId && posPalletId && data.contract_id) {
            setLoadingVariants(true);
            setPosVariants([]);
            setPosVariantId("");
            setPosMaxBalance(0);

            axios
                .get(
                    route("api.contracts.pallets.items.variants", [
                        data.contract_id,
                        posPalletId,
                        posItemId,
                    ]),
                )
                .then((res) => {
                    setPosVariants(res.data);
                    setLoadingVariants(false);
                })
                .catch((err) => {
                    console.error(err);
                    setLoadingVariants(false);
                });
        }
    }, [posItemId]);

    // Set balance & quality when variant is selected
    useEffect(() => {
        if (posVariantId && posVariants.length > 0) {
            const selectedVar = posVariants.find(
                (v) => v.inventory_item_variant_id === parseInt(posVariantId),
            );
            if (selectedVar) {
                setPosMaxBalance(selectedVar.balance);
                setPosQuality(
                    displayBilingual(selectedVar.variant?.quality) || "",
                );
                setPosQuantity(selectedVar.balance.toString()); // default to full balance
            }
        } else {
            setPosMaxBalance(0);
            setPosQuality("");
            setPosQuantity("");
        }
    }, [posVariantId]);

    // Handle exit authorization selection (preloads data)
    useEffect(() => {
        if (data.exit_authorization_id) {
            const exitAuth = exitAuthorizations.find(
                (ea) => ea.id === parseInt(data.exit_authorization_id),
            );
            if (exitAuth) {
                setData((d) => ({
                    ...d,
                    customer_id: exitAuth.customer_id,
                    contract_id: exitAuth.contract_id,
                    notes: exitAuth.notes || d.notes,
                    items: exitAuth.items.map((item) => ({
                        id: null,
                        inventory_item_id: item.inventory_item_id,
                        inventory_item_variant_id:
                            item.inventory_item_variant_id,
                        pallet_number: item.pallet_number || "",
                        pallet_size: "وسط",
                        quantity_out: item.quantity,
                    })),
                }));
            }
        }
    }, [data.exit_authorization_id]);

    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()),
    );

    const filteredPallets = posPallets.filter((p) => {
        const search = palletSearch.toLowerCase();
        if (!search) return true;
        const code = (p.pallet_code || "").toLowerCase();
        const num = (p.pallet_number || "").toString().toLowerCase();
        const labelAr = `طبلية ${num}`;
        const labelEn = `pallet ${num}`;
        return (
            code.includes(search) ||
            num.includes(search) ||
            labelAr.includes(search) ||
            labelEn.includes(search)
        );
    });

    const handleKeyNavigation = (e, nextRef, prevRef) => {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            if (lang === "ar") {
                prevRef?.current?.focus();
            } else {
                nextRef?.current?.focus();
            }
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            if (lang === "ar") {
                nextRef?.current?.focus();
            } else {
                prevRef?.current?.focus();
            }
        }
    };

    const handleCustomerKeyDown = (e) => {
        if (!showCustomerDropdown) {
            if (e.key === "ArrowDown") {
                setShowCustomerDropdown(true);
                setCustomerActiveIndex(0);
                e.preventDefault();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setCustomerActiveIndex((prev) =>
                prev < filteredCustomers.length - 1 ? prev + 1 : prev,
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCustomerActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            if (
                customerActiveIndex >= 0 &&
                customerActiveIndex < filteredCustomers.length
            ) {
                e.preventDefault();
                const selected = filteredCustomers[customerActiveIndex];
                setData("customer_id", selected.id);
                setCustomerSearch(selected.name);
                setShowCustomerDropdown(false);
                setCustomerActiveIndex(-1);
            }
        } else if (e.key === "Escape") {
            setShowCustomerDropdown(false);
            setCustomerActiveIndex(-1);
        }
    };

    const handlePalletKeyDown = (e) => {
        if (showPalletDropdown && filteredPallets.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setPalletActiveIndex((prev) =>
                    prev < filteredPallets.length - 1 ? prev + 1 : prev,
                );
                return;
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setPalletActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
                return;
            } else if (e.key === "Enter") {
                if (
                    palletActiveIndex >= 0 &&
                    palletActiveIndex < filteredPallets.length
                ) {
                    e.preventDefault();
                    const selected = filteredPallets[palletActiveIndex];
                    setPosPalletId(selected.id.toString());
                    setPalletSearch(
                        `${selected.pallet_code} (${lang === "ar" ? "طبلية" : "Pallet"} ${selected.pallet_number})`,
                    );
                    setShowPalletDropdown(false);
                    setPalletActiveIndex(-1);
                    setTimeout(() => {
                        itemSelectRef.current?.focus();
                    }, 50);
                }
                return;
            } else if (e.key === "Escape") {
                setShowPalletDropdown(false);
                setPalletActiveIndex(-1);
                return;
            }
        } else {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setShowPalletDropdown(true);
                setPalletActiveIndex(0);
                return;
            }
        }

        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            handleKeyNavigation(e, itemSelectRef, null);
        }
    };

    const handleAddPOSRow = () => {
        setPosRowError("");

        if (!posPalletId) {
            setPosRowError(
                lang === "ar"
                    ? "يرجى اختيار الطبلية."
                    : "Please select pallet.",
            );
            palletSelectRef.current?.focus();
            return;
        }
        if (!posItemId) {
            setPosRowError(
                lang === "ar" ? "يرجى اختيار الصنف." : "Please select item.",
            );
            itemSelectRef.current?.focus();
            return;
        }
        if (!posVariantId) {
            setPosRowError(
                lang === "ar"
                    ? "يرجى اختيار العبوة."
                    : "Please select variant.",
            );
            variantSelectRef.current?.focus();
            return;
        }

        const qty = parseInt(posQuantity, 10);
        if (isNaN(qty) || qty <= 0) {
            setPosRowError(
                lang === "ar"
                    ? "يجب إدخال كمية صحيحة أكبر من الصفر."
                    : "Quantity must be a valid integer greater than zero.",
            );
            qtyInputRef.current?.focus();
            return;
        }

        if (qty > posMaxBalance) {
            setPosRowError(
                lang === "ar"
                    ? `الكمية المدخلة تجاوزت الرصيد المتاح (${posMaxBalance}).`
                    : `Quantity exceeds available balance (${posMaxBalance}).`,
            );
            qtyInputRef.current?.focus();
            return;
        }

        // Check for duplicates
        const exists = data.items.some(
            (item) =>
                item.pallet_number === posPalletNumber &&
                item.inventory_item_id === parseInt(posItemId) &&
                item.inventory_item_variant_id === parseInt(posVariantId),
        );

        if (exists) {
            setPosRowError(
                lang === "ar"
                    ? "هذا البند مضاف بالفعل في هذا السند."
                    : "This item on this pallet is already added.",
            );
            return;
        }

        const newItem = {
            id: null,
            inventory_item_id: parseInt(posItemId),
            inventory_item_variant_id: parseInt(posVariantId),
            pallet_number: posPalletNumber,
            pallet_size: posPalletSize,
            quantity_out: qty,
        };

        const newItems = [...data.items, newItem];

        // Save immediately to draft in backend
        router.put(
            route("deliveries.update", delivery.id),
            {
                ...data,
                items: newItems,
                status: "draft",
                redirect_to: "edit",
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Reload pallets list and stats to update balance
                    loadPallets(data.contract_id);
                    loadContractStats(data.contract_id);
                    // Reset inputs
                    setPosPalletId("");
                    setPalletSearch("");
                    setPosPalletNumber("");
                    setPosPalletSize("");
                    setPosItemId("");
                    setPosVariantId("");
                    setPosQuality("");
                    setPosMaxBalance(0);
                    setPosQuantity("");

                    // Focus back to Pallet select
                    setTimeout(() => {
                        if (palletSelectRef.current) {
                            palletSelectRef.current.focus();
                            palletSelectRef.current.select();
                        }
                    }, 150);
                },
            },
        );
    };

    const handleRemoveItemRow = (idx) => {
        const updated = [...data.items];
        updated.splice(idx, 1);

        // Save immediately to draft in backend
        router.put(
            route("deliveries.update", delivery.id),
            {
                ...data,
                items: updated,
                status: "draft",
                redirect_to: "edit",
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Reload pallets list and stats to update balance
                    loadPallets(data.contract_id);
                    loadContractStats(data.contract_id);
                },
            },
        );
    };

    const handleSwitchDraft = (targetDraftId) => {
        const currentData = {
            ...data,
            status: "draft",
            redirect_to_draft_id: targetDraftId,
        };

        if (isEdit) {
            router.put(route("deliveries.update", delivery.id), currentData);
        } else {
            router.post(route("deliveries.store"), currentData);
        }
    };

    const handleFormSubmitWithStatus = (statusValue, redirectTo = "") => {
        const currentData = {
            ...data,
            status: statusValue,
            redirect_to: redirectTo,
        };

        if (isEdit) {
            router.put(route("deliveries.update", delivery.id), currentData);
        } else {
            router.post(route("deliveries.store"), currentData);
        }
    };

    // Keep submitRef always pointing to the latest version of handleFormSubmitWithStatus
    submitRef.current = handleFormSubmitWithStatus;
    // Keep ctrlSRef fresh: save draft + collapse general section
    ctrlSRef.current = () => {
        handleFormSubmitWithStatus("draft", "edit");
        setIsGeneralCollapsed(true);
    };

    // confirmDelete logic handled by useSecureDelete hook

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
                            ? "تعذر إضافة السائق."
                            : "Could not add driver.",
                    );
                }
            });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إدارة المخازن" : "Warehouse"}
            </span>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <Link
                href={route("deliveries.index")}
                className="text-primary font-medium hover:underline"
            >
                {lang === "ar" ? "سندات التسليم" : "Deliveries"}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">
                {lang === "ar"
                    ? `سند: ${delivery.serial_number}`
                    : `Voucher: ${delivery.serial_number}`}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    lang === "ar"
                        ? `سند خروج ${delivery.serial_number}`
                        : `Delivery Voucher ${delivery.serial_number}`
                }
            />

            <div
                className="max-w-7xl mx-auto pb-8 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                {/* Header components */}
                <PageHeader
                    icon={Layers}
                    title={
                        isEdit
                            ? lang === "ar"
                                ? `تعديل سند خروج: ${delivery.serial_number}`
                                : `Edit Delivery Note: ${delivery.serial_number}`
                            : lang === "ar"
                              ? "إنشاء سند خروج جديد"
                              : "Create New Delivery Note"
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تسجيل خروج الطبالي وإصدار سندات خروج البضائع المعتمدة والمستلمة (POS style)."
                                : "Record pallet withdrawals and print approved goods delivery notes."}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-1.5">
                            {/* Back to Index link */}
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "العودة للفهرس"
                                        : "Back to Index"
                                }
                            >
                                <Link
                                    href={route("deliveries.index")}
                                    className="rounded-none h-[30px] px-2.5 flex items-center gap-1.5 justify-center bg-surface hover:bg-surface-muted border border-border text-text-muted hover:text-text font-bold text-xs transition-colors"
                                >
                                    <ArrowRight
                                        className={`h-4 w-4 ${lang === "ar" ? "" : "rotate-180"}`}
                                    />
                                    {showButtonText && (
                                        <span>
                                            {lang === "ar" ? "الفهرس" : "Index"}
                                        </span>
                                    )}
                                </Link>
                            </Tooltip>

                            <div className="h-6 w-px bg-border mx-0.5" />

                            {/* Save Draft button (Ctrl+S) */}
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
                                    className="rounded-none h-[30px] w-[30px] p-0 flex items-center justify-center bg-surface hover:bg-surface-muted border border-border text-text-muted hover:text-text transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                            </Tooltip>

                            {/* Approve & go to Index button (Ctrl+Shift+S) */}
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "اعتماد وحفظ والعودة للقائمة (Ctrl+Shift+S)"
                                        : "Approve, Save & Return to List (Ctrl+Shift+S)"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleFormSubmitWithStatus(
                                            "approved",
                                            "index",
                                        )
                                    }
                                    className="rounded-none h-[30px] px-2.5 flex items-center gap-1.5 justify-center bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white font-bold text-xs transition-colors"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        {lang === "ar" ? "اعتماد" : "Approve"}
                                    </span>
                                </button>
                            </Tooltip>

                            {/* Approve & Print button (Ctrl+E) */}
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
                                    className="rounded-none h-[30px] w-[30px] p-0 flex items-center justify-center bg-surface hover:bg-surface-muted border border-border text-text-muted hover:text-text transition-colors"
                                >
                                    <Printer className="h-4 w-4" />
                                </button>
                            </Tooltip>

                            {isEdit && (
                                <>
                                    <div className="h-6 w-px bg-border mx-1" />

                                    {/* Delete button (Ctrl+D) */}
                                    <Tooltip
                                        text={
                                            lang === "ar"
                                                ? "حذف السند (Ctrl+D)"
                                                : "Delete Voucher (Ctrl+D)"
                                        }
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsDeleteModalOpen(true)
                                            }
                                            className="rounded-none h-[30px] w-[30px] p-0 flex items-center justify-center bg-surface hover:bg-danger/10 border border-border hover:border-danger/30 text-text-muted hover:text-danger transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    }
                />

                {/* Draft switcher components */}
                {draftDeliveries.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/25 p-3 rounded-none flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                            <FolderSync className="h-4 w-4" />
                            {lang === "ar"
                                ? "المسودات النشطة المعلقة:"
                                : "Active Pending Drafts:"}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {draftDeliveries.map((dr) => {
                                const draftTooltipText = dr.customer
                                    ? dr.contract
                                        ? `${dr.customer.name} (${dr.contract.contract_number})`
                                        : `${dr.customer.name} - ${lang === "ar" ? "لم يتم تعيين عقد" : "No contract assigned"}`
                                    : lang === "ar"
                                      ? "لم يتم تعيين عقد"
                                      : "Contract not assigned yet";

                                return (
                                    <Tooltip
                                        key={dr.id}
                                        text={draftTooltipText}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSwitchDraft(dr.id)
                                            }
                                            className="px-2 py-1 text-[10px] font-bold border border-amber-400 bg-amber-100/50 hover:bg-amber-100 hover:text-amber-800 transition-all rounded-none text-amber-700 inline-block font-mono"
                                        >
                                            {dr.serial_number}
                                        </button>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    {/* Left stack (Form & POS Items) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Collapsible General Info Section */}
                        <div className="bg-surface border border-border shadow-sm rounded-none">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {lang === "ar"
                                        ? "بيانات المستند والمستلم"
                                        : "Voucher & Deliveree Details"}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsGeneralCollapsed(
                                            !isGeneralCollapsed,
                                        )
                                    }
                                    className="p-1 text-text-muted hover:text-text hover:bg-hover rounded-none transition-all"
                                >
                                    {isGeneralCollapsed ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronUp className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {!isGeneralCollapsed && (
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Exit Authorization */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "إذن الخروج المرجعي"
                                                        : "Referential Exit Permit"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                                value={
                                                    data.exit_authorization_id
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "exit_authorization_id",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- بدون إذن (سحب مباشر) --"
                                                        : "-- Direct Delivery (No Permit) --"}
                                                </option>
                                                {exitAuthorizations.map(
                                                    (ea) => (
                                                        <option
                                                            key={ea.id}
                                                            value={ea.id}
                                                        >
                                                            {ea.serial_number} -{" "}
                                                            {ea.customer?.name}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                        {/* Customer */}
                                        <div className="relative">
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "العميل المستلم *"
                                                        : "Customer *"
                                                }
                                            />
                                            <input
                                                type="text"
                                                className="mt-1 block w-full text-xs rounded-none border-border h-[38px] px-2.5 bg-surface text-text"
                                                placeholder={
                                                    lang === "ar"
                                                        ? "ابحث عن عميل..."
                                                        : "Search customer..."
                                                }
                                                value={customerSearch}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomerSearch(val);
                                                    setShowCustomerDropdown(
                                                        true,
                                                    );
                                                    setCustomerActiveIndex(-1);
                                                    if (!val) {
                                                        setData(
                                                            "customer_id",
                                                            "",
                                                        );
                                                    }
                                                }}
                                                onKeyDown={
                                                    handleCustomerKeyDown
                                                }
                                                onFocus={() =>
                                                    setShowCustomerDropdown(
                                                        true,
                                                    )
                                                }
                                                onBlur={() =>
                                                    setTimeout(() => {
                                                        setShowCustomerDropdown(
                                                            false,
                                                        );
                                                        setCustomerActiveIndex(
                                                            -1,
                                                        );
                                                    }, 200)
                                                }
                                                disabled={
                                                    !!data.exit_authorization_id
                                                }
                                            />
                                            {showCustomerDropdown &&
                                                filteredCustomers.length >
                                                    0 && (
                                                    <div className="absolute z-10 w-full bg-surface border border-border shadow-md max-h-48 overflow-y-auto mt-1 divide-y divide-border">
                                                        {filteredCustomers.map(
                                                            (c, index) => (
                                                                <div
                                                                    key={c.id}
                                                                    className={`p-2 text-xs font-semibold cursor-pointer transition-colors ${
                                                                        index ===
                                                                        customerActiveIndex
                                                                            ? "bg-primary text-white font-bold"
                                                                            : "text-text hover:bg-slate-100"
                                                                    }`}
                                                                    onMouseDown={() => {
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
                                                                        setCustomerActiveIndex(
                                                                            -1,
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

                                        {/* Contract */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "العقد للعميل *"
                                                        : "Contract *"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                                value={data.contract_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "contract_id",
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={
                                                    !data.customer_id ||
                                                    !!data.exit_authorization_id
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
                                                        {c.contract_number} (
                                                        {c.status})
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.contract_id}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Billing Period */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "فترة الفوترة النشطة *"
                                                        : "Active Period *"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                                value={data.period_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "period_id",
                                                        e.target.value,
                                                    )
                                                }
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
                                                        {new Date(
                                                            p.start_date,
                                                        ).toLocaleDateString(
                                                            lang === "ar"
                                                                ? "ar-EG"
                                                                : "en-US",
                                                        )}{" "}
                                                        -{" "}
                                                        {new Date(
                                                            p.end_date,
                                                        ).toLocaleDateString(
                                                            lang === "ar"
                                                                ? "ar-EG"
                                                                : "en-US",
                                                        )}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.period_id}
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Written Reference */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "المرجع الخطي (مطلوب بدون إذن)"
                                                        : "Written Reference"
                                                }
                                            />
                                            <TextInput
                                                className="w-full text-xs rounded-none border-border mt-1 h-[38px]"
                                                placeholder={
                                                    lang === "ar"
                                                        ? "مثال: ايميل العميل بتاريخ..."
                                                        : "e.g. Email dated..."
                                                }
                                                value={data.written_reference}
                                                onChange={(e) =>
                                                    setData(
                                                        "written_reference",
                                                        e.target.value,
                                                    )
                                                }
                                                required={
                                                    !data.exit_authorization_id
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.written_reference
                                                }
                                                className="mt-1"
                                            />
                                        </div>

                                        {/* Delivery Date */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "تاريخ التسليم والخرج *"
                                                        : "Delivery Date *"
                                                }
                                            />
                                            <TextInput
                                                type="date"
                                                className="w-full text-xs rounded-none border-border mt-1 h-[38px]"
                                                value={data.delivery_date}
                                                onChange={(e) =>
                                                    setData(
                                                        "delivery_date",
                                                        e.target.value,
                                                    )
                                                }
                                                required
                                            />
                                            <InputError
                                                message={errors.delivery_date}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Representative */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "مندوب الاستلام المعتمد"
                                                        : "Authorized Representative"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                                value={data.representative_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "representative_id",
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- مندوب المستلم --"
                                                        : "-- Customer Rep --"}
                                                </option>
                                                {availableRepresentatives.map(
                                                    (rep) => (
                                                        <option
                                                            key={rep.id}
                                                            value={rep.id}
                                                        >
                                                            {rep.name} (
                                                            {rep.phone_number ||
                                                                "—"}
                                                            )
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

                                        {/* Driver */}
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
                                                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5"
                                                >
                                                    <UserPlus className="h-3 w-3" />
                                                    {lang === "ar"
                                                        ? "سائق سريع"
                                                        : "Quick Driver"}
                                                </button>
                                            </div>
                                            <select
                                                className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
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
                                                        ? "-- السائق واللوحة --"
                                                        : "-- Driver & Plate --"}
                                                </option>
                                                {driverList.map((d) => (
                                                    <option
                                                        key={d.id}
                                                        value={d.id}
                                                    >
                                                        {d.name} [
                                                        {d.vehicle_plate || "—"}
                                                        ]
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError
                                                message={errors.driver_id}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="pt-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "ملاحظات وتوجيهات السند"
                                                    : "Remarks & Directions"
                                            }
                                        />
                                        <textarea
                                            className="mt-1 w-full text-xs rounded-none border-border bg-surface text-text focus:border-primary focus:ring-primary min-h-[60px] p-2"
                                            value={data.notes}
                                            onChange={(e) =>
                                                setData("notes", e.target.value)
                                            }
                                            placeholder={
                                                lang === "ar"
                                                    ? "اكتب تفاصيل إضافية..."
                                                    : "Write details..."
                                            }
                                        />
                                        <InputError
                                            message={errors.notes}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* POS Row Input Bar (Progressive Loading) */}
                        <div className="bg-surface border border-primary/20 p-5 shadow-sm rounded-none space-y-4">
                            <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="h-4 w-4 text-primary" />
                                {lang === "ar"
                                    ? "شريط سحب البضائع الفوري (POS Bar)"
                                    : "Progressive Loading POS Bar"}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                {/* Pallet Dropdown with balance > 0 */}
                                <div className="sm:col-span-3 relative">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "الطبلية المتاحة (رصيد > 0) *"
                                                : "Pallet *"
                                        }
                                    />
                                    <input
                                        ref={palletSelectRef}
                                        type="text"
                                        className="mt-1 block w-full text-xs rounded-none border-border h-[38px] px-2.5 bg-surface text-text focus:border-primary focus:ring-primary"
                                        placeholder={
                                            loadingPallets
                                                ? lang === "ar"
                                                    ? "جاري التحميل..."
                                                    : "Loading..."
                                                : lang === "ar"
                                                  ? "ابحث عن طبلية..."
                                                  : "Search pallet..."
                                        }
                                        value={palletSearch}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setPalletSearch(val);
                                            setShowPalletDropdown(true);
                                            setPalletActiveIndex(-1);
                                            if (!val) {
                                                setPosPalletId("");
                                                setPosPalletNumber("");
                                                setPosPalletSize("");
                                                setPosItemId("");
                                                setPosVariantId("");
                                                setPosQuality("");
                                                setPosMaxBalance(0);
                                                setPosQuantity("");
                                            }
                                        }}
                                        onKeyDown={handlePalletKeyDown}
                                        onFocus={() =>
                                            setShowPalletDropdown(true)
                                        }
                                        onBlur={() =>
                                            setTimeout(() => {
                                                setShowPalletDropdown(false);
                                                setPalletActiveIndex(-1);
                                            }, 200)
                                        }
                                        disabled={!data.contract_id}
                                    />
                                    {showPalletDropdown &&
                                        filteredPallets.length > 0 && (
                                            <div className="absolute z-10 w-full bg-surface border border-border shadow-md max-h-48 overflow-y-auto mt-1 divide-y divide-border">
                                                {filteredPallets.map(
                                                    (p, index) => (
                                                        <div
                                                            key={p.id}
                                                            className={`p-2 text-xs font-semibold cursor-pointer transition-colors ${
                                                                index ===
                                                                palletActiveIndex
                                                                    ? "bg-primary text-white font-bold"
                                                                    : "text-text hover:bg-slate-100"
                                                            }`}
                                                            onMouseDown={() => {
                                                                setPosPalletId(
                                                                    p.id.toString(),
                                                                );
                                                                setPalletSearch(
                                                                    `${p.pallet_code} (${lang === "ar" ? "طبلية" : "Pallet"} ${p.pallet_number})`,
                                                                );
                                                                setShowPalletDropdown(
                                                                    false,
                                                                );
                                                                setPalletActiveIndex(
                                                                    -1,
                                                                );
                                                            }}
                                                        >
                                                            {p.pallet_code} (
                                                            {lang === "ar"
                                                                ? "طبلية"
                                                                : "Pallet"}{" "}
                                                            {p.pallet_number})
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                </div>

                                {/* Item Dropdown (Loaded from selected pallet) */}
                                <div className="sm:col-span-3">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "الصنف على الطبلية *"
                                                : "Pallet Item *"
                                        }
                                    />
                                    <select
                                        ref={itemSelectRef}
                                        className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                        value={posItemId}
                                        onChange={(e) =>
                                            setPosItemId(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "ArrowRight" ||
                                                e.key === "ArrowLeft"
                                            ) {
                                                handleKeyNavigation(
                                                    e,
                                                    variantSelectRef,
                                                    palletSelectRef,
                                                );
                                            }
                                        }}
                                        disabled={loadingItems || !posPalletId}
                                    >
                                        <option value="">
                                            {loadingItems
                                                ? lang === "ar"
                                                    ? "جاري التحميل..."
                                                    : "Loading..."
                                                : lang === "ar"
                                                  ? "-- اختر الصنف --"
                                                  : "-- Select Item --"}
                                        </option>
                                        {posItems.map((item) => (
                                            <option
                                                key={item.id}
                                                value={item.id}
                                            >
                                                {displayBilingual(item.name)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Variant Dropdown (Loaded from selected item on pallet) */}
                                <div className="sm:col-span-2">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "العبوة والوزن *"
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
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "ArrowRight" ||
                                                e.key === "ArrowLeft"
                                            ) {
                                                handleKeyNavigation(
                                                    e,
                                                    qtyInputRef,
                                                    itemSelectRef,
                                                );
                                            }
                                        }}
                                        disabled={loadingVariants || !posItemId}
                                    >
                                        <option value="">
                                            {loadingVariants
                                                ? lang === "ar"
                                                    ? "جاري التحميل..."
                                                    : "Loading..."
                                                : lang === "ar"
                                                  ? "-- اختر العبوة --"
                                                  : "-- Select Variant --"}
                                        </option>
                                        {posVariants.map((v) => (
                                            <option
                                                key={
                                                    v.inventory_item_variant_id
                                                }
                                                value={
                                                    v.inventory_item_variant_id
                                                }
                                            >
                                                {displayBilingual(
                                                    v.variant?.name,
                                                )}{" "}
                                                ({v.balance})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Qty input with validation limit */}
                                <div className="sm:col-span-2">
                                    <div className="flex justify-between items-center">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الكمية *"
                                                    : "Qty *"
                                            }
                                        />
                                        {posMaxBalance > 0 && (
                                            <span className="text-[10px] text-emerald-600 font-bold font-mono">
                                                MAX: {posMaxBalance}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        ref={qtyInputRef}
                                        type="number"
                                        step="1"
                                        max={posMaxBalance}
                                        min="1"
                                        className="mt-1 block w-full text-xs rounded-none border-border h-[38px] px-2 bg-surface text-text font-mono font-bold"
                                        placeholder="0"
                                        value={posQuantity}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const sanitized = val.replace(
                                                /[^0-9]/g,
                                                "",
                                            );
                                            setPosQuantity(sanitized);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "." ||
                                                e.key === "," ||
                                                e.key === "e" ||
                                                e.key === "-" ||
                                                e.key === "+"
                                            ) {
                                                e.preventDefault();
                                            } else if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddPOSRow();
                                            } else if (
                                                e.key === "ArrowRight" ||
                                                e.key === "ArrowLeft"
                                            ) {
                                                handleKeyNavigation(
                                                    e,
                                                    insertBtnRef,
                                                    variantSelectRef,
                                                );
                                            }
                                        }}
                                        disabled={!posVariantId}
                                        required
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="sm:col-span-2">
                                    <button
                                        ref={insertBtnRef}
                                        type="button"
                                        onClick={handleAddPOSRow}
                                        className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold h-[38px] flex items-center justify-center rounded-none transition-all"
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "ArrowRight" ||
                                                e.key === "ArrowLeft"
                                            ) {
                                                handleKeyNavigation(
                                                    e,
                                                    null,
                                                    qtyInputRef,
                                                );
                                            }
                                        }}
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

                        {/* List of Added Delivery Items */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                            <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider">
                                {lang === "ar"
                                    ? "البنود المنصرفة بالسند"
                                    : "Pallets Deliveries List"}
                            </h3>

                            {errors.items && (
                                <div className="bg-danger/10 border border-danger/20 text-danger p-2 text-xs font-bold rounded-none flex items-center gap-1.5 mb-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>{errors.items}</span>
                                </div>
                            )}

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
                                                    ? "نوع الطبلية"
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
                                            <th className="px-3 py-2 text-end text-danger">
                                                {lang === "ar"
                                                    ? "الكمية المنصرفة"
                                                    : "Qty Out"}
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
                                                        ? "لا توجد طبالي منصرفة في السند بعد. استخدم الشريط السريع بالأعلى لإدراج الطبالي."
                                                        : "No delivery items added yet. Use the POS bar to load pallets."}
                                                </td>
                                            </tr>
                                        ) : (
                                            data.items.map((item, idx) => {
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
                                                        key={idx}
                                                        className="hover:bg-slate-50 transition-colors"
                                                    >
                                                        <td className="px-3 py-2.5 font-mono text-text-muted">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2.5 font-mono font-bold text-primary">
                                                            {item.pallet_number}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-text-muted font-semibold">
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
                                                        <td className="px-3 py-2.5 font-mono font-extrabold text-end text-danger-600">
                                                            {parseInt(
                                                                item.quantity_out,
                                                                10,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveItemRow(
                                                                        idx,
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
                        </div>
                    </div>

                    {/* Sidebar Stats panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Contract Occupancy stats */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                        {lang === "ar"
                                            ? "تفاصيل إشغال العقد"
                                            : "Contract Occupancy"}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsStatsCollapsed(!isStatsCollapsed)
                                    }
                                    className="p-1 text-text-muted hover:text-text hover:bg-hover rounded-none transition-all"
                                >
                                    {isStatsCollapsed ? (
                                        <ChevronDown className="h-3 w-3" />
                                    ) : (
                                        <ChevronUp className="h-3 w-3" />
                                    )}
                                </button>
                            </div>

                            {!isStatsCollapsed && (
                                <div className="space-y-3 pt-1 text-xs">
                                    {loadingStats ? (
                                        <p className="text-text-muted">
                                            {lang === "ar"
                                                ? "جاري تحميل الإحصائيات..."
                                                : "Loading stats..."}
                                        </p>
                                    ) : contractStats ? (
                                        <>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {lang === "ar"
                                                        ? "المحجوز من الطبالي:"
                                                        : "Booked Pallets:"}
                                                </span>
                                                <span className="font-bold font-mono text-primary">
                                                    {contractStats.booked_pallets ||
                                                        "0"}{" "}
                                                    {lang === "ar"
                                                        ? "طبلية"
                                                        : "pallets"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {lang === "ar"
                                                        ? "المستخدم من الطبالي:"
                                                        : "Utilized Pallets:"}
                                                </span>
                                                <span className="font-bold font-mono text-amber-600">
                                                    {contractStats.utilized_pallets ||
                                                        "0"}{" "}
                                                    {lang === "ar"
                                                        ? "طبلية"
                                                        : "pallets"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {lang === "ar"
                                                        ? "المتاح للاستخدام:"
                                                        : "Available Pallets:"}
                                                </span>
                                                <span className="font-bold font-mono text-emerald-600">
                                                    {contractStats.available_pallets ||
                                                        "0"}{" "}
                                                    {lang === "ar"
                                                        ? "طبلية"
                                                        : "pallets"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {lang === "ar"
                                                        ? "تاريخ انتهاء الصلاحية:"
                                                        : "End Date:"}
                                                </span>
                                                <span className="font-bold font-mono">
                                                    {contractStats.end_date
                                                        ? new Date(
                                                              contractStats.end_date,
                                                          ).toLocaleDateString(
                                                              lang === "ar"
                                                                  ? "ar-EG"
                                                                  : "en-US",
                                                          )
                                                        : "—"}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-text-muted italic">
                                            {lang === "ar"
                                                ? "يرجى تحديد عقد لعرض الإحصائيات."
                                                : "Please select contract to load details."}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Driver Modal */}
            <Modal
                show={isDriverModalOpen}
                onClose={() => setDriverModalOpen(false)}
            >
                <div
                    className="p-6 font-main"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                >
                    <h3 className="text-sm font-bold text-primary mb-4">
                        {lang === "ar"
                            ? "إضافة سائق ناقل جديد سريع"
                            : "Add Quick Carrier Driver"}
                    </h3>

                    {driverError && (
                        <div className="bg-danger/10 border border-danger/20 text-danger p-2 text-xs font-bold rounded-none mb-4 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{driverError}</span>
                        </div>
                    )}

                    <form onSubmit={handleCreateDriver} className="space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel
                                    value={
                                        lang === "ar"
                                            ? "اسم السائق كامل *"
                                            : "Driver Name *"
                                    }
                                />
                                <TextInput
                                    type="text"
                                    className="w-full text-xs mt-1"
                                    placeholder={
                                        lang === "ar"
                                            ? "أحمد محمد..."
                                            : "Driver full name..."
                                    }
                                    value={newDriverData.name}
                                    onChange={(e) =>
                                        setNewDriverData({
                                            ...newDriverData,
                                            name: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel
                                    value={
                                        lang === "ar"
                                            ? "رقم الهاتف *"
                                            : "Phone Number *"
                                    }
                                />
                                <TextInput
                                    type="text"
                                    className="w-full text-xs mt-1"
                                    placeholder="05xxxxxxx"
                                    value={newDriverData.phone_number}
                                    onChange={(e) =>
                                        setNewDriverData({
                                            ...newDriverData,
                                            phone_number: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel
                                    value={
                                        lang === "ar"
                                            ? "لوحة السيارة *"
                                            : "Vehicle Plate *"
                                    }
                                />
                                <TextInput
                                    type="text"
                                    className="w-full text-xs mt-1"
                                    placeholder="أ ب ج ١٢٣٤"
                                    value={newDriverData.vehicle_plate}
                                    onChange={(e) =>
                                        setNewDriverData({
                                            ...newDriverData,
                                            vehicle_plate: e.target.value,
                                        })
                                    }
                                    required
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
                                    type="text"
                                    className="w-full text-xs mt-1"
                                    placeholder="دينا / تريلا"
                                    value={newDriverData.vehicle_type}
                                    onChange={(e) =>
                                        setNewDriverData({
                                            ...newDriverData,
                                            vehicle_type: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
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
                                text={
                                    lang === "ar"
                                        ? "إدراج السائق"
                                        : "Save Driver"
                                }
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
                                                  ? "إدراج السائق"
                                                  : "Save Driver"}
                                        </span>
                                    )}
                                </button>
                            </Tooltip>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                show={!!deleteItem}
                title={lang === "ar" ? "تأكيد حذف مسودة سند التسليم" : "Confirm Delete Draft Note"}
                message={
                    lang === "ar"
                        ? `هل أنت متأكد من رغبتك في حذف مسودة سند التسليم ${delivery?.serial_number} نهائياً؟`
                        : `Are you sure you want to delete draft note ${delivery?.serial_number}?`
                }
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={processingDelete}
            />
        </AuthenticatedLayout>
    );
}
