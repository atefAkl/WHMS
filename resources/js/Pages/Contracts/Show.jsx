import React, { useState, useEffect } from "react";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useLang } from "@/Contexts/LanguageContext";
import {
    FileText,
    Calendar,
    Users,
    Box,
    CreditCard,
    Check,
    ChevronRight,
    User,
    Building2,
    Download,
    Printer,
    Play,
    Pause,
    XCircle,
    Trash2,
    Edit3,
    Plus,
    AlertCircle,
    Clock,
    ShieldAlert,
    FileSpreadsheet,
    Layers,
    Package,
    CheckCircle2,
    Ban,
    DollarSign,
    ArrowUp,
    ArrowDown,
    Grid,
    List,
    Lock,
    Unlock,
    Search,
    Filter,
    Eye,
    RefreshCw,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import { useSecureDelete } from "@/Hooks/useSecureDelete";
import InputError from "@/Components/InputError";
import Tooltip from "@/Components/Tooltip";
import TabBar from "@/Components/TabBar";

const SectionCard = ({ title, icon: Icon, children, action }) => (
    <div className="flex flex-col space-y-3 mb-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div className="flex items-center gap-1.5">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-text">{title}</h2>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div className="flex-1 flex flex-col">{children}</div>
    </div>
);

const Field = ({ label, value, dir }) => (
    <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0">
            {label}
        </p>
        <p
            className={`text-xs font-bold text-text ${dir === "ltr" ? "font-mono" : ""}`}
            dir={dir}
        >
            {value || "�"}
        </p>
    </div>
);

export default function Show({
    contract,
    settings,
    storageItems = [],
    allTerms = [],
    translations,
    tableColumns = [],
    accounts = [],
}) {
    const { lang } = useLang();
    const displayBilingual = (rawName) => {
        if (!rawName) return "";
        const chunks = rawName
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean);
        if (chunks.length === 0) return rawName;
        return lang === "ar" ? chunks[0] : chunks[1] || chunks[0];
    };
    const [activeTab, setActiveTab] = useState("view");
    const { auth } = usePage().props;
    const showButtonText = auth?.user?.preferences?.show_button_text ?? false;

    const {
        itemToDelete, deletePassword, setDeletePassword, deleteError, processing: deleteProcessing,
        requestDelete, confirmDelete, cancelDelete
    } = useSecureDelete();

    // Vouchers Tab states
    const [vouchers, setVouchers] = useState([]);
    const [vouchersTotal, setVouchersTotal] = useState(0);
    const [vouchersPage, setVouchersPage] = useState(1);
    const [vouchersLastPage, setVouchersLastPage] = useState(1);
    const [vouchersLoading, setVouchersLoading] = useState(false);
    const [vouchersGoodsTypes, setVouchersGoodsTypes] = useState([]);

    // Pallets Tab states
    const [pallets, setPallets] = useState([]);
    const [palletsTotal, setPalletsTotal] = useState(0);
    const [palletsPage, setPalletsPage] = useState(1);
    const [palletsLastPage, setPalletsLastPage] = useState(1);
    const [palletsLoading, setPalletsLoading] = useState(false);
    const [palletsSizes, setPalletsSizes] = useState([]);
    const [palletsItems, setPalletsItems] = useState([]);
    const [filterPalletSearch, setFilterPalletSearch] = useState("");
    const [filterPalletSize, setFilterPalletSize] = useState("");
    const [filterPalletItemId, setFilterPalletItemId] = useState("");
    const [palletViewMode, setPalletViewMode] = useState("grid");

    // Stored Items Tab states
    const [storedItems, setStoredItems] = useState([]);
    const [storedItemsTotal, setStoredItemsTotal] = useState(0);
    const [storedItemsPage, setStoredItemsPage] = useState(1);
    const [storedItemsLastPage, setStoredItemsLastPage] = useState(1);
    const [storedItemsLoading, setStoredItemsLoading] = useState(false);
    const [filterItemSearch, setFilterItemSearch] = useState("");
    const [itemViewMode, setItemViewMode] = useState("list");

    // Movement Detail Modal states
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [movementData, setMovementData] = useState(null);
    const [movementLoading, setMovementLoading] = useState(false);
    const [movementType, setMovementType] = useState(""); // "item" or "pallet"

    // Fetch Pallets function
    const fetchPallets = () => {
        if (activeTab !== "pallets") return;
        setPalletsLoading(true);
        axios
            .get(route("contracts.pallets", contract.id), {
                params: {
                    page: palletsPage,
                    search: filterPalletSearch,
                    size: filterPalletSize,
                    item_id: filterPalletItemId,
                },
            })
            .then((response) => {
                setPallets(response.data.pallets);
                setPalletsTotal(response.data.total);
                setPalletsLastPage(response.data.last_page);
                setPalletsSizes(response.data.sizes || []);
                setPalletsItems(response.data.items || []);
                setPalletsLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching pallets:", err);
                setPalletsLoading(false);
            });
    };

    // Fetch Stored Items function
    const fetchStoredItems = () => {
        if (activeTab !== "items") return;
        setStoredItemsLoading(true);
        axios
            .get(route("contracts.stored-items", contract.id), {
                params: {
                    page: storedItemsPage,
                    search: filterItemSearch,
                },
            })
            .then((response) => {
                setStoredItems(response.data.items);
                setStoredItemsTotal(response.data.total);
                setStoredItemsLastPage(response.data.last_page);
                setStoredItemsLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching stored items:", err);
                setStoredItemsLoading(false);
            });
    };

    // Fetch Item Movement History
    const fetchItemMovements = (itemId, variantId) => {
        setMovementType("item");
        setMovementLoading(true);
        setMovementData(null);
        setShowMovementModal(true);
        axios
            .get(route("contracts.item-movements", contract.id), {
                params: { item_id: itemId, variant_id: variantId },
            })
            .then((response) => {
                setMovementData(response.data);
                setMovementLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching item movements:", err);
                setMovementLoading(false);
            });
    };

    // Fetch Pallet Movement History
    const fetchPalletMovements = (palletId) => {
        setMovementType("pallet");
        setMovementLoading(true);
        setMovementData(null);
        setShowMovementModal(true);
        axios
            .get(route("contracts.pallet-movements", contract.id), {
                params: { pallet_id: palletId },
            })
            .then((response) => {
                setMovementData(response.data);
                setMovementLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching pallet movements:", err);
                setMovementLoading(false);
            });
    };

    // Trigger Pallets fetch
    useEffect(() => {
        if (activeTab === "pallets") {
            fetchPallets();
        }
    }, [
        activeTab,
        palletsPage,
        filterPalletSearch,
        filterPalletSize,
        filterPalletItemId,
    ]);

    // Reset Pallets page on filter change
    useEffect(() => {
        setPalletsPage(1);
    }, [filterPalletSearch, filterPalletSize, filterPalletItemId]);

    // Trigger Stored Items fetch
    useEffect(() => {
        if (activeTab === "items") {
            fetchStoredItems();
        }
    }, [activeTab, storedItemsPage, filterItemSearch]);

    // Reset Stored Items page on filter change
    useEffect(() => {
        setStoredItemsPage(1);
    }, [filterItemSearch]);

    // Filters state
    const [filterSerial, setFilterSerial] = useState("");
    const [filterPallet, setFilterPallet] = useState("");
    const [filterPeriodId, setFilterPeriodId] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterType, setFilterType] = useState("");
    const [filterGoodsType, setFilterGoodsType] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");

    // Selection
    const [selectedVouchers, setSelectedVouchers] = useState([]); // Array of { id, type }

    // View Mode
    const [viewMode, setViewMode] = useState("grid"); // grid vs list

    // Bulk Modals
    const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
    const [showBulkReopenModal, setShowBulkReopenModal] = useState(false);
    const [bulkPassword, setBulkPassword] = useState("");
    const [bulkReopenReason, setBulkReopenReason] = useState("");
    const [bulkActionProcessing, setBulkActionProcessing] = useState(false);
    const [bulkError, setBulkError] = useState("");

    // Fetch Vouchers function
    const fetchVouchers = () => {
        if (activeTab !== "vouchers") return;
        setVouchersLoading(true);
        axios
            .get(route("contracts.vouchers", contract.id), {
                params: {
                    page: vouchersPage,
                    search_serial: filterSerial,
                    search_pallet: filterPallet,
                    period_id: filterPeriodId,
                    status: filterStatus,
                    type: filterType,
                    goods_type: filterGoodsType,
                    start_date: filterStartDate,
                    end_date: filterEndDate,
                },
            })
            .then((response) => {
                setVouchers(response.data.vouchers);
                setVouchersTotal(response.data.total);
                setVouchersLastPage(response.data.last_page);
                setVouchersGoodsTypes(response.data.goods_types || []);
                setVouchersLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching vouchers:", err);
                setVouchersLoading(false);
            });
    };

    // Trigger fetch on tab or filter change
    useEffect(() => {
        if (activeTab === "vouchers") {
            fetchVouchers();
        }
    }, [
        activeTab,
        vouchersPage,
        filterSerial,
        filterPallet,
        filterPeriodId,
        filterStatus,
        filterType,
        filterGoodsType,
        filterStartDate,
        filterEndDate,
    ]);

    // Reset pagination when filters change
    useEffect(() => {
        setVouchersPage(1);
    }, [
        filterSerial,
        filterPallet,
        filterPeriodId,
        filterStatus,
        filterType,
        filterGoodsType,
        filterStartDate,
        filterEndDate,
    ]);

    // Selection handlers
    const handleSelectVoucher = (id, type, checked) => {
        if (checked) {
            setSelectedVouchers((prev) => [...prev, { id, type }]);
        } else {
            setSelectedVouchers((prev) =>
                prev.filter((item) => !(item.id === id && item.type === type)),
            );
        }
    };

    const isVoucherSelected = (id, type) => {
        return selectedVouchers.some(
            (item) => item.id === id && item.type === type,
        );
    };

    const handleSelectAll = () => {
        const pageItems = vouchers.map((v) => ({
            id: v.id,
            type: v.voucher_type,
        }));
        setSelectedVouchers((prev) => {
            const otherItems = prev.filter(
                (item) =>
                    !vouchers.some(
                        (v) => v.id === item.id && v.voucher_type === item.type,
                    ),
            );
            return [...otherItems, ...pageItems];
        });
    };

    const handleDeselectAll = () => {
        setSelectedVouchers((prev) =>
            prev.filter(
                (item) =>
                    !vouchers.some(
                        (v) => v.id === item.id && v.voucher_type === item.type,
                    ),
            ),
        );
    };

    const handleInvertSelection = () => {
        setSelectedVouchers((prev) => {
            const pageSelected = prev.filter((item) =>
                vouchers.some(
                    (v) => v.id === item.id && v.voucher_type === item.type,
                ),
            );
            const pageNotSelected = vouchers
                .filter(
                    (v) =>
                        !pageSelected.some(
                            (item) =>
                                item.id === v.id &&
                                item.type === v.voucher_type,
                        ),
                )
                .map((v) => ({ id: v.id, type: v.voucher_type }));
            const otherItems = prev.filter(
                (item) =>
                    !vouchers.some(
                        (v) => v.id === item.id && v.voucher_type === item.type,
                    ),
            );
            return [...otherItems, ...pageNotSelected];
        });
    };

    // Bulk actions
    const handleBulkApprove = () => {
        if (selectedVouchers.length === 0) return;
        setBulkActionProcessing(true);
        setBulkError("");
        axios
            .post(route("contracts.vouchers.bulk-approve", contract.id), {
                password: bulkPassword,
                ids: selectedVouchers,
            })
            .then((response) => {
                setBulkActionProcessing(false);
                setShowBulkApproveModal(false);
                setBulkPassword("");
                setSelectedVouchers([]);
                fetchVouchers();
                router.reload({ only: ["contract"] });
            })
            .catch((err) => {
                setBulkActionProcessing(false);
                setBulkError(
                    err.response?.data?.error ||
                        "Error processing bulk approve",
                );
            });
    };

    const handleBulkReopen = () => {
        if (selectedVouchers.length === 0) return;
        setBulkActionProcessing(true);
        setBulkError("");
        axios
            .post(route("contracts.vouchers.bulk-reopen", contract.id), {
                password: bulkPassword,
                reason: bulkReopenReason,
                ids: selectedVouchers,
            })
            .then((response) => {
                setBulkActionProcessing(false);
                setShowBulkReopenModal(false);
                setBulkPassword("");
                setBulkReopenReason("");
                setSelectedVouchers([]);
                fetchVouchers();
                router.reload({ only: ["contract"] });
            })
            .catch((err) => {
                setBulkActionProcessing(false);
                setBulkError(
                    err.response?.data?.error || "Error processing bulk reopen",
                );
            });
    };

    const handleBulkPrint = () => {
        if (selectedVouchers.length === 0) return;
        const idsString = selectedVouchers
            .map((item) => `${item.type}-${item.id}`)
            .join(",");
        const printUrl =
            route("contracts.vouchers.bulk-print", contract.id) +
            `?ids=${idsString}`;
        window.open(printUrl, "_blank");
    };

    // Deep link tab handler
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        const periodId = params.get("period_id");
        if (tab && tabs.some((t) => t.id === tab)) {
            setActiveTab(tab);
        }
        if (periodId) {
            setFilterPeriodId(periodId);
        }
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (activeTab === "view") {
            params.delete("tab");
        } else {
            params.set("tab", activeTab);
        }
        if (
            filterPeriodId &&
            (activeTab === "financials" || activeTab === "vouchers")
        ) {
            params.set("period_id", filterPeriodId);
        } else {
            params.delete("period_id");
        }
        const newUrl = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
    }, [activeTab, filterPeriodId]);

    const isBlockEnabled = (key) => {
        if (!contract.blocks || contract.blocks.length === 0) return true;
        const block = contract.blocks.find((b) => b.key === key);
        return block ? block.is_enabled : true;
    };

    const getBlockText = (key) => {
        const block = contract.blocks?.find((b) => b.key === key);
        return block?.content?.text;
    };

    const replaceVariables = (text) => {
        if (!text) return "";
        let result = text;
        const vars = {
            "{$company_name}": settings?.company_name || "",
            "{$company_slogan}": settings?.company_slogan || "",
            "{$company_cr}": settings?.company_cr || "",
            "{$company_vat}": settings?.company_vat || "",
            "{$company_license}": settings?.company_license || "",
            "{$company_phone}": settings?.company_phone || "",
            "{$company_email}": settings?.company_email || "",
            "{$company_address}": settings?.company_address || "",
            "{$company_gm}": settings?.company_gm || "",
            "{$company_dgm}": settings?.company_dgm || "",
            "{$customer_name}": contract?.customer?.name || "",
            "{$customer_phone}": contract?.customer?.phone_number || "",
            "{$customer_cr}": contract?.customer?.cr_number || "",
            "{$customer_id}": contract?.customer?.id_number || "",
            "{$contract_number}": contract?.contract_number || "",
            "{$start_date}": contract?.start_date || "",
            "{$end_date}": contract?.end_date || "",
            "{$mandatory_period}": contract?.mandatory_period || "",
            "{$renew_period}": contract?.renewal_period || "",
            "{$write_date}": contract?.write_date || "",
            "{$write_date_hijri}": contract?.write_date_hijri || "",
            "{$start_date_hijri}": contract?.start_date_hijri || "",
            "{$terms_count}": contract?.terms?.length || 0,
        };
        Object.entries(vars).forEach(([key, val]) => {
            result = result.replaceAll(key, val);
        });
        return result;
    };

    const renderUnifiedLayout = (isPrint = false) => {
        const headerDesign = settings?.header_design_id || "1";
        const footerDesign = settings?.footer_design_id || "1";
        const templateText =
            contract?.contract_type === "free"
                ? settings?.free_unified_contract_template ||
                  settings?.unified_contract_template ||
                  ""
                : settings?.managed_unified_contract_template ||
                  settings?.unified_contract_template ||
                  "";

        const showContractSerial =
            settings?.show_contract_serial === "1" ||
            settings?.show_contract_serial === true;
        const showCustomerSerial =
            settings?.show_customer_serial === "1" ||
            settings?.show_customer_serial === true;
        const showCertificateNumber =
            settings?.show_certificate_number === "1" ||
            settings?.show_certificate_number === true;
        const showQualityData =
            settings?.show_quality_data === "1" ||
            settings?.show_quality_data === true;

        const logoSrc = settings?.company_logo
            ? settings.company_logo.startsWith("http") ||
              settings.company_logo.startsWith("/")
                ? settings.company_logo
                : "/storage/" + settings.company_logo
            : null;

        const showItem =
            settings?.table_show_item === "1" ||
            settings?.table_show_item === true ||
            settings?.table_show_item === undefined;
        const showQty =
            settings?.table_show_qty === "1" ||
            settings?.table_show_qty === true ||
            settings?.table_show_qty === undefined;
        const showRent =
            settings?.table_show_rent === "1" ||
            settings?.table_show_rent === true ||
            settings?.table_show_rent === undefined;
        const showDiscount =
            settings?.table_show_discount === "1" ||
            settings?.table_show_discount === true ||
            settings?.table_show_discount === undefined;
        const showTotal =
            settings?.table_show_total === "1" ||
            settings?.table_show_total === true ||
            settings?.table_show_total === undefined;

        const getColTitle = (code, fallbackAr, fallbackEn) => {
            const col = (tableColumns || []).find((c) => c.code === code);
            if (col) return lang === "ar" ? col.label_ar : col.label_en;
            return lang === "ar" ? fallbackAr : fallbackEn;
        };

        const activeColsCount = [
            showItem,
            showQty,
            showRent,
            showDiscount,
        ].filter(Boolean).length;

        // Table Html
        const tableHtml = (
            <div className="my-6 space-y-2 text-start">
                <h3 className="font-bold text-xs text-black uppercase tracking-wider mb-2">
                    {t("show.storage_table")}
                </h3>
                <table className="w-full text-xs text-start border-collapse border border-black">
                    <thead className="bg-gray-100 text-black uppercase font-bold">
                        <tr>
                            {showItem && (
                                <th className="border border-black px-3 py-2 text-start">
                                    {getColTitle(
                                        "item_name",
                                        "الصنف والمستودع",
                                        "Item & Warehouse",
                                    )}
                                </th>
                            )}
                            {showQty && (
                                <th className="border border-black px-3 py-2 text-center w-16">
                                    {getColTitle("qty", "الكمية", "Qty")}
                                </th>
                            )}
                            {showRent && (
                                <th className="border border-black px-3 py-2 text-center w-28">
                                    {getColTitle(
                                        "rent",
                                        "الإيجار الشهري",
                                        "Monthly Rent",
                                    )}
                                </th>
                            )}
                            {showDiscount && (
                                <th className="border border-black px-3 py-2 text-center w-24">
                                    {getColTitle(
                                        "discount",
                                        "الخصم",
                                        "Discount",
                                    )}
                                </th>
                            )}
                            {showTotal && (
                                <th className="border border-black px-3 py-2 text-end w-32">
                                    {getColTitle(
                                        "total",
                                        "الإجمالي شامل الضريبة",
                                        "Total with VAT",
                                    )}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-300">
                        {contract.items?.map((item) => (
                            <tr key={item.id}>
                                {showItem && (
                                    <td className="border border-black px-3 py-2 font-bold text-start">
                                        {lang === "ar"
                                            ? item.storage_item?.name_ar
                                            : item.storage_item?.name_en ||
                                              item.storage_item?.name_ar}
                                    </td>
                                )}
                                {showQty && (
                                    <td className="border border-black px-3 py-2 text-center font-mono">
                                        {item.unit_count}
                                    </td>
                                )}
                                {showRent && (
                                    <td
                                        className="border border-black px-3 py-2 text-center font-mono"
                                        dir="ltr"
                                    >
                                        {item.monthly_rent}
                                    </td>
                                )}
                                {showDiscount && (
                                    <td
                                        className="border border-black px-3 py-2 text-center font-mono text-red-700"
                                        dir="ltr"
                                    >
                                        {item.discount > 0
                                            ? `-${item.discount}`
                                            : "0"}
                                    </td>
                                )}
                                {showTotal && (
                                    <td
                                        className="border border-black px-3 py-2 text-end font-mono font-bold"
                                        dir="ltr"
                                    >
                                        {item.subtotal}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                        <tr>
                            <td
                                colSpan={activeColsCount}
                                className="border border-black px-3 py-2 text-end uppercase"
                            >
                                {t("show.grand_total")}
                            </td>
                            {showTotal && (
                                <td
                                    className="border border-black px-3 py-2 text-end font-mono text-sm"
                                    dir="ltr"
                                >
                                    {contract.items
                                        ?.reduce(
                                            (sum, item) =>
                                                sum + parseFloat(item.subtotal),
                                            0,
                                        )
                                        .toFixed(2)}
                                </td>
                            )}
                        </tr>
                    </tfoot>
                </table>
            </div>
        );

        // Body text replacement
        const evaluatedText = replaceVariables(templateText);

        let parsedContent;
        if (evaluatedText.includes("[ITEMS_TABLE]")) {
            const parts = evaluatedText.split("[ITEMS_TABLE]");
            parsedContent = (
                <div className="text-start whitespace-pre-line leading-relaxed text-black">
                    <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
                    {tableHtml}
                    <div dangerouslySetInnerHTML={{ __html: parts[1] }} />
                </div>
            );
        } else {
            parsedContent = (
                <div className="space-y-4">
                    <div
                        className="text-start whitespace-pre-line leading-relaxed text-black"
                        dangerouslySetInnerHTML={{ __html: evaluatedText }}
                    />
                    {tableHtml}
                </div>
            );
        }

        return (
            <div
                className={`w-full bg-white text-black font-sans text-start ${isPrint ? "" : "p-8 border border-zinc-200 shadow-sm max-w-4xl mx-auto rounded-xl"}`}
            >
                {/* ──────── RENDER HEADER DESIGN (1-5) ──────── */}
                {headerDesign === "1" && (
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                        <div className="space-y-1 text-start text-xs text-zinc-700">
                            <h2 className="text-base font-extrabold text-black">
                                {settings?.company_name}
                            </h2>
                            <p className="text-[10px] font-bold">
                                {settings?.company_slogan}
                            </p>
                            <p>
                                {t("show.cr_short")} {settings?.company_cr}
                            </p>
                            <p>
                                {t("show.vat_short")} {settings?.company_vat}
                            </p>
                            <p>
                                {t("show.license")} {settings?.company_license}
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-2">
                            <div className="border border-black px-4 py-1.5 rounded font-extrabold text-sm uppercase bg-zinc-50 text-black">
                                {contract.contract_title ||
                                    t("show.contract_title")}
                            </div>
                            {showContractSerial && (
                                <div className="mt-1 text-xs font-mono font-bold text-black">
                                    {t("show.contract_no")}{" "}
                                    {contract.contract_number}
                                </div>
                            )}
                            {showCustomerSerial && (
                                <div className="text-xs font-mono text-zinc-700">
                                    {t("show.cr_id")}{" "}
                                    {contract.customer?.cr_number ||
                                        contract.customer?.id_number ||
                                        "—"}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    className="h-12 w-auto object-contain"
                                />
                            ) : (
                                <div className="h-12 w-12 border border-zinc-300 rounded bg-zinc-50 flex items-center justify-center text-[10px] font-bold">
                                    شعار
                                </div>
                            )}
                            {showQualityData && settings?.quality_issue_no && (
                                <div className="text-[10px] font-mono text-zinc-500 border border-zinc-200 p-1">
                                    Rev: {settings.quality_issue_no}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {headerDesign === "2" && (
                    <div className="flex flex-col items-center border-b border-black pb-4 mb-6 text-center">
                        {logoSrc ? (
                            <img
                                src={logoSrc}
                                alt="Logo"
                                className="h-12 w-auto object-contain mb-2"
                            />
                        ) : (
                            <div className="h-12 w-12 border border-zinc-300 rounded bg-zinc-50 flex items-center justify-center text-[10px] font-bold mb-2">
                                شعار
                            </div>
                        )}
                        <h2 className="text-base font-extrabold text-black">
                            {settings?.company_name}
                        </h2>
                        <p className="text-xs text-zinc-600 font-bold mb-2">
                            {settings?.company_slogan}
                        </p>
                        <div className="flex gap-4 text-xs font-mono text-zinc-700 bg-zinc-50 border border-zinc-200 px-4 py-1.5 rounded">
                            <span>
                                {t("show.cr_short")} {settings?.company_cr}
                            </span>
                            <span>•</span>
                            <span>
                                {t("show.vat_short")} {settings?.company_vat}
                            </span>
                            <span>•</span>
                            <span>
                                {t("show.license")} {settings?.company_license}
                            </span>
                        </div>
                        <div className="border-t border-zinc-200 mt-3 pt-3 w-full flex justify-between text-xs font-mono">
                            {showContractSerial && (
                                <span>
                                    {t("show.contract_no")}{" "}
                                    {contract.contract_number}
                                </span>
                            )}
                            <span className="font-extrabold text-black">
                                {contract.contract_title ||
                                    t("show.contract_title")}
                            </span>
                            {showCustomerSerial && (
                                <span>
                                    {t("show.cr_id")}{" "}
                                    {contract.customer?.cr_number ||
                                        contract.customer?.id_number ||
                                        "—"}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {headerDesign === "3" && (
                    <div className="border-b-2 border-black pb-3 mb-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-base font-extrabold text-black">
                                {settings?.company_name}
                            </h2>
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain"
                                />
                            ) : (
                                <div className="h-10 w-10 border border-zinc-300 rounded bg-zinc-50 flex items-center justify-center text-[10px]">
                                    شعار
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-zinc-600 mt-1 font-mono">
                            <span>
                                {t("show.cr_short")} {settings?.company_cr}
                            </span>
                            |
                            <span>
                                {t("show.vat_short")} {settings?.company_vat}
                            </span>
                            |
                            <span>
                                {t("show.license")} {settings?.company_license}
                            </span>
                            |
                            <span>
                                {lang === "ar" ? "العنوان:" : "Address:"}{" "}
                                {settings?.company_address}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-3 border-t border-zinc-200 pt-3 text-xs font-mono">
                            <span className="font-bold text-sm">
                                {contract.contract_title ||
                                    t("show.contract_title")}
                            </span>
                            <div className="flex gap-3">
                                {showContractSerial && (
                                    <span>
                                        {t("show.contract_no")}{" "}
                                        {contract.contract_number}
                                    </span>
                                )}
                                {showCustomerSerial && (
                                    <span>
                                        {t("show.cr_id")}{" "}
                                        {contract.customer?.cr_number ||
                                            contract.customer?.id_number ||
                                            "—"}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {headerDesign === "4" && (
                    <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6 shadow-sm">
                        <div className="bg-primary/10 text-primary px-4 py-2.5 flex justify-between items-center">
                            <h2 className="text-sm font-extrabold">
                                {settings?.company_name}
                            </h2>
                            <span className="text-[10px] font-bold">
                                {settings?.company_slogan}
                            </span>
                        </div>
                        <div className="p-4 flex justify-between items-center bg-white text-xs font-mono">
                            <div className="space-y-1">
                                <p>
                                    {t("show.cr_short")} {settings?.company_cr}
                                </p>
                                <p>
                                    {t("show.vat_short")}{" "}
                                    {settings?.company_vat}
                                </p>
                            </div>
                            <div className="text-center">
                                <span className="font-extrabold text-black block text-sm">
                                    {contract.contract_title ||
                                        t("show.contract_title")}
                                </span>
                                {showContractSerial && (
                                    <span className="text-[10px] text-zinc-500">
                                        {contract.contract_number}
                                    </span>
                                )}
                            </div>
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    className="h-10 w-auto object-contain"
                                />
                            ) : (
                                <div className="h-10 w-10 border border-zinc-300 rounded bg-zinc-50 flex items-center justify-center text-[10px]">
                                    شعار
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {headerDesign === "5" && (
                    <div className="grid grid-cols-3 gap-3 border-b-2 border-black pb-4 mb-6 items-stretch text-xs font-mono">
                        <div className="border border-zinc-300 p-3 rounded bg-zinc-50/50 space-y-1">
                            <p className="font-bold border-b border-zinc-200 pb-1 mb-1.5">
                                {lang === "ar"
                                    ? "نظام الجودة"
                                    : "Quality System"}
                            </p>
                            <p>
                                {t("show.issue_no")}{" "}
                                {settings?.quality_issue_no || "REV-01"}
                            </p>
                            <p>
                                {t("show.issue_date_label")}{" "}
                                {settings?.quality_issue_date || "2026-05-28"}
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="font-extrabold text-sm border-2 border-black px-4 py-1.5 rounded bg-zinc-50">
                                {contract.contract_title ||
                                    t("show.contract_title")}
                            </span>
                            {showContractSerial && (
                                <span className="mt-1.5 font-bold text-zinc-700">
                                    {contract.contract_number}
                                </span>
                            )}
                        </div>
                        <div className="border border-zinc-300 p-3 rounded bg-zinc-50/50 flex flex-col justify-between items-end text-end">
                            {logoSrc ? (
                                <img
                                    src={logoSrc}
                                    alt="Logo"
                                    className="h-8 w-auto object-contain"
                                />
                            ) : (
                                <div className="h-8 w-8 border border-zinc-300 rounded bg-zinc-50 flex items-center justify-center text-[10px]">
                                    شعار
                                </div>
                            )}
                            <div className="mt-2">
                                <p className="font-bold text-xs text-black">
                                    {settings?.company_name}
                                </p>
                                <p>
                                    {t("show.cr_short")} {settings?.company_cr}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ──────── RENDER BODY CONTENT ──────── */}
                <div className="text-xs text-black leading-relaxed space-y-4">
                    {parsedContent}
                </div>

                {/* ──────── RENDER SIGNATURE BOXES ──────── */}
                <div className="border-t-2 border-black pt-6 mt-8 grid grid-cols-2 gap-12 text-xs text-black">
                    <div className="space-y-4 text-start">
                        <p className="font-bold border-b border-zinc-300 pb-1.5 text-sm">
                            {lang === "ar" ? "الطرف الأول" : "First Party"}
                        </p>
                        <p>
                            <span className="font-semibold">
                                {t("show.company")}
                            </span>{" "}
                            {settings?.company_name}
                        </p>
                        <p>
                            <span className="font-semibold">
                                {t("show.name")}
                            </span>{" "}
                            {settings?.company_gm || t("show.general_manager")}
                        </p>
                        <p className="pt-4">
                            <span className="font-semibold">
                                {t("show.signature")}
                            </span>{" "}
                            ___________________________
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold">
                            {t("show.official_stamp")}
                        </p>
                    </div>
                    <div className="space-y-4 text-start">
                        <p className="font-bold border-b border-zinc-300 pb-1.5 text-sm">
                            {lang === "ar" ? "الطرف الثاني" : "Second Party"}
                        </p>
                        <p>
                            <span className="font-semibold">
                                {t("show.customer_label")}
                            </span>{" "}
                            {contract.customer?.name}
                        </p>
                        <p>
                            <span className="font-semibold">
                                {t("show.name")}
                            </span>{" "}
                            {contract.contract_agents?.[0]?.name ||
                                contract.customer?.name}
                        </p>
                        <p className="pt-4">
                            <span className="font-semibold">
                                {t("show.signature")}
                            </span>{" "}
                            ___________________________
                        </p>

                        {(settings?.include_second_party_proxy === "1" ||
                            settings?.include_second_party_proxy === true) &&
                            contract.contract_agents?.[1] && (
                                <div className="pt-4 mt-4 border-t border-dashed border-zinc-200 space-y-2">
                                    <p className="font-bold text-zinc-800">
                                        {lang === "ar"
                                            ? "ينوب عنه في التوقيع:"
                                            : "Proxy Signatory:"}
                                    </p>
                                    <p>
                                        <span className="font-semibold">
                                            {t("show.name")}
                                        </span>{" "}
                                        {contract.contract_agents[1].name}
                                    </p>
                                    {contract.contract_agents[1].job_title && (
                                        <p>
                                            <span className="font-semibold">
                                                {lang === "ar"
                                                    ? "الصفة:"
                                                    : "Job Title:"}
                                            </span>{" "}
                                            {
                                                contract.contract_agents[1]
                                                    .job_title
                                            }
                                        </p>
                                    )}
                                    <p className="pt-2">
                                        <span className="font-semibold">
                                            {t("show.signature")}
                                        </span>{" "}
                                        ___________________________
                                    </p>
                                </div>
                            )}

                        <p className="pt-2">
                            <span className="font-semibold">
                                {t("show.date_label")}
                            </span>{" "}
                            ____ / ____ / ________
                        </p>
                    </div>
                </div>

                {/* ──────── RENDER FOOTER DESIGN (1-5) ──────── */}
                <div className="mt-12 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
                    {footerDesign === "1" && (
                        <div className="flex flex-col items-center gap-1 text-center">
                            <p className="font-semibold text-zinc-700">
                                {settings?.company_name}
                            </p>
                            <p>
                                {settings?.company_address} | {t("show.phone")}{" "}
                                {settings?.company_phone} | {t("show.email")}{" "}
                                {settings?.company_email}
                            </p>
                        </div>
                    )}

                    {footerDesign === "2" && (
                        <div className="grid grid-cols-3 gap-6 text-start">
                            <div className="space-y-1">
                                <p className="font-bold text-zinc-700">
                                    {lang === "ar"
                                        ? "عناوين التواصل"
                                        : "Contact details"}
                                </p>
                                <p>
                                    {t("show.phone")} {settings?.company_phone}
                                </p>
                                <p>
                                    {t("show.email")} {settings?.company_email}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-zinc-700">
                                    {lang === "ar"
                                        ? "الموقع الجغرافي"
                                        : "Est. Location"}
                                </p>
                                <p>{settings?.company_address}</p>
                            </div>
                            <div className="space-y-1 text-end flex flex-col justify-between items-end">
                                <p className="font-bold text-zinc-700">
                                    {lang === "ar"
                                        ? "نظام المستودعات الذكي"
                                        : "Smart WMS System"}
                                </p>
                            </div>
                        </div>
                    )}

                    {footerDesign === "3" && (
                        <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-200 pt-2">
                            <span>
                                {settings?.company_name} -{" "}
                                {settings?.company_slogan}
                            </span>
                            <span>
                                {t("show.email")} {settings?.company_email} •{" "}
                                {t("show.phone")} {settings?.company_phone}
                            </span>
                        </div>
                    )}

                    {footerDesign === "4" && (
                        <div className="space-y-2 text-start">
                            <p className="px-1 text-[10px]">
                                {settings?.company_address}
                            </p>
                            <div className="bg-primary/10 text-primary p-2 px-4 rounded flex justify-between items-center text-[10px] font-bold">
                                <span>
                                    {t("show.phone")} {settings?.company_phone}
                                </span>
                                <span>
                                    {t("show.email")} {settings?.company_email}
                                </span>
                                <span>{settings?.company_name}</span>
                            </div>
                        </div>
                    )}

                    {footerDesign === "5" && (
                        <div className="flex justify-between items-end text-start">
                            <div className="space-y-1 text-[10px]">
                                <p className="font-bold text-zinc-800">
                                    {settings?.company_name}
                                </p>
                                <p>
                                    {t("show.phone")} {settings?.company_phone}{" "}
                                    | {t("show.email")}{" "}
                                    {settings?.company_email}
                                </p>
                                <p>{settings?.company_address}</p>
                            </div>
                            <div className="h-12 w-12 border border-dashed border-zinc-300 rounded bg-white flex items-center justify-center text-[8px] text-zinc-400 uppercase font-mono shadow-inner">
                                Stamp space
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const t = (key, replacements = {}) => {
        const parts = key.split(".");
        let current = translations;
        for (const part of parts) {
            if (current && current[part] !== undefined) {
                current = current[part];
            } else {
                return key;
            }
        }
        if (typeof current !== "string") {
            return current;
        }

        return Object.entries(replacements).reduce(
            (message, [token, value]) =>
                message.replace(`:${token}`, String(value ?? "")),
            current,
        );
    };

    // Inline Edit Form State for Draft Contract
    const {
        data,
        setData,
        put: formPut,
        processing: formProcessing,
        errors,
    } = useForm({
        write_date: contract.write_date || "",
        write_date_hijri: contract.write_date_hijri || "",
        start_date: contract.start_date || "",
        start_date_hijri: contract.start_date_hijri || "",
        mandatory_period: contract.mandatory_period || 12,
        renewal_period: contract.renewal_period || 12,
        introduction: contract.introduction || "",
        preamble: contract.preamble || "",
        contract_title: contract.contract_title || "",
        footer: contract.footer || "",
        season_id: contract.season_id || "",
        contact_id: contract.contact_id || "",
        items:
            contract.items?.map((item) => ({
                id: item.id,
                storage_item_id: item.storage_item_id,
                unit_count: item.unit_count,
                monthly_rent: item.monthly_rent,
                discount: item.discount,
            })) || [],
        term_ids: contract.terms?.map((t) => t.id) || [],
    });

    const getHijriDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return "";
        return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(d);
    };

    // Auto-update Hijri dates when Gregorian dates change
    useEffect(() => {
        setData("write_date_hijri", getHijriDate(data.write_date));
    }, [data.write_date]);

    useEffect(() => {
        setData("start_date_hijri", getHijriDate(data.start_date));
    }, [data.start_date]);

    const saveSection = (sectionName) => {
        formPut(route("contracts.update", contract.id), {
            preserveScroll: true,
        });
    };

    // Item editing actions
    const addItemRow = () => {
        setData("items", [
            ...data.items,
            {
                storage_item_id: storageItems[0]?.id || "",
                unit_count: 1,
                monthly_rent: storageItems[0]?.default_price || 0,
                discount: 0,
            },
        ]);
    };

    const removeItemRow = (index) => {
        setData(
            "items",
            data.items.filter((_, i) => i !== index),
        );
    };

    const updateItemField = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;
        if (field === "storage_item_id") {
            const selectedItem = storageItems.find(
                (item) => item.id === parseInt(value),
            );
            if (selectedItem) {
                newItems[index].monthly_rent = selectedItem.default_price || 0;
            }
        }
        setData("items", newItems);
    };

    // Term sorting and editing actions
    const moveTerm = (index, direction) => {
        const newTermIds = [...data.term_ids];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newTermIds.length) return;
        const temp = newTermIds[index];
        newTermIds[index] = newTermIds[targetIndex];
        newTermIds[targetIndex] = temp;
        setData("term_ids", newTermIds);
    };

    const removeTerm = (id) => {
        setData(
            "term_ids",
            data.term_ids.filter((tId) => tId !== id),
        );
    };

    const addTermFromLibrary = (id) => {
        if (!data.term_ids.includes(id)) {
            setData("term_ids", [...data.term_ids, id]);
        }
    };

    const [customTermText, setCustomTermText] = useState("");
    const addCustomTerm = () => {
        if (!customTermText.trim()) return;
        const customId = `custom_${customTermText.trim()}`;
        setData("term_ids", [...data.term_ids, customId]);
        setCustomTermText("");
    };

    const getTermText = (id) => {
        if (typeof id === "string" && id.startsWith("custom_")) {
            return id.substring(7);
        }
        const term =
            allTerms.find((t) => t.id === parseInt(id)) ||
            contract.terms?.find((t) => t.id === parseInt(id));
        return term
            ? lang === "ar"
                ? term.text_ar
                : term.text_en || term.text_ar
            : "";
    };

    // Modals state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [showStatusContactModal, setShowStatusContactModal] = useState(false);
    const [selectedContactAgent, setSelectedContactAgent] = useState(null);
    const [contactActionType, setContactActionType] = useState("suspended"); // suspended, deleted
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showPeriodDetailsModal, setShowPeriodDetailsModal] = useState(false);
    const [showPeriodEditModal, setShowPeriodEditModal] = useState(false);
    const [showPeriodItemsModal, setShowPeriodItemsModal] = useState(false);
    const [showPeriodStatusModal, setShowPeriodStatusModal] = useState(false);
    const [showPeriodDeleteModal, setShowPeriodDeleteModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [periodViewMode, setPeriodViewMode] = useState("list");

    // Form states
    const [editForm, setEditForm] = useState({
        introduction: contract.introduction || "",
        preamble: contract.preamble || "",
        discount: contract.discount || 0,
    });

    const [periodForm, setPeriodForm] = useState({
        duration_months: 12,
        notes: "",
    });

    const [periodEditForm, setPeriodEditForm] = useState({
        duration_months: 1,
        notes: "",
    });

    const [periodItemsForm, setPeriodItemsForm] = useState({
        items: [],
    });

    const [periodStatusForm, setPeriodStatusForm] = useState({
        status: "active",
        status_reason: "",
        remaining_period_action: "keep_remaining",
        terminate_contract: false,
        notify_customer: false,
    });

    const [contactForm, setContactForm] = useState({
        contact_id: "",
    });

    const [statusContactForm, setStatusContactForm] = useState({
        status_reason: "",
    });

    const [invoiceForm, setInvoiceForm] = useState({
        period_id: contract.periods?.find((period) => period.status === "active")?.id || contract.periods?.[0]?.id || "",
        invoice_number: `INV-${contract.contract_number}-${(contract.invoices?.length || 0) + 1}`,
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const [paymentForm, setPaymentForm] = useState({
        period_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        method: "bank_transfer",
        reference: "",
        notes: "",
        invoice_id: "",
        primary_account_id: "",
    });

    const [processing, setProcessing] = useState(false);

    const financialInvoices = (contract.invoices || []).filter(
        (invoice) =>
            !filterPeriodId ||
            String(invoice.period_id || "") === String(filterPeriodId),
    );
    const financialVouchers = (contract.vouchers || []).filter(v => v.type === 'receipt');
    const financialPayments = (contract.payments || []).filter(
        (payment) =>
            !filterPeriodId ||
            String(payment.period_id || "") === String(filterPeriodId),
    );
    const selectedPaymentPeriodInvoices = financialInvoices.filter(
        (invoice) =>
            String(invoice.period_id || "") ===
                String(paymentForm.period_id || "") &&
            invoice.status !== "paid",
    );

    const getPeriodDurationMonths = (period) => {
        if (!period?.start_date || !period?.end_date) return 0;
        const start = new Date(period.start_date);
        const end = new Date(period.end_date);
        return Math.max(
            1,
            (end.getFullYear() - start.getFullYear()) * 12 +
                (end.getMonth() - start.getMonth()),
        );
    };

    const getPeriodStatusLabel = (status) => {
        if (status === "active") return t("show.status_active_f");
        if (status === "suspended") return t("show.status_suspended");
        return t("show.status_ended_f");
    };

    const getPeriodStatusClass = (status) => {
        if (status === "active") {
            return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
        }
        if (status === "suspended") {
            return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
        }
        return "bg-gray-500/10 text-gray-500 border border-gray-500/20";
    };

    const openPeriodDetails = (period) => {
        setSelectedPeriod(period);
        setShowPeriodDetailsModal(true);
    };

    const openInvoiceModalForPeriod = (period) => {
        setInvoiceForm({
            ...invoiceForm,
            period_id: period.id,
            amount: contract.contract_items?.reduce((total, item) => total + (item.price * item.quantity), 0) || "",
        });
        setShowInvoiceModal(true);
    };

    const openPeriodEdit = (period) => {
        setSelectedPeriod(period);
        setPeriodEditForm({
            duration_months: getPeriodDurationMonths(period),
            notes: period.notes || "",
        });
        setShowPeriodEditModal(true);
    };

    const openPeriodItems = (period) => {
        setSelectedPeriod(period);
        setPeriodItemsForm({
            items: (period.items || []).map((item) => ({
                id: item.id,
                label: displayBilingual(
                    item.storage_item?.name_ar
                        ? `${item.storage_item.name_ar}|${item.storage_item.name_en || item.storage_item.name_ar}`
                        : item.storageItem
                          ? `${item.storageItem.name_ar}|${item.storageItem.name_en || item.storageItem.name_ar}`
                          : "",
                ),
                unit_count: item.unit_count,
            })),
        });
        setShowPeriodItemsModal(true);
    };

    const openPeriodStatus = (period, status) => {
        setSelectedPeriod(period);
        setPeriodStatusForm({
            status,
            status_reason: period.status_reason || "",
            remaining_period_action:
                period.remaining_period_action || "keep_remaining",
            terminate_contract: !!period.terminate_contract,
            notify_customer: !!period.notify_customer,
        });
        setShowPeriodStatusModal(true);
    };

    const openPeriodDelete = (period) => {
        setSelectedPeriod(period);
        setShowPeriodDeleteModal(true);
    };

    const handlePeriodRequest = (
        routeName,
        method = "patch",
        data = {},
        onSuccessModalClose = null,
    ) => {
        if (!selectedPeriod || processing) return;
        setProcessing(true);
        router[method](
            route(routeName, [contract.id, selectedPeriod.id]),
            data,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    if (onSuccessModalClose) onSuccessModalClose(false);
                },
                onError: () => setProcessing(false),
            },
        );
    };

    const openFinancialsForPeriod = (periodId) => {
        setFilterPeriodId(String(periodId));
        setActiveTab("financials");
    };

    // Actions handlers
    const handleAction = (
        routeSuffix,
        method = "post",
        data = {},
        onSuccessModalClose = null,
    ) => {
        if (processing) return;
        setProcessing(true);
        router[method](route(`contracts.${routeSuffix}`, contract.id), data, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                if (onSuccessModalClose) onSuccessModalClose(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const handleContactStatusSubmit = (e) => {
        e.preventDefault();
        if (!selectedContactAgent) return;
        setProcessing(true);
        router.patch(
            route("contracts.contacts.status", [
                contract.id,
                selectedContactAgent.id,
            ]),
            {
                status: contactActionType,
                status_reason: statusContactForm.status_reason,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setProcessing(false);
                    setShowStatusContactModal(false);
                    setStatusContactForm({ status_reason: "" });
                },
                onError: () => setProcessing(false),
            },
        );
    };

    const tabs = [
        {
            id: "view",
            label: t("show.tab_view"),
            icon: FileText,
        },
        {
            id: "periods",
            label: t("show.tab_periods"),
            icon: Calendar,
        },
        {
            id: "contacts",
            label: t("show.tab_delegates"),
            icon: Users,
        },
        {
            id: "financials",
            label: t("show.tab_financials"),
            icon: DollarSign,
        },
        {
            id: "vouchers",
            label: t("show.tab_vouchers"),
            icon: FileSpreadsheet,
        },
        {
            id: "pallets",
            label: t("show.tab_pallets"),
            icon: Layers,
        },
        {
            id: "items",
            label: t("show.tab_stored_items"),
            icon: Package,
        },
    ];

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.get(route("customers.index"))}
            >
                {t("show.breadcrumb_customers")}
            </span>
            <ChevronRight
                className={
                    lang === "ar" ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"
                }
            />
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() =>
                    router.get(route("customers.show", contract.customer_id))
                }
            >
                {contract.customer?.name}
            </span>
            <ChevronRight
                className={
                    lang === "ar" ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"
                }
            />
            <span className="text-primary font-bold">
                {contract.contract_number}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={`${t("show.breadcrumb_contract")} ${contract.contract_number}`}
            />

            <div className="max-w-7xl mx-auto px-3 sm:px-3 lg:px-8 py-2 space-y-2">
                {/* Header Info & Actions Bar */}
                <div className="rounded-xl border border-border bg-surface shadow-sm p-4 mb-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shadow-inner shrink-0 hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg font-extrabold text-text font-mono tracking-tight">
                                        {contract.contract_number}
                                    </h1>
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                            contract.status === "active"
                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                : contract.status ===
                                                    "suspended"
                                                  ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                  : contract.status === "ended"
                                                    ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                    : contract.status ===
                                                        "cancelled"
                                                      ? "bg-danger/10 text-danger border border-danger/20"
                                                      : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                        }`}
                                    >
                                        {contract.status === "active"
                                            ? t("show.status_active")
                                            : contract.status === "suspended"
                                              ? t("show.status_suspended")
                                              : contract.status === "ended"
                                                ? t("show.status_ended")
                                                : contract.status ===
                                                    "cancelled"
                                                  ? t("show.status_cancelled")
                                                  : t("show.status_draft")}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-text-muted">
                                    <span
                                        className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors"
                                        onClick={() =>
                                            router.get(
                                                route(
                                                    "customers.show",
                                                    contract.customer_id,
                                                ),
                                            )
                                        }
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        {contract.customer?.name}
                                    </span>
                                    <span>•</span>
                                    <span
                                        className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors"
                                        onClick={() =>
                                            router.get(
                                                route("settings.seasons.index"),
                                            )
                                        }
                                    >
                                        <Calendar className="h-3.5 w-3.5" />
                                        {t("show.season_settings")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-border">
                            {/* Edit */}
                            <Tooltip text={t("show.edit_contract")}>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(true)}
                                    disabled={processing || formProcessing}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-surface text-primary hover:bg-primary/10 transition-colors shadow-sm"
                                >
                                    <Edit3 className="h-4 w-4" />
                                </button>
                            </Tooltip>

                            {/* Activate */}
                            {(contract.status === "draft" ||
                                contract.status === "suspended") && (
                                <Tooltip text={t("show.activate")}>
                                    <button
                                        type="button"
                                        onClick={() => handleAction("activate")}
                                        disabled={processing || formProcessing}
                                        className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                    >
                                        <Play className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            )}

                            {/* Suspend */}
                            {contract.status === "active" && (
                                <Tooltip text={t("show.suspend_contract")}>
                                    <button
                                        type="button"
                                        onClick={() => handleAction("suspend")}
                                        disabled={processing || formProcessing}
                                        className="flex items-center justify-center h-8 w-8 rounded-lg border border-amber-500/30 text-amber-600 hover:bg-amber-500/10 transition-colors shadow-sm"
                                    >
                                        <Pause className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            )}

                            {/* End */}
                            {contract.status === "active" && (
                                <Tooltip text={t("show.end_contract")}>
                                    <button
                                        type="button"
                                        onClick={() => handleAction("end")}
                                        disabled={processing || formProcessing}
                                        className="flex items-center justify-center h-8 w-8 rounded-lg border border-blue-500/30 text-blue-600 hover:bg-blue-500/10 transition-colors shadow-sm"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            )}

                            {/* Cancel */}
                            {(contract.status === "draft" ||
                                contract.status === "suspended") && (
                                <Tooltip text={t("show.cancel_contract")}>
                                    <button
                                        type="button"
                                        onClick={() => handleAction("cancel")}
                                        disabled={processing || formProcessing}
                                        className="flex items-center justify-center h-8 w-8 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 transition-colors shadow-sm"
                                    >
                                        <Ban className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            )}

                            {/* Delete */}
                            <Tooltip text={t("show.delete_contract")}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        requestDelete(route("contracts.destroy", contract.id), contract);
                                    }}
                                    disabled={processing || formProcessing}
                                    className="flex items-center justify-center h-8 w-8 rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors shadow-sm"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Main Card: TabBar as header, content as body */}
                <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <TabBar
                        tabs={tabs}
                        activeTab={activeTab}
                        onChange={setActiveTab}
                    />

                    <div className="p-4 space-y-4 flex-1">
                        {/* Tab Content 1: Contract View */}
                        {activeTab === "view" &&
                            (contract.status === "draft" ? (
                                <div className="space-y-2">
                                    {/* Timing & Stakeholders Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        <SectionCard
                                            title={t("show.timing")}
                                            icon={Calendar}
                                        >
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    saveSection("timing");
                                                }}
                                                className="flex flex-col flex-1"
                                            >
                                                <div className="flex-1 grid grid-cols-2 gap-2 content-start">
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.write_date",
                                                            )}
                                                        />
                                                        <TextInput
                                                            type="date"
                                                            className="mt-1 w-full text-xs"
                                                            value={
                                                                data.write_date
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "write_date",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.write_date
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.hijri_date",
                                                            )}
                                                        />
                                                        <TextInput
                                                            type="text"
                                                            className="mt-1 w-full bg-surface-muted text-xs font-mono"
                                                            value={
                                                                data.write_date_hijri
                                                            }
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.start_date",
                                                            )}
                                                        />
                                                        <TextInput
                                                            type="date"
                                                            className="mt-1 w-full text-xs"
                                                            min={
                                                                data.write_date
                                                            }
                                                            value={
                                                                data.start_date
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "start_date",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.start_date
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.hijri_start",
                                                            )}
                                                        />
                                                        <TextInput
                                                            type="text"
                                                            className="mt-1 w-full bg-surface-muted text-xs font-mono"
                                                            value={
                                                                data.start_date_hijri
                                                            }
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.mandatory_period_months",
                                                            )}
                                                        />
                                                        <TextInput
                                                            type="number"
                                                            min="1"
                                                            max="12"
                                                            className="mt-1 w-full text-xs"
                                                            value={
                                                                data.mandatory_period
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "mandatory_period",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.mandatory_period
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.renewal_period_months",
                                                            )}
                                                        />
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            className="mt-1 w-full text-xs"
                                                            value={
                                                                data.renewal_period
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "renewal_period",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                errors.renewal_period
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-1 border-t border-border mt-2">
                                                    <PrimaryButton
                                                        disabled={
                                                            formProcessing
                                                        }
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        {t("show.save_timing")}
                                                    </PrimaryButton>
                                                </div>
                                            </form>
                                        </SectionCard>

                                        <SectionCard
                                            title={t("show.stakeholders")}
                                            icon={Users}
                                        >
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    saveSection("contact");
                                                }}
                                                className="flex flex-col flex-1"
                                            >
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-bold text-text mb-1">
                                                                {t(
                                                                    "show.institution",
                                                                )}{" "}
                                                                -{" "}
                                                                {settings?.company_name ||
                                                                    "Warehouse OS"}
                                                            </p>
                                                            <p
                                                                className="text-xs text-text-muted font-mono"
                                                                dir="ltr"
                                                            >
                                                                CR:{" "}
                                                                {settings?.company_cr ||
                                                                    "1010101010"}{" "}
                                                                | VAT:{" "}
                                                                {settings?.company_vat ||
                                                                    "300000000000003"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2 pb-1.5 border-b border-border">
                                                        <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                        <div>
                                                            <p className="text-xs font-bold text-text mb-1">
                                                                {t(
                                                                    "show.customer",
                                                                )}{" "}
                                                                -{" "}
                                                                {
                                                                    contract
                                                                        .customer
                                                                        ?.name
                                                                }
                                                            </p>
                                                            <p
                                                                className="text-xs text-text-muted font-mono"
                                                                dir="ltr"
                                                            >
                                                                {
                                                                    contract
                                                                        .customer
                                                                        ?.phone_number
                                                                }{" "}
                                                                | CR/ID:{" "}
                                                                {contract
                                                                    .customer
                                                                    ?.cr_number ||
                                                                    contract
                                                                        .customer
                                                                        ?.id_number}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <InputLabel
                                                            value={t(
                                                                "show.authorized_rep",
                                                            )}
                                                        />
                                                        <select
                                                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs"
                                                            value={
                                                                data.contact_id
                                                            }
                                                            onChange={(e) =>
                                                                setData(
                                                                    "contact_id",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                {t(
                                                                    "show.select_representative",
                                                                )}
                                                            </option>
                                                            {contract.customer?.contacts?.map(
                                                                (c) => (
                                                                    <option
                                                                        key={
                                                                            c.id
                                                                        }
                                                                        value={
                                                                            c.id
                                                                        }
                                                                    >
                                                                        {c.name}{" "}
                                                                        (
                                                                        {c.job_title ||
                                                                            "�"}
                                                                        )
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                        <InputError
                                                            message={
                                                                errors.contact_id
                                                            }
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-1 border-t border-border mt-2">
                                                    <PrimaryButton
                                                        disabled={
                                                            formProcessing
                                                        }
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        {t(
                                                            "show.save_representative",
                                                        )}
                                                    </PrimaryButton>
                                                </div>
                                            </form>
                                        </SectionCard>
                                    </div>

                                    {/* Storage Allocation Items */}
                                    <SectionCard
                                        title={t("show.storage_allocation")}
                                        icon={Box}
                                    >
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                saveSection("items");
                                            }}
                                            className="space-y-2"
                                        >
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-start">
                                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-3 py-1.5">
                                                                {t("show.item")}
                                                            </th>
                                                            <th className="px-3 py-1.5 text-center w-24">
                                                                {t("show.qty")}
                                                            </th>
                                                            <th className="px-3 py-1.5 w-32">
                                                                {t(
                                                                    "show.monthly_rent",
                                                                )}
                                                            </th>
                                                            <th className="px-3 py-1.5 w-28">
                                                                {t(
                                                                    "show.discount",
                                                                )}
                                                            </th>
                                                            <th className="px-3 py-1.5 text-end w-36">
                                                                {t(
                                                                    "show.total_with_vat",
                                                                )}
                                                            </th>
                                                            <th className="px-3 py-1.5 w-16 text-center"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {data.items?.length ===
                                                        0 ? (
                                                            <tr>
                                                                <td
                                                                    colSpan="6"
                                                                    className="text-center py-3 text-xs text-text-muted"
                                                                >
                                                                    {t(
                                                                        "show.no_storage",
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            data.items?.map(
                                                                (item, idx) => {
                                                                    const rowSubtotal =
                                                                        parseFloat(
                                                                            item.unit_count ||
                                                                                0,
                                                                        ) *
                                                                            parseInt(
                                                                                data.mandatory_period ||
                                                                                    0,
                                                                            ) *
                                                                            parseFloat(
                                                                                item.monthly_rent ||
                                                                                    0,
                                                                            ) -
                                                                        parseFloat(
                                                                            item.discount ||
                                                                                0,
                                                                        );
                                                                    return (
                                                                        <tr
                                                                            key={
                                                                                idx
                                                                            }
                                                                            className="hover:bg-surface-muted/30 transition-colors"
                                                                        >
                                                                            <td className="px-4 py-2">
                                                                                <select
                                                                                    className="w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs"
                                                                                    value={
                                                                                        item.storage_item_id
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateItemField(
                                                                                            idx,
                                                                                            "storage_item_id",
                                                                                            e
                                                                                                .target
                                                                                                .value,
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    {storageItems.map(
                                                                                        (
                                                                                            s,
                                                                                        ) => (
                                                                                            <option
                                                                                                key={
                                                                                                    s.id
                                                                                                }
                                                                                                value={
                                                                                                    s.id
                                                                                                }
                                                                                            >
                                                                                                {lang ===
                                                                                                "ar"
                                                                                                    ? s.name_ar
                                                                                                    : s.name_en ||
                                                                                                      s.name_ar}
                                                                                            </option>
                                                                                        ),
                                                                                    )}
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <TextInput
                                                                                    type="number"
                                                                                    min="1"
                                                                                    className="w-full text-center text-xs"
                                                                                    value={
                                                                                        item.unit_count
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateItemField(
                                                                                            idx,
                                                                                            "unit_count",
                                                                                            parseInt(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                                0,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <TextInput
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    className="w-full text-xs"
                                                                                    value={
                                                                                        item.monthly_rent
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateItemField(
                                                                                            idx,
                                                                                            "monthly_rent",
                                                                                            parseFloat(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                                0,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-2">
                                                                                <TextInput
                                                                                    type="number"
                                                                                    step="0.01"
                                                                                    className="w-full text-xs text-danger"
                                                                                    value={
                                                                                        item.discount
                                                                                    }
                                                                                    onChange={(
                                                                                        e,
                                                                                    ) =>
                                                                                        updateItemField(
                                                                                            idx,
                                                                                            "discount",
                                                                                            parseFloat(
                                                                                                e
                                                                                                    .target
                                                                                                    .value,
                                                                                            ) ||
                                                                                                0,
                                                                                        )
                                                                                    }
                                                                                />
                                                                            </td>
                                                                            <td
                                                                                className="px-4 py-2 text-end text-sm font-mono font-extrabold text-emerald-600"
                                                                                dir="ltr"
                                                                            >
                                                                                {rowSubtotal.toFixed(
                                                                                    2,
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 py-2 text-center">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeItemRow(
                                                                                            idx,
                                                                                        )
                                                                                    }
                                                                                    className="text-danger hover:text-danger/80 transition-colors p-1"
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                },
                                                            )
                                                        )}
                                                    </tbody>
                                                    <tfoot className="bg-surface-muted/50 border-t border-border">
                                                        <tr>
                                                            <td
                                                                colSpan="4"
                                                                className="px-4 py-4 text-end text-xs font-extrabold text-text uppercase tracking-wider"
                                                            >
                                                                {t(
                                                                    "show.grand_total",
                                                                )}
                                                            </td>
                                                            <td
                                                                className="px-4 py-4 text-base font-mono font-extrabold text-emerald-600 text-end"
                                                                dir="ltr"
                                                            >
                                                                {data.items
                                                                    ?.reduce(
                                                                        (
                                                                            sum,
                                                                            item,
                                                                        ) =>
                                                                            sum +
                                                                            (parseFloat(
                                                                                item.unit_count ||
                                                                                    0,
                                                                            ) *
                                                                                parseInt(
                                                                                    data.mandatory_period ||
                                                                                        0,
                                                                                ) *
                                                                                parseFloat(
                                                                                    item.monthly_rent ||
                                                                                        0,
                                                                                ) -
                                                                                parseFloat(
                                                                                    item.discount ||
                                                                                        0,
                                                                                )),
                                                                        0,
                                                                    )
                                                                    .toFixed(2)}
                                                            </td>
                                                            <td></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                            <div className="flex items-center justify-between pt-1 border-t border-border">
                                                <SecondaryButton
                                                    type="button"
                                                    onClick={addItemRow}
                                                    className="text-xs py-1 px-3"
                                                >
                                                    <Plus className="h-4 w-4 me-1.5" />
                                                    {t("show.add_storage_item")}
                                                </SecondaryButton>
                                                <PrimaryButton
                                                    disabled={formProcessing}
                                                    className="text-xs py-1 px-3"
                                                >
                                                    {t("show.save_storage")}
                                                </PrimaryButton>
                                            </div>
                                        </form>
                                    </SectionCard>

                                    {/* Terms */}
                                    <SectionCard
                                        title={t("show.terms_conditions")}
                                        icon={FileText}
                                    >
                                        <form
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                saveSection("terms");
                                            }}
                                            className="space-y-4"
                                        >
                                            {data.term_ids?.length === 0 ? (
                                                <p className="text-xs text-text-muted text-center py-6">
                                                    {t("show.no_terms")}
                                                </p>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {data.term_ids?.map(
                                                        (id, index) => (
                                                            <li
                                                                key={id}
                                                                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-surface-muted/30 border border-border"
                                                            >
                                                                <div className="flex items-start gap-2.5">
                                                                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                                    <span className="text-xs text-text leading-relaxed">
                                                                        {getTermText(
                                                                            id,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            index ===
                                                                            0
                                                                        }
                                                                        onClick={() =>
                                                                            moveTerm(
                                                                                index,
                                                                                -1,
                                                                            )
                                                                        }
                                                                        className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                                                    >
                                                                        <ArrowUp className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={
                                                                            index ===
                                                                            data
                                                                                .term_ids
                                                                                .length -
                                                                                1
                                                                        }
                                                                        onClick={() =>
                                                                            moveTerm(
                                                                                index,
                                                                                1,
                                                                            )
                                                                        }
                                                                        className="text-text-muted hover:text-primary transition-colors disabled:opacity-30 p-0.5"
                                                                    >
                                                                        <ArrowDown className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeTerm(
                                                                                id,
                                                                            )
                                                                        }
                                                                        className="text-danger hover:text-danger/80 transition-colors p-0.5 ms-1"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            )}

                                            <div className="pt-1 border-t border-border space-y-2">
                                                <div className="flex gap-2">
                                                    <TextInput
                                                        type="text"
                                                        placeholder={t(
                                                            "show.write_custom_term",
                                                        )}
                                                        className="flex-1 text-xs"
                                                        value={customTermText}
                                                        onChange={(e) =>
                                                            setCustomTermText(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={addCustomTerm}
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        {t(
                                                            "show.add_custom_term",
                                                        )}
                                                    </SecondaryButton>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-bold text-text mb-2">
                                                        {t(
                                                            "show.library_terms",
                                                        )}
                                                    </p>
                                                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-2.5 bg-surface-muted/20 space-y-2">
                                                        {allTerms.filter(
                                                            (t) =>
                                                                !data.term_ids.includes(
                                                                    t.id,
                                                                ),
                                                        ).length === 0 ? (
                                                            <p className="text-xs text-text-muted text-center py-4">
                                                                {t(
                                                                    "show.all_terms_added",
                                                                )}
                                                            </p>
                                                        ) : (
                                                            allTerms
                                                                .filter(
                                                                    (t) =>
                                                                        !data.term_ids.includes(
                                                                            t.id,
                                                                        ),
                                                                )
                                                                .map((term) => (
                                                                    <div
                                                                        key={
                                                                            term.id
                                                                        }
                                                                        onClick={() =>
                                                                            addTermFromLibrary(
                                                                                term.id,
                                                                            )
                                                                        }
                                                                        className="text-xs text-text hover:bg-primary/5 hover:text-primary p-2 rounded border border-transparent hover:border-primary/20 transition-all cursor-pointer flex items-center justify-between"
                                                                    >
                                                                        <span>
                                                                            {lang ===
                                                                            "ar"
                                                                                ? term.text_ar
                                                                                : term.text_en ||
                                                                                  term.text_ar}
                                                                        </span>
                                                                        <Plus className="h-3.5 w-3.5 text-primary shrink-0 ms-2" />
                                                                    </div>
                                                                ))
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-1">
                                                    <PrimaryButton
                                                        disabled={
                                                            formProcessing
                                                        }
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        {t("show.save_terms")}
                                                    </PrimaryButton>
                                                </div>
                                            </div>
                                        </form>
                                    </SectionCard>

                                    {/* Unified Preview for Drafts */}
                                    <div className="mt-6 border-t border-border pt-6 text-start">
                                        <h3 className="text-sm font-bold text-text mb-4">
                                            {lang === "ar"
                                                ? "معاينة العقد الموحد النشطة"
                                                : "Active Unified Contract Preview"}
                                        </h3>
                                        {renderUnifiedLayout(false)}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {renderUnifiedLayout(false)}
                                    <div className="flex justify-end print:hidden">
                                        <PrimaryButton
                                            type="button"
                                            onClick={() => window.print()}
                                        >
                                            <Printer className="h-4 w-4 me-2" />
                                            {t("show.print_contract")}
                                        </PrimaryButton>
                                    </div>
                                </div>
                            ))}

                        {/* Tab Content 2: Periods */}
                        {activeTab === "periods" && (
                            <SectionCard
                                title={t("show.periods_extension")}
                                icon={Calendar}
                                action={
                                    <div className="flex items-center gap-1.5">
                                        <Tooltip text={t("show.grid_view")}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPeriodViewMode("grid")
                                                }
                                                className={`flex items-center justify-center h-8 w-8 border border-border transition-colors ${
                                                    periodViewMode === "grid"
                                                        ? "bg-primary text-white"
                                                        : "bg-surface text-text-muted"
                                                }`}
                                            >
                                                <Grid className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <Tooltip text={t("show.list_view")}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setPeriodViewMode("list")
                                                }
                                                className={`flex items-center justify-center h-8 w-8 border border-border transition-colors ${
                                                    periodViewMode === "list"
                                                        ? "bg-primary text-white"
                                                        : "bg-surface text-text-muted"
                                                }`}
                                            >
                                                <List className="h-4 w-4" />
                                            </button>
                                        </Tooltip>
                                        <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                                setShowPeriodModal(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 me-1.5" />
                                            {t("show.extend_contract")}
                                        </PrimaryButton>
                                    </div>
                                }
                            >
                                {periodViewMode === "list" ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-start">
                                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3 w-20 text-center">
                                                        #
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.start_date")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.duration")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.end_date")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.services")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.status")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.actions")}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {contract.periods?.map(
                                                    (period) => (
                                                        <tr
                                                            key={period.id}
                                                            className="hover:bg-surface-muted/30 transition-colors"
                                                        >
                                                            <td className="px-4 py-3 text-center font-mono font-bold">
                                                                {
                                                                    period.period_number
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 font-mono">
                                                                {
                                                                    period.start_date
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-xs">
                                                                {getPeriodDurationMonths(
                                                                    period,
                                                                )}{" "}
                                                                {t(
                                                                    "show.months",
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 font-mono font-bold text-primary">
                                                                {
                                                                    period.end_date
                                                                }
                                                            </td>
                                                            <td className="px-4 py-3 text-xs text-text-muted">
                                                                {
                                                                    (
                                                                        period.items ||
                                                                        []
                                                                    ).length
                                                                }{" "}
                                                                {t(
                                                                    "show.period_items",
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${getPeriodStatusClass(
                                                                        period.status,
                                                                    )}`}
                                                                >
                                                                    {getPeriodStatusLabel(
                                                                        period.status,
                                                                    )}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Tooltip
                                                                        text={t(
                                                                            "show.view_period",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openPeriodDetails(
                                                                                    period,
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-primary"
                                                                        >
                                                                            <Eye className="h-4 w-4" />
                                                                        </button>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        text={t(
                                                                            "show.issue_invoice",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openInvoiceModalForPeriod(
                                                                                    period,
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-center h-8 w-8 border border-border bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                                        >
                                                                            <DollarSign className="h-4 w-4" />
                                                                        </button>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        text={t(
                                                                            "show.edit_period",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openPeriodEdit(
                                                                                    period,
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-primary"
                                                                        >
                                                                            <Edit3 className="h-4 w-4" />
                                                                        </button>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        text={t(
                                                                            "show.edit_period_items",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openPeriodItems(
                                                                                    period,
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-primary"
                                                                        >
                                                                            <Box className="h-4 w-4" />
                                                                        </button>
                                                                    </Tooltip>
                                                                    <Tooltip
                                                                        text={t(
                                                                            "show.open_financials",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openFinancialsForPeriod(
                                                                                    period.id,
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-primary"
                                                                        >
                                                                            <DollarSign className="h-4 w-4" />
                                                                        </button>
                                                                    </Tooltip>
                                                                    {period.status !==
                                                                    "active" ? (
                                                                        <Tooltip
                                                                            text={t(
                                                                                "show.activate_period",
                                                                            )}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openPeriodStatus(
                                                                                        period,
                                                                                        "active",
                                                                                    )
                                                                                }
                                                                                className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-emerald-600"
                                                                            >
                                                                                <Play className="h-4 w-4" />
                                                                            </button>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip
                                                                            text={t(
                                                                                "show.suspend_period",
                                                                            )}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    openPeriodStatus(
                                                                                        period,
                                                                                        "suspended",
                                                                                    )
                                                                                }
                                                                                className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-amber-600"
                                                                            >
                                                                                <Pause className="h-4 w-4" />
                                                                            </button>
                                                                        </Tooltip>
                                                                    )}
                                                                    <Tooltip
                                                                        text={t(
                                                                            "show.delete_period",
                                                                        )}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                openPeriodDelete(
                                                                                    period,
                                                                                )
                                                                            }
                                                                            className="flex items-center justify-center h-8 w-8 border border-border bg-surface text-text-muted hover:text-danger"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                    </Tooltip>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {contract.periods?.map((period) => (
                                            <div
                                                key={period.id}
                                                className="border border-border bg-surface p-4 space-y-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs text-text-muted font-bold">
                                                            {t(
                                                                "show.period_label",
                                                            )}
                                                        </p>
                                                        <p className="text-sm font-extrabold text-text">
                                                            {
                                                                period.period_number
                                                            }
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${getPeriodStatusClass(
                                                            period.status,
                                                        )}`}
                                                    >
                                                        {getPeriodStatusLabel(
                                                            period.status,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <Field
                                                        label={t(
                                                            "show.start_date",
                                                        )}
                                                        value={
                                                            period.start_date
                                                        }
                                                        dir="ltr"
                                                    />
                                                    <Field
                                                        label={t(
                                                            "show.end_date",
                                                        )}
                                                        value={period.end_date}
                                                        dir="ltr"
                                                    />
                                                    <Field
                                                        label={t(
                                                            "show.duration",
                                                        )}
                                                        value={`${getPeriodDurationMonths(period)} ${t("show.months")}`}
                                                    />
                                                    <Field
                                                        label={t(
                                                            "show.period_items",
                                                        )}
                                                        value={`${(period.items || []).length}`}
                                                    />
                                                </div>
                                                <p className="text-xs text-text-muted italic min-h-8">
                                                    {period.notes || "-"}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() =>
                                                            openPeriodDetails(
                                                                period,
                                                            )
                                                        }
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        <Eye className="h-3 w-3 me-1" />
                                                        {t("show.view")}
                                                    </SecondaryButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() =>
                                                            openInvoiceModalForPeriod(
                                                                period,
                                                            )
                                                        }
                                                        className="text-xs py-1 px-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                                    >
                                                        <DollarSign className="h-3 w-3 me-1" />
                                                        {t("show.issue_invoice")}
                                                    </SecondaryButton>
                                                    <SecondaryButton
                                                        type="button"
                                                        onClick={() =>
                                                            openFinancialsForPeriod(
                                                                period.id,
                                                            )
                                                        }
                                                        className="text-xs py-1 px-3"
                                                    >
                                                        {t(
                                                            "show.open_financials",
                                                        )}
                                                    </SecondaryButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {/* Tab Content 3: Contacts */}
                        {activeTab === "contacts" && (
                            <SectionCard
                                title={t("show.delegates_assigned")}
                                icon={Users}
                                action={
                                    <PrimaryButton
                                        type="button"
                                        onClick={() =>
                                            setShowAddContactModal(true)
                                        }
                                    >
                                        <Plus className="h-4 w-4 me-1.5" />
                                        {t("show.add_contract_delegate")}
                                    </PrimaryButton>
                                }
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-start">
                                        <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    {t("show.delegate_name")}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t("show.phone_number")}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t("show.authorities")}
                                                </th>
                                                <th className="px-4 py-3">
                                                    {t("show.status")}
                                                </th>
                                                <th className="px-4 py-3 text-end">
                                                    {t("show.actions")}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {contract.contract_agents?.map(
                                                (agent) => (
                                                    <tr
                                                        key={agent.id}
                                                        className="hover:bg-surface-muted/30 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 font-bold">
                                                            <div>
                                                                {agent.name}
                                                            </div>
                                                            <div className="text-[11px] text-text-muted font-normal">
                                                                {agent.job_title ||
                                                                    "�"}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 font-mono">
                                                            {agent.phone_number}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex gap-1.5">
                                                                {agent.can_sign && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                                                                        {t(
                                                                            "show.sign",
                                                                        )}
                                                                    </span>
                                                                )}
                                                                {agent.can_withdraw_goods && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">
                                                                        {t(
                                                                            "show.withdraw",
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                                    agent.status ===
                                                                    "active"
                                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                        : agent.status ===
                                                                            "suspended"
                                                                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                          : "bg-danger/10 text-danger border border-danger/20"
                                                                }`}
                                                            >
                                                                {agent.status ===
                                                                "active"
                                                                    ? t(
                                                                          "show.status_active",
                                                                      )
                                                                    : agent.status ===
                                                                        "suspended"
                                                                      ? t(
                                                                            "show.status_suspended",
                                                                        )
                                                                      : t(
                                                                            "show.deleted",
                                                                        )}
                                                            </span>
                                                            {agent.status_reason && (
                                                                <p className="text-[11px] text-text-muted italic mt-1">
                                                                    {
                                                                        agent.status_reason
                                                                    }
                                                                </p>
                                                            )}
                                                            {agent.deleted_at_custom && (
                                                                <p className="text-[10px] text-danger font-mono mt-0.5">
                                                                    {new Date(
                                                                        agent.deleted_at_custom,
                                                                    ).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-end space-x-1 space-x-reverse">
                                                            {agent.status ===
                                                                "active" && (
                                                                <SecondaryButton
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedContactAgent(
                                                                            agent,
                                                                        );
                                                                        setContactActionType(
                                                                            "suspended",
                                                                        );
                                                                        setShowStatusContactModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="text-xs py-1 px-2 border-amber-500/30 text-amber-600"
                                                                >
                                                                    {t(
                                                                        "show.suspend_short",
                                                                    )}
                                                                </SecondaryButton>
                                                            )}
                                                            {agent.status ===
                                                                "suspended" && (
                                                                <SecondaryButton
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedContactAgent(
                                                                            agent,
                                                                        );
                                                                        setContactActionType(
                                                                            "active",
                                                                        );
                                                                        handleContactStatusSubmit(
                                                                            {
                                                                                preventDefault:
                                                                                    () => [],
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="text-xs py-1 px-2 border-emerald-500/30 text-emerald-600"
                                                                >
                                                                    {t(
                                                                        "show.activate_short",
                                                                    )}
                                                                </SecondaryButton>
                                                            )}
                                                            {agent.status !==
                                                                "deleted" && (
                                                                <DangerButton
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedContactAgent(
                                                                            agent,
                                                                        );
                                                                        setContactActionType(
                                                                            "deleted",
                                                                        );
                                                                        setShowStatusContactModal(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="text-xs py-1 px-2"
                                                                >
                                                                    {t(
                                                                        "show.remove",
                                                                    )}
                                                                </DangerButton>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        )}

                        {/* Tab Content 4: Financials */}
                        {activeTab === "financials" && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                    <div className="w-full sm:w-72">
                                        <InputLabel
                                            value={t("show.filter_period")}
                                        />
                                        <select
                                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                            value={filterPeriodId}
                                            onChange={(e) =>
                                                setFilterPeriodId(
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="">
                                                {t("show.all_periods")}
                                            </option>
                                            {contract.periods?.map((period) => (
                                                <option
                                                    key={period.id}
                                                    value={period.id}
                                                >
                                                    {`${t("show.period_label")} ${period.period_number} - ${period.start_date}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Invoices */}
                                <SectionCard
                                    title={t("show.financial_dues")}
                                    icon={DollarSign}
                                    action={
                                        <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                                setShowInvoiceModal(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 me-1.5" />
                                            {t("show.issue_financial_invoice")}
                                        </PrimaryButton>
                                    }
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-start">
                                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">
                                                        {t(
                                                            "show.periods_extension",
                                                        )}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.invoice_no")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.issue_date")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.due_date")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.amount")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.paid")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.status")}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {financialInvoices.length ===
                                                0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan="7"
                                                            className="text-center py-6 text-xs text-text-muted"
                                                        >
                                                            {t(
                                                                "show.no_invoices",
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    financialInvoices.map(
                                                        (inv) => (
                                                            <tr
                                                                key={inv.id}
                                                                className="hover:bg-surface-muted/30 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 font-bold text-xs">
                                                                    {inv.period
                                                                        ?.period_number ||
                                                                        "-"}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono font-bold text-primary">
                                                                    {
                                                                        inv.invoice_number
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3 font-mono">
                                                                    {
                                                                        inv.date
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3 font-mono">
                                                                    {
                                                                        inv.due_date
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 font-mono font-bold"
                                                                    dir="ltr"
                                                                >
                                                                    {inv.total_amount}
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 font-mono font-bold text-emerald-600"
                                                                    dir="ltr"
                                                                >
                                                                    {
                                                                        inv.paid_amount
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                                            inv.status ===
                                                                            "paid"
                                                                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                                : inv.status ===
                                                                                    "partially_paid"
                                                                                  ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                                                                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                                                        }`}
                                                                    >
                                                                        {inv.status ===
                                                                        "paid"
                                                                            ? t(
                                                                                  "show.status_paid",
                                                                              )
                                                                            : inv.status ===
                                                                                "partially_paid"
                                                                              ? lang ===
                                                                                "ar"
                                                                                  ? "������ ������"
                                                                                  : "Partially Paid"
                                                                              : lang ===
                                                                                  "ar"
                                                                                ? "��� ������"
                                                                                : "Unpaid"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </SectionCard>

                                {/* Payments */}
                                <SectionCard
                                    title={t("show.cash_payments")}
                                    icon={CreditCard}
                                    action={
                                        <PrimaryButton
                                            type="button"
                                            onClick={() =>
                                                setShowPaymentModal(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 me-1.5" />
                                            {t("show.record_cash_payment")}
                                        </PrimaryButton>
                                    }
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-start">
                                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">
                                                        {t(
                                                            "show.periods_extension",
                                                        )}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.date")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t("show.amount")}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t(
                                                            "show.payment_method",
                                                        )}
                                                    </th>
                                                    <th className="px-4 py-3">
                                                        {t(
                                                            "show.reference_notes",
                                                        )}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {financialPayments.length ===
                                                0 ? (
                                                    <tr>
                                                        <td
                                                            colSpan="5"
                                                            className="text-center py-6 text-xs text-text-muted"
                                                        >
                                                            {t(
                                                                "show.no_payments",
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    financialPayments.map(
                                                        (p) => (
                                                            <tr
                                                                key={p.id}
                                                                className="hover:bg-surface-muted/30 transition-colors"
                                                            >
                                                                <td className="px-4 py-3 font-bold text-xs">
                                                                    {p.period
                                                                        ?.period_number ||
                                                                        "-"}
                                                                </td>
                                                                <td className="px-4 py-3 font-mono">
                                                                    {
                                                                        p.payment_date
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 font-mono font-extrabold text-emerald-600"
                                                                    dir="ltr"
                                                                >
                                                                    {p.amount}
                                                                </td>
                                                                <td className="px-4 py-3 font-bold">
                                                                    {p.method ===
                                                                    "cash"
                                                                        ? t(
                                                                              "show.cash",
                                                                          )
                                                                        : p.method ===
                                                                            "cheque"
                                                                          ? t(
                                                                                "show.cheque",
                                                                            )
                                                                          : t(
                                                                                "show.bank_transfer",
                                                                            )}
                                                                </td>
                                                                <td className="px-4 py-3 text-xs text-text-muted italic">
                                                                    {p.reference ||
                                                                        p.notes ||
                                                                        ""}
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </SectionCard>

                                {/* Financial Vouchers */}
                                <SectionCard
                                    title={lang === 'ar' ? 'سندات القبض (المالية)' : 'Receipt Vouchers (Financial)'}
                                    icon={FileSpreadsheet}
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-start">
                                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">{lang === 'ar' ? 'رقم السند' : 'Voucher No'}</th>
                                                    <th className="px-4 py-3">{t("show.date")}</th>
                                                    <th className="px-4 py-3">{t("show.amount")}</th>
                                                    <th className="px-4 py-3">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                                                    <th className="px-4 py-3 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                                    <th className="px-4 py-3 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {financialVouchers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="6" className="text-center py-6 text-xs text-text-muted">
                                                            {lang === 'ar' ? 'لا توجد سندات مسجلة' : 'No vouchers'}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    financialVouchers.map((v) => (
                                                        <tr key={v.id} className="hover:bg-surface-muted/30 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-primary font-mono text-xs">{v.voucher_number}</td>
                                                            <td className="px-4 py-3 font-mono" dir="ltr">{new Date(v.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 font-mono font-extrabold text-emerald-600" dir="ltr">{Number(v.amount).toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-xs text-text-muted">{v.description}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                                    v.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                                }`}>
                                                                    {v.status === 'approved' ? (lang === 'ar' ? 'معتمد' : 'Approved') : (lang === 'ar' ? 'مسودة' : 'Draft')}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-end">
                                                                <div className="flex justify-end gap-2">
                                                                    {v.status === 'draft' && (
                                                                        <PrimaryButton 
                                                                            type="button" 
                                                                            className="!py-1 !px-2 !text-[10px]"
                                                                            onClick={() => {
                                                                                if (confirm(lang === 'ar' ? 'تأكيد اعتماد السند وإنشاء قيد؟' : 'Confirm approve and post?')) {
                                                                                    router.post(route('accounting.financial-vouchers.approve', v.id), {}, {preserveScroll: true});
                                                                                }
                                                                            }}
                                                                        >
                                                                            {lang === 'ar' ? 'اعتماد السند' : 'Approve'}
                                                                        </PrimaryButton>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </SectionCard>

                            </div>
                        )}

                        {/* Tab Content 5: Vouchers (Dynamic & Progressive) */}
                        {activeTab === "vouchers" && (
                            <div className="space-y-4 text-start">
                                <SectionCard
                                    title={t("show.vouchers_history")}
                                    icon={FileSpreadsheet}
                                >
                                    {/* Search & Filter Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 mb-4 bg-surface-muted/10 p-3 rounded-xl border border-border">
                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "رقم السند"
                                                    : "Voucher Serial"}
                                            </label>
                                            <input
                                                type="text"
                                                value={filterSerial}
                                                onChange={(e) =>
                                                    setFilterSerial(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "ابحث بالسيريال..."
                                                        : "Search serial..."
                                                }
                                                className="w-full text-xs h-[30px] px-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "رقم الطبلية"
                                                    : "Pallet Number"}
                                            </label>
                                            <input
                                                type="text"
                                                value={filterPallet}
                                                onChange={(e) =>
                                                    setFilterPallet(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "رقم الطبلية..."
                                                        : "Pallet number..."
                                                }
                                                className="w-full text-xs h-[30px] px-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "الفترة المالية"
                                                    : "Billing Period"}
                                            </label>
                                            <select
                                                value={filterPeriodId}
                                                onChange={(e) =>
                                                    setFilterPeriodId(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "كل الفترات"
                                                        : "All Periods"}
                                                </option>
                                                {contract.periods?.map((p) => (
                                                    <option
                                                        key={p.id}
                                                        value={p.id}
                                                    >
                                                        {lang === "ar"
                                                            ? `فترة ${p.period_number}`
                                                            : `Period ${p.period_number}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "الحالة"
                                                    : "Status"}
                                            </label>
                                            <select
                                                value={filterStatus}
                                                onChange={(e) =>
                                                    setFilterStatus(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "كل الحالات"
                                                        : "All Statuses"}
                                                </option>
                                                <option value="draft">
                                                    {lang === "ar"
                                                        ? "مسودة"
                                                        : "Draft"}
                                                </option>
                                                <option value="approved">
                                                    {lang === "ar"
                                                        ? "معتمد"
                                                        : "Approved"}
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "النوع"
                                                    : "Type"}
                                            </label>
                                            <select
                                                value={filterType}
                                                onChange={(e) =>
                                                    setFilterType(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "كل الأنواع"
                                                        : "All Types"}
                                                </option>
                                                <option value="reception">
                                                    {lang === "ar"
                                                        ? "سند استلام"
                                                        : "Reception"}
                                                </option>
                                                <option value="delivery">
                                                    {lang === "ar"
                                                        ? "سند صرف"
                                                        : "Delivery"}
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "نوع البضاعة"
                                                    : "Goods Type"}
                                            </label>
                                            <select
                                                value={filterGoodsType}
                                                onChange={(e) =>
                                                    setFilterGoodsType(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "كل الأصناف"
                                                        : "All Items"}
                                                </option>
                                                {vouchersGoodsTypes.map(
                                                    (item) => (
                                                        <option
                                                            key={item.id}
                                                            value={item.id}
                                                        >
                                                            {displayBilingual(
                                                                item.name,
                                                            )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "من تاريخ"
                                                    : "From Date"}
                                            </label>
                                            <input
                                                type="date"
                                                value={filterStartDate}
                                                onChange={(e) =>
                                                    setFilterStartDate(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "إلى تاريخ"
                                                    : "To Date"}
                                            </label>
                                            <input
                                                type="date"
                                                value={filterEndDate}
                                                onChange={(e) =>
                                                    setFilterEndDate(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    {/* View Mode & Selection Controls */}
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 flex-wrap font-bold">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "تحديد الكل"
                                                        : "Select All"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAll}
                                                    className="flex items-center justify-center gap-1 h-[30px] px-2.5 text-xs font-bold bg-surface border border-border hover:bg-surface-muted rounded-lg hover:translate-y-[-2px] hover:shadow-sm transition-all duration-200"
                                                >
                                                    <Check className="h-3.5 w-3.5 text-primary" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "تحديد الكل"
                                                                : "Select All"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إلغاء التحديد"
                                                        : "Deselect All"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleDeselectAll}
                                                    className="flex items-center justify-center gap-1 h-[30px] px-2.5 text-xs font-bold bg-surface border border-border hover:bg-surface-muted rounded-lg hover:translate-y-[-2px] hover:shadow-sm transition-all duration-200"
                                                >
                                                    <XCircle className="h-3.5 w-3.5 text-text-muted" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إلغاء"
                                                                : "Deselect"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "عكس التحديد"
                                                        : "Invert Selection"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleInvertSelection
                                                    }
                                                    className="flex items-center justify-center gap-1 h-[30px] px-2.5 text-xs font-bold bg-surface border border-border hover:bg-surface-muted rounded-lg hover:translate-y-[-2px] hover:shadow-sm transition-all duration-200"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5 text-text" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "عكس"
                                                                : "Invert"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إعادة تعيين الفلاتر"
                                                        : "Reset Filters"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFilterSerial("");
                                                        setFilterPallet("");
                                                        setFilterPeriodId("");
                                                        setFilterStatus("");
                                                        setFilterType("");
                                                        setFilterGoodsType("");
                                                        setFilterStartDate("");
                                                        setFilterEndDate("");
                                                    }}
                                                    className="flex items-center justify-center gap-1 h-[30px] px-2.5 text-xs font-bold bg-surface border border-border hover:bg-surface-muted rounded-lg hover:translate-y-[-2px] hover:shadow-sm transition-all duration-200 text-danger"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إعادة ضبط"
                                                                : "Reset"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "عرض شبكي"
                                                        : "Grid View"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewMode("grid")
                                                    }
                                                    className={`flex items-center justify-center h-[30px] w-[30px] rounded-lg border transition-all duration-200 ${
                                                        viewMode === "grid"
                                                            ? "bg-primary border-primary text-white"
                                                            : "bg-surface border-border text-text-muted hover:bg-surface-muted hover:translate-y-[-2px]"
                                                    }`}
                                                >
                                                    <Grid className="h-4 w-4" />
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "عرض قائمة"
                                                        : "List View"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setViewMode("list")
                                                    }
                                                    className={`flex items-center justify-center h-[30px] w-[30px] rounded-lg border transition-all duration-200 ${
                                                        viewMode === "list"
                                                            ? "bg-primary border-primary text-white"
                                                            : "bg-surface border-border text-text-muted hover:bg-surface-muted hover:translate-y-[-2px]"
                                                    }`}
                                                >
                                                    <List className="h-4 w-4" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Data Contents */}
                                    {vouchersLoading ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                                            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                            <span className="text-xs text-text-muted font-bold">
                                                {lang === "ar"
                                                    ? "جاري تحميل السندات..."
                                                    : "Loading vouchers..."}
                                            </span>
                                        </div>
                                    ) : vouchers.length === 0 ? (
                                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                                            <FileSpreadsheet className="h-12 w-12 text-primary/40 mb-3" />
                                            <p className="text-sm font-bold text-text mb-1">
                                                {lang === "ar"
                                                    ? "لا توجد سندات مطابقة للبحث"
                                                    : "No matching vouchers found"}
                                            </p>
                                            <p className="text-xs text-text-muted max-w-md leading-relaxed">
                                                {lang === "ar"
                                                    ? "تأكد من تعديل معايير البحث أو اختيار فترة مالية أخرى للبحث عن السندات المطلوبة."
                                                    : "Adjust search criteria or select another period to find vouchers."}
                                            </p>
                                        </div>
                                    ) : viewMode === "grid" ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {vouchers.map((voucher) => {
                                                const isReception =
                                                    voucher.voucher_type ===
                                                    "reception";
                                                const isSelected =
                                                    isVoucherSelected(
                                                        voucher.id,
                                                        voucher.voucher_type,
                                                    );
                                                return (
                                                    <div
                                                        key={`${voucher.voucher_type}-${voucher.id}`}
                                                        className={`rounded-xl border bg-surface shadow-sm overflow-hidden flex flex-col hover:translate-y-[-2px] hover:shadow-md transition-all duration-200 ${
                                                            isSelected
                                                                ? "border-primary ring-1 ring-primary"
                                                                : "border-border"
                                                        }`}
                                                    >
                                                        {/* Card Header */}
                                                        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-muted/30">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleSelectVoucher(
                                                                            voucher.id,
                                                                            voucher.voucher_type,
                                                                            e
                                                                                .target
                                                                                .checked,
                                                                        )
                                                                    }
                                                                    className="h-3.5 w-3.5 rounded text-primary focus:ring-primary border-border"
                                                                />
                                                                <span
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                        isReception
                                                                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                            : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                                                    }`}
                                                                >
                                                                    {isReception
                                                                        ? lang ===
                                                                          "ar"
                                                                            ? "استلام"
                                                                            : "Reception"
                                                                        : lang ===
                                                                            "ar"
                                                                          ? "صرف"
                                                                          : "Delivery"}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-text-muted font-mono font-bold">
                                                                {lang === "ar"
                                                                    ? `فترة ${voucher.period?.period_number || "—"}`
                                                                    : `Period ${voucher.period?.period_number || "—"}`}
                                                            </span>
                                                        </div>

                                                        {/* Card Body */}
                                                        <div className="p-3 flex-1 flex flex-col gap-2.5 text-start font-sans">
                                                            <div>
                                                                <a
                                                                    href={
                                                                        isReception
                                                                            ? route(
                                                                                  "receptions.show",
                                                                                  voucher.id,
                                                                              )
                                                                            : route(
                                                                                  "deliveries.show",
                                                                                  voucher.id,
                                                                              )
                                                                    }
                                                                    className="text-xs font-black text-primary hover:underline font-mono"
                                                                >
                                                                    {
                                                                        voucher.serial_number
                                                                    }
                                                                </a>
                                                                <p className="text-[10px] text-text-muted font-mono mt-0.5">
                                                                    {voucher.date
                                                                        ? new Date(
                                                                              voucher.date,
                                                                          ).toLocaleDateString(
                                                                              lang ===
                                                                                  "ar"
                                                                                  ? "ar-EG"
                                                                                  : "en-US",
                                                                          )
                                                                        : "—"}
                                                                </p>
                                                            </div>

                                                            {/* Contents Summary */}
                                                            <div className="grid grid-cols-3 gap-1 py-1.5 px-2 rounded-lg bg-surface-muted/30 border border-border/50 text-center text-xs">
                                                                <div>
                                                                    <p className="text-[9px] text-text-muted font-bold">
                                                                        {lang ===
                                                                        "ar"
                                                                            ? "طبالي"
                                                                            : "Pallets"}
                                                                    </p>
                                                                    <p className="font-extrabold text-text font-mono mt-0.5">
                                                                        {
                                                                            voucher.pallet_count
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] text-text-muted font-bold">
                                                                        {lang ===
                                                                        "ar"
                                                                            ? "عبوات"
                                                                            : "Packages"}
                                                                    </p>
                                                                    <p className="font-extrabold text-text font-mono mt-0.5">
                                                                        {Math.round(
                                                                            voucher.package_count ||
                                                                                0,
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[9px] text-text-muted font-bold">
                                                                        {lang ===
                                                                        "ar"
                                                                            ? "أصناف"
                                                                            : "Items"}
                                                                    </p>
                                                                    <p className="font-extrabold text-text font-mono mt-0.5">
                                                                        {
                                                                            voucher.item_count
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {voucher.notes && (
                                                                <p className="text-[10px] text-text-muted line-clamp-1 italic">
                                                                    {
                                                                        voucher.notes
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Card Footer */}
                                                        <div className="px-3 py-2 border-t border-border bg-surface-muted/20 flex items-center justify-between">
                                                            <span
                                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                                    voucher.status ===
                                                                    "approved"
                                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                        : "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                                                                }`}
                                                            >
                                                                {voucher.status ===
                                                                "approved"
                                                                    ? lang ===
                                                                      "ar"
                                                                        ? "معتمد"
                                                                        : "Approved"
                                                                    : lang ===
                                                                        "ar"
                                                                      ? "مسودة"
                                                                      : "Draft"}
                                                            </span>

                                                            <div className="flex items-center gap-1 font-bold">
                                                                <Tooltip
                                                                    text={
                                                                        lang ===
                                                                        "ar"
                                                                            ? "عرض التفاصيل"
                                                                            : "View details"
                                                                    }
                                                                >
                                                                    <a
                                                                        href={
                                                                            isReception
                                                                                ? route(
                                                                                      "receptions.show",
                                                                                      voucher.id,
                                                                                  )
                                                                                : route(
                                                                                      "deliveries.show",
                                                                                      voucher.id,
                                                                                  )
                                                                        }
                                                                        className="flex items-center justify-center h-6 w-6 rounded-lg bg-surface border border-border text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </a>
                                                                </Tooltip>

                                                                {voucher.status ===
                                                                    "draft" && (
                                                                    <Tooltip
                                                                        text={
                                                                            lang ===
                                                                            "ar"
                                                                                ? "تعديل"
                                                                                : "Edit"
                                                                        }
                                                                    >
                                                                        <a
                                                                            href={
                                                                                isReception
                                                                                    ? route(
                                                                                          "receptions.edit",
                                                                                          voucher.id,
                                                                                      )
                                                                                    : route(
                                                                                          "deliveries.edit",
                                                                                          voucher.id,
                                                                                      )
                                                                            }
                                                                            className="flex items-center justify-center h-6 w-6 rounded-lg bg-surface border border-border text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                                                                        >
                                                                            <Edit3 className="h-3.5 w-3.5 text-primary" />
                                                                        </a>
                                                                    </Tooltip>
                                                                )}

                                                                <Tooltip
                                                                    text={
                                                                        lang ===
                                                                        "ar"
                                                                            ? "طباعة"
                                                                            : "Print"
                                                                    }
                                                                >
                                                                    <a
                                                                        href={
                                                                            isReception
                                                                                ? route(
                                                                                      "receptions.print",
                                                                                      voucher.id,
                                                                                  )
                                                                                : route(
                                                                                      "deliveries.print",
                                                                                      voucher.id,
                                                                                  )
                                                                        }
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex items-center justify-center h-6 w-6 rounded-lg bg-surface border border-border text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                                                                    >
                                                                        <Printer className="h-3.5 w-3.5 text-emerald-600" />
                                                                    </a>
                                                                </Tooltip>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm font-sans">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-start border-collapse">
                                                    <thead>
                                                        <tr className="bg-surface-muted/40 border-b border-border text-text-muted font-bold text-[10px] uppercase">
                                                            <th className="px-4 py-2.5 text-start w-10"></th>
                                                            <th className="px-4 py-2.5 text-start w-12">
                                                                {lang === "ar"
                                                                    ? "م"
                                                                    : "#"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "الرقم المسلسل"
                                                                    : "Serial Number"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "التاريخ"
                                                                    : "Date"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "النوع"
                                                                    : "Type"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "الفترة"
                                                                    : "Period"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "طبالي"
                                                                    : "Pallets"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "عبوات"
                                                                    : "Packages"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "أصناف"
                                                                    : "Items"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "الحالة"
                                                                    : "Status"}
                                                            </th>
                                                            <th className="px-4 py-2.5 text-end w-28">
                                                                {lang === "ar"
                                                                    ? "الإجراءات"
                                                                    : "Actions"}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {vouchers.map(
                                                            (voucher, idx) => {
                                                                const isReception =
                                                                    voucher.voucher_type ===
                                                                    "reception";
                                                                const isSelected =
                                                                    isVoucherSelected(
                                                                        voucher.id,
                                                                        voucher.voucher_type,
                                                                    );
                                                                return (
                                                                    <tr
                                                                        key={`${voucher.voucher_type}-${voucher.id}`}
                                                                        className={`hover:bg-surface-muted/30 text-start ${isSelected ? "bg-primary/5" : ""}`}
                                                                    >
                                                                        <td className="px-4 py-2.5 text-start">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    isSelected
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    handleSelectVoucher(
                                                                                        voucher.id,
                                                                                        voucher.voucher_type,
                                                                                        e
                                                                                            .target
                                                                                            .checked,
                                                                                    )
                                                                                }
                                                                                className="h-3.5 w-3.5 rounded text-primary focus:ring-primary border-border"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2.5 font-mono text-text-muted">
                                                                            {(vouchersPage -
                                                                                1) *
                                                                                24 +
                                                                                idx +
                                                                                1}
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <a
                                                                                href={
                                                                                    isReception
                                                                                        ? route(
                                                                                              "receptions.show",
                                                                                              voucher.id,
                                                                                          )
                                                                                        : route(
                                                                                              "deliveries.show",
                                                                                              voucher.id,
                                                                                          )
                                                                                }
                                                                                className="font-black text-primary hover:underline font-mono"
                                                                            >
                                                                                {
                                                                                    voucher.serial_number
                                                                                }
                                                                            </a>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 font-mono text-text-muted">
                                                                            {voucher.date
                                                                                ? new Date(
                                                                                      voucher.date,
                                                                                  ).toLocaleDateString(
                                                                                      lang ===
                                                                                          "ar"
                                                                                          ? "ar-EG"
                                                                                          : "en-US",
                                                                                  )
                                                                                : "—"}
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <span
                                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                                    isReception
                                                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                                                                }`}
                                                                            >
                                                                                {isReception
                                                                                    ? lang ===
                                                                                      "ar"
                                                                                        ? "استلام"
                                                                                        : "Reception"
                                                                                    : lang ===
                                                                                        "ar"
                                                                                      ? "صرف بضاعة"
                                                                                      : "Delivery"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <span className="font-semibold text-text-muted">
                                                                                {lang ===
                                                                                "ar"
                                                                                    ? `فترة ${voucher.period?.period_number || "—"}`
                                                                                    : `Period ${voucher.period?.period_number || "—"}`}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-center font-mono font-bold text-text-muted">
                                                                            {
                                                                                voucher.pallet_count
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-center font-mono font-bold text-text-muted">
                                                                            {Math.round(
                                                                                voucher.package_count ||
                                                                                    0,
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-center font-mono font-bold text-text-muted">
                                                                            {
                                                                                voucher.item_count
                                                                            }
                                                                        </td>
                                                                        <td className="px-4 py-2.5">
                                                                            <span
                                                                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                                                    voucher.status ===
                                                                                    "approved"
                                                                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                                                        : "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                                                                                }`}
                                                                            >
                                                                                {voucher.status ===
                                                                                "approved"
                                                                                    ? lang ===
                                                                                      "ar"
                                                                                        ? "معتمد"
                                                                                        : "Approved"
                                                                                    : lang ===
                                                                                        "ar"
                                                                                      ? "مسودة"
                                                                                      : "Draft"}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-2.5 text-end flex items-center justify-end gap-1 font-bold">
                                                                            <Tooltip
                                                                                text={
                                                                                    lang ===
                                                                                    "ar"
                                                                                        ? "عرض التفاصيل"
                                                                                        : "View details"
                                                                                }
                                                                            >
                                                                                <a
                                                                                    href={
                                                                                        isReception
                                                                                            ? route(
                                                                                                  "receptions.show",
                                                                                                  voucher.id,
                                                                                              )
                                                                                            : route(
                                                                                                  "deliveries.show",
                                                                                                  voucher.id,
                                                                                              )
                                                                                    }
                                                                                    className="flex items-center justify-center h-6 w-6 rounded-lg bg-surface border border-border text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                                                                                >
                                                                                    <Eye className="h-3.5 w-3.5" />
                                                                                </a>
                                                                            </Tooltip>

                                                                            {voucher.status ===
                                                                                "draft" && (
                                                                                <Tooltip
                                                                                    text={
                                                                                        lang ===
                                                                                        "ar"
                                                                                            ? "تعديل"
                                                                                            : "Edit"
                                                                                    }
                                                                                >
                                                                                    <a
                                                                                        href={
                                                                                            isReception
                                                                                                ? route(
                                                                                                      "receptions.edit",
                                                                                                      voucher.id,
                                                                                                  )
                                                                                                : route(
                                                                                                      "deliveries.edit",
                                                                                                      voucher.id,
                                                                                                  )
                                                                                        }
                                                                                        className="flex items-center justify-center h-6 w-6 rounded-lg bg-surface border border-border text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                                                                                    >
                                                                                        <Edit3 className="h-3.5 w-3.5 text-primary" />
                                                                                    </a>
                                                                                </Tooltip>
                                                                            )}

                                                                            <Tooltip
                                                                                text={
                                                                                    lang ===
                                                                                    "ar"
                                                                                        ? "طباعة"
                                                                                        : "Print"
                                                                                }
                                                                            >
                                                                                <a
                                                                                    href={
                                                                                        isReception
                                                                                            ? route(
                                                                                                  "receptions.print",
                                                                                                  voucher.id,
                                                                                              )
                                                                                            : route(
                                                                                                  "deliveries.print",
                                                                                                  voucher.id,
                                                                                              )
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="flex items-center justify-center h-6 w-6 rounded-lg bg-surface border border-border text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                                                                                >
                                                                                    <Printer className="h-3.5 w-3.5 text-emerald-600" />
                                                                                </a>
                                                                            </Tooltip>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {!vouchersLoading &&
                                        vouchersLastPage > 1 && (
                                            <div className="flex justify-between items-center gap-2 mt-4 px-2">
                                                <span className="text-xs text-text-muted font-bold">
                                                    {lang === "ar"
                                                        ? `عرض صفحة ${vouchersPage} من أصل ${vouchersLastPage} (إجمالي ${vouchersTotal} سجل)`
                                                        : `Showing page ${vouchersPage} of ${vouchersLastPage} (Total ${vouchersTotal} entries)`}
                                                </span>
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            vouchersPage === 1
                                                        }
                                                        onClick={() =>
                                                            setVouchersPage(
                                                                (prev) =>
                                                                    Math.max(
                                                                        1,
                                                                        prev -
                                                                            1,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex items-center justify-center h-[30px] px-3 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all"
                                                    >
                                                        {lang === "ar"
                                                            ? "السابق"
                                                            : "Prev"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            vouchersPage ===
                                                            vouchersLastPage
                                                        }
                                                        onClick={() =>
                                                            setVouchersPage(
                                                                (prev) =>
                                                                    Math.min(
                                                                        vouchersLastPage,
                                                                        prev +
                                                                            1,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex items-center justify-center h-[30px] px-3 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all"
                                                    >
                                                        {lang === "ar"
                                                            ? "التالي"
                                                            : "Next"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </SectionCard>

                                {/* Bulk actions floating footer */}
                                {selectedVouchers.length > 0 && (
                                    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-surface/90 backdrop-blur border border-primary/20 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-6 max-w-xl w-[90%] transition-all animate-bounce">
                                        <div className="flex items-center gap-2 text-start font-sans">
                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                                            <div>
                                                <p className="text-xs font-extrabold text-text">
                                                    {lang === "ar"
                                                        ? `تم تحديد ${selectedVouchers.length} عنصر`
                                                        : `${selectedVouchers.length} items selected`}
                                                </p>
                                                <p className="text-[10px] text-text-muted">
                                                    {lang === "ar"
                                                        ? "اختر إجراء مجمع لتنفيذه:"
                                                        : "Choose a bulk action:"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 font-bold">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "طباعة السندات المحددة"
                                                        : "Print selected"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleBulkPrint}
                                                    className="flex items-center justify-center gap-1.5 h-[30px] px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg hover:translate-y-[-2px] hover:shadow-md transition-all duration-200"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "طباعة"
                                                                : "Print"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "اعتماد السندات المحددة"
                                                        : "Approve selected"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBulkError("");
                                                        setBulkPassword("");
                                                        setShowBulkApproveModal(
                                                            true,
                                                        );
                                                    }}
                                                    className="flex items-center justify-center gap-1.5 h-[30px] px-3 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-lg hover:translate-y-[-2px] hover:shadow-md transition-all duration-200"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "اعتماد"
                                                                : "Approve"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إعادة السندات للتعديل"
                                                        : "Reopen selected"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setBulkError("");
                                                        setBulkPassword("");
                                                        setBulkReopenReason("");
                                                        setShowBulkReopenModal(
                                                            true,
                                                        );
                                                    }}
                                                    className="flex items-center justify-center gap-1.5 h-[30px] px-3 text-xs font-bold bg-warning hover:bg-warning/90 text-white rounded-lg hover:translate-y-[-2px] hover:shadow-md transition-all duration-200"
                                                >
                                                    <Unlock className="h-3.5 w-3.5" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إعادة للتعديل"
                                                                : "Reopen"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                )}

                                {/* Bulk Approve Confirmation Modal */}
                                <Modal
                                    show={showBulkApproveModal}
                                    onClose={() =>
                                        setShowBulkApproveModal(false)
                                    }
                                    maxWidth="md"
                                >
                                    <div className="p-5 text-start font-sans">
                                        <div className="flex items-center gap-2 text-primary border-b border-border pb-3 mb-4">
                                            <CheckCircle2 className="h-5 w-5 text-primary" />
                                            <h2 className="text-sm font-extrabold text-text">
                                                {lang === "ar"
                                                    ? "تأكيد اعتماد السندات المحددة"
                                                    : "Confirm Bulk Approve"}
                                            </h2>
                                        </div>

                                        <p className="text-xs text-text-muted mb-4 leading-relaxed font-semibold">
                                            {lang === "ar"
                                                ? `أنت على وشك اعتماد عدد (${selectedVouchers.length}) سند استلام/صرف دفعة واحدة. يرجى إدخال كلمة مرور التأكيد الآمنة للمتابعة وتثبيت الحركات على مخزون العقد:`
                                                : `You are about to approve (${selectedVouchers.length}) reception/delivery vouchers at once. Please enter your secure password to verify and post these movements to contract warehouse balance:`}
                                        </p>

                                        {bulkError && (
                                            <div className="bg-danger/10 text-danger border border-danger/20 p-2.5 rounded-lg text-xs font-semibold mb-4 flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>{bulkError}</span>
                                            </div>
                                        )}

                                        <div className="mb-5">
                                            <InputLabel
                                                htmlFor="bulk_approve_password"
                                                value={
                                                    lang === "ar"
                                                        ? "كلمة المرور الآمنة للتأكيد"
                                                        : "Secure Confirmation Password"
                                                }
                                                className="text-xs font-bold text-text-muted mb-1.5"
                                            />
                                            <TextInput
                                                id="bulk_approve_password"
                                                type="password"
                                                value={bulkPassword}
                                                onChange={(e) =>
                                                    setBulkPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "أدخل كلمة مرور التأكيد الآمنة..."
                                                        : "Enter secure password..."
                                                }
                                                className="w-full text-xs"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-3 border-t border-border font-bold">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إلغاء التراجع"
                                                        : "Cancel"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowBulkApproveModal(
                                                            false,
                                                        )
                                                    }
                                                    disabled={
                                                        bulkActionProcessing
                                                    }
                                                    className="flex items-center justify-center gap-1 h-[30px] px-3.5 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all duration-200"
                                                >
                                                    <XCircle className="h-4 w-4 text-text-muted" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إلغاء"
                                                                : "Cancel"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "تأكيد الاعتماد المجمع"
                                                        : "Confirm Bulk Approve"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleBulkApprove}
                                                    disabled={
                                                        bulkActionProcessing ||
                                                        !bulkPassword
                                                    }
                                                    className="flex items-center justify-center gap-1 h-[30px] px-3.5 text-xs font-bold bg-primary text-white hover:bg-primary/90 hover:translate-y-[-2px] hover:shadow-md disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none rounded-lg transition-all duration-200"
                                                >
                                                    {bulkActionProcessing ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                                    )}
                                                    {showButtonText && (
                                                        <span>
                                                            {bulkActionProcessing
                                                                ? lang === "ar"
                                                                    ? "جاري الاعتماد..."
                                                                    : "Approving..."
                                                                : lang === "ar"
                                                                  ? "تأكيد الاعتماد"
                                                                  : "Confirm Approve"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </Modal>

                                {/* Bulk Reopen Confirmation Modal */}
                                <Modal
                                    show={showBulkReopenModal}
                                    onClose={() =>
                                        setShowBulkReopenModal(false)
                                    }
                                    maxWidth="md"
                                >
                                    <div className="p-5 text-start font-sans">
                                        <div className="flex items-center gap-2 text-warning border-b border-border pb-3 mb-4">
                                            <Unlock className="h-5 w-5 text-warning" />
                                            <h2 className="text-sm font-extrabold text-text">
                                                {lang === "ar"
                                                    ? "إعادة السندات المحددة للتعديل (مسودة)"
                                                    : "Reopen Selected Vouchers (Draft)"}
                                            </h2>
                                        </div>

                                        <p className="text-xs text-text-muted mb-4 leading-relaxed font-semibold">
                                            {lang === "ar"
                                                ? `أنت على وشك إلغاء اعتماد عدد (${selectedVouchers.length}) سند وإعادتهم لحالة مسودة. يرجى إدخال سبب إعادة الفتح وكلمة المرور الآمنة للمتابعة:`
                                                : `You are about to cancel approval of (${selectedVouchers.length}) vouchers and revert them to Draft status. Please input the reason and your secure password:`}
                                        </p>

                                        {bulkError && (
                                            <div className="bg-danger/10 text-danger border border-danger/20 p-2.5 rounded-lg text-xs font-semibold mb-4 flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>{bulkError}</span>
                                            </div>
                                        )}

                                        <div className="mb-4 text-start">
                                            <InputLabel
                                                htmlFor="bulk_reopen_reason"
                                                value={
                                                    lang === "ar"
                                                        ? "سبب إعادة الفتح للتعديل"
                                                        : "Reason for Reopening"
                                                }
                                                className="text-xs font-bold text-text-muted mb-1.5"
                                            />
                                            <textarea
                                                id="bulk_reopen_reason"
                                                rows="3"
                                                value={bulkReopenReason}
                                                onChange={(e) =>
                                                    setBulkReopenReason(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "أدخل سبب إلغاء الاعتماد بالتفصيل (5 أحرف على الأقل)..."
                                                        : "Explain why you are reopening these vouchers (at least 5 characters)..."
                                                }
                                                className="w-full text-xs border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary p-2"
                                                required
                                            />
                                        </div>

                                        <div className="mb-5">
                                            <InputLabel
                                                htmlFor="bulk_reopen_password"
                                                value={
                                                    lang === "ar"
                                                        ? "كلمة المرور الآمنة للتأكيد"
                                                        : "Secure Confirmation Password"
                                                }
                                                className="text-xs font-bold text-text-muted mb-1.5"
                                            />
                                            <TextInput
                                                id="bulk_reopen_password"
                                                type="password"
                                                value={bulkPassword}
                                                onChange={(e) =>
                                                    setBulkPassword(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "أدخل كلمة مرور التأكيد الآمنة..."
                                                        : "Enter secure password..."
                                                }
                                                className="w-full text-xs"
                                                required
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 pt-3 border-t border-border font-bold">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إلغاء التراجع"
                                                        : "Cancel"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowBulkReopenModal(
                                                            false,
                                                        )
                                                    }
                                                    disabled={
                                                        bulkActionProcessing
                                                    }
                                                    className="flex items-center justify-center gap-1 h-[30px] px-3.5 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all duration-200"
                                                >
                                                    <XCircle className="h-4 w-4 text-text-muted" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إلغاء"
                                                                : "Cancel"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>

                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إعادة الفتح للتعديل"
                                                        : "Reopen Selected Vouchers"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={handleBulkReopen}
                                                    disabled={
                                                        bulkActionProcessing ||
                                                        !bulkPassword ||
                                                        !bulkReopenReason ||
                                                        bulkReopenReason.length <
                                                            5
                                                    }
                                                    className="flex items-center justify-center gap-1 h-[30px] px-3.5 text-xs font-bold bg-warning text-white hover:bg-warning/90 hover:translate-y-[-2px] hover:shadow-md disabled:opacity-50 disabled:pointer-events-none disabled:translate-y-0 disabled:shadow-none rounded-lg transition-all duration-200"
                                                >
                                                    {bulkActionProcessing ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                                                    ) : (
                                                        <Unlock className="h-4 w-4 text-white" />
                                                    )}
                                                    {showButtonText && (
                                                        <span>
                                                            {bulkActionProcessing
                                                                ? lang === "ar"
                                                                    ? "جاري الحفظ..."
                                                                    : "Processing..."
                                                                : lang === "ar"
                                                                  ? "إعادة للتعديل"
                                                                  : "Confirm Reopen"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </Modal>
                            </div>
                        )}

                        {/* Tab Content 6: Pallets Balance Report */}
                        {activeTab === "pallets" && (
                            <div className="space-y-4 text-start">
                                <SectionCard
                                    title={
                                        lang === "ar"
                                            ? "تقرير رصيد الطبالي"
                                            : "Pallets Balance Report"
                                    }
                                    icon={Layers}
                                >
                                    {/* Filters */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-surface-muted/10 p-3 rounded-xl border border-border">
                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "رقم أو كود الطبلية"
                                                    : "Pallet Number / Code"}
                                            </label>
                                            <input
                                                type="text"
                                                value={filterPalletSearch}
                                                onChange={(e) =>
                                                    setFilterPalletSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "ابحث بالرقم أو الكود..."
                                                        : "Search number or code..."
                                                }
                                                className="w-full text-xs h-[30px] px-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "حجم الطبلية"
                                                    : "Pallet Size"}
                                            </label>
                                            <select
                                                value={filterPalletSize}
                                                onChange={(e) =>
                                                    setFilterPalletSize(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "كل الأحجام"
                                                        : "All Sizes"}
                                                </option>
                                                {palletsSizes.map((s) => (
                                                    <option key={s} value={s}>
                                                        {s}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "صنف مخزن"
                                                    : "Contains Stored Item"}
                                            </label>
                                            <select
                                                value={filterPalletItemId}
                                                onChange={(e) =>
                                                    setFilterPalletItemId(
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full text-xs h-[30px] px-2 py-0 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">
                                                    {lang === "ar"
                                                        ? "كل الأصناف"
                                                        : "All Items"}
                                                </option>
                                                {palletsItems.map((item) => (
                                                    <option
                                                        key={item.id}
                                                        value={item.id}
                                                    >
                                                        {item.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex items-end gap-1.5 font-bold">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إعادة تعيين الفلاتر"
                                                        : "Reset Filters"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFilterPalletSearch(
                                                            "",
                                                        );
                                                        setFilterPalletSize("");
                                                        setFilterPalletItemId(
                                                            "",
                                                        );
                                                    }}
                                                    className="flex items-center justify-center gap-1 h-[30px] px-2.5 text-xs font-bold bg-surface border border-border hover:bg-surface-muted rounded-lg hover:translate-y-[-2px] hover:shadow-sm transition-all duration-200 text-danger w-full sm:w-auto"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إعادة ضبط"
                                                                : "Reset"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-text-muted font-bold">
                                            {lang === "ar"
                                                ? `إجمالي الطبالي: ${palletsTotal}`
                                                : `Total pallets: ${palletsTotal}`}
                                        </span>
                                    </div>

                                    {/* Table Content */}
                                    {palletsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                                            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                            <span className="text-xs text-text-muted font-bold">
                                                {lang === "ar"
                                                    ? "جاري تحميل الطبالي..."
                                                    : "Loading pallets..."}
                                            </span>
                                        </div>
                                    ) : pallets.length === 0 ? (
                                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                                            <Layers className="h-12 w-12 text-primary/40 mb-3" />
                                            <p className="text-sm font-bold text-text mb-1">
                                                {lang === "ar"
                                                    ? "لا توجد طبالي مسجلة"
                                                    : "No pallets found"}
                                            </p>
                                            <p className="text-xs text-text-muted max-w-md leading-relaxed">
                                                {lang === "ar"
                                                    ? "لم يتم تسجيل أي بضاعة على طبالي لهذا العقد."
                                                    : "No goods have been stored on pallets for this contract."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm font-sans">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-start border-collapse">
                                                    <thead>
                                                        <tr className="bg-surface-muted/40 border-b border-border text-text-muted font-bold text-[10px] uppercase">
                                                            <th className="px-3 py-2.5 text-start w-10">
                                                                {lang === "ar"
                                                                    ? "م"
                                                                    : "#"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "رقم الطبلية"
                                                                    : "Pallet No."}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "المحتويات"
                                                                    : "Contents"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "مدخلات"
                                                                    : "In"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "مخرجات"
                                                                    : "Out"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "المتبقي"
                                                                    : "Remaining"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center w-20">
                                                                {lang === "ar"
                                                                    ? "إجراءات"
                                                                    : "Actions"}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {pallets.map(
                                                            (pallet, idx) => {
                                                                const remaining =
                                                                    (pallet.total_in ||
                                                                        0) -
                                                                    (pallet.total_out ||
                                                                        0);
                                                                return (
                                                                    <tr
                                                                        key={
                                                                            pallet.id
                                                                        }
                                                                        className={`hover:bg-surface-muted/30 text-start ${remaining === 0 ? "opacity-50" : ""}`}
                                                                    >
                                                                        <td className="px-3 py-2.5 font-mono text-text-muted">
                                                                            {(palletsPage -
                                                                                1) *
                                                                                24 +
                                                                                idx +
                                                                                1}
                                                                        </td>
                                                                        <td className="px-3 py-2.5">
                                                                            <div className="font-bold text-primary font-mono">
                                                                                {
                                                                                    pallet.pallet_code
                                                                                }
                                                                            </div>
                                                                            <div className="text-[10px] text-text-muted">
                                                                                {
                                                                                    pallet.size
                                                                                }
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2.5 max-w-xs">
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {pallet
                                                                                    .contents
                                                                                    ?.length >
                                                                                0 ? (
                                                                                    pallet.contents.map(
                                                                                        (
                                                                                            c,
                                                                                            cIdx,
                                                                                        ) => (
                                                                                            <span
                                                                                                key={
                                                                                                    cIdx
                                                                                                }
                                                                                                className="bg-primary/5 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/10 font-bold whitespace-nowrap"
                                                                                            >
                                                                                                {displayBilingual(
                                                                                                    c.item_name,
                                                                                                )}{" "}
                                                                                                {c.variant_name
                                                                                                    ? `(${c.variant_name})`
                                                                                                    : ""}
                                                                                            </span>
                                                                                        ),
                                                                                    )
                                                                                ) : (
                                                                                    <span className="text-[10px] text-text-muted italic">
                                                                                        {lang ===
                                                                                        "ar"
                                                                                            ? "فارغة"
                                                                                            : "Empty"}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-600">
                                                                            {pallet.total_in ||
                                                                                0}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-600">
                                                                            {pallet.total_out ||
                                                                                0}
                                                                        </td>
                                                                        <td
                                                                            className={`px-3 py-2.5 text-center font-mono font-black ${remaining > 0 ? "text-primary" : "text-text-muted"}`}
                                                                        >
                                                                            {
                                                                                remaining
                                                                            }
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center">
                                                                            <Tooltip
                                                                                text={
                                                                                    lang ===
                                                                                    "ar"
                                                                                        ? "سجل العمليات"
                                                                                        : "Movement Log"
                                                                                }
                                                                            >
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        fetchPalletMovements(
                                                                                            pallet.id,
                                                                                        )
                                                                                    }
                                                                                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 hover:translate-y-[-1px] transition-all duration-200"
                                                                                >
                                                                                    <Eye className="h-3 w-3" />
                                                                                    {lang ===
                                                                                    "ar"
                                                                                        ? "المزيد"
                                                                                        : "More"}
                                                                                </button>
                                                                            </Tooltip>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            },
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {!palletsLoading && palletsLastPage > 1 && (
                                        <div className="flex justify-between items-center gap-2 mt-4 px-2">
                                            <span className="text-xs text-text-muted font-bold">
                                                {lang === "ar"
                                                    ? `عرض صفحة ${palletsPage} من أصل ${palletsLastPage} (إجمالي ${palletsTotal} طبلية)`
                                                    : `Showing page ${palletsPage} of ${palletsLastPage} (Total ${palletsTotal} pallets)`}
                                            </span>
                                            <div className="flex items-center gap-1.5 font-bold">
                                                <button
                                                    type="button"
                                                    disabled={palletsPage === 1}
                                                    onClick={() =>
                                                        setPalletsPage((prev) =>
                                                            Math.max(
                                                                1,
                                                                prev - 1,
                                                            ),
                                                        )
                                                    }
                                                    className="flex items-center justify-center h-[30px] px-3 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all"
                                                >
                                                    {lang === "ar"
                                                        ? "السابق"
                                                        : "Prev"}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        palletsPage ===
                                                        palletsLastPage
                                                    }
                                                    onClick={() =>
                                                        setPalletsPage((prev) =>
                                                            Math.min(
                                                                palletsLastPage,
                                                                prev + 1,
                                                            ),
                                                        )
                                                    }
                                                    className="flex items-center justify-center h-[30px] px-3 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all"
                                                >
                                                    {lang === "ar"
                                                        ? "التالي"
                                                        : "Next"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </SectionCard>
                            </div>
                        )}

                        {/* Tab Content 7: Stored Items Balance Report */}
                        {activeTab === "items" && (
                            <div className="space-y-4 text-start">
                                <SectionCard
                                    title={
                                        lang === "ar"
                                            ? "تقرير رصيد الأصناف المخزنة"
                                            : "Stored Items Balance Report"
                                    }
                                    icon={Package}
                                >
                                    {/* Filters */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-surface-muted/10 p-3 rounded-xl border border-border">
                                        <div className="sm:col-span-2">
                                            <label className="text-[10px] font-bold text-text-muted mb-1 block">
                                                {lang === "ar"
                                                    ? "اسم الصنف أو كود الصنف"
                                                    : "Item Name / Code"}
                                            </label>
                                            <input
                                                type="text"
                                                value={filterItemSearch}
                                                onChange={(e) =>
                                                    setFilterItemSearch(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder={
                                                    lang === "ar"
                                                        ? "ابحث باسم أو كود الصنف..."
                                                        : "Search item name or code..."
                                                }
                                                className="w-full text-xs h-[30px] px-2 border border-border rounded-lg bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                            />
                                        </div>

                                        <div className="flex items-end gap-1.5 font-bold">
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "إعادة تعيين الفلاتر"
                                                        : "Reset Filters"
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFilterItemSearch("");
                                                    }}
                                                    className="flex items-center justify-center gap-1 h-[30px] px-2.5 text-xs font-bold bg-surface border border-border hover:bg-surface-muted rounded-lg hover:translate-y-[-2px] hover:shadow-sm transition-all duration-200 text-danger w-full sm:w-auto"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    {showButtonText && (
                                                        <span>
                                                            {lang === "ar"
                                                                ? "إعادة ضبط"
                                                                : "Reset"}
                                                        </span>
                                                    )}
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-text-muted font-bold">
                                            {lang === "ar"
                                                ? `عدد السلع المستودعية: ${storedItemsTotal}`
                                                : `Total warehouse items: ${storedItemsTotal}`}
                                        </span>
                                    </div>

                                    {/* Table Content */}
                                    {storedItemsLoading ? (
                                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                                            <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                            <span className="text-xs text-text-muted font-bold">
                                                {lang === "ar"
                                                    ? "جاري تحميل الأصناف المخزنة..."
                                                    : "Loading stored items..."}
                                            </span>
                                        </div>
                                    ) : storedItems.length === 0 ? (
                                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                                            <Package className="h-12 w-12 text-primary/40 mb-3" />
                                            <p className="text-sm font-bold text-text mb-1">
                                                {lang === "ar"
                                                    ? "لا توجد أصناف مخزنة"
                                                    : "No stored items found"}
                                            </p>
                                            <p className="text-xs text-text-muted max-w-md leading-relaxed">
                                                {lang === "ar"
                                                    ? "لا توجد أصناف مسجلة لهذا العقد."
                                                    : "No items have been recorded for this contract."}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-sm font-sans">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-start border-collapse">
                                                    <thead>
                                                        <tr className="bg-surface-muted/40 border-b border-border text-text-muted font-bold text-[10px] uppercase">
                                                            <th className="px-3 py-2.5 text-start w-10">
                                                                {lang === "ar"
                                                                    ? "م"
                                                                    : "#"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "الصنف"
                                                                    : "Item"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-start">
                                                                {lang === "ar"
                                                                    ? "الجودة / الحجم"
                                                                    : "Quality / Size"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "مدخلات"
                                                                    : "In"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "مخرجات"
                                                                    : "Out"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center">
                                                                {lang === "ar"
                                                                    ? "الرصيد"
                                                                    : "Balance"}
                                                            </th>
                                                            <th className="px-3 py-2.5 text-center w-20">
                                                                {lang === "ar"
                                                                    ? "إجراءات"
                                                                    : "Actions"}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border">
                                                        {storedItems.map(
                                                            (item, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className={`hover:bg-surface-muted/30 text-start ${item.balance === 0 ? "opacity-50" : ""}`}
                                                                >
                                                                    <td className="px-3 py-2.5 font-mono text-text-muted">
                                                                        {(storedItemsPage -
                                                                            1) *
                                                                            24 +
                                                                            idx +
                                                                            1}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 font-bold text-text">
                                                                        {displayBilingual(
                                                                            item.item_name,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 font-semibold text-text-muted">
                                                                        {item.quality ||
                                                                            "—"}{" "}
                                                                        /{" "}
                                                                        {item.variant_name ||
                                                                            "—"}
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center font-mono font-bold text-emerald-600">
                                                                        {
                                                                            item.total_in
                                                                        }
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center font-mono font-bold text-rose-600">
                                                                        {
                                                                            item.total_out
                                                                        }
                                                                    </td>
                                                                    <td
                                                                        className={`px-3 py-2.5 text-center font-mono font-black ${item.balance > 0 ? "text-primary" : "text-text-muted"}`}
                                                                    >
                                                                        {
                                                                            item.balance
                                                                        }
                                                                    </td>
                                                                    <td className="px-3 py-2.5 text-center">
                                                                        <Tooltip
                                                                            text={
                                                                                lang ===
                                                                                "ar"
                                                                                    ? "سجل العمليات"
                                                                                    : "Movement Log"
                                                                            }
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    fetchItemMovements(
                                                                                        item.item_id,
                                                                                        item.variant_id,
                                                                                    )
                                                                                }
                                                                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 hover:translate-y-[-1px] transition-all duration-200"
                                                                            >
                                                                                <Eye className="h-3 w-3" />
                                                                                {lang ===
                                                                                "ar"
                                                                                    ? "المزيد"
                                                                                    : "More"}
                                                                            </button>
                                                                        </Tooltip>
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {!storedItemsLoading &&
                                        storedItemsLastPage > 1 && (
                                            <div className="flex justify-between items-center gap-2 mt-4 px-2">
                                                <span className="text-xs text-text-muted font-bold">
                                                    {lang === "ar"
                                                        ? `عرض صفحة ${storedItemsPage} من أصل ${storedItemsLastPage} (إجمالي ${storedItemsTotal} صنف)`
                                                        : `Showing page ${storedItemsPage} of ${storedItemsLastPage} (Total ${storedItemsTotal} items)`}
                                                </span>
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            storedItemsPage ===
                                                            1
                                                        }
                                                        onClick={() =>
                                                            setStoredItemsPage(
                                                                (prev) =>
                                                                    Math.max(
                                                                        1,
                                                                        prev -
                                                                            1,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex items-center justify-center h-[30px] px-3 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all"
                                                    >
                                                        {lang === "ar"
                                                            ? "السابق"
                                                            : "Prev"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            storedItemsPage ===
                                                            storedItemsLastPage
                                                        }
                                                        onClick={() =>
                                                            setStoredItemsPage(
                                                                (prev) =>
                                                                    Math.min(
                                                                        storedItemsLastPage,
                                                                        prev +
                                                                            1,
                                                                    ),
                                                            )
                                                        }
                                                        className="flex items-center justify-center h-[30px] px-3 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-all"
                                                    >
                                                        {lang === "ar"
                                                            ? "التالي"
                                                            : "Next"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </SectionCard>
                            </div>
                        )}
                    </div>
                </div>

                {/* Movement History Modal (shared by Items and Pallets) */}
                <Modal
                    show={showMovementModal}
                    onClose={() => {
                        setShowMovementModal(false);
                        setMovementData(null);
                    }}
                    maxWidth="3xl"
                >
                    <div
                        className="p-5 text-start"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        {/* Modal Header */}
                        <div className="flex items-start justify-between mb-4 border-b border-border pb-3">
                            <div>
                                <h3 className="text-sm font-black text-text">
                                    {movementType === "item"
                                        ? lang === "ar"
                                            ? `رصيد الصنف في ${new Date().toLocaleDateString("ar-EG")}`
                                            : `Item Balance as of ${new Date().toLocaleDateString("en-GB")}`
                                        : lang === "ar"
                                          ? `رصيد الطبلية في ${new Date().toLocaleDateString("ar-EG")}`
                                          : `Pallet Balance as of ${new Date().toLocaleDateString("en-GB")}`}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMovementModal(false);
                                    setMovementData(null);
                                }}
                                className="text-text-muted hover:text-text transition-colors p-1"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {movementLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-2">
                                <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                                <span className="text-xs text-text-muted font-bold">
                                    {lang === "ar"
                                        ? "جاري تحميل سجل العمليات..."
                                        : "Loading movement log..."}
                                </span>
                            </div>
                        ) : movementData ? (
                            <div className="space-y-4">
                                {/* Info Header */}
                                <div className="bg-surface-muted/20 border border-border rounded-xl p-3 text-xs space-y-1">
                                    {movementType === "item" ? (
                                        <>
                                            <div className="flex gap-4 flex-wrap">
                                                <span>
                                                    <strong className="text-text">
                                                        {lang === "ar"
                                                            ? "الصنف:"
                                                            : "Item:"}
                                                    </strong>{" "}
                                                    {movementData.item_name
                                                        ? displayBilingual(
                                                              movementData.item_name,
                                                          )
                                                        : "—"}
                                                </span>
                                                <span>
                                                    <strong className="text-text">
                                                        {lang === "ar"
                                                            ? "الجودة:"
                                                            : "Quality:"}
                                                    </strong>{" "}
                                                    {movementData.quality ||
                                                        "—"}
                                                </span>
                                                <span>
                                                    <strong className="text-text">
                                                        {lang === "ar"
                                                            ? "الحجم:"
                                                            : "Size:"}
                                                    </strong>{" "}
                                                    {movementData.variant_name ||
                                                        "—"}
                                                </span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex gap-4 flex-wrap">
                                                <span>
                                                    <strong className="text-text">
                                                        {lang === "ar"
                                                            ? "رقم الطبلية:"
                                                            : "Pallet No:"}
                                                    </strong>{" "}
                                                    <span className="font-mono">
                                                        {
                                                            movementData.pallet_number
                                                        }
                                                    </span>
                                                </span>
                                                <span>
                                                    <strong className="text-text">
                                                        {lang === "ar"
                                                            ? "الكود:"
                                                            : "Code:"}
                                                    </strong>{" "}
                                                    <span className="font-mono">
                                                        {
                                                            movementData.pallet_code
                                                        }
                                                    </span>
                                                </span>
                                                <span>
                                                    <strong className="text-text">
                                                        {lang === "ar"
                                                            ? "الحجم:"
                                                            : "Size:"}
                                                    </strong>{" "}
                                                    {movementData.size}
                                                </span>
                                            </div>
                                            {movementData.contents &&
                                                movementData.contents.length >
                                                    0 && (
                                                    <div className="mt-1">
                                                        <strong className="text-text">
                                                            {lang === "ar"
                                                                ? "الأصناف:"
                                                                : "Items:"}
                                                        </strong>{" "}
                                                        {movementData.contents.map(
                                                            (c, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="bg-primary/5 text-primary text-[10px] px-1.5 py-0.5 rounded border border-primary/10 font-bold mx-0.5"
                                                                >
                                                                    {displayBilingual(
                                                                        c.item_name,
                                                                    )}
                                                                    {c.variant_name
                                                                        ? ` (${c.variant_name})`
                                                                        : ""}
                                                                    {c.quality
                                                                        ? ` - ${displayBilingual(c.quality)}`
                                                                        : ""}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </>
                                    )}
                                </div>

                                {/* Movements Table */}
                                {movementData.movements &&
                                movementData.movements.length > 0 ? (
                                    <div className="border border-border rounded-xl overflow-hidden shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-surface-muted/40 border-b border-border text-text-muted font-bold text-[10px] uppercase">
                                                        <th className="px-3 py-2.5 text-start w-10">
                                                            {lang === "ar"
                                                                ? "م"
                                                                : "#"}
                                                        </th>
                                                        <th className="px-3 py-2.5 text-start">
                                                            {lang === "ar"
                                                                ? "سند رقم"
                                                                : "Voucher No."}
                                                        </th>
                                                        <th className="px-3 py-2.5 text-start">
                                                            {lang === "ar"
                                                                ? "تاريخ العملية"
                                                                : "Date"}
                                                        </th>
                                                        <th className="px-3 py-2.5 text-start">
                                                            {lang === "ar"
                                                                ? "نوع العملية"
                                                                : "Type"}
                                                        </th>
                                                        <th className="px-3 py-2.5 text-center">
                                                            {lang === "ar"
                                                                ? "مدخلات"
                                                                : "In"}
                                                        </th>
                                                        <th className="px-3 py-2.5 text-center">
                                                            {lang === "ar"
                                                                ? "مخرجات"
                                                                : "Out"}
                                                        </th>
                                                        <th className="px-3 py-2.5 text-center">
                                                            {lang === "ar"
                                                                ? "رصيد"
                                                                : "Balance"}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {movementData.movements.map(
                                                        (mov, idx) => (
                                                            <tr
                                                                key={idx}
                                                                className="hover:bg-surface-muted/20"
                                                            >
                                                                <td className="px-3 py-2 font-mono text-text-muted">
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="px-3 py-2 font-mono font-bold text-primary">
                                                                    {
                                                                        mov.serial_number
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="px-3 py-2 font-mono text-text"
                                                                    dir="ltr"
                                                                >
                                                                    {mov.operation_date
                                                                        ? new Date(
                                                                              mov.operation_date,
                                                                          ).toLocaleDateString(
                                                                              "en-GB",
                                                                          )
                                                                        : "—"}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span
                                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                            mov.type ===
                                                                            "reception"
                                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                                                        }`}
                                                                    >
                                                                        {mov.type ===
                                                                        "reception"
                                                                            ? lang ===
                                                                              "ar"
                                                                                ? "استقبال"
                                                                                : "Reception"
                                                                            : lang ===
                                                                                "ar"
                                                                              ? "إخراج"
                                                                              : "Delivery"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2 text-center font-mono font-bold text-emerald-600">
                                                                    {mov.quantity_in >
                                                                    0
                                                                        ? mov.quantity_in
                                                                        : "——"}
                                                                </td>
                                                                <td className="px-3 py-2 text-center font-mono font-bold text-rose-600">
                                                                    {mov.quantity_out >
                                                                    0
                                                                        ? mov.quantity_out
                                                                        : "——"}
                                                                </td>
                                                                <td className="px-3 py-2 text-center font-mono font-black text-primary">
                                                                    {
                                                                        mov.running_balance
                                                                    }
                                                                </td>
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                                <tfoot>
                                                    <tr className="bg-surface-muted/40 border-t-2 border-border font-bold">
                                                        <td
                                                            colSpan={4}
                                                            className="px-3 py-2.5 text-end text-[10px] uppercase text-text-muted"
                                                        >
                                                            {lang === "ar"
                                                                ? "الإجمالي"
                                                                : "Total"}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center font-mono font-black text-emerald-700">
                                                            {
                                                                movementData.total_in
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center font-mono font-black text-rose-700">
                                                            {
                                                                movementData.total_out
                                                            }
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center font-mono font-black text-primary text-sm">
                                                            {
                                                                movementData.balance
                                                            }
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-text-muted text-xs font-bold">
                                        {lang === "ar"
                                            ? "لا توجد حركات مسجلة"
                                            : "No movements recorded"}
                                    </div>
                                )}

                                {/* Close Button */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowMovementModal(false);
                                            setMovementData(null);
                                        }}
                                        className="flex items-center justify-center h-[30px] px-4 text-xs font-bold bg-surface border border-border text-text hover:bg-surface-muted rounded-lg transition-all"
                                    >
                                        {lang === "ar" ? "إغلاق" : "Close"}
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Modal>
            </div>

            {/* Modal: Edit Contract */}
            <Modal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                maxWidth="lg"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "update",
                            "put",
                            editForm,
                            setShowEditModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {/*  Add to lang keys */}
                        {t("show.edit_contract_data")}
                    </h3>
                    <div>
                        <InputLabel
                            value={
                                // Add to lang keys
                                t("show.introduction_section")
                            }
                        />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={editForm.introduction}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    introduction: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div>
                        <InputLabel
                            // Add to lang keys
                            value={t("show.preamble_section")}
                        />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={editForm.preamble}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    preamble: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowEditModal(false)}
                        >
                            {/* Add to lang keys */}
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {/* Add to lang keys */}
                            {t("show.save_changes")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Extend Contract Period */}
            <Modal
                show={showPeriodModal}
                onClose={() => setShowPeriodModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "periods.store",
                            "post",
                            periodForm,
                            setShowPeriodModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {/* Add to lang keys */}
                        {t("show.extend_period")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.extension_months")} />
                        <TextInput
                            type="number"
                            min="1"
                            className="mt-1 block w-full"
                            value={periodForm.duration_months}
                            onChange={(e) =>
                                setPeriodForm({
                                    ...periodForm,
                                    duration_months: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <InputLabel value={t("show.notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={periodForm.notes}
                            onChange={(e) =>
                                setPeriodForm({
                                    ...periodForm,
                                    notes: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPeriodModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.confirm_extension")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal
                show={showPeriodDetailsModal}
                onClose={() => setShowPeriodDetailsModal(false)}
                maxWidth="lg"
            >
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text">
                        {t("show.period_details")}
                    </h3>
                    {selectedPeriod && (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Field
                                    label={t("show.period_label")}
                                    value={selectedPeriod.period_number}
                                />
                                <Field
                                    label={t("show.start_date")}
                                    value={selectedPeriod.start_date}
                                    dir="ltr"
                                />
                                <Field
                                    label={t("show.end_date")}
                                    value={selectedPeriod.end_date}
                                    dir="ltr"
                                />
                                <Field
                                    label={t("show.duration")}
                                    value={`${getPeriodDurationMonths(selectedPeriod)} ${t("show.months")}`}
                                />
                            </div>

                            <div className="border border-border p-4 bg-surface-muted/20 space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <h4 className="text-sm font-bold text-text">
                                        {t("show.period_items")}
                                    </h4>
                                    <span
                                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${getPeriodStatusClass(selectedPeriod.status)}`}
                                    >
                                        {getPeriodStatusLabel(
                                            selectedPeriod.status,
                                        )}
                                    </span>
                                </div>
                                {(selectedPeriod.items || []).length === 0 ? (
                                    <p className="text-xs text-text-muted">
                                        {t("show.no_period_items")}
                                    </p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-start">
                                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-3 py-2">
                                                        {t("show.item")}
                                                    </th>
                                                    <th className="px-3 py-2 text-center">
                                                        {t("show.qty")}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border">
                                                {selectedPeriod.items.map(
                                                    (item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-3 py-2 text-xs font-bold text-text">
                                                                {displayBilingual(
                                                                    `${item.storage_item?.name_ar || item.storageItem?.name_ar || ""}|${item.storage_item?.name_en || item.storageItem?.name_en || item.storage_item?.name_ar || item.storageItem?.name_ar || ""}`,
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 text-center font-mono font-bold">
                                                                {
                                                                    item.unit_count
                                                                }
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border pt-3 text-xs text-text-muted italic">
                                {selectedPeriod.notes || "-"}
                            </div>
                            {selectedPeriod.status_reason && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border">
                                    <Field
                                        label={t("show.stop_reason")}
                                        value={selectedPeriod.status_reason}
                                    />
                                    <Field
                                        label={t(
                                            "show.remaining_period_action",
                                        )}
                                        value={t(
                                            `show.${selectedPeriod.remaining_period_action || "keep_remaining"}`,
                                        )}
                                    />
                                    <Field
                                        label={t("show.notify_customer")}
                                        value={
                                            selectedPeriod.notify_customer
                                                ? t("show.yes")
                                                : t("show.no")
                                        }
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Modal>

            <Modal
                show={showPeriodEditModal}
                onClose={() => setShowPeriodEditModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handlePeriodRequest(
                            "contracts.periods.update",
                            "patch",
                            periodEditForm,
                            setShowPeriodEditModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.edit_period")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.extension_months")} />
                        <TextInput
                            type="number"
                            min="1"
                            className="mt-1 block w-full"
                            value={periodEditForm.duration_months}
                            onChange={(e) =>
                                setPeriodEditForm({
                                    ...periodEditForm,
                                    duration_months: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div>
                        <InputLabel value={t("show.notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={periodEditForm.notes}
                            onChange={(e) =>
                                setPeriodEditForm({
                                    ...periodEditForm,
                                    notes: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPeriodEditModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.save_period")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal
                show={showPeriodItemsModal}
                onClose={() => setShowPeriodItemsModal(false)}
                maxWidth="lg"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handlePeriodRequest(
                            "contracts.periods.items.update",
                            "patch",
                            {
                                items: periodItemsForm.items.map((item) => ({
                                    id: item.id,
                                    unit_count: item.unit_count,
                                })),
                            },
                            setShowPeriodItemsModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.edit_period_items")}
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 py-2">
                                        {t("show.item")}
                                    </th>
                                    <th className="px-3 py-2 text-center w-40">
                                        {t("show.qty")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {periodItemsForm.items.map((item, index) => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-xs font-bold text-text">
                                            {item.label}
                                        </td>
                                        <td className="px-3 py-2">
                                            <TextInput
                                                type="number"
                                                min="0"
                                                className="block w-full text-center"
                                                value={item.unit_count}
                                                onChange={(e) => {
                                                    const nextItems = [
                                                        ...periodItemsForm.items,
                                                    ];
                                                    nextItems[index] = {
                                                        ...nextItems[index],
                                                        unit_count:
                                                            e.target.value,
                                                    };
                                                    setPeriodItemsForm({
                                                        items: nextItems,
                                                    });
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPeriodItemsModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.save_period_items")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal
                show={showPeriodStatusModal}
                onClose={() => setShowPeriodStatusModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handlePeriodRequest(
                            "contracts.periods.status",
                            "patch",
                            periodStatusForm,
                            setShowPeriodStatusModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {periodStatusForm.status === "active"
                            ? t("show.activate_period")
                            : t("show.suspend_period")}
                    </h3>
                    <p className="text-sm text-text-muted">
                        {selectedPeriod
                            ? `${t("show.period_label")} ${selectedPeriod.period_number}`
                            : ""}
                    </p>
                    {periodStatusForm.status === "suspended" && (
                        <div className="space-y-4 border border-border p-4 bg-surface-muted/20">
                            <div>
                                <InputLabel value={t("show.stop_reason")} />
                                <TextInput
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={periodStatusForm.status_reason}
                                    onChange={(e) =>
                                        setPeriodStatusForm({
                                            ...periodStatusForm,
                                            status_reason: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel
                                    value={t("show.remaining_period_action")}
                                />
                                <select
                                    className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                    value={
                                        periodStatusForm.remaining_period_action
                                    }
                                    onChange={(e) =>
                                        setPeriodStatusForm({
                                            ...periodStatusForm,
                                            remaining_period_action:
                                                e.target.value,
                                        })
                                    }
                                >
                                    <option value="keep_remaining">
                                        {t("show.keep_remaining")}
                                    </option>
                                    <option value="end_contract">
                                        {t("show.end_contract_option")}
                                    </option>
                                    <option value="review_manually">
                                        {t("show.review_manually")}
                                    </option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-xs font-bold text-text">
                                <input
                                    type="checkbox"
                                    checked={
                                        periodStatusForm.terminate_contract
                                    }
                                    onChange={(e) =>
                                        setPeriodStatusForm({
                                            ...periodStatusForm,
                                            terminate_contract:
                                                e.target.checked,
                                        })
                                    }
                                />
                                {t("show.terminate_contract")}
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold text-text">
                                <input
                                    type="checkbox"
                                    checked={periodStatusForm.notify_customer}
                                    onChange={(e) =>
                                        setPeriodStatusForm({
                                            ...periodStatusForm,
                                            notify_customer: e.target.checked,
                                        })
                                    }
                                />
                                {t("show.notify_customer")}
                            </label>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPeriodStatusModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {periodStatusForm.status === "active"
                                ? t("show.activate_period")
                                : t("show.suspend_period")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            <Modal
                show={showPeriodDeleteModal}
                onClose={() => setShowPeriodDeleteModal(false)}
                maxWidth="md"
            >
                <div className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text">
                        {t("show.delete_period")}
                    </h3>
                    <p className="text-sm text-text-muted leading-relaxed">
                        {selectedPeriod
                            ? t("show.period_delete_message", {
                                  number: selectedPeriod.period_number,
                              })
                            : ""}
                    </p>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPeriodDeleteModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <DangerButton
                            type="button"
                            disabled={processing}
                            onClick={() =>
                                handlePeriodRequest(
                                    "contracts.periods.destroy",
                                    "delete",
                                    {},
                                    setShowPeriodDeleteModal,
                                )
                            }
                        >
                            {t("show.delete_period")}
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            {/* Modal: Add Contract Contact */}
            <Modal
                show={showAddContactModal}
                onClose={() => setShowAddContactModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "contacts.store",
                            "post",
                            contactForm,
                            setShowAddContactModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.add_contract_delegate")}
                    </h3>
                    <div>
                        <InputLabel
                            value={t("show.select_delegate_from_customer")}
                        />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={contactForm.contact_id}
                            onChange={(e) =>
                                setContactForm({ contact_id: e.target.value })
                            }
                            required
                        >
                            <option value="">
                                {t("show.select_delegate")}
                            </option>
                            {contract.customer?.contacts?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.phone_number})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowAddContactModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.add_delegate")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Contact Status / Remove Reason */}
            <Modal
                show={showStatusContactModal}
                onClose={() => setShowStatusContactModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={handleContactStatusSubmit}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {contactActionType === "deleted"
                            ? t("show.remove_delegate")
                            : t("show.suspend_delegate")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.action_reason")} />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={statusContactForm.status_reason}
                            onChange={(e) =>
                                setStatusContactForm({
                                    status_reason: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowStatusContactModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <DangerButton disabled={processing}>
                            {contactActionType === "deleted"
                                ? t("show.confirm_remove")
                                : t("show.confirm_suspend")}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Invoice */}
            <Modal
                show={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "invoices.store-from-period",
                            "post",
                            invoiceForm,
                            setShowInvoiceModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.issue_financial_invoice")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.periods_extension")} />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={invoiceForm.period_id}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    period_id: e.target.value,
                                })
                            }
                            required
                        >
                            <option value="">
                                {lang === "ar"
                                    ? "اختر الفترة"
                                    : "Select Period"}
                            </option>
                            {contract.periods?.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {lang === "ar"
                                        ? `الفترة ${period.period_number}`
                                        : `Period ${period.period_number}`}{" "}
                                    - {period.start_date} / {period.end_date}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel value={lang === "ar" ? "الوصف" : "Description"} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={invoiceForm.description}
                            onChange={(e) =>
                                setInvoiceForm({
                                    ...invoiceForm,
                                    description: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={lang === "ar" ? "التاريخ" : "Date"} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={invoiceForm.date}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={lang === "ar" ? "حساب الإيراد" : "Revenue Account"} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={invoiceForm.revenue_account_id}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        revenue_account_id: e.target.value,
                                    })
                                }
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر حساب...' : 'Select Account...'}</option>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t("show.amount_due")} />
                            <TextInput
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full font-mono"
                                value={invoiceForm.amount}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        amount: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={lang === "ar" ? "نسبة الضريبة %" : "Tax Rate %"} />
                            <TextInput
                                type="number"
                                step="1"
                                className="mt-1 block w-full font-mono"
                                value={invoiceForm.tax_rate}
                                onChange={(e) =>
                                    setInvoiceForm({
                                        ...invoiceForm,
                                        tax_rate: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowInvoiceModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.issue_invoice")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Payment */}
            <Modal
                show={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                maxWidth="md"
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleAction(
                            "payments.store",
                            "post",
                            paymentForm,
                            setShowPaymentModal,
                        );
                    }}
                    className="p-6 space-y-4"
                >
                    <h3 className="text-lg font-bold text-text mb-4">
                        {t("show.record_cash_payment")}
                    </h3>
                    <div>
                        <InputLabel value={t("show.periods_extension")} />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={paymentForm.period_id}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    period_id: e.target.value,
                                    invoice_id: "",
                                })
                            }
                            required
                        >
                            <option value="">
                                {lang === "ar"
                                    ? "اختر الفترة"
                                    : "Select Period"}
                            </option>
                            {contract.periods?.map((period) => (
                                <option key={period.id} value={period.id}>
                                    {lang === "ar"
                                        ? `الفترة ${period.period_number}`
                                        : `Period ${period.period_number}`}{" "}
                                    - {period.start_date} / {period.end_date}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel value={t("show.amount_paid")} />
                        <TextInput
                            type="number"
                            step="0.01"
                            className="mt-1 block w-full font-mono"
                            value={paymentForm.amount}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    amount: e.target.value,
                                })
                            }
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={t("show.payment_date")} />
                            <TextInput
                                type="date"
                                className="mt-1 block w-full"
                                value={paymentForm.payment_date}
                                onChange={(e) =>
                                    setPaymentForm({
                                        ...paymentForm,
                                        payment_date: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value={t("show.payment_method")} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={paymentForm.method}
                                onChange={(e) =>
                                    setPaymentForm({
                                        ...paymentForm,
                                        method: e.target.value,
                                    })
                                }
                            >
                                <option value="bank_transfer">
                                    {t("show.bank_transfer")}
                                </option>
                                <option value="cash">{t("show.cash")}</option>
                                <option value="cheque">
                                    {t("show.cheque")}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <InputLabel value={t("show.link_invoice")} />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={paymentForm.invoice_id}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    invoice_id: e.target.value,
                                })
                            }
                        >
                            <option value="">{t("show.no_link")}</option>
                                                        {financialInvoices.map((inv) => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.invoice_number} ({inv.total_amount} - المتبقي: {inv.total_amount - inv.paid_amount})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'حساب الخزينة/البنك' : 'Cash/Bank Account'} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={paymentForm.primary_account_id}
                                onChange={(e) => setPaymentForm({...paymentForm, primary_account_id: e.target.value})}
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                {accounts.filter(a => a.type === 'asset' || a.type === 'liability').map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value={lang === 'ar' ? 'حساب الإيراد/الإيجار' : 'Revenue/Rent Account'} />
                            <select
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                                value={paymentForm.counter_account_id}
                                onChange={(e) => setPaymentForm({...paymentForm, counter_account_id: e.target.value})}
                                required
                            >
                                <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <InputLabel value={t("show.reference_notes")} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={paymentForm.reference}
                            onChange={(e) =>
                                setPaymentForm({
                                    ...paymentForm,
                                    reference: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                        >
                            {t("show.cancel")}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            {t("show.record_payment")}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* A4 Print View Container (Hidden on screen, visible on print) */}
            <div
                className="hidden print:block print:w-full print:bg-white print:text-black print:p-8 font-sans"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                {renderUnifiedLayout(true)}
            </div>

            <ConfirmationModal
                show={!!itemToDelete}
                title={lang === "ar" ? "تأكيد الحذف" : "Confirm Deletion"}
                message={lang === "ar" ? "هل أنت متأكد من حذف هذا العقد؟" : "Are you sure you want to delete this contract?"}
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
