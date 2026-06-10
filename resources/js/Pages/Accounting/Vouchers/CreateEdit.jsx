import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Save, ArrowRight, Receipt, FileText } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

export default function VouchersCreateEdit({ accounts, customers, voucher }) {
    const { lang } = useLang();
    const isEdit = !!voucher;

    const { data, setData, post, put, processing, errors } = useForm({
        type: voucher?.type || 'receipt',
        date: voucher?.date ? new Date(voucher.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        amount: voucher?.amount || '',
        primary_account_id: voucher?.primary_account_id || '',
        counter_account_id: voucher?.counter_account_id || '',
        reference: voucher?.reference || '',
        description: voucher?.description || '',
        customer_id: voucher?.customer_id || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('accounting.financial-vouchers.update', voucher.id));
        } else {
            post(route('accounting.financial-vouchers.store'));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('accounting.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'الحسابات' : 'Accounting'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('accounting.financial-vouchers.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'السندات المالية' : 'Financial Vouchers'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">
                {isEdit ? (lang === 'ar' ? 'تعديل السند' : 'Edit Voucher') : (lang === 'ar' ? 'سند جديد' : 'New Voucher')}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={isEdit ? (lang === 'ar' ? 'تعديل السند' : 'Edit Voucher') : (lang === 'ar' ? 'سند جديد' : 'New Voucher')} />

            <div className="max-w-4xl mx-auto pb-8 flex flex-col gap-4 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-4 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">
                                {isEdit ? (lang === 'ar' ? `تعديل السند: ${voucher.voucher_number}` : `Edit Voucher: ${voucher.voucher_number}`) : (lang === 'ar' ? 'إنشاء سند مالي جديد' : 'Create New Financial Voucher')}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'أدخل تفاصيل السند المحاسبي أدناه' : 'Enter the accounting voucher details below'}
                            </p>
                        </div>
                    </div>
                    <SecondaryButton onClick={() => window.history.back()} className="flex items-center gap-2">
                        <ArrowRight className={lang === 'ar' ? 'h-4 w-4' : 'h-4 w-4 rotate-180'} />
                        {lang === 'ar' ? 'عودة' : 'Back'}
                    </SecondaryButton>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-surface border border-border shadow-sm rounded-xl p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-1">
                            <InputLabel htmlFor="type" value={lang === 'ar' ? 'نوع السند' : 'Voucher Type'} required />
                            <select
                                id="type"
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5"
                                value={data.type}
                                onChange={e => setData('type', e.target.value)}
                                required
                            >
                                <option value="receipt">{lang === 'ar' ? 'سند قبض' : 'Receipt Voucher'}</option>
                                <option value="payment">{lang === 'ar' ? 'سند صرف' : 'Payment Voucher'}</option>
                            </select>
                            <InputError message={errors.type} />
                        </div>

                        <div className="space-y-1">
                            <InputLabel htmlFor="date" value={lang === 'ar' ? 'تاريخ السند' : 'Voucher Date'} required />
                            <TextInput
                                id="date"
                                type="date"
                                className="w-full text-sm p-2.5"
                                value={data.date}
                                onChange={e => setData('date', e.target.value)}
                                required
                            />
                            <InputError message={errors.date} />
                        </div>

                        <div className="space-y-1">
                            <InputLabel htmlFor="amount" value={lang === 'ar' ? 'المبلغ' : 'Amount'} required />
                            <TextInput
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                className="w-full text-sm p-2.5"
                                value={data.amount}
                                onChange={e => setData('amount', e.target.value)}
                                required
                            />
                            <InputError message={errors.amount} />
                        </div>

                        <div className="space-y-1">
                            <InputLabel htmlFor="reference" value={lang === 'ar' ? 'المرجع (رقم الشيك، حوالة...)' : 'Reference'} />
                            <TextInput
                                id="reference"
                                type="text"
                                className="w-full text-sm p-2.5"
                                value={data.reference}
                                onChange={e => setData('reference', e.target.value)}
                            />
                            <InputError message={errors.reference} />
                        </div>

                        {/* Account Selection */}
                        <div className="space-y-1 md:col-span-2 pt-4 border-t border-border">
                            <h3 className="text-lg font-bold text-text mb-2">
                                {lang === 'ar' ? 'توجيه السند (Accounts)' : 'Voucher Accounts'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <InputLabel 
                                        htmlFor="primary_account_id" 
                                        value={data.type === 'receipt' 
                                            ? (lang === 'ar' ? 'مستلم في (حساب الخزينة/البنك)' : 'Received in (Cash/Bank Account)')
                                            : (lang === 'ar' ? 'مدفوع من (حساب الخزينة/البنك)' : 'Paid from (Cash/Bank Account)')} 
                                        required 
                                    />
                                    <select
                                        id="primary_account_id"
                                        className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5"
                                        value={data.primary_account_id}
                                        onChange={e => setData('primary_account_id', e.target.value)}
                                        required
                                    >
                                        <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                        {accounts.filter(a => a.type === 'asset' || a.type === 'liability').map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.primary_account_id} />
                                </div>

                                <div className="space-y-1">
                                    <InputLabel 
                                        htmlFor="counter_account_id" 
                                        value={data.type === 'receipt' 
                                            ? (lang === 'ar' ? 'مستلم من (حساب الإيراد/العميل)' : 'Received from (Revenue/Customer Account)')
                                            : (lang === 'ar' ? 'مدفوع لـ (حساب المصروف/المورد)' : 'Paid to (Expense/Vendor Account)')} 
                                        required 
                                    />
                                    <select
                                        id="counter_account_id"
                                        className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5"
                                        value={data.counter_account_id}
                                        onChange={e => setData('counter_account_id', e.target.value)}
                                        required
                                    >
                                        <option value="">{lang === 'ar' ? 'اختر الحساب...' : 'Select Account...'}</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {lang === 'ar' ? acc.name_ar : (acc.name_en || acc.name_ar)}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.counter_account_id} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1 md:col-span-2 pt-4 border-t border-border">
                            <InputLabel htmlFor="description" value={lang === 'ar' ? 'البيان (Description)' : 'Description'} required />
                            <textarea
                                id="description"
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5 min-h-[100px]"
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                required
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <InputLabel htmlFor="customer_id" value={lang === 'ar' ? 'ربط بعميل (اختياري)' : 'Link to Customer (Optional)'} />
                            <select
                                id="customer_id"
                                className="block w-full border border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm p-2.5"
                                value={data.customer_id}
                                onChange={e => setData('customer_id', e.target.value)}
                            >
                                <option value="">{lang === 'ar' ? 'بدون ربط...' : 'No customer link...'}</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.customer_id} />
                        </div>

                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                        <SecondaryButton type="button" onClick={() => window.history.back()}>
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {lang === 'ar' ? 'حفظ السند كمسودة' : 'Save Draft Voucher'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
