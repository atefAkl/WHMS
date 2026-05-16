import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Box, Home, ChevronRight, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Tooltip from '@/Components/Tooltip';

export default function StorageItems({ items }) {
    const { lang } = useLang();
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name_ar: '',
        name_en: '',
        default_price: 0,
        is_active: true,
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCreateModalOpen(true);
    };

    const openEditModal = (item) => {
        clearErrors();
        setData({
            name_ar: item.name_ar,
            name_en: item.name_en || '',
            default_price: item.default_price,
            is_active: item.is_active,
        });
        setItemToEdit(item);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('settings.storage-items.store'), {
            onSuccess: () => setCreateModalOpen(false),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route('settings.storage-items.update', itemToEdit.id), {
            onSuccess: () => setItemToEdit(null),
        });
    };

    const confirmDelete = () => {
        router.delete(route('settings.storage-items.destroy', itemToDelete.id), {
            onSuccess: () => setItemToDelete(null),
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('settings.index'))}>
                {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </span>
            <ChevronRight className={`h-4 w-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'وحدات التخزين' : 'Storage Items'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'وحدات التخزين' : 'Storage Items'} />

            <div className="max-w-5xl mx-auto pb-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text">{lang === 'ar' ? 'وحدات التخزين' : 'Storage Allocation Items'}</h1>
                        <p className="text-sm text-text-muted mt-1">{lang === 'ar' ? 'إدارة مساحات التخزين وأسعارها الافتراضية' : 'Manage storage allocation spaces and their default prices'}</p>
                    </div>
                    <PrimaryButton onClick={openCreateModal}>
                        <Plus className="h-4 w-4 me-2" />
                        {lang === 'ar' ? 'إضافة وحدة جديدة' : 'Add New Item'}
                    </PrimaryButton>
                </div>

                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wide border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</th>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</th>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'السعر الافتراضي' : 'Default Price'}</th>
                                    <th className="px-4 py-3 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className="px-4 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-text-muted">
                                            {lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map(item => (
                                        <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-text">{item.name_ar}</td>
                                            <td className="px-4 py-3 text-text-muted">{item.name_en || '—'}</td>
                                            <td className="px-4 py-3 font-mono text-emerald-600 font-bold" dir="ltr">{parseFloat(item.default_price).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${item.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {item.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                                                <Tooltip text={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                    <button onClick={() => openEditModal(item)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                    <button onClick={() => setItemToDelete(item)} className={`p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors ${item.id <= 2 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={item.id <= 2}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isCreateModalOpen || !!itemToEdit} onClose={() => { setCreateModalOpen(false); setItemToEdit(null); }} maxWidth="md">
                <form onSubmit={itemToEdit ? submitEdit : submitCreate} className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-lg text-text">
                            {itemToEdit 
                                ? (lang === 'ar' ? 'تعديل وحدة تخزين' : 'Edit Storage Item') 
                                : (lang === 'ar' ? 'إضافة وحدة تخزين جديدة' : 'Add New Storage Item')}
                        </h3>
                        <button type="button" onClick={() => { setCreateModalOpen(false); setItemToEdit(null); }} className="text-text-muted hover:text-text">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'الاسم (بالعربية) *' : 'Name (Arabic) *'} />
                            <TextInput className="mt-1 w-full text-sm" value={data.name_ar} onChange={e => setData('name_ar', e.target.value)} required />
                            <InputError message={errors.name_ar} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={lang === 'ar' ? 'الاسم (بالإنجليزية)' : 'Name (English)'} />
                            <TextInput className="mt-1 w-full text-sm" value={data.name_en} onChange={e => setData('name_en', e.target.value)} dir="ltr" />
                            <InputError message={errors.name_en} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel value={lang === 'ar' ? 'السعر الافتراضي *' : 'Default Price *'} />
                            <TextInput type="number" min="0" step="0.01" className="mt-1 w-full text-sm font-mono" value={data.default_price} onChange={e => setData('default_price', e.target.value)} dir="ltr" required />
                            <InputError message={errors.default_price} className="mt-1" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" className="rounded border-border text-primary focus:ring-primary h-4 w-4" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                            <label htmlFor="is_active" className="text-sm text-text cursor-pointer">{lang === 'ar' ? 'نشط (متاح للاستخدام)' : 'Active (available for use)'}</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <SecondaryButton type="button" onClick={() => { setCreateModalOpen(false); setItemToEdit(null); }}>
                            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                        </SecondaryButton>
                        <PrimaryButton disabled={processing}>
                            <Save className="h-4 w-4 me-1.5" />
                            {itemToEdit ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إضافة' : 'Add')}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={!!itemToDelete} onClose={() => setItemToDelete(null)} maxWidth="sm">
                <div className="p-6 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
                        <Trash2 className="h-6 w-6 text-danger" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text">{lang === 'ar' ? 'حذف وحدة التخزين' : 'Delete Storage Item'}</h3>
                        <p className="text-sm text-text-muted mt-2">
                            {lang === 'ar' ? 'هل أنت متأكد من حذف' : 'Are you sure you want to delete'}{" "}
                            <span className="font-bold text-text">{itemToDelete?.name_ar}</span>؟
                        </p>
                    </div>
                    <div className="flex justify-center gap-3 pt-2">
                        <SecondaryButton onClick={() => setItemToDelete(null)}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <DangerButton onClick={confirmDelete}>{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
