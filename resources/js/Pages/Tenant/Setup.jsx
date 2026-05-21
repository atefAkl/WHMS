import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { 
    Building2, Save, Upload, LogOut, CheckCircle2, ArrowRight, ArrowLeft,
    Plus, Trash2, UserPlus, FileText, Check, Calendar, Mail, Phone, ShieldCheck, HelpCircle
} from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function Setup({ settings, registration }) {
    const { lang } = useLang();
    const [currentStep, setCurrentStep] = useState(1);

    // نموذج تهيئة البيانات المشترك
    const { data, setData, post, processing, errors } = useForm({
        // Initial form fields (will be overridden by fetched settings if available)
        // Note: settings prop may be undefined on initial render; we'll fetch from API.

        // المرحلة 1: البيانات العامة
        company_name: settings?.company_name || registration?.company_name || '',
        company_slogan: settings?.company_slogan || '',
        company_phone: settings?.company_phone || registration?.company_phone || '',
        company_logo: null,

        // المرحلة 2: ملفات الترخيص والتسجيل
        company_cr: settings?.company_cr || '',
        company_vat: settings?.company_vat || '',
        company_address: settings?.company_address || '',
        company_license: settings?.company_license || '',
        company_cr_file: null,
        company_vat_file: null,
        company_license_file: null,
        company_additional_files: [], // { name: '', file: null, preview: '' }

        // المرحلة 3: المستخدمين وجهات الاتصال
        users: [
            { name: '', job_title: 'المدير العام', id_number: '', phone: '', email: '', password: '', username: 'general_manager', avatar: null, avatar_preview: null },
            { name: '', job_title: 'نائب المدير العام', id_number: '', phone: '', email: '', password: '', username: 'deputy_gm', avatar: null, avatar_preview: null },
            { name: '', job_title: 'مدير التطبيق (المشرف)', id_number: '', phone: '', email: '', password: '', username: 'app_admin', avatar: null, avatar_preview: null }
        ],

        // المرحلة 4: قنوات الاتصال الإضافية
        company_email: settings?.company_email || registration?.company_email || '',
        company_contacts: [], // { type: 'whatsapp', label: 'واتساب', value: '' }

        // المرحلة 5: أول موسم عمل
        season_name_ar: 'موسم تشغيل 2026-2027',
        season_name_en: 'Operational Season 2026-2027',
        season_start: '2026-01-01',
        season_end: '2026-12-31'
    });

    const [logoPreview, setLogoPreview] = useState(settings?.company_logo || null);

    const steps = [
        { id: 1, name: lang === 'ar' ? 'البيانات العامة' : 'General Info' },
        { id: 2, name: lang === 'ar' ? 'الملفات والتراخيص' : 'Licenses & Docs' },
        { id: 3, name: lang === 'ar' ? 'المستخدمون والصلاحيات' : 'Users & Staff' },
        { id: 4, name: lang === 'ar' ? 'قنوات الاتصال' : 'Contacts' },
        { id: 5, name: lang === 'ar' ? 'موسم البداية' : 'First Season' }
    ];

    // معالجة اللوجو
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('company_logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    // معالجة ملفات المرحلة الثانية
    const handleFileChange = (field, file) => {
        if (file) {
            setData(field, file);
        }
    };

    // إضافة مستند إضافي (المرحلة 2)
    const addAdditionalFile = () => {
        const updated = [...data.company_additional_files, { name: '', file: null, preview: '' }];
        setData('company_additional_files', updated);
    };

    const removeAdditionalFile = (index) => {
        const updated = data.company_additional_files.filter((_, i) => i !== index);
        setData('company_additional_files', updated);
    };

    const handleAdditionalFileChange = (index, field, value) => {
        const updated = [...data.company_additional_files];
        updated[index][field] = value;
        setData('company_additional_files', updated);
    };

    // معالجة الموظفين (المرحلة 3)
    const handleUserChange = (index, field, value) => {
        const updatedUsers = [...data.users];
        updatedUsers[index][field] = value;
        setData('users', updatedUsers);
    };

    const handleUserAvatarChange = (index, file) => {
        if (file) {
            const updatedUsers = [...data.users];
            updatedUsers[index]['avatar'] = file;
            updatedUsers[index]['avatar_preview'] = URL.createObjectURL(file);
            setData('users', updatedUsers);
        }
    };

    const addUser = () => {
        const updatedUsers = [...data.users, { 
            name: '', 
            job_title: 'موظف تشغيل', 
            id_number: '', 
            phone: '', 
            email: '', 
            password: '', 
            username: 'staff_user_' + (data.users.length + 1), 
            avatar: null, 
            avatar_preview: null 
        }];
        setData('users', updatedUsers);
    };

    const removeUser = (index) => {
        // نمنع حذف الموظفين الثلاثة الأساسيين
        if (index < 3) return;
        const updatedUsers = data.users.filter((_, i) => i !== index);
        setData('users', updatedUsers);
    };

    // معالجة قنوات الاتصال الإضافية (المرحلة 4)
    const addContactChannel = () => {
        const updated = [...data.company_contacts, { type: 'whatsapp', label: lang === 'ar' ? 'واتساب' : 'WhatsApp', value: '' }];
        setData('company_contacts', updated);
    };

    const removeContactChannel = (index) => {
        const updated = data.company_contacts.filter((_, i) => i !== index);
        setData('company_contacts', updated);
    };

    const handleContactChannelChange = (index, field, value) => {
        const updated = [...data.company_contacts];
        updated[index][field] = value;
        setData('company_contacts', updated);
    };

    // التحقق من الحقول قبل الانتقال للخطوة التالية
    const validateStep = () => {
        if (currentStep === 1) {
            if (!data.company_name.trim() || !data.company_phone.trim()) {
                alert(lang === 'ar' ? 'الرجاء إدخال اسم المنشأة ورقم الهاتف!' : 'Please enter company name and phone!');
                return false;
            }
        } else if (currentStep === 2) {
            if (!data.company_cr.trim() || !data.company_vat.trim() || !data.company_address.trim()) {
                alert(lang === 'ar' ? 'الرجاء ملء السجل والرقم الضريبي والعنوان الوطني!' : 'Please enter CR, VAT, and National Address!');
                return false;
            }
            // التحقق من رفع الملفات الإلزامية
            if (!data.company_cr_file && !settings?.company_cr_file) {
                alert(lang === 'ar' ? 'يجب رفع ملف السجل التجاري للمتابعة!' : 'Commercial Registration file is required!');
                return false;
            }
            if (!data.company_vat_file && !settings?.company_vat_file) {
                alert(lang === 'ar' ? 'يجب رفع شهادة التسجيل في الضريبة للمتابعة!' : 'VAT Registration file is required!');
                return false;
            }
            if (!data.company_license_file && !settings?.company_license_file) {
                alert(lang === 'ar' ? 'يجب رفع رخصة النشاط للمتابعة!' : 'Activity License file is required!');
                return false;
            }
        } else if (currentStep === 3) {
            // تحقق من تعبئة مستخدمي الإدارة
            for (let i = 0; i < 3; i++) {
                const u = data.users[i];
                if (!u.name.trim() || !u.username.trim() || !u.phone.trim() || !u.email.trim() || !u.id_number.trim()) {
                    alert(lang === 'ar' ? `الرجاء إكمال كافة بيانات: ${u.job_title}!` : `Please complete all details for: ${u.job_title}!`);
                    return false;
                }
            }
        } else if (currentStep === 4) {
            if (!data.company_email.trim()) {
                alert(lang === 'ar' ? 'البريد الإلكتروني الرئيسي مطلوب!' : 'Primary Email address is required!');
                return false;
            }
        }
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 5));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const submit = (e) => {
        e.preventDefault();
        if (validateStep()) {
            post(route('tenant.store'));
        }
    };

    // Fetch existing contract settings from API on component mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (!response.ok) return;
                const settingsData = await response.json();
                // Merge fetched settings into form data (only if not already set)
                setData(prev => ({
                    ...prev,
                    ...settingsData,
                }));
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);


    return (
        <div className="min-h-screen bg-background flex flex-col text-text" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Head title={lang === 'ar' ? 'إعداد بيانات المنشأة وتأسيس النظام' : 'Company Setup Wizard'} />

            {/* شريط الملاحة العلوي الثابت - 56 بكسل */}
            <header className="h-[56px] bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                        <Building2 className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-text">
                        {lang === 'ar' ? 'مستودعاتك السحابية | Warehouse OS' : 'Warehouse OS Central'}
                    </span>
                </div>
                
                <button
                    type="button"
                    onClick={() => router.post(route('logout'))}
                    className="h-[36px] px-3.5 text-xs font-semibold text-text-muted hover:text-danger flex items-center gap-1.5 transition-all rounded-md hover:bg-danger/5 border border-transparent hover:border-danger/10"
                >
                    <LogOut className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'تسجيل الخروج' : 'Log out'}</span>
                </button>
            </header>

            {/* مساحة العمل الكلية */}
            <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 flex flex-col gap-6">
                
                {/* رأس الصفحة الفنية */}
                <div>
                    <h1 className="text-2xl font-semibold leading-8 text-text">
                        {lang === 'ar' ? 'تهيئة وإعداد بيانات المنشأة' : 'Establishment Setup Wizard'}
                    </h1>
                    <p className="text-sm text-text-muted mt-1">
                        {lang === 'ar' ? 'يرجى إدخال بيانات الهوية والمستندات القانونية لتأسيس موسم التشغيل وبدء العمل.' : 'Please configure your official identity and upload document records to activate the system.'}
                    </p>
                </div>

                {/* شريط مؤشر المراحل المنسق */}
                <div className="bg-surface border border-border rounded-lg p-4 shadow-sm">
                    <div className="relative flex items-center justify-between">
                        {/* خط الخلفية للمؤشر */}
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-border z-0"></div>
                        <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-primary transition-all duration-300 z-0"
                            style={{ 
                                width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                                right: lang === 'ar' ? 'auto' : undefined,
                                left: lang === 'ar' ? 0 : undefined
                            }}
                        ></div>

                        {steps.map((step) => {
                            const isCompleted = step.id < currentStep;
                            const isActive = step.id === currentStep;

                            return (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                    <div 
                                        className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 border ${
                                            isCompleted 
                                                ? 'bg-primary border-primary text-white' 
                                                : isActive 
                                                    ? 'bg-surface border-primary text-primary ring-4 ring-primary/10 shadow-sm' 
                                                    : 'bg-surface border-border text-text-muted'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                                    </div>
                                    <span 
                                        className={`text-[11px] font-semibold mt-2 text-center transition-all duration-300 whitespace-nowrap hidden sm:inline ${
                                            isActive ? 'text-primary font-bold' : isCompleted ? 'text-text' : 'text-text-muted'
                                        }`}
                                    >
                                        {step.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* بطاقة محتوى النموذج الرئيسي */}
                <form onSubmit={submit} className="bg-surface border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 md:p-8 flex-1 space-y-6">

                        {Object.keys(errors).length > 0 && (
                            <div className="p-4 bg-danger/10 border border-danger/20 rounded-md text-danger text-xs space-y-1 mb-4">
                                <div className="font-bold text-sm mb-1 flex items-center gap-1.5 text-danger">
                                    <span>⚠️</span>
                                    <span>{lang === 'ar' ? 'حدث خطأ في التحقق من البيانات. يرجى مراجعة الحقول التالية والتأكد من صحتها:' : 'Validation error occurred. Please review and correct the following fields:'}</span>
                                </div>
                                <ul className="list-disc list-inside pl-4 space-y-1 mt-2">
                                    {Object.entries(errors).map(([key, value]) => {
                                        let fieldLabel = key;
                                        if (key.startsWith('users.')) {
                                            const parts = key.split('.');
                                            const idx = parseInt(parts[1]) + 1;
                                            const field = parts[2];
                                            let arabicField = field;
                                            if (field === 'name') arabicField = 'الاسم الكامل';
                                            else if (field === 'email') arabicField = 'البريد الإلكتروني';
                                            else if (field === 'username') arabicField = 'اسم المستخدم';
                                            else if (field === 'phone') arabicField = 'رقم الهاتف';
                                            else if (field === 'id_number') arabicField = 'رقم الهوية/الإقامة';
                                            else if (field === 'password') arabicField = 'كلمة المرور';
                                            
                                            fieldLabel = lang === 'ar' 
                                                ? `الموظف ${idx} (${arabicField})` 
                                                : `Staff Member ${idx} (${field})`;
                                        } else {
                                            // Handle other fields
                                            let arabicField = key;
                                            if (key === 'company_name') arabicField = 'اسم المنشأة';
                                            else if (key === 'company_phone') arabicField = 'رقم هاتف المنشأة';
                                            else if (key === 'company_email') arabicField = 'البريد الإلكتروني للمنشأة';
                                            else if (key === 'company_cr') arabicField = 'السجل التجاري';
                                            else if (key === 'company_vat') arabicField = 'الرقم الضريبي';
                                            else if (key === 'company_address') arabicField = 'العنوان الوطني';
                                            else if (key === 'season_name_ar') arabicField = 'اسم الموسم بالعربية';
                                            else if (key === 'season_name_en') arabicField = 'اسم الموسم بالإنجليزية';
                                            else if (key === 'season_start') arabicField = 'تاريخ بداية الموسم';
                                            else if (key === 'season_end') arabicField = 'تاريخ نهاية الموسم';
                                            
                                            fieldLabel = lang === 'ar' ? arabicField : key;
                                        }
                                        return (
                                            <li key={key} className="font-semibold text-danger">
                                                <strong>{fieldLabel}:</strong> {value}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}

                        {/* ==================== المرحلة 1: البيانات العامة ==================== */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="border-b border-border pb-4">
                                    <h2 className="text-lg font-semibold leading-7 text-text">{lang === 'ar' ? 'الخطوة الأولى: الهوية العامة والتجاري للشركة' : 'Step 1: Company Profile Identity'}</h2>
                                    <p className="text-xs text-text-muted mt-1">{lang === 'ar' ? 'أدخل البيانات العامة للمنشأة لتعريف النظام وتخصيص التقارير.' : 'Specify the essential operational credentials for your brand.'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'اسم المنشأة *' : 'Company Name *'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm" 
                                            value={data.company_name} 
                                            onChange={e => setData('company_name', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.company_name} />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'النشاط / الشعار الوصفي' : 'Slogan / Business Activity'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm" 
                                            value={data.company_slogan} 
                                            onChange={e => setData('company_slogan', e.target.value)} 
                                            placeholder={lang === 'ar' ? 'مثال: تخزين - تبريد - تغليف' : 'e.g. Storage - Cold Chain'} 
                                        />
                                        <InputError message={errors.company_slogan} />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel value={lang === 'ar' ? 'رقم الهاتف الرئيسي للنشاط *' : 'Primary Phone Number *'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                            value={data.company_phone} 
                                            onChange={e => setData('company_phone', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.company_phone} />
                                    </div>

                                    {/* رفع شعار الشركة */}
                                    <div className="md:col-span-2 border border-border p-4 rounded-md bg-surface-muted/30 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-14 rounded-md bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                                                ) : (
                                                    <Building2 className="h-6 w-6 text-text-muted" />
                                                )}
                                            </div>
                                            <div>
                                                <InputLabel value={lang === 'ar' ? 'شعار المنشأة (Logo)' : 'Establishment Logo'} />
                                                <p className="text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? 'صيغة شفافة PNG أو JPG (الحد الأقصى 2 ميجابايت)' : 'Transparent PNG or JPG (Max 2MB)'}</p>
                                            </div>
                                        </div>
                                        <label className="cursor-pointer h-[36px] px-4 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold rounded-md border border-primary/20 flex items-center gap-2 transition-all shadow-sm">
                                            <Upload className="h-4 w-4" />
                                            <span>{lang === 'ar' ? 'اختر شعار' : 'Select Logo'}</span>
                                            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== المرحلة 2: ملفات الترخيص والتسجيل ==================== */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="border-b border-border pb-4">
                                    <h2 className="text-lg font-semibold leading-7 text-text">{lang === 'ar' ? 'الخطوة الثانية: السجلات الرسمية والتراخيص القانونية' : 'Step 2: Official Registrations & Licenses'}</h2>
                                    <p className="text-xs text-text-muted mt-1">{lang === 'ar' ? 'يرجى إدخال أرقام السجلات ورفع الأوراق الثبوتية الإلزامية لمطابقة القوانين.' : 'Configure legal license numbers and upload required certificates.'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'السجل التجاري *' : 'Commercial Registration *'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                            value={data.company_cr} 
                                            onChange={e => setData('company_cr', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.company_cr} />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'الرقم الضريبي (VAT) *' : 'VAT Registration Number *'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                            value={data.company_vat} 
                                            onChange={e => setData('company_vat', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.company_vat} />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'العنوان الوطني بالكامل *' : 'National Address *'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm" 
                                            value={data.company_address} 
                                            onChange={e => setData('company_address', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.company_address} />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'رقم ترخيص التخزين / النشاط' : 'Storage License Number'} />
                                        <TextInput 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                            value={data.company_license} 
                                            onChange={e => setData('company_license', e.target.value)} 
                                        />
                                        <InputError message={errors.company_license} />
                                    </div>
                                </div>

                                {/* قسم رفع المستندات الإلزامية والاختيارية */}
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-semibold text-text">{lang === 'ar' ? 'رفع المستندات والشهادات الرسمية' : 'Official Document Uploads'}</h3>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* 1. السجل التجاري */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border rounded-md bg-surface-muted/20 gap-3">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary shrink-0" />
                                                <div>
                                                    <span className="text-xs font-semibold text-text block">{lang === 'ar' ? 'شهادة السجل التجاري * (مطلوب)' : 'Commercial Registry Certificate *'}</span>
                                                    <span className="text-[10px] text-text-muted mt-0.5">{data.company_cr_file ? data.company_cr_file.name : (settings?.company_cr_file ? lang === 'ar' ? 'مرفوع مسبقاً' : 'Already Uploaded' : lang === 'ar' ? 'ولم يرفع أي ملف بعد' : 'No file uploaded yet')}</span>
                                                </div>
                                            </div>
                                            <label className="cursor-pointer h-[32px] px-3 bg-surface border border-border hover:bg-surface-muted text-xs text-text font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0">
                                                <Upload className="h-3.5 w-3.5" />
                                                <span>{lang === 'ar' ? 'رفع ملف' : 'Upload File'}</span>
                                                <input type="file" onChange={e => handleFileChange('company_cr_file', e.target.files[0])} className="hidden" />
                                            </label>
                                        </div>

                                        {/* 2. الرقم الضريبي */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border rounded-md bg-surface-muted/20 gap-3">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary shrink-0" />
                                                <div>
                                                    <span className="text-xs font-semibold text-text block">{lang === 'ar' ? 'شهادة التسجيل الضريبي * (مطلوب)' : 'VAT Certificate *'}</span>
                                                    <span className="text-[10px] text-text-muted mt-0.5">{data.company_vat_file ? data.company_vat_file.name : (settings?.company_vat_file ? lang === 'ar' ? 'مرفوع مسبقاً' : 'Already Uploaded' : lang === 'ar' ? 'ولم يرفع أي ملف بعد' : 'No file uploaded yet')}</span>
                                                </div>
                                            </div>
                                            <label className="cursor-pointer h-[32px] px-3 bg-surface border border-border hover:bg-surface-muted text-xs text-text font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0">
                                                <Upload className="h-3.5 w-3.5" />
                                                <span>{lang === 'ar' ? 'رفع ملف' : 'Upload File'}</span>
                                                <input type="file" onChange={e => handleFileChange('company_vat_file', e.target.files[0])} className="hidden" />
                                            </label>
                                        </div>

                                        {/* 3. رخصة النشاط */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border rounded-md bg-surface-muted/20 gap-3">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-5 w-5 text-primary shrink-0" />
                                                <div>
                                                    <span className="text-xs font-semibold text-text block">{lang === 'ar' ? 'رخصة البلدية / النشاط * (مطلوب)' : 'Activity License *'}</span>
                                                    <span className="text-[10px] text-text-muted mt-0.5">{data.company_license_file ? data.company_license_file.name : (settings?.company_license_file ? lang === 'ar' ? 'مرفوع مسبقاً' : 'Already Uploaded' : lang === 'ar' ? 'ولم يرفع أي ملف بعد' : 'No file uploaded yet')}</span>
                                                </div>
                                            </div>
                                            <label className="cursor-pointer h-[32px] px-3 bg-surface border border-border hover:bg-surface-muted text-xs text-text font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0">
                                                <Upload className="h-3.5 w-3.5" />
                                                <span>{lang === 'ar' ? 'رفع ملف' : 'Upload File'}</span>
                                                <input type="file" onChange={e => handleFileChange('company_license_file', e.target.files[0])} className="hidden" />
                                            </label>
                                        </div>
                                    </div>

                                    {/* المستندات الإضافية الاختيارية في قائمة سجلات */}
                                    <div className="space-y-3 mt-4 pt-4 border-t border-border">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-text">{lang === 'ar' ? 'مستندات وتراخيص إضافية (اختياري)' : 'Additional Documents (Optional)'}</span>
                                            <button 
                                                type="button" 
                                                onClick={addAdditionalFile}
                                                className="h-[28px] px-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-md flex items-center gap-1 transition-all"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                {lang === 'ar' ? 'إضافة مستند' : 'Add Doc'}
                                            </button>
                                        </div>

                                        {data.company_additional_files.length === 0 ? (
                                            <p className="text-xs text-text-muted italic bg-surface-muted/20 p-3 rounded-md border border-border text-center">
                                                {lang === 'ar' ? 'لم يتم إضافة مستندات إضافية حتى الآن.' : 'No additional documents added.'}
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {data.company_additional_files.map((doc, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-border rounded-md bg-white">
                                                        <input 
                                                            type="text" 
                                                            className="h-[32px] px-3 text-xs border border-border rounded-md flex-1 w-full"
                                                            placeholder={lang === 'ar' ? 'اسم المستند (مثال: رخصة الإطفاء)' : 'Document Name'}
                                                            value={doc.name}
                                                            onChange={e => handleAdditionalFileChange(idx, 'name', e.target.value)}
                                                            required
                                                        />
                                                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
                                                            <span className="text-[10px] text-text-muted truncate max-w-[120px]">{doc.file ? doc.file.name : (lang === 'ar' ? 'لا يوجد ملف' : 'No file')}</span>
                                                            <div className="flex items-center gap-2">
                                                                <label className="cursor-pointer h-[28px] px-2.5 bg-surface-muted hover:bg-border border border-border text-[10px] font-semibold text-text rounded-md flex items-center justify-center gap-1 transition-all">
                                                                    <Upload className="h-3 w-3" />
                                                                    <span>{lang === 'ar' ? 'ملف' : 'File'}</span>
                                                                    <input type="file" onChange={e => handleAdditionalFileChange(idx, 'file', e.target.files[0])} className="hidden" />
                                                                </label>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => removeAdditionalFile(idx)}
                                                                    className="h-[28px] w-[28px] flex items-center justify-center text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-md transition-all shrink-0"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== المرحلة 3: المستخدمين وجهات الاتصال ==================== */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="border-b border-border pb-4">
                                    <h2 className="text-lg font-semibold leading-7 text-text">{lang === 'ar' ? 'الخطوة الثالثة: تسجيل حسابات الكادر والمشرفين' : 'Step 3: Administrative & Staff Accounts'}</h2>
                                    <p className="text-xs text-text-muted mt-1">{lang === 'ar' ? 'قم بتسجيل وتفعيل حسابات المدراء ومستخدمي التطبيق وتعيين كلمات مرورهم.' : 'Establish official database user records for establishment staff.'}</p>
                                </div>

                                <div className="space-y-6">
                                    {data.users.map((user, idx) => (
                                        <div key={idx} className="border border-border p-4 rounded-md bg-white shadow-sm space-y-4 relative">
                                            {/* ترويسة بطاقة الموظف */}
                                            <div className="flex items-center justify-between border-b border-border pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6.5 w-6.5 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <UserPlus className="h-3.5 w-3.5 text-primary" />
                                                    </div>
                                                    <span className="text-xs font-bold text-primary">{user.job_title}</span>
                                                </div>
                                                
                                                {/* زر حذف للموظفين المضافين إضافياً فقط */}
                                                {idx >= 3 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeUser(idx)}
                                                        className="h-[26px] px-2 text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-md text-[10px] font-semibold flex items-center gap-1 transition-all"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        {lang === 'ar' ? 'إزالة' : 'Remove'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* حقول بطاقة الموظف */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'اسم الموظف بالكامل *' : 'Full Name *'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm" 
                                                        value={user.name} 
                                                        onChange={e => handleUserChange(idx, 'name', e.target.value)} 
                                                        required 
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'المسمى الوظيفي' : 'Job Title'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm" 
                                                        value={user.job_title} 
                                                        onChange={e => handleUserChange(idx, 'job_title', e.target.value)} 
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'اسم المستخدم للدخول *' : 'Username *'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                                        value={user.username} 
                                                        onChange={e => handleUserChange(idx, 'username', e.target.value)} 
                                                        required 
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'البريد الإلكتروني للدخول *' : 'Login Email *'} />
                                                    <TextInput 
                                                        type="email" 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                                        value={user.email} 
                                                        onChange={e => handleUserChange(idx, 'email', e.target.value)} 
                                                        required 
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'رقم الهوية الوطنية / الإقامة *' : 'National ID / Iqama *'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                                        value={user.id_number} 
                                                        onChange={e => handleUserChange(idx, 'id_number', e.target.value)} 
                                                        required 
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'رقم الجوال *' : 'Mobile Number *'} />
                                                    <TextInput 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                                        value={user.phone} 
                                                        onChange={e => handleUserChange(idx, 'phone', e.target.value)} 
                                                        required 
                                                    />
                                                </div>

                                                <div>
                                                    <InputLabel value={lang === 'ar' ? 'كلمة المرور للدخول *' : 'Access Password *'} />
                                                    <TextInput 
                                                        type="password" 
                                                        className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                                        placeholder="••••••••"
                                                        value={user.password} 
                                                        onChange={e => handleUserChange(idx, 'password', e.target.value)} 
                                                    />
                                                    <span className="text-[10px] text-text-muted mt-1 block">{lang === 'ar' ? 'اتركها فارغة لاستخدام الافتراضي admin123' : 'Leave empty to use default admin123'}</span>
                                                </div>

                                                {/* رفع الصورة الشخصية */}
                                                <div className="border border-border p-3 rounded-md bg-surface-muted/20 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                                            {user.avatar_preview ? (
                                                                <img src={user.avatar_preview} alt="Avatar" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="text-[11px] font-bold text-text-muted">IMG</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-[11px] font-semibold text-text block">{lang === 'ar' ? 'صورة شخصية (Logo)' : 'Personal Avatar'}</span>
                                                            <span className="text-[9px] text-text-muted block mt-0.5">{lang === 'ar' ? 'اختياري، حد أقصى 1 ميجا' : 'Optional, max 1MB'}</span>
                                                        </div>
                                                    </div>
                                                    <label className="cursor-pointer h-[26px] px-2.5 bg-surface border border-border hover:bg-surface-muted text-[10px] font-semibold text-text rounded-md flex items-center justify-center gap-1.5 transition-all">
                                                        <Upload className="h-3 w-3" />
                                                        <span>{lang === 'ar' ? 'صورة' : 'Select'}</span>
                                                        <input type="file" accept="image/*" onChange={e => handleUserAvatarChange(idx, e.target.files[0])} className="hidden" />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* زر إضافة موظفين إضافيين */}
                                    <div className="flex justify-start">
                                        <button 
                                            type="button" 
                                            onClick={addUser}
                                            className="h-[36px] px-4 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-md flex items-center gap-1.5 transition-all"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {lang === 'ar' ? 'إضافة موظف إضافي للشركة' : 'Add New Staff User'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== المرحلة 4: قنوات الاتصال ==================== */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="border-b border-border pb-4">
                                    <h2 className="text-lg font-semibold leading-7 text-text">{lang === 'ar' ? 'الخطوة الرابعة: قنوات الاتصال والتواصل الاجتماعي' : 'Step 4: Contact & Communication Channels'}</h2>
                                    <p className="text-xs text-text-muted mt-1">{lang === 'ar' ? 'أدخل البريد الإلكتروني الرسمي للمراسلات بالإضافة إلى أي قنوات اتصال إضافية.' : 'Provide direct customer support email and active channels.'}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'البريد الإلكتروني الرسمي للمنشأة *' : 'Primary Company Email *'} />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                                                <Mail className="h-4.5 w-4.5" />
                                            </div>
                                            <TextInput 
                                                type="email" 
                                                className="block w-full h-[38px] pr-10 pl-3 border border-border rounded-md text-sm font-mono" 
                                                value={data.company_email} 
                                                onChange={e => setData('company_email', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <InputError message={errors.company_email} />
                                    </div>

                                    {/* القنوات الإضافية مثل واتساب، فاكس، فرع */}
                                    <div className="space-y-3 pt-4 border-t border-border">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold text-text">{lang === 'ar' ? 'قنوات اتصال إضافية (اختياري)' : 'Additional Contact Records'}</span>
                                            <button 
                                                type="button" 
                                                onClick={addContactChannel}
                                                className="h-[28px] px-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-md flex items-center gap-1 transition-all"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                {lang === 'ar' ? 'إضافة قناة' : 'Add Channel'}
                                            </button>
                                        </div>

                                        {data.company_contacts.length === 0 ? (
                                            <p className="text-xs text-text-muted italic bg-surface-muted/20 p-3 rounded-md border border-border text-center">
                                                {lang === 'ar' ? 'لم تقم بإضافة قنوات إضافية بعد (مثل الواتساب أو الفاكس).' : 'No custom contacts added.'}
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {data.company_contacts.map((contact, idx) => (
                                                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 border border-border rounded-md bg-white">
                                                        <select 
                                                            className="h-[32px] px-2 text-xs border border-border rounded-md w-full sm:w-[150px] bg-white text-text font-medium"
                                                            value={contact.type}
                                                            onChange={e => handleContactChannelChange(idx, 'type', e.target.value)}
                                                        >
                                                            <option value="whatsapp">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</option>
                                                            <option value="fax">{lang === 'ar' ? 'فاكس' : 'Fax'}</option>
                                                            <option value="branch">{lang === 'ar' ? 'فرع إضافي' : 'Branch'}</option>
                                                            <option value="social">{lang === 'ar' ? 'شبكة اجتماعية' : 'Social Media'}</option>
                                                            <option value="other">{lang === 'ar' ? 'أخرى' : 'Other'}</option>
                                                        </select>

                                                        <input 
                                                            type="text" 
                                                            className="h-[32px] px-3 text-xs border border-border rounded-md w-full sm:w-[150px]"
                                                            placeholder={lang === 'ar' ? 'عنوان القناة (مثال: الإدارة)' : 'Label / Location'}
                                                            value={contact.label}
                                                            onChange={e => handleContactChannelChange(idx, 'label', e.target.value)}
                                                            required
                                                        />

                                                        <input 
                                                            type="text" 
                                                            className="h-[32px] px-3 text-xs border border-border rounded-md flex-1 w-full font-mono"
                                                            placeholder={lang === 'ar' ? 'رقم الاتصال أو الرابط' : 'Value / Number'}
                                                            value={contact.value}
                                                            onChange={e => handleContactChannelChange(idx, 'value', e.target.value)}
                                                            required
                                                        />

                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeContactChannel(idx)}
                                                            className="h-[28px] w-[28px] flex items-center justify-center text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-md transition-all shrink-0"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== المرحلة 5: موسم البداية ==================== */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div className="border-b border-border pb-4">
                                    <h2 className="text-lg font-semibold leading-7 text-text">{lang === 'ar' ? 'الخطوة الخامسة والأخيرة: موسم التأسيس والتشغيل الأول' : 'Step 5: Define First Active Operating Season'}</h2>
                                    <p className="text-xs text-text-muted mt-1">{lang === 'ar' ? 'لكي يعمل النظام بمرونة، يتطلب تحديد فترة عمل زمنية تسمى "موسم". أطلق موسمك الأول الآن.' : 'Set up your initial active season period to activate transactions.'}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'اسم الموسم بالعربية *' : 'Season Name (Arabic) *'} />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                                                <Calendar className="h-4.5 w-4.5" />
                                            </div>
                                            <TextInput 
                                                className="block w-full h-[38px] pr-10 pl-3 border border-border rounded-md text-sm" 
                                                value={data.season_name_ar} 
                                                onChange={e => setData('season_name_ar', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <InputError message={errors.season_name_ar} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'اسم الموسم بالإنجليزية *' : 'Season Name (English) *'} />
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-muted">
                                                <Calendar className="h-4.5 w-4.5" />
                                            </div>
                                            <TextInput 
                                                className="block w-full h-[38px] pr-10 pl-3 border border-border rounded-md text-sm font-mono" 
                                                value={data.season_name_en} 
                                                onChange={e => setData('season_name_en', e.target.value)} 
                                                required 
                                            />
                                        </div>
                                        <InputError message={errors.season_name_en} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'تاريخ بداية الموسم *' : 'Start Date *'} />
                                        <TextInput 
                                            type="date" 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                            value={data.season_start} 
                                            onChange={e => setData('season_start', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.season_start} className="mt-1" />
                                    </div>

                                    <div>
                                        <InputLabel value={lang === 'ar' ? 'تاريخ نهاية الموسم *' : 'End Date *'} />
                                        <TextInput 
                                            type="date" 
                                            className="mt-1 block w-full h-[38px] px-3 border border-border rounded-md text-sm font-mono" 
                                            value={data.season_end} 
                                            onChange={e => setData('season_end', e.target.value)} 
                                            required 
                                        />
                                        <InputError message={errors.season_end} className="mt-1" />
                                    </div>

                                    {/* تنويه الأمان */}
                                    <div className="md:col-span-2 border border-emerald-100 bg-emerald-50/40 p-4 rounded-md flex items-start gap-3">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                                        <div>
                                            <h4 className="text-xs font-bold text-emerald-800">{lang === 'ar' ? 'نظام الحسابات ومزامنة الفواتير جاهز' : 'Financials & Seasons Ready'}</h4>
                                            <p className="text-[11px] text-emerald-700 leading-relaxed mt-1">
                                                {lang === 'ar' ? 'بمجرد إنهاء التهيئة، سيقوم النظام تلقائياً بإنشاء هذا الموسم وضبطه كخلفية عمل أساسية لتنفيذ كافة حركات الاستلام وتأجير الطبالي وإصدار الفواتير بدون أي تعطيل.' : 'Upon onboarding completion, the warehouse engine will immediately hook up this season to calculate pallet rents.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* منطقة التحكم والتنقل السفلية */}
                    <div className="px-6 py-4 bg-surface-muted/30 border-t border-border flex items-center justify-between">
                        
                        {/* زر السابق */}
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={prevStep}
                                className="h-[36px] px-5 text-xs font-bold border border-border text-text hover:bg-surface-muted rounded-md flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <ArrowRight className={`h-4 w-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
                                <span>{lang === 'ar' ? 'السابق' : 'Previous'}</span>
                            </button>
                        ) : (
                            <div />
                        )}

                        {/* زر التالي / زر الحفظ */}
                        {currentStep < 5 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="h-[36px] px-5 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-md flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <span>{lang === 'ar' ? 'التالي' : 'Next'}</span>
                                <ArrowLeft className={`h-4 w-4 ${lang === 'ar' ? '' : 'rotate-180'}`} />
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing}
                                className="h-[36px] px-6 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-md flex items-center gap-1.5 transition-all shadow-lg shadow-primary/20 shrink-0"
                            >
                                <Save className="h-4 w-4" />
                                <span>{lang === 'ar' ? 'حفظ ومتابعة الدخول' : 'Save & Active System'}</span>
                            </button>
                        )}

                    </div>
                </form>

            </main>
        </div>
    );
}
