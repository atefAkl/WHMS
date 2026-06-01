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

function safeRoute(name, params = {}) {
    try {
        return route(name, params);
    } catch (e) {
        try {
            return route('saas.tenants.index', params);
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
            { name: { ar: 'العقود', en: 'Contracts' }, icon: FileText, route: 'contracts.index', active: 'contracts.*' },
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
            { name: { ar: 'أصناف مخزنية', en: 'Inventory Items' }, icon: Box, route: 'inventory-items.index', active: 'inventory-items.*' },
            { name: { ar: 'أحجام العبوات', en: 'Packaging Sizes' }, icon: Layers, route: 'dashboard', active: 'packages.*' },
            { name: { ar: 'اعدادات المخازن', en: 'Warehouse Settings' }, icon: Sliders, route: 'dashboard', active: 'warehouse.settings.*' },
            { name: { ar: 'التقارير', en: 'Reports' }, icon: LineChart, route: 'dashboard', active: 'warehouse.reports.*' },
        ],
    },
    {
        name: { ar: 'العمليات', en: 'Operations' },
        icon: Activity,
        active: 'operations.*',
        children: [
            { name: { ar: 'سندات الاستلام', en: 'Reception Vouchers' }, icon: FileText, route: 'receptions.index', active: 'receptions.*' },
            { name: { ar: 'أذونات الخروج', en: 'Exit Permits' }, icon: FileText, route: 'exit-authorizations.index', active: 'exit-authorizations.*' },
            { name: { ar: 'سندات التسليم', en: 'Delivery Notes' }, icon: FileText, route: 'deliveries.index', active: 'deliveries.*' }
        ]
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
    }
];


// ── Single Nav Item (with accordion via parent state) ─────────
function NavItem({ item, lang, openKey, setOpenKey }) {
    let isActive = route().current(item.active);
    
    // Check parameters to handle query-string tabs like ?tab=terms
    if (isActive && item.params) {
        const queryParams = new URLSearchParams(window.location.search);
        for (const [key, value] of Object.entries(item.params)) {
            const currentVal = queryParams.get(key) || (key === 'tab' ? 'tenants' : '');
            if (currentVal !== value) {
                isActive = false;
                break;
            }
        }
    } else if (isActive && !item.params && route().current('saas.tenants.index')) {
        const queryParams = new URLSearchParams(window.location.search);
        const currentTab = queryParams.get('tab') || 'tenants';
        if (currentTab !== 'tenants') {
            isActive = false;
        }
    }

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
                                    href={safeRoute(child.route, child.params)}
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
            href={safeRoute(item.route, item.params)}
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
 
            {/* ── 3. Settings ── */}
            <div className="border-t border-border px-3 py-3 shrink-0 bg-surface">
                {isCentral ? (
                    <Link
                        href={safeRoute('saas.settings.index')}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                            route().current('saas.settings.*')
                                ? "bg-primary/10 text-primary"
                                : "text-text-muted hover:bg-surface-muted hover:text-text"
                        )}
                    >
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>{lang === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</span>
                    </Link>
                ) : (
                    <Link
                        href={safeRoute('settings.index')}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                            route().current('settings.*')
                                ? "bg-primary/10 text-primary"
                                : "text-text-muted hover:bg-surface-muted hover:text-text"
                        )}
                    >
                        <Settings className="h-4 w-4 shrink-0" />
                        <span>{lang === 'ar' ? 'الإعدادات العامة' : 'General Settings'}</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
