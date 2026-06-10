import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { ArrowRight, Package, Tag, Banknote, Calendar, BarChart3, Activity } from 'lucide-react';
import PageHeader from '@/Components/PageHeader';
import SecondaryButton from '@/Components/SecondaryButton';

export default function ServiceShow({ service, stats }) {
    const { lang } = useLang();

    const breadcrumbs = [
        { label: lang === 'ar' ? 'الرئيسية' : 'Home', href: route('dashboard') },
        { label: lang === 'ar' ? 'المبيعات' : 'Sales', href: '#' },
        { label: lang === 'ar' ? 'الأصناف والخدمات' : 'Items & Services', href: route('sales.services.index') },
        { label: lang === 'ar' ? service.name_ar : (service.name_en || service.name_ar) },
    ];

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={lang === 'ar' ? service.name_ar : (service.name_en || service.name_ar)} />
            
            <PageHeader 
                title={lang === 'ar' ? service.name_ar : (service.name_en || service.name_ar)} 
                description={service.category ? (lang === 'ar' ? `فئة: ${service.category.name_ar}` : `Category: ${service.category.name_en || service.category.name_ar}`) : ''}
                breadcrumbs={breadcrumbs}
                actions={
                    <SecondaryButton onClick={() => router.get(route('sales.services.index'))}>
                        <ArrowRight className="h-4 w-4 me-2 rtl:rotate-180" />
                        {lang === 'ar' ? 'عودة للقائمة' : 'Back to List'}
                    </SecondaryButton>
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-surface rounded-xl border border-border p-6 flex items-center gap-4 shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Activity className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">{lang === 'ar' ? 'إجمالي الاستخدام' : 'Total Usages'}</p>
                            <h3 className="text-2xl font-bold text-text">{stats.total_usages}</h3>
                        </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border p-6 flex items-center gap-4 shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Banknote className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">{lang === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
                            <h3 className="text-2xl font-bold text-text font-mono">
                                {parseFloat(stats.total_revenue).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl border border-border p-6 flex items-center gap-4 shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center shrink-0">
                            <Tag className="h-6 w-6 text-info" />
                        </div>
                        <div>
                            <p className="text-sm text-text-muted">{lang === 'ar' ? 'السعر الحالي' : 'Current Price'}</p>
                            <h3 className="text-2xl font-bold text-text font-mono">
                                {parseFloat(service.price).toFixed(2)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-surface-muted/30">
                        <h3 className="text-lg font-bold text-text flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            {lang === 'ar' ? 'بيانات الصنف / الخدمة' : 'Item / Service Details'}
                        </h3>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-text-muted">{lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</dt>
                                <dd className="mt-1 text-sm text-text">{service.name_ar}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-text-muted">{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</dt>
                                <dd className="mt-1 text-sm text-text">{service.name_en || '—'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-text-muted">{lang === 'ar' ? 'النوع' : 'Type'}</dt>
                                <dd className="mt-1 text-sm text-text">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-muted border border-border">
                                        {service.type === 'item' ? (lang === 'ar' ? 'صنف (عنصر ملموس)' : 'Item (Tangible)') : (lang === 'ar' ? 'خدمة (عمل)' : 'Service (Labor)')}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-text-muted">{lang === 'ar' ? 'الحالة' : 'Status'}</dt>
                                <dd className="mt-1 text-sm text-text">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${service.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                        {service.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                                    </span>
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-text-muted">{lang === 'ar' ? 'الوصف' : 'Description'}</dt>
                                <dd className="mt-1 text-sm text-text whitespace-pre-line">
                                    {service.description || (lang === 'ar' ? 'لا يوجد وصف.' : 'No description.')}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-text-muted flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {lang === 'ar' ? 'تاريخ الإضافة' : 'Created At'}
                                </dt>
                                <dd className="mt-1 text-sm text-text">{formatDate(service.created_at)}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-text-muted flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {lang === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                                </dt>
                                <dd className="mt-1 text-sm text-text">{formatDate(service.updated_at)}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
