import React, { useState, useEffect, useRef, useCallback } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
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
    Settings,
    FolderOpen,
    Clipboard,
    Images,
    X,
    CheckCircle2,
    XCircle,
    UserCheck,
} from "lucide-react";
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePreferencesForm from './Partials/UpdatePreferencesForm';
import UpdateSecurePasswordForm from './Partials/UpdateSecurePasswordForm';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Edit({ mustVerifyEmail, status, avatarGallery = [], assignedRoles = [] }) {
    const { lang } = useLang();
    const { auth } = usePage().props;
    const user = auth.user;

    const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'avatar', 'preferences', 'security', 'danger'
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
    const [avatarTab, setAvatarTab] = useState('file');
    const [clipboardPasted, setClipboardPasted] = useState(null);

    const showButtonText = user?.preferences?.show_button_text ?? false;

    // Form to handle avatar updates
    const avatarForm = useForm({
        avatar: null,
        avatar_gallery: null,
        _method: 'PATCH'
    });

    // ─── Clipboard Paste Listener ──────────────────────────────────────────
    const handlePasteEvent = useCallback((e) => {
        if (activeTab !== 'avatar' || avatarTab !== 'clipboard') return;
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = (ev) => {
                    setClipboardPasted(ev.target.result);
                };
                reader.readAsDataURL(blob);
                avatarForm.setData({
                    avatar: blob,
                    avatar_gallery: null
                });
                break;
            }
        }
    }, [activeTab, avatarTab]);

    useEffect(() => {
        document.addEventListener('paste', handlePasteEvent);
        return () => document.removeEventListener('paste', handlePasteEvent);
    }, [handlePasteEvent]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
            
            // Upload immediately
            avatarForm.transform(() => ({
                avatar: file,
                avatar_gallery: null,
                _method: 'PATCH'
            }));
            avatarForm.post(route('profile.update'), {
                preserveScroll: true
            });
        }
    };

    const handleGallerySelect = (url) => {
        setAvatarPreview(url);
        
        // Save immediately
        avatarForm.transform(() => ({
            avatar: null,
            avatar_gallery: url,
            _method: 'PATCH'
        }));
        avatarForm.post(route('profile.update'), {
            preserveScroll: true
        });
    };

    const handleClipboardConfirm = () => {
        if (clipboardPasted && avatarForm.data.avatar) {
            setAvatarPreview(clipboardPasted);

            // Save immediately
            avatarForm.transform(() => ({
                avatar: avatarForm.data.avatar,
                avatar_gallery: null,
                _method: 'PATCH'
            }));
            avatarForm.post(route('profile.update'), {
                preserveScroll: true
            });
        }
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === 'ar' && 'rotate-180'}`} />
            <span className="text-primary font-medium">{lang === 'ar' ? 'الملف الشخصي' : 'My Profile'}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={lang === 'ar' ? 'الملف الشخصي' : 'My Profile'} />

            <div className="pb-8 main-stack-y" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">

                    <div className="flex flex-col md:flex-row gap-6 items-start">

                        {/* ═══ LEFT SIDEBAR COLUMN (Width 200px) ══════════════ */}
                        <div className="w-full md:w-[200px] shrink-0 space-y-4">
                            
                            {/* Profile Info Card */}
                            <div className="bg-surface border border-border rounded-xl p-4 text-center space-y-3 shadow-sm">
                                <div className="relative w-20 h-20 mx-auto">
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt={user.name}
                                            className="w-full h-full rounded-2xl object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/5 text-primary text-2xl font-black rounded-2xl flex items-center justify-center border border-primary/10">
                                            {user.name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-0.5">
                                    <h3 className="font-bold text-sm text-text truncate">{user.name}</h3>
                                    <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                                </div>

                                <div className="flex flex-col gap-1 items-center pt-1 border-t border-border">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                        {user.job_title || (lang === 'ar' ? 'مدير تطبيق' : 'Administrator')}
                                    </span>
                                    {user.is_admin ? (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-primary/5 text-primary border-primary/10">
                                            {lang === 'ar' ? 'مسؤول نظام' : 'Super Admin'}
                                        </span>
                                    ) : (
                                        assignedRoles && assignedRoles.map((role) => (
                                            <span key={role} className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-blue-50 text-blue-700 border-blue-100">
                                                {role}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Vertical Tab Navigation (under photo) */}
                            <div className="bg-surface border border-border p-1.5 rounded-xl shadow-sm flex flex-col gap-1">
                                {[
                                    { id: 'personal', icon: User, label: lang === 'ar' ? 'البيانات الشخصية' : 'Personal Details' },
                                    { id: 'avatar', icon: Camera, label: lang === 'ar' ? 'الصورة الشخصية' : 'Profile Picture' },
                                    { id: 'preferences', icon: Settings, label: lang === 'ar' ? 'تفضيلات الواجهة' : 'UI Preferences' },
                                    { id: 'security', icon: Key, label: lang === 'ar' ? 'الأمان وكلمات المرور' : 'Security & Password' },
                                    { id: 'danger', icon: Trash2, label: lang === 'ar' ? 'منطقة الخطر' : 'Danger Zone' },
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    const isSelected = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full px-3 py-2 rounded-lg text-[11px] font-bold transition-all flex items-center gap-2 ${isSelected ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text hover:bg-slate-50'}`}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            <span className="truncate">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                        </div>

                        {/* ═══ RIGHT CONTENT COLUMN (Takes remaining width) ═════ */}
                        <div className="flex-1 w-full bg-surface border border-border rounded-xl p-6 shadow-sm min-h-[300px]">
                            
                            {activeTab === 'personal' && (
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            )}

                            {/* Avatar Manager in dedicated Tab */}
                            {activeTab === 'avatar' && (
                                <div className="space-y-4">
                                    <header className="border-b border-border pb-3 mb-4">
                                        <h2 className="text-sm font-black text-text">
                                            {lang === 'ar' ? 'تغيير الصورة الشخصية' : 'Profile Picture'}
                                        </h2>
                                        <p className="text-[11px] text-text-muted mt-1">
                                            {lang === 'ar' ? 'اختر صورة للملف الشخصي من خلال جهازك أو عن طريق اللصق أو المعرض.' : 'Upload a profile photo, paste from your clipboard, or select from the site library.'}
                                        </p>
                                    </header>

                                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                                        {/* Avatar preview */}
                                        <div className="w-28 h-28 rounded-2xl overflow-hidden border border-border bg-slate-50 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                                            {avatarPreview ? (
                                                <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera className="h-10 w-10 text-text-muted" />
                                            )}
                                        </div>

                                        {/* Manager Panel (full width inside card) */}
                                        <div className="flex-1 w-full border border-border rounded-xl overflow-hidden">
                                            <div className="flex border-b border-border bg-slate-50/50">
                                                {[
                                                    { key: 'file', icon: FolderOpen, label: lang === 'ar' ? 'رفع ملف' : 'Upload File' },
                                                    { key: 'clipboard', icon: Clipboard, label: lang === 'ar' ? 'لصق من الحافظة' : 'Clipboard' },
                                                    { key: 'gallery', icon: Images, label: lang === 'ar' ? 'معرض الصور' : 'Library Gallery' },
                                                ].map(({ key, icon: Icon, label }) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setAvatarTab(key)}
                                                        className={`flex-1 py-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${avatarTab === key ? 'text-primary border-b-2 border-primary bg-white font-black' : 'text-text-muted hover:text-text'}`}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" />
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-4">
                                                {avatarTab === 'file' && (
                                                    <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center">
                                                        <Camera className="h-8 w-8 text-text-muted" />
                                                        <span className="text-xs font-bold text-text-muted">{lang === 'ar' ? 'اختر ملف صورة من جهازك' : 'Choose local image file'}</span>
                                                        <span className="text-[10px] text-text-muted">JPG, PNG, WebP (max 2MB)</span>
                                                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                                    </label>
                                                )}

                                                {avatarTab === 'clipboard' && (
                                                    <div className="space-y-3">
                                                        <div className="min-h-[140px] border-2 border-dashed border-border rounded-xl flex items-center justify-center p-4 text-center bg-slate-50 focus:outline-none">
                                                            {clipboardPasted ? (
                                                                <img src={clipboardPasted} alt="pasted" className="max-h-28 rounded-lg object-cover mx-auto" />
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    <Clipboard className="h-8 w-8 text-text-muted mx-auto animate-pulse" />
                                                                    <p className="text-xs font-bold text-text-muted">{lang === 'ar' ? 'انقر داخل هذا المربع ثم اضغط Ctrl+V للصق' : 'Click here and press Ctrl+V'}</p>
                                                                    <p className="text-[10px] text-text-muted">{lang === 'ar' ? 'قم بنسخ أي صورة من الويب أو لقطة شاشة' : 'Copy an image from web or screenshot'}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {clipboardPasted && (
                                                            <div className="flex justify-end pt-1">
                                                                <PrimaryButton
                                                                    type="button"
                                                                    onClick={handleClipboardConfirm}
                                                                    disabled={avatarForm.processing}
                                                                    title={!showButtonText ? (lang === 'ar' ? 'تأكيد واستخدام الصورة' : 'Apply Image') : undefined}
                                                                    className="text-xs"
                                                                >
                                                                    <Save className="h-4 w-4" />
                                                                    {showButtonText && (lang === 'ar' ? 'تأكيد واستخدام الصورة' : 'Apply Image')}
                                                                </PrimaryButton>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {avatarTab === 'gallery' && (
                                                    <div>
                                                        {avatarGallery.length === 0 ? (
                                                            <div className="py-8 text-center text-text-muted">
                                                                <Images className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                                <p className="text-xs font-bold">{lang === 'ar' ? 'المعرض لا يحتوي على صور حالياً' : 'No images available in gallery'}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto">
                                                                {avatarGallery.map((url, i) => (
                                                                    <button
                                                                        key={i}
                                                                        type="button"
                                                                        onClick={() => handleGallerySelect(url)}
                                                                        className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary hover:scale-95 transition-all"
                                                                    >
                                                                        <img src={url} alt={`gallery-${i}`} className="w-full h-full object-cover" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'preferences' && (
                                <UpdatePreferencesForm />
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 divide-y divide-border">
                                    <div className="pb-6">
                                        <UpdatePasswordForm />
                                    </div>
                                    <div className="pt-6">
                                        <UpdateSecurePasswordForm />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'danger' && (
                                <DeleteUserForm />
                            )}

                        </div>

                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
