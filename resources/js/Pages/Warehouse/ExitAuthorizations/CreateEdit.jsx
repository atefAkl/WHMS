import React, { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    Save,
    X,
    Plus,
    Trash2,
    FileCheck,
    FolderSync,
    UserPlus,
    AlertCircle,
    CheckCircle2,
    Layers,
    Calculator,
    Download,
    Eye,
    ChevronDown,
    ChevronUp,
    FileText,
    Play,
    Volume2,
} from "lucide-react";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import PageHeader from "@/Components/PageHeader";
import Tooltip from "@/Components/Tooltip";
import Modal from "@/Components/Modal";
import axios from "axios";

export default function CreateEdit({
    customers = [],
    inventoryItems = [],
    drivers = [],
    isEdit = false,
    authorization = null,
    defaultValidityDays = 30,
}) {
    const { lang } = useLang();

    // Setup Laravel inertia useForm hook
    const { data, setData, post, processing, errors } = useForm({
        customer_id: authorization?.customer_id || "",
        contract_id: authorization?.contract_id || "",
        period_id: authorization?.period_id || "",
        requester_type: authorization?.requester_type || "whatsapp",
        requester_proof: null, // uploaded file object
        driver_id: authorization?.driver_id || "",
        representative_id: authorization?.representative_id || "",
        deliver_to_self: authorization?.deliver_to_self || false,
        notes: authorization?.notes || "",
        items: [],
    });

    const [filteredContracts, setFilteredContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [availableRepresentatives, setAvailableRepresentatives] = useState(
        [],
    );

    // Customer autocomplete search
    const [customerSearch, setCustomerSearch] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [customerActiveIndex, setCustomerActiveIndex] = useState(-1);

    // Live contract stats (occupancy & financials)
    const [contractStats, setContractStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Collapsible sidebars
    const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
    const [isFinancialCollapsed, setIsFinancialCollapsed] = useState(false);

    // Quick Driver add modal
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
    const [addingDriver, setAddingDriver] = useState(false);
    const [driverError, setDriverError] = useState("");

    // POS Row Inputs state
    const [posItemId, setPosItemId] = useState("");
    const [posVariantId, setPosVariantId] = useState("");
    const [posPalletNumber, setPosPalletNumber] = useState("");
    const [posQuantity, setPosQuantity] = useState("");
    const [posVariants, setPosVariants] = useState([]);
    const [posRowError, setPosRowError] = useState("");

    const displayBilingual = (field) => {
        if (!field) return "";
        if (typeof field === "object") {
            return field[lang] || field.ar || field.en || "";
        }
        try {
            const parsed = JSON.parse(field);
            return parsed[lang] || parsed.ar || parsed.en || "";
        } catch (e) {
            return field;
        }
    };

    const authorizationExpiryDate = authorization?.expiry_date
        ? new Date(authorization.expiry_date)
        : null;
    const authorizationCreatedAt = authorization?.created_at
        ? new Date(authorization.created_at)
        : null;
    const authorizationIsExpired = authorizationExpiryDate
        ? authorizationExpiryDate < new Date()
        : false;

    // Load contract stats
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

    // Filter contracts when customer_id changes
    useEffect(() => {
        if (data.customer_id) {
            const customerObj = customers.find(
                (c) => c.id === parseInt(data.customer_id),
            );
            setFilteredContracts(customerObj?.contracts || []);

            // Reset dependencies if customer changes
            if (
                !isEdit &&
                !customerObj?.contracts?.some(
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
        } else {
            setFilteredContracts([]);
            setAvailablePeriods([]);
            setAvailableRepresentatives([]);
            setContractStats(null);
            setData((d) => ({
                ...d,
                contract_id: "",
                period_id: "",
                representative_id: "",
            }));
        }
    }, [data.customer_id, customers]);

    // Handle contract selection change
    useEffect(() => {
        if (data.contract_id) {
            const contract = filteredContracts.find(
                (c) => c.id === parseInt(data.contract_id),
            );
            if (contract) {
                const activePeriods = (contract.periods || []).filter(
                    (period) => period.status === "active",
                );
                setAvailablePeriods(activePeriods);
                setAvailableRepresentatives(contract.contract_agents || []);
                if (!data.period_id) {
                    setData((d) => ({
                        ...d,
                        period_id: activePeriods?.[0]?.id || "",
                    }));
                }
                loadContractStats(contract.id);
            }
        } else {
            setAvailablePeriods([]);
            setAvailableRepresentatives([]);
            setContractStats(null);
        }
    }, [data.contract_id, filteredContracts]);

    // Prepopulate fields if editing
    useEffect(() => {
        if (isEdit && authorization && customers.length > 0) {
            // Customer object setup
            const customer = customers.find(
                (c) => c.id === parseInt(authorization.customer_id),
            );
            if (customer) {
                setCustomerSearch(customer.name);
                const contractsList = customer.contracts || [];
                setFilteredContracts(contractsList);

                const contract = contractsList.find(
                    (c) => c.id === parseInt(authorization.contract_id),
                );
                if (contract) {
                    setAvailablePeriods(
                        (contract.periods || []).filter(
                            (period) => period.status === "active",
                        ),
                    );
                    setAvailableRepresentatives(contract.contract_agents || []);
                    loadContractStats(contract.id);
                }
            }

            // Sync other fields
            setData((d) => ({
                ...d,
                customer_id: authorization.customer_id || "",
                contract_id: authorization.contract_id || "",
                period_id: authorization.period_id || "",
                requester_type: authorization.requester_type || "whatsapp",
                driver_id: authorization.driver_id || "",
                representative_id: authorization.representative_id || "",
                deliver_to_self: authorization.deliver_to_self || false,
                notes: authorization.notes || "",
            }));

            // Sync items with cached variants
            if (authorization.items?.length > 0 && inventoryItems.length > 0) {
                const preloadedItems = authorization.items.map((item) => {
                    const itemObj = inventoryItems.find(
                        (i) => i.id === item.inventory_item_id,
                    );
                    return {
                        id: item.id,
                        inventory_item_id: item.inventory_item_id,
                        inventory_item_variant_id:
                            item.inventory_item_variant_id,
                        pallet_number: item.pallet_number || "",
                        quantity: item.quantity,
                        variantsList: itemObj?.variants || [],
                    };
                });
                setData("items", preloadedItems);
            }
        }
    }, [isEdit, authorization, customers, inventoryItems]);

    // Populate variants dropdown when item is selected in POS bar
    useEffect(() => {
        if (posItemId) {
            const itemObj = inventoryItems.find(
                (item) => item.id === parseInt(posItemId),
            );
            setPosVariants(itemObj?.variants || []);
            setPosVariantId("");
        } else {
            setPosVariants([]);
            setPosVariantId("");
        }
    }, [posItemId, inventoryItems]);

    // Handle adding items to list locally
    const handleAddPOSRow = () => {
        setPosRowError("");

        if (!posItemId) {
            setPosRowError(
                lang === "ar" ? "يرجى اختيار الصنف." : "Please select item.",
            );
            return;
        }
        if (!posVariantId) {
            setPosRowError(
                lang === "ar"
                    ? "يرجى اختيار العبوة."
                    : "Please select variant.",
            );
            return;
        }

        const qty = parseFloat(posQuantity);
        if (isNaN(qty) || qty <= 0) {
            setPosRowError(
                lang === "ar"
                    ? "يجب إدخال كمية أكبر من الصفر."
                    : "Quantity must be greater than zero.",
            );
            return;
        }

        // Check for duplicates
        const exists = data.items.some(
            (item) =>
                item.inventory_item_id === parseInt(posItemId) &&
                item.inventory_item_variant_id === parseInt(posVariantId) &&
                item.pallet_number === posPalletNumber,
        );

        if (exists) {
            setPosRowError(
                lang === "ar"
                    ? "هذا البند مضاف بالفعل."
                    : "This item is already added.",
            );
            return;
        }

        const newItem = {
            id: null,
            inventory_item_id: parseInt(posItemId),
            inventory_item_variant_id: parseInt(posVariantId),
            pallet_number: posPalletNumber || null,
            quantity: qty,
        };

        setData("items", [...data.items, newItem]);

        // Reset POS fields
        setPosItemId("");
        setPosVariantId("");
        setPosPalletNumber("");
        setPosQuantity("");
    };

    const handleRemoveItemRow = (index) => {
        const updated = [...data.items];
        updated.splice(index, 1);
        setData("items", updated);
    };

    // Quick add driver submit
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

    // Handle Form Submit (POST/PUT via Inertia)
    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        // Use post with _method = 'PUT' when editing with files
        if (isEdit) {
            post(route("exit-authorizations.update", authorization.id), {
                _method: "PUT",
                forceFormData: true,
            });
        } else {
            post(route("exit-authorizations.store"));
        }
    };

    // Detect file type for proof previewing
    const getFileType = (url) => {
        if (!url) return null;
        const ext = url.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext))
            return "image";
        if (ext === "pdf") return "pdf";
        if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
        if (["mp3", "wav", "ogg"].includes(ext)) return "audio";
        return "other";
    };

    const renderProofPreview = (proofUrl) => {
        if (!proofUrl) return null;
        const fileType = getFileType(proofUrl);

        if (fileType === "image") {
            return (
                <div className="max-w-[240px] border border-border p-1 bg-white">
                    <img
                        src={proofUrl}
                        alt="Proof"
                        className="w-full h-auto object-contain max-h-[160px]"
                    />
                </div>
            );
        }
        if (fileType === "pdf") {
            return (
                <div className="w-full h-[220px] border border-border">
                    <iframe
                        src={proofUrl}
                        className="w-full h-full"
                        title="PDF Proof"
                    />
                </div>
            );
        }
        if (fileType === "video") {
            return (
                <div className="flex flex-col gap-1 items-start max-w-[320px]">
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Play className="h-3 w-3" />{" "}
                        {lang === "ar" ? "ملف فيديو:" : "Video:"}
                    </span>
                    <video
                        src={proofUrl}
                        controls
                        className="w-full max-h-[160px] bg-black border border-border"
                    />
                </div>
            );
        }
        if (fileType === "audio") {
            return (
                <div className="flex flex-col gap-1 items-start w-full">
                    <span className="text-[10px] text-text-muted flex items-center gap-1">
                        <Volume2 className="h-3 w-3" />{" "}
                        {lang === "ar" ? "ملف صوتي:" : "Audio:"}
                    </span>
                    <audio src={proofUrl} controls className="w-full" />
                </div>
            );
        }
        return (
            <a
                href={proofUrl}
                download
                className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
            >
                <Download className="h-4 w-4" />
                <span>
                    {lang === "ar"
                        ? "تحميل مستند الإثبات الحالي"
                        : "Download Request Proof"}
                </span>
            </a>
        );
    };

    const filteredCustomers = customers.filter((c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()),
    );

    const totalQuantity = data.items.reduce(
        (sum, item) => sum + parseFloat(item.quantity || 0),
        0,
    );

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
                href={route("exit-authorizations.index")}
                className="text-primary font-medium hover:underline"
            >
                {lang === "ar" ? "أذونات الخروج" : "Exit Authorizations"}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">
                {isEdit
                    ? lang === "ar"
                        ? "تعديل إذن"
                        : "Edit Permit"
                    : lang === "ar"
                      ? "إنشاء إذن جديد"
                      : "New Permit"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    isEdit
                        ? lang === "ar"
                            ? "تعديل إذن خروج"
                            : "Edit Exit Permit"
                        : lang === "ar"
                          ? "إنشاء إذن خروج جديد"
                          : "New Exit Permit"
                }
            />

            <div
                className="max-w-7xl mx-auto pb-8 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                <PageHeader
                    icon={FileCheck}
                    title={
                        isEdit
                            ? lang === "ar"
                                ? `تعديل إذن خروج: ${authorization.serial_number}`
                                : `Edit Permit: ${authorization.serial_number}`
                            : lang === "ar"
                              ? "إنشاء إذن خروج جديد"
                              : "Create Exit Authorization Permit"
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "قم بتعبئة بيانات إذن الخروج وإضافة بنود الأصناف لحجزها وصرفها لاحقاً."
                                : "Fill out customer and contract details and add authorized items for delivery."}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "حفظ وإصدار الإذن"
                                        : "Save & Issue Permit"
                                }
                            >
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={processing}
                                    className="rounded-none h-[30px] w-[30px] p-0 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white transition-colors"
                                >
                                    <Save className="h-4 w-4" />
                                </button>
                            </Tooltip>
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "إلغاء التغييرات"
                                        : "Discard"
                                }
                            >
                                <Link
                                    href={route("exit-authorizations.index")}
                                    className="border border-border bg-surface text-text hover:bg-surface-muted rounded-none h-[30px] w-[30px] flex items-center justify-center transition-all"
                                >
                                    <X className="h-4 w-4" />
                                </Link>
                            </Tooltip>
                        </div>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-4">
                    {/* Main Form Fields on Left */}
                    <div className="lg:col-span-3 space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Card 1: Permit & Contract Info */}
                            <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                                <h3 className="text-xs font-bold text-primary border-b border-border pb-2 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="h-4 w-4" />
                                    {lang === "ar"
                                        ? "معلومات المستند والتعاقد"
                                        : "Permit & Contract Info"}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Customer Autocomplete */}
                                    <div className="relative">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "العميل المستورد *"
                                                    : "Customer *"
                                            }
                                        />
                                        <TextInput
                                            type="text"
                                            className="mt-1 w-full text-xs rounded-none border-border h-[38px] px-2.5 bg-surface text-text"
                                            placeholder={
                                                lang === "ar"
                                                    ? "ابحث بالاسم للعميل..."
                                                    : "Type customer name..."
                                            }
                                            value={customerSearch}
                                            onChange={(e) => {
                                                setCustomerSearch(
                                                    e.target.value,
                                                );
                                                setShowCustomerDropdown(true);
                                            }}
                                            onFocus={() =>
                                                setShowCustomerDropdown(true)
                                            }
                                            onBlur={() =>
                                                setTimeout(
                                                    () =>
                                                        setShowCustomerDropdown(
                                                            false,
                                                        ),
                                                    200,
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
                                                } else if (e.key === "Enter") {
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
                                                }
                                            }}
                                            disabled={isEdit}
                                            required
                                        />
                                        {showCustomerDropdown &&
                                            customerSearch &&
                                            filteredCustomers.length > 0 && (
                                                <div className="absolute z-10 w-full bg-surface border border-border shadow-md max-h-48 overflow-y-auto mt-1 divide-y divide-border">
                                                    {filteredCustomers.map(
                                                        (c, idx) => (
                                                            <div
                                                                key={c.id}
                                                                className={`p-2.5 text-xs font-semibold cursor-pointer text-text transition-colors ${
                                                                    idx ===
                                                                    customerActiveIndex
                                                                        ? "bg-primary/10 text-primary font-bold"
                                                                        : "hover:bg-surface-muted"
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
                                                                }}
                                                            >
                                                                {c.name}
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        {errors.customer_id && (
                                            <span className="text-xs text-danger mt-1 block">
                                                {errors.customer_id}
                                            </span>
                                        )}
                                    </div>

                                    {/* Contract Select */}
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "العقد المعتمد *"
                                                    : "Approved Contract *"
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
                                            required
                                            disabled={
                                                isEdit || !data.customer_id
                                            }
                                        >
                                            <option value="">
                                                {lang === "ar"
                                                    ? "اختر العقد..."
                                                    : "Select Contract..."}
                                            </option>
                                            {filteredContracts.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.contract_number} (
                                                    {c.status})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.contract_id && (
                                            <span className="text-xs text-danger mt-1 block">
                                                {errors.contract_id}
                                            </span>
                                        )}
                                    </div>

                                    {/* Storage Period */}
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "فترة التخزين النشطة *"
                                                    : "Active Storage Period *"
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
                                            disabled={!data.contract_id}
                                        >
                                            <option value="">
                                                {lang === "ar"
                                                    ? "اختر الفترة..."
                                                    : "Select Period..."}
                                            </option>
                                            {availablePeriods.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {lang === "ar"
                                                        ? "فترة"
                                                        : "Period"}{" "}
                                                    {p.period_number} (
                                                    {p.start_date} -{" "}
                                                    {p.end_date})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.period_id && (
                                            <span className="text-xs text-danger mt-1 block">
                                                {errors.period_id}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Requester Verification Proof */}
                            <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                                <h3 className="text-xs font-bold text-primary border-b border-border pb-2 uppercase tracking-wider">
                                    {lang === "ar"
                                        ? "تخويل وطالب الإخراج"
                                        : "Exit Order & Authorization Details"}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    {/* Requester Type */}
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "طريقة استلام طلب الإخراج *"
                                                    : "Requester Type *"
                                            }
                                        />
                                        <select
                                            className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2.5"
                                            value={data.requester_type}
                                            onChange={(e) =>
                                                setData(
                                                    "requester_type",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        >
                                            <option value="whatsapp">
                                                {lang === "ar"
                                                    ? "رسالة واتس اب (مكتوب/صوت)"
                                                    : "WhatsApp Message (Text/Voice)"}
                                            </option>
                                            <option value="written">
                                                {lang === "ar"
                                                    ? "أمر إخراج كتابي رسمي"
                                                    : "Written/Official Exit Order"}
                                            </option>
                                            <option value="personal">
                                                {lang === "ar"
                                                    ? "مسؤولية شخصية ومقابلة"
                                                    : "Personal Responsibility/Face-to-Face"}
                                            </option>
                                        </select>
                                        {errors.requester_type && (
                                            <span className="text-xs text-danger mt-1 block">
                                                {errors.requester_type}
                                            </span>
                                        )}
                                    </div>

                                    {/* File Proof upload */}
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "إرفاق مستند التخويل (دليل الطلب) *"
                                                    : "Attach Request Proof *"
                                            }
                                        />
                                        <input
                                            type="file"
                                            className="mt-1 block w-full text-xs rounded-none border border-border bg-surface text-text focus:border-primary focus:ring-primary h-[38px] p-2"
                                            onChange={(e) =>
                                                setData(
                                                    "requester_proof",
                                                    e.target.files[0],
                                                )
                                            }
                                            required={
                                                !isEdit &&
                                                data.requester_type !==
                                                    "personal"
                                            }
                                        />
                                        {errors.requester_proof && (
                                            <span className="text-xs text-danger mt-1 block">
                                                {errors.requester_proof}
                                            </span>
                                        )}

                                        {/* Proof preview area */}
                                        {isEdit &&
                                            authorization?.requester_proof && (
                                                <div className="mt-3 p-3 bg-slate-50 border border-border rounded-none">
                                                    <h4 className="text-[10px] font-bold text-text-muted mb-2">
                                                        {lang === "ar"
                                                            ? "مستند الإثبات الحالي:"
                                                            : "Current Request Attachment:"}
                                                    </h4>
                                                    {renderProofPreview(
                                                        authorization.requester_proof,
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <div className="rounded-none border border-primary/20 bg-primary/5 p-4 text-xs text-text-muted">
                                    <div className="font-semibold text-primary text-sm mb-2">
                                        {lang === "ar"
                                            ? "صلاحية إذن الخروج"
                                            : "Exit Authorization Validity"}
                                    </div>
                                    {isEdit && authorizationExpiryDate ? (
                                        <div className="space-y-1">
                                            <div>
                                                {lang === "ar"
                                                    ? "تاريخ الإنشاء:"
                                                    : "Created at:"}{" "}
                                                <span className="font-semibold text-text">
                                                    {authorizationCreatedAt?.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                {lang === "ar"
                                                    ? "تاريخ الانتهاء:"
                                                    : "Expiry date:"}{" "}
                                                <span className="font-semibold text-text">
                                                    {authorizationExpiryDate?.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                {authorizationIsExpired
                                                    ? lang === "ar"
                                                        ? "هذا الإذن منتهي الصلاحية ولا يمكن استخدامه في سندات التسليم الجديدة."
                                                        : "This authorization has expired and cannot be used for new delivery vouchers."
                                                    : lang === "ar"
                                                      ? `صلاحية هذا الإذن تصل إلى ${authorizationExpiryDate?.toLocaleDateString()}.`
                                                      : `This authorization is valid until ${authorizationExpiryDate?.toLocaleDateString()}.`}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {lang === "ar"
                                                ? `سيتم تعيين مدة صلاحية إذن الخروج تلقائياً إلى ${defaultValidityDays} يوماً من تاريخ الإنشاء.`
                                                : `The exit authorization will automatically expire ${defaultValidityDays} days after creation.`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Recipient Information */}
                            <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                                <h3 className="text-xs font-bold text-primary border-b border-border pb-2 uppercase tracking-wider">
                                    {lang === "ar"
                                        ? "تفاصيل مستلم البضاعة الفعلي"
                                        : "Recipient Information (Delivery Person)"}
                                </h3>

                                <div className="space-y-4">
                                    {/* Deliver to Self Checkbox */}
                                    <label className="inline-flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                            checked={data.deliver_to_self}
                                            onChange={(e) =>
                                                setData(
                                                    "deliver_to_self",
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <span className="text-xs font-semibold text-text">
                                            {lang === "ar"
                                                ? "تسليم البضاعة للعميل نفسه (صاحب العقد)"
                                                : "Deliver goods directly to the customer himself"}
                                        </span>
                                    </label>
                                    {errors.deliver_to_self && (
                                        <span className="text-xs text-danger mt-1 block">
                                            {errors.deliver_to_self}
                                        </span>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Carrier Driver */}
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <InputLabel
                                                    value={
                                                        lang === "ar"
                                                            ? "السائق الناقل المستلم"
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
                                                        ? "إضافة سائق سريع"
                                                        : "Add Driver"}
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
                                                disabled={data.deliver_to_self}
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- اختر سائق شاحنة --"
                                                        : "-- Select Carrier Driver --"}
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
                                            {errors.driver_id && (
                                                <span className="text-xs text-danger mt-1 block">
                                                    {errors.driver_id}
                                                </span>
                                            )}
                                        </div>

                                        {/* Authorized Agent/Representative */}
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "المندوب المفوض (المستلم)"
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
                                                disabled={
                                                    data.deliver_to_self ||
                                                    !data.contract_id
                                                }
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "-- اختر مندوباً مفوضاً للعميل --"
                                                        : "-- Select Authorized Rep --"}
                                                </option>
                                                {availableRepresentatives.map(
                                                    (rep) => (
                                                        <option
                                                            key={rep.id}
                                                            value={rep.id}
                                                        >
                                                            {rep.name} (
                                                            {rep.job_title ||
                                                                "مندوب"}
                                                            )
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {errors.representative_id && (
                                                <span className="text-xs text-danger mt-1 block">
                                                    {errors.representative_id}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Contract Manager Notes */}
                            <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-2">
                                <InputLabel
                                    value={
                                        lang === "ar"
                                            ? "توجيهات وملاحظات إخراج البضاعة"
                                            : "Exit Directives & Remarks"
                                    }
                                />
                                <textarea
                                    rows="3"
                                    className="w-full text-xs rounded-none border-border mt-1 bg-surface text-text focus:border-primary focus:ring-primary p-2.5"
                                    placeholder={
                                        lang === "ar"
                                            ? "اكتب أي تعليمات لمسؤول المخزن كشروط أو تفاصيل إضافية..."
                                            : "Write any remarks for the storekeeper..."
                                    }
                                    value={data.notes}
                                    onChange={(e) =>
                                        setData("notes", e.target.value)
                                    }
                                />
                                {errors.notes && (
                                    <span className="text-xs text-danger mt-1 block">
                                        {errors.notes}
                                    </span>
                                )}
                            </div>

                            {/* Card 5: POS quick item loading bar (Optional list) */}
                            <div className="bg-surface border border-primary/20 p-5 shadow-sm rounded-none space-y-4">
                                <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="h-4 w-4 text-primary" />
                                    {lang === "ar"
                                        ? "شريط حجز وإخراج البنود الفوري (POS Bar)"
                                        : "Quick POS Item Entry Bar"}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    {/* Inventory Item */}
                                    <div className="sm:col-span-3">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الصنف المطلوب *"
                                                    : "Inventory Item *"
                                            }
                                        />
                                        <select
                                            className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                            value={posItemId}
                                            onChange={(e) =>
                                                setPosItemId(e.target.value)
                                            }
                                        >
                                            <option value="">
                                                {lang === "ar"
                                                    ? "-- اختر صنف --"
                                                    : "-- Select Item --"}
                                            </option>
                                            {inventoryItems.map((inv) => (
                                                <option
                                                    key={inv.id}
                                                    value={inv.id}
                                                >
                                                    {inv.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Item Variant */}
                                    <div className="sm:col-span-3">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "العبوة/الوزن *"
                                                    : "Variant *"
                                            }
                                        />
                                        <select
                                            className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                            value={posVariantId}
                                            onChange={(e) =>
                                                setPosVariantId(e.target.value)
                                            }
                                            disabled={!posItemId}
                                        >
                                            <option value="">
                                                {lang === "ar"
                                                    ? "-- اختر العبوة --"
                                                    : "-- Select Variant --"}
                                            </option>
                                            {posVariants.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}{" "}
                                                    {v.quality
                                                        ? `(${v.quality})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Pallet Number input */}
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "رقم الطبلية (اختياري)"
                                                    : "Pallet (Opt)"
                                            }
                                        />
                                        <TextInput
                                            className="w-full text-xs rounded-none border-border mt-1 h-[38px] px-2"
                                            placeholder="e.g. 120"
                                            value={posPalletNumber}
                                            onChange={(e) =>
                                                setPosPalletNumber(
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    {/* Quantity input */}
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الكمية *"
                                                    : "Quantity *"
                                            }
                                        />
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            className="w-full text-xs rounded-none border-border mt-1 h-[38px] px-2 font-mono font-bold"
                                            placeholder="0.00"
                                            value={posQuantity}
                                            onChange={(e) =>
                                                setPosQuantity(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddPOSRow();
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Insert button */}
                                    <div className="sm:col-span-2">
                                        <button
                                            type="button"
                                            onClick={handleAddPOSRow}
                                            className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold h-[38px] flex items-center justify-center rounded-none transition-all"
                                        >
                                            {lang === "ar"
                                                ? "إدراج البند"
                                                : "Insert"}
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

                            {/* Card 6: Table list of added items */}
                            <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                                <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider">
                                    {lang === "ar"
                                        ? "جدول البنود والكميات المرخص بخروجها"
                                        : "Authorized Items List"}
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
                                                        ? "رقم الطبلية"
                                                        : "Pallet Number"}
                                                </th>
                                                <th className="px-3 py-2 text-end text-danger">
                                                    {lang === "ar"
                                                        ? "الكمية المرخصة"
                                                        : "Authorized Qty"}
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
                                                        colSpan="6"
                                                        className="px-3 py-6 text-center text-text-muted font-bold italic"
                                                    >
                                                        {lang === "ar"
                                                            ? "لا توجد أي بنود مدرجة بعد. استخدم الشريط السريع بالأعلى لإضافة بنود الإخراج."
                                                            : "No exit items added yet. Use the POS bar to insert items."}
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
                                                            <td className="px-3 py-2.5 font-bold text-text">
                                                                {inventoryItem?.name ||
                                                                    "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-text-muted font-semibold">
                                                                {variant?.name ||
                                                                    "—"}{" "}
                                                                {variant?.quality
                                                                    ? `(${variant.quality})`
                                                                    : ""}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono font-bold text-primary">
                                                                {item.pallet_number ||
                                                                    "—"}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-mono font-extrabold text-end text-danger">
                                                                {parseFloat(
                                                                    item.quantity,
                                                                ).toFixed(2)}
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
                                        {data.items.length > 0 && (
                                            <tfoot className="bg-surface-muted/30 border-t border-border font-bold">
                                                <tr>
                                                    <td
                                                        colSpan="4"
                                                        className="px-3 py-2.5 text-end text-text"
                                                    >
                                                        {lang === "ar"
                                                            ? "الإجمالي الكلي للكميات:"
                                                            : "Total Quantity:"}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-end text-danger font-mono font-black text-xs">
                                                        {totalQuantity.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Sidebar Stats on Right */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Occupancy stats card */}
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
                                                <span
                                                    className={`font-bold font-mono ${contractStats.available_pallets > 0 ? "text-emerald-600" : "text-danger"}`}
                                                >
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
                                                        ? "تاريخ انتهاء العقد:"
                                                        : "Expiry Date:"}
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
                                                ? "يرجى تحديد عقد لعرض الإشغال."
                                                : "Please select contract to load details."}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Financial stats card */}
                        <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                        {lang === "ar"
                                            ? "الموقف المالي للمتعاقد"
                                            : "Financial Status"}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setIsFinancialCollapsed(
                                            !isFinancialCollapsed,
                                        )
                                    }
                                    className="p-1 text-text-muted hover:text-text hover:bg-hover rounded-none transition-all"
                                >
                                    {isFinancialCollapsed ? (
                                        <ChevronDown className="h-3 w-3" />
                                    ) : (
                                        <ChevronUp className="h-3 w-3" />
                                    )}
                                </button>
                            </div>

                            {!isFinancialCollapsed && (
                                <div className="space-y-4 pt-1 text-xs">
                                    {loadingStats ? (
                                        <p className="text-text-muted">
                                            {lang === "ar"
                                                ? "جاري تحميل البيانات المالية..."
                                                : "Loading financials..."}
                                        </p>
                                    ) : contractStats?.financial ? (
                                        <>
                                            <div className="grid grid-cols-1 gap-2 bg-slate-50 border border-border p-3">
                                                <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                    <span className="text-text-muted font-medium">
                                                        {lang === "ar"
                                                            ? "إجمالي المفوتر:"
                                                            : "Total Invoiced:"}
                                                    </span>
                                                    <span className="font-bold font-mono text-text text-sm">
                                                        {parseFloat(
                                                            contractStats
                                                                .financial
                                                                .total_invoiced,
                                                        ).toLocaleString()}{" "}
                                                        {lang === "ar"
                                                            ? "ريال"
                                                            : "SAR"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                    <span className="text-text-muted font-medium">
                                                        {lang === "ar"
                                                            ? "إجمالي المدفوع:"
                                                            : "Total Paid:"}
                                                    </span>
                                                    <span className="font-bold font-mono text-emerald-600 text-sm">
                                                        {parseFloat(
                                                            contractStats
                                                                .financial
                                                                .total_paid,
                                                        ).toLocaleString()}{" "}
                                                        {lang === "ar"
                                                            ? "ريال"
                                                            : "SAR"}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-0.5">
                                                    <span className="text-text-muted font-bold">
                                                        {lang === "ar"
                                                            ? "المستحقات المتبقية:"
                                                            : "Remaining Dues:"}
                                                    </span>
                                                    <span
                                                        className={`font-black font-mono text-sm ${contractStats.financial.total_dues > 0 ? "text-danger" : "text-emerald-600"}`}
                                                    >
                                                        {parseFloat(
                                                            contractStats
                                                                .financial
                                                                .total_dues,
                                                        ).toLocaleString()}{" "}
                                                        {lang === "ar"
                                                            ? "ريال"
                                                            : "SAR"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Invoices List */}
                                            <div className="space-y-2">
                                                <h4 className="font-bold text-text-muted border-b border-border pb-1">
                                                    {lang === "ar"
                                                        ? "فواتير العقد المستحقة:"
                                                        : "Contract Invoices:"}
                                                </h4>
                                                {contractStats.financial
                                                    .invoices?.length === 0 ? (
                                                    <p className="text-text-muted italic">
                                                        {lang === "ar"
                                                            ? "لا توجد فواتير مسجلة."
                                                            : "No invoices recorded."}
                                                    </p>
                                                ) : (
                                                    <div className="max-h-[220px] overflow-y-auto space-y-2">
                                                        {contractStats.financial.invoices.map(
                                                            (inv) => (
                                                                <div
                                                                    key={inv.id}
                                                                    className="p-2 border border-border bg-surface text-[10px] space-y-1"
                                                                >
                                                                    <div className="flex justify-between font-bold">
                                                                        <span className="text-primary font-mono">
                                                                            {
                                                                                inv.invoice_number
                                                                            }
                                                                        </span>
                                                                        <span
                                                                            className={`px-1.5 rounded-none text-[8px] border ${
                                                                                inv.status ===
                                                                                "paid"
                                                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                                                    : inv.status ===
                                                                                        "partial"
                                                                                      ? "bg-amber-50 text-amber-600 border-amber-200"
                                                                                      : "bg-rose-50 text-rose-600 border-rose-200"
                                                                            }`}
                                                                        >
                                                                            {inv.status ===
                                                                            "paid"
                                                                                ? lang ===
                                                                                  "ar"
                                                                                    ? "مدفوعة"
                                                                                    : "Paid"
                                                                                : inv.status ===
                                                                                    "partial"
                                                                                  ? lang ===
                                                                                    "ar"
                                                                                      ? "جزئية"
                                                                                      : "Partial"
                                                                                  : lang ===
                                                                                      "ar"
                                                                                    ? "غير مدفوعة"
                                                                                    : "Unpaid"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex justify-between text-text-muted">
                                                                        <span>
                                                                            {lang ===
                                                                            "ar"
                                                                                ? "المبلغ:"
                                                                                : "Amount:"}
                                                                        </span>
                                                                        <span className="font-bold font-mono">
                                                                            {inv.amount.toLocaleString()}{" "}
                                                                            {lang ===
                                                                            "ar"
                                                                                ? "ريال"
                                                                                : "SAR"}
                                                                        </span>
                                                                    </div>
                                                                    {inv.due_date && (
                                                                        <div className="flex justify-between text-[9px] text-text-muted">
                                                                            <span>
                                                                                {lang ===
                                                                                "ar"
                                                                                    ? "الاستحقاق:"
                                                                                    : "Due date:"}
                                                                            </span>
                                                                            <span className="font-mono">
                                                                                {new Date(
                                                                                    inv.due_date,
                                                                                ).toLocaleDateString(
                                                                                    lang ===
                                                                                        "ar"
                                                                                        ? "ar-EG"
                                                                                        : "en-US",
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-text-muted italic">
                                            {lang === "ar"
                                                ? "يرجى تحديد عقد لعرض البيانات المالية."
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

                    <form
                        onSubmit={handleCreateDriver}
                        className="space-y-3.5 text-start"
                    >
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
                            <SecondaryButton
                                onClick={() => setDriverModalOpen(false)}
                            >
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={addingDriver}
                            >
                                {addingDriver
                                    ? lang === "ar"
                                        ? "جاري الإضافة..."
                                        : "Adding..."
                                    : lang === "ar"
                                      ? "إدراج السائق"
                                      : "Save Driver"}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
