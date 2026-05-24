import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { 
    Globe, 
    Database, 
    Building2, 
    Layers, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    Info, 
    Search, 
    ShieldAlert, 
    ArrowUpRight, 
    Server, 
    HardDrive, 
    DollarSign, 
    Users, 
    ChevronRight, 
    Home,
    Clock,
    UserCheck,
    UserX,
    BadgeCheck
} from 'lucide-react';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';


export default function Tenants({ tenants, kpis, settings, requests }) {
    const { lang } = useLang();
    const { flash } = usePage().props;
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [activeTab, setActiveTab] = useState('tenants'); // 'tenants' or 'requests'
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: '',
        message: '',
        confirmLabel: '',
        cancelLabel: '',
        onConfirm: () => {},
        type: 'warning',
    });

    const { post, processing } = useForm();


    const filteredTenants = tenants.filter(t => 
        t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.plan.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSimulate = (tenant) => {
        setSelectedTenant(tenant);
        setShowSimulationModal(true);
    };

    const handleApprove = (id) => {
        setConfirmModal({
            show: true,
            title: lang === 'ar' ? 'الموافقة على الطلب' : 'Approve Request',
            message: lang === 'ar' 
                ? 'هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم إنشاء قاعدة بيانات ونطاق فرعي للمستأجر آلياً.' 
                : 'Are you sure you want to approve this request? A database and subdomain will be created for the tenant automatically.',
            confirmLabel: lang === 'ar' ? 'موافقة وتفعيل' : 'Approve',
            cancelLabel: lang === 'ar' ? 'إلغاء' : 'Cancel',
            type: 'info',
            onConfirm: () => {
                post(route('saas.tenants.approve', id), {
                    onFinish: () => setConfirmModal(prev => ({ ...prev, show: false }))
                });
            }
        });
    };
 
    const handleReject = (id) => {
        setConfirmModal({
            show: true,
            title: lang === 'ar' ? 'رفض الطلب' : 'Reject Request',
            message: lang === 'ar' 
                ? 'هل أنت متأكد من رفض هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.' 
                : 'Are you sure you want to reject this request? This action cannot be undone.',
            confirmLabel: lang === 'ar' ? 'رفض الطلب' : 'Reject',
            cancelLabel: lang === 'ar' ? 'إلغاء' : 'Cancel',
            type: 'danger',
            onConfirm: () => {
                post(route('saas.tenants.reject', id), {
                    onFinish: () => setConfirmModal(prev => ({ ...prev, show: false }))
                });
            }
        });
    };


    const breadcrumbs = (
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <Link href={route('central.welcome')} className="hover:text-primary transition-colors">
                {lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'إدارة الـ SaaS' : 'SaaS Management'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'إدارة المستأجرين والطلبات' : 'Tenants & Requests Management'} />

            <div className="pb-4 space-y-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">

                    {/* Flash Success Alert */}
                    {flash?.success && (
                        <div className="border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            <span className="text-sm font-bold">{flash.success}</span>
                        </div>
                    )}

                    {/* Flash Error Alert */}
                    {flash?.error && (
                        <div className="border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                            <span className="text-sm font-bold">{flash.error}</span>
                        </div>
                    )}

                    {/* Mail Warning Alert - يظهر لما الحساب يُنشأ بنجاح لكن البريد يفشل */}
                    {flash?.mail_warning && (
                        <div className="border border-amber-300 bg-amber-50 p-4 text-amber-900">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                                <span className="text-sm font-bold">{flash.mail_warning.message}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    id="activation-link-input"
                                    readOnly
                                    value={flash.mail_warning.link}
                                    className="flex-1 text-xs font-mono bg-white border border-amber-300 px-3 py-2 text-amber-900 outline-none select-all"
                                    onFocus={(e) => e.target.select()}
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(flash.mail_warning.link);
                                        alert(lang === 'ar' ? 'تم نسخ رابط التفعيل!' : 'Activation link copied!');
                                    }}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                                >
                                    {lang === 'ar' ? 'نسخ الرابط' : 'Copy Link'}
                                </button>
                                <a
                                    href={flash.mail_warning.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {lang === 'ar' ? 'فتح الرابط' : 'Open'}
                                </a>
                            </div>
                        </div>
                    )}
                    
                    {/* Page Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-border rounded-2xl px-6 py-5 bg-surface shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0 shadow-inner">
                                <Database className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-text leading-tight">
                                    {lang === 'ar' ? 'إدارة المستأجرين والطلبات' : 'Tenants & Requests'}
                                </h1>
                                <p className="text-sm text-text-muted mt-1">
                                    {lang === 'ar' ? 'إدارة الاشتراكات السحابية ومراجعة طلبات الانضمام الجديدة.' : 'Manage cloud subscriptions and review new joining requests.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex bg-surface-muted p-1 rounded-xl border border-border">
                            <button 
                                onClick={() => setActiveTab('tenants')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'tenants' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
                            >
                                <Users className="h-4 w-4" />
                                {lang === 'ar' ? 'المستأجرون الحاليون' : 'Current Tenants'}
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">{tenants.length}</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('requests')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
                            >
                                <Clock className="h-4 w-4" />
                                {lang === 'ar' ? 'طلبات الانضمام' : 'Pending Requests'}
                                {requests.length > 0 && (
                                    <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] animate-pulse">{requests.length}</span>
                                )}
                            </button>
                        </div>
                    </div>

                    {activeTab === 'tenants' ? (
                        <>
                            {/* KPI Metrics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'إجمالي المنشآت', value: kpis.total_tenants, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                                    { label: 'الاشتراكات النشطة', value: kpis.active_subscriptions, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'النطاقات الفرعية', value: kpis.active_subdomains, icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                                    { label: 'الإيرادات السحابية', value: kpis.total_revenue, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                ].map((kpi, i) => (
                                    <div key={i} className="rounded-2xl border border-border bg-surface p-4 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${kpi.bg} ${kpi.color}`}>
                                            <kpi.icon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{lang === 'ar' ? kpi.label : kpi.label}</p>
                                            <p className="text-2xl font-black text-text leading-tight">{kpi.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tenants Table */}
                            <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-muted/20">
                                    <div className="relative w-full sm:w-80">
                                        <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted ${lang === 'ar' ? 'right-3' : 'left-3'}`} />
                                        <input 
                                            type="text" 
                                            placeholder={lang === 'ar' ? 'بحث باسم المنشأة أو النطاق...' : 'Search...'}
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full text-sm bg-white border border-border rounded-xl focus:ring-primary py-2 pr-10"
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-surface-muted/50 text-[11px] font-bold text-text-muted uppercase">
                                            <tr>
                                                <th className="py-4 px-6 text-right">المنشأة</th>
                                                <th className="py-4 px-6 text-right">النطاق</th>
                                                <th className="py-4 px-6 text-right">الباقة</th>
                                                <th className="py-4 px-6 text-right">الحالة</th>
                                                <th className="py-4 px-6 text-left">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {filteredTenants.map((tenant) => (
                                                <tr key={tenant.id} className="hover:bg-surface-muted/30 transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black border border-indigo-100">
                                                                {tenant.company_name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-text">{tenant.company_name}</p>
                                                                <p className="text-[11px] text-text-muted">ID: {tenant.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-700">{tenant.subdomain}</span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-primary/5 text-primary border border-primary/10">
                                                            {tenant.plan}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit ${tenant.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${tenant.status === 'نشط' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                                                            {tenant.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-left">
                                                        <PrimaryButton onClick={() => handleSimulate(tenant)} className="px-3 py-1.5 text-[10px]">
                                                            <ExternalLink className="h-3.5 w-3.5 me-1.5" />
                                                            محاكاة
                                                        </PrimaryButton>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Pending Requests Section */
                        <div className="space-y-4">
                            {requests.length === 0 ? (
                                <div className="bg-white border-2 border-dashed border-border rounded-3xl p-20 text-center space-y-4">
                                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                                        <Clock className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-bold text-text">لا توجد طلبات معلقة حالياً</h3>
                                        <p className="text-text-muted">ستظهر هنا طلبات تسجيل المنشآت الجديدة بمجرد إرسالها من صفحة الهبوط.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {requests.map((request) => (
                                        <div key={request.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 border-r-4 border-r-amber-500">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                                                    <Building2 className="w-8 h-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-bold text-text">{request.company_name}</h3>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase">{request.plan}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                                                        <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {request.requested_subdomain}.whms.test</span>
                                                        <span className="flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> {request.email}</span>
                                                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(request.created_at).toLocaleDateString('ar-EG')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 shrink-0">
                                                <DangerButton 
                                                    onClick={() => handleReject(request.id)}
                                                    className="px-6 py-2 rounded-xl text-xs font-bold"
                                                    disabled={processing}
                                                >
                                                    <UserX className="w-4 h-4 me-2" />
                                                    رفض الطلب
                                                </DangerButton>
                                                <PrimaryButton 
                                                    onClick={() => handleApprove(request.id)}
                                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100"
                                                    disabled={processing}
                                                >
                                                    <BadgeCheck className="w-4 h-4 me-2" />
                                                    موافقة وتفعيل
                                                </PrimaryButton>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Simulation Modal */}
                <Modal show={showSimulationModal} onClose={() => setShowSimulationModal(false)} maxWidth="md">
                    {selectedTenant && (
                        <div className="p-6 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                            <div className="flex items-center justify-between border-b border-border pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center border border-primary/20">
                                        <Globe className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-text">محاكاة النطاق الفرعي</h3>
                                        <p className="text-xs text-text-muted">{selectedTenant.company_name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowSimulationModal(false)} className="text-text-muted hover:text-text transition-colors">
                                    <XCircle className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-muted font-bold">النطاق الفرعي:</span>
                                        <span className="font-mono font-black text-primary select-all">{selectedTenant.subdomain}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-text-muted font-bold">حالة العزل:</span>
                                        <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                            <CheckCircle2 className="w-4 h-4" />
                                            معزول (Fully Scoped)
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                                    <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4" />
                                        تنبيه المحاكاة المحلية (WAMP)
                                    </p>
                                    <p className="text-[11px] text-amber-700 leading-relaxed">
                                        لتتمكن من فتح هذا النطاق على جهازك، يجب إضافة السطر التالي لملف <code className="bg-amber-200/50 px-1 rounded">hosts</code> بويندوز:
                                    </p>
                                    <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs select-all text-left" dir="ltr">
                                        127.0.0.1 {selectedTenant.subdomain}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <a 
                                    href={`http://${selectedTenant.subdomain}`} 
                                    target="_blank" 
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                                >
                                    فتح مستودع العميل
                                    <ArrowUpRight className="w-4 h-4" />
                                </a>
                                <SecondaryButton onClick={() => setShowSimulationModal(false)} className="w-full justify-center py-3 rounded-xl">
                                    إغلاق النافذة
                                </SecondaryButton>
                            </div>
                        </div>
                    )}
                </Modal>
 
                {/* Confirmation Modal */}
                <ConfirmationModal
                    show={confirmModal.show}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    confirmLabel={confirmModal.confirmLabel}
                    cancelLabel={confirmModal.cancelLabel}
                    type={confirmModal.type}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                    processing={processing}
                />
            </div>
        </AuthenticatedLayout>
    );
}
