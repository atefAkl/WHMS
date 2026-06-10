import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { useState } from "react";
import {
    Home,
    ChevronRight,
    UsersRound,
    Phone,
    Mail,
    Globe,
    MapPin,
    Edit,
    Save,
    X,
    Plus,
    Trash2,
    FileText,
    User,
    Building2,
    Hash,
    Pencil,
} from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import Tooltip from "@/Components/Tooltip";
import PageHeader from "@/Components/PageHeader";
import ConfirmationModal from "@/Components/ConfirmationModal";
import { useSecureDelete } from "@/Hooks/useSecureDelete";

// ─── helpers ───────────────────────────────────────────────────
const Field = ({ label, value, dir }) => (
    <div>
        <p className="text-[10px] font-medium text-text-muted uppercase tracking-wide mb-0.5">
            {label}
        </p>
        <p
            className={`text-[13px] font-semibold text-text ${dir === "ltr" ? "font-mono" : ""}`}
            dir={dir}
        >
            {value || "—"}
        </p>
    </div>
);

const SectionCard = ({ title, icon: Icon, children, action }) => (
    <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-muted/30">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="text-[13px] font-bold text-text">{title}</h2>
            </div>
            {action}
        </div>
        <div className="p-4">{children}</div>
    </div>
);

// ─── Main ───────────────────────────────────────────────────────
export default function Show({ customer, countries = [], categories = [] }) {
    const { lang } = useLang();
    const [editMode, setEditMode] = useState(false);
    const [isContactModal, setContactModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    const {
        itemToDelete,
        deletePassword,
        setDeletePassword,
        deleteError,
        processing: deleteProcessing,
        requestDelete,
        confirmDelete,
        cancelDelete
    } = useSecureDelete();

    // determine parent category
    const parentCategories = categories.filter((c) => !c.parent_id);
    const subCategories = categories.filter((c) => c.parent_id);

    // ── Edit form ──
    const { data, setData, put, processing, errors, reset } = useForm({
        name: customer.name ?? "",
        foreign_name: customer.foreign_name ?? "",
        phone_number: customer.phone_number ?? "",
        email: customer.email ?? "",
        id_number: customer.id_number ?? "",
        vat_number: customer.vat_number ?? "",
        cr_number: customer.cr_number ?? "",
        website: customer.website ?? "",
        address: customer.address ?? "",
        country_id: customer.country_id ?? "",
        category_id: customer.category_id ?? "",
    });

    const saveEdit = (e) => {
        e.preventDefault();
        put(route("customers.update", customer.id), {
            onSuccess: () => setEditMode(false),
        });
    };

    // ── Contact form ──
    const contactForm = useForm({
        name: "",
        phone_number: "",
        id_number: "",
        job_title: "",
        can_sign: false,
        can_withdraw_goods: false,
    });

    const saveContact = (e) => {
        e.preventDefault();
        if (editingContact) {
            contactForm.put(
                route("customers.contacts.update", [
                    customer.id,
                    editingContact.id,
                ]),
                {
                    onSuccess: () => {
                        setContactModal(false);
                        setEditingContact(null);
                        contactForm.reset();
                    },
                },
            );
        } else {
            contactForm.post(route("customers.contacts.store", customer.id), {
                onSuccess: () => {
                    setContactModal(false);
                    contactForm.reset();
                },
            });
        }
    };

    const openEditContact = (contact) => {
        setEditingContact(contact);
        contactForm.setData({
            name: contact.name || "",
            phone_number: contact.phone_number || "",
            id_number: contact.id_number || "",
            job_title: contact.job_title || "",
            can_sign: !!contact.can_sign,
            can_withdraw_goods: !!contact.can_withdraw_goods,
        });
        setContactModal(true);
    };

    const openAddContact = () => {
        setEditingContact(null);
        contactForm.reset();
        setContactModal(true);
    };

    const deleteContact = (contact) => {
        requestDelete(route("customers.contacts.destroy", [customer.id, contact.id]), contact);
    };

    const isIndividual = customer.category?.parent
        ? customer.category.parent.name_ar?.includes("أفراد") ||
          customer.category.parent.name_en?.toLowerCase().includes("individual")
        : false;
    const isBusiness = !isIndividual;

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight
                className={
                    lang === "ar" ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"
                }
            />
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.get(route("customers.index"))}
            >
                {lang === "ar" ? "العملاء" : "Customers"}
            </span>
            <ChevronRight
                className={
                    lang === "ar" ? "h-3.5 w-3.5 rotate-180" : "h-3.5 w-3.5"
                }
            />
            <span className="text-primary font-medium">{customer.name}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={customer.name} />

            <div className="pb-6 main-stack-y">
                <div className="mx-auto max-w-5xl space-y-3">
                    {/* ── Header Card ── */}
                    <PageHeader
                        icon={UsersRound}
                        title={
                            <>
                                <h1 className="text-xl font-bold text-text leading-tight">
                                    {customer.name}
                                </h1>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                    {lang === "ar"
                                        ? customer.category?.name_ar
                                        : customer.category?.name_en}
                                </span>
                            </>
                        }
                        description={
                            <p className="text-[11px] text-text-muted font-mono">
                                {customer.s_number}
                            </p>
                        }
                        actions={
                            !editMode ? (
                                <Tooltip
                                    text={
                                        lang === "ar"
                                            ? "تعديل البيانات"
                                            : "Edit"
                                    }
                                >
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            ) : (
                                <Tooltip
                                    text={lang === "ar" ? "إلغاء" : "Cancel"}
                                >
                                    <button
                                        onClick={() => {
                                            setEditMode(false);
                                            reset();
                                        }}
                                        className="p-1.5 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            )
                        }
                    />

                    {/* ── Info / Edit ── */}
                    <SectionCard
                        title={
                            lang === "ar" ? "بيانات العميل" : "Customer Info"
                        }
                        icon={User}
                    >
                        {!editMode ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Field
                                    label={lang === "ar" ? "الاسم" : "Name"}
                                    value={customer.name}
                                />
                                <Field
                                    label={
                                        lang === "ar"
                                            ? "الاسم الأجنبي"
                                            : "Foreign Name"
                                    }
                                    value={customer.foreign_name}
                                />
                                <Field
                                    label={lang === "ar" ? "الهاتف" : "Phone"}
                                    value={customer.phone_number}
                                    dir="ltr"
                                />
                                <Field
                                    label={lang === "ar" ? "البريد" : "Email"}
                                    value={customer.email}
                                    dir="ltr"
                                />
                                <Field
                                    label={lang === "ar" ? "الدولة" : "Country"}
                                    value={
                                        lang === "ar"
                                            ? customer.country?.name_ar
                                            : customer.country?.name_en
                                    }
                                />
                                <Field
                                    label={lang === "ar" ? "الموقع" : "Website"}
                                    value={customer.website}
                                    dir="ltr"
                                />
                                {isIndividual && (
                                    <Field
                                        label={
                                            lang === "ar"
                                                ? "الهوية/الإقامة"
                                                : "ID / Residence"
                                        }
                                        value={customer.id_number}
                                        dir="ltr"
                                    />
                                )}
                                {isBusiness && (
                                    <Field
                                        label={
                                            lang === "ar"
                                                ? "السجل التجاري"
                                                : "CR Number"
                                        }
                                        value={customer.cr_number}
                                        dir="ltr"
                                    />
                                )}
                                {isBusiness && (
                                    <Field
                                        label={
                                            lang === "ar"
                                                ? "الرقم الضريبي"
                                                : "VAT Number"
                                        }
                                        value={customer.vat_number}
                                        dir="ltr"
                                    />
                                )}
                                <Field
                                    label={
                                        lang === "ar" ? "العنوان" : "Address"
                                    }
                                    value={customer.address}
                                />
                            </div>
                        ) : (
                            <form onSubmit={saveEdit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الاسم *"
                                                    : "Name *"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData("name", e.target.value)
                                            }
                                        />
                                        <InputError message={errors.name} />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الاسم بلغة أخرى"
                                                    : "Foreign Name"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm"
                                            value={data.foreign_name}
                                            onChange={(e) =>
                                                setData(
                                                    "foreign_name",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                        />
                                        <InputError
                                            message={errors.foreign_name}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الهاتف *"
                                                    : "Phone *"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm font-mono"
                                            value={data.phone_number}
                                            onChange={(e) =>
                                                setData(
                                                    "phone_number",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                            placeholder="5XXXXXXXX"
                                        />
                                        <InputError
                                            message={errors.phone_number}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "البريد الإلكتروني"
                                                    : "Email"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                            dir="ltr"
                                            type="email"
                                        />
                                        <InputError message={errors.email} />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الدولة *"
                                                    : "Country *"
                                            }
                                        />
                                        <select
                                            className="mt-0.5 block w-full rounded-md border border-border bg-surface text-text text-sm py-1.5 px-2"
                                            value={data.country_id}
                                            onChange={(e) =>
                                                setData(
                                                    "country_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {countries.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {lang === "ar"
                                                        ? c.name_ar
                                                        : c.name_en}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.country_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "التصنيف *"
                                                    : "Category *"
                                            }
                                        />
                                        <select
                                            className="mt-0.5 block w-full rounded-md border border-border bg-surface text-text text-sm py-1.5 px-2"
                                            value={data.category_id}
                                            onChange={(e) =>
                                                setData(
                                                    "category_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {subCategories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {lang === "ar"
                                                        ? c.name_ar
                                                        : c.name_en}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.category_id}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الموقع الإلكتروني"
                                                    : "Website"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm"
                                            value={data.website}
                                            onChange={(e) =>
                                                setData(
                                                    "website",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                            placeholder="https://"
                                        />
                                        <InputError message={errors.website} />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الهوية/الإقامة"
                                                    : "ID / Residence"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm font-mono"
                                            value={data.id_number}
                                            onChange={(e) =>
                                                setData(
                                                    "id_number",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                        />
                                        <InputError
                                            message={errors.id_number}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "السجل التجاري (10 أرقام)"
                                                    : "CR Number (10 digits)"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm font-mono"
                                            value={data.cr_number}
                                            onChange={(e) =>
                                                setData(
                                                    "cr_number",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                            maxLength={10}
                                        />
                                        <InputError
                                            message={errors.cr_number}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الرقم الضريبي (15 رقم)"
                                                    : "VAT Number (15 digits)"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm font-mono"
                                            value={data.vat_number}
                                            onChange={(e) =>
                                                setData(
                                                    "vat_number",
                                                    e.target.value,
                                                )
                                            }
                                            dir="ltr"
                                            maxLength={15}
                                        />
                                        <InputError
                                            message={errors.vat_number}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "العنوان"
                                                    : "Address"
                                            }
                                        />
                                        <TextInput
                                            className="mt-0.5 block w-full text-sm"
                                            value={data.address}
                                            onChange={(e) =>
                                                setData(
                                                    "address",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.address} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                    <SecondaryButton
                                        type="button"
                                        onClick={() => {
                                            setEditMode(false);
                                            reset();
                                        }}
                                    >
                                        {lang === "ar" ? "إلغاء" : "Cancel"}
                                    </SecondaryButton>
                                    <PrimaryButton disabled={processing}>
                                        <Save className="h-3.5 w-3.5 me-1" />
                                        {lang === "ar"
                                            ? "حفظ التعديلات"
                                            : "Save Changes"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}
                    </SectionCard>

                    {/* ── Contacts ── */}
                    <SectionCard
                        title={lang === "ar" ? "جهات الاتصال" : "Contacts"}
                        icon={Phone}
                        action={
                            <Tooltip
                                text={
                                    lang === "ar"
                                        ? "إضافة جهة اتصال"
                                        : "Add Contact"
                                }
                            >
                                <button
                                    onClick={openAddContact}
                                    className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </Tooltip>
                        }
                    >
                        {customer.contacts?.length === 0 ? (
                            <p className="text-[12px] text-text-muted text-center py-4">
                                {lang === "ar"
                                    ? "لا توجد جهات اتصال"
                                    : "No contacts added"}
                            </p>
                        ) : (
                            <div className="divide-y divide-border -mx-4 -mt-4">
                                {customer.contacts.map((c) => (
                                    <div
                                        key={c.id}
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <User className="h-3.5 w-3.5" />
                                            </div>
                                            <div>
                                                <p className="text-[12px] font-semibold text-text">
                                                    {c.name}
                                                </p>
                                                <p
                                                    className="text-[10px] text-text-muted"
                                                    dir="ltr"
                                                >
                                                    {c.phone_number}{" "}
                                                    {c.job_title
                                                        ? `· ${c.job_title}`
                                                        : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {c.can_sign && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">
                                                    {lang === "ar"
                                                        ? "يوقّع"
                                                        : "Signs"}
                                                </span>
                                            )}
                                            {c.can_withdraw_goods && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">
                                                    {lang === "ar"
                                                        ? "يسحب"
                                                        : "Withdraws"}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-0.5">
                                                <Tooltip
                                                    text={
                                                        lang === "ar"
                                                            ? "تعديل"
                                                            : "Edit"
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            openEditContact(c)
                                                        }
                                                        className="p-1 rounded text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip
                                                    text={
                                                        lang === "ar"
                                                            ? "حذف"
                                                            : "Delete"
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            deleteContact(c)
                                                        }
                                                        className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    {/* ── Contracts ── */}
                    <SectionCard
                        title={lang === "ar" ? "العقود" : "Contracts"}
                        icon={FileText}
                        action={
                            <Tooltip
                                text={
                                    lang === "ar" ? "عقد جديد" : "New Contract"
                                }
                            >
                                <a
                                    href={route("contracts.create", {
                                        customer_id: customer.id,
                                    })}
                                    className="p-1.5 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors inline-flex"
                                >
                                    <Plus className="h-4 w-4" />
                                </a>
                            </Tooltip>
                        }
                    >
                        {!customer.contracts?.length ? (
                            <p className="text-[12px] text-text-muted text-center py-4">
                                {lang === "ar"
                                    ? "لا توجد عقود"
                                    : "No contracts yet"}
                            </p>
                        ) : (
                            <div className="divide-y divide-border -mx-4 -mt-4">
                                {customer.contracts.map((ct) => (
                                    <div
                                        key={ct.id}
                                        className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-muted/40 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <div>
                                                <a
                                                    href={route(
                                                        "contracts.show",
                                                        ct.id,
                                                    )}
                                                    className="text-[12px] font-semibold text-primary hover:underline font-mono block"
                                                >
                                                    {ct.contract_number}
                                                </a>
                                                <p
                                                    className="text-[10px] text-text-muted"
                                                    dir="ltr"
                                                >
                                                    {ct.start_date} →{" "}
                                                    {ct.end_date}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                                ct.status === "active"
                                                    ? "bg-emerald-500/10 text-emerald-600"
                                                    : ct.status === "draft"
                                                      ? "bg-gray-500/10 text-gray-500"
                                                      : ct.status === "expiring"
                                                        ? "bg-amber-500/10 text-amber-600"
                                                        : "bg-danger/10 text-danger"
                                            }`}
                                        >
                                            {ct.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>

            {/* ── Add Contact Modal ── */}
            <Modal
                show={isContactModal}
                onClose={() => {
                    setContactModal(false);
                    setEditingContact(null);
                }}
                maxWidth="md"
            >
                <form onSubmit={saveContact} className="p-5 space-y-3">
                    <h3 className="text-[14px] font-bold text-text mb-3">
                        {editingContact
                            ? lang === "ar"
                                ? "تعديل جهة الاتصال"
                                : "Edit Contact"
                            : lang === "ar"
                              ? "إضافة جهة اتصال"
                              : "Add Contact"}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <InputLabel
                                value={lang === "ar" ? "الاسم *" : "Name *"}
                            />
                            <TextInput
                                className="mt-0.5 w-full text-sm"
                                value={contactForm.data.name}
                                onChange={(e) =>
                                    contactForm.setData("name", e.target.value)
                                }
                                required
                            />
                            <InputError message={contactForm.errors.name} />
                        </div>
                        <div>
                            <InputLabel
                                value={lang === "ar" ? "الهاتف *" : "Phone *"}
                            />
                            <TextInput
                                className="mt-0.5 w-full text-sm font-mono"
                                value={contactForm.data.phone_number}
                                onChange={(e) =>
                                    contactForm.setData(
                                        "phone_number",
                                        e.target.value,
                                    )
                                }
                                dir="ltr"
                                required
                            />
                            <InputError
                                message={contactForm.errors.phone_number}
                            />
                        </div>
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "الهوية/الإقامة"
                                        : "ID / Residence"
                                }
                            />
                            <TextInput
                                className="mt-0.5 w-full text-sm font-mono"
                                value={contactForm.data.id_number}
                                onChange={(e) =>
                                    contactForm.setData(
                                        "id_number",
                                        e.target.value,
                                    )
                                }
                                dir="ltr"
                            />
                            <InputError
                                message={contactForm.errors.id_number}
                            />
                        </div>
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "المسمى الوظيفي"
                                        : "Job Title"
                                }
                            />
                            <TextInput
                                className="mt-0.5 w-full text-sm"
                                value={contactForm.data.job_title}
                                onChange={(e) =>
                                    contactForm.setData(
                                        "job_title",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <div className="col-span-2 flex gap-6 pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text">
                                <input
                                    type="checkbox"
                                    checked={contactForm.data.can_sign}
                                    onChange={(e) =>
                                        contactForm.setData(
                                            "can_sign",
                                            e.target.checked,
                                        )
                                    }
                                    className="rounded border-border text-primary h-4 w-4"
                                />
                                {lang === "ar" ? "صلاحية التوقيع" : "Can Sign"}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-text">
                                <input
                                    type="checkbox"
                                    checked={
                                        contactForm.data.can_withdraw_goods
                                    }
                                    onChange={(e) =>
                                        contactForm.setData(
                                            "can_withdraw_goods",
                                            e.target.checked,
                                        )
                                    }
                                    className="rounded border-border text-primary h-4 w-4"
                                />
                                {lang === "ar"
                                    ? "صلاحية سحب البضاعة"
                                    : "Can Withdraw Goods"}
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => {
                                setContactModal(false);
                                setEditingContact(null);
                            }}
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={contactForm.processing}>
                            {editingContact
                                ? lang === "ar"
                                    ? "حفظ التعديلات"
                                    : "Save Changes"
                                : lang === "ar"
                                  ? "إضافة"
                                  : "Add"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* ── Delete Contact Confirm ── */}
            <ConfirmationModal
                show={!!itemToDelete}
                title={lang === "ar" ? "حذف جهة الاتصال" : "Delete Contact"}
                message={lang === "ar"
                    ? "هل أنت متأكد من حذف جهة الاتصال هذه؟ هذا الإجراء يتطلب كلمة مرور العمليات."
                    : "Are you sure you want to delete this contact? This requires secure operations password."}
                confirmLabel={lang === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                cancelLabel={lang === "ar" ? "إلغاء" : "Cancel"}
                requirePassword={true}
                passwordValue={deletePassword}
                onPasswordChange={setDeletePassword}
                passwordError={deleteError}
                onConfirm={() => confirmDelete()}
                onCancel={cancelDelete}
                processing={deleteProcessing}
                type="danger"
            >
                {itemToDelete && (
                    <div className="bg-surface-muted/50 p-3 border border-border text-xs rounded-md mt-4 text-center">
                        <span className="font-bold text-text">{itemToDelete?.name}</span>
                    </div>
                )}
            </ConfirmationModal>
        </AuthenticatedLayout>
    );
}
