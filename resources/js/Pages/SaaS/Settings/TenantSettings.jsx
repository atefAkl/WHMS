import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Settings as SettingsIcon,
    Home,
    ChevronRight,
    CheckCircle2,
    ShieldAlert,
    Save,
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import Tooltip from "@/Components/Tooltip";

export default function TenantSettings({ settings }) {
    const { lang } = useLang();

    const { data, setData, post, processing } = useForm({
        auto_approve_tenants: settings.auto_approve_tenants ?? false,
        delete_request_after_approval:
            settings.delete_request_after_approval ?? false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("saas.settings.tenants.update"));
    };

    const t = {
        title:
            lang === "ar" ? "إعدادات المستأجرين" : "Tenant Management Settings",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc:
            lang === "ar"
                ? "إعدادات تفعيل الحسابات وقبول طلبات الانضمام تلقائياً"
                : "Configure tenant activation and automatic request approvals",
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
                        icon={SettingsIcon}
                        title={t.title}
                        description={
                            <p className="text-xs text-text-muted mt-0.5">
                                {t.desc}
                            </p>
                        }
                    />

                    <form
                        onSubmit={submit}
                        className="rounded-xl border border-border bg-surface p-4 shadow-sm space-y-4"
                    >
                        <div className="space-y-4 divide-y divide-border">
                            {/* Auto Approve Toggle */}
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h4 className="text-xs font-bold text-text">
                                        {lang === "ar"
                                            ? "قبول طلبات الانضمام تلقائياً"
                                            : "Automatic Approval"}
                                    </h4>
                                    <p className="text-[11px] text-text-muted mt-0.5">
                                        {lang === "ar"
                                            ? "تفعيل وإنشاء قواعد بيانات المستأجرين بمجرد تقديم طلب التسجيل دون مراجعة يدوية."
                                            : "Approve and seed tenant databases immediately when a registration request is submitted."}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.auto_approve_tenants}
                                        onChange={(e) =>
                                            setData(
                                                "auto_approve_tenants",
                                                e.target.checked,
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-1 peer-focus:ring-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Delete Request Toggle */}
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h4 className="text-xs font-bold text-text">
                                        {lang === "ar"
                                            ? "حذف طلب الانضمام بعد الموافقة"
                                            : "Clean Request History"}
                                    </h4>
                                    <p className="text-[11px] text-text-muted mt-0.5">
                                        {lang === "ar"
                                            ? "حذف سجل الطلب نهائياً من قائمة الطلبات المعلقة بعد إتمام التفعيل بنجاح."
                                            : "Permanently remove the registration request record from the requests dashboard once activated."}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={
                                            data.delete_request_after_approval
                                        }
                                        onChange={(e) =>
                                            setData(
                                                "delete_request_after_approval",
                                                e.target.checked,
                                            )
                                        }
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-border rounded-full peer peer-focus:ring-1 peer-focus:ring-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-border">
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "حفظ الإعدادات"
                                        : "Save Settings"
                                }
                            >
                                <PrimaryButton
                                    disabled={processing}
                                    className="px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 h-[36px]"
                                >
                                    <Save className="h-4 w-4 shrink-0" />
                                    <span className="display-me">
                                        {lang === "ar"
                                            ? "حفظ الإعدادات"
                                            : "Save Settings"}
                                    </span>
                                </PrimaryButton>
                            </Tooltip>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
