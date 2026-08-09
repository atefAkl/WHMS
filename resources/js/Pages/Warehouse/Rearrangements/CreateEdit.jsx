import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { ArrowLeftRight, Save, Home, ChevronRight, Plus, Trash2, Scale, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function CreateEdit({ customers = [], isEdit = false, rearrangement = null }) {
    const { lang } = useLang();
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);

    // Preloaded contract options (no AJAX on row changes)
    const [contractOptions, setContractOptions] = useState({
        pallets: [],
        items: [],
        variants: [],
    });
    const [loadingOptions, setLoadingOptions] = useState(false);

    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: rearrangement?.customer_id || '',
        contract_id: rearrangement?.contract_id || '',
        period_id: rearrangement?.period_id || '',
        rearrangement_date: rearrangement?.rearrangement_date || new Date().toISOString().split('T')[0],
        notes: rearrangement?.notes || '',
        items: rearrangement?.items || [],
    });

    // Handle Customer Selection
    useEffect(() => {
        if (data.customer_id) {
            const customer = customers.find((c) => c.id === parseInt(data.customer_id));
            setFilteredContracts(customer?.contracts || []);
        } else {
            setFilteredContracts([]);
            setAvailablePeriods([]);
        }
    }, [data.customer_id, customers]);

    // Handle Contract Selection -> Fetch contract options ONCE (pallets, items, variants with balance > 0)
    useEffect(() => {
        if (data.contract_id) {
            const contractId = parseInt(data.contract_id);
            const contract = filteredContracts.find((c) => c.id === contractId);
            if (contract) {
                const activePeriods = (contract.periods || []).filter((p) => p.status === 'active');
                setAvailablePeriods(activePeriods);
                if (!data.period_id) {
                    setData('period_id', activePeriods?.[0]?.id || '');
                }
            }

            setLoadingOptions(true);
            axios.get(route('api.contracts.rearrangement-options', contractId))
                .then((res) => {
                    const opts = res.data || { pallets: [], items: [], variants: [] };
                    setContractOptions(opts);

                    // Initialize 2 empty rows if create mode and no items exist
                    if (!isEdit && data.items.length === 0) {
                        const defaultPallet = opts.pallets?.[0]?.id || '';
                        const defaultItem = opts.items?.[0]?.id || '';
                        const defaultVariant = opts.variants?.find(v => v.inventory_item_id === defaultItem)?.id || opts.variants?.[0]?.id || '';

                        const createEmptyRow = () => ({
                            pallet_id: defaultPallet,
                            inventory_item_id: defaultItem,
                            inventory_item_variant_id: defaultVariant,
                            quantity_in: '',
                            quantity_out: '',
                            notes: '',
                        });

                        setData('items', [createEmptyRow(), createEmptyRow()]);
                    }
                })
                .catch(() => { })
                .finally(() => setLoadingOptions(false));
        } else {
            setContractOptions({ pallets: [], items: [], variants: [] });
        }
    }, [data.contract_id]);

    // Calculate totals & balance status
    const totals = data.items.reduce(
        (acc, item) => {
            const qtyIn = parseFloat(item.quantity_in) || 0;
            const qtyOut = parseFloat(item.quantity_out) || 0;
            acc.totalIn += qtyIn;
            acc.totalOut += qtyOut;
            return acc;
        },
        { totalIn: 0, totalOut: 0 }
    );

    const isBalanced = Math.abs(totals.totalIn - totals.totalOut) < 0.01 && totals.totalIn > 0;

    const handleAddRow = () => {
        const defaultPallet = contractOptions.pallets?.[0]?.id || '';
        const defaultItem = contractOptions.items?.[0]?.id || '';
        const defaultVariant = contractOptions.variants?.find(v => v.inventory_item_id === defaultItem)?.id || contractOptions.variants?.[0]?.id || '';

        const newRow = {
            pallet_id: defaultPallet,
            inventory_item_id: defaultItem,
            inventory_item_variant_id: defaultVariant,
            quantity_in: '',
            quantity_out: '',
            notes: '',
        };

        setData('items', [...data.items, newRow]);
    };

    const handleRemoveRow = (index) => {
        const updated = [...data.items];
        updated.splice(index, 1);
        setData('items', updated);
    };

    const handleRowChange = (index, field, value) => {
        const updated = [...data.items];
        updated[index][field] = value;

        // Automatically set first matching variant when item changes
        if (field === 'inventory_item_id') {
            const itemId = parseInt(value);
            const firstVariant = contractOptions.variants.find(v => v.inventory_item_id === itemId);
            if (firstVariant) {
                updated[index]['inventory_item_variant_id'] = firstVariant.id;
            }
        }

        setData('items', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isBalanced) {
            alert(lang === "ar" ? "خطأ: يجب أن تتساوى إجمالي خانة المدخلات مع المخرجات لضمان عدم تغيير إجمالي رصيد العقد!" : "Total IN must equal Total OUT!");
            return;
        }

        if (isEdit) {
            put(route('pallet-rearrangements.update', rearrangement.id));
        } else {
            post(route('pallet-rearrangements.store'));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route('pallet-rearrangements.index')} className="hover:text-primary transition-colors">
                {lang === "ar" ? "ترتيب الطبالي" : "Rearrangements"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">{isEdit ? (lang === "ar" ? "تعديل السند" : "Edit") : (lang === "ar" ? "إنشاء سند" : "New Voucher")}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={isEdit ? "تعديل سند ترتيب ونقل طبالي" : "إنشاء سند ترتيب ونقل طبالي جديد"} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>

                <PageHeader
                    icon={ArrowLeftRight}
                    title={isEdit ? `تعديل سند ترتيب طبالي رقم: ${rearrangement?.serial_number}` : (lang === "ar" ? "إنشاء سند ترتيب ونقل الطبالي الداخلية (كود 15)" : "New Pallet Rearrangement Voucher")}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "يتيح لمسؤول التخزين نقل وتحويل الكميات بين طبالي العقد داخل المستودع دون التأثير على إجمالي كميات العقد أو الأنواع."
                                : "Transfer quantities between pallets under the same contract without altering total balances."}
                        </p>
                    }
                />

                {errors.items && (
                    <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                        <span>{errors.items}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Header Info */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="h-4 w-4 text-primary" />
                            <span>{lang === "ar" ? "بيانات العقد والتعاقد" : "Contract Info"}</span>
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                            {/* Customer */}
                            <div>
                                <InputLabel value={lang === "ar" ? "العميل المتعاقد *" : "Customer *"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold rounded-none h-[38px] px-2"
                                    value={data.customer_id}
                                    onChange={(e) => {
                                        setData((d) => ({
                                            ...d,
                                            customer_id: e.target.value,
                                            contract_id: '',
                                            period_id: '',
                                            items: [],
                                        }));
                                    }}
                                    required
                                >
                                    <option value="">{lang === "ar" ? "-- اختر العميل --" : "-- Select Customer --"}</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Contract */}
                            <div>
                                <InputLabel value={lang === "ar" ? "العقد المعتمد *" : "Contract *"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold rounded-none h-[38px] px-2"
                                    value={data.contract_id}
                                    onChange={(e) => setData('contract_id', e.target.value)}
                                    disabled={!data.customer_id}
                                    required
                                >
                                    <option value="">{lang === "ar" ? "-- اختر العقد --" : "-- Select Contract --"}</option>
                                    {filteredContracts.map((c) => (
                                        <option key={c.id} value={c.id}>{c.contract_number}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Operating Period */}
                            <div>
                                <InputLabel value={lang === "ar" ? "الفترة التخزينية *" : "Period *"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold rounded-none h-[38px] px-2"
                                    value={data.period_id}
                                    onChange={(e) => setData('period_id', e.target.value)}
                                    disabled={!data.contract_id}
                                >
                                    <option value="">{lang === "ar" ? "-- الفترة النشطة --" : "-- Active Period --"}</option>
                                    {availablePeriods.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {lang === "ar" ? `الفترة ${p.period_number}` : `Period ${p.period_number}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date */}
                            <div>
                                <InputLabel value={lang === "ar" ? "تاريخ الترتيب والنقل *" : "Date *"} />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full text-xs font-bold rounded-none h-[38px] px-2 border-border"
                                    value={data.rearrangement_date}
                                    onChange={(e) => setData('rearrangement_date', e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={lang === "ar" ? "ملاحظات وتفاصيل أسباب الترتيب الداخلي" : "Notes"} />
                            <textarea
                                className="mt-1 block w-full border-border bg-surface text-text text-xs rounded-none p-2 font-semibold"
                                rows="2"
                                placeholder={lang === "ar" ? "أدخل سبب النقل (مثال: تجميع أصناف وتفريغ منصة، أو تصحيح كرتون بين طبلية لأخرى)..." : "Notes..."}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Balance Indicator Banner */}
                    <div className={`p-4 border font-bold text-xs flex justify-between items-center ${isBalanced ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                        }`}>
                        <div className="flex items-center gap-2">
                            {isBalanced ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                            <div>
                                <span>{lang === "ar" ? "حالة توازن ترحيل الكميات:" : "Transfer Balance Status:"} </span>
                                <span className="font-black">
                                    {isBalanced ? (lang === "ar" ? "متوازن 100% (إجمالي المدخلات يساوي إجمالي المخرجات)" : "Balanced 100%") : (lang === "ar" ? "غير متوازن (أدخل أرقام المدخلات والمخرجات ليتساويا)" : "Unbalanced")}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono font-black">
                            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                                {lang === "ar" ? "(إضافة): " : "IN: "} {totals.totalIn}
                            </span>
                            <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2.5 py-1">
                                {lang === "ar" ? "(خصم): " : "OUT: "} {totals.totalOut}
                            </span>
                        </div>
                    </div>

                    {/* Items Table matching EXACT column order from image */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        {!data.contract_id ? (
                            <div className="p-8 text-center text-text-muted font-bold text-xs italic bg-slate-50 border border-dashed border-border">
                                {lang === "ar" ? "يرجى اختيار العقد أولاً لتفعيل إضافة صفوف النقل." : "Please select a contract first."}
                            </div>
                        ) : loadingOptions ? (
                            <div className="p-8 text-center text-primary font-bold text-xs flex items-center justify-center gap-2 bg-slate-50 border border-border">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>{lang === "ar" ? "جاري تحميل طبالي وأصناف العقد المتاحة (رصيد > 0)..." : "Loading contract options..."}</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-border p-2">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted font-bold border-b border-border text-text font-black">
                                        <tr>
                                            {/* Column 1 (Right): الطبلية */}
                                            <th className="p-2.5 text-start w-48 font-black text-sm">{lang === "ar" ? "الطبلية" : "Pallet"}</th>

                                            {/* Column 2: اختر الصنف */}
                                            <th className="p-2.5 text-start font-black text-sm">{lang === "ar" ? "اختر الصنف" : "Item"}</th>

                                            {/* Column 3: الدرجة */}
                                            <th className="p-2.5 text-start w-48 font-black text-sm">{lang === "ar" ? "الدرجة" : "Grade / Box"}</th>

                                            {/* Column 4: مدخلات */}
                                            <th className="p-2.5 text-center w-36 font-black text-sm">{lang === "ar" ? "مدخلات" : "IN"}</th>

                                            {/* Column 5: مخرجات */}
                                            <th className="p-2.5 text-center w-36 font-black text-sm">{lang === "ar" ? "مخرجات" : "OUT"}</th>

                                            {/* Column 6 (Left Header Action): Green Add Row Button */}
                                            <th className="p-2 text-center w-36">
                                                <button
                                                    type="button"
                                                    onClick={handleAddRow}
                                                    className="w-full bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-black py-2 px-3 rounded-md shadow-md flex items-center justify-center gap-1 transition-all"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    <span>{lang === "ar" ? "أضف صف" : "Add Row"}</span>
                                                </button>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.map((item, idx) => {
                                            const activeVariants = contractOptions.variants.filter(
                                                (v) => v.inventory_item_id === parseInt(item.inventory_item_id)
                                            );

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    {/* Column 1 (Right): الطبلية */}
                                                    <td className="p-2 text-start">
                                                        <select
                                                            className="w-full text-xs font-mono font-bold border-border rounded-md h-[38px] px-2 text-text"
                                                            value={item.pallet_id}
                                                            onChange={(e) => handleRowChange(idx, 'pallet_id', parseInt(e.target.value))}
                                                        >
                                                            <option value="">{lang === "ar" ? "اختر الطبلية..." : "Select Pallet..."}</option>
                                                            {contractOptions.pallets.map((p) => (
                                                                <option key={p.id} value={p.id}>
                                                                    طبلية #{p.pallet_number} {p.balance > 0 ? `(رصيد: ${p.balance})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* Column 2: اختر الصنف */}
                                                    <td className="p-2 text-start">
                                                        <select
                                                            className="w-full text-xs font-bold border-border rounded-md h-[38px] px-2 text-text"
                                                            value={item.inventory_item_id}
                                                            onChange={(e) => handleRowChange(idx, 'inventory_item_id', parseInt(e.target.value))}
                                                        >
                                                            <option value="">{lang === "ar" ? "اختر الصنف....." : "Select Item..."}</option>
                                                            {contractOptions.items.map((inv) => (
                                                                <option key={inv.id} value={inv.id}>{inv.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* Column 3: الدرجة */}
                                                    <td className="p-2 text-start">
                                                        <select
                                                            className="w-full text-xs font-semibold border-border rounded-md h-[38px] px-2 text-text"
                                                            value={item.inventory_item_variant_id}
                                                            onChange={(e) => handleRowChange(idx, 'inventory_item_variant_id', parseInt(e.target.value))}
                                                        >
                                                            <option value="">{lang === "ar" ? "الدرجة" : "Grade..."}</option>
                                                            {activeVariants.map((v) => (
                                                                <option key={v.id} value={v.id}>{v.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>

                                                    {/* Column 4: مدخلات */}
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="..."
                                                            className="w-full text-center text-xs font-mono font-black border-border rounded-md h-[38px] px-2 bg-white"
                                                            value={item.quantity_in}
                                                            onChange={(e) => handleRowChange(idx, 'quantity_in', e.target.value)}
                                                        />
                                                    </td>

                                                    {/* Column 5: مخرجات */}
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            placeholder="..."
                                                            className="w-full text-center text-xs font-mono font-black border-border rounded-md h-[38px] px-2 bg-white"
                                                            value={item.quantity_out}
                                                            onChange={(e) => handleRowChange(idx, 'quantity_out', e.target.value)}
                                                        />
                                                    </td>

                                                    {/* Column 6 (Left): Delete Trash Icon matching image position */}
                                                    <td className="p-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(idx)}
                                                            className="text-gray-400 hover:text-rose-600 p-2 transition-colors inline-flex items-center justify-center"
                                                            title={lang === "ar" ? "حذف الصف" : "Remove"}
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Submit Bar */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Link
                            href={route('pallet-rearrangements.index')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-5 py-2.5"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || !isBalanced}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 shadow-2xs"
                        >
                            <Save className="h-4 w-4" />
                            <span>{lang === "ar" ? "حفظ مسودة سند الترتيب" : "Save Rearrangement Voucher"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
