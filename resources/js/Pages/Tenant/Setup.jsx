import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Building2, Save, Upload, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Setup({ settings }) {
    const { lang } = useLang();
    const { data, setData, post, processing, errors } = useForm({
        company_name: settings?.company_name || '',
        company_slogan: settings?.company_slogan || '',
        company_cr: settings?.company_cr || '',
        company_vat: settings?.company_vat || '',
        company_license: settings?.company_license || '',
        company_phone: settings?.company_phone || '',
        company_email: settings?.company_email || '',
        company_address: settings?.company_address || '',
        company_gm: settings?.company_gm || '',
        company_dgm: settings?.company_dgm || '',
        company_logo: null,
    });

    const [logoPreview, setLogoPreview] = useState(settings?.company_logo || null);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('company_logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('tenant.store'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-background flex items-center justify-center p-6 text-text" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <Head title={lang === 'ar' ? 'إعداد بيانات المنشأة (SaaS Onboarding)' : 'Company Profile Setup'} />

            <div className="w-full max-w-4xl bg-surface/80 backdrop-blur-xl border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                {/* Left/Right Branding Banner */}
                <div className="md:w-1/3 bg-gradient-to-br from-primary to-primary-dark p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 backdrop-filter backdrop-blur-[2px]"></div>
                    <div className="relative z-10 space-y-6">
                        <div className="h-16 w-16 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                            <Building2 className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
                                {lang === 'ar' ? 'مرحباً بك في مستودعاتك السحابية' : 'Welcome to Warehouse OS'}
                            </h2>
                            <p className="text-xs text-white/80 leading-relaxed font-light">
                                {lang === 'ar' ? 'قم بإعداد الهوية القانونية والتجارية لمنشأتك للبدء في استخدام النظام السحابي وإصدار العقود والفواتير المعتمدة.' : 'Configure your legal and commercial identity to start issuing certified contracts and invoices.'}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4 pt-8 border-t border-white/10 text-xs text-white/80">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>{lang === 'ar' ? 'ترويسة عقود وفواتير مخصصة' : 'Custom contract & invoice headers'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>{lang === 'ar' ? 'توافق تام مع متطلبات الضريبة والسجلات' : 'Full compliance with VAT & CR requirements'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>{lang === 'ar' ? 'إدارة مرنة ومتعددة المستأجرين (SaaS)' : 'Flexible multi-tenant management'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Area */}
                <div className="md:w-2/3 p-8 md:p-12 bg-surface flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between border-b border-border pb-6 mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-text">{lang === 'ar' ? 'إعداد بيانات المنشأة' : 'Establishment Details'}</h3>
                                <p className="text-xs text-text-muted mt-1">{lang === 'ar' ? 'الرجاء إكمال الحقول الأساسية للمتابعة إلى لوحة التحكم' : 'Please complete the required fields to access the dashboard'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.post(route('logout'))}
                                className="text-xs font-semibold text-text-muted hover:text-danger flex items-center gap-1.5 transition-colors px-3 py-2 rounded-lg hover:bg-danger/10"
                            >
                                <LogOut className="h-4 w-4" />
                                {lang === 'ar' ? 'تسجيل الخروج' : 'Log out'}
                            </button>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <InputLabel value={lang === 'ar' ? 'اسم المنشأة *' : 'Company Name *'} />
                                    <TextInput className="mt-1 block w-full" value={data.company_name} onChange={e => setData('company_name', e.target.value)} required />
                                    <InputError message={errors.company_name} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'النشاط / الشعار الوصفي' : 'Slogan / Activity'} />
                                    <TextInput className="mt-1 block w-full" value={data.company_slogan} onChange={e => setData('company_slogan', e.target.value)} placeholder={lang === 'ar' ? 'مثال: تخزين - تبريد - تغليف' : 'e.g. Storage - Packaging'} />
                                    <InputError message={errors.company_slogan} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'سجل تجاري *' : 'Commercial Registration *'} />
                                    <TextInput className="mt-1 block w-full font-mono" value={data.company_cr} onChange={e => setData('company_cr', e.target.value)} required />
                                    <InputError message={errors.company_cr} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'الرقم الضريبي *' : 'VAT Number *'} />
                                    <TextInput className="mt-1 block w-full font-mono" value={data.company_vat} onChange={e => setData('company_vat', e.target.value)} required />
                                    <InputError message={errors.company_vat} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'رقم ترخيص التخزين' : 'License Number'} />
                                    <TextInput className="mt-1 block w-full font-mono" value={data.company_license} onChange={e => setData('company_license', e.target.value)} />
                                    <InputError message={errors.company_license} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'رقم الهاتف / الجوال *' : 'Phone Number *'} />
                                    <TextInput className="mt-1 block w-full font-mono" value={data.company_phone} onChange={e => setData('company_phone', e.target.value)} required />
                                    <InputError message={errors.company_phone} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'} />
                                    <TextInput type="email" className="mt-1 block w-full font-mono" value={data.company_email} onChange={e => setData('company_email', e.target.value)} required />
                                    <InputError message={errors.company_email} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'العنوان الوطني *' : 'National Address *'} />
                                    <TextInput className="mt-1 block w-full" value={data.company_address} onChange={e => setData('company_address', e.target.value)} required />
                                    <InputError message={errors.company_address} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'المدير العام (الممثل النظامي) *' : 'General Manager *'} />
                                    <TextInput className="mt-1 block w-full" value={data.company_gm} onChange={e => setData('company_gm', e.target.value)} required />
                                    <InputError message={errors.company_gm} />
                                </div>

                                <div>
                                    <InputLabel value={lang === 'ar' ? 'نائب المدير العام' : 'Deputy GM'} />
                                    <TextInput className="mt-1 block w-full" value={data.company_dgm} onChange={e => setData('company_dgm', e.target.value)} />
                                    <InputError message={errors.company_dgm} />
                                </div>

                                <div className="md:col-span-2 border border-border p-4 rounded-2xl bg-surface-muted/30 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain" />
                                            ) : (
                                                <Building2 className="h-6 w-6 text-text-muted" />
                                            )}
                                        </div>
                                        <div>
                                            <InputLabel value={lang === 'ar' ? 'شعار المنشأة (Logo)' : 'Company Logo'} />
                                            <p className="text-[11px] text-text-muted mt-0.5">{lang === 'ar' ? 'صيغة شفافة PNG أو JPG (الحد الأقصى 2 ميجابايت)' : 'Transparent PNG or JPG (Max 2MB)'}</p>
                                        </div>
                                    </div>
                                    <label className="cursor-pointer px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl border border-primary/20 flex items-center gap-2 transition-all shadow-sm">
                                        <Upload className="h-4 w-4" />
                                        <span>{lang === 'ar' ? 'اختر ملف' : 'Choose File'}</span>
                                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-border flex justify-end">
                                <PrimaryButton disabled={processing} className="px-8 py-3 text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                                    <span>{lang === 'ar' ? 'حفظ ومتابعة الدخول' : 'Save & Continue'}</span>
                                    <ArrowRight className={`h-4 w-4 ms-2 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
