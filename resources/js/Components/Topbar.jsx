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

                {/* Notifications */}
                <button className="relative rounded-full p-2 text-text-muted hover:bg-surface-muted transition-colors" title={lang === 'ar' ? 'الإشعارات' : 'Notifications'}>
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger"></span>
                </button>

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
