import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Save, Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SelectInput from '@/Components/SelectInput';
import TextArea from '@/Components/TextArea';

export default function CreateEditInvoice({ invoice, customers, accounts }) {
    const { lang } = useLang();
    const isEdit = !!invoice;
    
    const [form, setForm] = useState({
        customer_id: invoice?.customer_id || '',
        date: invoice?.date ? new Date(invoice.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: invoice?.notes || '',
        lines: invoice?.lines?.length > 0 ? invoice.lines.map(l => ({
            id: l.id,
            description: l.description,
            account_id: l.account_id,
            quantity: l.quantity,
            unit_price: l.unit_price,
            tax_rate: l.tax_rate
        })) : [
            { id: Date.now(), description: '', account_id: '', quantity: 1, unit_price: 0, tax_rate: 15 } // 15% VAT default in ME
        ]
    });
    
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    const handleAddLine = () => {
        setForm(prev => ({
            ...prev,
            lines: [...prev.lines, { id: Date.now(), description: '', account_id: '', quantity: 1, unit_price: 0, tax_rate: 15 }]
        }));
    };

    const handleRemoveLine = (index) => {
        if (form.lines.length === 1) return;
        setForm(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index)
        }));
    };

    const handleLineChange = (index, field, value) => {
        setForm(prev => {
            const newLines = [...prev.lines];
            newLines[index] = { ...newLines[index], [field]: value };
            return { ...prev, lines: newLines };
        });
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let tax = 0;
        form.lines.forEach(line => {
            const qty = parseFloat(line.quantity) || 0;
            const price = parseFloat(line.unit_price) || 0;
            const rate = parseFloat(line.tax_rate) || 0;
            const lineSub = qty * price;
            const lineTax = lineSub * (rate / 100);
            subtotal += lineSub;
            tax += lineTax;
        });
        return { subtotal, tax, total: subtotal + tax };
    };

    const totals = calculateTotals();

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        if (isEdit) {
            router.put(route('sales.invoices.update', invoice.id), form, {
                onError: (errs) => { setErrors(errs); setProcessing(false); },
            });
        } else {
            router.post(route('sales.invoices.store'), form, {
                onError: (errs) => { setErrors(errs); setProcessing(false); },
            });
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <Link href={route('sales.invoices.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'فواتير المبيعات' : 'Sales Invoices'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">
                {isEdit ? (lang === 'ar' ? 'تعديل فاتورة' : 'Edit Invoice') : (lang === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create New Invoice')}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={isEdit ? (lang === 'ar' ? 'تعديل فاتورة' : 'Edit Invoice') : (lang === 'ar' ? 'فاتورة جديدة' : 'New Invoice')} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-6 mt-4 px-4 sm:px-6 lg:px-8">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text">
                            {isEdit ? (lang === 'ar' ? `تعديل فاتورة رقم ${invoice.invoice_number}` : `Edit Invoice ${invoice.invoice_number}`) : (lang === 'ar' ? 'فاتورة جديدة' : 'New Invoice')}
                        </h1>
                    </div>
                    <SecondaryButton onClick={() => router.get(route('sales.invoices.index'))}>
                        {lang === 'ar' ? <ArrowRight className="h-4 w-4 ml-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
                        {lang === 'ar' ? 'عودة للفواتير' : 'Back to Invoices'}
                    </SecondaryButton>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {/* Header Details */}
                    <div className="bg-surface border border-border shadow-sm rounded-xl p-6">
                        <h3 className="text-lg font-bold text-text mb-4 border-b border-border pb-2">
                            {lang === 'ar' ? 'البيانات الأساسية' : 'Basic Details'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <InputLabel value={lang === 'ar' ? 'العميل' : 'Customer'} required />
                                <SelectInput
                                    className="w-full mt-1"
                                    value={form.customer_id}
                                    onChange={(e) => setForm({...form, customer_id: e.target.value})}
                                    required
                                >
                                    <option value="">{lang === 'ar' ? 'اختر العميل...' : 'Select Customer...'}</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </SelectInput>
                                <InputError message={errors.customer_id} className="mt-1" />
                            </div>
                            
                            <div>
                                <InputLabel value={lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'} required />
                                <TextInput
                                    type="date"
                                    className="w-full mt-1"
                                    value={form.date}
                                    onChange={(e) => setForm({...form, date: e.target.value})}
                                    required
                                />
                                <InputError message={errors.date} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel value={lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'} required />
                                <TextInput
                                    type="date"
                                    className="w-full mt-1"
                                    value={form.due_date}
                                    onChange={(e) => setForm({...form, due_date: e.target.value})}
                                    required
                                />
                                <InputError message={errors.due_date} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Lines */}
                    <div className="bg-surface border border-border shadow-sm rounded-xl p-6 overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                            <h3 className="text-lg font-bold text-text">
                                {lang === 'ar' ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                            </h3>
                            <SecondaryButton type="button" onClick={handleAddLine} className="text-xs h-8">
                                <Plus className="h-4 w-4 mr-1" /> {lang === 'ar' ? 'إضافة بند' : 'Add Line'}
                            </SecondaryButton>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead>
                                    <tr>
                                        <th className="px-2 py-2 text-start text-xs font-semibold text-text-muted uppercase w-[30%]">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                                        <th className="px-2 py-2 text-start text-xs font-semibold text-text-muted uppercase w-[25%]">{lang === 'ar' ? 'حساب الإيراد' : 'Revenue Account'}</th>
                                        <th className="px-2 py-2 text-center text-xs font-semibold text-text-muted uppercase w-[10%]">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                                        <th className="px-2 py-2 text-center text-xs font-semibold text-text-muted uppercase w-[10%]">{lang === 'ar' ? 'السعر' : 'Unit Price'}</th>
                                        <th className="px-2 py-2 text-center text-xs font-semibold text-text-muted uppercase w-[10%]">{lang === 'ar' ? 'ضريبة %' : 'Tax %'}</th>
                                        <th className="px-2 py-2 text-end text-xs font-semibold text-text-muted uppercase w-[10%]">{lang === 'ar' ? 'الإجمالي' : 'Total'}</th>
                                        <th className="px-2 py-2 w-[5%]"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {form.lines.map((line, index) => (
                                        <tr key={line.id}>
                                            <td className="px-2 py-3">
                                                <TextInput
                                                    className="w-full text-sm"
                                                    placeholder={lang === 'ar' ? 'وصف البند...' : 'Description...'}
                                                    value={line.description}
                                                    onChange={e => handleLineChange(index, 'description', e.target.value)}
                                                    required
                                                />
                                                {errors[`lines.${index}.description`] && <p className="text-danger text-xs mt-1">{errors[`lines.${index}.description`]}</p>}
                                            </td>
                                            <td className="px-2 py-3">
                                                <SelectInput
                                                    className="w-full text-sm"
                                                    value={line.account_id}
                                                    onChange={e => handleLineChange(index, 'account_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">{lang === 'ar' ? 'اختر حساب...' : 'Select Account...'}</option>
                                                    {accounts.map(a => (
                                                        <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                                    ))}
                                                </SelectInput>
                                                {errors[`lines.${index}.account_id`] && <p className="text-danger text-xs mt-1">{errors[`lines.${index}.account_id`]}</p>}
                                            </td>
                                            <td className="px-2 py-3">
                                                <TextInput
                                                    type="number"
                                                    min="0.01" step="0.01"
                                                    className="w-full text-center text-sm"
                                                    value={line.quantity}
                                                    onChange={e => handleLineChange(index, 'quantity', e.target.value)}
                                                    required
                                                />
                                                {errors[`lines.${index}.quantity`] && <p className="text-danger text-xs mt-1">{errors[`lines.${index}.quantity`]}</p>}
                                            </td>
                                            <td className="px-2 py-3">
                                                <TextInput
                                                    type="number"
                                                    min="0" step="0.01"
                                                    className="w-full text-center text-sm"
                                                    value={line.unit_price}
                                                    onChange={e => handleLineChange(index, 'unit_price', e.target.value)}
                                                    required
                                                />
                                                {errors[`lines.${index}.unit_price`] && <p className="text-danger text-xs mt-1">{errors[`lines.${index}.unit_price`]}</p>}
                                            </td>
                                            <td className="px-2 py-3">
                                                <TextInput
                                                    type="number"
                                                    min="0" step="1"
                                                    className="w-full text-center text-sm"
                                                    value={line.tax_rate}
                                                    onChange={e => handleLineChange(index, 'tax_rate', e.target.value)}
                                                    required
                                                />
                                            </td>
                                            <td className="px-2 py-3 text-end font-bold text-text text-sm" dir="ltr">
                                                {((parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0) * (1 + (parseFloat(line.tax_rate) || 0) / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-2 py-3 text-center">
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveLine(index)}
                                                    disabled={form.lines.length === 1}
                                                    className="p-1.5 text-text-muted hover:text-danger rounded-md disabled:opacity-30 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Box */}
                        <div className="mt-6 flex justify-end">
                            <div className="bg-surface-muted/50 rounded-xl p-4 w-full md:w-64">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-text-muted">{lang === 'ar' ? 'الإجمالي قبل الضريبة:' : 'Subtotal:'}</span>
                                    <span className="font-semibold text-text" dir="ltr">{totals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                                    <span className="text-sm text-text-muted">{lang === 'ar' ? 'قيمة الضريبة:' : 'VAT Amount:'}</span>
                                    <span className="font-semibold text-text" dir="ltr">{totals.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-text">{lang === 'ar' ? 'الإجمالي الصافي:' : 'Total Amount:'}</span>
                                    <span className="font-bold text-primary text-lg" dir="ltr">{totals.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface border border-border shadow-sm rounded-xl p-6">
                        <InputLabel value={lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'} />
                        <TextArea
                            className="w-full mt-1"
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm({...form, notes: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-2">
                        <SecondaryButton type="button" onClick={() => router.get(route('sales.invoices.index'))}>
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing} className="min-w-[120px]">
                            <Save className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                            {processing ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (lang === 'ar' ? 'حفظ الفاتورة' : 'Save Invoice')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
