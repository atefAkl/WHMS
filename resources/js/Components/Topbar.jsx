import { Link, usePage } from '@inertiajs/react';
import { Bell, MessageSquare, User, ChevronDown, Settings, LogOut, FileText, UserPlus, Inbox, ExternalLink, Check } from 'lucide-react';
import Dropdown from './Dropdown';
import { useState, useEffect, useRef } from 'react';
import { useLang } from '@/Contexts/LanguageContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios from 'axios';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

function safeRoute(name) {
    if (name === 'logout') return '/logout';
    if (name === 'profile.edit' || name === 'central.profile.edit') return '/profile';
    try {
        return route(name);
    } catch (e) {
        try {
            return route('saas.tenants.index');
        } catch (err) {
            return '#';
        }
    }
}

export default function Topbar({ header }) {
    const user = usePage().props.auth.user;
    const { lang, setLang } = useLang();

    const initialUnread = usePage().props.auth?.unread_notifications_count ?? 0;
    const initialRecent = usePage().props.auth?.recent_notifications ?? [];

    const [unreadCount, setUnreadCount] = useState(initialUnread);
    const [recentNotifications, setRecentNotifications] = useState(initialRecent);

    const hoverTimers = useRef({});

    useEffect(() => {
        setUnreadCount(initialUnread);
        setRecentNotifications(initialRecent);
    }, [initialUnread, initialRecent]);

    // Fast 2s Silent Pulse Listener for instant real-time sync across browsers
    useEffect(() => {
        if (!user) return;
        const fetchUnread = () => {
            try {
                axios.get(route('api.notifications.unread-count'))
                    .then(res => {
                        if (res.data) {
                            setUnreadCount(res.data.unread_count || 0);
                            setRecentNotifications(res.data.recent || []);
                        }
                    })
                    .catch(() => { });
            } catch (e) { }
        };

        const interval = setInterval(fetchUnread, 2000);
        return () => clearInterval(interval);
    }, [user]);

    // Auto mark-as-read on 3 seconds hover
    const handleNotificationMouseEnter = (id, isUnread) => {
        if (!isUnread) return;
        if (hoverTimers.current[id]) clearTimeout(hoverTimers.current[id]);

        hoverTimers.current[id] = setTimeout(() => {
            axios.post(route('notifications.markOneRead', id))
                .then(() => {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                    setRecentNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
                })
                .catch(() => { });
        }, 3000); // 3 Seconds Hover
    };

    const handleNotificationMouseLeave = (id) => {
        if (hoverTimers.current[id]) {
            clearTimeout(hoverTimers.current[id]);
            delete hoverTimers.current[id];
        }
    };

    const isCentral = typeof route !== 'undefined' && (
        route().current('saas.*') ||
        route().current('central.*')
    );

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shadow-sm shrink-0">

            {/* Left: Breadcrumbs & Season */}
            <div className="flex items-center gap-4">
                <div className="text-sm font-semibold text-text flex items-center gap-2">
                    {header || (lang === 'ar' ? 'لوحة التحكم' : 'Dashboard')}
                </div>

                {/* Season Badge */}
                {usePage().props.auth.active_season_name && (
                    <Link
                        href={safeRoute('season.select')}
                        className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                        title={lang === 'ar' ? 'تغيير الموسم' : 'Change Season'}
                    >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-xs font-bold text-primary tracking-widest">{usePage().props.auth.active_season_name}</span>
                    </Link>
                )}
            </div>

            {/* Right: Actions + User */}
            <div className="flex items-center gap-2">

                {/* Language Toggle */}
                <button
                    onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted transition-colors font-black text-xs border border-border"
                    title={lang === 'ar' ? 'English' : 'العربية'}
                >
                    {lang === 'ar' ? 'EN' : 'ع'}
                </button>

                {/* Messages */}
                <button className="relative rounded-full p-2 text-text-muted hover:bg-surface-muted transition-colors" title={lang === 'ar' ? 'الرسائل' : 'Messages'}>
                    <MessageSquare className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-[0.5rem] bg-info shadow-xs"></span>
                </button>

                {/* Interactive Notifications Dropdown */}
                <Dropdown>
                    <Dropdown.Trigger>
                        <button
                            className="relative rounded-full p-2 text-text-muted hover:bg-surface-muted transition-colors focus:outline-none"
                            title={lang === 'ar' ? 'الإشعارات والتنبيهات' : 'Notifications'}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-[0.5rem] bg-danger text-white text-[10px] font-black flex items-center justify-center px-1 leading-none shadow-md animate-pulse">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    </Dropdown.Trigger>

                    <Dropdown.Content align="right" width="96">
                        <div className="p-3.5 border-b border-border flex items-center justify-between bg-slate-50/80" dir={lang === "ar" ? "rtl" : "ltr"}>
                            <div className="flex items-center gap-2 font-black text-xs text-text">
                                <Bell className="h-4 w-4 text-primary" />
                                <span>{lang === "ar" ? "التنبيهات والأحداث المباشرة" : "Live Notifications & Events"}</span>
                            </div>
                            {unreadCount > 0 ? (
                                <span className="text-[10px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-[0.5rem] border border-primary/20">
                                    {unreadCount} {lang === "ar" ? "غير مقروء" : "unread"}
                                </span>
                            ) : (
                                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-[0.5rem] border border-emerald-200">
                                    {lang === "ar" ? "الكل مقروء" : "All read"}
                                </span>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-border" dir={lang === "ar" ? "rtl" : "ltr"}>
                            {recentNotifications.length === 0 ? (
                                <div className="py-8 text-center text-xs text-text-muted space-y-1">
                                    <Bell className="h-6 w-6 mx-auto text-slate-300" />
                                    <p>{lang === "ar" ? "لا توجد تنبيهات حالياً." : "No notifications available."}</p>
                                </div>
                            ) : (
                                recentNotifications.map((n) => {
                                    const nData = n.data || {};
                                    const isUnread = !n.read_at;

                                    return (
                                        <div
                                            key={n.id}
                                            onMouseEnter={() => handleNotificationMouseEnter(n.id, isUnread)}
                                            onMouseLeave={() => handleNotificationMouseLeave(n.id)}
                                            className={`p-3.5 text-xs transition-all relative group ${
                                                isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-slate-50/60"
                                            }`}
                                        >
                                            {/* Unread indicator dot */}
                                            {isUnread && (
                                                <span className="absolute top-4 start-2.5 h-2 w-2 rounded-full bg-primary animate-ping"></span>
                                            )}

                                            <div className={`space-y-1.5 ${isUnread ? "ps-3" : ""}`}>
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className={`font-black text-xs leading-snug flex items-center gap-1.5 ${isUnread ? "text-primary" : "text-text"}`}>
                                                        {nData.title?.includes('عميل') && <UserPlus className="h-3.5 w-3.5 text-emerald-600 inline" />}
                                                        {nData.title?.includes('عقد') && <FileText className="h-3.5 w-3.5 text-blue-600 inline" />}
                                                        {nData.title?.includes('استلام') && <Inbox className="h-3.5 w-3.5 text-amber-600 inline" />}
                                                        <span>{nData.title || (lang === "ar" ? "إشعار من النظام" : "System Alert")}</span>
                                                    </h4>
                                                    <span className="text-[10px] text-text-muted font-mono shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {new Date(n.created_at).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-text-muted leading-relaxed font-normal">
                                                    {nData.message}
                                                </p>

                                                {nData.link && (
                                                    <div className="pt-1 flex items-center justify-between">
                                                        <Link
                                                            href={nData.link}
                                                            className="inline-flex items-center gap-1 text-[11px] font-black text-primary hover:underline bg-white px-2 py-0.5 border border-primary/20 rounded shadow-2xs"
                                                        >
                                                            <span>{lang === "ar" ? "الانتقال للحدث والتفاصيل" : "Go to event details"}</span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                        {isUnread && (
                                                            <span className="text-[9px] text-text-muted italic opacity-75">
                                                                {lang === "ar" ? "امكث 3 ثوان لتمييزه كـ مقروء" : "Hover 3s to mark read"}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="p-2.5 border-t border-border bg-slate-50 text-center" dir={lang === "ar" ? "rtl" : "ltr"}>
                            <Link
                                href={route('notifications.index')}
                                className="text-xs font-black text-primary hover:text-primary/80 transition-colors block py-1"
                            >
                                {lang === "ar" ? "عرض مركز جميع التنبيهات وإدارتها ←" : "View & Manage All Notifications →"}
                            </Link>
                        </div>
                    </Dropdown.Content>
                </Dropdown>

                {/* Divider */}
                <div className="mx-2 h-6 w-px bg-border" />

                {/* User Dropdown */}
                <Dropdown>
                    <Dropdown.Trigger>
                        <button className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-1.5 hover:bg-surface-muted transition-colors">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="h-4 w-4" />
                            </div>
                            <div className={cn("hidden text-right md:block", lang === 'ar' ? 'text-right' : 'text-left')}>
                                <p className="text-sm font-semibold text-text leading-none">{user.name}</p>
                                <p className="text-[11px] text-text-muted mt-0.5">{user.email}</p>
                            </div>
                            <ChevronDown className="h-4 w-4 text-text-muted" />
                        </button>
                    </Dropdown.Trigger>

                    <Dropdown.Content align={lang === 'ar' ? 'left' : 'right'}>
                        <div className="px-3 py-2 border-b border-border">
                            <p className="text-xs font-semibold text-text">{user.name}</p>
                            <p className="text-xs text-text-muted">{user.email}</p>
                        </div>
                        <Dropdown.Link href={safeRoute(isCentral ? 'central.profile.edit' : 'profile.edit')}>
                            <User className={cn("inline h-4 w-4", lang === 'ar' ? 'ms-2' : 'me-2')} />
                            {lang === 'ar' ? 'الملف الشخصي والتفضيلات' : 'Profile & Preferences'}
                        </Dropdown.Link>
                        <Dropdown.Link href={safeRoute('logout')} method="post" as="button">
                            <LogOut className={cn("inline h-4 w-4", lang === 'ar' ? 'ms-2' : 'me-2')} />
                            {lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        </header>
    );
}
