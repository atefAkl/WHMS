import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { useState } from 'react';
import { Globe, Plus, Search, Edit, Trash2, Home, ChevronRight, Download } from 'lucide-react';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Tooltip from '@/Components/Tooltip';

export default function Countries({ auth, countries, filters }) {
    const { lang } = useLang();
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [countryToEdit, setCountryToEdit] = useState(null);
    const [countryToDelete, setCountryToDelete] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '', // We will handle name_ar and name_en
        name_ar: '',
        name_en: '',
        code: '',
        phone_code: '',
    });

    const t = {
        title: lang === 'ar' ? 'الدول والجنسيات' : 'Countries & Nationalities',
        home: lang === 'ar' ? 'الإعدادات' : 'Settings',
        add: lang === 'ar' ? 'إضافة دولة مخصصة' : 'Add Custom Country',
        addAll: lang === 'ar' ? 'إضافة جميع دول العالم' : 'Add All Countries',
        search: lang === 'ar' ? 'البحث بالاسم أو الكود...' : 'Search by name or code...',
        columns: {
            code: lang === 'ar' ? 'كود الدولة' : 'Code',
            name: lang === 'ar' ? 'اسم الدولة' : 'Name',
            phone: lang === 'ar' ? 'مفتاح الاتصال' : 'Phone Code',
            actions: lang === 'ar' ? 'إجراءات' : 'Actions',
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('settings.countries.index'), { search: searchQuery }, { preserveState: true });
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCountryToEdit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (country) => {
        clearErrors();
        setData({
            name_ar: country.name_ar,
            name_en: country.name_en,
            code: country.code,
            phone_code: country.phone_code || '',
        });
        setCountryToEdit(country);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (country) => {
        setCountryToDelete(country);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            reset();
            setCountryToEdit(null);
            setCountryToDelete(null);
            clearErrors();
        }, 200);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (countryToEdit) {
            put(route('settings.countries.update', countryToEdit.id), {
                onSuccess: () => closeModals(),
            });
        } else {
            post(route('settings.countries.store'), {
                onSuccess: () => closeModals(),
            });
        }
    };

    const deleteCountry = () => {
        if (!countryToDelete) return;
        destroy(route('settings.countries.destroy', countryToDelete.id), {
            onSuccess: () => closeModals(),
        });
    };

    const seedCountries = () => {
        if (confirm(lang === 'ar' ? 'سيتم إضافة جميع دول العالم تلقائياً، هل تريد الاستمرار؟' : 'All countries will be added automatically, continue?')) {
            router.post(route('settings.countries.seed'));
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('settings.index'))}>{t.home}</span>
            <ChevronRight className={lang === 'ar' ? 'h-4 w-4 rotate-180' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div className="py-4 space-y-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-text">{t.title}</h2>
                            <p className="text-sm text-text-muted mt-1">
                                {lang === 'ar' ? 'إدارة قائمة الدول ومفاتيح الاتصال' : 'Manage countries and calling codes list'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {countries.total < 50 && (
                                <button onClick={seedCountries} className="flex items-center justify-center gap-2 rounded-lg border border-primary text-primary bg-surface px-4 py-2 text-sm font-medium hover:bg-primary/5 transition-colors shadow-sm">
                                    <Download className="h-4 w-4" />
                                    {t.addAll}
                                </button>
                            )}
                            <button onClick={openCreateModal} className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover shadow-sm">
                                <Plus className="h-4 w-4" />
                                {t.add}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
                        <div className="border-b border-border p-4 bg-surface-muted/30 flex items-center justify-between">
                            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                                    <Search className="h-4 w-4 text-text-muted" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full rounded-lg border border-border bg-surface py-1.5 ps-9 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    placeholder={t.search}
                                />
                            </form>
                            <span className="text-sm text-text-muted font-medium">{countries.total} {lang === 'ar' ? 'دولة' : 'Countries'}</span>
                        </div>

                        <div className="flex-1 bg-surface p-0 min-h-[400px]">
                            {countries.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
                                    <Globe className="h-12 w-12 opacity-20 mb-4" />
                                    <p className="text-lg font-medium">{lang === 'ar' ? 'لم يتم العثور على بيانات' : 'No data found'}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-surface-muted/50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">{t.columns.code}</th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">{t.columns.name}</th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">{t.columns.phone}</th>
                                                <th scope="col" className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-text-muted">{t.columns.actions}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-surface">
                                            {countries.data.map((country) => (
                                                <tr key={country.id} className="transition-colors hover:bg-surface-muted/50">
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-primary">
                                                        {country.code}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="text-sm font-bold text-text">{lang === 'ar' ? country.name_ar : country.name_en}</div>
                                                        <div className="text-xs text-text-muted">{lang === 'ar' ? country.name_en : country.name_ar}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-text font-medium" dir="ltr">
                                                        {country.phone_code || '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-end text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Tooltip text={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                                <button onClick={() => openEditModal(country)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip text={lang === 'ar' ? 'حذف' : 'Delete'}>
                                                                <button onClick={() => openDeleteModal(country)} className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <Pagination links={countries.links} total={countries.total} from={countries.from} to={countries.to} />
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={isFormModalOpen} onClose={closeModals} maxWidth="lg">
                <form onSubmit={submitForm} className="p-6">
                    <h2 className="text-lg font-bold text-text mb-6">
                        {countryToEdit ? (lang === 'ar' ? 'تعديل الدولة' : 'Edit Country') : t.add}
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <InputLabel htmlFor="name_ar" value={lang === 'ar' ? 'الاسم بالعربية' : 'Arabic Name'} />
                            <TextInput id="name_ar" type="text" className="mt-1 block w-full" value={data.name_ar} onChange={e => setData('name_ar', e.target.value)} required autoFocus />
                            <InputError message={errors.name_ar} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="name_en" value={lang === 'ar' ? 'الاسم بالإنجليزية' : 'English Name'} />
                            <TextInput id="name_en" type="text" className="mt-1 block w-full text-left" value={data.name_en} onChange={e => setData('name_en', e.target.value)} required dir="ltr" />
                            <InputError message={errors.name_en} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="code" value={lang === 'ar' ? 'كود الدولة (ISO)' : 'Country Code (ISO)'} />
                                <TextInput id="code" type="text" className="mt-1 block w-full text-left uppercase" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())} required dir="ltr" placeholder="SA" maxLength={5} />
                                <InputError message={errors.code} className="mt-1" />
                            </div>
                            <div>
                                <InputLabel htmlFor="phone_code" value={lang === 'ar' ? 'مفتاح الاتصال' : 'Phone Code'} />
                                <TextInput id="phone_code" type="text" className="mt-1 block w-full text-left" value={data.phone_code} onChange={e => setData('phone_code', e.target.value)} dir="ltr" placeholder="+966" />
                                <InputError message={errors.phone_code} className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <SecondaryButton type="button" onClick={closeModals}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <PrimaryButton disabled={processing}>{lang === 'ar' ? 'حفظ' : 'Save'}</PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={isDeleteModalOpen} onClose={closeModals} maxWidth="sm">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 mb-4">
                        <Trash2 className="h-6 w-6 text-danger" />
                    </div>
                    <h3 className="text-lg font-bold text-text mb-2">{lang === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion'}</h3>
                    <p className="text-sm text-text-muted mb-6">
                        {lang === 'ar' ? 'هل أنت متأكد من حذف هذه الدولة؟ لا يمكن التراجع.' : 'Are you sure you want to delete this country? This cannot be undone.'}
                    </p>
                    <div className="flex justify-center gap-3">
                        <SecondaryButton type="button" onClick={closeModals}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <DangerButton onClick={deleteCountry} disabled={processing}>{lang === 'ar' ? 'حذف' : 'Delete'}</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
