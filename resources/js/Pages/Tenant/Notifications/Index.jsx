import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { Bell, CheckCircle2, ChevronRight, Home, Info, Trash2 } from "lucide-react";
import Pagination from "@/Components/Pagination";

export default function Index({ notifications }) {
    const { lang } = useLang();

    const handleMarkAllRead = () => {
        router.post(route("notifications.markAllRead"), {}, {
            preserveScroll: true
        });
    };

    const handleClearAll = () => {
        if (confirm(lang === "ar" ? "هل أنت متأكد من حذف جميع الإشعارات؟" : "Are you sure you want to clear all notifications?")) {
            router.delete(route("notifications.clearAll"), {
                preserveScroll: true
            });
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "الإشعارات" : "Notifications"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "الإشعارات" : "Notifications"} />

            <div className="pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
                        <div>
                            <h1 className="text-xl font-black text-text flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" />
                                {lang === "ar" ? "إشعارات النظام" : "System Notifications"}
                            </h1>
                            <p className="text-xs text-text-muted mt-1">
                                {lang === "ar" ? "تابع العمليات الأخيرة وإشعارات التنبيه في ثلاجتك" : "Monitor recent activities and alerts inside your warehouse"}
                            </p>
                        </div>
                        
                        {notifications.data.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-bold text-text hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                                >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    {lang === "ar" ? "تحديد الكل كمقروء" : "Mark All as Read"}
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                                >
                                    <Trash2 className="h-4 w-4 text-rose-500" />
                                    {lang === "ar" ? "حذف الكل" : "Clear All"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Notifications List */}
                    {notifications.data.length === 0 ? (
                        <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-border">
                                <Bell className="h-6 w-6 text-text-muted" />
                            </div>
                            <h3 className="font-bold text-sm text-text">
                                {lang === "ar" ? "لا توجد تنبيهات حالياً" : "No Notifications"}
                            </h3>
                            <p className="text-xs text-text-muted max-w-sm mx-auto">
                                {lang === "ar" 
                                    ? "عندما يتم اتخاذ أي إجراء يتطلب إشعارك (مثل ترحيل فواتير أو إعداد عقود جديدة) ستظهر التنبيهات هنا."
                                    : "When operations that require your attention occur, notifications will show up here."}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden shadow-sm">
                                {notifications.data.map((notification) => {
                                    const isUnread = !notification.read_at;
                                    const data = notification.data || {};
                                    return (
                                        <div 
                                            key={notification.id} 
                                            className={`p-4 transition-colors flex gap-4 items-start ${isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50/50"}`}
                                        >
                                            <div className="mt-0.5 shrink-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${isUnread ? "bg-primary/10 border-primary/20 text-primary" : "bg-slate-100 border-slate-200 text-text-muted"}`}>
                                                    <Info className="h-4 w-4" />
                                                </div>
                                            </div>
                                            
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-4">
                                                    <h4 className={`text-xs font-bold text-text ${isUnread ? "text-primary" : ""}`}>
                                                        {data.title || (lang === "ar" ? "تنبيه من النظام" : "System Alert")}
                                                    </h4>
                                                    <span className="text-[10px] text-text-muted font-medium">
                                                        {new Date(notification.created_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-text-muted leading-relaxed">
                                                    {data.message}
                                                </p>
                                                {data.link && (
                                                    <div className="pt-1">
                                                        <Link 
                                                            href={data.link}
                                                            className="text-[11px] font-bold text-primary hover:underline"
                                                        >
                                                            {lang === "ar" ? "عرض التفاصيل" : "View details"} &rarr;
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {notifications.links && (
                                <div className="flex justify-center pt-2">
                                    <Pagination links={notifications.links} />
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
