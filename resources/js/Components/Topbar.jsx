import { Link, usePage } from '@inertiajs/react';
import { Bell, MessageSquare, User, ChevronDown, Settings, LogOut } from 'lucide-react';
import Dropdown from './Dropdown';
import { useState } from 'react';
import { useLang } from '@/Contexts/LanguageContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-info"></span>
                </button>

                {/* Interactive Notifications Dropdown */}
                {(() => {
                    const unread = usePage().props.auth?.unread_notifications_count ?? 0;
                    const recent = usePage().props.auth?.recent_notifications ?? [];

                    return (
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button
                                    className="relative rounded-full p-2 text-text-muted hover:bg-surface-muted transition-colors focus:outline-none"
                                    title={lang === 'ar' ? 'الإشعارات والتنبيهات' : 'Notifications'}
                                >
                                    <Bell className="h-5 w-5" />
                                    {unread > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-danger text-white text-[10px] font-black flex items-center justify-center px-1 leading-none shadow-2xs animate-bounce">
                                            {unread > 99 ? '99+' : unread}
                                        </span>
                                    )}
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content align="right" width="80">
                                <div className="p-3 border-b border-border flex items-center justify-between bg-surface-muted/40" dir={lang === "ar" ? "rtl" : "ltr"}>
                                    <div className="flex items-center gap-1.5 font-bold text-xs text-text">
                                        <Bell className="h-4 w-4 text-primary" />
                                        <span>{lang === "ar" ? "التنبيهات والأحداث" : "Notifications & Alerts"}</span>
                                    </div>
                                    {unread > 0 && (
                                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 border border-primary/20">
                                            {unread} {lang === "ar" ? "جديد" : "new"}
                                        </span>
                                    )}
                                </div>

                                <div className="max-h-72 overflow-y-auto divide-y divide-border" dir={lang === "ar" ? "rtl" : "ltr"}>
                                    {recent.length === 0 ? (
                                        <div className="py-6 text-center text-xs text-text-muted">
                                            {lang === "ar" ? "لا توجد تنبيهات حالياً." : "No notifications."}
                                        </div>
                                    ) : (
                                        recent.map((n) => {
                                            const nData = n.data || {};
                                            const isUnread = !n.read_at;
                                            return (
                                                <div
                                                    key={n.id}
                                                    className={`p-3 text-xs space-y-1 transition-colors ${
                                                        isUnread ? "bg-primary/5 hover:bg-primary/10 font-medium" : "hover:bg-surface-muted/30"
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className={`font-bold ${isUnread ? "text-primary" : "text-text"}`}>
                                                            {nData.title || (lang === "ar" ? "إشعار نظام" : "Alert")}
                                                        </span>
                                                        <span className="text-[9px] text-text-muted font-mono shrink-0">
                                                            {new Date(n.created_at).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-text-muted leading-tight line-clamp-2">
                                                        {nData.message}
                                                    </p>
                                                    {nData.link && (
                                                        <Link
                                                            href={nData.link}
                                                            className="inline-block pt-1 text-[10px] font-bold text-primary hover:underline"
                                                        >
                                                            {lang === "ar" ? "عرض التفاصيل ←" : "View details →"}
                                                        </Link>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="p-2 border-t border-border bg-slate-50 text-center" dir={lang === "ar" ? "rtl" : "ltr"}>
                                    <Link
                                        href={route('notifications.index')}
                                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors block py-1"
                                    >
                                        {lang === "ar" ? "عرض جميع التنبيهات والتحكم بها ←" : "View All Notifications →"}
                                    </Link>
                                </div>
                            </Dropdown.Content>
                        </Dropdown>
                    );
                })()}

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
                            {lang === 'ar' ? 'الملف الشخصي' : 'Profile'}
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
