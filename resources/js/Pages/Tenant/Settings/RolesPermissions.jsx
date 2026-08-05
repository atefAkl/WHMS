import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Shield,
    Home,
    ChevronRight,
    Key,
    X,
    Users,
    Save,
    XCircle,
    CheckCircle2,
    Plus,
    Edit2,
    Trash2,
    UserCheck
} from "lucide-react";
import Modal from "@/Components/Modal";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";

export default function RolesPermissions({ users, isManager, roles }) {
    const { lang } = useLang();
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState("roles"); // "roles" or "users"
    const [searchQuery, setSearchQuery] = useState("");

    // Modals visibility states
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    // Forms
    const addRoleForm = useForm({
        name: "",
        permissions: []
    });

    const editRoleForm = useForm({
        name: "",
        permissions: []
    });

    const deleteRoleForm = useForm();

    const handleSearch = (e) => setSearchQuery(e.target.value);

    // System Permissions Grouping
    const systemPermissions = [
        {
            group: lang === "ar" ? "العقود والعملاء" : "Contracts & Customers",
            items: [
                { key: "contracts.view", name: lang === "ar" ? "عرض العقود" : "View Contracts" },
                { key: "contracts.create", name: lang === "ar" ? "إنشاء العقود" : "Create Contracts" },
                { key: "contracts.edit", name: lang === "ar" ? "تعديل العقود" : "Edit Contracts" },
                { key: "contracts.delete", name: lang === "ar" ? "حذف العقود" : "Delete Contracts" },
                { key: "contracts.activate", name: lang === "ar" ? "تفعيل وتجميد العقود" : "Activate Contracts" },
                { key: "customers.view", name: lang === "ar" ? "عرض العملاء" : "View Customers" },
                { key: "customers.create", name: lang === "ar" ? "إضافة عملاء" : "Create Customers" },
                { key: "customers.edit", name: lang === "ar" ? "تعديل عملاء" : "Edit Customers" },
                { key: "customers.delete", name: lang === "ar" ? "حذف عملاء" : "Delete Customers" },
            ]
        },
        {
            group: lang === "ar" ? "العمليات المخزنية والطبالي" : "Warehouse & Pallets",
            items: [
                { key: "pallets.view", name: lang === "ar" ? "عرض الطبالي" : "View Pallets" },
                { key: "pallets.create", name: lang === "ar" ? "تخزين وإضافة طبالي" : "Store Pallets" },
                { key: "pallets.edit", name: lang === "ar" ? "تعديل طبالي" : "Edit Pallets" },
                { key: "pallets.delete", name: lang === "ar" ? "حذف طبالي" : "Delete Pallets" },
                { key: "inventory-items.view", name: lang === "ar" ? "عرض الأصناف المخزنية" : "View Inventory Items" },
                { key: "inventory-items.create", name: lang === "ar" ? "إضافة أصناف مخزنية" : "Create Inventory Items" },
                { key: "inventory-items.edit", name: lang === "ar" ? "تعديل أصناف مخزنية" : "Edit Inventory Items" },
                { key: "inventory-items.delete", name: lang === "ar" ? "حذف أصناف مخزنية" : "Delete Inventory Items" },
            ]
        },
        {
            group: lang === "ar" ? "المستندات وسندات الحركة" : "Vouchers & Permits",
            items: [
                { key: "receptions.view", name: lang === "ar" ? "عرض سندات الاستلام" : "View Receptions" },
                { key: "receptions.create", name: lang === "ar" ? "إنشاء سندات استلام" : "Create Receptions" },
                { key: "receptions.edit", name: lang === "ar" ? "تعديل سندات استلام" : "Edit Receptions" },
                { key: "receptions.delete", name: lang === "ar" ? "حذف سندات استلام" : "Delete Receptions" },
                { key: "receptions.approve", name: lang === "ar" ? "اعتماد وترحيل سندات استلام" : "Approve Receptions" },
                { key: "exit_authorizations.view", name: lang === "ar" ? "عرض أذونات الخروج" : "View Exit Permits" },
                { key: "exit_authorizations.create", name: lang === "ar" ? "إنشاء أذونات خروج" : "Create Exit Permits" },
                { key: "exit_authorizations.edit", name: lang === "ar" ? "تعديل أذونات خروج" : "Edit Exit Permits" },
                { key: "exit_authorizations.delete", name: lang === "ar" ? "حذف أذونات خروج" : "Delete Exit Permits" },
                { key: "exit_authorizations.approve", name: lang === "ar" ? "اعتماد أذونات خروج" : "Approve Exit Permits" },
                { key: "deliveries.view", name: lang === "ar" ? "عرض سندات التسليم" : "View Deliveries" },
                { key: "deliveries.create", name: lang === "ar" ? "إنشاء سندات تسليم" : "Create Deliveries" },
                { key: "deliveries.edit", name: lang === "ar" ? "تعديل سندات تسليم" : "Edit Deliveries" },
                { key: "deliveries.delete", name: lang === "ar" ? "حذف سندات تسليم" : "Delete Deliveries" },
                { key: "deliveries.approve", name: lang === "ar" ? "اعتماد وترحيل سندات تسليم" : "Approve Deliveries" },
            ]
        },
        {
            group: lang === "ar" ? "الحسابات وإعدادات النظام" : "Accounting & Settings",
            items: [
                { key: "accounting.view", name: lang === "ar" ? "عرض اللوحة المالية والتقارير" : "View Financial Board" },
                { key: "accounting.create", name: lang === "ar" ? "إنشاء قيود يومية وسندات" : "Create Journal Entries" },
                { key: "accounting.edit", name: lang === "ar" ? "تعديل قيود وسندات" : "Edit Journal Entries" },
                { key: "accounting.delete", name: lang === "ar" ? "حذف قيود وسندات" : "Delete Journal Entries" },
                { key: "accounting.approve", name: lang === "ar" ? "اعتماد وترحيل القيود والسندات" : "Post Journal Entries" },
                { key: "settings.view", name: lang === "ar" ? "عرض إعدادات الثلاجة العامة" : "View Settings" },
                { key: "settings.edit", name: lang === "ar" ? "تعديل الإعدادات والمواسم" : "Edit Settings" },
                { key: "employees.view", name: lang === "ar" ? "عرض الموظفين" : "View Staff" },
                { key: "employees.create", name: lang === "ar" ? "إضافة موظفين وإدارة صلاحياتهم" : "Manage Staff & Permissions" },
            ]
        }
    ];

    const getFilteredUsers = () => {
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // ── Roles CRUD Handlers ─────────────────────────────────────
    const openAddRoleModal = () => {
        addRoleForm.reset();
        addRoleForm.clearErrors();
        setShowAddRoleModal(true);
    };

    const handleAddRoleSubmit = (e) => {
        e.preventDefault();
        addRoleForm.post(route("settings.roles.store"), {
            onSuccess: () => {
                setShowAddRoleModal(false);
                addRoleForm.reset();
            }
        });
    };

    const openEditRoleModal = (role) => {
        setSelectedRole(role);
        editRoleForm.setData({
            name: role.name,
            permissions: role.permissions || []
        });
        editRoleForm.clearErrors();
        setShowEditRoleModal(true);
    };

    const handleEditRoleSubmit = (e) => {
        e.preventDefault();
        editRoleForm.put(route("settings.roles.update", selectedRole.id), {
            onSuccess: () => {
                setShowEditRoleModal(false);
            }
        });
    };

    const handleDeleteRole = (role) => {
        if (confirm(lang === "ar" ? `هل أنت متأكد من حذف دور "${role.name}"؟` : `Are you sure you want to delete "${role.name}"?`)) {
            deleteRoleForm.delete(route("settings.roles.destroy", role.id));
        }
    };

    const togglePermission = (form, setForm, key) => {
        const current = [...form.data.permissions];
        if (current.includes(key)) {
            setForm("permissions", current.filter(k => k !== key));
        } else {
            setForm("permissions", [...current, key]);
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <Link href={route("settings.index")} className="hover:text-primary transition-colors">
                {lang === "ar" ? "إعدادات النظام" : "System Settings"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <span className="text-primary font-medium">{lang === "ar" ? "إدارة الأدوار والصلاحيات" : "Roles & Permissions"}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "الأدوار والصلاحيات" : "Roles & Permissions"} />

            <div className="pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Alerts */}
                    {flash?.success && (
                        <div className="border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-center gap-2 rounded-xl">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            <span className="text-sm font-bold">{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-center gap-2 rounded-xl">
                            <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                            <span className="text-sm font-bold">{flash.error}</span>
                        </div>
                    )}

                    {/* Page Header */}
                    <PageHeader
                        icon={Shield}
                        title={lang === "ar" ? "إدارة الأدوار والصلاحيات" : "Roles & Permissions"}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {lang === "ar"
                                    ? "لوحة تحكم مركزية لإنشاء الأدوار الوظيفية، تحديد صلاحياتها، وتعيينها لموظفي الثلاجة."
                                    : "Define staff responsibilities, assign system roles, and configure granular permissions."}
                            </p>
                        }
                    />

                    {/* Tab Switcher */}
                    <div className="border-b border-border flex gap-4">
                        <button
                            onClick={() => setActiveTab("roles")}
                            className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${activeTab === "roles" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"}`}
                        >
                            {lang === "ar" ? "إدارة الأدوار وصلاحياتها" : "Roles & Access Rights"}
                        </button>
                        <button
                            onClick={() => setActiveTab("users")}
                            className={`pb-2.5 text-sm font-bold border-b-2 transition-all ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text"}`}
                        >
                            {lang === "ar" ? "أدوار الموظفين والمستخدمين" : "Staff Roles"}
                        </button>
                    </div>

                    {/* TAB 1: Roles Management */}
                    {activeTab === "roles" && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold text-text-muted">
                                    {lang === "ar" ? "الأدوار الوظيفية المسجلة حالياً:" : "Current active roles:"}
                                </h3>
                                <PrimaryButton onClick={openAddRoleModal}>
                                    <Plus className="h-4 w-4 me-1.5" />
                                    {lang === "ar" ? "إنشاء دور جديد" : "Create Role"}
                                </PrimaryButton>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roles.map((role) => (
                                    <div key={role.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-text text-sm flex items-center gap-1.5">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                    {role.name}
                                                </h4>
                                                <span className="px-2 py-0.5 bg-surface-muted border border-border rounded text-[10px] font-bold text-text-muted">
                                                    {lang === "ar" 
                                                        ? `${role.permissions.length} صلاحية` 
                                                        : `${role.permissions.length} permissions`}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-muted leading-relaxed">
                                                {role.name === "Super Admin"
                                                    ? (lang === "ar" ? "يتمتع بجميع الصلاحيات الإدارية وتشغيل النظام دون أي قيود." : "Full administrative permission to access all modules.")
                                                    : (lang === "ar" ? "دور مخصص بعمليات وإجراءات معينة بالثلاجة." : "Custom operational role within the warehouse.")}
                                            </p>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-3 border-t border-border">
                                            {role.name !== "Super Admin" ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditRoleModal(role)}
                                                        className="p-1.5 hover:bg-primary/10 text-text-muted hover:text-primary rounded-lg transition-colors"
                                                        title={lang === "ar" ? "تعديل الدور" : "Edit Role"}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteRole(role)}
                                                        className="p-1.5 hover:bg-rose-50 text-text-muted hover:text-rose-600 rounded-lg transition-colors"
                                                        title={lang === "ar" ? "حذف الدور" : "Delete Role"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-[10px] text-primary font-bold">
                                                    {lang === "ar" ? "دور أساسي محمي" : "Core Role Protected"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Users Roles List */}
                    {activeTab === "users" && (
                        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden space-y-4">
                            <div className="p-4 border-b border-border bg-surface-muted/20 flex items-center justify-between">
                                <div className="relative w-72">
                                    <input
                                        type="text"
                                        placeholder={lang === "ar" ? "بحث بالاسم، الدور الوظيفي..." : "Search..."}
                                        value={searchQuery}
                                        onChange={handleSearch}
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-surface-muted/50 text-[11px] font-bold text-text-muted uppercase">
                                        <tr>
                                            <th className="py-3.5 px-6 text-right">{lang === "ar" ? "الموظف" : "Staff"}</th>
                                            <th className="py-3.5 px-6 text-right">{lang === "ar" ? "المسمى الإداري" : "Title"}</th>
                                            <th className="py-3.5 px-6 text-right">{lang === "ar" ? "أدوار الصلاحيات" : "Assigned Roles"}</th>
                                            <th className="py-3.5 px-6 text-left">{lang === "ar" ? "الإجراءات" : "Actions"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {getFilteredUsers().map((user) => (
                                            <tr key={user.id} className="hover:bg-surface-muted/30 transition-colors">
                                                <td className="py-3 px-6">
                                                    <div>
                                                        <p className="font-bold text-text text-sm">{user.name}</p>
                                                        <p className="text-xs text-text-muted mt-0.5">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6">
                                                    <span className="text-xs text-text-muted font-bold">
                                                        {user.job_title || (lang === "ar" ? "غير محدد" : "Not Set")}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${user.is_manager ? "bg-primary/5 text-primary border-primary/10" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                                                        {user.role || (lang === "ar" ? "بدون دور" : "No Role")}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <Link
                                                        href={route("employees.show", user.id)}
                                                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-1.5 inline-flex"
                                                    >
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        {lang === "ar" ? "إدارة الحساب والأدوار" : "Manage Account & Roles"}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>

                {/* Modal: Add Role */}
                <Modal show={showAddRoleModal} onClose={() => setShowAddRoleModal(false)} maxWidth="2xl">
                    <form onSubmit={handleAddRoleSubmit} className="p-6 space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-bold text-lg text-text">
                                {lang === "ar" ? "إنشاء دور وظيفي جديد" : "Create New Role"}
                            </h3>
                            <button type="button" onClick={() => setShowAddRoleModal(false)} className="text-text-muted hover:text-text">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "اسم الدور (مثال: أمين خزنة)" : "Role Name"}</label>
                                <input
                                    type="text"
                                    required
                                    value={addRoleForm.data.name}
                                    onChange={(e) => addRoleForm.setData("name", e.target.value)}
                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                />
                                {addRoleForm.errors.name && <p className="text-xs text-rose-600 mt-1">{addRoleForm.errors.name}</p>}
                            </div>

                            <div className="border-t border-border pt-4">
                                <label className="block text-xs font-bold text-text-muted mb-2">{lang === "ar" ? "صلاحيات الوصول الممنوحة للدور:" : "Grant permissions to this role:"}</label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                                    {systemPermissions.map((group, gIdx) => (
                                        <div key={gIdx} className="border border-border rounded-xl p-3 bg-surface-muted/10 space-y-2">
                                            <h4 className="text-xs font-black text-text border-b border-border pb-1.5 flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                                                {group.group}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {group.items.map((item) => {
                                                    const isChecked = addRoleForm.data.permissions.includes(item.key);
                                                    return (
                                                        <label key={item.key} className="flex items-center gap-2 py-1 px-1.5 hover:bg-white rounded border border-transparent hover:border-border transition-all cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => togglePermission(addRoleForm, addRoleForm.setData, item.key)}
                                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                            />
                                                            <span className="text-xs font-bold text-text-muted hover:text-text">{item.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-border">
                            <SecondaryButton type="button" onClick={() => setShowAddRoleModal(false)}>
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={addRoleForm.processing}>
                                <Save className="h-4 w-4 me-1.5" />
                                {lang === "ar" ? "حفظ الدور" : "Save Role"}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>

                {/* Modal: Edit Role */}
                <Modal show={showEditRoleModal} onClose={() => setShowEditRoleModal(false)} maxWidth="2xl">
                    <form onSubmit={handleEditRoleSubmit} className="p-6 space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-bold text-lg text-text">
                                {lang === "ar" ? `تعديل صلاحيات الدور: ${selectedRole?.name}` : `Edit Role: ${selectedRole?.name}`}
                            </h3>
                            <button type="button" onClick={() => setShowEditRoleModal(false)} className="text-text-muted hover:text-text">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "اسم الدور" : "Role Name"}</label>
                                <input
                                    type="text"
                                    required
                                    value={editRoleForm.data.name}
                                    onChange={(e) => editRoleForm.setData("name", e.target.value)}
                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                />
                                {editRoleForm.errors.name && <p className="text-xs text-rose-600 mt-1">{editRoleForm.errors.name}</p>}
                            </div>

                            <div className="border-t border-border pt-4">
                                <label className="block text-xs font-bold text-text-muted mb-2">{lang === "ar" ? "تعديل صلاحيات الوصول الممنوحة للدور:" : "Update permissions assigned to this role:"}</label>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                                    {systemPermissions.map((group, gIdx) => (
                                        <div key={gIdx} className="border border-border rounded-xl p-3 bg-surface-muted/10 space-y-2">
                                            <h4 className="text-xs font-black text-text border-b border-border pb-1.5 flex items-center gap-1.5">
                                                <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                                                {group.group}
                                            </h4>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {group.items.map((item) => {
                                                    const isChecked = editRoleForm.data.permissions.includes(item.key);
                                                    return (
                                                        <label key={item.key} className="flex items-center gap-2 py-1 px-1.5 hover:bg-white rounded border border-transparent hover:border-border transition-all cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => togglePermission(editRoleForm, editRoleForm.setData, item.key)}
                                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                                            />
                                                            <span className="text-xs font-bold text-text-muted hover:text-text">{item.name}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4 border-t border-border">
                            <SecondaryButton type="button" onClick={() => setShowEditRoleModal(false)}>
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                            </SecondaryButton>
                            <PrimaryButton type="submit" disabled={editRoleForm.processing}>
                                <Save className="h-4 w-4 me-1.5" />
                                {lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>

            </div>
        </AuthenticatedLayout>
    );
}
