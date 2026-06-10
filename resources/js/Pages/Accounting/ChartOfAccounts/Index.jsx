import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { ChevronRight, Plus, Edit, Trash2, Home, FolderOpen, FileText, Search, X, CheckSquare, Square, MinusSquare, List, Grid, MoreVertical } from 'lucide-react';
import Modal from '@/Components/Modal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useSecureDelete } from '@/Hooks/useSecureDelete';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import Tooltip from '@/Components/Tooltip';
import Dropdown from '@/Components/Dropdown';
import Checkbox from '@/Components/Checkbox';

export default function ChartOfAccounts({ accounts }) {
    const { lang } = useLang();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [expandedNodes, setExpandedNodes] = useState({});
    
    // New Structure States
    const [selectedIds, setSelectedIds] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    
    const selectAll = () => setSelectedIds(accounts.map(a => a.id));
    const selectNone = () => setSelectedIds([]);
    const invertSelection = () => {
        const allIds = accounts.map(a => a.id);
        setSelectedIds(allIds.filter(id => !selectedIds.includes(id)));
    };
    
    const toggleOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(i => i !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const {
        itemToDelete, deletePassword, setDeletePassword, deleteError, processing: deleteProcessing,
        requestDelete, confirmDelete, cancelDelete
    } = useSecureDelete();

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        parent_id: '',
        code: '',
        name_ar: '',
        name_en: '',
        type: 'asset',
        normal_balance: 'debit',
        is_transactional: false,
        is_active: true,
        description: ''
    });

    // Build the tree
    const buildTree = (accountsArray, parentId = null) => {
        return accountsArray
            .filter(acc => acc.parent_id === parentId)
            .map(acc => ({
                ...acc,
                children: buildTree(accountsArray, acc.id)
            }));
    };

    const treeData = buildTree(accounts);

    const toggleNode = (id) => {
        setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openCreateModal = (parentId = null) => {
        clearErrors();
        reset();
        setData('parent_id', parentId || '');
        setAccountToEdit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (account) => {
        clearErrors();
        setData({
            parent_id: account.parent_id || '',
            code: account.code,
            name_ar: account.name_ar,
            name_en: account.name_en || '',
            type: account.type,
            normal_balance: account.normal_balance,
            is_transactional: !!account.is_transactional,
            is_active: !!account.is_active,
            description: account.description || ''
        });
        setAccountToEdit(account);
        setIsFormModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setTimeout(() => { reset(); setAccountToEdit(null); clearErrors(); }, 200);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (accountToEdit) {
            put(route('accounting.accounts.update', accountToEdit.id), { onSuccess: () => closeModals() });
        } else {
            post(route('accounting.accounts.store'), { onSuccess: () => closeModals() });
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'الحسابات' : 'Accounting'}</span>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'شجرة الحسابات' : 'Chart of Accounts'}</span>
        </div>
    );

    const renderNode = (node, level = 0) => {
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes[node.id];
        
        return (
            <div key={node.id} className="w-full">
                <div className={`flex items-center justify-between py-2 px-3 border-b border-border hover:bg-surface-muted/30 transition-colors ${level === 0 ? 'bg-surface-muted/10 font-bold' : ''}`}>
                    <div className="flex items-center gap-2" style={{ paddingInlineStart: `${level * 20}px` }}>
                        <Checkbox checked={selectedIds.includes(node.id)} onChange={() => toggleOne(node.id)} />
                        {hasChildren ? (
                            <button onClick={() => toggleNode(node.id)} className="p-1 hover:bg-surface-muted rounded">
                                <ChevronRight className={`h-4 w-4 text-text-muted transition-transform ${isExpanded ? (lang === 'ar' ? '-rotate-90' : 'rotate-90') : (lang === 'ar' ? 'rotate-180' : '')}`} />
                            </button>
                        ) : (
                            <span className="w-6 inline-block"></span>
                        )}
                        
                        {node.is_transactional ? (
                            <FileText className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <FolderOpen className="h-4 w-4 text-amber-500" />
                        )}
                        
                        <span className="font-mono text-primary mr-2 ml-2">{node.code}</span>
                        <span className="text-text">{lang === 'ar' ? node.name_ar : node.name_en}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted bg-surface-muted px-2 py-0.5 rounded mr-4 ml-4">
                            {node.normal_balance === 'debit' ? (lang === 'ar' ? 'مدين' : 'Debit') : (lang === 'ar' ? 'دائن' : 'Credit')}
                        </span>
                        
                        {!node.is_transactional && (
                            <Tooltip text={lang === 'ar' ? 'إضافة حساب فرعي' : 'Add Sub-Account'}>
                                <button onClick={() => openCreateModal(node.id)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        )}
                        
                        <Tooltip text={lang === 'ar' ? 'تعديل' : 'Edit'}>
                            <button onClick={() => openEditModal(node)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                <Edit className="h-4 w-4" />
                            </button>
                        </Tooltip>
                        
                        <Tooltip text={lang === 'ar' ? 'حذف' : 'Delete'}>
                            <button onClick={() => requestDelete(route('accounting.accounts.destroy', node.id), node)} className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
                
                {hasChildren && isExpanded && (
                    <div className="w-full">
                        {node.children.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'شجرة الحسابات' : 'Chart of Accounts'} />

            <div className="max-w-7xl mx-auto pb-8 flex flex-col gap-2 mt-4 px-4 sm:px-6 lg:px-8">
                
                {/* Page Header Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl py-2 px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <FolderOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text">{lang === 'ar' ? 'شجرة الحسابات' : 'Chart of Accounts'}</h1>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'إدارة وهيكلة دليل الحسابات المالي' : 'Manage financial chart of accounts structure'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <Tooltip content={lang === 'ar' ? 'إضافة حساب' : 'Add Account'}>
                            <PrimaryButton onClick={() => openCreateModal()} className="h-9 w-9 !p-0 flex items-center justify-center">
                                <Plus className="h-5 w-5" />
                            </PrimaryButton>
                        </Tooltip>
                    </div>
                </div>

                {/* Filters Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <TextInput
                                className="w-full h-[30px] text-xs"
                                placeholder={lang === 'ar' ? 'ابحث بكود أو اسم الحساب...' : 'Search account code or name...'}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Tooltip content={lang === 'ar' ? 'بحث' : 'Search'}>
                                <PrimaryButton type="button" className="h-[30px] w-[30px] !p-0 flex items-center justify-center flex-shrink-0">
                                    <Search className="h-4 w-4" />
                                </PrimaryButton>
                            </Tooltip>
                            <Tooltip content={lang === 'ar' ? 'مسح الفلاتر' : 'Clear Filters'}>
                                <SecondaryButton type="button" className="h-[30px] w-[30px] !p-0 flex items-center justify-center flex-shrink-0">
                                    <X className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Content Box */}
                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden">
                    {/* Card Header */}
                    <div className="p-3 border-b border-border bg-surface-muted/30 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            {/* Selection Tools */}
                            <Tooltip content={lang === 'ar' ? 'تحديد الكل' : 'Select All'}>
                                <SecondaryButton onClick={selectAll} className="h-8 w-8 !p-0 flex items-center justify-center text-text-muted hover:text-text">
                                    <CheckSquare className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                            <Tooltip content={lang === 'ar' ? 'إلغاء التحديد' : 'Select None'}>
                                <SecondaryButton onClick={selectNone} className="h-8 w-8 !p-0 flex items-center justify-center text-text-muted hover:text-text">
                                    <Square className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                            <Tooltip content={lang === 'ar' ? 'عكس التحديد' : 'Invert Selection'}>
                                <SecondaryButton onClick={invertSelection} className="h-8 w-8 !p-0 flex items-center justify-center text-text-muted hover:text-text">
                                    <MinusSquare className="h-4 w-4" />
                                </SecondaryButton>
                            </Tooltip>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            {/* Bulk Actions */}
                            {selectedIds.length > 0 && (
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <div>
                                            <PrimaryButton className="h-8 px-3 text-xs flex items-center gap-2">
                                                <MoreVertical className="h-3 w-3" />
                                                <span>{lang === 'ar' ? 'الإجراءات المجمعة' : 'Bulk Actions'} ({selectedIds.length})</span>
                                            </PrimaryButton>
                                        </div>
                                    </Dropdown.Trigger>
                                    <Dropdown.Content>
                                        <button className="block w-full text-start px-4 py-2 text-sm leading-5 text-danger hover:bg-surface-muted transition duration-150 ease-in-out">
                                            <Trash2 className="inline-block w-4 h-4 me-2" />
                                            {lang === 'ar' ? 'حذف المحدد' : 'Delete Selected'}
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            )}
                            
                            {/* View Tools */}
                            <div className="flex items-center bg-surface border border-border rounded-md p-0.5">
                                <Tooltip content={lang === 'ar' ? 'عرض القائمة' : 'List View'}>
                                    <button onClick={() => setViewMode('list')} className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-surface-muted text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>
                                        <List className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                                <Tooltip content={lang === 'ar' ? 'عرض الشبكة' : 'Grid View'}>
                                    <button onClick={() => setViewMode('grid')} className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-surface-muted text-text shadow-sm' : 'text-text-muted hover:text-text'}`}>
                                        <Grid className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="flex bg-surface-muted/50 p-3 border-b border-border text-sm font-semibold text-text-muted uppercase tracking-wider">
                        <div className="flex-1">{lang === 'ar' ? 'الحساب' : 'Account'}</div>
                        <div className="w-48 text-center">{lang === 'ar' ? 'طبيعة الحساب' : 'Normal Balance'}</div>
                        <div className="w-32 text-end px-4">{lang === 'ar' ? 'إجراءات' : 'Actions'}</div>
                    </div>
                    
                    <div className="divide-y divide-border">
                        {treeData.map(node => renderNode(node, 0))}
                        {treeData.length === 0 && (
                            <div className="p-8 text-center text-text-muted">
                                {lang === 'ar' ? 'لا توجد حسابات مضافة.' : 'No accounts available.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={isFormModalOpen} onClose={closeModals} maxWidth="lg">
                <form onSubmit={submitForm} className="p-6">
                    <h2 className="text-lg font-bold text-text mb-6">
                        {accountToEdit ? (lang === 'ar' ? 'تعديل الحساب' : 'Edit Account') : (lang === 'ar' ? 'إضافة حساب جديد' : 'Add New Account')}
                    </h2>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={lang === 'ar' ? 'رقم الحساب *' : 'Account Code *'} />
                                <TextInput className="mt-1 w-full" value={data.code} onChange={e => setData('code', e.target.value)} required dir="ltr" />
                                <InputError message={errors.code} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={lang === 'ar' ? 'الرئيسي' : 'Parent'} />
                                <select 
                                    className="mt-1 block w-full border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                    value={data.parent_id} 
                                    onChange={e => setData('parent_id', e.target.value)}
                                >
                                    <option value="">{lang === 'ar' ? '-- حساب رئيسي (مستوى أول) --' : '-- Main Account (Level 1) --'}</option>
                                    {accounts.filter(a => !a.is_transactional).map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.code} - {lang === 'ar' ? acc.name_ar : acc.name_en}</option>
                                    ))}
                                </select>
                                <InputError message={errors.parent_id} className="mt-1" />
                            </div>
                        </div>

                        <div>
                            <InputLabel value={lang === 'ar' ? 'الاسم بالعربية *' : 'Name (Arabic) *'} />
                            <TextInput className="mt-1 w-full" value={data.name_ar} onChange={e => setData('name_ar', e.target.value)} required />
                            <InputError message={errors.name_ar} className="mt-1" />
                        </div>
                        
                        <div>
                            <InputLabel value={lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'} />
                            <TextInput className="mt-1 w-full" value={data.name_en} onChange={e => setData('name_en', e.target.value)} dir="ltr" />
                            <InputError message={errors.name_en} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value={lang === 'ar' ? 'تصنيف الحساب *' : 'Account Type *'} />
                                <select 
                                    className="mt-1 block w-full border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                    value={data.type} 
                                    onChange={e => setData('type', e.target.value)}
                                    required
                                >
                                    <option value="asset">{lang === 'ar' ? 'أصول' : 'Asset'}</option>
                                    <option value="liability">{lang === 'ar' ? 'خصوم' : 'Liability'}</option>
                                    <option value="equity">{lang === 'ar' ? 'حقوق الملكية' : 'Equity'}</option>
                                    <option value="revenue">{lang === 'ar' ? 'إيرادات' : 'Revenue'}</option>
                                    <option value="expense">{lang === 'ar' ? 'مصروفات' : 'Expense'}</option>
                                </select>
                                <InputError message={errors.type} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={lang === 'ar' ? 'طبيعة الحساب *' : 'Normal Balance *'} />
                                <select 
                                    className="mt-1 block w-full border-border bg-surface text-text rounded-md shadow-sm focus:border-primary focus:ring-primary text-sm"
                                    value={data.normal_balance} 
                                    onChange={e => setData('normal_balance', e.target.value)}
                                    required
                                >
                                    <option value="debit">{lang === 'ar' ? 'مدين (Debit)' : 'Debit'}</option>
                                    <option value="credit">{lang === 'ar' ? 'دائن (Credit)' : 'Credit'}</option>
                                </select>
                                <InputError message={errors.normal_balance} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" checked={data.is_transactional} onChange={e => setData('is_transactional', e.target.checked)} />
                                <span className="text-sm text-text">{lang === 'ar' ? 'حساب حركي (يقبل قيود)' : 'Transactional (Accepts Entries)'}</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                                <span className="text-sm text-text">{lang === 'ar' ? 'نشط' : 'Active'}</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                        <SecondaryButton type="button" onClick={closeModals}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'حفظ' : 'Save'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <ConfirmationModal
                show={!!itemToDelete}
                title={lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}
                message={lang === 'ar' ? 'هل أنت متأكد من حذف هذا الحساب؟' : 'Are you sure you want to delete this account?'}
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                processing={deleteProcessing}
            />
        </AuthenticatedLayout>
    );
}
