import React, { useState, useEffect, useRef, useMemo } from "react";
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
import SearchableSelect from "@/Components/SearchableSelect";
import Modal from "@/Components/Modal";
import axios from "axios";

export default function CreateEdit({
    customers = [],
    inventoryItems = [],
    drivers = [],
    isEdit = false,
    authorization = null,
    defaultValidityDays = 30,
    canSeeFinancialState = false,
    canBypassFileProof = false,
}) {
    const { lang } = useLang();

    // Ref for Auto Focus on POS Item select
    const itemSelectRef = useRef(null);

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

    // Contract Inventory Balance State
    const [contractInventory, setContractInventory] = useState([]);

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
    const allContracts = useMemo(() => {
        const list = [];
        customers.forEach((cust) => {
            (cust.contracts || []).forEach((cnt) => {
                list.push({
                    ...cnt,
                    customer: cust,
                    customer_name: cust.name,
                    customer_id: cust.id,
                });
            });
        });
        return list;
    }, [customers]);

    const handleContractSelect = (contractId) => {
        if (!contractId) {
            setData((d) => ({
                ...d,
                contract_id: "",
                period_id: "",
                representative_id: "",
            }));
            setAvailablePeriods([]);
            setAvailableRepresentatives([]);
            setContractInventory([]);
            setContractStats(null);
            return;
        }

        const selectedContract = allContracts.find(
            (c) => c.id === parseInt(contractId)
        );

        if (selectedContract) {
            const cust = customers.find((c) => c.id === selectedContract.customer_id) || selectedContract.customer;
            const activePeriods = (selectedContract.periods || []).filter(
                (p) => p.status === "active"
            );
            const activePeriod = activePeriods[0] || (selectedContract.periods || [])[0];

            setCustomerSearch(cust?.name || "");
            setFilteredContracts(cust?.contracts || [selectedContract]);
            setAvailablePeriods(activePeriods.length > 0 ? activePeriods : (selectedContract.periods || []));
            setAvailableRepresentatives(selectedContract.contract_agents || []);

            setData((d) => ({
                ...d,
                customer_id: selectedContract.customer_id,
                contract_id: selectedContract.id,
                period_id: activePeriod?.id || "",
                representative_id: selectedContract.contract_agents?.[0]?.id || "",
            }));

            loadContractStats(selectedContract.id);

            axios.get(route("api.contracts.available-inventory", selectedContract.id))
                .then((res) => {
                    const invData = Array.isArray(res.data) ? res.data : Object.values(res.data || {});
                    setContractInventory(invData);
                })
                .catch((err) => {
                    console.error("Could not fetch available contract inventory:", err);
                    setContractInventory([]);
                });
        }
    };
    }, [data.contract_id, filteredContracts]);

    // Cascade inventory filtering for contract items, variants, and pallets
    const availableItemsForContract = inventoryItems.filter((item) =>
        contractInventory.some((ci) => ci.inventory_item_id === item.id)
    );

    const availableVariantsForPosItem = posItemId
        ? (inventoryItems.find((i) => i.id === parseInt(posItemId))?.variants || []).filter((v) =>
            contractInventory.some(
                (ci) =>
                    ci.inventory_item_id === parseInt(posItemId) &&
                    ci.inventory_item_variant_id === v.id
            )
        )
        : [];

    const availablePalletsForPosVariant = (posItemId && posVariantId)
        ? contractInventory.filter(
            (ci) =>
                ci.inventory_item_id === parseInt(posItemId) &&
                ci.inventory_item_variant_id === parseInt(posVariantId)
        )
        : [];

    const selectedPalletObj = availablePalletsForPosVariant.find(
        (p) =>
            String(p.pallet?.pallet_number || p.pallet?.code || p.pallet_id) === String(posPalletNumber)
    );
    const selectedPalletMaxQty = selectedPalletObj ? parseFloat(selectedPalletObj.available_qty) : 0;

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

    // Handle adding items to list locally in Exit Authorization (Free Qty & Items Addition)
    const handleAddPOSRow = () => {
        setPosRowError("");

        if (!posItemId) {
            setPosRowError(__("exit_authorizations.createedit.select_inventory_item"));
            return;
        }
        if (!posVariantId) {
            setPosRowError(__("exit_authorizations.createedit.select_variant"));
            return;
        }

        const qty = parseFloat(posQuantity);
        if (isNaN(qty) || qty <= 0) {
            setPosRowError(
                __("exit_authorizations.createedit.quantity_must_be_greater_than")
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

        // Auto Focus back to POS Item select
        setTimeout(() => {
            if (itemSelectRef.current) {
                itemSelectRef.current.focus();
            }
        }, 50);
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
                        __("exit_authorizations.createedit.could_not_add_driver"),
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
                        {__("exit_authorizations.createedit.video")}
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
                        {__("exit_authorizations.createedit.audio")}
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
                    {__("exit_authorizations.createedit.download_request_proof")}
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
                {__("exit_authorizations.createedit.warehouse")}
            </span>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <Link
                href={route("exit-authorizations.index")}
                className="text-primary font-medium hover:underline"
            >
                {__("exit_authorizations.createedit.exit_authorizations")}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`}
            />
            <span className="text-primary font-medium">
                {isEdit
                    ? __("exit_authorizations.createedit.edit_permit")
                    : __("exit_authorizations.createedit.new_permit")}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    isEdit
                        ? __("exit_authorizations.createedit.edit_exit_permit")
                        : __("exit_authorizations.createedit.new_exit_permit")
                }
            />

            <div
                className="max-w-7xl mx-auto pb-8 main-stack-y"
                dir={__("exit_authorizations.createedit.ltr")}
            >
                <PageHeader
                    icon={FileCheck}
                    title={
                        isEdit
                            ? lang === "ar"
                                ? `تعديل إذن خروج: ${authorization.serial_number}`
                                : `Edit Permit: ${authorization.serial_number}`
                            : __("exit_authorizations.createedit.create_exit_authorization_perm")
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {__("exit_authorizations.createedit.fill_out_customer_and_contract")}
                        </p>
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Tooltip
                                text={
                                    __("exit_authorizations.createedit.save_issue_permit")
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
                                    __("exit_authorizations.createedit.discard")
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
                                    {__("exit_authorizations.createedit.permit_contract_info")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* 1. Serial Number */}
                                    <div>
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.permit_number")
                                            }
                                        />
                                        <TextInput
                                            type="text"
                                            className="mt-1 w-full text-xs rounded-none border-border bg-slate-50 text-slate-500 font-mono font-bold"
                                            value={
                                                authorization?.serial_number ||
                                                (__("exit_authorizations.createedit.auto_generated"))
                                            }
                                            disabled
                                            readOnly
                                        />
                                    </div>

                                    {/* 2. Contract SearchableSelect Field (Immediately after Serial Number) */}
                                    <div className="relative">
                                        <SearchableSelect
                                            label={
                                                __("exit_authorizations.createedit.approved_contract")
                                            }
                                            items={allContracts}
                                            value={data.contract_id}
                                            onChange={(selected) =>
                                                handleContractSelect(
                                                    selected ? selected.id : "",
                                                )
                                            }
                                            placeholder={
                                                __("exit_authorizations.createedit.type_contract_number_or_custom")
                                            }
                                            searchKeys={[
                                                "contract_number",
                                                "customer_name",
                                            ]}
                                            displayFormat={(c) =>
                                                `${c.contract_number} ${
                                                    c.customer_name
                                                        ? `(${c.customer_name})`
                                                        : ""
                                                }`
                                            }
                                            valueKey="id"
                                            error={errors.contract_id}
                                            disabled={isEdit}
                                        />
                                    </div>

                                    {/* 3. Customer SearchableSelect Field */}
                                    <div className="relative">
                                        <SearchableSelect
                                            label={
                                                __("exit_authorizations.createedit.customer")
                                            }
                                            items={customers}
                                            value={data.customer_id}
                                            onChange={(selected) => {
                                                const custId = selected
                                                    ? selected.id
                                                    : "";
                                                setData("customer_id", custId);
                                                if (!selected) {
                                                    handleContractSelect("");
                                                }
                                            }}
                                            placeholder={
                                                __("exit_authorizations.createedit.type_customer_name")
                                            }
                                            searchKeys={["name"]}
                                            displayFormat={(c) => c.name}
                                            valueKey="id"
                                            error={errors.customer_id}
                                            disabled={isEdit}
                                        />
                                    </div>

                                    {/* Storage Period */}
                                    <div>
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.active_storage_period")
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
                                                {__("exit_authorizations.createedit.select_period")}
                                            </option>
                                            {availablePeriods.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {__("exit_authorizations.createedit.period")}{" "}
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
                                    {__("exit_authorizations.createedit.exit_order_authorization_det")}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                    {/* Requester Type */}
                                    <div>
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.requester_type")
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
                                                {__("exit_authorizations.createedit.whatsapp_message_text_voice")}
                                            </option>
                                            <option value="written">
                                                {__("exit_authorizations.createedit.written_official_exit_order")}
                                            </option>
                                            <option value="personal">
                                                {__("exit_authorizations.createedit.personal_responsibility_face_t")}
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
                                                __("exit_authorizations.createedit.attach_request_proof")
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
                                                        {__("exit_authorizations.createedit.current_request_attachment")}
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
                                        {__("exit_authorizations.createedit.exit_authorization_validity")}
                                    </div>
                                    {isEdit && authorizationExpiryDate ? (
                                        <div className="space-y-1">
                                            <div>
                                                {__("exit_authorizations.createedit.created_at")}{" "}
                                                <span className="font-semibold text-text">
                                                    {authorizationCreatedAt?.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                {__("exit_authorizations.createedit.expiry_date")}{" "}
                                                <span className="font-semibold text-text">
                                                    {authorizationExpiryDate?.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div>
                                                {authorizationIsExpired
                                                    ? __("exit_authorizations.createedit.this_authorization_has_expired")
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
                                    {__("exit_authorizations.createedit.recipient_information_deliver")}
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
                                            {__("exit_authorizations.createedit.deliver_goods_directly_to_the")}
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
                                                        __("exit_authorizations.createedit.carrier_driver")
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
                                                    {__("exit_authorizations.createedit.add_driver")}
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
                                                    {__("exit_authorizations.createedit.select_carrier_driver")}
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
                                                    __("exit_authorizations.createedit.authorized_representative")
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
                                                    {__("exit_authorizations.createedit.select_authorized_rep")}
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
                                        __("exit_authorizations.createedit.exit_directives_remarks")
                                    }
                                />
                                <textarea
                                    rows="3"
                                    className="w-full text-xs rounded-none border-border mt-1 bg-surface text-text focus:border-primary focus:ring-primary p-2.5"
                                    placeholder={
                                        __("exit_authorizations.createedit.write_any_remarks_for_the_stor")
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
                                    {__("exit_authorizations.createedit.quick_pos_item_entry_bar")}
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    {/* Inventory Item */}
                                    <div className="sm:col-span-3">
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.contract_item")
                                            }
                                        />
                                        <select
                                            ref={itemSelectRef}
                                            className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                            value={posItemId}
                                            onChange={(e) => {
                                                setPosItemId(e.target.value);
                                                setPosVariantId("");
                                                setPosPalletNumber("");
                                            }}
                                            disabled={!data.contract_id}
                                        >
                                            <option value="">
                                                {__("exit_authorizations.createedit.select_item")}
                                            </option>
                                            {availableItemsForContract.map((inv) => (
                                                <option
                                                    key={inv.id}
                                                    value={inv.id}
                                                >
                                                    {inv.name} ({inv.code || inv.id})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Item Variant */}
                                    <div className="sm:col-span-3">
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.variant_grade")
                                            }
                                        />
                                        <select
                                            className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                            value={posVariantId}
                                            onChange={(e) => {
                                                setPosVariantId(e.target.value);
                                                setPosPalletNumber("");
                                            }}
                                            disabled={!posItemId}
                                        >
                                            <option value="">
                                                {__("exit_authorizations.createedit.select_grade")}
                                            </option>
                                            {availableVariantsForPosItem.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.name}{" "}
                                                    {v.quality
                                                        ? `(${v.quality})`
                                                        : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Pallet Select */}
                                    <div className="sm:col-span-3">
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.available_pallet")
                                            }
                                        />
                                        <select
                                            className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold text-primary focus:border-primary focus:ring-primary rounded-none h-[38px] px-2"
                                            value={posPalletNumber}
                                            onChange={(e) => setPosPalletNumber(e.target.value)}
                                            disabled={!posVariantId}
                                        >
                                            <option value="">
                                                {__("exit_authorizations.createedit.select_pallet")}
                                            </option>
                                            {availablePalletsForPosVariant.map((p, idx) => {
                                                const pNum = p.pallet?.pallet_number || p.pallet?.code || p.pallet_id;
                                                return (
                                                    <option key={idx} value={pNum}>
                                                        {lang === "ar" ? `طبلية #${pNum}` : `Pallet #${pNum}`} (المتاح: {p.available_qty})
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>

                                    {/* Quantity input */}
                                    <div className="sm:col-span-3">
                                        <div className="flex justify-between items-center">
                                            <InputLabel
                                                value={
                                                    __("exit_authorizations.createedit.quantity")
                                                }
                                            />
                                            {selectedPalletObj && (
                                                <span className="text-[10px] text-emerald-700 font-extrabold">
                                                    المتاح: {selectedPalletMaxQty}
                                                </span>
                                            )}
                                        </div>
                                        <TextInput
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={selectedPalletMaxQty || undefined}
                                            className="w-full text-xs rounded-none border-border mt-1 h-[38px] px-2 font-mono font-bold"
                                            placeholder="0.00"
                                            value={posQuantity}
                                            onChange={(e) => setPosQuantity(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleAddPOSRow();
                                                }
                                            }}
                                            disabled={!posPalletNumber}
                                        />
                                    </div>

                                    {/* Quantity input */}
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            value={
                                                __("exit_authorizations.createedit.quantity")
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
                                            {__("exit_authorizations.createedit.insert")}
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
                                    {__("exit_authorizations.createedit.authorized_items_list")}
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
                                                    {__("exit_authorizations.createedit.inventory_item")}
                                                </th>
                                                <th className="px-3 py-2 text-start">
                                                    {__("exit_authorizations.createedit.variant")}
                                                </th>
                                                <th className="px-3 py-2 text-start">
                                                    {__("exit_authorizations.createedit.pallet_number")}
                                                </th>
                                                <th className="px-3 py-2 text-end text-danger">
                                                    {__("exit_authorizations.createedit.authorized_qty")}
                                                </th>
                                                <th className="px-3 py-2 text-center w-16">
                                                    {__("exit_authorizations.createedit.action")}
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
                                                        {__("exit_authorizations.createedit.no_exit_items_added_yet_use_t")}
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
                                                        {__("exit_authorizations.createedit.total_quantity")}
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
                                        {__("exit_authorizations.createedit.contract_occupancy")}
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
                                            {__("exit_authorizations.createedit.loading_stats")}
                                        </p>
                                    ) : contractStats ? (
                                        <>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {__("exit_authorizations.createedit.booked_pallets")}
                                                </span>
                                                <span className="font-bold font-mono text-primary">
                                                    {contractStats.booked_pallets ||
                                                        "0"}{" "}
                                                    {__("exit_authorizations.createedit.pallets")}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {__("exit_authorizations.createedit.utilized_pallets")}
                                                </span>
                                                <span className="font-bold font-mono text-amber-600">
                                                    {contractStats.utilized_pallets ||
                                                        "0"}{" "}
                                                    {__("exit_authorizations.createedit.pallets")}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {__("exit_authorizations.createedit.available_pallets")}
                                                </span>
                                                <span
                                                    className={`font-bold font-mono ${contractStats.available_pallets > 0 ? "text-emerald-600" : "text-danger"}`}
                                                >
                                                    {contractStats.available_pallets ||
                                                        "0"}{" "}
                                                    {__("exit_authorizations.createedit.pallets")}
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                <span className="text-text-muted">
                                                    {__("exit_authorizations.createedit.expiry_date")}
                                                </span>
                                                <span className="font-bold font-mono">
                                                    {contractStats.end_date
                                                        ? new Date(
                                                              contractStats.end_date,
                                                          ).toLocaleDateString(
                                                              __("exit_authorizations.createedit.en_us"),
                                                          )
                                                        : "—"}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="text-text-muted italic">
                                            {__("exit_authorizations.createedit.please_select_contract_to_load")}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Financial stats card (Permission Required: see-client-financial-state) */}
                        {canSeeFinancialState && (
                            <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                                <div className="flex items-center justify-between border-b border-border pb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                            {__("exit_authorizations.createedit.financial_status")}
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
                                                {__("exit_authorizations.createedit.loading_financials")}
                                            </p>
                                        ) : contractStats?.financial ? (
                                            <>
                                                <div className="grid grid-cols-1 gap-2 bg-slate-50 border border-border p-3">
                                                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                        <span className="text-text-muted font-medium">
                                                            {__("exit_authorizations.createedit.total_invoiced")}
                                                        </span>
                                                        <span className="font-bold font-mono text-text text-sm">
                                                            {parseFloat(
                                                                contractStats
                                                                    .financial
                                                                    .total_invoiced,
                                                            ).toLocaleString()}{" "}
                                                            {__("exit_authorizations.createedit.sar")}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                                                        <span className="text-text-muted font-medium">
                                                            {__("exit_authorizations.createedit.total_paid")}
                                                        </span>
                                                        <span className="font-bold font-mono text-emerald-600 text-sm">
                                                            {parseFloat(
                                                                contractStats
                                                                    .financial
                                                                    .total_paid,
                                                            ).toLocaleString()}{" "}
                                                            {__("exit_authorizations.createedit.sar")}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-0.5">
                                                        <span className="text-text-muted font-bold">
                                                            {__("exit_authorizations.createedit.remaining_dues")}
                                                        </span>
                                                        <span
                                                            className={`font-black font-mono text-sm ${contractStats.financial.total_dues > 0 ? "text-danger" : "text-emerald-600"}`}
                                                        >
                                                            {parseFloat(
                                                                contractStats
                                                                    .financial
                                                                    .total_dues,
                                                            ).toLocaleString()}{" "}
                                                            {__("exit_authorizations.createedit.sar")}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Invoices List */}
                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-text-muted border-b border-border pb-1">
                                                        {__("exit_authorizations.createedit.contract_invoices")}
                                                    </h4>
                                                    {contractStats.financial
                                                        .invoices?.length === 0 ? (
                                                        <p className="text-text-muted italic">
                                                            {__("exit_authorizations.createedit.no_invoices_recorded")}
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
                                                                                    ? __("exit_authorizations.createedit.paid")
                                                                                    : inv.status ===
                                                                                        "partial"
                                                                                      ? __("exit_authorizations.createedit.partial")
                                                                                      : __("exit_authorizations.createedit.unpaid")}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between text-text-muted">
                                                                            <span>
                                                                                {__("exit_authorizations.createedit.amount")}
                                                                            </span>
                                                                            <span className="font-bold font-mono">
                                                                                {inv.amount.toLocaleString()}{" "}
                                                                                {__("exit_authorizations.createedit.sar")}
                                                                            </span>
                                                                        </div>
                                                                        {inv.due_date && (
                                                                            <div className="flex justify-between text-[9px] text-text-muted">
                                                                                <span>
                                                                                    {__("exit_authorizations.createedit.due_date")}
                                                                                </span>
                                                                                <span className="font-mono">
                                                                                    {new Date(
                                                                                        inv.due_date,
                                                                                    ).toLocaleDateString(
                                                                                        __("exit_authorizations.createedit.en_us"),
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
                                                {__("exit_authorizations.createedit.please_select_contract_to_load")}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
                    dir={__("exit_authorizations.createedit.ltr")}
                >
                    <h3 className="text-sm font-bold text-primary mb-4">
                        {__("exit_authorizations.createedit.add_quick_carrier_driver")}
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
                                        __("exit_authorizations.createedit.driver_name")
                                    }
                                />
                                <TextInput
                                    type="text"
                                    className="w-full text-xs mt-1"
                                    placeholder={
                                        __("exit_authorizations.createedit.driver_full_name")
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
                                        __("exit_authorizations.createedit.phone_number")
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
                                        __("exit_authorizations.createedit.vehicle_plate")
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
                                        __("exit_authorizations.createedit.vehicle_type")
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
                                {__("exit_authorizations.createedit.cancel")}
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={addingDriver}
                            >
                                {addingDriver
                                    ? __("exit_authorizations.createedit.adding")
                                    : __("exit_authorizations.createedit.save_driver")}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
