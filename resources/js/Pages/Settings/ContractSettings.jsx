import React, { useState, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import axios from "axios";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Home,
    ChevronRight,
    FileText,
    LayoutList,
    Clock,
    Save,
    X,
    GripVertical,
    Check,
    Plus,
    Edit,
    Trash2,
    Info,
    Search,
    Building2,
    Variable,
    Upload,
    Layers,
    Printer,
    Eye,
    CheckCircle2,
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
import TabBar from "@/Components/TabBar";

// Import Quill WYSIWYG Editor
import Quill from "quill";
import "quill/dist/quill.snow.css";

export default function ContractSettings({
    terms: initialTerms,
    settings,
    headerLayouts,
    footerLayouts,
    smartVariables,
    tableColumns,
}) {
    const { lang } = useLang();
    const [templateType, setTemplateType] = useState("managed");
    // Map URL tab param to internal tab ID
    const tabMapToInternal = {
        "company-info": "company",
        library: "library",
        layout: "parts",
        periods: "periods",
        preview: "preview",
    };
    const tabMapToUrl = {
        company: "company-info",
        library: "library",
        parts: "layout",
        periods: "periods",
        preview: "preview",
    };

    const getInitialTab = () => {
        if (typeof window === "undefined") return "company";
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab");
        return tabMapToInternal[tabParam] || "company";
    };

    const [activeTab, setActiveTab] = useState(getInitialTab);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        const urlTabName = tabMapToUrl[tabId];
        window.history.replaceState(
            null,
            "",
            window.location.pathname + "?tab=" + urlTabName,
        );
    };
    const [terms, setTerms] = useState(initialTerms || []);
    const [showTermModal, setShowTermModal] = useState(false);
    const [editingTerm, setEditingTerm] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);

    const quillRef = useRef(null);
    const quillInstance = useRef(null);

    // ── 1. Global Settings Form ──
    const settingsForm = useForm({
        // Company details
        company_name: settings.company_name || "",
        company_slogan: settings.company_slogan || "",
        company_cr: settings.company_cr || "",
        company_vat: settings.company_vat || "",
        company_license: settings.company_license || "",
        company_phone: settings.company_phone || "",
        company_email: settings.company_email || "",
        company_address: settings.company_address || "",
        company_gm: settings.company_gm || "",
        company_dgm: settings.company_dgm || "",
        company_logo: null,

        // Quality assurance details
        show_quality_data:
            settings.show_quality_data === "1" ||
            settings.show_quality_data === true,
        quality_issue_no: settings.quality_issue_no || "",
        quality_issue_date: settings.quality_issue_date || "",

        // Default periods and rules
        default_mandatory_period: settings.default_mandatory_period || 12,
        default_renewal_period: settings.default_renewal_period || 12,
        managed_default_introduction:
            settings.managed_default_introduction ||
            settings.default_introduction ||
            "",
        managed_default_preamble:
            settings.managed_default_preamble ||
            settings.default_preamble ||
            "",
        managed_footer: settings.managed_footer || settings.footer || "",
        managed_contract_title:
            settings.managed_contract_title || settings.contract_title || "",
        managed_unified_contract_template:
            settings.managed_unified_contract_template ||
            settings.unified_contract_template ||
            "",
        free_default_introduction:
            settings.free_default_introduction ||
            settings.default_introduction ||
            "",
        free_default_preamble:
            settings.free_default_preamble || settings.default_preamble || "",
        free_footer: settings.free_footer || settings.footer || "",
        free_contract_title:
            settings.free_contract_title || settings.contract_title || "",
        free_unified_contract_template:
            settings.free_unified_contract_template ||
            settings.unified_contract_template ||
            "",
        calendar_type: settings.calendar_type || "gregorian",
        is_renewable:
            settings.is_renewable === "1" || settings.is_renewable === true,

        // First party display config
        show_first_party_cr:
            settings.show_first_party_cr === "1" ||
            settings.show_first_party_cr === true,
        show_first_party_vat:
            settings.show_first_party_vat === "1" ||
            settings.show_first_party_vat === true,
        show_first_party_license:
            settings.show_first_party_license === "1" ||
            settings.show_first_party_license === true,
        show_first_party_address:
            settings.show_first_party_address === "1" ||
            settings.show_first_party_address === true,
        show_first_party_phone:
            settings.show_first_party_phone === "1" ||
            settings.show_first_party_phone === true,
        show_first_party_email:
            settings.show_first_party_email === "1" ||
            settings.show_first_party_email === true,
        show_first_party_gm:
            settings.show_first_party_gm === "1" ||
            settings.show_first_party_gm === true,
        show_first_party_dgm:
            settings.show_first_party_dgm === "1" ||
            settings.show_first_party_dgm === true,

        // Second party display config
        show_second_party_cr:
            settings.show_second_party_cr === "1" ||
            settings.show_second_party_cr === true,
        show_second_party_vat:
            settings.show_second_party_vat === "1" ||
            settings.show_second_party_vat === true,
        show_second_party_license:
            settings.show_second_party_license === "1" ||
            settings.show_second_party_license === true,
        show_second_party_address:
            settings.show_second_party_address === "1" ||
            settings.show_second_party_address === true,
        show_second_party_phone:
            settings.show_second_party_phone === "1" ||
            settings.show_second_party_phone === true,
        show_second_party_email:
            settings.show_second_party_email === "1" ||
            settings.show_second_party_email === true,
        show_second_party_gm:
            settings.show_second_party_gm === "1" ||
            settings.show_second_party_gm === true,
        show_second_party_id:
            settings.show_second_party_id === "1" ||
            settings.show_second_party_id === true,
        include_second_party_proxy:
            settings.include_second_party_proxy === "1" ||
            settings.include_second_party_proxy === true,

        // Editor layout config
        contract_title: settings.contract_title || "",
        contract_editor_mode: "unified",
        header_design_id: settings.header_design_id || "1",
        footer_design_id: settings.footer_design_id || "1",
        unified_contract_template: settings.unified_contract_template || "",
        show_contract_serial:
            settings.show_contract_serial === "1" ||
            settings.show_contract_serial === true,
        show_customer_serial:
            settings.show_customer_serial === "1" ||
            settings.show_customer_serial === true,
        show_certificate_number:
            settings.show_certificate_number === "1" ||
            settings.show_certificate_number === true,

        // Table column toggles
        table_show_item:
            settings.table_show_item === "1" ||
            settings.table_show_item === true,
        table_show_qty:
            settings.table_show_qty === "1" || settings.table_show_qty === true,
        table_show_rent:
            settings.table_show_rent === "1" ||
            settings.table_show_rent === true,
        table_show_discount:
            settings.table_show_discount === "1" ||
            settings.table_show_discount === true,
        table_show_total:
            settings.table_show_total === "1" ||
            settings.table_show_total === true,
    });

    const typedFieldKey = (field) => `${templateType}_${field}`;
    const typedFieldValue = (field) =>
        settingsForm.data[typedFieldKey(field)] || "";
    const setTypedFieldValue = (field, value) =>
        settingsForm.setData(typedFieldKey(field), value);

    const saveSettings = (e) => {
        if (e) e.preventDefault();
        settingsForm.post(route("settings.terms.settings.update"), {
            preserveScroll: true,
        });
    };

    // ── 2. Quill Editor Lifecycle ──
    useEffect(() => {
        if (activeTab === "parts" && quillRef.current) {
            // Clean up any existing Quill toolbar to prevent duplicates
            const toolbar = quillRef.current.previousSibling;
            if (toolbar && toolbar.classList.contains("ql-toolbar")) {
                toolbar.remove();
            }

            quillInstance.current = new Quill(quillRef.current, {
                theme: "snow",
                modules: {
                    toolbar: [
                        ["bold", "italic", "underline"],
                        [{ align: [] }],
                        [{ header: [1, 2, 3, false] }],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["clean"],
                    ],
                },
            });

            // Set initial content from settingsForm
            quillInstance.current.root.innerHTML = typedFieldValue(
                "unified_contract_template",
            );

            // Listen for text changes to sync with Inertia form
            quillInstance.current.on("text-change", () => {
                const html = quillInstance.current.root.innerHTML;
                setTypedFieldValue("unified_contract_template", html);
            });
        } else {
            quillInstance.current = null;
        }

        return () => {
            if (quillRef.current) {
                const toolbar = quillRef.current.previousSibling;
                if (toolbar && toolbar.classList.contains("ql-toolbar")) {
                    toolbar.remove();
                }
            }
            quillInstance.current = null;
        };
    }, [activeTab, templateType]);

    // Insert smart variables into Quill at selection range
    const insertVariableIntoQuill = (variableCode) => {
        if (!quillInstance.current) return;
        const range = quillInstance.current.getSelection(true);
        if (range) {
            quillInstance.current.insertText(range.index, variableCode);
            quillInstance.current.setSelection(
                range.index + variableCode.length,
            );
        } else {
            const length = quillInstance.current.getLength();
            quillInstance.current.insertText(length - 1, variableCode);
        }
    };

    // ── 3. Terms Library Logic ──
    const [termForm, setTermForm] = useState({
        text_ar: "",
        text_en: "",
        is_active: true,
    });
    const [termErrors, setTermErrors] = useState({});

    const openCreate = () => {
        setEditingTerm(null);
        setTermForm({ text_ar: "", text_en: "", is_active: true });
        setTermErrors({});
        setShowTermModal(true);
    };

    const openEdit = (term) => {
        setEditingTerm(term);
        setTermForm({
            text_ar: term.text_ar,
            text_en: term.text_en || "",
            is_active: !!term.is_active,
        });
        setTermErrors({});
        setShowTermModal(true);
    };

    const saveTerm = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = editingTerm
                ? await axios.put(
                      route("settings.terms.update", editingTerm.id),
                      termForm,
                  )
                : await axios.post(route("settings.terms.store"), termForm);

            router.reload({ only: ["terms"] }); // Refresh the list
            setShowTermModal(false);
        } catch (err) {
            if (err.response?.data?.errors)
                setTermErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    const removeTerm = () => {
        router.delete(route("settings.terms.destroy", deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    // Reordering drag and drop logic
    const dragIndex = useRef(null);
    const [dragOver, setDragOver] = useState(null);

    const onDragEnd = async () => {
        if (dragIndex.current === null || dragOver === null) return;
        const reordered = [...terms];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(dragOver, 0, moved);
        setTerms(reordered);
        dragIndex.current = null;
        setDragOver(null);
        try {
            await axios.post(
                route("seasons.terms.reorder", { season: "global" }),
                { ordered_ids: reordered.map((t) => t.id) },
            );
        } catch (e) {
            // Bypass if endpoint not defined
        }
    };

    // ── 5. List of Options - Headers and Footers ──
    const headerOptions = (headerLayouts || []).map((h) => ({
        id: h.id,
        name: lang === "ar" ? h.name_ar : h.name_en,
    }));

    const footerOptions = (footerLayouts || []).map((f) => ({
        id: f.id,
        name: lang === "ar" ? f.name_ar : f.name_en,
    }));

    const renderHeaderPreview = (id) => {
        switch (id) {
            case "1":
                return (
                    <div
                        className="flex justify-between items-start border-b border-black pb-2 text-[8px] text-zinc-700 font-sans"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div className="space-y-0.5 text-start">
                            <h2 className="text-[10px] font-extrabold text-black">
                                {settingsForm.data.company_name ||
                                    "اسم المنشأة"}
                            </h2>
                            <p className="text-[8px] font-bold">
                                {settingsForm.data.company_slogan ||
                                    "النشاط والشعار"}
                            </p>
                            <p>
                                س.ت:{" "}
                                {settingsForm.data.company_cr || "1010101010"}
                            </p>
                            <p>
                                الرقم الضريبي:{" "}
                                {settingsForm.data.company_vat ||
                                    "300000000000003"}
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center pt-1">
                            <div className="border border-black px-2 py-0.5 font-extrabold text-[9px] uppercase bg-zinc-50 text-black">
                                {lang === "ar"
                                    ? "عقد تخزين وتأجير طبالي"
                                    : "Storage Rental Contract"}
                            </div>
                            <div className="mt-0.5 text-[8px] font-mono font-bold text-black">
                                الرقم: WMS-2026-00045
                            </div>
                        </div>
                        <div className="h-8 w-8 border border-zinc-300 bg-zinc-50 flex items-center justify-center text-[7px] font-bold">
                            شعار
                        </div>
                    </div>
                );
            case "2":
                return (
                    <div
                        className="flex flex-col items-center border-b border-black pb-2 text-center text-[8px] text-zinc-700 font-sans"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div className="h-8 w-8 border border-zinc-300 bg-zinc-50 flex items-center justify-center text-[7px] font-bold mb-0.5">
                            شعار
                        </div>
                        <h2 className="text-[10px] font-extrabold text-black">
                            {settingsForm.data.company_name}
                        </h2>
                        <p className="text-[8px] text-zinc-500">
                            {settingsForm.data.company_slogan}
                        </p>
                        <div className="flex gap-2 text-[8px] font-mono text-zinc-700 mt-1">
                            <span>س.ت: {settingsForm.data.company_cr}</span>
                            <span>•</span>
                            <span>
                                الرقم الضريبي: {settingsForm.data.company_vat}
                            </span>
                        </div>
                    </div>
                );
            case "3":
                return (
                    <div
                        className="border-b border-black pb-1.5 text-[8px] font-sans"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div className="flex justify-between items-center">
                            <h2 className="text-[10px] font-extrabold text-black">
                                {settingsForm.data.company_name}
                            </h2>
                            <div className="h-6 w-6 border border-zinc-300 bg-zinc-50 flex items-center justify-center text-[6px]">
                                شعار
                            </div>
                        </div>
                        <div className="flex gap-2 text-[7px] text-zinc-500 font-mono mt-0.5">
                            <span>س.ت: {settingsForm.data.company_cr}</span>|
                            <span>
                                الرقم الضريبي: {settingsForm.data.company_vat}
                            </span>
                            |
                            <span>
                                العنوان: {settingsForm.data.company_address}
                            </span>
                        </div>
                    </div>
                );
            case "4":
                return (
                    <div
                        className="border border-zinc-200 overflow-hidden text-[8px] font-sans"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div className="bg-zinc-800 text-white px-2 py-0.5 flex justify-between items-center">
                            <h2 className="text-[9px] font-extrabold">
                                {settingsForm.data.company_name}
                            </h2>
                            <span className="text-[7px]">
                                {settingsForm.data.company_slogan}
                            </span>
                        </div>
                        <div className="p-2 flex justify-between items-center bg-white text-[8px] font-mono text-black">
                            <p>
                                س.ت: {settingsForm.data.company_cr} | ضريبة:{" "}
                                {settingsForm.data.company_vat}
                            </p>
                            <div className="h-6 w-6 border border-zinc-300 bg-zinc-50 flex items-center justify-center text-[6px]">
                                شعار
                            </div>
                        </div>
                    </div>
                );
            case "5":
                return (
                    <div
                        className="grid grid-cols-3 gap-2 border-b border-black pb-1.5 items-stretch text-[8px] font-mono text-zinc-700"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div className="border border-zinc-300 p-1 bg-zinc-50/50 text-[7px]">
                            <p className="font-bold border-b border-zinc-200 pb-0.5 mb-0.5 text-zinc-600">
                                {lang === "ar" ? "نظام الجودة" : "Quality"}
                            </p>
                            <p>
                                REV:{" "}
                                {settingsForm.data.quality_issue_no || "01"}
                            </p>
                        </div>
                        <div className="flex flex-col items-center justify-center text-center">
                            <span className="font-extrabold text-[9px] border border-black px-2 py-0.5 bg-zinc-50 text-black">
                                {lang === "ar"
                                    ? "عقد تخزين"
                                    : "Storage Contract"}
                            </span>
                        </div>
                        <div className="flex flex-col justify-between items-end text-end text-[7px]">
                            <p className="font-bold text-black">
                                {settingsForm.data.company_name}
                            </p>
                            <p>س.ت: {settingsForm.data.company_cr}</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const renderFooterPreview = (id) => {
        switch (id) {
            case "1":
                return (
                    <div
                        className="flex flex-col items-center text-center text-[8px] text-zinc-500 font-sans"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <p className="font-semibold text-zinc-700">
                            {settingsForm.data.company_name}
                        </p>
                        <p>
                            {settingsForm.data.company_address} | هاتف:{" "}
                            {settingsForm.data.company_phone} | البريد:{" "}
                            {settingsForm.data.company_email}
                        </p>
                    </div>
                );
            case "2":
                return (
                    <div
                        className="grid grid-cols-3 gap-2 text-start text-[7px] text-zinc-500 font-sans"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div>
                            <p className="font-bold text-zinc-700">
                                {lang === "ar" ? "الاتصال" : "Contacts"}
                            </p>
                            <p>هاتف: {settingsForm.data.company_phone}</p>
                            <p>البريد: {settingsForm.data.company_email}</p>
                        </div>
                        <div>
                            <p className="font-bold text-zinc-700">
                                {lang === "ar" ? "الموقع" : "Location"}
                            </p>
                            <p>{settingsForm.data.company_address}</p>
                        </div>
                        <div className="text-end flex flex-col justify-end">
                            <p className="font-bold text-zinc-700">
                                WMS System
                            </p>
                        </div>
                    </div>
                );
            case "3":
                return (
                    <div
                        className="flex justify-between items-center text-[7px] font-mono border-t border-zinc-200 pt-1 text-zinc-500"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <span>
                            {settingsForm.data.company_name} -{" "}
                            {settingsForm.data.company_slogan}
                        </span>
                        <span>
                            البريد: {settingsForm.data.company_email} • هاتف:{" "}
                            {settingsForm.data.company_phone}
                        </span>
                    </div>
                );
            case "4":
                return (
                    <div
                        className="space-y-0.5 text-start text-[7px] text-zinc-500"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <p className="px-1">
                            {settingsForm.data.company_address}
                        </p>
                        <div className="bg-zinc-800 text-white p-1 px-2 flex justify-between items-center text-[7px] font-bold">
                            <span>هاتف: {settingsForm.data.company_phone}</span>
                            <span>
                                البريد: {settingsForm.data.company_email}
                            </span>
                            <span>{settingsForm.data.company_name}</span>
                        </div>
                    </div>
                );
            case "5":
                return (
                    <div
                        className="flex justify-between items-end text-start text-[7px] text-zinc-500"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                        <div className="space-y-0.5">
                            <p className="font-bold text-zinc-800">
                                {settingsForm.data.company_name}
                            </p>
                            <p>
                                هاتف: {settingsForm.data.company_phone} |
                                البريد: {settingsForm.data.company_email}
                            </p>
                        </div>
                        <div className="h-6 w-6 border border-dashed border-zinc-300 bg-white flex items-center justify-center text-[5px] text-zinc-400 uppercase font-mono">
                            Stamp
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    // ── 6. Live Preview Simulation variables loader ──
    const previewReplaceVariables = (text) => {
        if (!text) return "";
        let result = text;
        const vars = {
            "{$company_name}":
                settingsForm.data.company_name ||
                (lang === "ar"
                    ? "الشركة السعودية للتخزين"
                    : "Saudi Storage Co."),
            "{$company_slogan}":
                settingsForm.data.company_slogan ||
                (lang === "ar"
                    ? "خدمات تبريد وتجميد متكاملة"
                    : "Cold Storage Logistics"),
            "{$company_cr}": settingsForm.data.company_cr || "1010101010",
            "{$company_vat}":
                settingsForm.data.company_vat || "300000000000003",
            "{$company_license}":
                settingsForm.data.company_license || "L-4106348",
            "{$company_phone}": settingsForm.data.company_phone || "0500000000",
            "{$company_email}":
                settingsForm.data.company_email || "info@wms-storage.com",
            "{$company_address}":
                settingsForm.data.company_address ||
                (lang === "ar"
                    ? "الرياض، المملكة العربية السعودية"
                    : "Riyadh, KSA"),
            "{$company_gm}":
                settingsForm.data.company_gm ||
                (lang === "ar" ? "أحمد بن علي" : "Ahmed Bin Ali"),
            "{$company_dgm}":
                settingsForm.data.company_dgm ||
                (lang === "ar" ? "خالد بن محمد" : "Khalid Bin Mohamed"),
            "{$customer_name}":
                lang === "ar" ? "شركة النخبة للأغذية" : "Elite Food Company",
            "{$customer_phone}": "0555555555",
            "{$customer_cr}": "2020202020",
            "{$customer_id}": "1020304050",
            "{$contract_number}": "WMS-2026-00045",
            "{$start_date}": "2026-06-01",
            "{$end_date}": "2027-06-01",
            "{$mandatory_period}":
                settingsForm.data.default_mandatory_period || "12",
            "{$renew_period}": settingsForm.data.default_renewal_period || "12",
            "{$write_date}": "2026-05-28",
            "{$write_date_hijri}": "12-12-1447 هـ",
            "{$start_date_hijri}": "16-12-1447 هـ",
            "{$terms_count}": terms.filter((t) => t.is_active).length,
        };
        Object.entries(vars).forEach(([key, val]) => {
            result = result.replaceAll(key, val);
        });
        return result;
    };

    const renderTemplateWithItems = (template) => {
        const evaluated = previewReplaceVariables(template);

        const showItem = settingsForm.data.table_show_item;
        const showQty = settingsForm.data.table_show_qty;
        const showRent = settingsForm.data.table_show_rent;
        const showDiscount = settingsForm.data.table_show_discount;
        const showTotal = settingsForm.data.table_show_total;

        // Get column titles from central config or fallback
        const getColTitle = (code, fallbackAr, fallbackEn) => {
            const col = (tableColumns || []).find((c) => c.code === code);
            if (col) return lang === "ar" ? col.label_ar : col.label_en;
            return lang === "ar" ? fallbackAr : fallbackEn;
        };

        const tableHtml = (
            <div className="my-4 space-y-1 text-start">
                <p className="font-bold text-[10px] text-black tracking-wider uppercase mb-1">
                    {lang === "ar"
                        ? "جدول المواد والوحدات التخزينية:"
                        : "Storage Items Table:"}
                </p>
                <table className="w-full text-[9px] text-start border-collapse border border-black">
                    <thead className="bg-zinc-100 text-black uppercase font-bold">
                        <tr>
                            {showItem && (
                                <th className="border border-black p-1.5 text-start">
                                    {getColTitle(
                                        "item_name",
                                        "الصنف والمستودع",
                                        "Item & Warehouse",
                                    )}
                                </th>
                            )}
                            {showQty && (
                                <th className="border border-black p-1.5 text-center w-12">
                                    {getColTitle("qty", "الكمية", "Qty")}
                                </th>
                            )}
                            {showRent && (
                                <th className="border border-black p-1.5 text-center w-20">
                                    {getColTitle(
                                        "rent",
                                        "الإيجار الشهري",
                                        "Monthly Rent",
                                    )}
                                </th>
                            )}
                            {showDiscount && (
                                <th className="border border-black p-1.5 text-center w-16">
                                    {getColTitle(
                                        "discount",
                                        "الخصم",
                                        "Discount",
                                    )}
                                </th>
                            )}
                            {showTotal && (
                                <th className="border border-black p-1.5 text-end w-24">
                                    {getColTitle(
                                        "total",
                                        "الإجمالي شامل الضريبة",
                                        "Total with VAT",
                                    )}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {showItem && (
                                <td className="border border-black p-1.5 font-bold">
                                    {lang === "ar"
                                        ? "طبلية مجمدة (درجة -18 م)"
                                        : "Frozen Pallet (-18C)"}
                                </td>
                            )}
                            {showQty && (
                                <td className="border border-black p-1.5 text-center font-mono">
                                    100
                                </td>
                            )}
                            {showRent && (
                                <td className="border border-black p-1.5 text-center font-mono">
                                    50.00
                                </td>
                            )}
                            {showDiscount && (
                                <td className="border border-black p-1.5 text-center font-mono">
                                    0.00
                                </td>
                            )}
                            {showTotal && (
                                <td className="border border-black p-1.5 text-end font-mono font-bold">
                                    5,000.00
                                </td>
                            )}
                        </tr>
                    </tbody>
                </table>
            </div>
        );

        if (evaluated.includes("[ITEMS_TABLE]")) {
            const parts = evaluated.split("[ITEMS_TABLE]");
            return (
                <div className="whitespace-pre-line text-zinc-900 leading-relaxed text-[11px]">
                    <div dangerouslySetInnerHTML={{ __html: parts[0] }} />
                    {tableHtml}
                    <div dangerouslySetInnerHTML={{ __html: parts[1] }} />
                </div>
            );
        }

        return (
            <div className="space-y-3 text-[11px]">
                <div
                    className="whitespace-pre-line text-zinc-900 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: evaluated }}
                />
                {tableHtml}
            </div>
        );
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight
                className={lang === "ar" ? "rotate-180 h-4 w-4" : "h-4 w-4"}
            />
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.get(route("settings.index"))}
            >
                {lang === "ar" ? "الإعدادات" : "Settings"}
            </span>
            <ChevronRight
                className={lang === "ar" ? "rotate-180 h-4 w-4" : "h-4 w-4"}
            />
            <span className="text-primary font-medium">
                {lang === "ar" ? "إعدادات العقود" : "Contract Settings"}
            </span>
        </div>
    );

    const tabs = [
        {
            id: "company",
            label:
                lang === "ar"
                    ? "بيانات الشركة والطرف الأول"
                    : "Company & First Party",
            icon: Building2,
        },
        {
            id: "library",
            label: lang === "ar" ? "مكتبة الشروط" : "Terms Library",
            icon: LayoutList,
        },
        {
            id: "parts",
            label: lang === "ar" ? "تخطيط ومظهر العقد" : "Contract Layout",
            icon: Layers,
        },
        {
            id: "periods",
            label: lang === "ar" ? "المدد والتقويم" : "Periods & Calendar",
            icon: Clock,
        },
        {
            id: "preview",
            label: lang === "ar" ? "معاينة العقد A4" : "A4 Preview",
            icon: Printer,
        },
    ];

    const smartVariablesList = (smartVariables || []).map((v) => ({
        code: v.code,
        label: lang === "ar" ? v.label_ar : v.label_en,
    }));
    if (!smartVariablesList.some((v) => v.code === "[ITEMS_TABLE]")) {
        smartVariablesList.push({
            code: "[ITEMS_TABLE]",
            label:
                lang === "ar" ? "جدول الأصناف والتسعير" : "Items & Price Table",
        });
    }

    const getBlockLabel = (key) => {
        const labels = {
            header: lang === "ar" ? "الترويسة (Header)" : "Header",
            serial:
                lang === "ar"
                    ? "معلومات الأرقام التسلسلية"
                    : "Serial Information",
            parties:
                lang === "ar"
                    ? "أطراف العقد (الطرف الأول والثاني)"
                    : "Contract Parties",
            introduction: lang === "ar" ? "مقدمة العقد" : "Introduction",
            preamble: lang === "ar" ? "تمهيد العقد" : "Preamble",
            items_table:
                lang === "ar"
                    ? "جدول الأصناف والأسعار"
                    : "Items & Prices Table",
            terms: lang === "ar" ? "شروط العقد" : "Contract Terms",
            summary: lang === "ar" ? "ملخص وبنود العقد" : "Contract Summary",
            signature:
                lang === "ar" ? "قسم التواقيع والأختام" : "Signatures Section",
            footer:
                lang === "ar"
                    ? "التذييل والاتصال (Footer)"
                    : "Footer & Contact Info",
        };
        return labels[key] || key;
    };

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={
                    lang === "ar"
                        ? "إعدادات العقود القياسية"
                        : "Standard Contract Settings"
                }
            />

            <div className="mx-auto max-w-5xl space-y-4 print:max-w-none print:w-full print:p-0 print:space-y-0">
                <PageHeader
                    icon={Layers}
                    title={
                        lang === "ar"
                            ? "إعدادات العقود وتصميم القوالب"
                            : "Contract Settings & Templates"
                    }
                    description={
                        <p className="text-xs text-text-muted mt-0.5">
                            {lang === "ar"
                                ? "تخصيص الهوية القانونية للطرف الأول، وإدارة مكتبة الشروط، وتخطيط مظهر عقود المستأجرين مع معاينة حية A4."
                                : "Configure company legal details, global terms library, and layout styling with live A4 preview."}
                        </p>
                    }
                />

                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[600px] print:border-0 print:shadow-none print:bg-transparent print:min-h-0 print:overflow-visible">
                    {/* شريط التبويبات مع الاشارة للتبويب النشط */}
                    <div className="print:hidden">
                        <TabBar
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={handleTabChange}
                        />
                    </div>

                    <div className="p-6 flex-1 print:p-0 print:overflow-visible space-y-4">
                        {/* Tab 1: Company Data & First Party Settings */}
                        {activeTab === "company" && (
                            <form
                                onSubmit={saveSettings}
                                className="space-y-6 max-w-4xl print:hidden"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "اسم المنشأة"
                                                    : "Company Name"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data.company_name
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_name",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "النشاط / الشعار الوصفي"
                                                    : "Slogan / Activity"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data.company_slogan
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_slogan",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "سجل تجاري"
                                                    : "Commercial Registration"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={settingsForm.data.company_cr}
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_cr",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الرقم الضريبي"
                                                    : "VAT Number"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data.company_vat
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_vat",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "رقم ترخيص التخزين"
                                                    : "License Number"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data
                                                    .company_license
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_license",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "رقم الهاتف / الجوال"
                                                    : "Phone Number"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data.company_phone
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_phone",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "البريد الإلكتروني"
                                                    : "Email Address"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data.company_email
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_email",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "العنوان الوطني"
                                                    : "National Address"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data
                                                    .company_address
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_address",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "المدير العام (الممثل النظامي)"
                                                    : "General Manager"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={settingsForm.data.company_gm}
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_gm",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "نائب المدير العام"
                                                    : "Deputy GM"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={
                                                settingsForm.data.company_dgm
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "company_dgm",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "شعار الشركة (Logo)"
                                                    : "Company Logo"
                                            }
                                        />
                                        <div className="mt-1 flex items-center gap-4">
                                            {settings.company_logo &&
                                                !settingsForm.data
                                                    .company_logo && (
                                                    <img
                                                        src={
                                                            settings.company_logo
                                                        }
                                                        alt="Logo"
                                                        className="h-12 w-12 object-contain bg-white border border-border rounded-none"
                                                    />
                                                )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        "company_logo",
                                                        e.target.files[0],
                                                    )
                                                }
                                                className="block w-full text-sm text-text-muted file:me-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 border-t border-border pt-6 mt-2 space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-surface-muted/50 border border-border rounded-none">
                                            <div>
                                                <p className="text-sm font-bold text-text">
                                                    {lang === "ar"
                                                        ? "تفعيل بيانات نظام الجودة (REV)"
                                                        : "Enable Quality System Data (REV)"}
                                                </p>
                                                <p className="text-xs text-text-muted mt-0.5">
                                                    {lang === "ar"
                                                        ? "عرض رقم وتاريخ الإصدار في ترويسة العقود المطبوعة"
                                                        : "Show issue number and date in printed contract header"}
                                                </p>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={
                                                    settingsForm.data
                                                        .show_quality_data
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        "show_quality_data",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="rounded-none border-border text-primary focus:ring-primary h-5 w-5"
                                            />
                                        </div>

                                        {settingsForm.data
                                            .show_quality_data && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-primary/5 border border-primary/10 rounded-none animate-fadeIn">
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "رقم الإصدار (Issue no)"
                                                                : "Issue Number"
                                                        }
                                                    />
                                                    <TextInput
                                                        className="mt-1 block w-full rounded-none"
                                                        value={
                                                            settingsForm.data
                                                                .quality_issue_no
                                                        }
                                                        onChange={(e) =>
                                                            settingsForm.setData(
                                                                "quality_issue_no",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <InputLabel
                                                        value={
                                                            lang === "ar"
                                                                ? "تاريخ الإصدار (Issue Date)"
                                                                : "Issue Date"
                                                        }
                                                    />
                                                    <TextInput
                                                        className="mt-1 block w-full rounded-none"
                                                        value={
                                                            settingsForm.data
                                                                .quality_issue_date
                                                        }
                                                        onChange={(e) =>
                                                            settingsForm.setData(
                                                                "quality_issue_date",
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <PrimaryButton
                                        disabled={settingsForm.processing}
                                        className="rounded-none"
                                    >
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === "ar"
                                            ? "حفظ بيانات الشركة"
                                            : "Save Company Data"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                        {/* Tab 2: Terms Library */}
                        {activeTab === "library" && (
                            <div className="space-y-4 print:hidden">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-text">
                                        {lang === "ar"
                                            ? "مكتبة الشروط العامة"
                                            : "Global Terms Library"}
                                    </span>
                                    <PrimaryButton
                                        type="button"
                                        onClick={openCreate}
                                        className="rounded-none"
                                    >
                                        <Plus className="h-4 w-4 me-2" />
                                        {lang === "ar"
                                            ? "إضافة شرط جديد"
                                            : "New Term"}
                                    </PrimaryButton>
                                </div>

                                <div className="border border-border rounded-none overflow-hidden divide-y divide-border bg-surface">
                                    {terms.map((term) => (
                                        <div
                                            key={term.id}
                                            className="flex items-center justify-between p-4 transition-colors rounded-none hover:bg-surface-muted/30"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-none border ${
                                                                term.is_active
                                                                    ? "bg-success/5 text-success border-success/20"
                                                                    : "bg-text-muted/5 text-text-muted border-text-muted/20"
                                                            }`}
                                                        >
                                                            {term.is_active
                                                                ? lang === "ar"
                                                                    ? "نشط"
                                                                    : "Active"
                                                                : lang === "ar"
                                                                  ? "غير نشط"
                                                                  : "Inactive"}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted font-mono">
                                                            #{term.id}
                                                        </span>
                                                    </div>
                                                    <p className="text-[13px] text-text font-medium leading-relaxed">
                                                        {term.text_ar}
                                                    </p>
                                                    {term.text_en && (
                                                        <p
                                                            className="text-[11px] text-text-muted font-mono"
                                                            dir="ltr"
                                                        >
                                                            {term.text_en}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0 ms-4">
                                                <button
                                                    onClick={() =>
                                                        openEdit(term)
                                                    }
                                                    className="p-2 rounded-none text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteTarget(term)
                                                    }
                                                    className="p-2 rounded-none text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {terms.length === 0 && (
                                        <div className="p-8 text-center text-text-muted text-sm">
                                            {lang === "ar"
                                                ? "لا توجد شروط في مكتبة الشروط حالياً."
                                                : "No terms defined in library yet."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Contract Layout Settings */}
                        {activeTab === "parts" && (
                            <form
                                onSubmit={saveSettings}
                                className="space-y-6 max-w-4xl print:hidden"
                            >
                                <div className="space-y-6 pt-4 border-t border-border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border bg-surface-muted/20 rounded-none">
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "النسخة النشطة للقالب"
                                                        : "Active Template Variant"
                                                }
                                            />
                                            <select
                                                className="mt-1 block w-full border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm rounded-none h-[42px]"
                                                value={templateType}
                                                onChange={(e) =>
                                                    setTemplateType(
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                <option value="managed">
                                                    {lang === "ar"
                                                        ? "نسخة العقد المدار"
                                                        : "Managed Contract Variant"}
                                                </option>
                                                <option value="free">
                                                    {lang === "ar"
                                                        ? "نسخة العقد الحر"
                                                        : "Free Contract Variant"}
                                                </option>
                                            </select>
                                        </div>
                                        <div className="text-xs text-text-muted self-end pb-1">
                                            {templateType === "managed"
                                                ? lang === "ar"
                                                    ? "سيتم تحميل هذه النسخة تلقائيًا عند اختيار عقد مدار."
                                                    : "This variant loads automatically when a managed contract is selected."
                                                : lang === "ar"
                                                  ? "سيتم تحميل هذه النسخة تلقائيًا عند اختيار عقد حر."
                                                  : "This variant loads automatically when a free contract is selected."}
                                        </div>
                                    </div>

                                    {/* Contract Title Customization */}
                                    <div className="space-y-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "عنوان العقد الافتراضي"
                                                    : "Default Contract Title"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full rounded-none"
                                            value={typedFieldValue(
                                                "contract_title",
                                            )}
                                            onChange={(e) =>
                                                setTypedFieldValue(
                                                    "contract_title",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={
                                                lang === "ar"
                                                    ? "مثال: عقد تخزين وتأجير طبالي"
                                                    : "e.g. Storage Rental Contract"
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "المقدمة الافتراضية"
                                                        : "Default Introduction"
                                                }
                                            />
                                            <textarea
                                                className="mt-1 block w-full rounded-none border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[90px]"
                                                value={typedFieldValue(
                                                    "default_introduction",
                                                )}
                                                onChange={(e) =>
                                                    setTypedFieldValue(
                                                        "default_introduction",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "التمهيد الافتراضي"
                                                        : "Default Preamble"
                                                }
                                            />
                                            <textarea
                                                className="mt-1 block w-full rounded-none border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[90px]"
                                                value={typedFieldValue(
                                                    "default_preamble",
                                                )}
                                                onChange={(e) =>
                                                    setTypedFieldValue(
                                                        "default_preamble",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "التذييل الافتراضي"
                                                        : "Default Footer"
                                                }
                                            />
                                            <textarea
                                                className="mt-1 block w-full rounded-none border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[80px]"
                                                value={typedFieldValue(
                                                    "footer",
                                                )}
                                                onChange={(e) =>
                                                    setTypedFieldValue(
                                                        "footer",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Header Options & Visual Preview */}
                                    <div className="space-y-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "اختر ترويسة العقد (Header Layout)"
                                                    : "Select Header Layout"
                                            }
                                        />
                                        <select
                                            className="block w-full border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs rounded-none h-[40px] px-3"
                                            value={
                                                settingsForm.data
                                                    .header_design_id
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "header_design_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {headerOptions.map((opt) => (
                                                <option
                                                    key={opt.id}
                                                    value={opt.id}
                                                >
                                                    {opt.name}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Isolated Header Preview Pane */}
                                        <div className="p-4 border border-zinc-200 bg-white text-black rounded-none shadow-sm min-h-[90px] relative overflow-hidden">
                                            <span className="absolute top-1 left-2 text-[7px] text-zinc-400 font-mono tracking-wider uppercase select-none">
                                                {lang === "ar"
                                                    ? "معاينة الترويسة المحددة"
                                                    : "Selected Header Preview"}
                                            </span>
                                            <div className="pt-2">
                                                {renderHeaderPreview(
                                                    settingsForm.data
                                                        .header_design_id,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Options & Visual Preview */}
                                    <div className="space-y-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "اختر تذييل العقد (Footer Layout)"
                                                    : "Select Footer Layout"
                                            }
                                        />
                                        <select
                                            className="block w-full border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-xs rounded-none h-[40px] px-3"
                                            value={
                                                settingsForm.data
                                                    .footer_design_id
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "footer_design_id",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {footerOptions.map((opt) => (
                                                <option
                                                    key={opt.id}
                                                    value={opt.id}
                                                >
                                                    {opt.name}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Isolated Footer Preview Pane */}
                                        <div className="p-4 border border-zinc-200 bg-white text-black rounded-none shadow-sm min-h-[70px] relative overflow-hidden">
                                            <span className="absolute top-1 left-2 text-[7px] text-zinc-400 font-mono tracking-wider uppercase select-none">
                                                {lang === "ar"
                                                    ? "معاينة التذييل المحدد"
                                                    : "Selected Footer Preview"}
                                            </span>
                                            <div className="pt-2">
                                                {renderFooterPreview(
                                                    settingsForm.data
                                                        .footer_design_id,
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Printing Options */}
                                    <div className="space-y-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "خيارات ظهور الترقيم والأرقام المسلسلة"
                                                    : "Numbering & Serial Printing Toggles"
                                            }
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border bg-surface-muted/20 rounded-none">
                                            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-muted hover:text-text">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        settingsForm.data
                                                            .show_contract_serial
                                                    }
                                                    onChange={(e) =>
                                                        settingsForm.setData(
                                                            "show_contract_serial",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                />
                                                <span>
                                                    {lang === "ar"
                                                        ? "عرض الرقم المسلسل للعقد"
                                                        : "Print Contract Serial No."}
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-muted hover:text-text">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        settingsForm.data
                                                            .show_customer_serial
                                                    }
                                                    onChange={(e) =>
                                                        settingsForm.setData(
                                                            "show_customer_serial",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                />
                                                <span>
                                                    {lang === "ar"
                                                        ? "عرض الرقم المسلسل للعميل"
                                                        : "Print Customer Serial No."}
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-muted hover:text-text">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        settingsForm.data
                                                            .show_certificate_number
                                                    }
                                                    onChange={(e) =>
                                                        settingsForm.setData(
                                                            "show_certificate_number",
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                />
                                                <span>
                                                    {lang === "ar"
                                                        ? "عرض رقم شهادة التخزين"
                                                        : "Print Storage Certificate No."}
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Items Table Columns Selection Customization */}
                                    <div className="space-y-2">
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "تخصيص أعمدة جدول الأصناف والأسعار المدرج"
                                                    : "Items Table Columns Customization"
                                            }
                                        />
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border border-border bg-surface-muted/20 rounded-none">
                                            {(tableColumns || []).map((col) => {
                                                const keyMap = {
                                                    item_name:
                                                        "table_show_item",
                                                    qty: "table_show_qty",
                                                    rent: "table_show_rent",
                                                    discount:
                                                        "table_show_discount",
                                                    total: "table_show_total",
                                                };
                                                const fieldKey =
                                                    keyMap[col.code];
                                                if (!fieldKey) return null;
                                                return (
                                                    <label
                                                        key={col.code}
                                                        className="flex items-center gap-2.5 cursor-pointer text-xs text-text-muted hover:text-text"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                settingsForm
                                                                    .data[
                                                                    fieldKey
                                                                ]
                                                            }
                                                            onChange={(e) =>
                                                                settingsForm.setData(
                                                                    fieldKey,
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="rounded-none border-border text-primary focus:ring-primary h-4 w-4"
                                                        />
                                                        <span>
                                                            {lang === "ar"
                                                                ? col.label_ar
                                                                : col.label_en}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Unified Editor (Quill WYSIWYG Editor) */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "قالب ومحتوى متن العقد الموحد (محرر ذكي)"
                                                        : "Unified Contract Template Content (Smart Editor)"
                                                }
                                            />
                                            <span className="text-[10px] text-amber-600 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded-none font-bold">
                                                {lang === "ar"
                                                    ? "ملاحظة: ضع وسم [ITEMS_TABLE] في سطر مستقل لحقن جدول الأصناف."
                                                    : "Note: Put [ITEMS_TABLE] on its own line to inject the storage table."}
                                            </span>
                                        </div>

                                        {/* Quill Container */}
                                        <div className="border border-border rounded-none overflow-hidden mt-1">
                                            <div
                                                ref={quillRef}
                                                className="min-h-[350px] text-xs bg-surface text-text"
                                            />
                                        </div>

                                        {/* Smart Variables helper */}
                                        <div className="space-y-1.5 pt-2">
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "انقر لحقن المتغيرات الذكية في العقد:"
                                                        : "Click to inject smart variables:"
                                                }
                                            />
                                            <div className="flex flex-wrap gap-1.5">
                                                {smartVariablesList.map((v) => (
                                                    <button
                                                        key={v.code}
                                                        type="button"
                                                        onClick={() =>
                                                            insertVariableIntoQuill(
                                                                v.code,
                                                            )
                                                        }
                                                        className="px-2 py-1 text-[10px] font-mono border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all rounded-none"
                                                    >
                                                        {v.label}{" "}
                                                        <span className="opacity-80">
                                                            ({v.code})
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <PrimaryButton
                                        disabled={settingsForm.processing}
                                        className="rounded-none"
                                    >
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === "ar"
                                            ? "حفظ إعدادات المظهر والتخطيط"
                                            : "Save Layout Settings"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                        {/* Tab 4: Periods and Calendar */}
                        {activeTab === "periods" && (
                            <form
                                onSubmit={saveSettings}
                                className="space-y-6 max-w-xl print:hidden"
                            >
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "المدة الإلزامية الافتراضية"
                                                    : "Global Mandatory Period"
                                            }
                                        />
                                        <div className="mt-1 flex items-center gap-3">
                                            <TextInput
                                                type="number"
                                                className="w-full rounded-none"
                                                value={
                                                    settingsForm.data
                                                        .default_mandatory_period
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        "default_mandatory_period",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <span className="text-sm text-text-muted shrink-0">
                                                {lang === "ar"
                                                    ? "شهر"
                                                    : "Months"}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "فترة التجديد الافتراضية"
                                                    : "Global Renewal Period"
                                            }
                                        />
                                        <div className="mt-1 flex items-center gap-3">
                                            <TextInput
                                                type="number"
                                                className="w-full rounded-none"
                                                value={
                                                    settingsForm.data
                                                        .default_renewal_period
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        "default_renewal_period",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            <span className="text-sm text-text-muted shrink-0">
                                                {lang === "ar"
                                                    ? "شهر"
                                                    : "Months"}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "نوع التقويم المعتمد"
                                                    : "Calendar Type"
                                            }
                                        />
                                        <select
                                            className="mt-1 block w-full border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm rounded-none h-[42px]"
                                            value={
                                                settingsForm.data.calendar_type
                                            }
                                            onChange={(e) =>
                                                settingsForm.setData(
                                                    "calendar_type",
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            <option value="gregorian">
                                                {lang === "ar"
                                                    ? "ميلادي (Gregorian)"
                                                    : "Gregorian"}
                                            </option>
                                            <option value="hijri">
                                                {lang === "ar"
                                                    ? "هجري (Hijri)"
                                                    : "Hijri"}
                                            </option>
                                        </select>
                                    </div>

                                    <div className="flex items-end pb-2.5">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted hover:text-text">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    settingsForm.data
                                                        .is_renewable
                                                }
                                                onChange={(e) =>
                                                    settingsForm.setData(
                                                        "is_renewable",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="rounded-none border-border text-primary focus:ring-primary h-4.5 w-4.5"
                                            />
                                            <span>
                                                {lang === "ar"
                                                    ? "العقد قابل للتجديد تلقائياً"
                                                    : "Contract is auto-renewable"}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border flex justify-end">
                                    <PrimaryButton
                                        disabled={settingsForm.processing}
                                        className="rounded-none"
                                    >
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === "ar"
                                            ? "حفظ مدد العقود والتقويم"
                                            : "Save Period Settings"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                        {/* Tab 5: Live A4 Preview Simulation */}
                        {activeTab === "preview" && (
                            <div className="space-y-4">
                                <div className="flex justify-end print:hidden mb-4">
                                    <PrimaryButton
                                        type="button"
                                        onClick={() => window.print()}
                                        className="rounded-none shrink-0"
                                    >
                                        <Printer className="h-4 w-4 me-2" />
                                        {lang === "ar"
                                            ? "طباعة تجريبية"
                                            : "Test Print"}
                                    </PrimaryButton>
                                </div>

                                {/* Simulated Paper Sheet container */}
                                <div className="bg-zinc-100 p-8 border border-border rounded-none flex justify-center overflow-x-auto select-none print:bg-transparent print:p-0 print:border-none print:overflow-visible">
                                    <div
                                        className="bg-white text-black p-8 font-sans w-[800px] shadow-lg border border-zinc-300 min-h-[1130px] flex flex-col text-start relative animate-fadeIn print:shadow-none print:border-none print:w-full print:p-0 print:min-h-0"
                                        dir={lang === "ar" ? "rtl" : "ltr"}
                                    >
                                        {/* ── HEADER DESIGN PREVIEWS ── */}
                                        <div className="mb-4">
                                            {renderHeaderPreview(
                                                settingsForm.data
                                                    .header_design_id,
                                            )}
                                        </div>

                                        {/* ── BODY CONTENT RENDER ── */}
                                        <div className="flex-1 text-black text-xs leading-relaxed space-y-4">
                                            {renderTemplateWithItems(
                                                typedFieldValue(
                                                    "unified_contract_template",
                                                ),
                                            )}
                                        </div>

                                        {/* ── SIGNATURES AREA ── */}
                                        <div className="border-t-2 border-black pt-4 mt-6 grid grid-cols-2 gap-8 text-[10px] text-black">
                                            <div className="space-y-2 text-start">
                                                <p className="font-bold border-b border-zinc-300 pb-1 text-[11px]">
                                                    {lang === "ar"
                                                        ? "الطرف الأول"
                                                        : "First Party"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "اسم المنشأة:"
                                                            : "Company:"}
                                                    </span>{" "}
                                                    {
                                                        settingsForm.data
                                                            .company_name
                                                    }
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "الممثل النظامي:"
                                                            : "Signatory:"}
                                                    </span>{" "}
                                                    {
                                                        settingsForm.data
                                                            .company_gm
                                                    }
                                                </p>
                                                <p className="pt-2">
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "التوقيع:"
                                                            : "Signature:"}
                                                    </span>{" "}
                                                    ___________________________
                                                </p>
                                                <p className="text-[8px] text-zinc-400 font-bold">
                                                    {lang === "ar"
                                                        ? "(ختم المنشأة الرسمي)"
                                                        : "(Official Stamp Space)"}
                                                </p>
                                            </div>
                                            <div className="space-y-2 text-start">
                                                <p className="font-bold border-b border-zinc-300 pb-1 text-[11px]">
                                                    {lang === "ar"
                                                        ? "الطرف الثاني"
                                                        : "Second Party"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "اسم العميل:"
                                                            : "Customer Name:"}
                                                    </span>{" "}
                                                    {lang === "ar"
                                                        ? "شركة الطرف الثاني للتجارة"
                                                        : "Second Party Company"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "المفوض:"
                                                            : "Authorized Signatory:"}
                                                    </span>{" "}
                                                    {lang === "ar"
                                                        ? "محمد بن سليمان"
                                                        : "Mohamed Bin Soliman"}
                                                </p>
                                                <p className="pt-2">
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "التوقيع:"
                                                            : "Signature:"}
                                                    </span>{" "}
                                                    ___________________________
                                                </p>
                                                {settingsForm.data
                                                    .include_second_party_proxy && (
                                                    <div className="pt-1.5 border-t border-dashed border-zinc-200">
                                                        <p className="font-bold text-zinc-700 text-[9px]">
                                                            {lang === "ar"
                                                                ? "ينوب عنه في التوقيع:"
                                                                : "Proxy Signatory:"}
                                                        </p>
                                                        <p>
                                                            <span className="font-semibold">
                                                                {lang === "ar"
                                                                    ? "الاسم:"
                                                                    : "Name:"}
                                                            </span>{" "}
                                                            {lang === "ar"
                                                                ? "علي بن أحمد"
                                                                : "Ali Bin Ahmed"}
                                                        </p>
                                                        <p className="pt-1">
                                                            <span className="font-semibold">
                                                                {lang === "ar"
                                                                    ? "التوقيع:"
                                                                    : "Signature:"}
                                                            </span>{" "}
                                                            ___________________________
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="pt-1">
                                                    <span className="font-semibold">
                                                        {lang === "ar"
                                                            ? "التاريخ:"
                                                            : "Date:"}
                                                    </span>{" "}
                                                    ____ / ____ / ________
                                                </p>
                                            </div>
                                        </div>

                                        {/* ── FOOTER DESIGN PREVIEWS ── */}
                                        <div className="mt-8 border-t border-zinc-200 pt-3">
                                            {renderFooterPreview(
                                                settingsForm.data
                                                    .footer_design_id,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Term Modal */}
            <Modal
                show={showTermModal}
                onClose={() => setShowTermModal(false)}
                maxWidth="lg"
            >
                <form onSubmit={saveTerm} className="p-6 space-y-4">
                    <h3 className="font-bold text-lg text-text rounded-none">
                        {editingTerm
                            ? lang === "ar"
                                ? "تعديل شرط"
                                : "Edit Term"
                            : lang === "ar"
                              ? "إضافة شرط جديد"
                              : "New Term"}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "نص الشرط (بالعربي) *"
                                        : "Term Text (Arabic) *"
                                }
                            />
                            <textarea
                                className="mt-1 block w-full border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[100px] rounded-none"
                                value={termForm.text_ar}
                                onChange={(e) =>
                                    setTermForm({
                                        ...termForm,
                                        text_ar: e.target.value,
                                    })
                                }
                                required
                            />
                            <InputError message={termErrors.text_ar} />
                        </div>
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "نص الشرط (بالإنجليزي - اختياري)"
                                        : "Term Text (English - Optional)"
                                }
                            />
                            <textarea
                                className="mt-1 block w-full border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[100px] rounded-none"
                                value={termForm.text_en}
                                onChange={(e) =>
                                    setTermForm({
                                        ...termForm,
                                        text_en: e.target.value,
                                    })
                                }
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <SecondaryButton
                            type="button"
                            onClick={() => setShowTermModal(false)}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={saving}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "حفظ الشرط" : "Save Term"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                show={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                maxWidth="sm"
            >
                <div className="p-6 text-center">
                    <div className="h-12 w-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-lg text-text">
                        {lang === "ar" ? "حذف الشرط؟" : "Delete Term?"}
                    </h3>
                    <p className="text-sm text-text-muted mt-2">
                        {lang === "ar"
                            ? "هل أنت متأكد من حذف هذا الشرط من المكتبة العامة؟"
                            : "Are you sure you want to delete this term from the global library?"}
                    </p>

                    <div className="flex justify-center gap-3 mt-6">
                        <SecondaryButton
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <DangerButton
                            onClick={removeTerm}
                            className="rounded-none"
                        >
                            {lang === "ar" ? "حذف نهائياً" : "Delete Forever"}
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
