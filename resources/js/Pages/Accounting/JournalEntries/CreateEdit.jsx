import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Home, ChevronRight, Plus, Trash2, Save, X, CheckCircle, Copy, Search, Loader2, BookOpen } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SearchableSelect from '@/Components/SearchableSelect';
import Tooltip from '@/Components/Tooltip';
import axios from 'axios';

export default function JournalEntryCreate({ accounts, entry, lines: initialLines }) {
    const { lang } = useLang();
    
    const [entryId, setEntryId] = useState(entry?.id || null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    const [data, setData] = useState({
        date: entry?.date ? new Date(entry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        description: entry?.description || '',
        lines: initialLines && initialLines.length > 0 ? initialLines.map(l => ({...l, _key: l.id || Math.random().toString()})) : [
            { _key: 'new-1', account_id: '', description: '', debit: '', credit: '' },
            { _key: 'new-2', account_id: '', description: '', debit: '', credit: '' }
        ]
    });

    // Autocomplete states per row
    const [searchQueries, setSearchQueries] = useState({});
    const [activeRowIndex, setActiveRowIndex] = useState(null);
    const autocompleteRefs = useRef({});

    const [totals, setTotals] = useState({ debit: 0, credit: 0, difference: 0 });

    useEffect(() => {
        let totalDebit = 0;
        let totalCredit = 0;
        
        data.lines.forEach(line => {
            totalDebit += parseFloat(line.debit) || 0;
            totalCredit += parseFloat(line.credit) || 0;
        });
        
        setTotals({
            debit: totalDebit,
            credit: totalCredit,
            difference: Math.abs(totalDebit - totalCredit)
        });
    }, [data.lines]);

    // Handle clicking outside autocomplete
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeRowIndex !== null && autocompleteRefs.current[activeRowIndex] && !autocompleteRefs.current[activeRowIndex].contains(event.target)) {
                setActiveRowIndex(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeRowIndex]);

    const addLineBelow = (index) => {
        const newLines = [...data.lines];
        newLines.splice(index + 1, 0, { _key: `new-${Date.now()}`, account_id: '', description: '', debit: '', credit: '' });
        setData({ ...data, lines: newLines });
    };

    const copyLine = (index) => {
        const newLines = [...data.lines];
        const lineToCopy = { ...newLines[index], _key: `copy-${Date.now()}` };
        newLines.splice(index + 1, 0, lineToCopy);
        setData({ ...data, lines: newLines });
        handleAutoSave({ ...data, lines: newLines });
    };

    const removeLine = (index) => {
        if (data.lines.length <= 2) return;
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData({ ...data, lines: newLines });
        handleAutoSave({ ...data, lines: newLines });
    };

    const updateLine = (index, field, value) => {
        const newLines = [...data.lines];
        
        if (field === 'debit' && value && parseFloat(value) > 0) {
            newLines[index]['credit'] = '';
        } else if (field === 'credit' && value && parseFloat(value) > 0) {
            newLines[index]['debit'] = '';
        }
        
        newLines[index][field] = value;
        setData({ ...data, lines: newLines });
    };

    const handleAutoSave = async (payloadData = data) => {
        if (!payloadData.date || !payloadData.description) return;
        
        setIsSaving(true);
        const payload = {
            ...payloadData,
            action: 'draft',
            is_auto_save: true
        };

        try {
            if (entryId) {
                await axios.put(route('accounting.journal-entries.update', entryId), payload);
                setLastSaved(new Date());
                setValidationErrors({});
            } else {
                const res = await axios.post(route('accounting.journal-entries.store'), payload);
                if (res.data.entry && res.data.entry.id) {
                    setEntryId(res.data.entry.id);
                    setLastSaved(new Date());
                    setValidationErrors({});
                    window.history.replaceState(null, '', route('accounting.journal-entries.edit', res.data.entry.id));
                }
            }
        } catch (err) {
            if (err.response && err.response.data.errors) {
                setValidationErrors(err.response.data.errors);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const submit = (actionType) => {
        const isPost = actionType === 'post';
        if (isPost && (!isBalanced || totals.debit === 0)) {
            alert(lang === 'ar' ? 'لا يمكن ترحيل قيد غير متزن أو فارغ' : 'Cannot post an unbalanced or empty entry');
            return;
        }

        const payload = { ...data, action: actionType };
        
        if (entryId) {
            router.put(route('accounting.journal-entries.update', entryId), payload);
        } else {
            router.post(route('accounting.journal-entries.store'), payload);
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
            <Link href={route('accounting.journal-entries.index')} className="text-text hover:text-primary transition-colors">
                {lang === 'ar' ? 'القيود اليومية' : 'Journal Entries'}
            </Link>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{entryId ? (lang === 'ar' ? 'تعديل قيد' : 'Edit Entry') : (lang === 'ar' ? 'إنشاء قيد' : 'Create Entry')}</span>
        </div>
    );

    const isBalanced = totals.difference < 0.01 && totals.debit > 0;

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={entryId ? (lang === 'ar' ? 'تعديل قيد' : 'Edit Entry') : (lang === 'ar' ? 'إنشاء قيد' : 'Create Entry')} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                                {entryId ? (lang === 'ar' ? 'تعديل مسودة القيد' : 'Edit Draft Entry') : (lang === 'ar' ? 'إنشاء قيد يومية' : 'Create Journal Entry')}
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin text-text-muted" />}
                                {lastSaved && !isSaving && <span className="text-xs text-text-muted font-normal">({lang === 'ar' ? 'تم الحفظ تلقائياً' : 'Saved'} {lastSaved.toLocaleTimeString()})</span>}
                            </h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'تأكد من توازن القيد قبل الترحيل' : 'Ensure the entry is balanced before posting'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tooltip content={lang === 'ar' ? 'إلغاء ورجوع' : 'Cancel & Back'}>
                            <SecondaryButton type="button" onClick={() => window.history.back()} className="h-9 w-9 !p-0 flex items-center justify-center flex-shrink-0">
                                <X className="h-4 w-4" />
                            </SecondaryButton>
                        </Tooltip>
                        <Tooltip content={lang === 'ar' ? 'حفظ مسودة' : 'Save Draft'}>
                            <SecondaryButton type="button" onClick={() => submit('draft')} disabled={isSaving} className="h-9 w-9 !p-0 flex items-center justify-center flex-shrink-0">
                                <Save className="h-4 w-4" />
                            </SecondaryButton>
                        </Tooltip>
                        <Tooltip content={lang === 'ar' ? 'حفظ وترحيل' : 'Save & Post'}>
                            <PrimaryButton type="button" onClick={() => submit('post')} disabled={!isBalanced || isSaving} className="bg-emerald-600 hover:bg-emerald-700 h-9 w-9 !p-0 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-4 w-4" />
                            </PrimaryButton>
                        </Tooltip>
                    </div>
                </div>

                {/* Header Info */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'التاريخ والوقت *' : 'Date & Time *'} />
                            <TextInput 
                                type="datetime-local"
                                className="mt-1 w-full h-[30px] text-xs" 
                                value={data.date.length === 10 ? `${data.date}T12:00` : data.date} 
                                onChange={e => setData({...data, date: e.target.value})} 
                                onBlur={() => handleAutoSave()}
                                required 
                            />
                            {validationErrors.date && <InputError message={validationErrors.date[0]} className="mt-1" />}
                        </div>
                        
                        <div>
                            <InputLabel value={lang === 'ar' ? 'البيان (شرح القيد) *' : 'Description *'} />
                            <TextInput 
                                className="mt-1 w-full h-[30px] text-xs" 
                                value={data.description} 
                                onChange={e => setData({...data, description: e.target.value})} 
                                onBlur={() => handleAutoSave()}
                                required 
                            />
                            {validationErrors.description && <InputError message={validationErrors.description[0]} className="mt-1" />}
                        </div>
                    </div>
                </div>

                {/* Entry Lines */}
                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden pb-[200px]">
                    <div className="p-4 border-b border-border bg-surface-muted/30">
                        <h2 className="text-lg font-bold text-text">
                            {lang === 'ar' ? 'أطراف القيد' : 'Entry Lines'}
                        </h2>
                    </div>
                    
                    {validationErrors.lines && <div className="p-3 bg-danger/10 text-danger text-sm border-b border-danger/20">{validationErrors.lines[0]}</div>}
                    
                    <div className="overflow-visible">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-surface-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase w-10">#</th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase w-1/3">{lang === 'ar' ? 'الحساب' : 'Account'}</th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase">{lang === 'ar' ? 'البيان' : 'Description'}</th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase w-32">{lang === 'ar' ? 'مدين' : 'Debit'}</th>
                                    <th className="px-4 py-3 text-start text-xs font-semibold text-text-muted uppercase w-32">{lang === 'ar' ? 'دائن' : 'Credit'}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-text-muted uppercase w-32">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-surface">
                                {data.lines.map((line, index) => {
                                    const acc = accounts.find(a => a.id == line.account_id);
                                    
                                    return (
                                        <tr key={line._key} className="hover:bg-surface-muted/10 transition-colors">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-text-muted">
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-2">
                                                <SearchableSelect
                                                    items={accounts}
                                                    value={line.account_id}
                                                    onChange={(selectedAccount) => {
                                                        updateLine(index, 'account_id', selectedAccount ? selectedAccount.id : '');
                                                        // Using setTimeout to allow state update before auto saving
                                                        setTimeout(() => handleAutoSave(), 0);
                                                    }}
                                                    placeholder={lang === 'ar' ? 'ابحث عن الحساب...' : 'Search account...'}
                                                    searchKeys={['code', 'name_ar', 'name_en']}
                                                    displayFormat={(account) => `${account.code} - ${lang === 'ar' ? account.name_ar : account.name_en}`}
                                                    valueKey="id"
                                                    className="h-[30px] text-xs"
                                                    error={validationErrors[`lines.${index}.account_id`] ? validationErrors[`lines.${index}.account_id`][0] : ''}
                                                    renderOption={(account, isActive) => (
                                                        <>
                                                            <div className={`font-mono font-medium ${isActive ? 'text-white' : ''}`}>{account.code}</div>
                                                            <div className={`text-xs ${isActive ? 'text-white/80' : 'text-text-muted'}`}>{lang === 'ar' ? account.name_ar : account.name_en}</div>
                                                        </>
                                                    )}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <TextInput 
                                                    className="w-full h-[30px] py-1 text-xs" 
                                                    placeholder={data.description}
                                                    value={line.description} 
                                                    onChange={e => updateLine(index, 'description', e.target.value)} 
                                                    onBlur={() => handleAutoSave()}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <TextInput 
                                                    type="number" 
                                                    step="0.01" 
                                                    min="0"
                                                    className={`w-full h-[30px] py-1 text-xs font-mono text-end ${validationErrors[`lines.${index}.debit`] ? 'border-danger' : ''}`} 
                                                    value={line.debit} 
                                                    onChange={e => updateLine(index, 'debit', e.target.value)} 
                                                    onBlur={() => handleAutoSave()}
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <TextInput 
                                                    type="number" 
                                                    step="0.01" 
                                                    min="0"
                                                    className={`w-full h-[30px] py-1 text-xs font-mono text-end ${validationErrors[`lines.${index}.credit`] ? 'border-danger' : ''}`} 
                                                    value={line.credit} 
                                                    onChange={e => updateLine(index, 'credit', e.target.value)} 
                                                    onBlur={() => handleAutoSave()}
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Tooltip content={lang === 'ar' ? 'إضافة سطر أسفل' : 'Add line below'}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => addLineBelow(index)} 
                                                            className="p-1.5 rounded-md text-text-muted hover:text-emerald-600 hover:bg-emerald-600/10 transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content={lang === 'ar' ? 'نسخ السطر' : 'Copy line'}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => copyLine(index)} 
                                                            className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                    </Tooltip>
                                                    <Tooltip content={lang === 'ar' ? 'حذف السطر' : 'Delete line'}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeLine(index)} 
                                                            disabled={data.lines.length <= 2}
                                                            className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-text-muted"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-surface-muted/50 border-t-2 border-border">
                                <tr>
                                    <td colSpan="3" className="px-4 py-3 text-end font-bold text-text">
                                        {lang === 'ar' ? 'الإجمالي' : 'Total'}
                                    </td>
                                    <td className="px-4 py-3 text-end font-bold font-mono text-emerald-600 bg-emerald-500/5">
                                        {totals.debit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-end font-bold font-mono text-rose-600 bg-rose-500/5">
                                        {totals.credit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                                {!isBalanced && totals.debit > 0 && totals.credit > 0 && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-2 text-end text-sm font-medium text-danger">
                                            {lang === 'ar' ? 'الفرق (القيد غير متزن)' : 'Difference (Unbalanced)'}
                                        </td>
                                        <td colSpan="2" className="px-4 py-2 text-center font-bold font-mono text-danger bg-danger/10 rounded-sm">
                                            {totals.difference.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td></td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
