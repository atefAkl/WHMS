import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { SlidersHorizontal, Save, Home, ChevronRight, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function CreateEdit({ customers = [], isEdit = false, adjustment = null }) {
    const { lang } = useLang();
    const [filteredContracts, setFilteredContracts] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [loadingPallets, setLoadingPallets] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        customer_id: adjustment?.customer_id || '',
        contract_id: adjustment?.contract_id || '',
        period_id: adjustment?.period_id || '',
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
        }
    }, [data.customer_id, customers]);

    // Handle Contract Change -> Fetch available pallets & balances
    useEffect(() => {
        if (data.contract_id) {
            const contract = filteredContracts.find((c) => c.id === parseInt(data.contract_id));
            if (contract) {
                const activePeriods = (contract.periods || []).filter((p) => p.status === 'active');
                setAvailablePeriods(activePeriods);
                if (!data.period_id) {
                    setData('period_id', activePeriods?.[0]?.id || '');
                }

                // Fetch Available Pallets & Balances for this contract
                setLoadingPallets(true);
                axios.get(route('api.contracts.available-inventory', contract.id))
                    .then((res) => {
                        const inventory = res.data || [];
                        const formattedItems = inventory.map((inv) => {
                            const sysQty = parseFloat(inv.available_qty || 0);
                            return {
                                inventory_item_id: inv.inventory_item_id,
                                inventory_item_name: inv.inventory_item?.name || '—',
                                inventory_item_variant_id: inv.inventory_item_variant_id,
                                variant_name: inv.variant?.name || '—',
                                pallet_id: inv.pallet_id,
                                pallet_number: inv.pallet?.pallet_number || inv.pallet?.code || inv.pallet_id,
                                system_quantity: sysQty,
                                actual_quantity: sysQty,
                                variance_quantity: 0,
                                notes: '',
                            };
                        });
                        setData('items', formattedItems);
                    })
                    .catch((err) => {
                        console.error("Error loading inventory balance:", err);
                        setData('items', []);
                    })
                    .finally(() => setLoadingPallets(false));
            }
        } else {
            setAvailablePeriods([]);
            setData('items', []);
        }
    }, [data.contract_id, filteredContracts]);

    const handleActualQtyChange = (index, value) => {
        const actualVal = parseFloat(value) || 0;
        const updatedItems = [...data.items];
        const sysQty = updatedItems[index].system_quantity;
        
        updatedItems[index].actual_quantity = value;
        updatedItems[index].variance_quantity = round2(actualVal - sysQty);
        
        setData('items', updatedItems);
    };

    const round2 = (num) => Math.round(num * 100) / 100;

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('inventory-adjustments.store'));
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
                                ? "اختر العقد والطبالي المراد إحصاؤها لتعديل الرصيد الفعلي الجردي بالزيادة أو النقص بحضور وإثبات المحضر."
                                : "Adjust pallet actual count surplus/deficit cleanly."}
                        </p>
                    }
                />

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Customer & Contract Selection Box */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        <h3 className="font-bold text-xs text-primary border-b border-border pb-2 uppercase tracking-wider">
                            {lang === "ar" ? "بيانات العقد والفترة التخزينية" : "Contract & Customer Details"}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                            {/* Customer */}
                            <div>
                                <InputLabel value={lang === "ar" ? "العميل *" : "Customer *"} />
                                <select
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs font-bold rounded-none h-[38px] px-2"
                                    value={data.customer_id}
                                    onChange={(e) => {
                                        setData((d) => ({
                                            ...d,
                                            customer_id: e.target.value,
                                            contract_id: '',
                                            period_id: '',
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

                            {/* Adjustment Date */}
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
                        </div>

                        {/* Reason & Proof File */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
                            <div>
                                <InputLabel value={lang === "ar" ? "سبب التسوية وبيان الفحص والإحصاء *" : "Reason / Audit Notes *"} />
                                <textarea
                                    className="mt-1 block w-full border-border bg-surface text-text text-xs rounded-none p-2 font-semibold"
                                    rows="2"
                                    placeholder={lang === "ar" ? "أدخل سبب إجراء التسوية (مثال: إعادة فحص وإحصاء منصات التحميل بحضور المندوب)..." : "Reason for adjustment..."}
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <InputLabel value={lang === "ar" ? "إرفاق صورة محضر الفحص والجرد (PDF/صورة)" : "Audit Minutes File"} />
                                <input
                                    type="file"
                                    className="mt-1 block w-full text-xs border border-border p-1.5 bg-surface"
                                    onChange={(e) => setData('proof_file', e.target.files[0])}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pallets Adjustments Table */}
                    <div className="bg-surface border border-border p-5 shadow-2xs space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-2">
                            <h3 className="font-bold text-xs text-primary uppercase tracking-wider">
                                {lang === "ar" ? "جدول طبالي العقد وإحصاء الفروقات" : "Contract Pallets Inventory Audit Table"}
                            </h3>
                            {loadingPallets && (
                                <span className="text-xs text-primary font-bold animate-pulse">
                                    {lang === "ar" ? "جاري تحميل أرصدة طبالي العقد..." : "Loading contract pallets..."}
                                </span>
                            )}
                        </div>

                        {!data.contract_id ? (
                            <div className="p-8 text-center text-text-muted font-bold text-xs italic bg-slate-50 border border-dashed border-border">
                                {lang === "ar" ? "يرجى اختيار العقد أولاً لتحميل طباليه المخزنية وتصحيح الفروقات عليها." : "Please select a contract first."}
                            </div>
                        ) : data.items.length === 0 ? (
                            <div className="p-8 text-center text-text-muted font-bold text-xs italic bg-amber-50 border border-amber-200 text-amber-800">
                                {lang === "ar" ? "لا توجد طبالي مخزنية ذات أرصدة مسجلة في هذا العقد حالياً." : "No pallet inventory balances found for this contract."}
                            </div>
                        ) : (
                            <div className="overflow-x-auto border border-border">
                                <table className="w-full text-xs text-start">
                                    <thead className="bg-surface-muted font-bold border-b border-border text-text-muted">
                                        <tr>
                                            <th className="p-2.5 text-start w-8">#</th>
                                            <th className="p-2.5 text-start">{lang === "ar" ? "الصنف المخزني" : "Item"}</th>
                                            <th className="p-2.5 text-center">{lang === "ar" ? "الدرجة / العبوة" : "Grade / Box"}</th>
                                            <th className="p-2.5 text-center">{lang === "ar" ? "رقم الطبلية" : "Pallet #"}</th>
                                            <th className="p-2.5 text-center w-28">{lang === "ar" ? "رصيد النظام" : "System Qty"}</th>
                                            <th className="p-2.5 text-center w-36">{lang === "ar" ? "الكمية الفعلية الجردية *" : "Actual Qty *"}</th>
                                            <th className="p-2.5 text-center w-28">{lang === "ar" ? "فرق التسوية" : "Variance"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="p-2.5 font-mono text-text-muted">{idx + 1}</td>
                                                <td className="p-2.5 font-bold text-text">{item.inventory_item_name}</td>
                                                <td className="p-2.5 text-center font-semibold text-text-muted">{item.variant_name}</td>
                                                <td className="p-2.5 text-center font-mono font-bold text-primary">طبلية #{item.pallet_number}</td>
                                                <td className="p-2.5 text-center font-mono font-black text-slate-700 text-sm bg-slate-50">
                                                    {item.system_quantity}
                                                </td>
                                                <td className="p-2.5 text-center">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="w-full text-center text-xs font-mono font-black border-primary focus:ring-primary rounded-none h-[34px] px-2 bg-white"
                                                        value={item.actual_quantity}
                                                        onChange={(e) => handleActualQtyChange(idx, e.target.value)}
                                                        required
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
                                                        {item.variance_quantity > 0 ? `+${item.variance_quantity}` : item.variance_quantity}
                                                    </span>
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
