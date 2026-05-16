import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { useState } from 'react';
import { 
    UsersRound, Plus, Search, LayoutGrid, List as ListIcon, 
    Filter, ChevronRight, Home, TrendingUp, Users, Activity, Edit, Trash2, Eye
} from 'lucide-react';
import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';
import Tooltip from '@/Components/Tooltip';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Index({ auth, customers, filters, countries = [], categories = [], stats = {} }) {
    const { lang } = useLang();
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [selectedItems, setSelectedItems] = useState([]);
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState(null);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        foreign_name: '',
        phone_number: '',
        email: '',
        id_number: '',
        vat_number: '',
        cr_number: '',
        website: '',
        address: '',
        country_id: countries.length > 0 ? countries[0].id : 1,
        parent_category_id: '',
        category_id: '',
    });

    const t = {
        title: lang === 'ar' ? 'العملاء' : 'Customers',
        home: lang === 'ar' ? 'الرئيسية' : 'Home',
        add: lang === 'ar' ? 'إضافة عميل' : 'Add Customer',
        search: lang === 'ar' ? 'البحث بالاسم، الهاتف، الهوية...' : 'Search by name, phone, ID...',
        stats: {
            total:    lang === 'ar' ? 'إجمالي العملاء'   : 'Total Customers',
            business: lang === 'ar' ? 'أعمال'             : 'Business',
            individual: lang === 'ar' ? 'أفراد'           : 'Individuals',
            noContract: lang === 'ar' ? 'بدون عقد'        : 'No Contract',
            newLast30:  lang === 'ar' ? 'جدد (30 يوم)'    : 'New (30 days)',
        },
        columns: {
            code: lang === 'ar' ? 'الرقم التسلسلي' : 'Serial No',
            name: lang === 'ar' ? 'اسم العميل' : 'Name',
            contact: lang === 'ar' ? 'التواصل' : 'Contact',
            tax: lang === 'ar' ? 'الضريبي/الهوية' : 'Tax/ID No.',
            status: lang === 'ar' ? 'الحالة' : 'Status',
            actions: lang === 'ar' ? 'إجراءات' : 'Actions',
        },
        status: {
            active: lang === 'ar' ? 'نشط' : 'Active',
            inactive: lang === 'ar' ? 'غير نشط' : 'Inactive',
        },
        selection: {
            all: lang === 'ar' ? 'اختيار الكل' : 'Select All',
            none: lang === 'ar' ? 'إلغاء الاختيار' : 'Select None',
            invert: lang === 'ar' ? 'عكس الاختيار' : 'Invert Selection',
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('customers.index'), { search: searchQuery }, { preserveState: true });
    };

    const toggleSelection = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const selectAll = () => setSelectedItems(customers.data.map(c => c.id));
    const selectNone = () => setSelectedItems([]);
    const invertSelection = () => {
        const allIds = customers.data.map(c => c.id);
        setSelectedItems(allIds.filter(id => !selectedItems.includes(id)));
    };

    const openCreateModal = () => {
        clearErrors();
        reset();
        setCustomerToEdit(null);
        setIsFormModalOpen(true);
    };

    const openEditModal = (customer) => {
        clearErrors();
        const selectedCat = categories.find(c => c.id === customer.category_id);
        const parentId = selectedCat ? selectedCat.parent_id : '';
        
        setData({
            name: customer.name,
            foreign_name: customer.foreign_name || customer.name,
            phone_number: customer.phone_number,
            email: customer.email || '',
            id_number: customer.id_number || '',
            vat_number: customer.vat_number || '',
            cr_number: customer.cr_number || '',
            website: customer.website || '',
            address: customer.address || '',
            country_id: customer.country_id || (countries.length > 0 ? countries[0].id : 1),
            parent_category_id: parentId,
            category_id: customer.category_id || '',
        });
        setCustomerToEdit(customer);
        setIsFormModalOpen(true);
    };

    const openDeleteModal = (customer) => {
        setCustomerToDelete(customer);
        setIsDeleteModalOpen(true);
    };

    const closeModals = () => {
        setIsFormModalOpen(false);
        setIsDeleteModalOpen(false);
        setTimeout(() => {
            reset();
            setCustomerToEdit(null);
            setCustomerToDelete(null);
            clearErrors();
        }, 200);
    };

    const submitForm = (e) => {
        e.preventDefault();
        if (customerToEdit) {
            put(route('customers.update', customerToEdit.id), {
                onSuccess: () => closeModals(),
            });
        } else {
            post(route('customers.store'), {
                onSuccess: () => closeModals(),
            });
        }
    };

    const deleteCustomer = () => {
        if (!customerToDelete) return;
        destroy(route('customers.destroy', customerToDelete.id), {
            onSuccess: () => closeModals(),
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={cn("h-4 w-4", lang === 'ar' && "rotate-180")} />
            <span>{lang === 'ar' ? 'المبيعات' : 'Sales'}</span>
            <ChevronRight className={cn("h-4 w-4", lang === 'ar' && "rotate-180")} />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div className="pb-4 space-y-3">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* 1. Page Title & Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border border-border rounded-xl px-4 py-3 bg-surface shadow-sm mb-3 transition-shadow hover:shadow-md">
                        <div>
                            <h1 className="text-xl font-bold text-text leading-tight">{t.title}</h1>
                            <p className="text-[12px] text-text-muted mt-0.5">
                                {lang === 'ar' ? 'إدارة بيانات العملاء والجهات المرتبطة بها' : 'Manage customers data and related entities'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[14px] font-medium text-text hover:bg-surface-muted transition-colors shadow-sm">
                                <Filter className="h-3.5 w-3.5" />
                                {lang === 'ar' ? 'تصفية' : 'Filter'}
                            </button>
                            <button onClick={openCreateModal} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover shadow-sm">
                                <Plus className="h-3.5 w-3.5" />
                                {t.add}
                            </button>
                        </div>
                    </div>

                    {/* 2. Stats Cards - Real Data */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                        {[
                            { label: t.stats.total,      value: stats.total ?? customers.total, icon: Users,      color: 'text-primary',   bg: 'bg-primary/10' },
                            { label: t.stats.business,   value: stats.business ?? 0,            icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                            { label: t.stats.noContract, value: stats.withoutContracts ?? 0,    icon: Activity,   color: 'text-amber-500',  bg: 'bg-amber-500/10' },
                            { label: t.stats.newLast30,  value: stats.newLast30 ?? 0,           icon: UsersRound, color: 'text-emerald-500',bg: 'bg-emerald-500/10' },
                        ].map(({ label, value, icon: Icon, color, bg }) => (
                            <div key={label} className="rounded-xl border border-border bg-surface px-4 py-3 shadow-sm flex items-center gap-3 transition-shadow hover:shadow-md">
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bg} ${color}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-text-muted truncate">{label}</p>
                                    <p className="text-xl font-bold text-text leading-tight">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 3. Resource Data Layout */}
                    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
                        
                        {/* Header: Tools, Search, View Toggle */}
                        <div className="border-b border-border p-4 bg-surface-muted/30 flex flex-col sm:flex-row gap-4 justify-between items-center">
                            
                            {/* Left: Selection Tools */}
                            <div className="flex items-center gap-2">
                                <button onClick={selectAll} className="text-xs font-medium text-text-muted hover:text-text px-2 py-1 rounded bg-surface border border-border shadow-sm transition-colors">
                                    {t.selection.all}
                                </button>
                                <button onClick={selectNone} className="text-xs font-medium text-text-muted hover:text-text px-2 py-1 rounded bg-surface border border-border shadow-sm transition-colors">
                                    {t.selection.none}
                                </button>
                                <button onClick={invertSelection} className="text-xs font-medium text-text-muted hover:text-text px-2 py-1 rounded bg-surface border border-border shadow-sm transition-colors">
                                    {t.selection.invert}
                                </button>
                                {selectedItems.length > 0 && (
                                    <span className="text-xs font-bold text-primary px-2 bg-primary/10 rounded-full py-0.5">
                                        {selectedItems.length} {lang === 'ar' ? 'محدد' : 'Selected'}
                                    </span>
                                )}
                            </div>

                            {/* Right: Search & View Modes */}
                            <div className="flex items-center gap-3 w-full sm:w-auto">
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

                                <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
                                    <button 
                                        onClick={() => setViewMode('grid')}
                                        className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-surface-muted text-primary shadow-sm" : "text-text-muted hover:text-text")}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => setViewMode('list')}
                                        className={cn("p-1.5 rounded-md transition-colors", viewMode === 'list' ? "bg-surface-muted text-primary shadow-sm" : "text-text-muted hover:text-text")}
                                    >
                                        <ListIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body: Data Presentation */}
                        <div className="flex-1 bg-surface p-0 min-h-[400px]">
                            {customers.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-text-muted py-20">
                                    <UsersRound className="h-12 w-12 opacity-20 mb-4" />
                                    <p className="text-lg font-medium">{lang === 'ar' ? 'لم يتم العثور على عملاء' : 'No customers found'}</p>
                                </div>
                            ) : viewMode === 'list' ? (
                                /* List View */
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-surface-muted/50">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-start w-12">
                                                    <div className="flex items-center">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={selectedItems.length === customers.data.length && customers.data.length > 0}
                                                            onChange={selectedItems.length === customers.data.length ? selectNone : selectAll}
                                                            className="rounded border-border text-primary focus:ring-primary h-4 w-4" 
                                                        />
                                                    </div>
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {t.columns.code}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {t.columns.name}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {t.columns.contact}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {t.columns.tax}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {t.columns.status}
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-text-muted">
                                                    {t.columns.actions}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border bg-surface">
                                            {customers.data.map((customer) => (
                                                <tr
                                                    key={customer.id}
                                                    className={`transition-colors hover:bg-surface-muted/50 ${selectedItems.includes(customer.id) ? 'bg-primary/5' : ''}`}
                                                >
                                                    <td className="px-4 py-3 w-12">
                                                        <input type="checkbox" checked={selectedItems.includes(customer.id)} onChange={() => toggleSelection(customer.id)} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[12px] font-bold text-text" dir="ltr">
                                                        {customer.s_number}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                                                <UsersRound className="h-3.5 w-3.5" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[12px] font-semibold text-text">{customer.name}</div>
                                                                <div className="text-[10px] text-text-muted">{customer.category?.name_ar ?? '-'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <div className="text-[12px] text-text font-medium" dir="ltr">{customer.phone_number}</div>
                                                        <div className="text-[10px] text-text-muted mt-0.5">{customer.email || '-'}</div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-text">
                                                        {customer.vat_number || customer.id_number || '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${customer.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                            {t.status[customer.status] ?? customer.status}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-end">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Tooltip text={lang === 'ar' ? 'عرض' : 'View'}>
                                                                <a href={route('customers.show', customer.id)} className="p-1.5 rounded-md text-text-muted hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors inline-flex">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </a>
                                                            </Tooltip>
                                                            <Tooltip text={lang === 'ar' ? 'تعديل' : 'Edit'}>
                                                                <button onClick={() => openEditModal(customer)} className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors">
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tooltip>
                                                            <Tooltip text={lang === 'ar' ? 'حذف' : 'Delete'} placement="top">
                                                                <button onClick={() => openDeleteModal(customer)} className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </Tooltip>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                /* Grid View */
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                    {customers.data.map((customer) => (
                                        <div 
                                            key={customer.id} 
                                            className={cn(
                                                "border border-border rounded-xl p-4 flex flex-col gap-4 relative transition-shadow hover:shadow-md cursor-pointer",
                                                selectedItems.includes(customer.id) ? "ring-2 ring-primary bg-primary/5" : "bg-surface"
                                            )}
                                            onClick={() => toggleSelection(customer.id)}
                                        >
                                            <div className="absolute top-4 end-4 flex items-center gap-2">
                                                <Dropdown>
                                                    <Dropdown.Trigger>
                                                        <button onClick={(e) => e.stopPropagation()} className="text-text-muted hover:text-primary transition-colors p-1 rounded-md bg-surface border border-border shadow-sm">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </button>
                                                    </Dropdown.Trigger>
                                                    <Dropdown.Content align={lang === 'ar' ? 'left' : 'right'}>
                                                        <button onClick={(e) => { e.stopPropagation(); openEditModal(customer); }} className="w-full text-start flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-muted transition-colors text-text">
                                                            <Edit className="h-4 w-4" />
                                                            {lang === 'ar' ? 'تعديل' : 'Edit'}
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); openDeleteModal(customer); }} className="w-full text-start flex items-center gap-2 px-4 py-2 text-sm hover:bg-surface-muted transition-colors text-danger">
                                                            <Trash2 className="h-4 w-4" />
                                                            {lang === 'ar' ? 'حذف' : 'Delete'}
                                                        </button>
                                                    </Dropdown.Content>
                                                </Dropdown>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(customer.id)}
                                                    onChange={() => {}} // handled by parent onClick
                                                    className="rounded border-border text-primary focus:ring-primary h-5 w-5 pointer-events-none" 
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <UsersRound className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-text text-base">{customer.name}</h3>
                                                    <p className="text-xs text-text-muted">{customer.s_number}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-text-muted">{lang === 'ar' ? 'الهاتف:' : 'Phone:'}</span>
                                                    <span className="font-medium text-text">{customer.phone_number}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-text-muted">{lang === 'ar' ? 'البريد:' : 'Email:'}</span>
                                                    <span className="font-medium text-text">{customer.email || '-'}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                                                    <span className="text-text-muted">{lang === 'ar' ? 'الحالة:' : 'Status:'}</span>
                                                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold",
                                                        customer.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                                                    )}>
                                                        {t.status[customer.status]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer: Pagination */}
                        <Pagination 
                            links={customers.links} 
                            total={customers.total} 
                            from={customers.from} 
                            to={customers.to} 
                        />
                    </div>
                </div>
            </div>

            {/* Form Modal */}
            <Modal show={isFormModalOpen} onClose={closeModals} maxWidth="2xl">
                <form onSubmit={submitForm} className="p-6">
                    <h2 className="text-lg font-bold text-text mb-6">
                        {customerToEdit ? (lang === 'ar' ? 'تعديل العميل' : 'Edit Customer') : (lang === 'ar' ? 'إضافة عميل جديد' : 'Add New Customer')}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Row 1 */}
                        <div>
                            <InputLabel htmlFor="name" value={lang === 'ar' ? 'الاسم' : 'Name'} />
                            <TextInput id="name" type="text" className="mt-1 block w-full" value={data.name} onChange={e => setData('name', e.target.value)} required autoFocus />
                            <InputError message={errors.name} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="foreign_name" value={lang === 'ar' ? 'الاسم بلغة أخرى' : 'Foreign Name'} />
                            <TextInput id="foreign_name" type="text" className="mt-1 block w-full" value={data.foreign_name} onChange={e => setData('foreign_name', e.target.value)} />
                            <InputError message={errors.foreign_name} className="mt-1" />
                        </div>

                        {/* Row 2 */}
                        {(() => {
                            const parentCategories = categories.filter(c => !c.parent_id);
                            const subCategories = categories.filter(c => c.parent_id == data.parent_category_id);
                            return (
                                <>
                                    <div>
                                        <InputLabel htmlFor="parent_category_id" value={lang === 'ar' ? 'التصنيف الرئيسي' : 'Main Category'} />
                                        <select 
                                            id="parent_category_id"
                                            className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            value={data.parent_category_id}
                                            onChange={e => {
                                                setData(data => ({
                                                    ...data,
                                                    parent_category_id: e.target.value,
                                                    category_id: '' // reset sub-category
                                                }));
                                            }}
                                            required
                                        >
                                            <option value="">{lang === 'ar' ? '-- اختر التصنيف --' : '-- Select Category --'}</option>
                                            {parentCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {lang === 'ar' ? cat.name_ar : cat.name_en}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="category_id" value={lang === 'ar' ? 'التصنيف الفرعي' : 'Sub Category'} />
                                        <select 
                                            id="category_id"
                                            className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:opacity-50"
                                            value={data.category_id}
                                            onChange={e => setData('category_id', e.target.value)}
                                            required
                                            disabled={!data.parent_category_id}
                                        >
                                            <option value="">{lang === 'ar' ? '-- اختر التصنيف الفرعي --' : '-- Select Sub Category --'}</option>
                                            {subCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>
                                                    {lang === 'ar' ? cat.name_ar : cat.name_en}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.category_id} className="mt-1" />
                                    </div>
                                </>
                            );
                        })()}

                        {/* Row 3 */}
                        <div>
                            <InputLabel htmlFor="s_number" value={lang === 'ar' ? 'مسلسل' : 'Serial Number'} />
                            <TextInput id="s_number" type="text" className="mt-1 block w-full bg-surface-muted text-text-muted cursor-not-allowed" value={customerToEdit ? customerToEdit.s_number : '10014000xx'} readOnly disabled dir="ltr" />
                        </div>
                        <div>
                            <InputLabel htmlFor="country_id" value={lang === 'ar' ? 'الجنسية / الدولة' : 'Nationality / Country'} />
                            <select 
                                id="country_id"
                                className="mt-1 block w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                value={data.country_id}
                                onChange={e => setData('country_id', e.target.value)}
                                required
                            >
                                <option value="">{lang === 'ar' ? '-- اختر --' : '-- Select --'}</option>
                                {countries.map(country => (
                                    <option key={country.id} value={country.id}>
                                        {lang === 'ar' ? country.name_ar : country.name_en}
                                    </option>
                                ))}
                            </select>
                            <InputError message={errors.country_id} className="mt-1" />
                        </div>

                        {/* Row 4 */}
                        <div>
                            <InputLabel htmlFor="phone_number" value={lang === 'ar' ? 'الهاتف' : 'Phone Number'} />
                            <TextInput id="phone_number" type="text" className="mt-1 block w-full text-left" value={data.phone_number} onChange={e => setData('phone_number', e.target.value)} required dir="ltr" />
                            <InputError message={errors.phone_number} className="mt-1" />
                        </div>

                        {/* Conditional Fields based on Parent Category */}
                        {(() => {
                            if (!data.parent_category_id) return null;
                            const parentCat = categories.find(c => c.id == data.parent_category_id);
                            if (!parentCat) return null;
                            const isIndividual = parentCat.name_ar.includes('أفراد') || parentCat.name_ar.includes('فردي') || parentCat.name_en.toLowerCase().includes('individual');
                            
                            if (isIndividual) {
                                return (
                                    <div>
                                        <InputLabel htmlFor="id_number" value={lang === 'ar' ? 'الهوية/الإقامة' : 'ID/Iqama Number'} />
                                        <TextInput id="id_number" type="text" className="mt-1 block w-full text-left" value={data.id_number} onChange={e => setData('id_number', e.target.value)} dir="ltr" />
                                        <InputError message={errors.id_number} className="mt-1" />
                                    </div>
                                );
                            } else {
                                return (
                                    <>
                                        <div>
                                            <InputLabel htmlFor="email" value={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} />
                                            <TextInput id="email" type="email" className="mt-1 block w-full text-left" value={data.email} onChange={e => setData('email', e.target.value)} dir="ltr" />
                                            <InputError message={errors.email} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="website" value={lang === 'ar' ? 'الموقع الإلكتروني' : 'Website'} />
                                            <TextInput id="website" type="text" className="mt-1 block w-full text-left" value={data.website} onChange={e => setData('website', e.target.value)} dir="ltr" />
                                            <InputError message={errors.website} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="cr_number" value={lang === 'ar' ? 'السجل التجاري' : 'CR Number'} />
                                            <TextInput id="cr_number" type="text" className="mt-1 block w-full text-left" value={data.cr_number} onChange={e => setData('cr_number', e.target.value)} dir="ltr" />
                                            <InputError message={errors.cr_number} className="mt-1" />
                                        </div>
                                        <div>
                                            <InputLabel htmlFor="vat_number" value={lang === 'ar' ? 'الرقم الضريبي' : 'VAT Number'} />
                                            <TextInput id="vat_number" type="text" className="mt-1 block w-full text-left" value={data.vat_number} onChange={e => setData('vat_number', e.target.value)} dir="ltr" />
                                            <InputError message={errors.vat_number} className="mt-1" />
                                        </div>
                                        <div className="col-span-1 md:col-span-2">
                                            <InputLabel htmlFor="address" value={lang === 'ar' ? 'العنوان الوطني' : 'National Address'} />
                                            <TextInput id="address" type="text" className="mt-1 block w-full" value={data.address} onChange={e => setData('address', e.target.value)} />
                                            <InputError message={errors.address} className="mt-1" />
                                        </div>
                                    </>
                                );
                            }
                        })()}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border flex justify-end gap-3">
                        <SecondaryButton onClick={closeModals}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
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
                        {lang === 'ar' ? 'هل أنت متأكد من حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this customer? This action cannot be undone.'}
                    </p>
                    <div className="flex justify-center gap-3">
                        <SecondaryButton onClick={closeModals}>{lang === 'ar' ? 'إلغاء' : 'Cancel'}</SecondaryButton>
                        <DangerButton onClick={deleteCustomer} disabled={processing}>{lang === 'ar' ? 'حذف' : 'Delete'}</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
