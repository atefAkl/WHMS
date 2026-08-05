import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Users,
    Key,
    Edit,
    Trash2,
    Search,
    Plus,
    Mail,
    Phone,
    ShieldAlert,
    Eye,
    EyeOff,
    Home,
    ChevronRight,
    Briefcase,
    Lock,
    Save,
    XCircle,
    CheckCircle2,
    UserCheck2,
    Calendar,
    Shield
} from "lucide-react";
import Modal from "@/Components/Modal";
import ConfirmationModal from "@/Components/ConfirmationModal";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import PageHeader from "@/Components/PageHeader";

export default function Index({ managers, employees, isManager, roles = [] }) {
    const { lang } = useLang();
    const { flash } = usePage().props;
    const showButtonText = usePage().props.auth.user?.preferences?.show_button_text ?? false;
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("employees"); // "employees" or "managers"
    
    // Modals visibility states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showPermissionsModal, setShowPermissionsModal] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    
    // UI Local Form States
    const [addAccountType, setAddAccountType] = useState("employee"); // "employee" or "manager"
    const [addJobSelect, setAddJobSelect] = useState("أمين مستودع");
    const [addCustomJob, setAddCustomJob] = useState("");
    
    const [editAccountType, setEditAccountType] = useState("employee");
    const [editJobSelect, setEditJobSelect] = useState("أمين مستودع");
    const [editCustomJob, setEditCustomJob] = useState("");

    const [confirmModal, setConfirmModal] = useState({
        show: false,
        title: "",
        message: "",
        confirmLabel: "",
        cancelLabel: "",
        onConfirm: () => {},
        type: "warning",
    });

    // Preset Job Titles
    const managerPresets = [
        "مدير عام",
        "مدير تشغيل",
        "مشرف مالي",
        "مسؤول نظام",
        "أخرى"
    ];

    const employeePresets = [
        "أمين مستودع",
        "محاسب",
        "عامل مستودع",
        "مشرف جودة",
        "سائق",
        "أخرى"
    ];

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

    // Gather all keys for quick "Select All"
    const allPermissionKeys = systemPermissions.flatMap(g => g.items.map(i => i.key));

    // Forms
    const addForm = useForm({
        name: "",
        username: "",
        email: "",
        phone: "",
        id_number: "",
        job_title: "",
        is_admin: false,
        role: "",
        password: "",
        avatar: null,
    });

    const editForm = useForm({
        name: "",
        username: "",
        email: "",
        phone: "",
        id_number: "",
        job_title: "",
        is_admin: false,
        role: "",
        avatar: null,
        _method: 'PUT'
    });

    const passwordForm = useForm({
        password: "",
        password_confirmation: "",
    });

    const permissionsForm = useForm({
        permissions: []
    });

    const deleteForm = useForm();

    const handleSearch = (e) => setSearchQuery(e.target.value);

    const getFilteredList = () => {
        const list = activeTab === "employees" ? employees : managers;
        return list.filter(
            (u) =>
                (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.job_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    // Open Add Modal
    const openAddModal = () => {
        setAddAccountType("employee");
        setAddJobSelect("أمين مستودع");
        setAddCustomJob("");
        addForm.reset();
        addForm.clearErrors();
        setShowAddModal(true);
    };

    // Store user
    const handleAddSubmit = (e) => {
        e.preventDefault();
        
        addForm.transform((data) => ({
            ...data,
            account_type: addAccountType,
            job_title: addJobSelect === "أخرى" ? addCustomJob : addJobSelect,
            is_admin: addAccountType === "user" ? (data.is_admin ? 1 : 0) : 0,
        }));

        addForm.post(route("employees.store"), {
            onSuccess: () => {
                setShowAddModal(false);
                addForm.reset();
            },
        });
    };

    // Open Edit Modal
    const openEditModal = (user) => {
        setSelectedUser(user);
        
        const isUserManager = managers.some(m => m.id === user.id) || user.is_admin;
        const currentType = isUserManager ? "manager" : "employee";
        const presets = isUserManager ? managerPresets : employeePresets;
        
        setEditAccountType(currentType);
        if (presets.includes(user.job_title)) {
            setEditJobSelect(user.job_title);
            setEditCustomJob("");
        } else {
            setEditJobSelect("أخرى");
            setEditCustomJob(user.job_title);
        }

        editForm.setData({
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone || "",
            id_number: user.id_number || "",
            job_title: user.job_title || "",
            is_admin: isUserManager,
            role: user.role || "",
            avatar: null,
            _method: 'PUT'
        });
        editForm.clearErrors();
        setShowEditModal(true);
    };

    // Update user
    const handleEditSubmit = (e) => {
        e.preventDefault();
        
        editForm.transform((data) => ({
            ...data,
            job_title: editJobSelect === "أخرى" ? editCustomJob : editJobSelect,
            is_admin: editAccountType === "manager" ? 1 : 0,
            role: editAccountType === "manager" ? "Super Admin" : data.role,
        }));

        editForm.post(route("employees.update", selectedUser.id), {
            onSuccess: () => {
                setShowEditModal(false);
            },
        });
    };

    // Open Password Modal
    const openPasswordModal = (user) => {
        setSelectedUser(user);
        passwordForm.reset();
        passwordForm.clearErrors();
        setShowPasswordModal(true);
    };

    // Update Password
    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put(route("employees.password.update", selectedUser.id), {
            onSuccess: () => {
                setShowPasswordModal(false);
            },
        });
    };

    // Open Permissions Modal
    const openPermissionsModal = (user) => {
        setSelectedUser(user);
        
        const isTargetManager = managers.some(m => m.id === user.id);
        const currentPermissions = isTargetManager 
            ? allPermissionKeys
            : (user.preferences?.permissions || [
                'contracts.view',
                'customers.view',
                'pallets.view',
                'receptions.view',
                'exit_authorizations.view',
                'deliveries.view'
              ]);
              
        permissionsForm.setData("permissions", currentPermissions);
        permissionsForm.clearErrors();
        setShowPermissionsModal(true);
    };

    // Save Permissions
    const handlePermissionsSubmit = (e) => {
        e.preventDefault();
        
        permissionsForm.put(route("employees.permissions.update", selectedUser.id), {
            onSuccess: () => {
                setShowPermissionsModal(false);
            }
        });
    };

    // Toggle single checkbox
    const handlePermissionToggle = (key) => {
        const current = [...permissionsForm.data.permissions];
        if (current.includes(key)) {
            permissionsForm.setData("permissions", current.filter(k => k !== key));
        } else {
            permissionsForm.setData("permissions", [...current, key]);
        }
    };

    // Delete user confirm
    const handleDeleteUser = (user) => {
        setConfirmModal({
            show: true,
            title: lang === "ar" ? "حذف الموظف" : "Delete Employee",
            message: lang === "ar" 
                ? `هل أنت متأكد من حذف الموظف "${user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete employee "${user.name}"? This action cannot be undone.`,
            confirmLabel: lang === "ar" ? "نعم، احذف الموظف" : "Yes, Delete",
            cancelLabel: lang === "ar" ? "إلغاء" : "Cancel",
            type: "danger",
            onConfirm: () => {
                deleteForm.delete(route("employees.destroy", user.id), {
                    onFinish: () => setConfirmModal((prev) => ({ ...prev, show: false })),
                });
            },
        });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-text-muted">
                {lang === "ar" ? "الموارد البشرية" : "Human Resources"}
            </span>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
            <span className="text-primary font-bold">
                {lang === "ar" ? "الموظفون" : "Employees"}
            </span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === "ar" ? "إدارة الموظفين" : "Employee Management"} />

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
                        icon={Users}
                        title={lang === "ar" ? "إدارة الموظفين والصلاحيات" : "Staff & Permissions"}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {lang === "ar"
                                    ? "إدارة حسابات العاملين وتوزيع صلاحيات تشغيل الفواتير والعمليات المخزنية."
                                    : "Manage staff accounts and distribute operation and billing access privileges."}
                            </p>
                        }
                        actions={
                            <div className="flex items-center gap-3">
                                <div className="flex bg-surface-muted p-0.5 rounded-lg border border-border">
                                    <button
                                        onClick={() => setActiveTab("employees")}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "employees" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text"}`}
                                    >
                                        <Briefcase className="h-3.5 w-3.5" />
                                        {lang === "ar" ? "موظف" : "Staff"}
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
                                            {employees.length}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("managers")}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "managers" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text"}`}
                                    >
                                        <UserCheck2 className="h-3.5 w-3.5" />
                                        {lang === "ar" ? "مستخدم" : "Users"}
                                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px]">
                                            {managers.length}
                                        </span>
                                    </button>
                                </div>
                                {isManager && (
                                    <button
                                        onClick={openAddModal}
                                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-primary/10 flex items-center gap-1.5 transition-all"
                                        title={!showButtonText ? (lang === "ar" ? "إضافة موظف جديد" : "Add New Employee") : undefined}
                                    >
                                        <Plus className="h-4 w-4" />
                                        {showButtonText && (lang === "ar" ? "إضافة موظف جديد" : "Add New Employee")}
                                    </button>
                                )}
                            </div>
                        }
                    />

                    {/* KPI Summary Widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-bold text-text-muted uppercase">{lang === "ar" ? "إجمالي الكادر" : "Total Staff"}</h3>
                                <p className="text-2xl font-black text-text leading-tight">{employees.length + managers.length}</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-bold text-text-muted uppercase">{lang === "ar" ? "موظفي العمليات" : "Operation Staff"}</h3>
                                <p className="text-2xl font-black text-text leading-tight">{employees.length}</p>
                            </div>
                        </div>
                        <div className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                                <UserCheck2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-bold text-text-muted uppercase">{lang === "ar" ? "المسؤولون والمدراء" : "Admins & Owners"}</h3>
                                <p className="text-2xl font-black text-text leading-tight">{managers.length}</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
                        
                        {/* Search and Filters */}
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface-muted/20">
                            <div className="relative w-full sm:w-80">
                                <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted ${lang === "ar" ? "right-3" : "left-3"}`} />
                                <input
                                    type="text"
                                    placeholder={lang === "ar" ? "بحث بالاسم، اسم المستخدم، المسمى..." : "Search..."}
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="w-full text-sm bg-white border border-border rounded-xl focus:ring-primary py-2 pr-10 pl-4"
                                />
                            </div>
                            {!isManager && (
                                <div className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                    <ShieldAlert className="h-4 w-4" />
                                    {lang === "ar" 
                                        ? "أنت تتصفح بوضع العرض فقط، تعديل الموظفين متاح لمديري النظام."
                                        : "Read-only mode. Modifying staff requires manager privileges."}
                                </div>
                            )}
                        </div>

                        {/* Employees Table */}
                        <div className="overflow-x-auto">
                            {getFilteredList().length === 0 ? (
                                <div className="p-12 text-center text-text-muted">
                                    <Users className="h-12 w-12 mx-auto text-text-muted/30 mb-3" />
                                    <p className="text-sm font-medium">{lang === "ar" ? "لا توجد نتائج مطابقة لعملية البحث." : "No matching staff members found."}</p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-surface-muted/50 text-[11px] font-bold text-text-muted uppercase">
                                        <tr>
                                            <th className="py-4 px-6 text-right">{lang === "ar" ? "الموظف" : "Employee"}</th>
                                            <th className="py-4 px-6 text-right">{lang === "ar" ? "المسمى الوظيفي" : "Job Title"}</th>
                                            <th className="py-4 px-6 text-right">{lang === "ar" ? "الهاتف" : "Phone"}</th>
                                            <th className="py-4 px-6 text-right">{lang === "ar" ? "رقم الهوية" : "ID Number"}</th>
                                            <th className="py-4 px-6 text-left">{lang === "ar" ? "إجراءات التحكم" : "Actions"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {getFilteredList().map((user) => (
                                            <tr key={user.id} className="hover:bg-surface-muted/30 transition-colors">
                                                
                                                {/* Name / User Info */}
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        {user.avatar ? (
                                                            <img
                                                                src={user.avatar}
                                                                alt={user.name}
                                                                className="h-10 w-10 rounded-xl object-cover border border-border"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold border border-indigo-100">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-bold text-text">{user.name}</p>
                                                            <p className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Job Title & Role */}
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className="text-[11px] font-bold text-text">
                                                            {user.job_title}
                                                        </span>
                                                        {user.role && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 w-fit">
                                                                {user.role}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                {/* Phone */}
                                                <td className="py-4 px-6 font-mono text-xs text-text-muted">{user.phone}</td>

                                                {/* ID Number */}
                                                <td className="py-4 px-6 font-mono text-xs text-text-muted">{user.id_number}</td>

                                                {/* Actions */}
                                                <td className="py-4 px-6 text-left">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <Link
                                                            href={route("employees.show", { employee: user.id, type: activeTab === 'managers' ? 'user' : 'employee' })}
                                                            className="px-2.5 py-1.5 rounded-lg border border-border text-[11px] font-bold hover:bg-primary/10 hover:text-primary transition-all flex items-center gap-1.5 relative group"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            {showButtonText && (lang === "ar" ? "إدارة الملف" : "Manage Profile")}
                                                            {!showButtonText && (
                                                                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[9999] shadow-md">
                                                                    {lang === "ar" ? "إدارة الملف" : "Manage Profile"}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                    </div>
                </div>

                {/* ── 2. Add Employee / User Modal ── */}
                <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md">
                    <form onSubmit={handleAddSubmit} className="flex flex-col h-full bg-white rounded-lg overflow-hidden text-start">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50/50">
                            <h3 className="font-bold text-sm text-text">
                                {addAccountType === "user" 
                                    ? (lang === "ar" ? "إضافة مستخدم" : "Add User")
                                    : (lang === "ar" ? "إضافة موظف" : "Add Employee")}
                            </h3>
                            <button type="button" onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            
                            {/* Account Type Toggle */}
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1.5">{lang === "ar" ? "نوع الحساب" : "Account Type"}</label>
                                <div className="grid grid-cols-2 gap-2 bg-surface-muted p-1 rounded-xl border border-border">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddAccountType("employee");
                                            setAddJobSelect("أمين مستودع");
                                        }}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${addAccountType === "employee" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text"}`}
                                    >
                                        {lang === "ar" ? "موظف" : "Staff"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddAccountType("user");
                                            setAddJobSelect("مدير عام");
                                        }}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${addAccountType === "user" ? "bg-white shadow-sm text-primary" : "text-text-muted hover:text-text"}`}
                                    >
                                        {lang === "ar" ? "مستخدم" : "User"}
                                    </button>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "الاسم" : "Name"}</label>
                                <input
                                    type="text"
                                    required
                                    value={addForm.data.name}
                                    onChange={(e) => addForm.setData("name", e.target.value)}
                                    placeholder={lang === "ar" ? "الاسم الكامل للموظف..." : "Employee full name..."}
                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                />
                                {addForm.errors.name && <p className="text-xs text-rose-600 mt-1">{addForm.errors.name}</p>}
                            </div>

                            {/* Conditional Fields for App User */}
                            {addAccountType === "user" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "اسم المستخدم" : "Username"}</label>
                                        <input
                                            type="text"
                                            required={addAccountType === "user"}
                                            value={addForm.data.username}
                                            onChange={(e) => addForm.setData("username", e.target.value)}
                                            placeholder={lang === "ar" ? "مثال: ahmad_dev" : "e.g. ahmad_dev"}
                                            className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                        />
                                        {addForm.errors.username && <p className="text-xs text-rose-600 mt-1">{addForm.errors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "كلمة المرور" : "Password"}</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required={addAccountType === "user"}
                                                value={addForm.data.password}
                                                onChange={(e) => addForm.setData("password", e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary pr-10 placeholder:text-text-muted/60"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className={`absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-text ${lang === "ar" ? "left-3" : "right-3"}`}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {addForm.errors.password && <p className="text-xs text-rose-600 mt-1">{addForm.errors.password}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Job Title and Email/Phone grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "الوظيفة" : "Job Title"}</label>
                                    <select
                                        value={addJobSelect}
                                        onChange={(e) => setAddJobSelect(e.target.value)}
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                    >
                                        {addAccountType === "user"
                                            ? managerPresets.map((preset) => <option key={preset} value={preset}>{preset}</option>)
                                            : employeePresets.map((preset) => <option key={preset} value={preset}>{preset}</option>)
                                        }
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "البريد" : "Email"}</label>
                                    <input
                                        type="email"
                                        required={addAccountType === "user"}
                                        value={addForm.data.email}
                                        onChange={(e) => addForm.setData("email", e.target.value)}
                                        placeholder="example@domain.com"
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                    />
                                    {addForm.errors.email && <p className="text-xs text-rose-600 mt-1">{addForm.errors.email}</p>}
                                </div>
                            </div>

                            {/* Conditional Custom Job Input */}
                            {addJobSelect === "أخرى" && (
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "المسمى الخاص" : "Custom Title"}</label>
                                    <input
                                        type="text"
                                        required
                                        value={addCustomJob}
                                        onChange={(e) => setAddCustomJob(e.target.value)}
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                        placeholder={lang === "ar" ? "اكتب المسمى الوظيفي..." : "Enter custom job title..."}
                                    />
                                    {addForm.errors.job_title && <p className="text-xs text-rose-600 mt-1">{addForm.errors.job_title}</p>}
                                </div>
                            )}

                            {/* Phone & ID Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "الهاتف" : "Phone"}</label>
                                    <input
                                        type="text"
                                        required
                                        value={addForm.data.phone}
                                        onChange={(e) => addForm.setData("phone", e.target.value)}
                                        placeholder="05xxxxxxxx"
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                    />
                                    {addForm.errors.phone && <p className="text-xs text-rose-600 mt-1">{addForm.errors.phone}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "الهوية" : "ID Number"}</label>
                                    <input
                                        type="text"
                                        required
                                        value={addForm.data.id_number}
                                        onChange={(e) => addForm.setData("id_number", e.target.value)}
                                        placeholder={lang === "ar" ? "رقم الهوية أو الإقامة..." : "ID or residence number..."}
                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                    />
                                    {addForm.errors.id_number && <p className="text-xs text-rose-600 mt-1">{addForm.errors.id_number}</p>}
                                </div>
                            </div>

                            {/* Administrator checkbox toggle for User creation */}
                            {addAccountType === "user" && (
                                <div>
                                    <label className="flex items-center gap-2.5 py-3 px-4 border border-border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors mt-2">
                                        <input
                                            type="checkbox"
                                            checked={addForm.data.is_admin}
                                            onChange={(e) => addForm.setData("is_admin", e.target.checked)}
                                            className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                                        />
                                        <div className="text-xs">
                                            <span className="font-bold text-text block">
                                                {lang === "ar" ? "مسؤول نظام" : "System Admin"}
                                            </span>
                                            <span className="text-text-muted text-[10px]">
                                                {lang === "ar" ? "تخطي صلاحيات الوصول بالكامل" : "Bypass all role permission gates"}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Profile Picture */}
                            <div>
                                <label className="block text-xs font-bold text-text-muted mb-1">{lang === "ar" ? "الصورة الشخصية" : "Profile Picture"}</label>
                                <input
                                    type="file"
                                    onChange={(e) => addForm.setData("avatar", e.target.files[0])}
                                    className="w-full text-xs text-text-muted bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary file:me-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-semibold"
                                />
                                {addForm.errors.avatar && <p className="text-xs text-rose-600 mt-1">{addForm.errors.avatar}</p>}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-3.5 bg-slate-50 border-t border-border flex gap-2 justify-end">
                            <SecondaryButton type="button" onClick={() => setShowAddModal(false)} className="text-xs">
                                {lang === "ar" ? "إلغاء" : "Cancel"}
                            </SecondaryButton>
                            <PrimaryButton 
                                type="submit" 
                                disabled={addForm.processing}
                                className="flex items-center gap-1.5 text-xs"
                                title={!showButtonText ? (lang === "ar" ? "حفظ الحساب" : "Save") : undefined}
                            >
                                <Save className="h-4 w-4" />
                                {showButtonText && (lang === "ar" ? "حفظ الحساب" : "Save")}
                            </PrimaryButton>
                        </div>
                    </form>
                </Modal>


            </div>
        </AuthenticatedLayout>
    );
}
