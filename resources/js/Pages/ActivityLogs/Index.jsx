import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    History,
    Search,
    Filter,
    User,
    Calendar,
    Eye,
    RefreshCw,
    ShieldCheck,
    PlusCircle,
    Edit3,
    Trash2,
    CheckCircle2,
    LogIn,
    LogOut,
    Activity,
    Layers,
    FileText,
    Monitor,
    X,
    ArrowRightLeft,
    Clock
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import Modal from "@/Components/Modal";
import Tooltip from "@/Components/Tooltip";

export default function Index({ logs, stats, users, filters }) {
    const { lang } = useLang();

    // Filters State
    const [search, setSearch] = useState(filters.search || "");
    const [actionType, setActionType] = useState(filters.action_type || "");
    const [subjectType, setSubjectType] = useState(filters.subject_type || "");
    const [userId, setUserId] = useState(filters.user_id || "");
    const [fromDate, setFromDate] = useState(filters.from_date || "");
    const [toDate, setToDate] = useState(filters.to_date || "");

    // Selected Log item for Diff Inspection Modal
    const [selectedLog, setSelectedLog] = useState(null);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        router.get(
            route("activity-logs.index"),
            {
                search,
                action_type: actionType,
                subject_type: subjectType,
                user_id: userId,
                from_date: fromDate,
                to_date: toDate,
            },
            { preserveState: true }
        );
    };

    const handleResetFilters = () => {
        setSearch("");
        setActionType("");
        setSubjectType("");
        setUserId("");
        setFromDate("");
        setToDate("");
        router.get(route("activity-logs.index"));
    };

    const getActionBadge = (type, actionText) => {
        switch (type) {
            case "create":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-emerald-500/10 text-emerald-700 border border-emerald-300">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
            case "update":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-amber-500/10 text-amber-700 border border-amber-300">
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
            case "delete":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-rose-500/10 text-rose-700 border border-rose-300">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
            case "approve":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-purple-500/10 text-purple-700 border border-purple-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
            case "login":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-blue-500/10 text-blue-700 border border-blue-300">
                        <LogIn className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
            case "logout":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-gray-500/10 text-gray-700 border border-gray-300">
                        <LogOut className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-none bg-indigo-500/10 text-indigo-700 border border-indigo-300">
                        <Activity className="h-3.5 w-3.5" />
                        <span>{actionText}</span>
                    </span>
                );
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إدارة النظام" : "System Management"}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-bold">
                {lang === "ar" ? "سجل الرقابة والعمليات" : "Audit Activity Logs"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "سجل العمليات والرقابة" : "Audit Activity Logs"} />

            <div className="max-w-7xl mx-auto pb-12 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* Page Header */}
                <PageHeader
                    icon={History}
                    title={lang === "ar" ? "سجل العمليات والرقابة (System Audit Logs)" : "System Audit Logs"}
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "نظام تتبع ومعاينة حركات ومسؤوليات المستخدمين، الإضافات والتعديلات والحذوفات مع مقارنة الفروقات التفصيلية."
                                : "Standard audit ledger tracking user activity, creates, edits, deletions, and payload diffs."}
                        </p>
                    }
                />

                {/* Metrics Stats Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "نشاط اليوم الإجمالي:" : "Today Total Activity:"}
                            </span>
                            <span className="text-xl font-black text-primary font-mono mt-0.5 block">
                                {stats.total_today} <span className="text-xs font-sans font-bold">{lang === "ar" ? "عملية" : "actions"}</span>
                            </span>
                        </div>
                        <div className="p-3 bg-primary/10 text-primary border border-primary/20">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "إضافات اليوم (Creates):" : "Creates Today:"}
                            </span>
                            <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                                +{stats.creates_count}
                            </span>
                        </div>
                        <div className="p-3 bg-emerald-500/10 text-emerald-700 border border-emerald-300">
                            <PlusCircle className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "تعديلات اليوم (Updates):" : "Updates Today:"}
                            </span>
                            <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">
                                {stats.updates_count}
                            </span>
                        </div>
                        <div className="p-3 bg-amber-500/10 text-amber-700 border border-amber-300">
                            <Edit3 className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="bg-surface border border-border p-4 shadow-2xs rounded-none flex items-center justify-between">
                        <div>
                            <span className="text-[11px] text-text-muted font-medium block">
                                {lang === "ar" ? "حذوفات اليوم (Deletes):" : "Deletes Today:"}
                            </span>
                            <span className="text-xl font-black text-rose-700 font-mono mt-0.5 block">
                                {stats.deletes_count}
                            </span>
                        </div>
                        <div className="p-3 bg-rose-500/10 text-rose-700 border border-rose-300">
                            <Trash2 className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-surface border border-border p-4 shadow-sm rounded-none space-y-4">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                        {/* Keyword Search */}
                        <div className="lg:col-span-2">
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
                                {lang === "ar" ? "البحث بالبيان أو الكود أو الـ IP:" : "Search Keyword / IP / Ref:"}
                            </label>
                            <div className="relative">
                                <Search className="h-3.5 w-3.5 text-text-muted absolute right-3 top-3 rtl:right-3 ltr:left-3" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={lang === "ar" ? "اسم المستخدم، رقم السند، IP..." : "Username, Serial, IP..."}
                                    className="w-full text-xs border-border bg-surface text-text rounded-none focus:border-primary focus:ring-primary h-[38px] px-3 rtl:pr-8 ltr:pl-8"
                                />
                            </div>
                        </div>

                        {/* Action Type Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
                                {lang === "ar" ? "نوع الحدث:" : "Action Type:"}
                            </label>
                            <select
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                className="w-full text-xs border-border bg-surface text-text rounded-none focus:border-primary focus:ring-primary h-[38px] px-2"
                            >
                                <option value="">{lang === "ar" ? "جميع الأحداث" : "All Actions"}</option>
                                <option value="create">{lang === "ar" ? "إضافة / إنشاء (Create)" : "Create"}</option>
                                <option value="update">{lang === "ar" ? "تعديل (Update)" : "Update"}</option>
                                <option value="delete">{lang === "ar" ? "حذف (Delete)" : "Delete"}</option>
                                <option value="approve">{lang === "ar" ? "اعتماد / توثيق (Approve)" : "Approve"}</option>
                                <option value="login">{lang === "ar" ? "تسجيل دخول (Login)" : "Login"}</option>
                                <option value="logout">{lang === "ar" ? "تسجيل خروج (Logout)" : "Logout"}</option>
                            </select>
                        </div>

                        {/* Subject Model Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
                                {lang === "ar" ? "القسم / الموديل:" : "Subject Model:"}
                            </label>
                            <select
                                value={subjectType}
                                onChange={(e) => setSubjectType(e.target.value)}
                                className="w-full text-xs border-border bg-surface text-text rounded-none focus:border-primary focus:ring-primary h-[38px] px-2"
                            >
                                <option value="">{lang === "ar" ? "جميع الأقسام" : "All Models"}</option>
                                <option value="Reception">{lang === "ar" ? "سندات الاستلام" : "Receptions"}</option>
                                <option value="Delivery">{lang === "ar" ? "سندات التسليم" : "Deliveries"}</option>
                                <option value="Contract">{lang === "ar" ? "عقود التخزين" : "Contracts"}</option>
                                <option value="Pallet">{lang === "ar" ? "الطبالي" : "Pallets"}</option>
                                <option value="SalesInvoice">{lang === "ar" ? "فواتير المبيعات" : "Invoices"}</option>
                                <option value="Customer">{lang === "ar" ? "العملاء" : "Customers"}</option>
                                <option value="User">{lang === "ar" ? "المستخدمين" : "Users"}</option>
                            </select>
                        </div>

                        {/* User Filter */}
                        <div>
                            <label className="block text-[11px] font-bold text-text-muted mb-1">
                                {lang === "ar" ? "المستخدم:" : "User:"}
                            </label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                className="w-full text-xs border-border bg-surface text-text rounded-none focus:border-primary focus:ring-primary h-[38px] px-2"
                            >
                                <option value="">{lang === "ar" ? "جميع المستخدمين" : "All Users"}</option>
                                {users.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name || u.username} ({u.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date Range & Submit Buttons */}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold h-[38px] flex items-center justify-center gap-1.5 transition-all rounded-none"
                            >
                                <Filter className="h-3.5 w-3.5" />
                                <span>{lang === "ar" ? "فلترة" : "Filter"}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-3 bg-surface-muted hover:bg-slate-200 border border-border text-text-muted text-xs font-bold h-[38px] flex items-center justify-center transition-all rounded-none"
                                title={lang === "ar" ? "إعادة ضبط" : "Reset"}
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </form>
                </div>

                {/* Audit Activity Ledger Table */}
                <div className="bg-surface border border-border p-5 shadow-sm rounded-none space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-extrabold text-sm text-primary uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
                            {lang === "ar" ? "جدول سجلات الرقابة (Activity Ledger)" : "Activity Audit Ledger"}
                        </h3>
                        <span className="text-xs font-mono font-bold text-text-muted">
                            {lang === "ar" ? `إجمالي النتائج: ${logs.total}` : `Total Records: ${logs.total}`}
                        </span>
                    </div>

                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-xs text-start">
                            <thead className="bg-surface-muted text-text-muted font-bold border-b border-border">
                                <tr>
                                    <th className="px-3 py-2.5 text-center w-12">#</th>
                                    <th className="px-3 py-2.5 text-start">{lang === "ar" ? "المستخدم والـ IP" : "User & IP"}</th>
                                    <th className="px-3 py-2.5 text-start">{lang === "ar" ? "نوع العملية / البيان" : "Action / Description"}</th>
                                    <th className="px-3 py-2.5 text-start">{lang === "ar" ? "الكيان / السند المرتبط" : "Subject Reference"}</th>
                                    <th className="px-3 py-2.5 text-start">{lang === "ar" ? "الوقت والتاريخ" : "Timestamp"}</th>
                                    <th className="px-3 py-2.5 text-center w-24">{lang === "ar" ? "الفروقات" : "Payload Diff"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-text-muted font-sans text-xs">
                                            {lang === "ar" ? "لا توجد سجلات عمليات مطابقة للفلترة المحددة." : "No activity logs match your criteria."}
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log, index) => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-3 py-2.5 text-center text-text-muted font-mono">{log.id}</td>
                                            <td className="px-3 py-2.5 text-start font-sans">
                                                <div className="font-bold text-text">{log.user_name || "النظام (System)"}</div>
                                                <div className="text-[10px] text-text-muted font-mono">{log.ip_address || "—"}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-start font-sans">
                                                {getActionBadge(log.action_type, log.action)}
                                            </td>
                                            <td className="px-3 py-2.5 text-start font-sans font-bold text-text">
                                                {log.subject_label ? (
                                                    <span className="text-primary font-mono">{log.subject_label}</span>
                                                ) : (
                                                    <span className="text-text-muted">—</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-start text-text-muted font-mono text-[11px]">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-text-muted" />
                                                    <span>{new Date(log.created_at).toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}</span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                {(log.old_values || log.new_values) ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedLog(log)}
                                                        className="px-2.5 py-1 text-[11px] bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white font-bold transition-all rounded-none inline-flex items-center gap-1"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span>{lang === "ar" ? "معاينة" : "Inspect"}</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] text-text-muted font-sans">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links && logs.links.length > 3 && (
                        <div className="bg-surface border-t border-border p-3 flex items-center justify-between">
                            <div className="text-xs text-text-muted">
                                {lang === "ar" ? "عرض الصفحة" : "Showing page"}{" "}
                                <span className="font-bold">{logs.current_page}</span>{" "}
                                {lang === "ar" ? "من أصل" : "of"}{" "}
                                <span className="font-bold">{logs.last_page}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {logs.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || "#"}
                                        className={`px-3 py-1.5 border text-xs font-medium rounded-none transition-all ${
                                            link.active
                                                ? "bg-primary text-white border-primary"
                                                : link.url
                                                ? "bg-surface border-border text-text hover:bg-surface-muted"
                                                : "bg-surface-muted text-text-muted border-border cursor-not-allowed"
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Inspection Diff Modal */}
            <Modal show={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="2xl">
                {selectedLog && (
                    <div className="p-6 space-y-5 text-start font-sans" dir={lang === "ar" ? "rtl" : "ltr"}>
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft className="h-5 w-5 text-primary" />
                                <h3 className="font-extrabold text-base text-text">
                                    {lang === "ar" ? "تفاصيل ومعاينة التغييرات (Payload Inspection)" : "Payload Changes Inspection"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="text-text-muted hover:text-text p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Log Meta Header */}
                        <div className="bg-slate-50 border border-border p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                            <div>
                                <span className="text-text-muted font-sans block">{lang === "ar" ? "المستخدم:" : "User:"}</span>
                                <span className="font-bold text-text block">{selectedLog.user_name}</span>
                            </div>
                            <div>
                                <span className="text-text-muted font-sans block">{lang === "ar" ? "عنوان IP:" : "IP Address:"}</span>
                                <span className="font-bold text-primary block">{selectedLog.ip_address || "—"}</span>
                            </div>
                            <div>
                                <span className="text-text-muted font-sans block">{lang === "ar" ? "الحدث:" : "Action:"}</span>
                                <span className="font-bold text-emerald-700 block">{selectedLog.action}</span>
                            </div>
                        </div>

                        {/* Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Old Values (القيم السابقة) */}
                            <div className="border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                                <h4 className="font-bold text-xs text-rose-800 border-b border-rose-200 pb-2 flex items-center justify-between">
                                    <span>{lang === "ar" ? "القيم السابقة (Before / Old)" : "Old Values (Before)"}</span>
                                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-rose-300">السابقة</span>
                                </h4>
                                {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 ? (
                                    <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-xs">
                                        {Object.entries(selectedLog.old_values).map(([k, v]) => (
                                            <div key={k} className="bg-white p-2 border border-rose-100 flex justify-between gap-2">
                                                <span className="font-bold text-gray-700">{k}:</span>
                                                <span className="text-rose-700 font-bold truncate max-w-[160px]" title={String(v)}>
                                                    {v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-text-muted italic py-4 text-center">
                                        {lang === "ar" ? "لا توجد قيم سابقة (إضافة جديدة)" : "No old values (new creation)"}
                                    </p>
                                )}
                            </div>

                            {/* New Values (القيم الجديدة) */}
                            <div className="border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                                <h4 className="font-bold text-xs text-emerald-800 border-b border-emerald-200 pb-2 flex items-center justify-between">
                                    <span>{lang === "ar" ? "القيم الجديدة (After / New)" : "New Values (After)"}</span>
                                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 border border-emerald-300">الجديدة</span>
                                </h4>
                                {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 ? (
                                    <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-xs">
                                        {Object.entries(selectedLog.new_values).map(([k, v]) => (
                                            <div key={k} className="bg-white p-2 border border-emerald-100 flex justify-between gap-2">
                                                <span className="font-bold text-gray-700">{k}:</span>
                                                <span className="text-emerald-700 font-bold truncate max-w-[160px]" title={String(v)}>
                                                    {v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-text-muted italic py-4 text-center">
                                        {lang === "ar" ? "لا توجد قيم جديدة (عملية حذف)" : "No new values (deleted record)"}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* User Agent Footer */}
                        {selectedLog.user_agent && (
                            <div className="pt-2 border-t border-border text-[10px] text-text-muted font-mono flex items-center gap-1.5">
                                <Monitor className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{selectedLog.user_agent}</span>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
