import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { ArrowLeftRight, Save, Home, ChevronRight, Plus, Trash2, Scale, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function CreateEdit({ customers = [], inventoryItems = [], pallets = [], isEdit = false, rearrangement = null }) {
    const { lang } = useLang();
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);

    const { data, setData, post, put, processing, errors } = useForm({
        customer_id: rearrangement?.customer_id || '',
        contract_id: rearrangement?.contract_id || '',
        period_id: rearrangement?.period_id || '',
        rearrangement_date: rearrangement?.rearrangement_date || new Date().toISOString().split('T')[0],
        notes: rearrangement?.notes || '',
        items: rearrangement?.items || [],
    });

    // Handle Customer Change
    useEffect(() => {
        if (data.customer_id) {
            const customer = customers.find((c) => c.id === parseInt(data.customer_id));
            setFilteredContracts(customer?.contracts || []);
        } else {
            setFilteredContracts([]);
            setAvailablePeriods([]);
        }
    }, [data.customer_id, customers]);

    // Handle Contract Selection
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
        }
    }, [data.contract_id]);

    // Calculate totals & verify balance equality per (item + variant)
    const totals = data.items.reduce(
        (acc, item) => {
            const qty = parseFloat(item.quantity) || 0;
            if (item.type === 'in') {
                acc.totalIn += qty;
            } else {
                acc.totalOut += qty;
            }
            return acc;
        },
        { totalIn: 0, totalOut: 0 }
    );

    const isBalanced = Math.abs(totals.totalIn - totals.totalOut) < 0.01 && data.items.length >= 2;

    const handleAddRow = (type = 'out') => {
        const defaultItem = inventoryItems[0];
        const defaultVariant = defaultItem?.variants?.[0];
        const defaultPallet = pallets[0];

        const newRow = {
            inventory_item_id: defaultItem?.id || 1,
            inventory_item_variant_id: defaultVariant?.id || 1,
            pallet_id: defaultPallet?.id || 1,
            type: type,
            quantity: '',
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
        setData('items', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isBalanced) {
            alert(lang === "ar" ? "خطأ: يجب أن تتساوى إجمالي المدخلات مع المخرجات لضمان عدم تغيير رصيد العقد!" : "Total IN must equal Total OUT!");
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
            <span className="text-primary font-medium">{isEdit ? (lang === "ar" ? "تعديل السند" : "Edit") : (lang === "ar" ? "إنشاء سند جديد" : "New Voucher")}</span>
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
                    <div className={`p-4 border font-bold text-xs flex justify-between items-center ${
                        isBalanced ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
                    }`}>
                        <div className="flex items-center gap-2">
                            {isBalanced ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                            <div>
                                <span>{lang === "ar" ? "حالة توازن ترحيل الكميات:" : "Transfer Balance Status:"} </span>
                                <span className="font-black">
                                    {isBalanced ? (lang === "ar" ? "متوازن 100% (إجمالي المدخلات يساوي إجمالي المخرجات)" : "Balanced 100%") : (lang === "ar" ? "غير متوازن (يجب أن تتساوى المدخلات مع المخرجات)" : "Unbalanced")}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono font-black">
                            <span className="text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2.5 py-1">
                                {lang === "ar" ? "المخرجات (خصم): " : "OUT: "} {totals.totalOut}
                            </span>
                            <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                                {lang === "ar" ? "المدخلات (إضافة): " : "IN: "} {totals.totalIn}
                            </span>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div>
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {lang === "ar" ? "جدول حركات ترتيب ونقل الطبالي" : "Transfer Rows"}
                                </h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {lang === "ar"
                                        ? "حدد الطبلية المصدر والصنف والدرجة والكمية المخرجة، ثم حدد الطبلية المستهدفة والكمية المدخلة ليضمن النظام التساوي الكامل."
                                        : "Select source & target pallets with item/variant and transfer quantities."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleAddRow('out')}
                                    className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1 flex items-center gap-1 shadow-2xs"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>{lang === "ar" ? "+ مخرجات (خصم من طبلية)" : "+ Add OUT Row"}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleAddRow('in')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 flex items-center gap-1 shadow-2xs"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>{lang === "ar" ? "+ مدخلات (إضافة لطبلية)" : "+ Add IN Row"}</span>
                                </button>
                            </div>
                        </div>

                        {data.items.length === 0 ? (
                            <div className="p-8 text-center text-text-muted font-bold text-xs space-y-3 bg-slate-50 border border-dashed border-border">
                                <div>{lang === "ar" ? "لم يتم إضافة أي حركات تحويل بعد. يرجى إضافة صف مخرجات وصف مدخلات." : "No transfer rows added yet."}</div>
                                <div className="flex justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleAddRow('out')}
                                        className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 inline-flex items-center gap-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>{lang === "ar" ? "إضافة صف مخرجات" : "Add OUT"}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAddRow('in')}
                                        className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 inline-flex items-center gap-1"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>{lang === "ar" ? "إضافة صف مدخلات" : "Add IN"}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-border">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted font-bold border-b border-border text-text-muted">
                                        <tr>
                                            <th className="p-2.5 text-start w-8">#</th>
                                            <th className="p-2.5 text-center w-36">{lang === "ar" ? "نوع الحركة" : "Movement Type *"}</th>
                                            <th className="p-2.5 text-start">{lang === "ar" ? "الصنف المخزني" : "Item *"}</th>
                                            <th className="p-2.5 text-center">{lang === "ar" ? "الدرجة / العبوة" : "Grade / Box Size *"}</th>
                                            <th className="p-2.5 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet # *"}</th>
                                            <th className="p-2.5 text-center w-32">{lang === "ar" ? "الكمية المحولة" : "Quantity *"}</th>
                                            <th className="p-2.5 text-center w-12">#</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                                <td className="p-2.5 text-center">
                                                    <select
                                                        className={`w-full text-xs font-black rounded-none h-[32px] px-2 border ${
                                                            item.type === 'in' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-rose-50 text-rose-800 border-rose-300'
                                                        }`}
                                                        value={item.type}
                                                        onChange={(e) => handleRowChange(idx, 'type', e.target.value)}
                                                    >
                                                        <option value="out">{lang === "ar" ? "مخرجات (خصم)" : "OUT (Transfer From)"}</option>
                                                        <option value="in">{lang === "ar" ? "مدخلات (إضافة)" : "IN (Transfer To)"}</option>
                                                    </select>
                                                </td>
                                                <td className="p-2.5 font-bold text-text">
                                                    <select
                                                        className="w-full text-xs border-border rounded-none h-[32px] px-1 font-bold"
                                                        value={item.inventory_item_id}
                                                        onChange={(e) => {
                                                            const itemObj = inventoryItems.find(i => i.id === parseInt(e.target.value));
                                                            handleRowChange(idx, 'inventory_item_id', parseInt(e.target.value));
                                                            if (itemObj?.variants?.length > 0) {
                                                                handleRowChange(idx, 'inventory_item_variant_id', itemObj.variants[0].id);
                                                            }
                                                        }}
                                                    >
                                                        {inventoryItems.map(inv => (
                                                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-2.5 text-center font-semibold text-text-muted">
                                                    {(() => {
                                                        const activeItemObj = inventoryItems.find(i => i.id === parseInt(item.inventory_item_id));
                                                        const activeVariants = activeItemObj?.variants || [];
                                                        return (
                                                            <select
                                                                className="w-full text-xs border-border rounded-none h-[32px] px-1 font-semibold"
                                                                value={item.inventory_item_variant_id}
                                                                onChange={(e) => handleRowChange(idx, 'inventory_item_variant_id', parseInt(e.target.value))}
                                                            >
                                                                {activeVariants.map(v => (
                                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                                ))}
                                                            </select>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-2.5 text-center font-mono font-bold text-primary">
                                                    <select
                                                        className="w-full text-xs border-border rounded-none h-[32px] px-1 font-mono font-bold"
                                                        value={item.pallet_id}
                                                        onChange={(e) => handleRowChange(idx, 'pallet_id', parseInt(e.target.value))}
                                                    >
                                                        {pallets.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                طبلية #{p.pallet_number || p.code || p.id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        placeholder="الكمية..."
                                                        className="w-full text-center text-xs font-mono font-black border-border focus:ring-primary rounded-none h-[32px] px-2"
                                                        value={item.quantity}
                                                        onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(idx)}
                                                        className="text-rose-600 hover:text-rose-800 p-1"
                                                        title={lang === "ar" ? "حذف الصف" : "Remove"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
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
