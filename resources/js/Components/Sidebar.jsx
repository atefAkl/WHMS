import { Link } from '@inertiajs/react';
import { useState } from 'react';
import {
    LayoutDashboard,
    Package,
    FileText,
    Users,
    Warehouse,
    ChevronDown,
    Settings,
    Globe,
    Boxes,
    MapPin,
    ClipboardList,
    UserCog,
    Building2,
    Briefcase,
    Receipt,
    Wrench,
    CircleDollarSign,
    BookOpen,
    FileSpreadsheet,
    LineChart,
    DoorClosed,
    Box,
    Layers,
    Sliders,
    Activity,
    UserCircle,
    Banknote,
    UsersRound
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ApplicationLogo from './ApplicationLogo';
import { useLang } from '@/Contexts/LanguageContext';
import { useTheme } from '@/Contexts/ThemeContext';


function cn(...inputs) {
    return twMerge(clsx(inputs));
}

function safeRoute(name) {
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

// ── Nav Structure ────────────────────────────────────────────
const tenantNavItems = [
    {
        name: { ar: 'الداشبورد', en: 'Dashboard' },
        icon: LayoutDashboard,
        route: 'dashboard',
        active: 'dashboard',
    },
    {
        name: { ar: 'المبيعات', en: 'Sales' },
        icon: Briefcase,
        active: 'sales.*',
        children: [
            { name: { ar: 'العملاء', en: 'Customers' }, icon: UsersRound, route: 'customers.index', active: 'customers.*' },
            { name: { ar: 'العقود', en: 'Contracts' }, icon: FileText, route: 'dashboard', active: 'contracts.*' },
            { name: { ar: 'الفواتير', en: 'Invoices' }, icon: Receipt, route: 'dashboard', active: 'invoices.*' },
            { name: { ar: 'الخدمات', en: 'Services' }, icon: Wrench, route: 'dashboard', active: 'services.*' },
        ],
    },
    {
        name: { ar: 'المالية', en: 'Finance' },
        icon: CircleDollarSign,
        active: 'finance.*',
        children: [
            { name: { ar: 'الحسابات العامة', en: 'General Ledger' }, icon: BookOpen, route: 'dashboard', active: 'accounts.*' },
            { name: { ar: 'السندات', en: 'Vouchers' }, icon: FileSpreadsheet, route: 'dashboard', active: 'vouchers.*' },
            { name: { ar: 'التقارير', en: 'Reports' }, icon: LineChart, route: 'dashboard', active: 'finance.reports.*' },
        ],
    },
    {
        name: { ar: 'المخازن', en: 'Warehouses' },
        icon: Warehouse,
        active: 'warehouse.*',
        children: [
            { name: { ar: 'الغرف', en: 'Rooms' }, icon: DoorClosed, route: 'dashboard', active: 'rooms.*' },
            { name: { ar: 'الطبالي', en: 'Pallets' }, icon: Boxes, route: 'pallets.index', active: 'pallets.*' },
            { name: { ar: 'أصناف مخزنية', en: 'Inventory Items' }, icon: Box, route: 'dashboard', active: 'inventory.*' },
            { name: { ar: 'أحجام العبوات', en: 'Packaging Sizes' }, icon: Layers, route: 'dashboard', active: 'packages.*' },
            { name: { ar: 'اعدادات المخازن', en: 'Warehouse Settings' }, icon: Sliders, route: 'dashboard', active: 'warehouse.settings.*' },
            { name: { ar: 'التقارير', en: 'Reports' }, icon: LineChart, route: 'dashboard', active: 'warehouse.reports.*' },
        ],
    },
    {
        name: { ar: 'العمليات', en: 'Operations' },
        icon: Activity,
        route: 'dashboard',
        active: 'operations.*',
    },
    {
        name: { ar: 'الموارد البشرية', en: 'Human Resources' },
        icon: Users,
        active: 'hr.*',
        children: [
            { name: { ar: 'الموظفين', en: 'Employees' }, icon: UserCircle, route: 'dashboard', active: 'employees.*' },
            { name: { ar: 'الرواتب', en: 'Payroll' }, icon: Banknote, route: 'dashboard', active: 'payroll.*' },
            { name: { ar: 'البصمة', en: 'Attendance' }, icon: MapPin, route: 'dashboard', active: 'attendance.*' },
        ]
    }
];

const saasNavItems = [
    {
        name: { ar: 'إدارة المستأجرين والطلبات', en: 'Tenants & Requests' },
        icon: LayoutDashboard,
        route: 'saas.tenants.index',
        active: 'saas.tenants.*',
    },
    {
        name: { ar: 'ملف التعريف', en: 'Profile Settings' },
        icon: UserCog,
        route: 'central.profile.edit',
        active: 'central.profile.*',
    }
];


// ── Single Nav Item (with accordion via parent state) ─────────
function NavItem({ item, lang, openKey, setOpenKey }) {
    const isActive = route().current(item.active);
    const hasChildren = item.children && item.children.length > 0;
    const itemKey = item.active;
    const isChildActive = hasChildren && item.children.some(c => route().current(c.active));
    // Open strictly if this key is the active open key (exclusive accordion)
    const isOpen = openKey === itemKey;


    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setOpenKey(isOpen ? null : itemKey)}
                    className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isChildActive || isOpen
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-muted hover:bg-surface-muted hover:text-text'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <item.icon className={cn('h-5 w-5 shrink-0', isChildActive || isOpen ? 'text-primary' : 'text-text-muted')} />
                        <span>{item.name[lang]}</span>
                    </div>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 transition-transform duration-200',
                            isOpen ? 'rotate-180' : '',
                            isChildActive || isOpen ? 'text-primary' : 'text-text-muted'
                        )}
                    />
                </button>

                {/* Sub-items - animated */}
                <div
                    className={cn(
                        'overflow-hidden transition-all duration-200',
                        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    )}
                >
                    <div className="mt-1 ms-4 space-y-0.5 border-s-2 border-border ps-3 pb-1">
                        {item.children.map(child => {
                            const childActive = route().current(child.active);
                            return (
                                <Link
                                    key={child.active}
                                    href={safeRoute(child.route)}
                                    className={cn(
                                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                                        childActive
                                            ? 'text-primary font-semibold'
                                            : 'text-text-muted hover:text-text hover:bg-surface-muted'
                                    )}
                                >
                                    <child.icon className="h-4 w-4 shrink-0" />
                                    {child.name[lang]}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Simple link (no children)
    return (
        <Link
            href={safeRoute(item.route)}
            className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-muted hover:bg-surface-muted hover:text-text'
            )}
        >
            <item.icon className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : 'text-text-muted')} />
            <span>{item.name[lang]}</span>
        </Link>
    );
}

