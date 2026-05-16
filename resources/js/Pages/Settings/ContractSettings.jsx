import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useLang } from '@/Contexts/LanguageContext';
import { 
    Home, ChevronRight, FileText, LayoutList, Clock, 
    Save, X, GripVertical, Check, Plus, Edit, Trash2, Info, Search, Building2, Variable, Upload
} from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Tooltip from '@/Components/Tooltip';

export default function ContractSettings({ terms: initialTerms, settings }) {
    const { lang } = useLang();
    const [activeTab, setActiveTab] = useState('company'); // company, library, parts, periods
    const [terms, setTerms] = useState(initialTerms || []);
    const [showTermModal, setShowTermModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // ── 1. Global Settings Form ──
    const settingsForm = useForm({
        company_name: settings.company_name || '',
        company_slogan: settings.company_slogan || '',
        company_cr: settings.company_cr || '',
        company_vat: settings.company_vat || '',
        company_license: settings.company_license || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_address: settings.company_address || '',
        company_gm: settings.company_gm || '',
        company_dgm: settings.company_dgm || '',
        company_logo: null,
        show_quality_data: settings.show_quality_data === '1' || settings.show_quality_data === true,
        quality_issue_no: settings.quality_issue_no || '',
        quality_issue_date: settings.quality_issue_date || '',
        default_introduction: settings.default_introduction || '',
        default_preamble: settings.default_preamble || '',
        default_mandatory_period: settings.default_mandatory_period || 12,
        default_renewal_period: settings.default_renewal_period || 12,
    });

    const saveSettings = (e) => {
        e.preventDefault();
        settingsForm.post(route('settings.terms.settings.update'));
    };

    // ── 2. Terms Library Logic ──
    const [termForm, setTermForm] = useState({ text_ar: '', text_en: '', is_active: true });
    const [termErrors, setTermErrors] = useState({});

    const openCreate = () => {
        setEditingTerm(null);
        setTermForm({ text_ar: '', text_en: '', is_active: true });
        setTermErrors({});
        setShowTermModal(true);
    };

    const openEdit = (term) => {
        setEditingTerm(term);
        setTermForm({ text_ar: term.text_ar, text_en: term.text_en || '', is_active: !!term.is_active });
        setTermErrors({});
        setShowTermModal(true);
    };

    const saveTerm = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = editingTerm 
                ? await axios.put(route('settings.terms.update', editingTerm.id), termForm)
                : await axios.post(route('settings.terms.store'), termForm);
            
            router.reload({ only: ['terms'] }); // Refresh the list
            setShowTermModal(false);
        } catch (err) {
            if (err.response?.data?.errors) setTermErrors(err.response.data.errors);
        } finally { setSaving(false); }
    };

    const removeTerm = () => {
        router.delete(route('settings.terms.destroy', deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    // ── Reordering ──
    const dragIndex = useRef(null);
    const [dragOver, setDragOver] = useState(null);

    const onDragEnd = async () => {
        if (dragIndex.current === null || dragOver === null) return;
        const reordered = [...terms];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(dragOver, 0, moved);
        setTerms(reordered);
        dragIndex.current = null; setDragOver(null);
        await axios.post(route('settings.terms.reorder'), { ordered_ids: reordered.map(t => t.id) });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('settings.index'))}>
                {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </span>
            <ChevronRight className={lang === 'ar' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'إعدادات العقود' : 'Contract Settings'}</span>
        </div>
    );

    const tabs = [
        { id: 'company', label: lang === 'ar' ? 'بيانات الشركة' : 'Company Data', icon: Building2 },
        { id: 'library', label: lang === 'ar' ? 'مكتبة الشروط' : 'Terms Library', icon: LayoutList },
        { id: 'parts', label: lang === 'ar' ? 'أجزاء العقد' : 'Contract Parts', icon: FileText },
        { id: 'periods', label: lang === 'ar' ? 'المدد الزمنية' : 'Periods', icon: Clock },
    ];

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'إعدادات العقود القياسية' : 'Standard Contract Settings'} />

            <div className="mx-auto max-w-5xl space-y-4">
                
                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="flex border-b border-border bg-surface-muted/30">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                                    activeTab === tab.id 
                                        ? 'border-primary text-primary bg-surface' 
                                        : 'border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 flex-1">

                        {/* Tab: Company Data (SaaS Tenant) */}
                        {activeTab === 'company' && (
                            <form onSubmit={saveSettings} className="space-y-6 max-w-4xl">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-primary">{lang === 'ar' ? 'بيانات المؤسسة (الطرف الأول)' : 'Company / First Party Details'}</p>
                                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                            {lang === 'ar' ? 'هذه البيانات تمثل الهوية القانونية للمنشأة وتستخدم في ترويسة وتواقيع العقود وتدعم بنية الـ SaaS.' : 'These details represent the legal identity of the establishment used in contract headers and signatures.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'اسم المنشأة' : 'Company Name'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_name} 
                                            onChange={e => settingsForm.setData('company_name', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'النشاط / الشعار الوصفي' : 'Slogan / Activity'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_slogan} 
                                            onChange={e => settingsForm.setData('company_slogan', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'سجل تجاري' : 'Commercial Registration'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_cr} 
                                            onChange={e => settingsForm.setData('company_cr', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'الرقم الضريبي' : 'VAT Number'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_vat} 
                                            onChange={e => settingsForm.setData('company_vat', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'رقم ترخيص التخزين' : 'License Number'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_license} 
                                            onChange={e => settingsForm.setData('company_license', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'رقم الهاتف / الجوال' : 'Phone Number'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_phone} 
                                            onChange={e => settingsForm.setData('company_phone', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_email} 
                                            onChange={e => settingsForm.setData('company_email', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'العنوان الوطني' : 'National Address'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_address} 
                                            onChange={e => settingsForm.setData('company_address', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'المدير العام (الممثل النظامي)' : 'General Manager'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_gm} 
                                            onChange={e => settingsForm.setData('company_gm', e.target.value)} 
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'نائب المدير العام' : 'Deputy GM'} />
                                        <TextInput 
                                            className="mt-1 block w-full" 
                                            value={settingsForm.data.company_dgm} 
                                            onChange={e => settingsForm.setData('company_dgm', e.target.value)} 
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel value={lang === 'ar' ? 'شعار الشركة (Logo)' : 'Company Logo'} />
                                        <div className="mt-1 flex items-center gap-4">
                                            {settings.company_logo && !settingsForm.data.company_logo && (
                                                <img src={settings.company_logo} alt="Logo" className="h-12 w-12 object-contain bg-white rounded border border-border" />
                                            )}
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={e => settingsForm.setData('company_logo', e.target.files[0])} 
                                                className="block w-full text-sm text-text-muted file:me-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 border-t border-border pt-6 mt-2 space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-surface-muted/50 rounded-xl border border-border">
                                            <div>
                                                <p className="text-sm font-bold text-text">{lang === 'ar' ? 'تفعيل بيانات نظام الجودة' : 'Enable Quality System Data'}</p>
                                                <p className="text-xs text-text-muted mt-0.5">{lang === 'ar' ? 'عرض رقم وتاريخ الإصدار في ترويسة العقود المطبوعة' : 'Show issue number and date in printed contract header'}</p>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={settingsForm.data.show_quality_data} 
                                                onChange={e => settingsForm.setData('show_quality_data', e.target.checked)} 
                                                className="rounded border-border text-primary focus:ring-primary h-5 w-5"
                                            />
                                        </div>

                                        {settingsForm.data.show_quality_data && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-primary/5 rounded-xl border border-primary/10 animate-fadeIn">
                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'رقم الإصدار (Issue no)' : 'Issue Number'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full" 
                                                        value={settingsForm.data.quality_issue_no} 
                                                        onChange={e => settingsForm.setData('quality_issue_no', e.target.value)} 
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'تاريخ الإصدار (Issue Date)' : 'Issue Date'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full" 
                                                        value={settingsForm.data.quality_issue_date} 
                                                        onChange={e => settingsForm.setData('quality_issue_date', e.target.value)} 
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <PrimaryButton disabled={settingsForm.processing}>
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === 'ar' ? 'حفظ بيانات الشركة' : 'Save Company Data'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                        {/* Tab: Terms Library */}
                        {activeTab === 'library' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold text-text">{lang === 'ar' ? 'إدارة مكتبة الشروط' : 'Manage Terms Library'}</h3>
                                        <p className="text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? 'أضف الشروط العامة التي يمكن استخدامها في كافة المواسم والعقود' : 'Add global terms that can be used across all seasons and contracts'}</p>
                                    </div>
                                    <PrimaryButton onClick={openCreate}>
                                        <Plus className="h-4 w-4 me-2" />
                                        {lang === 'ar' ? 'إضافة شرط جديد' : 'New Term'}
                                    </PrimaryButton>
                                </div>

                                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-surface">
                                    {terms.map((term, index) => (
                                        <div
                                            key={term.id}
                                            draggable
                                            onDragStart={() => dragIndex.current = index}
                                            onDragEnter={() => setDragOver(index)}
                                            onDragEnd={onDragEnd}
                                            onDragOver={e => e.preventDefault()}
                                            className={`flex items-center justify-between p-4 transition-colors ${dragOver === index ? 'bg-primary/5 border-s-4 border-primary' : 'hover:bg-surface-muted/30'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <GripVertical className="h-5 w-5 text-text-muted cursor-grab active:cursor-grabbing shrink-0 mt-0.5" />
                                                <div className="space-y-1">
                                                    <p className="text-[13px] text-text font-medium leading-relaxed">{term.text_ar}</p>
                                                    {term.text_en && <p className="text-[11px] text-text-muted font-mono" dir="ltr">{term.text_en}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ms-4">
                                                <button onClick={() => openEdit(term)} className="p-2 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => setDeleteTarget(term)} className="p-2 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tab: Contract Parts */}
                        {activeTab === 'parts' && (
                            <form onSubmit={saveSettings} className="space-y-6 max-w-3xl">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-primary">{lang === 'ar' ? 'نصوص العقد الافتراضية' : 'Default Contract Parts'}</p>
                                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                            {lang === 'ar' ? 'هذه النصوص ستستخدم في حال لم يتم تحديد نصوص خاصة بالموسم.' : 'These texts will be used if no season-specific texts are defined.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'مقدمة العقد القياسية' : 'Standard Introduction'} />
                                        <textarea
                                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[150px]"
                                            value={settingsForm.data.default_introduction}
                                            onChange={e => settingsForm.setData('default_introduction', e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'تمهيد العقد القياسي' : 'Standard Preamble'} />
                                        <textarea
                                            className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[150px]"
                                            value={settingsForm.data.default_preamble}
                                            onChange={e => settingsForm.setData('default_preamble', e.target.value)}
                                        />
                                    </div>

                                    {/* Smart Variables Guide */}
                                    <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl max-w-xl">
                                        <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                            <Variable className="h-4 w-4 text-amber-600" />
                                            {lang === 'ar' ? 'دليل المتغيرات الذكية' : 'Smart Variables Guide'}
                                        </div>
                                        <p className="text-[11px] text-amber-700/80 mb-3 leading-relaxed">
                                            {lang === 'ar' ? 'يمكنك استخدام هذه المتغيرات في نصوص العقد ليتم استبدالها آلياً ببيانات العقد الحقيقية عند الطباعة:' : 'Use these variables in contract texts to automatically replace them with real contract data when printing:'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                            {[
                                                { label: lang === 'ar' ? 'اسم الشركة' : 'Company Name', code: '{$company_name}' },
                                                { label: lang === 'ar' ? 'سجل الشركة' : 'Company CR', code: '{$company_cr}' },
                                                { label: lang === 'ar' ? 'ترخيص الشركة' : 'License No.', code: '{$company_license}' },
                                                { label: lang === 'ar' ? 'ممثل الشركة' : 'Company GM', code: '{$company_gm}' },
                                                { label: lang === 'ar' ? 'عنوان الشركة' : 'Company Address', code: '{$company_address}' },
                                                { label: lang === 'ar' ? 'اسم العميل' : 'Customer Name', code: '{$customer_name}' },
                                                { label: lang === 'ar' ? 'هاتف العميل' : 'Customer Phone', code: '{$customer_phone}' },
                                                { label: lang === 'ar' ? 'اسم المندوب' : 'Contact Name', code: '{$contact_name}' },
                                                { label: lang === 'ar' ? 'رقم العقد' : 'Contract No.', code: '{$contract_number}' },
                                                { label: lang === 'ar' ? 'تاريخ البداية' : 'Start Date', code: '{$start_date}' },
                                                { label: lang === 'ar' ? 'الفترة الإلزامية' : 'Mandatory Per.', code: '{$mandatory_period}' },
                                                { label: lang === 'ar' ? 'فترة التجديد' : 'Renewal Per.', code: '{$renew_period}' },
                                            ].map(v => (
                                                <div key={v.code} className="flex items-center justify-between group border-b border-amber-500/10 pb-1">
                                                    <span className="text-[10px] text-amber-700">{v.label}</span>
                                                    <code className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-amber-600 font-mono">
                                                        {v.code}
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <PrimaryButton disabled={settingsForm.processing}>
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === 'ar' ? 'حفظ إعدادات النصوص' : 'Save Text Settings'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                        {/* Tab: Periods */}
                        {activeTab === 'periods' && (
                            <form onSubmit={saveSettings} className="space-y-6 max-w-xl">
                                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-600">{lang === 'ar' ? 'الفترات القياسية الافتراضية' : 'Global Default Periods'}</p>
                                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                            {lang === 'ar' ? 'سيتم اقتراح هذه المدد عند إنشاء أي عقد جديد خارج نطاق مواسم محددة.' : 'These durations will be suggested for any new contract outside specific seasons.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'المدة الإلزامية الافتراضية' : 'Global Mandatory Period'} />
                                        <div className="mt-1 flex items-center gap-3">
                                            <TextInput 
                                                type="number" 
                                                className="w-full" 
                                                value={settingsForm.data.default_mandatory_period} 
                                                onChange={e => settingsForm.setData('default_mandatory_period', e.target.value)} 
                                            />
                                            <span className="text-sm text-text-muted shrink-0">{lang === 'ar' ? 'شهر' : 'Months'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'فترة التجديد الافتراضية' : 'Global Renewal Period'} />
                                        <div className="mt-1 flex items-center gap-3">
                                            <TextInput 
                                                type="number" 
                                                className="w-full" 
                                                value={settingsForm.data.default_renewal_period} 
                                                onChange={e => settingsForm.setData('default_renewal_period', e.target.value)} 
                                            />
                                            <span className="text-sm text-text-muted shrink-0">{lang === 'ar' ? 'شهر' : 'Months'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Smart Variables Guide */}
                                <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                        <Variable className="h-4 w-4 text-amber-600" />
                                        {lang === 'ar' ? 'دليل المتغيرات الذكية' : 'Smart Variables Guide'}
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                        {[
                                            { label: lang === 'ar' ? 'الفترة الإلزامية' : 'Mandatory Per.', code: '{$mandatory_period}' },
                                            { label: lang === 'ar' ? 'فترة التجديد' : 'Renewal Per.', code: '{$renew_period}' },
                                        ].map(v => (
                                            <div key={v.code} className="flex items-center justify-between group border-b border-amber-500/10 pb-1">
                                                <span className="text-[10px] text-amber-700">{v.label}</span>
                                                <code className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-amber-600 font-mono">
                                                    {v.code}
                                                </code>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <PrimaryButton disabled={settingsForm.processing}>
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === 'ar' ? 'حفظ مدد العقود' : 'Save Period Settings'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                    </div>
                </div>

            </div>

            {/* Term Modal */}
            <Modal show={showTermModal} onClose={() => setShowTermModal(false)} maxWidth="lg">
                <form onSubmit={saveTerm} className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-text">
                        {editingTerm ? (lang === 'ar' ? 'تعديل شرط' : 'Edit Term') : (lang === 'ar' ? 'إضافة شرط جديد' : 'New Term')}
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'نص الشرط (بالعربي) *' : 'Term Text (Arabic) *'} />
                            <textarea
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[100px]"
                                value={termForm.text_ar}
                                onChange={e => setTermForm({...termForm, text_ar: e.target.value})}
                                required
                            />
                            <InputError message={termErrors.text_ar} />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => setShowTermModal(false)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={saving}>{lang === 'ar' ? 'حفظ الشرط' : 'Save Term'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal show={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="h-12 w-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg text-text">{lang === 'ar' ? 'حذف الشرط؟' : 'Delete Term?'}</h3>
                    <p className="text-sm text-text-muted mt-2">{lang === 'ar' ? 'هل أنت متأكد من حذف هذا الشرط من المكتبة العامة؟' : 'Are you sure you want to delete this term from the global library?'}</p>
                    
                    <div className="flex justify-center gap-3 mt-6">
                        <SecondaryButton onClick={() => setDeleteTarget(null)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <DangerButton onClick={removeTerm}>{lang === 'ar' ? 'حذف نهائياً' : 'Delete Forever'}</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
