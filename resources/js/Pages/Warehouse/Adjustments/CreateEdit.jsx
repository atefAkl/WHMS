import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { SlidersHorizontal, Save, Home, ChevronRight, AlertCircle, Plus, Trash2, Scale } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function CreateEdit({ customers = [], inventoryItems = [], pallets = [], isEdit = false, adjustment = null }) {
    const { lang } = useLang();
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [contractAgents, setContractAgents] = useState([]);
    const [loadingPallets, setLoadingPallets] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: adjustment?.customer_id || '',
        contract_id: adjustment?.contract_id || '',
        period_id: adjustment?.period_id || '',
        representative_id: adjustment?.representative_id || '',
        adjustment_date: adjustment?.adjustment_date || new Date().toISOString().split('T')[0],
        reason: adjustment?.reason || '',
        proof_file: null,
        items: adjustment?.items || [],
    });

    // Handle Customer Change
    useEffect(() => {
        if (data.customer_id) {
            const customer = customers.find((c) => c.id === parseInt(data.customer_id));
            if (customer) {
                setFilteredContracts(customer.contracts || []);
            } else {
                setFilteredContracts([]);
            }
        } else {
            setFilteredContracts([]);
            setAvailablePeriods([]);
            setContractAgents([]);
        }
    }, [data.customer_id, customers]);

    // Handle Contract Selection -> Instantly Fetch Pallet Balances & Periods
    useEffect(() => {
        if (data.contract_id) {
            const contractId = parseInt(data.contract_id);
            if (!contractId) return;

            const contract = filteredContracts.find((c) => c.id === contractId);
            if (contract) {
                const activePeriods = (contract.periods || []).filter((p) => p.status === 'active');
                setAvailablePeriods(activePeriods);
                setContractAgents(contract.contract_agents || []);
            }

            setLoadingPallets(true);
            axios.get(route('api.contracts.available-inventory', contractId))
                .then((res) => {
                    const inventory = res.data || [];
                    const formattedItems = inventory.map((inv) => {
                        const sysQty = parseFloat(inv.available_qty || 0);
                        return {
                            inventory_item_id: inv.inventory_item_id,
                            inventory_item_name: inv.inventoryItem?.name || 'صنف تمور',
                            inventory_item_variant_id: inv.inventory_item_variant_id,
                            variant_name: inv.variant?.name || 'درجة / عبوة',
                            pallet_id: inv.pallet_id,
                            pallet_number: inv.pallet?.pallet_number || inv.pallet?.code || inv.pallet_id,
                            system_quantity: sysQty,
                            actual_quantity: '', // Empty field for user to enter actual count
                            variance_quantity: 0,
                            notes: '',
                        };
                    });

                    setData((prev) => ({
                        ...prev,
                        items: formattedItems,
                    }));
                })
                .catch((err) => {
                    console.error("Error loading inventory balance:", err);
                })
                .finally(() => setLoadingPallets(false));
        } else {
            setData((prev) => ({ ...prev, items: [] }));
        }
    }, [data.contract_id]);

    // Handle Actual Counted Qty Entry (Actual Qty - System Qty = Variance)
    const handleActualQtyChange = (index, value) => {
        const updatedItems = [...data.items];
        updatedItems[index].actual_quantity = value;

        if (value === '' || value === null) {
            updatedItems[index].variance_quantity = 0;
        } else {
            const actualVal = parseFloat(value) || 0;
            const sysQty = updatedItems[index].system_quantity;
            updatedItems[index].variance_quantity = round2(actualVal - sysQty);
        }

        setData('items', updatedItems);
    };

    const handleAddManualRow = () => {
        const defaultItem = inventoryItems[0];
        const defaultVariant = defaultItem?.variants?.[0];
        const defaultPallet = pallets[0];

        const newRow = {
            inventory_item_id: defaultItem?.id || 1,
            inventory_item_name: defaultItem?.name || 'صنف تمور',
            inventory_item_variant_id: defaultVariant?.id || 1,
            variant_name: defaultVariant?.name || 'كرتون / درجة',
            pallet_id: defaultPallet?.id || 1,
            pallet_number: defaultPallet?.pallet_number || defaultPallet?.code || '1',
            system_quantity: 0,
            actual_quantity: '',
            variance_quantity: 0,
            notes: '',
        };

        setData('items', [...data.items, newRow]);
    };

    const handleRemoveRow = (index) => {
        const updated = [...data.items];
        updated.splice(index, 1);
        setData('items', updated);
    };

    const round2 = (num) => Math.round(num * 100) / 100;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const sanitizedItems = data.items.map((item) => ({
            ...item,
            actual_quantity: item.actual_quantity === '' ? 0 : parseFloat(item.actual_quantity),
            variance_quantity: item.actual_quantity === '' ? round2(0 - item.system_quantity) : round2(parseFloat(item.actual_quantity) - item.system_quantity),
        }));

        post(route('inventory-adjustments.store'), {
            data: {
                ...data,
                items: sanitizedItems,
            }
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <Link href={route('inventory-adjustments.index')} className="hover:text-primary transition-colors">
                {lang === "ar" ? "سندات تسوية وتصحيح الطبالي" : "Adjustments"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "إنشاء سند تسوية جديد" : "New Voucher"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "إنشاء سند تسوية وتصحيح طبالي جديد" : "New Inventory Adjustment"} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                <PageHeader
                    icon={SlidersHorizontal}
                    title={lang === "ar" ? "إنشاء سند تسوية وتصحيح فروقات الطبالي" : "New Pallet Inventory Adjustment"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "اختيار العقد يُحمّل تلقائياً العميل والمندوب وطبالي العقد بفهرسة الأصناف وأحجام الكراتين والكميات حسب النظام، مع خانات فارغة لإدخال الجرد بيدك."
                                : "Select contract to auto load customer, representative, pallets, and system balances with empty actual count inputs."}
                        </p>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Customer & Contract Selection Box */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Scale className="h-4 w-4 text-primary" />
                            <span>{lang === "ar" ? "بيانات العقد والعميل والمندوب" : "Contract & Representative Details"}</span>
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
                                            representative_id: '',
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

                            {/* Representative (Mandoob) */}
                            <div>
                                <InputLabel value={lang === "ar" ? "مندوب العميل (إن وجد)" : "Representative"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold rounded-none h-[38px] px-2"
                                    value={data.representative_id}
                                    onChange={(e) => setData('representative_id', e.target.value)}
                                    disabled={!data.contract_id}
                                >
                                    <option value="">{lang === "ar" ? "-- لا يوجد مندوب --" : "-- None --"}</option>
                                    {contractAgents.map((a) => (
                                        <option key={a.id} value={a.id}>{a.name} ({a.job_title || 'مندوب'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Reason & Proof File */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                            <div>
                                <InputLabel value={lang === "ar" ? "تاريخ التسوية والجرد *" : "Adjustment Date *"} />
                                <TextInput
                                    type="date"
                                    className="mt-1 block w-full text-xs font-bold rounded-none h-[38px] px-2 border-border"
                                    value={data.adjustment_date}
                                    onChange={(e) => setData('adjustment_date', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <InputLabel value={lang === "ar" ? "سبب التسوية وبيان الفحص الإحصائي *" : "Reason / Audit Notes *"} />
                                <textarea
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs rounded-none p-2 font-semibold"
                                    rows="1"
                                    placeholder={lang === "ar" ? "أدخل سبب التسوية (مثال: محضر فحص وإحصاء منصات التحميل بحضور المندوب)..." : "Reason..."}
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <InputLabel value={lang === "ar" ? "إرفاق صورة محضر الجرد (PDF/صورة)" : "Audit Minutes File"} />
                                <input
                                    type="file"
                                    className="mt-1 block w-full text-xs border border-border p-1 bg-surface"
                                    onChange={(e) => setData('proof_file', e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pallets Adjustments Table indexed by Item & Box size with Empty Actual Count inputs */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <div>
                                <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                    {lang === "ar" ? "طبالي العقد وإدخال ناتج ملف الجرد (خانات فارغة)" : "Contract Pallets & Actual Count Input"}
                                </h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {lang === "ar"
                                        ? "أدخل الأرقام في الخانات الفارغة (حسب ملف الجرد)، وسيحسب الباك الفروقات ويُنشئ قيد الإدخال أو الإخراج تلقائياً!"
                                        : "Enter actual counts in the empty audit fields."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {data.contract_id && (
                                    <button
                                        type="button"
                                        onClick={handleAddManualRow}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1 flex items-center gap-1 shadow-2xs"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>{lang === "ar" ? "إضافة طبلية يدوياً" : "Add Pallet Row"}</span>
                                    </button>
                                )}
                                {loadingPallets && (
                                    <span className="text-xs text-primary font-bold animate-pulse">
                                        {lang === "ar" ? "جاري تحميل وتجميع طبالي العقد..." : "Loading contract pallets..."}
                                    </span>
                                )}
                            </div>
                        </div>

                        {!data.contract_id ? (
                            <div className="p-8 text-center text-text-muted font-bold text-xs italic bg-slate-50 border border-dashed border-border">
                                {lang === "ar" ? "يرجى اختيار العقد أولاً لتحميل طباليه المخزنية المجمعة وفهرستها." : "Please select a contract first."}
                            </div>
                        ) : data.items.length === 0 ? (
                            <div className="p-8 text-center text-text-muted font-bold text-xs space-y-3 bg-amber-50 border border-amber-200 text-amber-900">
                                <div>{lang === "ar" ? "لم نجد طبالي سابقة مسجلة على هذا العقد، يمكنك إضافة طبلية وبند تسوية يدوياً!" : "No automatic pallets found for this contract."}</div>
                                <button
                                    type="button"
                                    onClick={handleAddManualRow}
                                    className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-1.5 inline-flex items-center gap-1 shadow-2xs"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span>{lang === "ar" ? "إضافة طبلية تسوية يدوية الآن" : "Add Manual Pallet Row Now"}</span>
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-border">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted font-bold border-b border-border text-text-muted">
                                        <tr>
                                            <th className="p-2.5 text-start w-8">#</th>
                                            <th className="p-2.5 text-start">{lang === "ar" ? "الصنف المخزني (نوع التمور)" : "Item (Date Variant)"}</th>
                                            <th className="p-2.5 text-center">{lang === "ar" ? "الدرجة / حجم الكرتون" : "Grade / Box Size"}</th>
                                            <th className="p-2.5 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet #"}</th>
                                            <th className="p-2.5 text-center w-32 bg-slate-100">{lang === "ar" ? "حسب النظام" : "System Qty"}</th>
                                            <th className="p-2.5 text-center w-36 bg-amber-50">{lang === "ar" ? "حسب ملف الجرد (أدخل الرقم)" : "Actual Count *"}</th>
                                            <th className="p-2.5 text-center w-32">{lang === "ar" ? "ناتج الفرق" : "Variance"}</th>
                                            <th className="p-2.5 text-center w-12">#</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                                <td className="p-2.5 font-bold text-text">
                                                    <select
                                                        className="w-full text-xs border-border rounded-none h-[30px] px-1 font-bold"
                                                        value={item.inventory_item_id}
                                                        onChange={(e) => {
                                                            const itemObj = inventoryItems.find(i => i.id === parseInt(e.target.value));
                                                            const updated = [...data.items];
                                                            updated[idx].inventory_item_id = parseInt(e.target.value);
                                                            updated[idx].inventory_item_name = itemObj?.name || 'صنف';
                                                            if (itemObj?.variants?.length > 0) {
                                                                updated[idx].inventory_item_variant_id = itemObj.variants[0].id;
                                                                updated[idx].variant_name = itemObj.variants[0].name;
                                                            }
                                                            setData('items', updated);
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
                                                                className="w-full text-xs border-border rounded-none h-[30px] px-1 font-semibold"
                                                                value={item.inventory_item_variant_id}
                                                                onChange={(e) => {
                                                                    const vObj = activeVariants.find(v => v.id === parseInt(e.target.value));
                                                                    const updated = [...data.items];
                                                                    updated[idx].inventory_item_variant_id = parseInt(e.target.value);
                                                                    updated[idx].variant_name = vObj?.name || 'درجة';
                                                                    setData('items', updated);
                                                                }}
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
                                                        className="w-full text-xs border-border rounded-none h-[30px] px-1 font-mono font-bold"
                                                        value={item.pallet_id}
                                                        onChange={(e) => {
                                                            const pObj = pallets.find(p => p.id === parseInt(e.target.value));
                                                            const updated = [...data.items];
                                                            updated[idx].pallet_id = parseInt(e.target.value);
                                                            updated[idx].pallet_number = pObj?.pallet_number || pObj?.code || e.target.value;
                                                            setData('items', updated);
                                                        }}
                                                    >
                                                        {pallets.map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                طبلية #{p.pallet_number || p.code || p.id}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-2.5 text-center font-mono font-black text-slate-800 text-sm bg-slate-100/80">
                                                    {item.system_quantity}
                                                </td>
                                                <td className="p-2.5 text-center bg-amber-50/50">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        placeholder="أدخل الكمية..."
                                                        className="w-full text-center text-xs font-mono font-black border-amber-400 focus:ring-amber-500 rounded-none h-[34px] px-2 bg-white placeholder:font-normal placeholder:text-gray-400"
                                                        value={item.actual_quantity}
                                                        onChange={(e) => handleActualQtyChange(idx, e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2.5 text-center font-mono font-black text-sm">
                                                    <span className={`px-2 py-1 block rounded-none border ${
                                                        item.variance_quantity > 0
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                            : item.variance_quantity < 0
                                                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                        {item.variance_quantity > 0 ? `+${item.variance_quantity} (إدخال)` : item.variance_quantity < 0 ? `${item.variance_quantity} (إخراج)` : '0 (مطابق)'}
                                                    </span>
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(idx)}
                                                        className="text-rose-600 hover:text-rose-800 p-1"
                                                        title={lang === "ar" ? "حذف البند" : "Remove"}
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
                            href={route('inventory-adjustments.index')}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-5 py-2.5"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </Link>
                        <button
                            type="submit"
                            disabled={processing || data.items.length === 0}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-6 py-2.5 flex items-center gap-2 disabled:opacity-50 shadow-2xs"
                        >
                            <Save className="h-4 w-4" />
                            <span>{lang === "ar" ? "حفظ مسودة سند التسوية" : "Save Adjustment Voucher"}</span>
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