// ── Sidebar ───────────────────────────────────────────────────
export default function Sidebar() {
    const { lang } = useLang();
    const { theme, setTheme, bg, setBg, font, setFont } = useTheme();

    const isCentral = typeof route !== 'undefined' && (
        route().current('saas.*') || 
        route().current('central.*')
    );

    const activeNavItems = isCentral ? saasNavItems : tenantNavItems;
 
    // Compute which group should be open on first render based on current route
    const getInitialOpenKey = () => {
        for (const item of activeNavItems) {
            if (item.children && item.children.some(c => {
                try { return route().current(c.active); } catch { return false; }
            })) {
                return item.active;
            }
        }
        return null;
    };
 
    const [openKey, setOpenKey] = useState(() => getInitialOpenKey());
 
    const themeColors = [
        { id: 'blue', color: '#2563eb', label: { ar: 'أزرق', en: 'Blue' } },
        { id: 'emerald', color: '#059669', label: { ar: 'زمردي', en: 'Emerald' } },
        { id: 'amber', color: '#d97706', label: { ar: 'كهرماني', en: 'Amber' } },
        { id: 'rose', color: '#e11d48', label: { ar: 'وردي', en: 'Rose' } },
        { id: 'slate', color: '#475569', label: { ar: 'رمادي', en: 'Slate' } },
    ];
 
    const bgModes = [
        { id: 'flat-light', label: { ar: 'فاتح', en: 'Light' } },
        { id: 'warm-cream', label: { ar: 'دافئ', en: 'Warm' } },
        { id: 'flat-dark', label: { ar: 'داكن', en: 'Dark' } },
        { id: 'deep-blue', label: { ar: 'ليلي', en: 'Blue' } },
    ];
 
    const fontFamilies = [
        { id: 'cairo', label: 'Cairo (القاهرة)' },
        { id: 'tajawal', label: 'Tajawal (تجول)' },
        { id: 'alexandria', label: 'Alexandria (الإسكندرية)' },
        { id: 'readex', label: 'Readex Pro (ريدكس)' },
        { id: 'ibm', label: 'IBM Plex Arabic' },
    ];
 
    return (
        <div className="flex h-screen w-64 shrink-0 flex-col border-e border-border bg-surface shadow-sm select-none">
 
            {/* ── 1. Brand ──────────────────────────────── */}
            <div className="flex h-16 items-center gap-3 border-b border-border px-5 shrink-0">
                <div className="flex h-9 w-9 items-center justify-center bg-primary text-white font-black text-lg">
                    W
                </div>
                <div className="leading-tight">
                    <p className="text-sm font-bold text-text">WHMS</p>
                    <p className="text-[11px] text-text-muted">
                        {isCentral 
                            ? (lang === 'ar' ? 'الإدارة العامة' : 'SaaS Admin') 
                            : (lang === 'ar' ? 'لوحة التحكم' : 'Control Panel')
                        }
                    </p>
                </div>
            </div>
 
            {/* ── 2. Navigation ─────────────────────────── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {activeNavItems.map(item => (
                    <NavItem
                        key={item.active}
                        item={item}
                        lang={lang}
                        openKey={openKey}
                        setOpenKey={setOpenKey}
                    />
                ))}
            </nav>
 
            {/* ── 3. Settings & Appearance (Theme Picker) ── */}
            <div className="border-t border-border px-3 py-3 space-y-3 shrink-0 bg-surface">
                
                {/* General Settings Link */}
                {!isCentral && (
                    <Link
                        href={safeRoute('settings.index')}
                        className="flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-muted hover:text-text transition-colors"
                    >
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>{lang === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</span>
                    </Link>
                )}
 
                {/* Theme Panel */}
                <div className="space-y-2 border-t border-border/50 pt-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        {lang === 'ar' ? 'تخصيص المظهر' : 'Appearance'}
                    </p>
 
                    {/* A. Colors */}
                    <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-text-muted">{lang === 'ar' ? 'اللون الأساسي' : 'Primary'}</span>
                        <div className="flex gap-1">
                            {themeColors.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setTheme(c.id)}
                                    style={{ backgroundColor: c.color }}
                                    className={cn(
                                        'h-4.5 w-4.5 border transition-all cursor-pointer relative',
                                        theme === c.id 
                                            ? 'border-text scale-110 shadow-sm' 
                                            : 'border-transparent hover:scale-105'
                                    )}
                                    title={c.label[lang]}
                                >
                                    {theme === c.id && (
                                        <span className="absolute inset-0 m-auto h-1.5 w-1.5 bg-white rounded-full"></span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
 
                    {/* B. Background Mode */}
                    <div className="space-y-1">
                        <span className="text-[11px] text-text-muted block">{lang === 'ar' ? 'الخلفية' : 'Background'}</span>
                        <div className="grid grid-cols-4 gap-1">
                            {bgModes.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => setBg(b.id)}
                                    className={cn(
                                        'py-1 px-0.5 text-[9px] font-bold border transition-colors cursor-pointer text-center',
                                        bg === b.id
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-surface-muted border-border text-text-muted hover:border-text-muted'
                                    )}
                                >
                                    {b.label[lang]}
                                </button>
                            ))}
                        </div>
                    </div>
 
                    {/* C. Font Family */}
                    <div className="space-y-1">
                        <span className="text-[11px] text-text-muted block">{lang === 'ar' ? 'نوع الخط' : 'Font Family'}</span>
                        <select
                            value={font}
                            onChange={(e) => setFont(e.target.value)}
                            className="w-full bg-surface-muted border border-border text-text text-xs py-1 px-1.5 cursor-pointer outline-none focus:border-primary"
                        >
                            {fontFamilies.map(f => (
                                <option key={f.id} value={f.id} className="bg-surface text-text">
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>
 
                </div>
            </div>
        </div>
    );
}
