import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Globe, Database, Building2, Layers, CheckCircle2, XCircle, ExternalLink, Info, Search, ShieldAlert, ArrowUpRight, Server, HardDrive, DollarSign, Users, ChevronRight, Home } from 'lucide-react';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Tenants({ tenants, kpis, settings }) {
    const { lang } = useLang();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [showSimulationModal, setShowSimulationModal] = useState(false);

    const filteredTenants = tenants.filter(t => 
        t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.plan.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSimulate = (tenant) => {
        setSelectedTenant(tenant);
        setShowSimulationModal(true);
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <Link href={route('central.welcome')} className="hover:text-primary transition-colors">
                {lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'إدارة المشتركين والاشتراكات (SaaS)' : 'SaaS Tenants Management'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'إدارة المشتركين (SaaS Central Dashboard)' : 'SaaS Tenants Dashboard'} />

            <div className="pb-4 space-y-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
                    
                    {/* Header Section - matching Customer Show/Index standards */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-border rounded-xl px-4 py-3 bg-surface shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500 shrink-0">
                                <Database className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                                        SaaS Central Core
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        {lang === 'ar' ? 'متصل بالمركزي' : 'Central DB'}
                                    </span>
                                </div>
                                <h1 className="text-xl font-bold text-text leading-tight">
                                    {lang === 'ar' ? 'لوحة إدارة المشتركين والاشتراكات السحابية' : 'SaaS Tenants & Subscriptions Management'}
                                </h1>
                                <p className="text-[12px] text-text-muted mt-0.5">
                                    {lang === 'ar' ? 'إدارة المنشآت المستأجرة ومحاكاة النطاقات الفرعية (Subdomains) بشكل مستقل.' : 'Manage tenant establishments and simulate subdomains independently.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <PrimaryButton onClick={() => handleSimulate(tenants[0])} className="px-3 py-1.5 text-xs font-medium shadow-sm">
                                <Globe className="h-3.5 w-3.5 me-1.5" />
                                {lang === 'ar' ? 'محاكاة نطاق فرعي' : 'Simulate Subdomain'}
                            </PrimaryButton>
                        </div>
                    </div>

                    {/* KPI Metrics Grid - matching Customer Show/Index stats standards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm flex items-center gap-3 transition-shadow hover:shadow-md">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Users className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium text-text-muted truncate uppercase">{lang === 'ar' ? 'إجمالي المنشآت' : 'Total Tenants'}</p>
                                <p className="text-xl font-bold text-text leading-tight">{kpis.total_tenants}</p>
                                <p className="text-[10px] text-emerald-500 font-medium mt-0.5 flex items-center gap-0.5">
                                    <ArrowUpRight className="h-3 w-3" />
                                    <span>{lang === 'ar' ? '100% نمو' : '100% Growth'}</span>
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm flex items-center gap-3 transition-shadow hover:shadow-md">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium text-text-muted truncate uppercase">{lang === 'ar' ? 'الاشتراكات النشطة' : 'Active Subs'}</p>
                                <p className="text-xl font-bold text-text leading-tight">{kpis.active_subscriptions}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{lang === 'ar' ? 'منشأة موقوفة' : '1 suspended'}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm flex items-center gap-3 transition-shadow hover:shadow-md">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                                <Globe className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium text-text-muted truncate uppercase">{lang === 'ar' ? 'النطاقات الفرعية' : 'Subdomains'}</p>
                                <p className="text-xl font-bold text-text leading-tight">{kpis.active_subdomains}</p>
                                <p className="text-[10px] text-cyan-500 font-mono mt-0.5">*.whm.apl</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm flex items-center gap-3 transition-shadow hover:shadow-md">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                                <DollarSign className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium text-text-muted truncate uppercase">{lang === 'ar' ? 'الإيرادات السحابية' : 'SaaS Revenue'}</p>
                                <p className="text-xl font-bold text-text leading-tight">{kpis.total_revenue}</p>
                                <p className="text-[10px] text-text-muted mt-0.5">{lang === 'ar' ? 'فوترة دورية' : 'Periodic billing'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Tenants Table Section - matching Customer Show/Index standards */}
                    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
                        <div className="border-b border-border p-4 bg-surface-muted/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div>
                                <h2 className="text-[13px] font-bold text-text">{lang === 'ar' ? 'قائمة المشتركين والمنشآت المسجلة' : 'Subscribed Tenants & Establishments'}</h2>
                                <p className="text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? 'إدارة النطاقات، الباقات، واستهلاك الموارد لكل منشأة' : 'Manage domains, plans, and resource consumption'}</p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                                <input 
                                    type="text" 
                                    placeholder={lang === 'ar' ? 'بحث باسم المنشأة أو النطاق...' : 'Search tenant or domain...'}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className={`w-full text-xs bg-surface border border-border rounded-lg focus:border-primary focus:ring-primary ${lang === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5`}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border text-left border-collapse">
                                <thead className="bg-surface-muted/50 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                                    <tr>
                                        <th className={`py-3 ${lang === 'ar' ? 'pr-4 text-right' : 'pl-4 text-left'}`}>{lang === 'ar' ? 'اسم المنشأة' : 'Company Name'}</th>
                                        <th className="py-3 px-4">{lang === 'ar' ? 'النطاق الفرعي (Subdomain)' : 'Subdomain'}</th>
                                        <th className="py-3 px-4">{lang === 'ar' ? 'الباقة الحالية' : 'Current Plan'}</th>
                                        <th className="py-3 px-4">{lang === 'ar' ? 'الموسم التشغيلي' : 'Active Season'}</th>
                                        <th className="py-3 px-4">{lang === 'ar' ? 'استهلاك التخزين' : 'Storage Used'}</th>
                                        <th className="py-3 px-4">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                                        <th className="py-3 px-4">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                        <th className={`py-3 ${lang === 'ar' ? 'pl-4 text-left' : 'pr-4 text-right'}`}>{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-xs bg-surface">
                                    {filteredTenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-surface-muted/50 transition-colors group">
                                            <td className={`py-3 ${lang === 'ar' ? 'pr-4 text-right' : 'pl-4 text-left'}`}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0 text-xs">
                                                        {tenant.company_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text group-hover:text-primary transition-colors text-[12px]">{tenant.company_name}</p>
                                                        <p className="text-[10px] text-text-muted mt-0.5">{tenant.contracts_count} {lang === 'ar' ? 'عقد معتمد' : 'contracts'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[11px] text-primary font-bold" dir="ltr">
                                                <div className="flex items-center gap-1 bg-primary/5 border border-primary/10 px-2 py-0.5 rounded w-fit">
                                                    <Globe className="h-3 w-3 text-primary" />
                                                    <span>{tenant.subdomain}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted border border-border text-text">
                                                    {tenant.plan}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-[11px] text-text-muted font-medium">
                                                {tenant.active_season}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 bg-surface-muted rounded-full h-1.5 overflow-hidden border border-border">
                                                        <div 
                                                            className={`h-full rounded-full ${parseInt(tenant.storage_used) > 80 ? 'bg-danger' : parseInt(tenant.storage_used) > 50 ? 'bg-warning' : 'bg-emerald-500'}`} 
                                                            style={{ width: tenant.storage_used }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-text font-mono">{tenant.storage_used}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[11px] text-text-muted" dir="ltr">
                                                {tenant.expiry_date}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 w-fit ${
                                                    tenant.status === 'نشط' 
                                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                                    : 'bg-danger/10 text-danger border-danger/20'
                                                }`}>
                                                    <span className={`h-1 w-1 rounded-full ${tenant.status === 'نشط' ? 'bg-emerald-500 animate-pulse' : 'bg-danger'}`}></span>
                                                    <span>{tenant.status}</span>
                                                </span>
                                            </td>
                                            <td className={`py-3 ${lang === 'ar' ? 'pl-4 text-left' : 'pr-4 text-right'}`}>
                                                <button 
                                                    onClick={() => handleSimulate(tenant)} 
                                                    className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ms-auto shadow-sm"
                                                >
                                                    <span>{lang === 'ar' ? 'محاكاة' : 'Simulate'}</span>
                                                    <ExternalLink className="h-3 w-3" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Architectural Explanation Banner - matching Customer Show/Index standards */}
                    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden p-4 space-y-4">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <Server className="h-4 w-4 text-primary" />
                            <h2 className="text-[13px] font-bold text-text">
                                {lang === 'ar' ? 'كيفية محاكاة النطاقات الفرعية (Subdomain Multi-tenancy Architecture)' : 'Subdomain Multi-tenancy Architecture Guide'}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-text-muted leading-relaxed">
                            <div className="space-y-1.5 bg-surface-muted/30 p-3.5 rounded-lg border border-border shadow-sm">
                                <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1">
                                    <span className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center border border-primary/20 text-[10px]">1</span>
                                    <span>{lang === 'ar' ? 'حزمة Stancl/Tenancy' : 'Stancl/Tenancy Package'}</span>
                                </div>
                                <p className="text-[11px]">
                                    {lang === 'ar' 
                                    ? 'الحل المعياري الأشهر في Laravel. يتيح تعريف مسارات النطاق الفرعي عبر Route::domain(\'{tenant}.whm.apl\')، ويقوم تلقائياً بتبديل اتصال قاعدة البيانات أو نطاق الجداول (Table Scoping).'
                                    : 'The gold standard Laravel package. Enables Route::domain(\'{tenant}.whm.apl\') and automatically switches database connections or table scopes.'}
                                </p>
                            </div>

                            <div className="space-y-1.5 bg-surface-muted/30 p-3.5 rounded-lg border border-border shadow-sm">
                                <div className="flex items-center gap-2 text-cyan-500 font-bold text-xs mb-1">
                                    <span className="h-5 w-5 rounded bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-[10px]">2</span>
                                    <span>{lang === 'ar' ? 'محاكاة WAMP المحلية (hosts)' : 'WAMP Local Simulation'}</span>
                                </div>
                                <p className="text-[11px]">
                                    {lang === 'ar'
                                    ? 'لتجربة النطاقات محلياً على بيبيئة WAMP (Windows)، يتم إضافة النطاقات الفرعية إلى ملف C:\\Windows\\System32\\drivers\\etc\\hosts مثل: 127.0.0.1 ayman.whm.apl.'
                                    : 'To test subdomains locally on Windows WAMP, add entries to the hosts file such as 127.0.0.1 ayman.whm.apl.'}
                                </p>
                            </div>

                            <div className="space-y-1.5 bg-surface-muted/30 p-3.5 rounded-lg border border-border shadow-sm">
                                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs mb-1">
                                    <span className="h-5 w-5 rounded bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-[10px]">3</span>
                                    <span>{lang === 'ar' ? 'خدمات Wildcard DNS' : 'Wildcard DNS Services'}</span>
                                </div>
                                <p className="text-[11px]">
                                    {lang === 'ar'
                                    ? 'يمكن استخدام خدمات مساعدة مثل nip.io للوصول الفوري للنطاقات الفرعية دون تعديل ملف hosts، مثل: ayman.127.0.0.1.nip.io.'
                                    : 'Use helper services like nip.io for instant subdomain resolution without modifying hosts file, e.g. ayman.127.0.0.1.nip.io.'}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Simulation Modal - matching Customer Show/Index modal standards */}
                <Modal show={showSimulationModal} onClose={() => setShowSimulationModal(false)} maxWidth="md">
                    {selectedTenant && (
                        <div className="p-5 space-y-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-text">{lang === 'ar' ? 'محاكاة النطاق الفرعي للمشترك' : 'Tenant Subdomain Simulation'}</h3>
                                        <p className="text-[11px] text-text-muted mt-0.5">{selectedTenant.company_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSimulationModal(false)} className="text-text-muted hover:text-text p-1 rounded">
                                    <XCircle className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2 text-xs">
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted">{lang === 'ar' ? 'النطاق الفرعي المطلوب محاكاته:' : 'Target Subdomain:'}</span>
                                        <span className="font-mono font-bold text-primary bg-white px-2 py-0.5 rounded border border-primary/20 text-[11px]">{selectedTenant.subdomain}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted">{lang === 'ar' ? 'مفتاح المشترك (Tenant ID):' : 'Tenant ID:'}</span>
                                        <span className="font-mono font-bold text-text text-[11px]">tenant_{selectedTenant.id}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-text-muted">{lang === 'ar' ? 'حالة قاعدة البيانات:' : 'Database Status:'}</span>
                                        <span className="text-emerald-500 font-bold flex items-center gap-1 text-[11px]">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            {lang === 'ar' ? 'معزولة ومستعدة (Scoped)' : 'Scoped & Ready'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-surface-muted/50 rounded-xl border border-border space-y-2 text-xs text-text-muted leading-relaxed">
                                    <p className="font-bold text-text text-xs flex items-center gap-1.5 mb-1">
                                        <Info className="h-3.5 w-3.5 text-primary" />
                                        <span>{lang === 'ar' ? 'إرشادات المحاكاة لبيئة WAMP' : 'WAMP Simulation Instructions'}</span>
                                    </p>
                                    <p className="text-[11px]">
                                        {lang === 'ar' 
                                        ? `لمحاكاة هذا النطاق فعلياً على جهازك الآن، يرجى فتح ملف C:\\Windows\\System32\\drivers\\etc\\hosts بصلاحيات المسؤول (Administrator) وإضافة السطر التالي:`
                                        : `To actively simulate this domain on your local machine, open C:\\Windows\\System32\\drivers\\etc\\hosts as Administrator and add:`}
                                    </p>
                                    <div className="bg-black text-emerald-400 p-2.5 rounded-lg font-mono text-xs select-all text-left" dir="ltr">
                                        127.0.0.1 {selectedTenant.subdomain}
                                    </div>
                                    <p className="text-[10px]">
                                        {lang === 'ar'
                                        ? 'بعد الحفظ، سيقوم خادم Apache / WAMP بتوجيه النطاق إلى تطبيق WHMS وسيقوم وسيط الـ Tenancy بالتقاط المشترك تلقائياً.'
                                        : 'After saving, WAMP Apache will route the domain to WHMS and the Tenancy middleware will capture the tenant.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-border">
                                <SecondaryButton onClick={() => setShowSimulationModal(false)}>{lang === 'ar' ? 'إغلاق' : 'Close'}</SecondaryButton>
                                <a 
                                    href={`http://${selectedTenant.subdomain}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <span>{lang === 'ar' ? 'فتح النطاق الفرعي' : 'Open Subdomain'}</span>
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AuthenticatedLayout>
    );
}
