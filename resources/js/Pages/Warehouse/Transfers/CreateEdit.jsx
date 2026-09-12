import React, { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    ArrowLeftRight,
    Save,
    CheckCircle2,
    X,
    Plus,
    Trash2,
    Search,
    AlertCircle,
    ArrowRight
} from "lucide-react";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import SearchableSelect from "@/Components/SearchableSelect";
import axios from "axios";

export default function CreateEdit({ transfer = null, contracts = [], customers = [], drivers = [], autoSerial = "" }) {
    const { lang, __ } = useLang();
    const isEdit = !!transfer;

    const t = (key, fallback) => {
        if (!key) return fallback || "";
        const translated = __ ? __(key) : key;
        return (translated && translated !== key) ? translated : fallback;
    };

    const { data, setData, post, put, processing, errors } = useForm({
        serial_number: transfer?.serial_number || autoSerial || "",
        transfer_date: transfer?.transfer_date
            ? new Date(transfer.transfer_date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        source_contract_id: transfer?.source_contract_id || "",
        destination_contract_id: transfer?.destination_contract_id || "",
        driver_id: transfer?.driver_id || "",
        farm_source: transfer?.farm_source || "",
        notes: transfer?.notes || "",
        status: transfer?.status || "draft",
        items: transfer?.items
            ? transfer.items.map((i) => ({
                  id: i.id,
                  inventory_item_id: i.inventory_item_id,
                  inventory_item_variant_id: i.inventory_item_variant_id,
                  pallet_id: i.pallet_id,
                  quantity: i.quantity,
                  available_qty: i.quantity, // Default available
                  notes: i.notes || "",
              }))
            : [],
    });

    // Available Inventory loaded from Source Contract
    const [availableInventory, setAvailableInventory] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    // Fetch available inventory when Source Contract changes
    useEffect(() => {
        if (!data.source_contract_id) {
            setAvailableInventory([]);
            return;
        }

        setLoadingInventory(true);
        axios
            .get(route("api.contracts.available-inventory", data.source_contract_id))
            .then((res) => {
                setAvailableInventory(res.data || []);
                setLoadingInventory(false);
            })
            .catch((err) => {
                console.error("Error loading available inventory:", err);
                setAvailableInventory([]);
                setLoadingInventory(false);
            });
    }, [data.source_contract_id]);

    // Selectable options for Source Contract & Destination Contract
    const contractOptions = useMemo(() => {
        return (contracts || []).map((cnt) => ({
            id: cnt.id,
            contract_number: cnt.contract_number,
            customer_name: cnt.customer?.name || "",
            label: `${cnt.contract_number} - ${cnt.customer?.name || ""}`,
        }));
    }, [contracts]);

    // Destination options (exclude selected source contract)
    const destinationContractOptions = useMemo(() => {
        return contractOptions.filter((cnt) => cnt.id !== parseInt(data.source_contract_id));
    }, [contractOptions, data.source_contract_id]);

    // Selected Source & Destination Contract Details
    const selectedSourceContract = useMemo(() => {
        return contracts.find((c) => c.id === parseInt(data.source_contract_id));
    }, [contracts, data.source_contract_id]);

    const selectedDestinationContract = useMemo(() => {
        return contracts.find((c) => c.id === parseInt(data.destination_contract_id));
    }, [contracts, data.destination_contract_id]);

    // Add item row from available inventory option
    const addItemFromInventory = (invOption) => {
        if (!invOption) return;

        // Check if item-pallet combination already added
        const exists = data.items.some(
            (row) =>
                row.pallet_id === invOption.pallet_id &&
                row.inventory_item_id === invOption.inventory_item_id &&
                row.inventory_item_variant_id === invOption.inventory_item_variant_id
        );

        if (exists) return;

        const newRow = {
            inventory_item_id: invOption.inventory_item_id,
            inventory_item_variant_id: invOption.inventory_item_variant_id,
            pallet_id: invOption.pallet_id,
            item_name: invOption.inventoryItem?.name || "",
            variant_name: invOption.variant?.name || "",
            pallet_number: invOption.pallet?.pallet_number || invOption.pallet?.code || "",
            quantity: invOption.available_qty,
            available_qty: invOption.available_qty,
            notes: "",
        };

        setData("items", [...data.items, newRow]);
    };

    const addAllAvailableItems = () => {
        if (!availableInventory || availableInventory.length === 0) return;

        const newRows = availableInventory.map((invOption) => ({
            inventory_item_id: invOption.inventory_item_id,
            inventory_item_variant_id: invOption.inventory_item_variant_id,
            pallet_id: invOption.pallet_id,
            item_name: invOption.inventoryItem?.name || "",
            variant_name: invOption.variant?.name || "",
            pallet_number: invOption.pallet?.pallet_number || invOption.pallet?.code || "",
            quantity: invOption.available_qty,
            available_qty: invOption.available_qty,
            notes: "",
        }));

        setData("items", newRows);
    };

    const updateItemRow = (index, field, value) => {
        const updated = [...data.items];
        updated[index][field] = value;
        setData("items", updated);
    };

    const removeItemRow = (index) => {
        const updated = data.items.filter((_, i) => i !== index);
        setData("items", updated);
    };

    const totalQuantity = useMemo(() => {
        return data.items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
    }, [data.items]);

    const handleSubmit = (e, targetStatus = "draft") => {
        if (e) e.preventDefault();

        const formData = {
            ...data,
            status: targetStatus,
        };

        if (isEdit) {
            put(route("contract-transfers.update", transfer.id), formData);
        } else {
            post(route("contract-transfers.store"), formData);
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route("contract-transfers.index")} className="text-text hover:text-primary transition-colors">
                {t("transfers.title", "سندات تحويل الطبالي")}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {isEdit ? t("transfers.edit_title", "تعديل سند تحويل") : t("transfers.create_title", "إنشاء سند تحويل جديد")}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={isEdit ? t("transfers.edit_title", "تعديل سند تحويل") : t("transfers.create_title", "إنشاء سند تحويل جديد")} />

            <div className="max-w-7xl mx-auto pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <PageHeader
                    icon={ArrowLeftRight}
                    title={isEdit ? `${t("transfers.edit_title", "تعديل سند تحويل")} رقم: ${transfer.serial_number}` : t("transfers.create_title", "إنشاء سند تحويل جديد")}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {t("transfers.create_description", "اختر عقد المصدر لتحميل طباليه المتاحة بالثلاجة، ثم حدد عقد الوجهة ونقل الكميات المطلوب ترحيلها.")}
                        </p>
                    }
                    actions={
                        <Link
                            href={route("contract-transfers.index")}
                            className="bg-surface text-text hover:bg-hover border border-border px-3 py-1.5 text-xs font-semibold rounded-none flex items-center gap-1 transition-all"
                        >
                            <X className="h-4 w-4" />
                            <span>{t("common.cancel", "إلغاء")}</span>
                        </Link>
                    }
                />

                <form onSubmit={(e) => handleSubmit(e, data.status)} className="space-y-4">
                    {/* Header Details Card */}
                    <div className="bg-surface border border-border p-4 shadow-sm rounded-none">
                        <h3 className="text-xs font-bold text-primary mb-3 pb-2 border-b border-border flex items-center gap-1.5">
                            <ArrowLeftRight className="h-4 w-4" />
                            <span>{t("transfers.header_info", "البيانات الأساسية لسند التحويل")}</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Serial Number */}
                            <div>
                                <InputLabel value={t("transfers.serial_number", "رقم المسلسل للسند")} />
                                <TextInput
                                    className="w-full text-xs rounded-none border-border h-[32px] mt-1 font-mono font-bold"
                                    value={data.serial_number}
                                    onChange={(e) => setData("serial_number", e.target.value)}
                                    placeholder="TRF-2026-0001"
                                />
                                <InputError message={errors.serial_number} className="mt-1" />
                            </div>

                            {/* Transfer Date */}
                            <div>
                                <InputLabel value={t("transfers.transfer_date", "تاريخ التحويل")} />
                                <input
                                    type="date"
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs focus:border-primary focus:ring-primary rounded-none h-[32px] px-2 font-mono"
                                    value={data.transfer_date}
                                    onChange={(e) => setData("transfer_date", e.target.value)}
                                    required
                                />
                                <InputError message={errors.transfer_date} className="mt-1" />
                            </div>

                            {/* Source Contract SearchableSelect */}
                            <div>
                                <InputLabel value={t("transfers.source_contract", "عقد المصدر (خروج الرصيد منه)")} required />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={contractOptions}
                                        value={data.source_contract_id}
                                        valueKey="id"
                                        displayFormat={(cnt) => `${cnt.contract_number} - ${cnt.customer_name}`}
                                        searchKeys={["contract_number", "customer_name"]}
                                        placeholder={t("transfers.select_source_contract", "اختر عقد المصدر...")}
                                        className="w-full text-xs rounded-none border-border h-[32px]"
                                        onChange={(cnt) => {
                                            setData("source_contract_id", cnt ? cnt.id : "");
                                            // Reset items if source contract changes
                                            setData("items", []);
                                        }}
                                    />
                                </div>
                                {selectedSourceContract?.customer && (
                                    <span className="text-[10px] text-rose-700 font-semibold block mt-1">
                                        {t("transfers.customer", "العميل")}: {selectedSourceContract.customer.name}
                                    </span>
                                )}
                                <InputError message={errors.source_contract_id} className="mt-1" />
                            </div>

                            {/* Destination Contract SearchableSelect */}
                            <div>
                                <InputLabel value={t("transfers.destination_contract", "عقد الوجهة (إدخال الرصيد إليه)")} required />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={destinationContractOptions}
                                        value={data.destination_contract_id}
                                        valueKey="id"
                                        displayFormat={(cnt) => `${cnt.contract_number} - ${cnt.customer_name}`}
                                        searchKeys={["contract_number", "customer_name"]}
                                        placeholder={t("transfers.select_destination_contract", "اختر عقد الوجهة...")}
                                        className="w-full text-xs rounded-none border-border h-[32px]"
                                        onChange={(cnt) => setData("destination_contract_id", cnt ? cnt.id : "")}
                                    />
                                </div>
                                {selectedDestinationContract?.customer && (
                                    <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                                        {t("transfers.customer", "العميل")}: {selectedDestinationContract.customer.name}
                                    </span>
                                )}
                                <InputError message={errors.destination_contract_id} className="mt-1" />
                            </div>

                            {/* Driver Select */}
                            <div>
                                <InputLabel value={t("transfers.driver", "السائق الناقل")} />
                                <div className="mt-1">
                                    <SearchableSelect
                                        items={drivers}
                                        value={data.driver_id}
                                        valueKey="id"
                                        displayFormat={(d) => `${d.name} ${d.vehicle_plate ? `(${d.vehicle_plate})` : ""}`}
                                        searchKeys={["name", "vehicle_plate"]}
                                        placeholder={t("transfers.all_drivers", "اختياري - اختر السائق...")}
                                        className="w-full text-xs rounded-none border-border h-[32px]"
                                        onChange={(d) => setData("driver_id", d ? d.id : "")}
                                    />
                                </div>
                            </div>

                            {/* Farm Source */}
                            <div>
                                <InputLabel value={t("transfers.farm_source", "مصدر المزرعة")} />
                                <TextInput
                                    className="w-full text-xs rounded-none border-border h-[32px] mt-1"
                                    value={data.farm_source}
                                    onChange={(e) => setData("farm_source", e.target.value)}
                                    placeholder={t("transfers.farm_source_placeholder", "المزرعة أو البيان...")}
                                />
                            </div>

                            {/* Notes */}
                            <div className="md:col-span-2">
                                <InputLabel value={t("transfers.notes", "ملاحظات السند")} />
                                <TextInput
                                    className="w-full text-xs rounded-none border-border h-[32px] mt-1"
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    placeholder={t("transfers.notes_placeholder", "سبب النقل أو أي ملاحظات أخرى...")}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Source Available Inventory Selector Section */}
                    {data.source_contract_id && (
                        <div className="bg-surface border border-border p-4 shadow-sm rounded-none">
                            <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                                <h4 className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                                    <Search className="h-4 w-4" />
                                    <span>
                                        {t("transfers.available_pallets_title", "طبالي وأصناف عقد المصدر المتاحة في الثلاجة")}
                                        ({selectedSourceContract?.contract_number})
                                    </span>
                                </h4>
                                {availableInventory.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={addAllAvailableItems}
                                        className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-none flex items-center gap-1 transition-all"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>{t("transfers.add_all_available", "إضافة كافة الطبالي المتاحة للجدول")}</span>
                                    </button>
                                )}
                            </div>

                            {loadingInventory ? (
                                <div className="p-4 text-center text-xs text-text-muted">
                                    {t("transfers.loading_inventory", "جاري تحميل طبالي وأصناف عقد المصدر...")}
                                </div>
                            ) : availableInventory.length === 0 ? (
                                <div className="p-4 text-center text-xs text-text-muted flex items-center justify-center gap-1.5">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    <span>{t("transfers.no_inventory_found", "لا توجد طبالي أو أصناف مخزنة حالياً برصيد موجب تحت هذا العقد.")}</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                                    {availableInventory.map((item, idx) => {
                                        const isAdded = data.items.some(
                                            (row) =>
                                                row.pallet_id === item.pallet_id &&
                                                row.inventory_item_id === item.inventory_item_id &&
                                                row.inventory_item_variant_id === item.inventory_item_variant_id
                                        );
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => !isAdded && addItemFromInventory(item)}
                                                className={`p-2 border text-xs cursor-pointer transition-all flex justify-between items-center ${
                                                    isAdded
                                                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 pointer-events-none opacity-70"
                                                        : "bg-surface hover:bg-primary/10 border-border"
                                                }`}
                                            >
                                                <div>
                                                    <span className="font-bold block">
                                                        طبلية #{item.pallet?.pallet_number || item.pallet?.code}
                                                    </span>
                                                    <span className="text-[11px] text-text-muted block">
                                                        {item.inventoryItem?.name} {item.variant?.name ? `- ${item.variant.name}` : ""}
                                                    </span>
                                                </div>
                                                <div className="text-end shrink-0">
                                                    <span className="font-bold font-mono text-primary block">
                                                        {item.available_qty}
                                                    </span>
                                                    <span className="text-[9px] text-text-muted block">
                                                        {isAdded ? "مضاف بالجدول" : "انقر للإضافة"}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transferred Items Grid */}
                    <div className="bg-surface border border-border p-4 shadow-sm rounded-none">
                        <div className="flex justify-between items-center pb-2 border-b border-border mb-3">
                            <h4 className="text-xs font-bold text-text flex items-center gap-1.5">
                                <ArrowLeftRight className="h-4 w-4 text-primary" />
                                <span>{t("transfers.items_table_title", "جدول الأصناف والطبالي المراد تحويلها")}</span>
                            </h4>
                            <span className="text-xs font-mono font-bold text-primary">
                                {t("transfers.total_items_count", "عدد البنود")}: {data.items.length}
                            </span>
                        </div>

                        {data.items.length === 0 ? (
                            <div className="p-8 text-center text-xs text-text-muted border border-dashed border-border">
                                {t("transfers.empty_items_hint", "قم باختيار عقد المصدر أولاً، ثم اضغط على الطبالي والأصناف من القائمة أعلاه لإضافتها لجدول التحويل.")}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-start border-collapse">
                                    <thead>
                                        <tr className="bg-background border-b border-border font-bold text-text-muted">
                                            <th className="p-2.5 text-start w-10">#</th>
                                            <th className="p-2.5 text-start">{t("transfers.pallet", "رقم الطبلية")}</th>
                                            <th className="p-2.5 text-start">{t("transfers.item_name", "الصنف والدرجة")}</th>
                                            <th className="p-2.5 text-center w-28">{t("transfers.available_qty", "المتاح بالثلاجة")}</th>
                                            <th className="p-2.5 text-center w-36">{t("transfers.transfer_qty", "الكمية المنقولة")}</th>
                                            <th className="p-2.5 text-start">{t("transfers.item_notes", "ملاحظات")}</th>
                                            <th className="p-2.5 text-center w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.map((row, idx) => {
                                            const isExceeded = parseFloat(row.quantity || 0) > parseFloat(row.available_qty || 0);
                                            return (
                                                <tr key={idx} className="hover:bg-hover transition-colors">
                                                    <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                                    <td className="p-2.5 font-bold font-mono text-text">
                                                        طبلية #{row.pallet_number || row.pallet_id}
                                                    </td>
                                                    <td className="p-2.5">
                                                        <span className="font-bold text-text block">{row.item_name}</span>
                                                        {row.variant_name && <span className="text-[11px] text-text-muted block">{row.variant_name}</span>}
                                                    </td>
                                                    <td className="p-2.5 text-center font-mono font-bold text-slate-600">
                                                        {row.available_qty}
                                                    </td>
                                                    <td className="p-2.5 text-center">
                                                        <TextInput
                                                            type="number"
                                                            step="any"
                                                            min="0.01"
                                                            max={row.available_qty}
                                                            className={`w-28 text-xs rounded-none text-center font-mono font-bold h-[30px] ${
                                                                isExceeded ? "border-danger focus:border-danger text-danger" : "border-border"
                                                            }`}
                                                            value={row.quantity}
                                                            onChange={(e) => updateItemRow(idx, "quantity", e.target.value)}
                                                            required
                                                        />
                                                        {isExceeded && (
                                                            <span className="text-[9px] text-danger block mt-0.5">
                                                                {t("transfers.exceeded_qty_err", "تجاوزت المتاح!")}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5">
                                                        <TextInput
                                                            type="text"
                                                            className="w-full text-xs rounded-none border-border h-[30px]"
                                                            placeholder={t("transfers.item_notes_placeholder", "ملاحظة البند...")}
                                                            value={row.notes}
                                                            onChange={(e) => updateItemRow(idx, "notes", e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="p-2.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItemRow(idx)}
                                                            className="p-1 text-danger hover:bg-danger/10 rounded-none transition-colors"
                                                            title={t("common.delete", "حذف البند")}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-background font-bold text-xs border-t border-border">
                                            <td colSpan="4" className="p-3 text-start">
                                                {t("transfers.total_transferred_quantity", "إجمالي الكمية المنقولة بالسند")}:
                                            </td>
                                            <td className="p-3 text-center font-mono text-primary text-sm">
                                                {totalQuantity.toLocaleString()}
                                            </td>
                                            <td colSpan="2"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                        {errors.items && <InputError message={errors.items} className="mt-2" />}
                    </div>

                    {/* Action Footer Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border bg-surface p-3 shadow-sm">
                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, "draft")}
                            disabled={processing}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 font-bold rounded-none flex items-center gap-1.5 transition-all"
                        >
                            <Save className="h-4 w-4" />
                            <span>{t("transfers.save_draft", "حفظ كمسودة")}</span>
                        </button>

                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, "approved")}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 font-bold rounded-none flex items-center gap-1.5 transition-all"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{t("transfers.save_and_approve", "حفظ واعتماد السند مباشرة")}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
