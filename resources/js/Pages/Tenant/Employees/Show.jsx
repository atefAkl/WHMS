import React, { useState, useEffect, useRef, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, Link, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Shield,
    Key,
    Trash2,
    Save,
    Home,
    ChevronRight,
    Camera,
    Lock,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    FolderOpen,
    Clipboard,
    Images,
    X,
    IdCard,
    Settings,
    Clock,
    History,
    Activity,
    Sparkles,
    CalendarCheck,
    AlertCircle,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

export default function Show({ employee, roles = [], type = "user", avatarGallery = [] }) {
    const { lang } = useLang();
    const { flash, auth } = usePage().props;
    const showButtonText = auth.user?.preferences?.show_button_text ?? false;

    const [activeTab, setActiveTab] = useState("personal");
    const [avatarPreview, setAvatarPreview] = useState(employee.avatar || null);

    // Avatar tab: "file" | "clipboard" | "gallery"
    const [avatarTab, setAvatarTab] = useState("file");
    const [clipboardPasted, setClipboardPasted] = useState(null); // data URL
    const pasteAreaRef = useRef(null);

    const isUser = type === "user";

    // Profile Details Form
    const profileForm = useForm({
        name: employee.name || "",
        username: employee.username || "",
        email: employee.email || "",
        phone: employee.phone || "",
        id_number: employee.id_number || "",
        job_title: employee.job_title || "",
        avatar: null,
        avatar_gallery: null,
        is_admin: employee.is_admin ? 1 : 0,
        type: type,
        _method: "PUT",
    });

    // Roles Form (only relevant for users)
    const rolesForm = useForm({
        is_admin: employee.is_admin ? true : false,
        roles: employee.assigned_roles || [],
        type: type,
        _method: "PUT",
    });

    // Password Form (only for users)
    const passwordForm = useForm({
        password: "",
        password_confirmation: "",
        _method: "PUT",
    });

    // Preferences Form (only for users)
    const preferencesForm = useForm({
        preferences: {
            show_button_text: employee.preferences?.show_button_text ?? false,
        },
    });

    const [isDeleting, setIsDeleting] = useState(false);

    // ─── Avatar Clipboard Paste Listener ────────────────────────────────────────
    const handlePasteEvent = useCallback((e) => {
        if (activeTab !== "avatar" || avatarTab !== "clipboard") return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setClipboardPasted(ev.target.result);
                };
                reader.readAsDataURL(blob);
                profileForm.setData("avatar", blob);
                break;
            }
        }
    }, [activeTab, avatarTab]);

    useEffect(() => {
        document.addEventListener("paste", handlePasteEvent);
        return () => document.removeEventListener("paste", handlePasteEvent);
    }, [handlePasteEvent]);

    // ─── Handlers ────────────────────────────────────────────────────────────────
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            profileForm.setData({ ...profileForm.data, avatar: file, avatar_gallery: null });
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleGallerySelect = (url) => {
        profileForm.setData({ ...profileForm.data, avatar: null, avatar_gallery: url });
        setAvatarPreview(url);
    };

    const handleClipboardConfirm = () => {
        if (clipboardPasted) {
            setAvatarPreview(clipboardPasted);
        }
    };

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.post(route("employees.update", employee.id));
    };

    const handleRolesSubmit = (e) => {
        e.preventDefault();

        rolesForm.transform((data) => ({
            roles: data.is_admin ? ["Super Admin"] : data.roles,
            is_admin: data.is_admin ? 1 : 0,
            type: type,
            _method: "PUT",
        }));

        rolesForm.post(route("employees.update", employee.id));
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put(route("employees.password.update", employee.id), {
            onSuccess: () => passwordForm.reset(),
        });
    };

    const handlePreferencesSubmit = (e) => {
        e.preventDefault();
        preferencesForm.put(route("employees.preferences.update", employee.id));
    };

    const handleDeleteEmployee = () => {
        const msg = lang === "ar"
            ? `هل أنت متأكد من حذف "${employee.name}" بالكامل؟`
            : `Are you sure you want to delete "${employee.name}"?`;
        if (confirm(msg)) {
            setIsDeleting(true);
            router.delete(route("employees.destroy", employee.id), {
                data: { type },
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    const toggleRoleSelection = (roleName) => {
        const current = [...rolesForm.data.roles];
        if (current.includes(roleName)) {
            rolesForm.setData("roles", current.filter((r) => r !== roleName));
        } else {
            rolesForm.setData("roles", [...current, roleName]);
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <Link href={route("employees.index")} className="hover:text-primary transition-colors">
                {lang === "ar" ? "إدارة الموظفين" : "Staff Directory"}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <span className="text-primary font-medium">{employee.name}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={employee.name} />

            <div className="pb-8 main-stack-y" dir={lang === "ar" ? "rtl" : "ltr"}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Header Controls */}
                    <div className="flex justify-between items-center">
                        <Link
                            href={route("employees.index")}
                            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text font-bold transition-colors"
                        >
                            <ArrowLeft className={`h-4 w-4 ${lang === "ar" && "rotate-180"}`} />
                            {lang === "ar" ? "العودة للدليل" : "Back to Directory"}
                        </Link>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${isUser ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                            {isUser ? (lang === "ar" ? "مستخدم تطبيق" : "App User") : (lang === "ar" ? "موظف (لا يسجل دخول)" : "Staff Only")}
                        </span>
                    </div>

                    {/* Flash Alerts */}
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

                    {/* Profile Layout */}
                    <div className="flex flex-col md:flex-row gap-6 items-start">

                        {/* ═══ LEFT SIDEBAR COLUMN (Width 200px) ══════════════ */}
                        <div className="w-full md:w-[220px] shrink-0 space-y-4">

                            {/* Profile Summary Card */}
                            <div className="bg-surface border border-border rounded-xl p-4 text-center space-y-3 shadow-sm">
                                <div className="relative w-20 h-20 mx-auto">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={employee.name}
                                            className="w-full h-full rounded-2xl object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/5 text-primary text-2xl font-black rounded-2xl flex items-center justify-center border border-primary/10">
                                            {(employee.name || "?").charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-sm text-text truncate">{employee.name}</h3>
                                    {employee.email && <p className="text-[10px] text-text-muted truncate">{employee.email}</p>}
                                </div>

                                <div className="flex flex-col gap-1 items-center pt-1 border-t border-border">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                        {employee.job_title || (lang === "ar" ? "موظف" : "Staff")}
                                    </span>
                                    {isUser && employee.is_admin ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-primary/5 text-primary border-primary/10">
                                            {lang === "ar" ? "مدير النظام" : "Super Admin"}
                                        </span>
                                    ) : (
                                        isUser && employee.assigned_roles && employee.assigned_roles.map((role) => {
                                            let displayName = role;
                                            if (lang === "ar") {
                                                const map = {
                                                    "Warehouse Keeper": "أمين مستودع",
                                                    "Accountant": "محاسب",
                                                    "Worker": "عامل مستودع",
                                                    "Super Admin": "مدير النظام",
                                                };
                                                displayName = map[role] || role;
                                            }
                                            return (
                                                <span key={role} className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-blue-50 text-blue-700 border-blue-100">
                                                    {displayName}
                                                </span>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Vertical Tab Navigation (under photo) */}
                            <div className="bg-surface border border-border p-1.5 rounded-xl shadow-sm flex flex-col gap-1">
                                {[
                                    { id: "personal", icon: User, label: lang === "ar" ? "البيانات الشخصية" : "Personal Details" },
                                    { id: "avatar", icon: Camera, label: lang === "ar" ? "الصورة الشخصية" : "Profile Picture" },
                                    ...(isUser ? [
                                        { id: "roles", icon: Shield, label: lang === "ar" ? "الأدوار والصلاحيات" : "Access Roles" },
                                        { id: "security", icon: Key, label: lang === "ar" ? "الأمان وكلمة المرور" : "Security & Password" },
                                        { id: "preferences", icon: Settings, label: lang === "ar" ? "تفضيلات المظهر" : "UI Preferences" },
                                    ] : []),
                                    { id: "attendance", icon: Clock, label: lang === "ar" ? "سجل الحضور والانصراف" : "Attendance Log", isLater: true },
                                    { id: "audit", icon: History, label: lang === "ar" ? "سجل العمليات" : "Audit Log", isLater: true },
                                    { id: "danger", icon: Trash2, label: lang === "ar" ? "منطقة الخطر" : "Danger Zone" },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isSelected = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center justify-between gap-1.5 ${isSelected ? "bg-primary text-white shadow-md" : "text-text-muted hover:text-text hover:bg-slate-50"}`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <Icon className="h-4 w-4 shrink-0" />
                                                <span className="truncate">{tab.label}</span>
                                            </div>
                                            {tab.isLater && (
                                                <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-extrabold ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                                                    {lang === "ar" ? "قريباً" : "Soon"}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                        </div>

                        {/* ═══ RIGHT CONTENT COLUMN (Takes remaining width) ═════ */}
                        <div className="flex-1 w-full bg-surface border border-border rounded-xl p-6 shadow-sm min-h-[320px]">

                            {/* ─── Tab 1: Personal Details ─────────────────────── */}
                            {activeTab === "personal" && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4">
                                        <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                            <User className="h-4 w-4 text-primary" />
                                            {lang === "ar" ? "البيانات الشخصية والمهنية" : "Profile Details"}
                                        </h2>
                                        <p className="text-[11px] text-text-muted mt-1">
                                            {lang === "ar" ? "تحديث معلومات اسم الموظف، بيانات الاتصال والمسمى الوظيفي." : "Manage user full name, contact information, and job title."}
                                        </p>
                                    </header>

                                    <form onSubmit={handleProfileSubmit} className="space-y-4 text-start">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted mb-1">
                                                    {lang === "ar" ? "الاسم الكامل *" : "Full Name *"}
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={profileForm.data.name}
                                                    onChange={(e) => profileForm.setData("name", e.target.value)}
                                                    placeholder={lang === "ar" ? "أدخل الاسم الكامل للموظف..." : "Enter full name..."}
                                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                />
                                                {profileForm.errors.name && <p className="text-xs text-rose-600 mt-1">{profileForm.errors.name}</p>}
                                            </div>

                                            {/* Username - only for users */}
                                            {isUser ? (
                                                <div>
                                                    <label className="block text-xs font-bold text-text-muted mb-1">
                                                        {lang === "ar" ? "اسم المستخدم *" : "Username *"}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={profileForm.data.username}
                                                        onChange={(e) => profileForm.setData("username", e.target.value)}
                                                        placeholder={lang === "ar" ? "اسم المستخدم للولوج للتطبيق..." : "Username..."}
                                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                    />
                                                    {profileForm.errors.username && <p className="text-xs text-rose-600 mt-1">{profileForm.errors.username}</p>}
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-xs font-bold text-text-muted mb-1">
                                                        {lang === "ar" ? "المسمى الوظيفي" : "Job Title"}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileForm.data.job_title}
                                                        onChange={(e) => profileForm.setData("job_title", e.target.value)}
                                                        placeholder={lang === "ar" ? "أدخل المسمى الوظيفي..." : "Enter job title..."}
                                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted mb-1">
                                                    {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                                                </label>
                                                <input
                                                    type="email"
                                                    required={isUser}
                                                    value={profileForm.data.email}
                                                    onChange={(e) => profileForm.setData("email", e.target.value)}
                                                    placeholder="example@domain.com"
                                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                />
                                                {profileForm.errors.email && <p className="text-xs text-rose-600 mt-1">{profileForm.errors.email}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted mb-1">
                                                    {lang === "ar" ? "رقم الهاتف *" : "Phone *"}
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={profileForm.data.phone}
                                                    onChange={(e) => profileForm.setData("phone", e.target.value)}
                                                    placeholder="05xxxxxxxx"
                                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                />
                                                {profileForm.errors.phone && <p className="text-xs text-rose-600 mt-1">{profileForm.errors.phone}</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-text-muted mb-1">
                                                    {lang === "ar" ? "رقم الهوية / الإقامة *" : "ID Number *"}
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={profileForm.data.id_number}
                                                    onChange={(e) => profileForm.setData("id_number", e.target.value)}
                                                    placeholder={lang === "ar" ? "رقم الهوية الوطنية أو الإقامة..." : "ID or residence number..."}
                                                    className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                />
                                                {profileForm.errors.id_number && <p className="text-xs text-rose-600 mt-1">{profileForm.errors.id_number}</p>}
                                            </div>

                                            {/* Job Title - for users */}
                                            {isUser && (
                                                <div>
                                                    <label className="block text-xs font-bold text-text-muted mb-1">
                                                        {lang === "ar" ? "المسمى الوظيفي" : "Job Title"}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={profileForm.data.job_title}
                                                        onChange={(e) => profileForm.setData("job_title", e.target.value)}
                                                        placeholder={lang === "ar" ? "أدخل المسمى الوظيفي..." : "Enter job title..."}
                                                        className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/60"
                                                    />
                                                    {profileForm.errors.job_title && <p className="text-xs text-rose-600 mt-1">{profileForm.errors.job_title}</p>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                            <PrimaryButton 
                                                type="submit" 
                                                disabled={profileForm.processing}
                                                className="flex items-center gap-1.5 text-xs"
                                                tooltip={!showButtonText ? (lang === "ar" ? "حفظ التغييرات" : "Save Profile") : undefined}
                                            >
                                                <Save className="h-4 w-4" />
                                                {showButtonText && (lang === "ar" ? "حفظ التغييرات" : "Save Profile")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ─── Tab 2: Profile Picture (Avatar) ─────────────── */}
                            {activeTab === "avatar" && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4">
                                        <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                            <Camera className="h-4 w-4 text-primary" />
                                            {lang === "ar" ? "الصورة الشخصية" : "Profile Picture"}
                                        </h2>
                                        <p className="text-[11px] text-text-muted mt-1">
                                            {lang === "ar" ? "اختر صورة للملف الشخصي من خلال جهازك أو عن طريق اللصق أو المعرض ثم اضغط حفظ التغييرات." : "Upload a profile photo, paste from your clipboard, or select from the site library."}
                                        </p>
                                    </header>

                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                                            {/* Avatar preview */}
                                            <div className="w-28 h-28 rounded-2xl overflow-hidden border border-border bg-slate-50 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                                                {avatarPreview ? (
                                                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera className="h-10 w-10 text-text-muted" />
                                                )}
                                            </div>

                                            {/* Manager Panel */}
                                            <div className="flex-1 w-full border border-border rounded-xl overflow-hidden">
                                                <div className="flex border-b border-border bg-slate-50/50">
                                                    {[
                                                        { key: "file", icon: FolderOpen, label: lang === "ar" ? "رفع ملف" : "Upload File" },
                                                        { key: "clipboard", icon: Clipboard, label: lang === "ar" ? "لصق من الحافظة" : "Clipboard" },
                                                        { key: "gallery", icon: Images, label: lang === "ar" ? "معرض الصور" : "Library Gallery" },
                                                    ].map(({ key, icon: Icon, label }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => setAvatarTab(key)}
                                                            className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${avatarTab === key ? "text-primary border-b-2 border-primary bg-primary/5" : "text-text-muted hover:text-text"}`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="p-4">
                                                    {/* File Upload */}
                                                    {avatarTab === "file" && (
                                                        <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
                                                            <Camera className="h-8 w-8 text-text-muted" />
                                                            <span className="text-xs font-bold text-text-muted">
                                                                {lang === "ar" ? "اختر ملف صورة من جهازك" : "Choose Image File"}
                                                            </span>
                                                            <span className="text-[10px] text-text-muted">JPG, PNG, WebP — max 2MB</span>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={handleAvatarChange}
                                                            />
                                                        </label>
                                                    )}

                                                    {/* Clipboard Paste */}
                                                    {avatarTab === "clipboard" && (
                                                        <div className="space-y-3">
                                                            <div
                                                                ref={pasteAreaRef}
                                                                className="min-h-[140px] border-2 border-dashed border-border rounded-xl flex items-center justify-center p-4 text-center bg-slate-50 focus:outline-none focus:border-primary/50"
                                                                tabIndex={0}
                                                            >
                                                                {clipboardPasted ? (
                                                                    <img src={clipboardPasted} alt="pasted" className="max-h-28 rounded-lg object-cover mx-auto" />
                                                                ) : (
                                                                    <div className="space-y-1">
                                                                        <Clipboard className="h-8 w-8 text-text-muted mx-auto" />
                                                                        <p className="text-xs font-bold text-text-muted">
                                                                            {lang === "ar" ? "اضغط Ctrl+V للصق الصورة" : "Press Ctrl+V to paste image"}
                                                                        </p>
                                                                        <p className="text-[10px] text-text-muted">
                                                                            {lang === "ar" ? "أو انسخ صورة من الإنترنت ثم الصقها هنا" : "Copy an image, then paste it here"}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {clipboardPasted && (
                                                                <button
                                                                    type="button"
                                                                    onClick={handleClipboardConfirm}
                                                                    className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
                                                                >
                                                                    {lang === "ar" ? "تأكيد واستخدام هذه الصورة" : "Use This Image"}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Gallery */}
                                                    {avatarTab === "gallery" && (
                                                        <div>
                                                            {avatarGallery.length === 0 ? (
                                                                <div className="py-10 text-center text-text-muted">
                                                                    <Images className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                                    <p className="text-xs font-bold">
                                                                        {lang === "ar" ? "لا توجد صور محفوظة في المعرض بعد" : "No saved avatars in gallery yet"}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="grid grid-cols-4 gap-3 max-h-60 overflow-y-auto p-1">
                                                                    {avatarGallery.map((url, i) => (
                                                                        <button
                                                                            key={i}
                                                                            type="button"
                                                                            onClick={() => handleGallerySelect(url)}
                                                                            className="aspect-square rounded-xl overflow-hidden border border-border hover:border-primary hover:ring-2 hover:ring-primary/30 transition-all"
                                                                        >
                                                                            <img
                                                                                src={url}
                                                                                alt={`avatar-${i}`}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                            <PrimaryButton 
                                                type="submit" 
                                                disabled={profileForm.processing}
                                                className="flex items-center gap-1.5 text-xs"
                                                tooltip={!showButtonText ? (lang === "ar" ? "حفظ الصورة" : "Save Image") : undefined}
                                            >
                                                <Save className="h-4 w-4" />
                                                {showButtonText && (lang === "ar" ? "حفظ الصورة" : "Save Image")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ─── Tab 3: Access Roles (Users only - NOW) ──────── */}
                            {activeTab === "roles" && isUser && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4">
                                        <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                            <Shield className="h-4 w-4 text-indigo-500" />
                                            {lang === "ar" ? "الأدوار والصلاحيات" : "Access Roles Mapping"}
                                        </h2>
                                        <p className="text-[11px] text-text-muted mt-1">
                                            {lang === "ar" ? "إسناد الأدوار الوظيفية أو منح صلاحية مسؤولي النظام الكلية للمستخدم." : "Map access permissions and administrative roles for this user."}
                                        </p>
                                    </header>

                                    <form onSubmit={handleRolesSubmit} className="space-y-4">
                                        {/* Admin Toggle */}
                                        <label className="flex items-center gap-2.5 py-3 px-4 border border-border rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={rolesForm.data.is_admin}
                                                onChange={(e) => {
                                                    rolesForm.setData({
                                                        ...rolesForm.data,
                                                        is_admin: e.target.checked,
                                                        roles: e.target.checked ? ["Super Admin"] : [],
                                                    });
                                                }}
                                                className="rounded border-border text-primary focus:ring-primary h-4.5 w-4.5"
                                            />
                                            <div className="text-xs">
                                                <span className="font-bold text-text block">
                                                    {lang === "ar" ? "مدير تطبيق / مسؤول (is_admin: true)" : "App Administrator"}
                                                </span>
                                                <span className="text-text-muted">
                                                    {lang === "ar" ? "يمنحه صلاحيات مطلقة لتخطي قيود الصلاحيات بالكامل." : "Grants full override authority across all modules."}
                                                </span>
                                            </div>
                                        </label>

                                        {/* Roles checklist */}
                                        <div className={`space-y-3 pt-2 ${rolesForm.data.is_admin ? "opacity-60 pointer-events-none select-none" : ""}`}>
                                            <label className="block text-xs font-bold text-text-muted">
                                                {lang === "ar" ? "اختر أدوار المستخدم (يمكن اختيار أكثر من دور):" : "Select assigned roles (supports multiple):"}
                                                {rolesForm.data.is_admin && (
                                                    <span className="text-[10px] text-amber-600 block mt-0.5 font-normal">
                                                        {lang === "ar" ? "(غير نشط لأن المستخدم مسؤول نظام)" : "(Disabled because user is System Administrator)"}
                                                    </span>
                                                )}
                                            </label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {roles.filter((r) => r !== "Super Admin").map((roleName) => {
                                                    const isChecked = rolesForm.data.roles.includes(roleName);
                                                    return (
                                                        <div
                                                            key={roleName}
                                                            onClick={() => !rolesForm.data.is_admin && toggleRoleSelection(roleName)}
                                                            className={`p-3 border rounded-xl flex items-center justify-between transition-all ${rolesForm.data.is_admin ? "border-border bg-slate-50/50 cursor-not-allowed" : (isChecked ? "border-primary bg-primary/5 cursor-pointer hover:bg-slate-50/50" : "border-border bg-white cursor-pointer hover:bg-slate-50/50")}`}
                                                        >
                                                            <span className="text-xs font-bold text-text">{roleName}</span>
                                                            {isChecked ? (
                                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full border-2 border-border" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {rolesForm.errors.roles && <p className="text-xs text-rose-600 mt-1">{rolesForm.errors.roles}</p>}
                                        </div>

                                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                            <PrimaryButton 
                                                type="submit" 
                                                disabled={rolesForm.processing}
                                                className="flex items-center gap-1.5 text-xs"
                                                tooltip={!showButtonText ? (lang === "ar" ? "حفظ الأدوار" : "Save Roles") : undefined}
                                            >
                                                <Save className="h-4 w-4" />
                                                {showButtonText && (lang === "ar" ? "حفظ الأدوار" : "Save Roles")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ─── Tab 4: Security & Password (Users only - NOW) ─── */}
                            {activeTab === "security" && isUser && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4">
                                        <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                            <Key className="h-4 w-4 text-amber-500" />
                                            {lang === "ar" ? "الأمان وكلمة المرور" : "Security & Password"}
                                        </h2>
                                        <p className="text-[11px] text-text-muted mt-1">
                                            {lang === "ar" ? "إدخال وتحديث كلمة مرور جديدة للولوج إلى تطبيق هذا المستأجر." : "Set a new password for this user to access the tenant portal."}
                                        </p>
                                    </header>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted mb-1">
                                                {lang === "ar" ? "كلمة المرور الجديدة *" : "New Password *"}
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.data.password}
                                                onChange={(e) => passwordForm.setData("password", e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/50"
                                            />
                                            {passwordForm.errors.password && (
                                                <p className="text-xs text-rose-600 mt-1">{passwordForm.errors.password}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted mb-1">
                                                {lang === "ar" ? "تأكيد كلمة المرور الجديدة *" : "Confirm New Password *"}
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.data.password_confirmation}
                                                onChange={(e) => passwordForm.setData("password_confirmation", e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary placeholder:text-text-muted/50"
                                            />
                                        </div>
                                        <div className="pt-2">
                                            <PrimaryButton 
                                                type="submit" 
                                                className="flex items-center gap-1.5 text-xs" 
                                                disabled={passwordForm.processing}
                                                tooltip={!showButtonText ? (lang === "ar" ? "تحديث كلمة المرور" : "Update Password") : undefined}
                                            >
                                                <Lock className="h-3.5 w-3.5" />
                                                {showButtonText && (lang === "ar" ? "تحديث كلمة المرور" : "Update Password")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ─── Tab 5: UI Preferences (NOW) ─────────────────── */}
                            {activeTab === "preferences" && isUser && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4">
                                        <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                            <Settings className="h-4 w-4 text-primary" />
                                            {lang === "ar" ? "تفضيلات الواجهة والمظهر" : "UI Preferences"}
                                        </h2>
                                        <p className="text-[11px] text-text-muted mt-1">
                                            {lang === "ar" ? "تحديث التفضيلات وتجربة الاستخدام المخصصة لهذا المستخدم." : "Customize layout and interaction preferences for this user."}
                                        </p>
                                    </header>

                                    <form onSubmit={handlePreferencesSubmit} className="space-y-6 max-w-md">
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted mb-1">
                                                {lang === "ar" ? "نمط عرض أزرار الإجراءات" : "Action Buttons Label Style"}
                                            </label>
                                            <select
                                                className="w-full text-sm bg-white border border-border rounded-xl py-2 px-3 focus:ring-primary"
                                                value={preferencesForm.data.preferences.show_button_text ? "true" : "false"}
                                                onChange={(e) => preferencesForm.setData("preferences", {
                                                    ...preferencesForm.data.preferences,
                                                    show_button_text: e.target.value === "true"
                                                })}
                                            >
                                                <option value="false">{lang === "ar" ? "أيقونات فقط (مدمج - افتراضي)" : "Icons Only (Default)"}</option>
                                                <option value="true">{lang === "ar" ? "أيقونات مع نص واضح" : "Icons with Text Labels"}</option>
                                            </select>
                                        </div>

                                        <div className="pt-2">
                                            <PrimaryButton 
                                                type="submit" 
                                                disabled={preferencesForm.processing}
                                                className="flex items-center gap-1.5 text-xs"
                                                tooltip={!showButtonText ? (lang === "ar" ? "حفظ التفضيلات" : "Save Preferences") : undefined}
                                            >
                                                <Save className="h-4 w-4" />
                                                {showButtonText && (lang === "ar" ? "حفظ التفضيلات" : "Save Preferences")}
                                            </PrimaryButton>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ─── Tab 6: Attendance Log (LATER - Placeholder) ─── */}
                            {activeTab === "attendance" && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                                <Clock className="h-4 w-4 text-amber-600" />
                                                {lang === "ar" ? "سجل الحضور والانصراف" : "Attendance Log"}
                                            </h2>
                                            <p className="text-[11px] text-text-muted mt-1">
                                                {lang === "ar" ? "عرض وتقارير الحضور والانصراف والورديات للموظف." : "Track employee attendance logs, shifts, and biometric scans."}
                                            </p>
                                        </div>
                                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            {lang === "ar" ? "خاصية قيد التطوير (قريباً)" : "Coming Soon"}
                                        </span>
                                    </header>

                                    <div className="border border-dashed border-amber-200 bg-amber-50/40 rounded-xl p-8 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                                            <CalendarCheck className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-sm text-amber-900">
                                            {lang === "ar" ? "وحدة الحضور والانصراف الذكية" : "Smart Attendance & Shifts Module"}
                                        </h3>
                                        <p className="text-xs text-amber-800/80 max-w-md mx-auto leading-relaxed">
                                            {lang === "ar"
                                                ? "سيتم ربط سجلات الحضور والانصراف، دوامات الورديات، وتوثيق بصمة الدخول والربط مع الأجهزة الذكية في التحديث القادم."
                                                : "Shift schedules, clock-in/out logs, and attendance reports will be seamlessly integrated in upcoming updates."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ─── Tab 7: Audit Log (LATER - Placeholder) ───────── */}
                            {activeTab === "audit" && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-sm font-black text-text flex items-center gap-1.5">
                                                <History className="h-4 w-4 text-indigo-600" />
                                                {lang === "ar" ? "سجل العمليات على النظام (Audit Log)" : "Audit Log"}
                                            </h2>
                                            <p className="text-[11px] text-text-muted mt-1">
                                                {lang === "ar" ? "تتبع كافة النشاطات والحركات المخزنية والمالية التي أجراها المستخدم." : "Track user activity, warehouse transactions, and system audit logs."}
                                            </p>
                                        </div>
                                        <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            {lang === "ar" ? "خاصية قيد التطوير (قريباً)" : "Coming Soon"}
                                        </span>
                                    </header>

                                    <div className="border border-dashed border-indigo-200 bg-indigo-50/40 rounded-xl p-8 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                                            <Activity className="h-6 w-6" />
                                        </div>
                                        <h3 className="font-bold text-sm text-indigo-900">
                                            {lang === "ar" ? "سجل تتبع النشاطات والحركات (Activity Trail)" : "Full System Audit Trail"}
                                        </h3>
                                        <p className="text-xs text-indigo-800/80 max-w-md mx-auto leading-relaxed">
                                            {lang === "ar"
                                                ? "سيعرض هذا التبويب سجلاً مفصلاً لكافة السندات التي أنشأها المستخدم، العقود المقبولة، وسندات القبض/الصرف والعمليات المخزنية مع التواريخ والـ IP."
                                                : "A detailed timestamped audit trail of all warehouse receptions, delivery vouchers, and financial operations created by this user."}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ─── Tab 8: Danger Zone ─────────────────────────── */}
                            {activeTab === "danger" && (
                                <div className="space-y-4">
                                    <header className="border-b border-rose-200 pb-3 mb-4">
                                        <h2 className="text-sm font-black text-rose-800 flex items-center gap-1.5">
                                            <Trash2 className="h-4 w-4 text-rose-600" />
                                            {lang === "ar" ? "منطقة الخطر: حذف الحساب" : "Danger Zone: Delete Account"}
                                        </h2>
                                        <p className="text-[11px] text-rose-700/80 mt-1">
                                            {lang === "ar"
                                                ? "سيتم إزالة هذا الحساب نهائياً من سجلات النظام لدى هذا المستأجر."
                                                : "Permanently delete this user record from tenant system databases."}
                                        </p>
                                    </header>

                                    <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-5 space-y-4">
                                        <p className="text-xs text-rose-900 leading-relaxed font-medium">
                                            {lang === "ar"
                                                ? "تحذير: هذه العملية لا يمكن التراجع عنها. عند حذف المستخدم سيتم إلغاء صلاحيات الوصول الخاصة به فوراً، وتطبق قواعد سلامة المفاتيح الأجنبية لمنع الحذف إذا وجدت سجلات مرتبطة."
                                                : "Warning: Action cannot be undone. Account deletion revokes all access permissions instantly."}
                                        </p>
                                        <DangerButton 
                                            type="button" 
                                            onClick={handleDeleteEmployee} 
                                            disabled={isDeleting}
                                            className="flex items-center gap-1.5 text-xs"
                                            tooltip={!showButtonText ? (lang === "ar" ? "حذف الحساب نهائياً" : "Delete Account") : undefined}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {showButtonText && (lang === "ar" ? "حذف الحساب نهائياً" : "Delete Account")}
                                        </DangerButton>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
