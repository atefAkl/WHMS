import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useLang } from '@/Contexts/LanguageContext';
import { 
    FileText, Calendar, Users, Box, CreditCard, Check, ChevronRight, User, Building2, Download,
    Printer, Play, Pause, XCircle, Trash2, Edit3, Plus, AlertCircle, Clock, ShieldAlert, 
    FileSpreadsheet, Layers, Package, CheckCircle2, Ban, DollarSign
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

const SectionCard = ({ title, icon: Icon, children, action }) => (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-muted/30">
            <div className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-text">{title}</h2>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div className="p-5">{children}</div>
    </div>
);

const Field = ({ label, value, dir }) => (
    <div>
        <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-sm font-semibold text-text ${dir === 'ltr' ? 'font-mono' : ''}`} dir={dir}>{value || '—'}</p>
    </div>
);

export default function Show({ contract, settings }) {
    const { lang } = useLang();
    const [activeTab, setActiveTab] = useState('view');

    // Modals state
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [showStatusContactModal, setShowStatusContactModal] = useState(false);
    const [selectedContactAgent, setSelectedContactAgent] = useState(null);
    const [contactActionType, setContactActionType] = useState('suspended'); // suspended, deleted
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Form states
    const [editForm, setEditForm] = useState({
        introduction: contract.introduction || '',
        preamble: contract.preamble || '',
        discount: contract.discount || 0,
    });

    const [periodForm, setPeriodForm] = useState({
        duration_months: 12,
        notes: '',
    });

    const [contactForm, setContactForm] = useState({
        contact_id: '',
    });

    const [statusContactForm, setStatusContactForm] = useState({
        status_reason: '',
    });

    const [invoiceForm, setInvoiceForm] = useState({
        invoice_number: `INV-${contract.contract_number}-${(contract.invoices?.length || 0) + 1}`,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        amount: '',
        notes: '',
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        method: 'bank_transfer',
        reference: '',
        notes: '',
        invoice_id: '',
    });

    const [processing, setProcessing] = useState(false);

    // Actions handlers
    const handleAction = (routeSuffix, method = 'post', data = {}, onSuccessModalClose = null) => {
        if (processing) return;
        setProcessing(true);
        router[method](route(`contracts.${routeSuffix}`, contract.id), data, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                if (onSuccessModalClose) onSuccessModalClose(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const handleContactStatusSubmit = (e) => {
        e.preventDefault();
        if (!selectedContactAgent) return;
        setProcessing(true);
        router.patch(route('contracts.contacts.status', [contract.id, selectedContactAgent.id]), {
            status: contactActionType,
            status_reason: statusContactForm.status_reason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setProcessing(false);
                setShowStatusContactModal(false);
                setStatusContactForm({ status_reason: '' });
            },
            onError: () => setProcessing(false),
        });
    };

    const tabs = [
        { id: 'view', label: lang === 'ar' ? 'عرض العقد' : 'Contract View', icon: FileText },
        { id: 'periods', label: lang === 'ar' ? 'فترات العقد' : 'Periods', icon: Calendar },
        { id: 'contacts', label: lang === 'ar' ? 'مندوبي العقد' : 'Delegates', icon: Users },
        { id: 'financials', label: lang === 'ar' ? 'المستحقات والدفعات' : 'Financials', icon: DollarSign },
        { id: 'vouchers', label: lang === 'ar' ? 'السندات' : 'Vouchers', icon: FileSpreadsheet },
        { id: 'pallets', label: lang === 'ar' ? 'طبالي العقد' : 'Pallets', icon: Layers },
        { id: 'items', label: lang === 'ar' ? 'أصناف مخزنة' : 'Stored Items', icon: Package },
    ];

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('customers.index'))}>
                {lang === 'ar' ? 'العملاء' : 'Customers'}
            </span>
            <ChevronRight className={lang === 'ar' ? 'h-3.5 w-3.5 rotate-180' : 'h-3.5 w-3.5'} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('customers.show', contract.customer_id))}>
                {contract.customer?.name}
            </span>
            <ChevronRight className={lang === 'ar' ? 'h-3.5 w-3.5 rotate-180' : 'h-3.5 w-3.5'} />
            <span className="text-primary font-bold">{contract.contract_number}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${lang === 'ar' ? 'العقد' : 'Contract'} ${contract.contract_number}`} />

            <div className="max-w-7xl mx-auto pb-12 space-y-6">
                {/* Header Info & Actions Bar */}
                <div className="rounded-2xl border border-border bg-surface shadow-sm p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shrink-0">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-extrabold text-text font-mono tracking-tight">{contract.contract_number}</h1>
                                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                    contract.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                                    contract.status === 'suspended' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                    contract.status === 'ended' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                                    contract.status === 'cancelled' ? 'bg-danger/10 text-danger border border-danger/20' :
                                    'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                }`}>
                                    {contract.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') :
                                     contract.status === 'suspended' ? (lang === 'ar' ? 'موقوف' : 'Suspended') :
                                     contract.status === 'ended' ? (lang === 'ar' ? 'منتهي' : 'Ended') :
                                     contract.status === 'cancelled' ? (lang === 'ar' ? 'ملغي' : 'Cancelled') :
                                     (lang === 'ar' ? 'مسودة' : 'Draft')}
                                </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-text-muted">
                                <span className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors" onClick={() => router.get(route('customers.show', contract.customer_id))}>
                                    <User className="h-3.5 w-3.5" />
                                    {contract.customer?.name}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors" onClick={() => router.get(route('settings.seasons.index'))}>
                                    <Calendar className="h-3.5 w-3.5" />
                                    {lang === 'ar' ? 'إعدادات الموسم' : 'Season Settings'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-border">
                        {/* Edit */}
                        <SecondaryButton type="button" onClick={() => setShowEditModal(true)} disabled={processing}>
                            <Edit3 className="h-4 w-4 me-1.5 text-primary" />
                            {lang === 'ar' ? 'تعديل العقد' : 'Edit'}
                        </SecondaryButton>

                        {/* Activate */}
                        {(contract.status === 'draft' || contract.status === 'suspended') && (
                            <PrimaryButton type="button" onClick={() => handleAction('activate')} disabled={processing}>
                                <Play className="h-4 w-4 me-1.5" />
                                {lang === 'ar' ? 'تنشيط العقد' : 'Activate'}
                            </PrimaryButton>
                        )}

                        {/* Suspend */}
                        {contract.status === 'active' && (
                            <SecondaryButton type="button" onClick={() => handleAction('suspend')} disabled={processing} className="border-amber-500/30 text-amber-600 hover:bg-amber-500/10">
                                <Pause className="h-4 w-4 me-1.5" />
                                {lang === 'ar' ? 'إيقاف العقد' : 'Suspend'}
                            </SecondaryButton>
                        )}

                        {/* End */}
                        {contract.status === 'active' && (
                            <SecondaryButton type="button" onClick={() => handleAction('end')} disabled={processing} className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10">
                                <CheckCircle2 className="h-4 w-4 me-1.5" />
                                {lang === 'ar' ? 'إنهاء العقد' : 'End Contract'}
                            </SecondaryButton>
                        )}

                        {/* Cancel */}
                        {(contract.status === 'draft' || contract.status === 'suspended') && (
                            <DangerButton type="button" onClick={() => handleAction('cancel')} disabled={processing}>
                                <Ban className="h-4 w-4 me-1.5" />
                                {lang === 'ar' ? 'إلغاء العقد' : 'Cancel'}
                            </DangerButton>
                        )}

                        {/* Delete */}
                        <DangerButton type="button" onClick={() => {
                            if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف العقد نهائياً؟' : 'Are you sure you want to delete this contract?')) {
                                handleAction('destroy', 'delete');
                            }
                        }} disabled={processing}>
                            <Trash2 className="h-4 w-4 me-1.5" />
                            {lang === 'ar' ? 'حذف' : 'Delete'}
                        </DangerButton>
                    </div>
                </div>

                {/* Tabs Navigation Bar */}
                <div className="bg-surface border border-border rounded-xl shadow-sm flex overflow-x-auto scrollbar-none">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap shrink-0 ${
                                activeTab === tab.id 
                                    ? 'border-primary text-primary bg-primary/5' 
                                    : 'border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50'
                            }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content 1: Contract View */}
                {activeTab === 'view' && (
                    <div className="space-y-6">
                        {/* Timing & Stakeholders Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SectionCard title={lang === 'ar' ? 'البيانات الزمنية' : 'Timing'} icon={Calendar}>
                                <div className="grid grid-cols-2 gap-6">
                                    <Field label={lang === 'ar' ? 'تاريخ الكتابة' : 'Write Date'} value={`${contract.write_date} ${contract.write_date_hijri ? `/ ${contract.write_date_hijri}` : ''}`} dir="ltr" />
                                    <Field label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'} value={`${contract.start_date} ${contract.start_date_hijri ? `/ ${contract.start_date_hijri}` : ''}`} dir="ltr" />
                                    <Field label={lang === 'ar' ? 'تاريخ النهاية' : 'End Date'} value={contract.end_date} dir="ltr" />
                                    <Field label={lang === 'ar' ? 'الفترة الإلزامية' : 'Mandatory Period'} value={`${contract.mandatory_period} ${lang === 'ar' ? 'شهر' : 'Months'}`} />
                                    <Field label={lang === 'ar' ? 'فترة التجديد' : 'Renewal Period'} value={`${contract.renewal_period} ${lang === 'ar' ? 'شهر' : 'Months'}`} />
                                </div>
                            </SectionCard>

                            <SectionCard title={lang === 'ar' ? 'أصحاب المصلحة' : 'Stakeholders'} icon={Users}>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-text mb-1">{lang === 'ar' ? 'المؤسسة' : 'Institution'} - {settings?.company_name || 'Warehouse OS'}</p>
                                            <p className="text-xs text-text-muted font-mono" dir="ltr">CR: {settings?.company_cr || '1010101010'} | VAT: {settings?.company_vat || '300000000000003'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-text mb-1">{lang === 'ar' ? 'العميل' : 'Customer'} - {contract.customer?.name}</p>
                                            <p className="text-xs text-text-muted font-mono" dir="ltr">{contract.customer?.phone_number} | CR/ID: {contract.customer?.cr_number || contract.customer?.id_number}</p>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>
                        </div>

                        {/* Intro & Preamble */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SectionCard title={lang === 'ar' ? 'مقدمة العقد' : 'Introduction'} icon={FileText}>
                                <p className="text-xs text-text leading-relaxed whitespace-pre-line">{contract.introduction || (lang === 'ar' ? 'لا توجد مقدمة.' : 'No introduction.')}</p>
                            </SectionCard>
                            <SectionCard title={lang === 'ar' ? 'تمهيد العقد' : 'Preamble'} icon={FileText}>
                                <p className="text-xs text-text leading-relaxed whitespace-pre-line">{contract.preamble || (lang === 'ar' ? 'لا يوجد تمهيد.' : 'No preamble.')}</p>
                            </SectionCard>
                        </div>

                        {/* Storage Allocation Items */}
                        <SectionCard title={lang === 'ar' ? 'وحدات التخزين والأصناف' : 'Storage Allocation'} icon={Box}>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'الصنف' : 'Item'}</th>
                                            <th className="px-4 py-3 text-center w-24">{lang === 'ar' ? 'العدد' : 'Qty'}</th>
                                            <th className="px-4 py-3 w-36">{lang === 'ar' ? 'الإيجار الشهري' : 'Monthly Rent'}</th>
                                            <th className="px-4 py-3 w-28">{lang === 'ar' ? 'الخصم' : 'Discount'}</th>
                                            <th className="px-4 py-3 text-end">{lang === 'ar' ? 'الإجمالي (شامل الضريبة)' : 'Total (Inc. VAT)'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {contract.items?.map(item => (
                                            <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-bold">{lang === 'ar' ? item.storage_item?.name_ar : (item.storage_item?.name_en || item.storage_item?.name_ar)}</td>
                                                <td className="px-4 py-3 text-center font-mono font-semibold">{item.unit_count}</td>
                                                <td className="px-4 py-3 font-mono" dir="ltr">{item.monthly_rent}</td>
                                                <td className="px-4 py-3 font-mono text-danger" dir="ltr">{item.discount > 0 ? `-${item.discount}` : '0'}</td>
                                                <td className="px-4 py-3 text-sm font-mono font-extrabold text-emerald-600 text-end" dir="ltr">{item.subtotal}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-surface-muted/50 border-t border-border">
                                        <tr>
                                            <td colSpan="4" className="px-4 py-4 text-end text-xs font-extrabold text-text uppercase tracking-wider">
                                                {lang === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}
                                            </td>
                                            <td className="px-4 py-4 text-base font-mono font-extrabold text-emerald-600 text-end" dir="ltr">
                                                {contract.items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </SectionCard>

                        {/* Terms */}
                        <SectionCard title={lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'} icon={FileText}>
                            {contract.terms?.length === 0 ? (
                                <p className="text-xs text-text-muted text-center py-6">{lang === 'ar' ? 'لا توجد شروط مخصصة.' : 'No custom terms.'}</p>
                            ) : (
                                <ul className="space-y-3">
                                    {contract.terms?.map(term => (
                                        <li key={term.id} className="flex items-start gap-3 text-xs text-text leading-relaxed p-3 rounded-lg bg-surface-muted/30 border border-border">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{lang === 'ar' ? term.text_ar : (term.text_en || term.text_ar)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SectionCard>

                        {/* Print Action Bar */}
                        <div className="flex justify-end print:hidden">
                            <PrimaryButton type="button" onClick={() => window.print()}>
                                <Printer className="h-4 w-4 me-2" />
                                {lang === 'ar' ? 'طباعة العقد (A4)' : 'Print Contract (A4)'}
                            </PrimaryButton>
                        </div>
                    </div>
                )}

                {/* Tab Content 2: Periods */}
                {activeTab === 'periods' && (
                    <SectionCard 
                        title={lang === 'ar' ? 'فترات وتمديد العقد' : 'Contract Periods & Extension'} 
                        icon={Calendar}
                        action={
                            <PrimaryButton type="button" onClick={() => setShowPeriodModal(true)}>
                                <Plus className="h-4 w-4 me-1.5" />
                                {lang === 'ar' ? 'تجديد وتمديد العقد' : 'Extend Contract'}
                            </PrimaryButton>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-20 text-center">#</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {contract.periods?.map(period => (
                                        <tr key={period.id} className="hover:bg-surface-muted/30 transition-colors">
                                            <td className="px-4 py-3 text-center font-mono font-bold">{period.period_number}</td>
                                            <td className="px-4 py-3 font-mono">{period.start_date}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-primary">{period.end_date}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                    period.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                                                }`}>
                                                    {period.status === 'active' ? (lang === 'ar' ? 'نشطة' : 'Active') : (lang === 'ar' ? 'منتهية' : 'Ended')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-muted italic">{period.notes || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 3: Contacts */}
                {activeTab === 'contacts' && (
                    <SectionCard 
                        title={lang === 'ar' ? 'مندوبي العقد المسجلين' : 'Assigned Contract Delegates'} 
                        icon={Users}
                        action={
                            <PrimaryButton type="button" onClick={() => setShowAddContactModal(true)}>
                                <Plus className="h-4 w-4 me-1.5" />
                                {lang === 'ar' ? 'إضافة مندوب للعقد' : 'Add Delegate'}
                            </PrimaryButton>
                        }
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-start">
                                <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'اسم المندوب' : 'Name'}</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'الصلاحيات' : 'Authorities'}</th>
                                        <th className="px-4 py-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                        <th className="px-4 py-3 text-end">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {contract.contract_agents?.map(agent => (
                                        <tr key={agent.id} className="hover:bg-surface-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-bold">
                                                <div>{agent.name}</div>
                                                <div className="text-[11px] text-text-muted font-normal">{agent.job_title || '—'}</div>
                                            </td>
                                            <td className="px-4 py-3 font-mono">{agent.phone_number}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    {agent.can_sign && <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">{lang === 'ar' ? 'توقيع' : 'Sign'}</span>}
                                                    {agent.can_withdraw_goods && <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-bold">{lang === 'ar' ? 'سحب بضائع' : 'Withdraw'}</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                    agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                                                    agent.status === 'suspended' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                                                    'bg-danger/10 text-danger border border-danger/20'
                                                }`}>
                                                    {agent.status === 'active' ? (lang === 'ar' ? 'نشط' : 'Active') :
                                                     agent.status === 'suspended' ? (lang === 'ar' ? 'موقوف' : 'Suspended') :
                                                     (lang === 'ar' ? 'تم حذفه' : 'Deleted')}
                                                </span>
                                                {agent.status_reason && <p className="text-[11px] text-text-muted italic mt-1">{agent.status_reason}</p>}
                                                {agent.deleted_at_custom && <p className="text-[10px] text-danger font-mono mt-0.5">{new Date(agent.deleted_at_custom).toLocaleString()}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-end space-x-1 space-x-reverse">
                                                {agent.status === 'active' && (
                                                    <SecondaryButton type="button" onClick={() => { setSelectedContactAgent(agent); setContactActionType('suspended'); setShowStatusContactModal(true); }} className="text-xs py-1 px-2 border-amber-500/30 text-amber-600">
                                                        {lang === 'ar' ? 'إيقاف' : 'Suspend'}
                                                    </SecondaryButton>
                                                )}
                                                {agent.status === 'suspended' && (
                                                    <SecondaryButton type="button" onClick={() => { setSelectedContactAgent(agent); setContactActionType('active'); handleContactStatusSubmit({preventDefault:()=>[]}); }} className="text-xs py-1 px-2 border-emerald-500/30 text-emerald-600">
                                                        {lang === 'ar' ? 'تنشيط' : 'Activate'}
                                                    </SecondaryButton>
                                                )}
                                                {agent.status !== 'deleted' && (
                                                    <DangerButton type="button" onClick={() => { setSelectedContactAgent(agent); setContactActionType('deleted'); setShowStatusContactModal(true); }} className="text-xs py-1 px-2">
                                                        {lang === 'ar' ? 'إزالة' : 'Remove'}
                                                    </DangerButton>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 4: Financials */}
                {activeTab === 'financials' && (
                    <div className="space-y-6">
                        {/* Invoices */}
                        <SectionCard 
                            title={lang === 'ar' ? 'المستحقات المالية (الفواتير)' : 'Financial Dues (Invoices)'} 
                            icon={DollarSign}
                            action={
                                <PrimaryButton type="button" onClick={() => setShowInvoiceModal(true)}>
                                    <Plus className="h-4 w-4 me-1.5" />
                                    {lang === 'ar' ? 'إصدار فاتورة مستحقة' : 'Issue Invoice'}
                                </PrimaryButton>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {contract.invoices?.length === 0 ? (
                                            <tr><td colSpan="6" className="text-center py-6 text-xs text-text-muted">{lang === 'ar' ? 'لا توجد فواتير مستحقة.' : 'No invoices.'}</td></tr>
                                        ) : contract.invoices?.map(inv => (
                                            <tr key={inv.id} className="hover:bg-surface-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-primary">{inv.invoice_number}</td>
                                                <td className="px-4 py-3 font-mono">{inv.issue_date}</td>
                                                <td className="px-4 py-3 font-mono">{inv.due_date}</td>
                                                <td className="px-4 py-3 font-mono font-bold" dir="ltr">{inv.amount}</td>
                                                <td className="px-4 py-3 font-mono font-bold text-emerald-600" dir="ltr">{inv.paid_amount}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                                                        inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                                        inv.status === 'partially_paid' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                                                        'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                                    }`}>
                                                        {inv.status === 'paid' ? (lang === 'ar' ? 'مدفوعة' : 'Paid') :
                                                         inv.status === 'partially_paid' ? (lang === 'ar' ? 'مدفوعة جزئياً' : 'Partially Paid') :
                                                         (lang === 'ar' ? 'غير مدفوعة' : 'Unpaid')}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>

                        {/* Payments */}
                        <SectionCard 
                            title={lang === 'ar' ? 'الدفعات النقدية المسددة' : 'Cash Payments Recorded'} 
                            icon={CreditCard}
                            action={
                                <PrimaryButton type="button" onClick={() => setShowPaymentModal(true)}>
                                    <Plus className="h-4 w-4 me-1.5" />
                                    {lang === 'ar' ? 'تسجيل دفعة نقدية' : 'Record Payment'}
                                </PrimaryButton>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'طريقة الدفع' : 'Method'}</th>
                                            <th className="px-4 py-3">{lang === 'ar' ? 'المرجع / الملاحظات' : 'Reference / Notes'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {contract.payments?.length === 0 ? (
                                            <tr><td colSpan="4" className="text-center py-6 text-xs text-text-muted">{lang === 'ar' ? 'لا توجد دفعات مسجلة.' : 'No payments.'}</td></tr>
                                        ) : contract.payments?.map(p => (
                                            <tr key={p.id} className="hover:bg-surface-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-mono">{p.payment_date}</td>
                                                <td className="px-4 py-3 font-mono font-extrabold text-emerald-600" dir="ltr">{p.amount}</td>
                                                <td className="px-4 py-3 font-bold">{p.method === 'cash' ? (lang === 'ar' ? 'كاش' : 'Cash') : p.method === 'cheque' ? (lang === 'ar' ? 'شيك' : 'Cheque') : (lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer')}</td>
                                                <td className="px-4 py-3 text-xs text-text-muted italic">{p.reference || p.notes || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {/* Tab Content 5: Vouchers (Placeholder) */}
                {activeTab === 'vouchers' && (
                    <SectionCard title={lang === 'ar' ? 'سندات العقد (إدخال - إخراج - ترحيل - تسوية)' : 'Contract Vouchers'} icon={FileSpreadsheet}>
                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                            <FileSpreadsheet className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="text-sm font-bold text-text mb-1">{lang === 'ar' ? 'هيكل السندات جاهز للاستخدام المستقبلي' : 'Vouchers Structure Ready for Future Use'}</p>
                            <p className="text-xs text-text-muted max-w-md leading-relaxed">{lang === 'ar' ? 'سيتم تفعيل موديول السندات وحركاتها (الإدخال، الإخراج، الترحيل، والتسوية) لاحقاً بناءً على الخطة المعتمدة.' : 'Vouchers module will be enabled later as per approved plan.'}</p>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 6: Pallets (Placeholder) */}
                {activeTab === 'pallets' && (
                    <SectionCard title={lang === 'ar' ? 'طبالي العقد (هيستوري وحركة وحمولات)' : 'Contract Pallets'} icon={Layers}>
                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                            <Layers className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="text-sm font-bold text-text mb-1">{lang === 'ar' ? 'هيكل الطبالي جاهز للاستخدام المستقبلي' : 'Pallets Structure Ready for Future Use'}</p>
                            <p className="text-xs text-text-muted max-w-md leading-relaxed">{lang === 'ar' ? 'سيتم تفعيل حركة الطبالي وسجل الحمولات لاحقاً.' : 'Pallets tracking and payloads history will be enabled later.'}</p>
                        </div>
                    </SectionCard>
                )}

                {/* Tab Content 7: Stored Items (Placeholder) */}
                {activeTab === 'items' && (
                    <SectionCard title={lang === 'ar' ? 'الأصناف المخزنة على العقد (هيستوري وحركة كميات)' : 'Stored Items'} icon={Package}>
                        <div className="border border-dashed border-border rounded-xl p-12 text-center flex flex-col items-center justify-center bg-surface-muted/10">
                            <Package className="h-12 w-12 text-primary/40 mb-3" />
                            <p className="text-sm font-bold text-text mb-1">{lang === 'ar' ? 'هيكل الأصناف جاهز للاستخدام المستقبلي' : 'Stored Items Structure Ready for Future Use'}</p>
                            <p className="text-xs text-text-muted max-w-md leading-relaxed">{lang === 'ar' ? 'سيتم تفعيل سجل حركة كميات الأصناف المخزنة لاحقاً.' : 'Stored items inventory history will be enabled later.'}</p>
                        </div>
                    </SectionCard>
                )}

            </div>

            {/* Modal: Edit Contract */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="lg">
                <form onSubmit={(e) => { e.preventDefault(); handleAction('update', 'put', editForm, setShowEditModal); }} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text mb-4">{lang === 'ar' ? 'تعديل بيانات العقد' : 'Edit Contract'}</h3>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'مقدمة العقد' : 'Introduction'} />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={editForm.introduction}
                            onChange={e => setEditForm({...editForm, introduction: e.target.value})}
                        />
                    </div>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'تمهيد العقد' : 'Preamble'} />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={editForm.preamble}
                            onChange={e => setEditForm({...editForm, preamble: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowEditModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Extend Contract Period */}
            <Modal show={showPeriodModal} onClose={() => setShowPeriodModal(false)} maxWidth="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAction('periods.store', 'post', periodForm, setShowPeriodModal); }} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text mb-4">{lang === 'ar' ? 'تجديد وتمديد العقد (إضافة فترة)' : 'Extend Contract Period'}</h3>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'مدة التمديد (بالأشهر)' : 'Extension Duration (Months)'} />
                        <TextInput
                            type="number"
                            min="1"
                            className="mt-1 block w-full"
                            value={periodForm.duration_months}
                            onChange={e => setPeriodForm({...periodForm, duration_months: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'ملاحظات' : 'Notes'} />
                        <TextInput
                            type="text"
                            className="mt-1 block w-full"
                            value={periodForm.notes}
                            onChange={e => setPeriodForm({...periodForm, notes: e.target.value})}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowPeriodModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'تأكيد التمديد' : 'Confirm Extension'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Contract Contact */}
            <Modal show={showAddContactModal} onClose={() => setShowAddContactModal(false)} maxWidth="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAction('contacts.store', 'post', contactForm, setShowAddContactModal); }} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text mb-4">{lang === 'ar' ? 'إضافة مندوب للعقد' : 'Add Contract Delegate'}</h3>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'اختر المندوب من قائمة العميل' : 'Select Delegate from Customer Contacts'} />
                        <select
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3"
                            value={contactForm.contact_id}
                            onChange={e => setContactForm({ contact_id: e.target.value })}
                            required
                        >
                            <option value="">{lang === 'ar' ? '-- اختر المندوب --' : '-- Select Delegate --'}</option>
                            {contract.customer?.contacts?.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone_number})</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowAddContactModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'إضافة المندوب' : 'Add Delegate'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Contact Status / Remove Reason */}
            <Modal show={showStatusContactModal} onClose={() => setShowStatusContactModal(false)} maxWidth="md">
                <form onSubmit={handleContactStatusSubmit} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text mb-4">{contactActionType === 'deleted' ? (lang === 'ar' ? 'إزالة المندوب من العقد' : 'Remove Delegate') : (lang === 'ar' ? 'إيقاف المندوب' : 'Suspend Delegate')}</h3>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'سبب الإجراء (مطلوب)' : 'Reason (Required)'} />
                        <textarea
                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs min-h-[100px]"
                            value={statusContactForm.status_reason}
                            onChange={e => setStatusContactForm({ status_reason: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowStatusContactModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <DangerButton disabled={processing}>{contactActionType === 'deleted' ? (lang === 'ar' ? 'تأكيد الإزالة' : 'Confirm Remove') : (lang === 'ar' ? 'تأكيد الإيقاف' : 'Confirm Suspend')}</DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Invoice */}
            <Modal show={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} maxWidth="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAction('invoices.store', 'post', invoiceForm, setShowInvoiceModal); }} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text mb-4">{lang === 'ar' ? 'إصدار فاتورة مستحقة' : 'Issue Financial Invoice'}</h3>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'رقم الفاتورة' : 'Invoice Number'} />
                        <TextInput type="text" className="mt-1 block w-full" value={invoiceForm.invoice_number} onChange={e => setInvoiceForm({...invoiceForm, invoice_number: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'} />
                            <TextInput type="date" className="mt-1 block w-full" value={invoiceForm.issue_date} onChange={e => setInvoiceForm({...invoiceForm, issue_date: e.target.value})} required />
                        </div>
                        <div>
                            <InputLabel value={lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'} />
                            <TextInput type="date" className="mt-1 block w-full" value={invoiceForm.due_date} onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})} required />
                        </div>
                    </div>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'المبلغ المستحق' : 'Amount'} />
                        <TextInput type="number" step="0.01" className="mt-1 block w-full font-mono" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} required />
                    </div>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'ملاحظات' : 'Notes'} />
                        <TextInput type="text" className="mt-1 block w-full" value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowInvoiceModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'إصدار الفاتورة' : 'Issue Invoice'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Modal: Add Payment */}
            <Modal show={showPaymentModal} onClose={() => setShowPaymentModal(false)} maxWidth="md">
                <form onSubmit={(e) => { e.preventDefault(); handleAction('payments.store', 'post', paymentForm, setShowPaymentModal); }} className="p-6 space-y-4">
                    <h3 className="text-lg font-bold text-text mb-4">{lang === 'ar' ? 'تسجيل دفعة نقدية' : 'Record Cash Payment'}</h3>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'المبلغ المسدد' : 'Amount'} />
                        <TextInput type="number" step="0.01" className="mt-1 block w-full font-mono" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'تاريخ الدفع' : 'Payment Date'} />
                            <TextInput type="date" className="mt-1 block w-full" value={paymentForm.payment_date} onChange={e => setPaymentForm({...paymentForm, payment_date: e.target.value})} required />
                        </div>
                        <div>
                            <InputLabel value={lang === 'ar' ? 'طريقة الدفع' : 'Method'} />
                            <select className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3" value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                                <option value="bank_transfer">{lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                                <option value="cash">{lang === 'ar' ? 'كاش' : 'Cash'}</option>
                                <option value="cheque">{lang === 'ar' ? 'شيك' : 'Cheque'}</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'ربط بفاتورة مستحقة (اختياري)' : 'Link to Invoice (Optional)'} />
                        <select className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs py-2 px-3" value={paymentForm.invoice_id} onChange={e => setPaymentForm({...paymentForm, invoice_id: e.target.value})}>
                            <option value="">{lang === 'ar' ? '-- بدون ربط --' : '-- No Link --'}</option>
                            {contract.invoices?.filter(i => i.status !== 'paid').map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.invoice_number} ({inv.amount} - المتبقي: {inv.amount - inv.paid_amount})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <InputLabel value={lang === 'ar' ? 'المرجع / الملاحظات' : 'Reference / Notes'} />
                        <TextInput type="text" className="mt-1 block w-full" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowPaymentModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'تسجيل الدفعة' : 'Record Payment'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* A4 Print View Container (Hidden on screen, visible on print) */}
            <div className="hidden print:block print:w-full print:bg-white print:text-black print:p-8 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                {/* Header */}
                <div className="flex items-start justify-between border-b-2 border-black pb-6 mb-6">
                    {/* Right: Company Info */}
                    <div className="space-y-1 max-w-xs">
                        <h2 className="text-lg font-extrabold text-black">{settings?.company_name || 'مخازن محمد عبد الله العتيبي'}</h2>
                        <p className="text-xs text-gray-700 font-bold">{settings?.company_slogan || 'تخزين - تبريد - تغليف - تصدير - تجارة'}</p>
                        <div className="text-[11px] text-gray-600 space-y-0.5 pt-1 font-mono">
                            <p>{lang === 'ar' ? 'س.ت:' : 'CR:'} {settings?.company_cr || '1010101010'}</p>
                            <p>{lang === 'ar' ? 'ر.ض:' : 'VAT:'} {settings?.company_vat || '300000000000003'}</p>
                            {settings?.company_license && <p>{lang === 'ar' ? 'ترخيص:' : 'License:'} {settings?.company_license}</p>}
                        </div>
                    </div>

                    {/* Center: Title & Serial */}
                    <div className="flex flex-col items-center justify-center pt-2">
                        <div className="border-2 border-black px-6 py-2 rounded font-extrabold text-lg tracking-wide uppercase bg-gray-50">
                            {lang === 'ar' ? 'عقد إيجار وحدات تخزينية' : 'Storage Units Lease Contract'}
                        </div>
                        <div className="mt-2 text-xs font-mono font-bold text-gray-800">
                            {lang === 'ar' ? 'رقم العقد:' : 'Contract No:'} {contract.contract_number}
                        </div>
                        <div className="text-[11px] font-mono text-gray-600">
                            {lang === 'ar' ? 'التاريخ:' : 'Date:'} {contract.write_date} {contract.write_date_hijri ? `(${contract.write_date_hijri})` : ''}
                        </div>
                    </div>

                    {/* Left: Logo & Quality System */}
                    <div className="flex flex-col items-end space-y-3">
                        {settings?.company_logo ? (
                            <img src={'/storage/' + settings.company_logo} alt="Company Logo" className="h-16 w-auto object-contain" />
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center border border-gray-300 rounded bg-gray-50 text-gray-400">
                                <Building2 className="h-8 w-8" />
                            </div>
                        )}

                        {/* Quality System Box (Conditional) */}
                        {(settings?.quality_system === '1' || settings?.quality_system === true) && (
                            <div className="border border-black p-2 rounded text-[10px] font-mono text-right bg-gray-50">
                                <p className="font-bold text-black border-b border-gray-200 pb-0.5 mb-0.5">{lang === 'ar' ? 'نظام إدارة الجودة' : 'QMS Data'}</p>
                                <p>{lang === 'ar' ? 'رقم الإصدار:' : 'Issue No:'} {settings?.issue_no || 'REV-01'}</p>
                                <p>{lang === 'ar' ? 'تاريخ الإصدار:' : 'Issue Date:'} {settings?.issue_date || '2026-01-01'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Introduction & Preamble */}
                <div className="space-y-4 mb-6 text-xs leading-relaxed text-black">
                    {contract.introduction && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <h3 className="font-bold text-black mb-1">{lang === 'ar' ? 'الافتتاحية' : 'Introduction'}</h3>
                            <p className="whitespace-pre-line">{contract.introduction}</p>
                        </div>
                    )}

                    {/* Parties */}
                    <div className="border-l-4 border-r-4 border-black p-4 bg-gray-50/50 my-4 rounded">
                        <h3 className="font-bold text-sm text-black mb-3 border-b border-gray-200 pb-1">{lang === 'ar' ? 'أطراف العقد' : 'Contract Parties'}</h3>
                        <div className="grid grid-cols-2 gap-6 text-xs">
                            <div className="space-y-1.5">
                                <p className="font-extrabold text-black text-sm">{lang === 'ar' ? 'الطرف الأول (المؤجر):' : 'First Party (Lessor):'}</p>
                                <p className="font-bold">{settings?.company_name || 'مخازن محمد عبد الله العتيبي'}</p>
                                <p className="text-gray-600 font-mono">{lang === 'ar' ? 'سجل تجاري:' : 'CR:'} {settings?.company_cr || '1010101010'}</p>
                                <p className="text-gray-600 font-mono">{lang === 'ar' ? 'الرقم الضريبي:' : 'VAT:'} {settings?.company_vat || '300000000000003'}</p>
                                <p className="text-gray-700">{lang === 'ar' ? 'ويمثله في هذا العقد:' : 'Represented by:'} <span className="font-bold">{settings?.company_gm || (lang === 'ar' ? 'المدير العام' : 'General Manager')}</span></p>
                            </div>
                            <div className="space-y-1.5">
                                <p className="font-extrabold text-black text-sm">{lang === 'ar' ? 'الطرف الثاني (المستأجر):' : 'Second Party (Lessee):'}</p>
                                <p className="font-bold">{contract.customer?.name}</p>
                                <p className="text-gray-600 font-mono">{lang === 'ar' ? 'هاتف:' : 'Phone:'} <span dir="ltr">{contract.customer?.phone_number}</span></p>
                                <p className="text-gray-600 font-mono">{lang === 'ar' ? 'سجل/هوية:' : 'CR/ID:'} {contract.customer?.cr_number || contract.customer?.id_number || '—'}</p>
                                <p className="text-gray-700">{lang === 'ar' ? 'ويمثله في هذا العقد:' : 'Represented by:'} <span className="font-bold">{contract.contract_agents?.[0]?.name || contract.customer?.name}</span></p>
                            </div>
                        </div>
                    </div>

                    {contract.preamble && (
                        <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <h3 className="font-bold text-black mb-1">{lang === 'ar' ? 'التمهيد' : 'Preamble'}</h3>
                            <p className="whitespace-pre-line">{contract.preamble}</p>
                        </div>
                    )}
                </div>

                {/* Storage Items Table */}
                <div className="mb-6">
                    <h3 className="font-bold text-xs text-black uppercase tracking-wider mb-2">{lang === 'ar' ? 'جدول الوحدات التخزينية والأصناف' : 'Storage Allocation Table'}</h3>
                    <table className="w-full text-xs text-start border-collapse border border-black">
                        <thead className="bg-gray-100 text-black uppercase font-bold">
                            <tr>
                                <th className="border border-black px-3 py-2">{lang === 'ar' ? 'الصنف' : 'Item'}</th>
                                <th className="border border-black px-3 py-2 text-center w-16">{lang === 'ar' ? 'العدد' : 'Qty'}</th>
                                <th className="border border-black px-3 py-2 text-center w-28">{lang === 'ar' ? 'الإيجار الشهري' : 'Monthly Rent'}</th>
                                <th className="border border-black px-3 py-2 text-center w-24">{lang === 'ar' ? 'الخصم' : 'Discount'}</th>
                                <th className="border border-black px-3 py-2 text-end w-32">{lang === 'ar' ? 'الإجمالي (شامل الضريبة)' : 'Total (Inc. VAT)'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                            {contract.items?.map(item => (
                                <tr key={item.id}>
                                    <td className="border border-black px-3 py-2 font-bold">{lang === 'ar' ? item.storage_item?.name_ar : (item.storage_item?.name_en || item.storage_item?.name_ar)}</td>
                                    <td className="border border-black px-3 py-2 text-center font-mono">{item.unit_count}</td>
                                    <td className="border border-black px-3 py-2 text-center font-mono" dir="ltr">{item.monthly_rent}</td>
                                    <td className="border border-black px-3 py-2 text-center font-mono text-red-700" dir="ltr">{item.discount > 0 ? `-${item.discount}` : '0'}</td>
                                    <td className="border border-black px-3 py-2 text-end font-mono font-bold" dir="ltr">{item.subtotal}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold border-t-2 border-black">
                            <tr>
                                <td colSpan="4" className="border border-black px-3 py-2 text-end uppercase">
                                    {lang === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}
                                </td>
                                <td className="border border-black px-3 py-2 text-end font-mono text-sm" dir="ltr">
                                    {contract.items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Terms & Conditions */}
                <div className="mb-12">
                    <h3 className="font-bold text-xs text-black uppercase tracking-wider mb-3">{lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}</h3>
                    {contract.terms?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">{lang === 'ar' ? 'لا توجد شروط مخصصة.' : 'No custom terms.'}</p>
                    ) : (
                        <ol className="list-decimal list-inside space-y-2 text-xs text-black leading-relaxed">
                            {contract.terms?.map(term => (
                                <li key={term.id} className="pl-1 pr-1">
                                    <span className="font-medium">{lang === 'ar' ? term.text_ar : (term.text_en || term.text_ar)}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>

                {/* Signatures Footer */}
                <div className="border-t-2 border-black pt-8 mt-8 grid grid-cols-2 gap-12 text-xs text-black">
                    <div className="space-y-4">
                        <p className="font-extrabold text-sm border-b border-gray-300 pb-1">{lang === 'ar' ? 'الطرف الأول (المؤجر)' : 'First Party (Lessor)'}</p>
                        <p><span className="font-bold">{lang === 'ar' ? 'الشركة:' : 'Company:'}</span> {settings?.company_name || 'مخازن محمد عبد الله العتيبي'}</p>
                        <p><span className="font-bold">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> {settings?.company_gm || (lang === 'ar' ? 'المدير العام' : 'General Manager')}</p>
                        <p className="pt-4"><span className="font-bold">{lang === 'ar' ? 'التوقيع:' : 'Signature:'}</span> ___________________________</p>
                        <p className="pt-2"><span className="font-bold">{lang === 'ar' ? 'الختم الرسمي:' : 'Official Stamp:'}</span></p>
                    </div>

                    <div className="space-y-4">
                        <p className="font-extrabold text-sm border-b border-gray-300 pb-1">{lang === 'ar' ? 'الطرف الثاني (المستأجر)' : 'Second Party (Lessee)'}</p>
                        <p><span className="font-bold">{lang === 'ar' ? 'العميل:' : 'Customer:'}</span> {contract.customer?.name}</p>
                        <p><span className="font-bold">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span> {contract.contract_agents?.[0]?.name || contract.customer?.name}</p>
                        <p className="pt-4"><span className="font-bold">{lang === 'ar' ? 'التوقيع:' : 'Signature:'}</span> ___________________________</p>
                        <p className="pt-2"><span className="font-bold">{lang === 'ar' ? 'التاريخ:' : 'Date:'}</span> ____ / ____ / ________</p>
                    </div>
                </div>
            </div>

        </AuthenticatedLayout>
    );
}
