import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";
import axios from "axios";
import { 
    Ticket, 
    Plus, 
    Printer, 
    Search, 
    CheckCircle2, 
    AlertTriangle, 
    User, 
    FileText, 
    Truck, 
    Clock,
    Calendar,
    ArrowLeft
} from "lucide-react";

export default function Index({ tickets, customers, drivers }) {
    const { lang } = useLang();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        customer_id: "",
        contract_id: "",
        driver_name: "",
        driver_id: "",
        estimated_load: "",
        notes: "",
    });

    // Contract contracts list & status checks
    const [customerContracts, setCustomerContracts] = useState([]);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [queueInfo, setQueueInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);

    // Fetch contracts when customer is selected
    useEffect(() => {
        if (data.customer_id) {
            setLoadingContracts(true);
            setQueueInfo(null);
            setData("contract_id", "");
            
            axios.get(`/api/customers/${data.customer_id}/contracts`)
                .then(res => {
                    const contractsList = Array.isArray(res.data) ? res.data : [];
                    setCustomerContracts(contractsList);
                })
                .catch(err => {
                    console.error(err);
                    setCustomerContracts([]);
                })
                .finally(() => setLoadingContracts(false));
        } else {
            setCustomerContracts([]);
            setQueueInfo(null);
        }
    }, [data.customer_id]);

    // Fetch contract queue info when contract is selected
    useEffect(() => {
        if (data.contract_id) {
            setLoadingInfo(true);
            axios.get(`/api/contracts/${data.contract_id}/queue-info`)
                .then(res => {
                    setQueueInfo(res.data);
                })
                .catch(err => {
                    console.error(err);
                    setQueueInfo(null);
                })
                .finally(() => setLoadingInfo(false));
        } else {
            setQueueInfo(null);
        }
    }, [data.contract_id]);

    const handleDriverSelect = (driverId) => {
        setData("driver_id", driverId);
        const selDriver = drivers.find(d => d.id == driverId);
        if (selDriver) {
            setData("driver_name", selDriver.name);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("queue-tickets.store"), {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
            },
        });
    };

    const canIssueTicket = queueInfo && queueInfo.has_active_period && (queueInfo.booked_pallets === 0 || queueInfo.remaining_balance > 0);

    return (
        <AuthenticatedLayout
            header={lang === "ar" ? "تذاكر وأرقام الانتظار" : "Queue Tickets"}
        >
            <Head title={lang === "ar" ? "تذاكر الانتظار" : "Queue Tickets"} />

            <div className="space-y-6">
                
                {/* Info Banner & Action Button */}
                <div className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h3 className="font-extrabold text-base text-text flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            {lang === "ar" ? "نظام إدارة واستقبال السائقين الذكي" : "Smart Driver Queue System"}
                        </h3>
                        <p className="text-xs text-text-muted">
                            {lang === "ar"
                                ? "إصدار استيكرات أرقام الانتظار فور وصول المندوب/السائق، والتحقق الآلي من الفترات النشطة ورصيد الطبالي."
                                : "Issue 10x15cm queue stickers upon driver arrival with real-time active period & pallet balance checks."}
                        </p>
                    </div>

                    <PrimaryButton
                        onClick={() => {
                            reset();
                            clearErrors();
                            setQueueInfo(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs py-2.5 px-4 shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        {lang === "ar" ? "إصدار رقم انتظار جديد" : "Issue New Queue Ticket"}
                    </PrimaryButton>
                </div>

                {/* Queue Tickets Table */}
                <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-gray-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-xs text-text flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            {lang === "ar" ? "سجل تذاكر الانتظار الصادرة" : "Issued Queue Tickets History"}
                        </h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-start">
                            <thead>
                                <tr className="border-b border-border bg-gray-50 text-text-muted font-bold">
                                    <th className="p-3 text-start">{lang === "ar" ? "تاريخ اليوم" : "Date"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "رقم الانتظار" : "Queue No."}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "رمز العقد" : "Contract Suffix"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "العميل" : "Customer"}</th>
                                    <th className="p-3 text-start">{lang === "ar" ? "السائق" : "Driver"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "وقت الوصول" : "Arrival Time"}</th>
                                    <th className="p-3 text-center">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {tickets.data && tickets.data.length > 0 ? (
                                    tickets.data.map((t) => (
                                        <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-3 font-mono text-text-muted">{t.ticket_date}</td>
                                            <td className="p-3 text-center">
                                                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-1 rounded-lg font-mono text-sm">
                                                    {String(t.daily_sequence).padStart(2, '0')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="bg-primary/10 text-primary border border-primary/20 font-black px-2.5 py-1 rounded-lg font-mono text-sm">
                                                    {t.contract_number_suffix}
                                                </span>
                                            </td>
                                            <td className="p-3 font-bold text-text">{t.customer?.name}</td>
                                            <td className="p-3 font-medium text-text-muted">{t.driver_name || "—"}</td>
                                            <td className="p-3 text-center font-mono text-text-muted">{t.day_time_str}</td>
                                            <td className="p-3 text-center">
                                                <Link
                                                    href={route("queue-tickets.print", t.id)}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all border border-blue-200"
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                    {lang === "ar" ? "طباعة الاستيكر" : "Print Sticker"}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-text-muted">
                                            {lang === "ar" ? "لا توجد تذاكر انتظار مسجلة حتى الآن." : "No queue tickets issued yet."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Issue Queue Ticket Modal */}
            <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="2xl">
                <div className="p-6 space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
                    <div className="flex justify-between items-center border-b border-border pb-4">
                        <h2 className="text-base font-extrabold text-text flex items-center gap-2">
                            <Ticket className="h-5 w-5 text-primary" />
                            {lang === "ar" ? "إصدار رقم انتظار واستيكر جديد" : "Issue Queue Ticket Sticker"}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* 1. Customer Selection */}
                        <div>
                            <label className="block text-xs font-bold text-text-muted mb-1">
                                {lang === "ar" ? "اختيار العميل *" : "Select Customer *"}
                            </label>
                            <select
                                className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary font-bold"
                                value={data.customer_id}
                                onChange={(e) => setData("customer_id", e.target.value)}
                                required
                            >
                                <option value="">{lang === "ar" ? "-- اختر العميل من القائمة --" : "-- Select Customer --"}</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.phone_number ? `(${c.phone_number})` : ""}
                                    </option>
                                ))}
                            </select>
                            {errors.customer_id && <p className="text-xs text-rose-600 mt-1">{errors.customer_id}</p>}
                        </div>

                        {/* 2. Contract Selection */}
                        {data.customer_id && (
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">
                                    {lang === "ar" ? "اختيار العقد التابع للعميل *" : "Select Contract *"}
                                </label>
                                <select
                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary font-mono font-bold"
                                    value={data.contract_id}
                                    onChange={(e) => setData("contract_id", e.target.value)}
                                    disabled={loadingContracts}
                                    required
                                >
                                    <option value="">
                                        {loadingContracts 
                                            ? (lang === "ar" ? "جاري تحميل عقود العميل..." : "Loading contracts...")
                                            : (lang === "ar" ? "-- اختر العقد --" : "-- Select Contract --")}
                                    </option>
                                    {customerContracts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {lang === "ar" ? "عقد رقم: " : "Contract No: "}{c.contract_number}
                                        </option>
                                    ))}
                                </select>
                                {errors.contract_id && <p className="text-xs text-rose-600 mt-1">{errors.contract_id}</p>}
                            </div>
                        )}

                        {/* 3. Real-time Status Banner */}
                        {loadingInfo && (
                            <div className="p-4 bg-gray-50 border border-border rounded-xl text-center text-xs text-text-muted">
                                {lang === "ar" ? "جاري فحص حالة العقد والفترة النشطة ورصيد الطبالي..." : "Checking contract active period & pallet balances..."}
                            </div>
                        )}

                        {queueInfo && !loadingInfo && (
                            <div className="space-y-3">
                                
                                {/* Period & Balance Verification Cards */}
                                {!queueInfo.has_active_period ? (
                                    <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl space-y-1">
                                        <div className="flex items-center gap-2 font-black text-xs">
                                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                                            <span>{lang === "ar" ? "تنبيه منع: لا توجد فترة إلزامية نشطة لهذا العقد!" : "Warning: No Active Period Found!"}</span>
                                        </div>
                                        <p className="text-xs text-rose-800 font-bold ps-7">
                                            {lang === "ar"
                                                ? "يرجى توجيه السائق / المندوب للذهاب إلى الإدارة أولاً لتفعيل فترة نشطة، ولا يمكن طباعة رقم الانتظار."
                                                : "Direct driver/representative to management to activate a contract period before issuing a queue ticket."}
                                        </p>
                                    </div>
                                ) : queueInfo.booked_pallets > 0 && queueInfo.remaining_balance <= 0 ? (
                                    <div className="p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-xl space-y-1">
                                        <div className="flex items-center gap-2 font-black text-xs">
                                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                                            <span>{lang === "ar" ? "تنبيه منع: رصيد الطبالي الفارغة المتاح بالعقد منتهي!" : "Warning: Pallet Capacity Exceeded!"}</span>
                                        </div>
                                        <p className="text-xs text-rose-800 font-bold ps-7">
                                            {lang === "ar"
                                                ? "يرجى توجيه السائق / المندوب للذهاب إلى الإدارة لتجديد السعة والتخزين، ولا يمكن طباعة رقم الانتظار."
                                                : "Empty pallet capacity is full. Direct driver to management before issuing queue ticket."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between font-bold text-xs">
                                            <span className="flex items-center gap-1.5 text-emerald-800">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                {lang === "ar" ? "العقد جاهز والمواصفات مطابقة للإصدار" : "Contract Validated for Ticket Issuance"}
                                            </span>
                                            <span className="font-mono bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded text-[11px]">
                                                {lang === "ar" ? "الفترة " : "Period "}{queueInfo.active_period?.period_number || "01"}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 font-mono">
                                            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                                                <span className="block text-[10px] text-emerald-700">{lang === "ar" ? "المحجوز" : "Booked"}</span>
                                                <span className="font-bold">{queueInfo.booked_pallets}</span>
                                            </div>
                                            <div className="bg-white/80 p-2 rounded-lg border border-emerald-200">
                                                <span className="block text-[10px] text-emerald-700">{lang === "ar" ? "المستغل" : "Utilized"}</span>
                                                <span className="font-bold">{queueInfo.utilized_pallets}</span>
                                            </div>
                                            <div className="bg-emerald-600 text-white p-2 rounded-lg">
                                                <span className="block text-[10px] text-emerald-100">{lang === "ar" ? "المتبقي الفارغ" : "Remaining"}</span>
                                                <span className="font-bold text-sm">{queueInfo.remaining_balance}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}

                        {/* 4. Driver Selection / Input */}
                        <div>
                            <label className="block text-xs font-bold text-text-muted mb-1">
                                {lang === "ar" ? "اسم السائق / المندوب *" : "Driver Name *"}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <select
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                        value={data.driver_id}
                                        onChange={(e) => handleDriverSelect(e.target.value)}
                                    >
                                        <option value="">{lang === "ar" ? "-- اختيار من السائقين المسجلين --" : "-- Select Registered Driver --"}</option>
                                        {drivers.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.name} {d.vehicle_plate ? `(${d.vehicle_plate})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary font-bold"
                                        placeholder={lang === "ar" ? "أو اكتب اسم السائق هنا..." : "Or type driver name..."}
                                        value={data.driver_name}
                                        onChange={(e) => setData("driver_name", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {errors.driver_name && <p className="text-xs text-rose-600 mt-1">{errors.driver_name}</p>}
                        </div>

                        {/* 5. Estimated Load Capacity (الحمولة التقديرية) */}
                        <div>
                            <label className="block text-xs font-bold text-text-muted mb-1">
                                {lang === "ar" ? "الحمولة التقديرية (اختياري)" : "Estimated Load Capacity (Optional)"}
                            </label>
                            <input
                                type="text"
                                className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary font-bold"
                                placeholder={lang === "ar" ? "مثال: 15 طبلية / 20 طن" : "e.g. 15 Pallets / 20 Tons"}
                                value={data.estimated_load}
                                onChange={(e) => setData("estimated_load", e.target.value)}
                            />
                            {errors.estimated_load && <p className="text-xs text-rose-600 mt-1">{errors.estimated_load}</p>}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="flex justify-end items-center gap-3 pt-4 border-t border-border">
                            <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                            </SecondaryButton>
                            <PrimaryButton
                                type="submit"
                                disabled={processing || !canIssueTicket}
                                className="flex items-center gap-1.5"
                            >
                                <Printer className="h-4 w-4" />
                                {lang === "ar" ? "إصدار وطباعة الاستيكر" : "Issue & Print Sticker"}
                            </PrimaryButton>
                        </div>

                    </form>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
