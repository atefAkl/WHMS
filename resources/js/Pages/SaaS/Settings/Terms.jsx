import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { FileText, Home, ChevronRight, Plus, Trash2, Save } from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function Terms({ globalTerms }) {
    const { lang } = useLang();
    const [termList, setTermList] = useState(globalTerms || []);
    const [newTermText, setNewTermText] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleAddTerm = () => {
        if (!newTermText.trim()) return;
        setTermList((prev) => [...prev, newTermText.trim()]);
        setNewTermText("");
    };

    const handleDeleteTerm = (index) => {
        setTermList((prev) => prev.filter((_, i) => i !== index));
    };

    const saveTerms = () => {
        setIsSaving(true);
        router.post(
            route("saas.settings.terms.update"),
            {
                terms: termList,
            },
            {
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    const t = {
        title:
            lang === "ar" ? "الشروط العامة للمستأجرين" : "Global Seeding Terms",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "إدارة شروط وبنود العقود الافتراضية التي يتم بذرها للمستأجرين الجدد لحظة تسجيل الحساب"
                : "Manage contract terms seeded to new tenants automatically upon database initialization",
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`}
            />
            <Link
                href={route("saas.settings.index")}
                className="hover:text-primary transition-colors"
            >
                {t.parent}
            </Link>
            <ChevronRight
                className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`}
            />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div
                className="pb-4 main-stack-y"
                dir={lang === "ar" ? "rtl" : "ltr"}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-[6px]">
                    <PageHeader
                        icon={FileText}
                        title={t.title}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {t.desc}
                            </p>
                        }
                        actions={
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "حفظ كافة البنود"
                                        : "Save All Terms"
                                }
                            >
                                <PrimaryButton
                                    onClick={saveTerms}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]"
                                >
                                    <Save className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar"
                                            ? "حفظ كافة البنود"
                                            : "Save All Terms"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        }
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[6px]">
                        {/* Left: Add Term card */}
                        <div className="bg-surface border border-border rounded-xl p-4 shadow-sm h-fit space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "إضافة شرط جديد"
                                        : "Add New Term"}
                                </h3>
                                <p className="text-[11px] text-text-muted mt-0.5">
                                    {lang === "ar"
                                        ? "اكتب نص البند وسيتم إضافته للمكتبة الافتراضية"
                                        : "Create a new seeding term and add it to the default library"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <textarea
                                    rows={5}
                                    placeholder={
                                        lang === "ar"
                                            ? "اكتب نص الشرط العام هنا... يمكنك استخدام متغيرات مثل {$start_date} أو {$end_date} ليتم تعويضها تلقائياً عند صياغة العقد."
                                            : "Type the term text here... You can use variables like {$start_date} or {$end_date}."
                                    }
                                    value={newTermText}
                                    onChange={(e) =>
                                        setNewTermText(e.target.value)
                                    }
                                    className="w-full text-xs bg-white border border-border rounded-lg focus:ring-primary p-2.5"
                                />
                                <Tooltip
                                    text={
                                        lang === "ar"
                                            ? "إضافة للقائمة مؤقتاً"
                                            : "Add to List"
                                    }
                                >
                                    <PrimaryButton
                                        onClick={handleAddTerm}
                                        className="w-full px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]"
                                    >
                                        <Plus className="h-4 w-4 shrink-0" />
                                        <span className="display-me">
                                            {lang === "ar"
                                                ? "إضافة للقائمة مؤقتاً"
                                                : "Add to List"}
                                        </span>
                                    </PrimaryButton>
                                </Tooltip>
                            </div>
                        </div>

                        {/* Right: Terms List */}
                        <div className="lg:col-span-2 bg-surface border border-border rounded-xl shadow-sm overflow-hidden h-fit">
                            <div className="p-4 border-b border-border bg-surface-muted/20">
                                <h4 className="text-xs font-bold text-text">
                                    {lang === "ar"
                                        ? "قائمة الشروط المجهزة للبذر"
                                        : "Seed-Ready Terms List"}
                                </h4>
                            </div>

                            {termList.length === 0 ? (
                                <div className="p-12 text-center text-text-muted space-y-2">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                                    <p className="text-sm font-bold">
                                        {lang === "ar"
                                            ? "قائمة الشروط فارغة حالياً."
                                            : "Terms list is currently empty."}
                                    </p>
                                    <p className="text-xs">
                                        {lang === "ar"
                                            ? "اكتب شرطاً في النموذج الجانبي وقم بإضافته ثم احفظ التغييرات."
                                            : "Write a term on the side card, add it, and then save changes."}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {termList.map((termText, index) => (
                                        <div
                                            key={index}
                                            className="p-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <div className="h-8 w-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">
                                                    {termText}
                                                </p>
                                            </div>
                                            <Tooltip
                                                text={
                                                    lang === "ar"
                                                        ? "حذف الشرط"
                                                        : "Delete Term"
                                                }
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleDeleteTerm(index)
                                                    }
                                                    className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center justify-center"
                                                >
                                                    <Trash2 className="w-4 h-4 shrink-0" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
