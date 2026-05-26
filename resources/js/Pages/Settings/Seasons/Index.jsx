import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Calendar, Home, ChevronRight, Plus, Edit, Trash2, X, Save, FileText } from 'lucide-react';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Tooltip from '@/Components/Tooltip';

export default function Index({ seasons, openCreate = false }) {
    const { lang } = useLang();
    const [isCreateModalOpen, setCreateModalOpen] = useState(openCreate);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        code: '',
        name_ar: '',
        name_en: '',
        start_date: '',
        end_date: '',
        is_active: true,
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCreateModalOpen(true);
    };

    const openEditModal = (season) => {
        clearErrors();
        setData({
            code: season.code || '',
            name_ar: season.name_ar,
            name_en: season.name_en || '',
            start_date: season.start_date,
            end_date: season.end_date,
            is_active: !!season.is_active,
        });
        setItemToEdit(season);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('settings.seasons.store'), {
            onSuccess: () => setCreateModalOpen(false),
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(route('settings.seasons.update', itemToEdit.id), {
            onSuccess: () => setItemToEdit(null),
        });
    };

    const confirmDelete = () => {
        router.delete(route('settings.seasons.destroy', itemToDelete.id), {
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
            <span className="text-primary font-medium">{lang === 'ar' ? 'المواسم' : 'Seasons'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'المواسم' : 'Seasons'} />

            <div className="max-w-5xl mx-auto pb-8 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-text">{lang === 'ar' ? 'المواسم' : 'Seasons'}</h1>
                        <p className="text-sm text-text-muted mt-1">{lang === 'ar' ? 'إدارة فترات ومواسم العمل في النظام' : 'Manage work periods and seasons in the system'}</p>
                    </div>
                    <PrimaryButton onClick={openCreateModal}>
                        <Plus className="h-4 w-4 me-2" />
                        {lang === 'ar' ? 'إضافة موسم جديد' : 'Add New Season'}
                    </PrimaryButton>
                </div>

                <div className="bg-surface border border-border shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-start">
                            <thead className="bg-surface-muted text-text-muted text-[11px] uppercase tracking-wide border-b border-border">
                                <tr>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'الكود' : 'Code'}</th>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}</th>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}</th>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'البداية' : 'Start'}</th>
                                    <th className="px-4 py-3">{lang === 'ar' ? 'النهاية' : 'End'}</th>
                                    <th className="px-4 py-3 text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                                    <th className="px-4 py-3 w-20"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {seasons.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-text-muted">
                                            {lang === 'ar' ? 'لا توجد مواسم مسجلة' : 'No seasons available'}
                                        </td>
                                    </tr>
                                ) : (
                                    seasons.map(season => (
                                        <tr key={season.id} className="hover:bg-surface-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-mono font-bold text-text">{season.code || '—'}</td>
                                            <td className="px-4 py-3 font-medium text-text">{season.name_ar}</td>
                                            <td className="px-4 py-3 text-text-muted">{season.name_en || '—'}</td>
                                            <td className="px-4 py-3 font-mono text-text-muted" dir="ltr">{season.start_date}</td>
                                            <td className="px-4 py-3 font-mono text-text-muted" dir="ltr">{season.end_date}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${season.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {season.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'مغلق' : 'Closed')}
                                                </span>
                                            </td>
                                             <td className="px-4 py-3 text-end space-x-1 rtl:space-x-reverse">
                                                <Tooltip text={lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}>
                                                    <button onClick={() => router.get(route('settings.seasons.show', season.id))} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                                        <FileText className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                    <button onClick={() => openEditModal(season)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                    <button onClick={() => setItemToDelete(season)} className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
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
                                ? (lang === 'ar' ? 'تعديل الموسم' : 'Edit Season') 
                                : (lang === 'ar' ? 'إضافة موسم جديد' : 'Add New Season')}
                        </h3>
                        <button type="button" onClick={() => { setCreateModalOpen(false); setItemToEdit(null); }} className="text-text-muted hover:text-text">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <InputLabel value={lang === 'ar' ? 'كود الموسم (مثل DTS26) *' : 'Season Code (e.g. DTS26) *'} />
                            <TextInput className="mt-1 w-full text-sm" value={data.code} onChange={e => setData('code', e.target.value)} required placeholder="e.g. DTS26" />
                            <InputError message={errors.code} className="mt-1" />
                        </div>
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
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <InputLabel value={lang === 'ar' ? 'تاريخ البداية *' : 'Start Date *'} />
                                <TextInput type="date" className="mt-1 w-full text-sm" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required />
                                <InputError message={errors.start_date} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel value={lang === 'ar' ? 'تاريخ النهاية *' : 'End Date *'} />
                                <TextInput type="date" className="mt-1 w-full text-sm" value={data.end_date} onChange={e => setData('end_date', e.target.value)} required />
                                <InputError message={errors.end_date} className="mt-1" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" className="rounded border-border text-primary focus:ring-primary h-4 w-4" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                            <label htmlFor="is_active" className="text-sm text-text cursor-pointer">{lang === 'ar' ? 'نشط (متاح للعمل عليه)' : 'Active (available for work)'}</label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
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
                        <h3 className="text-lg font-bold text-text">{lang === 'ar' ? 'حذف الموسم' : 'Delete Season'}</h3>
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
