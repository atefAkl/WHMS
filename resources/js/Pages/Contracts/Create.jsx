import React, { useState, useEffect, useMemo, useRef } from "react";
import { Head, router, useForm } from "@inertiajs/react";
import axios from "axios";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Calendar,
    Users,
    Box,
    FileText,
    CreditCard,
    ChevronRight,
    ChevronLeft,
    Plus,
    Trash2,
    Save,
    FileEdit,
    X,
    Check,
    Building2,
    User,
    GripVertical,
    Variable,
} from "lucide-react";
import Modal from "@/Components/Modal";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";

// -- Helper to get Hijri Date --
const getHijriDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(d);
};

export default function Create({
    customer,
    contacts: initialContacts,
    seasonTerms: initialSeasonTerms,
    allTerms: initialAllTerms,
    storageItems,
    nextSerial,
    defaults,
    settings,
    typeDefaults,
}) {
    const { lang } = useLang();
    const today = new Date().toISOString().split("T")[0];
    const [currentStep, setCurrentStep] = useState(1);
    const [contacts, setContacts] = useState(initialContacts || []);
    const [allTerms] = useState(initialAllTerms || []);

    // Terms with drag-and-drop: preloaded from season, user can reorder or add/remove
    const [activeTerms, setActiveTerms] = useState(initialSeasonTerms || []);
    const [termSearch, setTermSearch] = useState("");
    const termDragIndex = useRef(null);
    const [termDragOver, setTermDragOver] = useState(null);

    const syncTermIds = (list) => {
        setData(
            "term_ids",
            list.map((t) => t.id),
        );
    };

    const toggleTerm = (term) => {
        const isIn = activeTerms.some((t) => t.id === term.id);
        const newList = isIn
            ? activeTerms.filter((t) => t.id !== term.id)
            : [...activeTerms, term];
        setActiveTerms(newList);
        syncTermIds(newList);
    };

    const onTermDragStart = (index) => {
        termDragIndex.current = index;
    };
    const onTermDragEnter = (index) => {
        setTermDragOver(index);
    };
    const onTermDragEnd = () => {
        if (
            termDragIndex.current === null ||
            termDragOver === null ||
            termDragIndex.current === termDragOver
        ) {
            termDragIndex.current = null;
            setTermDragOver(null);
            return;
        }
        const reordered = [...activeTerms];
        const [moved] = reordered.splice(termDragIndex.current, 1);
        reordered.splice(termDragOver, 0, moved);
        setActiveTerms(reordered);
        syncTermIds(reordered);
        termDragIndex.current = null;
        setTermDragOver(null);
    };

    // Modals
    const [showContactModal, setShowContactModal] = useState(false);
    const [showTermModal, setShowTermModal] = useState(false);

    // Form data
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        customer_id: customer.id,
        contract_type: defaults?.contract_type || "managed",
        contract_number: nextSerial,
        write_date: new Date().toISOString().split("T")[0],
        write_date_hijri: "",
        start_date: new Date().toISOString().split("T")[0],
        start_date_hijri: "",
        end_date: "",
        mandatory_period: defaults?.mandatory_period || 12,
        renewal_period: defaults?.renewal_period || 12,
        contact_id: "",
        introduction: defaults?.introduction || "",
        preamble: defaults?.preamble || "",
        contract_title: defaults?.contract_title || "",
        footer: defaults?.footer || "",
        season_id: defaults?.season_id || "",
        items: [
            {
                storage_item_id: storageItems[0]?.id || "",
                unit_count: 1,
                monthly_rent: storageItems[0]?.default_price || 0,
                discount: 0,
            },
        ],
        term_ids: (initialSeasonTerms || []).map((t) => t.id),
        payments: [],
    });

    const applyContractTypeDefaults = (contractType) => {
        const selectedDefaults = typeDefaults?.[contractType] || {};
        setData("contract_type", contractType);
        setData("introduction", selectedDefaults.introduction || "");
        setData("preamble", selectedDefaults.preamble || "");
        setData("contract_title", selectedDefaults.contract_title || "");
        setData("footer", selectedDefaults.footer || "");
    };

    // Update Hijri dates automatically
    useEffect(() => {
        setData("write_date_hijri", getHijriDate(data.write_date));
    }, [data.write_date]);

    useEffect(() => {
        setData("start_date_hijri", getHijriDate(data.start_date));
    }, [data.start_date]);

    // -- Helper to resolve variables in term text --
    const resolveTermText = (text) => {
        if (!text) return text;

        // Find selected contact name
        const selectedContact = contacts.find(
            (c) => c.id === parseInt(data.contact_id),
        );
        const contactName = selectedContact
            ? selectedContact.name
            : "__________";

        return text
            .replace(
                /\{\$company_name\}/g,
                settings?.company_name || "__________",
            )
            .replace(
                /\{\$company_slogan\}/g,
                settings?.company_slogan || "__________",
            )
            .replace(/\{\$company_cr\}/g, settings?.company_cr || "__________")
            .replace(
                /\{\$company_vat\}/g,
                settings?.company_vat || "__________",
            )
            .replace(
                /\{\$company_license\}/g,
                settings?.company_license || "__________",
            )
            .replace(
                /\{\$company_phone\}/g,
                settings?.company_phone || "__________",
            )
            .replace(
                /\{\$company_email\}/g,
                settings?.company_email || "__________",
            )
            .replace(
                /\{\$company_address\}/g,
                settings?.company_address || "__________",
            )
            .replace(/\{\$company_gm\}/g, settings?.company_gm || "__________")
            .replace(
                /\{\$company_dgm\}/g,
                settings?.company_dgm || "__________",
            )
            .replace(
                /\{\$mandatory_period\}/g,
                data.mandatory_period || "__________",
            )
            .replace(/\{\$renew_period\}/g, data.renewal_period || "__________")
            .replace(
                /\{\$customer_name\}/g,
                customer.name_ar || customer.name || "__________",
            )
            .replace(
                /\{\$customer_phone\}/g,
                customer.phone_number || customer.phone || "__________",
            )
            .replace(/\{\$contact_name\}/g, contactName)
            .replace(
                /\{\$contract_number\}/g,
                data.contract_number || "__________",
            )
            .replace(/\{\$start_date\}/g, data.start_date || "__________");
    };

    // Contact form
    const [contactForm, setContactForm] = useState({
        name: "",
        phone_number: "",
        id_number: "",
        job_title: "",
        can_sign: false,
        can_withdraw_goods: false,
    });
    const [contactErrors, setContactErrors] = useState({});

    const saveContact = (e) => {
        e.preventDefault();
        axios
            .post(route("customers.contacts.store", customer.id), contactForm)
            .then((res) => {
                setShowContactModal(false);
                setContactForm({
                    name: "",
                    phone_number: "",
                    id_number: "",
                    job_title: "",
                    can_sign: false,
                    can_withdraw_goods: false,
                });
                const contact = res.data?.contact || res.data?.data?.contact;
                if (contact) {
                    setContacts([...contacts, contact]);
                    setData("contact_id", contact.id);
                }
            })
            .catch((err) => setContactErrors(err.response?.data?.errors || {}));
    };

    // Term form
    const [termForm, setTermForm] = useState({
        text_ar: "",
        text_en: "",
        has_variables: false,
    });
    const saveTerm = (e) => {
        e.preventDefault();
        if (!termForm.text_ar.trim()) return;
        const customId = "custom_" + termForm.text_ar;
        const newTerm = {
            id: customId,
            text_ar: termForm.text_ar,
            text_en: termForm.text_en,
            has_variables: termForm.text_ar.includes("{$"),
            is_custom: true,
        };
        const newList = [...activeTerms, newTerm];
        setActiveTerms(newList);
        syncTermIds(newList);
        setShowTermModal(false);
        setTermForm({ text_ar: "", text_en: "", has_variables: false });
    };

    const submit = (status) => {
        data.status = status;
        post(route("contracts.store"));
    };

    const steps = [
        {
            id: 1,
            title: lang === "ar" ? "التقسيم الزمني" : "Timing",
            icon: Calendar,
        },
        {
            id: 2,
            title: lang === "ar" ? "أصحاب المصلحة" : "Stakeholders",
            icon: Users,
        },
        {
            id: 3,
            title: lang === "ar" ? "وحدات التخزين" : "Storage Allocation",
            icon: Box,
        },
        { id: 4, title: lang === "ar" ? "الشروط" : "Terms", icon: FileText },
        {
            id: 5,
            title: lang === "ar" ? "المدفوعات" : "Payments",
            icon: CreditCard,
        },
    ];

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span
                        className="cursor-pointer hover:text-primary"
                        onClick={() => router.get(route("customers.index"))}
                    >
                        {lang === "ar" ? "العملاء" : "Customers"}
                    </span>
                    <ChevronRight
                        className={
                            lang === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"
                        }
                    />
                    <span
                        className="cursor-pointer hover:text-primary"
                        onClick={() =>
                            router.get(route("customers.show", customer.id))
                        }
                    >
                        {customer.name}
                    </span>
                    <ChevronRight
                        className={
                            lang === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"
                        }
                    />
                    <span className="text-primary font-bold">
                        {lang === "ar" ? "عقد جديد" : "New Contract"} (
                        {nextSerial})
                    </span>
                </div>
            }
        >
            <Head title={lang === "ar" ? "إنشاء عقد" : "Create Contract"} />

            <div className="max-w-5xl mx-auto pb-8">
                {/* Stepper */}
                <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className="flex flex-col items-center relative z-10 w-full min-w-[100px]"
                        >
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${currentStep >= step.id ? "border-primary bg-primary text-white" : "border-border bg-surface text-text-muted"}`}
                            >
                                <step.icon className="h-5 w-5" />
                            </div>
                            <span
                                className={`mt-2 text-xs font-semibold text-center ${currentStep >= step.id ? "text-primary" : "text-text-muted"}`}
                            >
                                {step.title}
                            </span>
                            {index < steps.length - 1 && (
                                <div
                                    className={`absolute top-5 h-[2px] w-full -z-10 ${lang === "ar" ? "right-1/2" : "left-1/2"} ${currentStep > step.id ? "bg-primary" : "bg-border"}`}
                                ></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Wrapper */}
                <div className="bg-surface border border-border shadow-sm rounded-xl p-6 min-h-[400px]">
                    {/* Step 1: Timing */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold border-b border-border pb-2">
                                {lang === "ar"
                                    ? "التقسيم الزمني"
                                    : "Timing Settings"}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "نوع العقد"
                                                : "Contract Type"
                                        }
                                    />
                                    <select
                                        className="mt-1 block w-full rounded-md border-border bg-surface text-sm"
                                        value={data.contract_type}
                                        onChange={(e) =>
                                            applyContractTypeDefaults(
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="managed">
                                            {lang === "ar"
                                                ? "عقد مدار"
                                                : "Managed Contract"}
                                        </option>
                                        <option value="free">
                                            {lang === "ar"
                                                ? "عقد حر"
                                                : "Free Contract"}
                                        </option>
                                    </select>
                                    <p className="text-[10px] text-text-muted mt-1">
                                        {data.contract_type === "managed"
                                            ? lang === "ar"
                                                ? "مخصص للعقود المرتبطة بحركة البضاعة والاستلام والتسليم."
                                                : "Used for contracts tied to stock movement, receptions, and deliveries."
                                            : lang === "ar"
                                              ? "مخصص للعقود الزمنية الحرة غير المرتبطة بحركة مخزنية."
                                              : "Used for free time-based contracts without stock movement tracking."}
                                    </p>
                                    <InputError
                                        message={errors.contract_type}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "تاريخ كتابة العقد"
                                                : "Write Date"
                                        }
                                    />
                                    <TextInput
                                        type="date"
                                        className="mt-1 w-full"
                                        value={data.write_date}
                                        onChange={(e) =>
                                            setData(
                                                "write_date",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.write_date}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "التاريخ الهجري"
                                                : "Hijri Date"
                                        }
                                    />
                                    <TextInput
                                        type="text"
                                        className="mt-1 w-full bg-surface-muted"
                                        value={data.write_date_hijri}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "تاريخ بداية العقد"
                                                : "Start Date"
                                        }
                                    />
                                    <TextInput
                                        type="date"
                                        className="mt-1 w-full"
                                        min={data.write_date}
                                        value={data.start_date}
                                        onChange={(e) =>
                                            setData(
                                                "start_date",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <InputError
                                        message={errors.start_date}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "تاريخ البداية الهجري"
                                                : "Hijri Start Date"
                                        }
                                    />
                                    <TextInput
                                        type="text"
                                        className="mt-1 w-full bg-surface-muted"
                                        value={data.start_date_hijri}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "الفترة الإلزامية (بالأشهر)"
                                                : "Mandatory Period (Months)"
                                        }
                                    />
                                    <TextInput
                                        type="number"
                                        min="1"
                                        max="12"
                                        className="mt-1 w-full"
                                        value={data.mandatory_period}
                                        onChange={(e) =>
                                            setData(
                                                "mandatory_period",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-[10px] text-text-muted mt-1">
                                        {lang === "ar"
                                            ? "يجب أن تكون بين 1 و 12 شهراً"
                                            : "Must be between 1 and 12 months"}
                                    </p>
                                    <InputError
                                        message={errors.mandatory_period}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "فترة التجديد (بالأشهر)"
                                                : "Renewal Period (Months)"
                                        }
                                    />
                                    <TextInput
                                        type="number"
                                        min="0"
                                        className="mt-1 w-full"
                                        value={data.renewal_period}
                                        onChange={(e) =>
                                            setData(
                                                "renewal_period",
                                                e.target.value,
                                            )
                                        }
                                    />
                                    <p className="text-[10px] text-text-muted mt-1">
                                        {lang === "ar"
                                            ? "اكتب 0 لعدم التجديد"
                                            : "Enter 0 for no renewal"}
                                    </p>
                                    <InputError
                                        message={errors.renewal_period}
                                        className="mt-1"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-border pt-4 mt-4 space-y-4">
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "عنوان العقد"
                                                : "Contract Title"
                                        }
                                    />
                                    <TextInput
                                        type="text"
                                        className="mt-1 w-full"
                                        value={data.contract_title}
                                        onChange={(e) =>
                                            setData(
                                                "contract_title",
                                                e.target.value,
                                            )
                                        }
                                        placeholder={
                                            lang === "ar"
                                                ? "مثال: عقد إيجار مساحات تخزينية"
                                                : "Ex: Storage Space Lease Contract"
                                        }
                                    />
                                    <InputError
                                        message={errors.contract_title}
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "تذييل/ذيل العقد"
                                                : "Contract Footer"
                                        }
                                    />
                                    <textarea
                                        className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[80px]"
                                        value={data.footer}
                                        onChange={(e) =>
                                            setData("footer", e.target.value)
                                        }
                                        placeholder={
                                            lang === "ar"
                                                ? "نص تذييل العقد، شروط خاصة بالتسليم والتواقيع..."
                                                : "Contract footer text, delivery conditions, signatures..."
                                        }
                                    />
                                    <InputError
                                        message={errors.footer}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Stakeholders */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold border-b border-border pb-2">
                                {lang === "ar"
                                    ? "أصحاب المصلحة"
                                    : "Stakeholders"}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Institution */}
                                <div className="p-4 border border-border rounded-lg bg-surface-muted">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        <h3 className="font-bold">
                                            {lang === "ar"
                                                ? "المؤسسة (الطرف الأول)"
                                                : "Institution"}
                                        </h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-text-muted">
                                                {lang === "ar"
                                                    ? "الاسم:"
                                                    : "Name:"}
                                            </span>{" "}
                                            {settings?.company_name ||
                                                "Warehouse OS"}
                                        </p>
                                        <p>
                                            <span className="text-text-muted">
                                                {lang === "ar"
                                                    ? "السجل التجاري:"
                                                    : "CR Number:"}
                                            </span>{" "}
                                            {settings?.company_cr ||
                                                "1010101010"}
                                        </p>
                                        <p>
                                            <span className="text-text-muted">
                                                {lang === "ar"
                                                    ? "الرقم الضريبي:"
                                                    : "VAT Number:"}
                                            </span>{" "}
                                            {settings?.company_vat ||
                                                "300000000000003"}
                                        </p>
                                    </div>
                                </div>

                                {/* Customer */}
                                <div className="p-4 border border-border rounded-lg bg-surface-muted">
                                    <div className="flex items-center gap-2 mb-3">
                                        <User className="h-5 w-5 text-primary" />
                                        <h3 className="font-bold">
                                            {lang === "ar"
                                                ? "العميل (الطرف الثاني)"
                                                : "Customer"}
                                        </h3>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <p>
                                            <span className="text-text-muted">
                                                {lang === "ar"
                                                    ? "الاسم:"
                                                    : "Name:"}
                                            </span>{" "}
                                            {customer.name}
                                        </p>
                                        <p>
                                            <span className="text-text-muted">
                                                {lang === "ar"
                                                    ? "الهاتف:"
                                                    : "Phone:"}
                                            </span>{" "}
                                            <span dir="ltr">
                                                {customer.phone_number}
                                            </span>
                                        </p>
                                        <p>
                                            <span className="text-text-muted">
                                                {lang === "ar"
                                                    ? "المعرف:"
                                                    : "ID:"}
                                            </span>{" "}
                                            {customer.cr_number ||
                                                customer.id_number ||
                                                "---"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact (Agent) */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-2">
                                    <InputLabel
                                        value={
                                            lang === "ar"
                                                ? "النائب / المندوب"
                                                : "Agent / Representative"
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowContactModal(true)
                                        }
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" />{" "}
                                        {lang === "ar"
                                            ? "إضافة مندوب جديد"
                                            : "Add New Agent"}
                                    </button>
                                </div>
                                <select
                                    className="w-full rounded-md border-border bg-surface text-sm"
                                    value={data.contact_id}
                                    onChange={(e) =>
                                        setData("contact_id", e.target.value)
                                    }
                                >
                                    <option value="">
                                        {lang === "ar"
                                            ? "-- بدون مندوب --"
                                            : "-- No Agent --"}
                                    </option>
                                    {contacts.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} - {c.phone_number}
                                        </option>
                                    ))}
                                </select>
                                <InputError
                                    message={errors.contact_id}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Storage Allocation */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold border-b border-border pb-2">
                                {lang === "ar"
                                    ? "وحدات التخزين"
                                    : "Storage Allocation"}
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-start">
                                    <thead className="bg-surface-muted text-text-muted text-[11px] uppercase">
                                        <tr>
                                            <th className="px-3 py-2">
                                                {lang === "ar"
                                                    ? "الصنف"
                                                    : "Item"}
                                            </th>
                                            <th className="px-3 py-2 w-24">
                                                {lang === "ar"
                                                    ? "العدد"
                                                    : "Qty"}
                                            </th>
                                            <th className="px-3 py-2 w-32">
                                                {lang === "ar"
                                                    ? "الإيجار (شامل الضريبة)"
                                                    : "Rent (Inc. VAT)"}
                                            </th>
                                            <th className="px-3 py-2 w-28">
                                                {lang === "ar"
                                                    ? "خصم (مبلغ)"
                                                    : "Discount"}
                                            </th>
                                            <th className="px-3 py-2">
                                                {lang === "ar"
                                                    ? "الإجمالي"
                                                    : "Total"}
                                            </th>
                                            <th className="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {data.items.map((item, index) => {
                                            const mandatoryPeriod =
                                                parseInt(
                                                    data.mandatory_period,
                                                ) || 1;
                                            const totalInclusiveVat =
                                                item.unit_count *
                                                    mandatoryPeriod *
                                                    item.monthly_rent -
                                                (item.discount || 0);

                                            return (
                                                <tr key={index}>
                                                    <td className="px-3 py-2">
                                                        <select
                                                            className="w-full rounded border-border text-sm p-1.5"
                                                            value={
                                                                item.storage_item_id
                                                            }
                                                            onChange={(e) => {
                                                                const newItems =
                                                                    [
                                                                        ...data.items,
                                                                    ];
                                                                newItems[
                                                                    index
                                                                ].storage_item_id =
                                                                    e.target.value;
                                                                // auto-update rent if selected
                                                                const selectedItem =
                                                                    storageItems.find(
                                                                        (s) =>
                                                                            s.id ==
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    );
                                                                if (
                                                                    selectedItem
                                                                )
                                                                    newItems[
                                                                        index
                                                                    ].monthly_rent =
                                                                        selectedItem.default_price;
                                                                setData(
                                                                    "items",
                                                                    newItems,
                                                                );
                                                            }}
                                                        >
                                                            {storageItems.map(
                                                                (si) => (
                                                                    <option
                                                                        key={
                                                                            si.id
                                                                        }
                                                                        value={
                                                                            si.id
                                                                        }
                                                                    >
                                                                        {lang ===
                                                                        "ar"
                                                                            ? si.name_ar
                                                                            : si.name_en ||
                                                                              si.name_ar}
                                                                    </option>
                                                                ),
                                                            )}
                                                        </select>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="w-full rounded border-border text-sm p-1.5"
                                                            value={
                                                                item.unit_count
                                                            }
                                                            onChange={(e) => {
                                                                const newItems =
                                                                    [
                                                                        ...data.items,
                                                                    ];
                                                                newItems[
                                                                    index
                                                                ].unit_count =
                                                                    e.target.value;
                                                                setData(
                                                                    "items",
                                                                    newItems,
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full rounded border-border text-sm p-1.5"
                                                            value={
                                                                item.monthly_rent
                                                            }
                                                            onChange={(e) => {
                                                                const newItems =
                                                                    [
                                                                        ...data.items,
                                                                    ];
                                                                newItems[
                                                                    index
                                                                ].monthly_rent =
                                                                    e.target.value;
                                                                setData(
                                                                    "items",
                                                                    newItems,
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full rounded border-border text-sm p-1.5"
                                                            value={
                                                                item.discount
                                                            }
                                                            onChange={(e) => {
                                                                const newItems =
                                                                    [
                                                                        ...data.items,
                                                                    ];
                                                                newItems[
                                                                    index
                                                                ].discount =
                                                                    e.target.value;
                                                                setData(
                                                                    "items",
                                                                    newItems,
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 text-xs font-mono font-bold text-emerald-600"
                                                        dir="ltr"
                                                    >
                                                        {totalInclusiveVat.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-end">
                                                        {data.items.length >
                                                            1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newItems =
                                                                        data.items.filter(
                                                                            (
                                                                                _,
                                                                                i,
                                                                            ) =>
                                                                                i !==
                                                                                index,
                                                                        );
                                                                    setData(
                                                                        "items",
                                                                        newItems,
                                                                    );
                                                                }}
                                                                className="p-1 text-danger hover:bg-danger/10 rounded"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setData("items", [
                                        ...data.items,
                                        {
                                            storage_item_id:
                                                storageItems[0]?.id || "",
                                            unit_count: 1,
                                            monthly_rent:
                                                storageItems[0]
                                                    ?.default_price || 0,
                                            discount: 0,
                                        },
                                    ])
                                }
                                className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
                            >
                                <Plus className="h-4 w-4" />{" "}
                                {lang === "ar" ? "إضافة صف" : "Add Row"}
                            </button>
                            <InputError
                                message={errors.items}
                                className="mt-1"
                            />
                        </div>
                    )}

                    {/* Step 4: Terms */}
                    {currentStep === 4 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold border-b border-border pb-2">
                                {lang === "ar"
                                    ? "شروط العقد"
                                    : "Contract Terms"}
                            </h2>

                            <div className="grid grid-cols-5 gap-4">
                                {/* Left col: library picker (2/5) */}
                                <div className="col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wide">
                                            {lang === "ar"
                                                ? "مكتبة الشروط"
                                                : "Terms Library"}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allFiltered =
                                                    allTerms.filter(
                                                        (t) =>
                                                            !activeTerms.some(
                                                                (at) =>
                                                                    at.id ===
                                                                    t.id,
                                                            ),
                                                    );
                                                const newList = [
                                                    ...activeTerms,
                                                    ...allFiltered,
                                                ];
                                                setActiveTerms(newList);
                                                syncTermIds(newList);
                                            }}
                                            className="text-[10px] text-primary hover:underline"
                                        >
                                            {lang === "ar"
                                                ? "اختيار الكل"
                                                : "Select All"}
                                        </button>
                                    </div>

                                    {/* Search Library */}
                                    <div className="relative mb-2">
                                        <input
                                            type="text"
                                            className="w-full rounded-md border-border bg-surface text-[12px] py-1.5 px-3 focus:border-primary focus:ring-0"
                                            placeholder={
                                                lang === "ar"
                                                    ? "بحث في الشروط..."
                                                    : "Search terms..."
                                            }
                                            value={termSearch}
                                            onChange={(e) =>
                                                setTermSearch(e.target.value)
                                            }
                                        />
                                    </div>

                                    <div className="border border-border rounded-lg divide-y divide-border max-h-[340px] overflow-y-auto">
                                        {allTerms.filter(
                                            (t) =>
                                                t.text_ar
                                                    .toLowerCase()
                                                    .includes(
                                                        termSearch.toLowerCase(),
                                                    ) ||
                                                (t.text_en &&
                                                    t.text_en
                                                        .toLowerCase()
                                                        .includes(
                                                            termSearch.toLowerCase(),
                                                        )),
                                        ).length === 0 ? (
                                            <p className="p-4 text-center text-[12px] text-text-muted">
                                                {lang === "ar"
                                                    ? "لا توجد نتائج."
                                                    : "No results."}
                                            </p>
                                        ) : (
                                            allTerms
                                                .filter(
                                                    (t) =>
                                                        t.text_ar
                                                            .toLowerCase()
                                                            .includes(
                                                                termSearch.toLowerCase(),
                                                            ) ||
                                                        (t.text_en &&
                                                            t.text_en
                                                                .toLowerCase()
                                                                .includes(
                                                                    termSearch.toLowerCase(),
                                                                )),
                                                )
                                                .map((term) => {
                                                    const isIn =
                                                        activeTerms.some(
                                                            (t) =>
                                                                t.id ===
                                                                term.id,
                                                        );
                                                    return (
                                                        <div
                                                            key={term.id}
                                                            onClick={() =>
                                                                toggleTerm(term)
                                                            }
                                                            className={`flex items-start gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${isIn ? "bg-primary/5" : "hover:bg-surface-muted/40"}`}
                                                        >
                                                            <div
                                                                className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isIn ? "bg-primary border-primary" : "border-border"}`}
                                                            >
                                                                {isIn && (
                                                                    <Check className="h-2.5 w-2.5 text-white" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[12px] text-text leading-relaxed">
                                                                    {resolveTermText(
                                                                        term.text_ar,
                                                                    )}
                                                                </p>
                                                                {term.has_variables && (
                                                                    <span className="text-[9px] text-amber-600 flex items-center gap-0.5 mt-0.5">
                                                                        <Variable className="h-2.5 w-2.5" />{" "}
                                                                        {lang ===
                                                                        "ar"
                                                                            ? "معاينة حية"
                                                                            : "Live Preview"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowTermModal(true)}
                                        className="mt-2 text-[12px] text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" />{" "}
                                        {lang === "ar"
                                            ? "إضافة شرط مخصص للعقد"
                                            : "Add contract-specific term"}
                                    </button>

                                    {/* Variables Helper for User */}
                                    <div className="mt-6 p-4 bg-surface-muted border border-border rounded-xl">
                                        <div className="flex items-center gap-2 mb-3 text-text font-bold text-xs uppercase tracking-wider">
                                            <Variable className="h-4 w-4 text-primary" />
                                            {lang === "ar"
                                                ? "دليل المتغيرات الذكية"
                                                : "Smart Variables Guide"}
                                        </div>
                                        <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
                                            {lang === "ar"
                                                ? "يمكنك استخدام هذه المتغيرات في نص الشروط ليتم استبدالها آلياً ببيانات العقد الحقيقية:"
                                                : "Use these variables in term text to automatically replace them with real contract data:"}
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "اسم الشركة"
                                                            : "Company Name",
                                                    code: "{$company_name}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "سجل الشركة"
                                                            : "Company CR",
                                                    code: "{$company_cr}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "ترخيص الشركة"
                                                            : "License No.",
                                                    code: "{$company_license}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "ممثل الشركة"
                                                            : "Company GM",
                                                    code: "{$company_gm}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "عنوان الشركة"
                                                            : "Company Address",
                                                    code: "{$company_address}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "اسم العميل"
                                                            : "Customer Name",
                                                    code: "{$customer_name}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "هاتف العميل"
                                                            : "Customer Phone",
                                                    code: "{$customer_phone}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "اسم المندوب"
                                                            : "Contact Name",
                                                    code: "{$contact_name}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "رقم العقد"
                                                            : "Contract No.",
                                                    code: "{$contract_number}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "تاريخ البداية"
                                                            : "Start Date",
                                                    code: "{$start_date}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "الفترة الإلزامية"
                                                            : "Mandatory Per.",
                                                    code: "{$mandatory_period}",
                                                },
                                                {
                                                    label:
                                                        lang === "ar"
                                                            ? "فترة التجديد"
                                                            : "Renewal Per.",
                                                    code: "{$renew_period}",
                                                },
                                            ].map((v) => (
                                                <div
                                                    key={v.code}
                                                    className="flex items-center justify-between group"
                                                >
                                                    <span className="text-[11px] text-text-muted">
                                                        {v.label}
                                                    </span>
                                                    <code
                                                        className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-primary font-mono group-hover:border-primary transition-colors cursor-help"
                                                        title={
                                                            lang === "ar"
                                                                ? "انسخ واستخدم هذا الكود"
                                                                : "Copy and use this code"
                                                        }
                                                    >
                                                        {v.code}
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right col: active terms (ordered, drag-and-drop) (3/5) */}
                                <div className="col-span-3">
                                    <p className="text-[11px] font-bold text-text-muted uppercase tracking-wide mb-2">
                                        {lang === "ar"
                                            ? `الشروط المطبقة على العقد (${activeTerms.length})`
                                            : `Applied Terms (${activeTerms.length})`}
                                    </p>
                                    {activeTerms.length === 0 ? (
                                        <div className="border border-dashed border-border rounded-lg p-8 text-center text-[12px] text-text-muted">
                                            {lang === "ar"
                                                ? "اختر شروطاً من المكتبة لإضافتها للعقد"
                                                : "Select terms from the library"}
                                        </div>
                                    ) : (
                                        <div className="border border-border rounded-lg divide-y divide-border max-h-[380px] overflow-y-auto">
                                            {activeTerms.map((term, index) => {
                                                return (
                                                    <div
                                                        key={term.id}
                                                        draggable
                                                        onDragStart={() =>
                                                            onTermDragStart(
                                                                index,
                                                            )
                                                        }
                                                        onDragEnter={() =>
                                                            onTermDragEnter(
                                                                index,
                                                            )
                                                        }
                                                        onDragEnd={
                                                            onTermDragEnd
                                                        }
                                                        onDragOver={(e) =>
                                                            e.preventDefault()
                                                        }
                                                        className={`flex items-start gap-2.5 px-3 py-2.5 select-none transition-colors ${
                                                            termDragOver ===
                                                            index
                                                                ? "bg-primary/5"
                                                                : "hover:bg-surface-muted/30"
                                                        }`}
                                                    >
                                                        <div className="cursor-grab active:cursor-grabbing text-text-muted mt-0.5 shrink-0">
                                                            <GripVertical className="h-4 w-4" />
                                                        </div>
                                                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] text-text leading-relaxed">
                                                                {resolveTermText(
                                                                    term.text_ar,
                                                                )}
                                                            </p>
                                                            {term.is_custom && (
                                                                <span className="text-[9px] bg-purple-500/10 text-purple-600 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold me-2">
                                                                    {lang ===
                                                                    "ar"
                                                                        ? "شرط خاص بالعقد"
                                                                        : "Custom Term"}
                                                                </span>
                                                            )}
                                                            {term.has_variables && (
                                                                <span className="text-[9px] text-amber-600 inline-flex items-center gap-0.5 mt-0.5">
                                                                    <Variable className="h-2.5 w-2.5" />{" "}
                                                                    {lang ===
                                                                    "ar"
                                                                        ? "معاينة مع القيم الفعلية"
                                                                        : "Preview with actual values"}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                toggleTerm(term)
                                                            }
                                                            className="p-1 text-text-muted hover:text-danger shrink-0"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 5: Payments */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold border-b border-border pb-2">
                                {lang === "ar"
                                    ? "المدفوعات الأولية (اختياري)"
                                    : "Initial Payments (Optional)"}
                            </h2>

                            <div className="space-y-3">
                                {data.payments.map((payment, index) => (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end p-4 border border-border rounded-lg bg-surface-muted relative"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newPayments =
                                                    data.payments.filter(
                                                        (_, i) => i !== index,
                                                    );
                                                setData(
                                                    "payments",
                                                    newPayments,
                                                );
                                            }}
                                            className="absolute top-2 left-2 p-1 text-danger hover:bg-danger/10 rounded"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>

                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "المبلغ"
                                                        : "Amount"
                                                }
                                            />
                                            <TextInput
                                                type="number"
                                                step="0.01"
                                                className="mt-1 w-full text-sm"
                                                value={payment.amount}
                                                onChange={(e) => {
                                                    const newP = [
                                                        ...data.payments,
                                                    ];
                                                    newP[index].amount =
                                                        e.target.value;
                                                    setData("payments", newP);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "التاريخ"
                                                        : "Date"
                                                }
                                            />
                                            <TextInput
                                                type="date"
                                                className="mt-1 w-full text-sm"
                                                value={payment.payment_date}
                                                onChange={(e) => {
                                                    const newP = [
                                                        ...data.payments,
                                                    ];
                                                    newP[index].payment_date =
                                                        e.target.value;
                                                    setData("payments", newP);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "طريقة الدفع"
                                                        : "Method"
                                                }
                                            />
                                            <select
                                                className="mt-1 w-full rounded border-border text-sm p-2"
                                                value={payment.method}
                                                onChange={(e) => {
                                                    const newP = [
                                                        ...data.payments,
                                                    ];
                                                    newP[index].method =
                                                        e.target.value;
                                                    setData("payments", newP);
                                                }}
                                            >
                                                <option value="cash">
                                                    {lang === "ar"
                                                        ? "نقدي"
                                                        : "Cash"}
                                                </option>
                                                <option value="bank_transfer">
                                                    {lang === "ar"
                                                        ? "تحويل بنكي"
                                                        : "Bank Transfer"}
                                                </option>
                                                <option value="cheque">
                                                    {lang === "ar"
                                                        ? "شيك"
                                                        : "Cheque"}
                                                </option>
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "رقم المرجع / ملاحظات"
                                                        : "Reference / Notes"
                                                }
                                            />
                                            <TextInput
                                                type="text"
                                                className="mt-1 w-full text-sm"
                                                value={payment.notes}
                                                placeholder={
                                                    lang === "ar"
                                                        ? "اختياري..."
                                                        : "Optional..."
                                                }
                                                onChange={(e) => {
                                                    const newP = [
                                                        ...data.payments,
                                                    ];
                                                    newP[index].notes =
                                                        e.target.value;
                                                    setData("payments", newP);
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setData("payments", [
                                            ...data.payments,
                                            {
                                                amount: 0,
                                                payment_date: today,
                                                method: "cash",
                                                reference: "",
                                                notes: "",
                                            },
                                        ])
                                    }
                                    className="text-sm text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-md py-2 px-4 w-full flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />{" "}
                                    {lang === "ar"
                                        ? "إضافة دفعة مالية"
                                        : "Add Payment"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-6 border-t border-border pt-4">
                    <div>
                        <SecondaryButton
                            type="button"
                            onClick={() =>
                                router.get(route("customers.show", customer.id))
                            }
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentStep > 1 && (
                            <SecondaryButton
                                type="button"
                                onClick={() =>
                                    setCurrentStep((prev) => prev - 1)
                                }
                            >
                                <ChevronRight
                                    className={`h-4 w-4 ${lang === "ar" ? "" : "rotate-180"}`}
                                />
                                {lang === "ar" ? "السابق" : "Previous"}
                            </SecondaryButton>
                        )}

                        {currentStep < 5 ? (
                            <PrimaryButton
                                type="button"
                                onClick={() =>
                                    setCurrentStep((prev) => prev + 1)
                                }
                            >
                                {lang === "ar" ? "التالي" : "Next"}
                                <ChevronLeft
                                    className={`h-4 w-4 ${lang === "ar" ? "" : "rotate-180"}`}
                                />
                            </PrimaryButton>
                        ) : (
                            <>
                                <SecondaryButton
                                    type="button"
                                    disabled={processing}
                                    onClick={() => submit("draft")}
                                >
                                    <FileEdit className="h-4 w-4 me-1.5" />
                                    {lang === "ar"
                                        ? "حفظ كمسودة"
                                        : "Save as Draft"}
                                </SecondaryButton>
                                <PrimaryButton
                                    type="button"
                                    disabled={processing}
                                    onClick={() => submit("active")}
                                >
                                    <Save className="h-4 w-4 me-1.5" />
                                    {lang === "ar"
                                        ? "حفظ واعتماد"
                                        : "Save & Activate"}
                                </PrimaryButton>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}
            {/* Contact Modal */}
            <Modal
                show={showContactModal}
                onClose={() => setShowContactModal(false)}
                maxWidth="md"
            >
                <form onSubmit={saveContact} className="p-5 space-y-4">
                    <h3 className="font-bold text-lg mb-2">
                        {lang === "ar"
                            ? "إضافة مندوب/جهة اتصال"
                            : "Add Contact / Agent"}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <InputLabel
                                value={lang === "ar" ? "الاسم *" : "Name *"}
                            />
                            <TextInput
                                className="mt-1 w-full"
                                value={contactForm.name}
                                onChange={(e) =>
                                    setContactForm({
                                        ...contactForm,
                                        name: e.target.value,
                                    })
                                }
                                required
                            />
                            <InputError message={contactErrors.name} />
                        </div>
                        <div>
                            <InputLabel
                                value={lang === "ar" ? "الهاتف *" : "Phone *"}
                            />
                            <TextInput
                                className="mt-1 w-full font-mono text-left"
                                dir="ltr"
                                value={contactForm.phone_number}
                                onChange={(e) =>
                                    setContactForm({
                                        ...contactForm,
                                        phone_number: e.target.value,
                                    })
                                }
                                required
                            />
                            <InputError message={contactErrors.phone_number} />
                        </div>
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "رقم الهوية/الإقامة"
                                        : "ID / Residence Number"
                                }
                            />
                            <TextInput
                                className="mt-1 w-full font-mono text-left"
                                dir="ltr"
                                value={contactForm.id_number || ""}
                                onChange={(e) =>
                                    setContactForm({
                                        ...contactForm,
                                        id_number: e.target.value,
                                    })
                                }
                            />
                            <InputError message={contactErrors.id_number} />
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
                                className="mt-1 w-full text-left"
                                value={contactForm.job_title}
                                onChange={(e) =>
                                    setContactForm({
                                        ...contactForm,
                                        job_title: e.target.value,
                                    })
                                }
                            />
                            <InputError message={contactErrors.job_title} />
                        </div>
                        <div className="flex gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    className="rounded text-primary focus:ring-primary"
                                    checked={contactForm.can_sign}
                                    onChange={(e) =>
                                        setContactForm({
                                            ...contactForm,
                                            can_sign: e.target.checked,
                                        })
                                    }
                                />
                                {lang === "ar" ? "صلاحية التوقيع" : "Can Sign"}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input
                                    type="checkbox"
                                    className="rounded text-primary focus:ring-primary"
                                    checked={contactForm.can_withdraw_goods}
                                    onChange={(e) =>
                                        setContactForm({
                                            ...contactForm,
                                            can_withdraw_goods:
                                                e.target.checked,
                                        })
                                    }
                                />
                                {lang === "ar"
                                    ? "سحب بضاعة"
                                    : "Can Withdraw Goods"}
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowContactModal(false)}
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton>
                            {lang === "ar" ? "إضافة" : "Add"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Term Modal */}
            <Modal
                show={showTermModal}
                onClose={() => setShowTermModal(false)}
                maxWidth="md"
            >
                <form onSubmit={saveTerm} className="p-5 space-y-4">
                    <h3 className="font-bold text-lg mb-2">
                        {lang === "ar" ? "إضافة شرط جديد" : "Add New Term"}
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "الشرط (بالعربية) *"
                                        : "Term (Arabic) *"
                                }
                            />
                            <textarea
                                className="mt-1 w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary"
                                rows="3"
                                value={termForm.text_ar}
                                onChange={(e) =>
                                    setTermForm({
                                        ...termForm,
                                        text_ar: e.target.value,
                                    })
                                }
                                required
                            ></textarea>
                        </div>
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "الشرط (بالإنجليزية)"
                                        : "Term (English)"
                                }
                            />
                            <textarea
                                className="mt-1 w-full rounded-md border-border bg-surface text-text shadow-sm focus:border-primary focus:ring-primary"
                                rows="3"
                                value={termForm.text_en}
                                onChange={(e) =>
                                    setTermForm({
                                        ...termForm,
                                        text_en: e.target.value,
                                    })
                                }
                                dir="ltr"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowTermModal(false)}
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton>
                            {lang === "ar" ? "إضافة" : "Add"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
