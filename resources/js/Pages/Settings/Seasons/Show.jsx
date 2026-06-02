import React, { useState, useRef, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import axios from "axios";
import { useLang } from "@/Contexts/LanguageContext";
import {
    Calendar,
    Home,
    ChevronRight,
    FileText,
    LayoutList,
    Clock,
    Save,
    X,
    GripVertical,
    Check,
    Variable,
    Search,
    Info,
    Plus,
    Edit,
    Trash2,
    Settings,
    Eye,
    EyeOff,
    CheckCircle2,
} from "lucide-react";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import Tooltip from "@/Components/Tooltip";
import TabBar from "@/Components/TabBar";

export default function Show({ season, allTerms, settings, blocks }) {
    const { lang } = useLang();
    const [activeTab, setActiveTab] = useState("settings"); // settings, terms, blocks
    const [termSearch, setTermSearch] = useState("");
    const [seasonTerms, setSeasonTerms] = useState(season.terms || []);
    const [localBlocks, setLocalBlocks] = useState(blocks || []);
    const [savingBlockId, setSavingBlockId] = useState(null);
    const [blockSuccessMsg, setBlockSuccessMsg] = useState({});

    // Drag and drop refs
    const dragIndex = useRef(null);
    const [dragOver, setDragOver] = useState(null);

    // Sync state with props when they change
    useEffect(() => {
        setSeasonTerms(season.terms || []);
    }, [season.terms]);

    useEffect(() => {
        setLocalBlocks(blocks || []);
    }, [blocks]);

    // Tab 1: Season settings form
    const { data, setData, put, processing, errors } = useForm({
        code: season.code || "",
        name_ar: season.name_ar || "",
        name_en: season.name_en || "",
        start_date: season.start_date || "",
        end_date: season.end_date || "",
        is_active: !!season.is_active,
        mandatory_period: season.mandatory_period || 12,
        renewal_period: season.renewal_period || 12,
    });

    const submitSettings = (e) => {
        e.preventDefault();
        put(route("settings.seasons.update", season.id));
    };

    // ── Term Sync Logic ──────────────────────────────────────────
    const toggleTerm = async (term) => {
        const isAssigned = seasonTerms.some(
            (t) => t.id === term.id || t.parent_id === term.id,
        );
        let newList;
        if (isAssigned) {
            newList = seasonTerms.filter(
                (t) => t.id !== term.id && t.parent_id !== term.id,
            );
        } else {
            newList = [...seasonTerms, { ...term, parent_id: term.id }];
        }
        setSeasonTerms(newList);
        const parentIds = newList.map((t) => t.parent_id || t.id);
        try {
            await axios.post(route("seasons.terms.sync", season.id), {
                term_ids: parentIds,
            });
        } catch (err) {
            console.error("Error syncing terms:", err);
        }
    };

    const onDragStart = (index) => {
        dragIndex.current = index;
    };
    const onDragEnter = (index) => {
        setDragOver(index);
    };
    const onDragEnd = async () => {
        if (
            dragIndex.current === null ||
            dragOver === null ||
            dragIndex.current === dragOver
        ) {
            dragIndex.current = null;
            setDragOver(null);
            return;
        }
        const reordered = [...seasonTerms];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(dragOver, 0, moved);
        setSeasonTerms(reordered);
        dragIndex.current = null;
        setDragOver(null);
        try {
            await axios.post(route("seasons.terms.reorder", season.id), {
                ordered_ids: reordered.map((t) => t.id),
            });
        } catch (err) {
            console.error("Error reordering terms:", err);
        }
    };

    // Term add & edit state
    const [termToEdit, setTermToEdit] = useState(null);
    const [termEditForm, setTermEditForm] = useState({
        text_ar: "",
        text_en: "",
        processing: false,
    });
    const [newTermForm, setNewTermForm] = useState({
        text_ar: "",
        text_en: "",
        is_active: true,
        showForm: false,
    });

    const openEditTermModal = (term) => {
        setTermToEdit(term);
        setTermEditForm({
            text_ar: term.text_ar || "",
            text_en: term.text_en || "",
            processing: false,
        });
    };

    const saveTermText = async (e) => {
        e.preventDefault();
        setTermEditForm((prev) => ({ ...prev, processing: true }));
        try {
            await axios.put(route("settings.terms.update", termToEdit.id), {
                text_ar: termEditForm.text_ar,
                text_en: termEditForm.text_en,
                is_active: true,
            });
            setSeasonTerms((prev) =>
                prev.map((t) =>
                    t.id === termToEdit.id
                        ? {
                              ...t,
                              text_ar: termEditForm.text_ar,
                              text_en: termEditForm.text_en,
                          }
                        : t,
                ),
            );
            setTermToEdit(null);
        } catch (err) {
            console.error(err);
        } finally {
            setTermEditForm((prev) => ({ ...prev, processing: false }));
        }
    };

    const deleteTerm = (termId) => {
        if (
            confirm(
                lang === "ar"
                    ? "هل أنت متأكد من حذف هذا الشرط من الموسم؟"
                    : "Are you sure you want to delete this term from the season?",
            )
        ) {
            router.delete(route("settings.terms.destroy", termId), {
                onSuccess: () => {
                    setSeasonTerms((prev) =>
                        prev.filter((t) => t.id !== termId),
                    );
                },
            });
        }
    };

    const saveNewTerm = (e) => {
        e.preventDefault();
        router.post(
            route("settings.terms.store"),
            {
                text_ar: newTermForm.text_ar,
                text_en: newTermForm.text_en,
                is_active: newTermForm.is_active,
                season_id: season.id,
            },
            {
                onSuccess: () => {
                    setNewTermForm({
                        text_ar: "",
                        text_en: "",
                        is_active: true,
                        showForm: false,
                    });
                },
            },
        );
    };

    // ── Contract Blocks Logic ────────────────────────────────────
    const getBlockMetadata = (key) => {
        const metadata = {
            header: {
                name: lang === "ar" ? "ترويسة العقد" : "Contract Header",
                desc:
                    lang === "ar"
                        ? "شعار الشركة والبيانات العامة للشركة في الترويسة العليا للمستند."
                        : "Company logo and general metadata at the very top.",
                hasText: false,
            },
            title: {
                name: lang === "ar" ? "عنوان العقد" : "Contract Title",
                desc:
                    lang === "ar"
                        ? "عنوان وثيقة العقد الأساسي (مثال: عقد إيجار مستودع)."
                        : "Contract document main title.",
                hasText: true,
                placeholder:
                    lang === "ar"
                        ? "اكتب عنوان العقد هنا..."
                        : "Enter contract title here...",
            },
            serialize: {
                name: lang === "ar" ? "ترقيم العقد" : "Contract Serial Number",
                desc:
                    lang === "ar"
                        ? "الرقم المسلسل التلقائي المشتق من بادئة الموسم ورقم العقد."
                        : "Unique auto-generated serial number for the contract.",
                hasText: false,
            },
            intro: {
                name: lang === "ar" ? "مقدمة العقد" : "Contract Introduction",
                desc:
                    lang === "ar"
                        ? "تاريخ التوقيع والتحرير والمقدمة الأساسية للعقد."
                        : "Creation date details and introductory text.",
                hasText: true,
                placeholder:
                    lang === "ar"
                        ? "اكتب مقدمة العقد هنا..."
                        : "Enter contract introduction here...",
            },
            parties: {
                name: lang === "ar" ? "أطراف العقد" : "Contract Parties",
                desc:
                    lang === "ar"
                        ? "بيانات الطرف الأول والطرف الثاني والمندوبين الموقعين."
                        : "Signatory parties information (Lessor and Lessee details).",
                hasText: false,
            },
            preamble: {
                name: lang === "ar" ? "تمهيد العقد" : "Contract Preamble",
                desc:
                    lang === "ar"
                        ? "التمهيد والنية المشتركة وأهلية التعاقد للطرفين."
                        : "Legal capacities and basic agreements preamble.",
                hasText: true,
                placeholder:
                    lang === "ar"
                        ? "اكتب تمهيد العقد هنا..."
                        : "Enter contract preamble here...",
            },
            los: {
                name:
                    lang === "ar"
                        ? "أصناف العقد (مواقع التخزين)"
                        : "Storage Allocation Items",
                desc:
                    lang === "ar"
                        ? "جدول المساحات والخدمات المحجوزة والأسعار والكميات."
                        : "Table of reserved storage units, monthly rent, and counts.",
                hasText: false,
            },
            signature: {
                name:
                    lang === "ar"
                        ? "توقيعات العقد والختم"
                        : "Contract Signatures",
                desc:
                    lang === "ar"
                        ? "مكان توقيع الطرفين والشهود والأختام الرسمية للمؤسسة."
                        : "Signature boxes, witness info, and stamp placeholder.",
                hasText: false,
            },
            footer: {
                name: lang === "ar" ? "ذيل العقد" : "Contract Footer",
                desc:
                    lang === "ar"
                        ? "تذييل العقد والصفحة (أرقام التواصل وعناوين الاتصال وبنود الدفع)."
                        : "Footer notes, page info, and special payment terms.",
                hasText: true,
                placeholder:
                    lang === "ar"
                        ? "اكتب ذيل العقد هنا..."
                        : "Enter contract footer here...",
            },
        };
        return metadata[key] || { name: key, desc: "", hasText: false };
    };

    const handleToggleBlock = async (block, isEnabled) => {
        try {
            await axios.put(
                route("settings.seasons.blocks.update", [season.id, block.id]),
                {
                    is_enabled: isEnabled,
                    content: block.content || {},
                },
            );
            setLocalBlocks((prev) =>
                prev.map((b) =>
                    b.id === block.id ? { ...b, is_enabled: isEnabled } : b,
                ),
            );
        } catch (err) {
            console.error("Error toggling block:", err);
        }
    };

    const handleBlockTextChange = (blockId, text) => {
        setLocalBlocks((prev) =>
            prev.map((b) =>
                b.id === blockId
                    ? { ...b, content: { ...b.content, text } }
                    : b,
            ),
        );
    };

    const handleSaveBlock = async (block) => {
        setSavingBlockId(block.id);
        try {
            await axios.put(
                route("settings.seasons.blocks.update", [season.id, block.id]),
                {
                    is_enabled: block.is_enabled,
                    content: block.content || {},
                },
            );
            setBlockSuccessMsg((prev) => ({ ...prev, [block.id]: true }));
            setTimeout(() => {
                setBlockSuccessMsg((prev) => ({ ...prev, [block.id]: false }));
            }, 3000);
        } catch (err) {
            console.error("Error saving block text:", err);
        } finally {
            setSavingBlockId(null);
        }
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
            <span
                className="cursor-pointer hover:text-primary transition-colors"
                onClick={() => router.get(route("settings.seasons.index"))}
            >
                {lang === "ar" ? "المواسم" : "Seasons"}
            </span>
            <ChevronRight
                className={lang === "ar" ? "rotate-180 h-4 w-4" : "h-4 w-4"}
            />
            <span className="text-primary font-medium">{season.name_ar}</span>
        </div>
    );

    const tabs = [
        {
            id: "settings",
            label: lang === "ar" ? "إعدادات الموسم" : "Season Settings",
            icon: Settings,
        },
        {
            id: "terms",
            label: lang === "ar" ? "شروط وبنود الموسم" : "Season Terms",
            icon: LayoutList,
        },
        {
            id: "blocks",
            label: lang === "ar" ? "أجزاء العقد (البلوكات)" : "Contract Blocks",
            icon: FileText,
        },
    ];

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head
                title={`${lang === "ar" ? "تفاصيل وإعدادات الموسم" : "Season Details"} - ${season.name_ar}`}
            />

            <div className="mx-auto max-w-6xl main-stack-y">
                {/* Header Panel */}
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-text">
                                    {season.name_ar}
                                </h1>
                                <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded font-mono font-semibold">
                                    {season.code}
                                </span>
                            </div>
                            <p className="text-xs text-text-muted mt-1">
                                {season.start_date} ← {season.end_date}
                                <span
                                    className={`ms-2 px-1.5 py-0.5 rounded-full text-[10px] ${season.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}
                                >
                                    {season.is_active
                                        ? lang === "ar"
                                            ? "نشط حالياً"
                                            : "Currently Active"
                                        : lang === "ar"
                                          ? "غير نشط"
                                          : "Inactive"}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Card */}
                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

                    <div className="p-6 flex-1 space-y-4">
                        {/* Tab 1: Season Settings Form */}
                        {activeTab === "settings" && (
                            <form
                                onSubmit={submitSettings}
                                className="space-y-6 max-w-3xl"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الاسم بالعربية"
                                                    : "Name (Arabic)"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full text-sm"
                                            value={data.name_ar}
                                            onChange={(e) =>
                                                setData(
                                                    "name_ar",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError message={errors.name_ar} />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "الاسم بالإنجليزية"
                                                    : "Name (English)"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full text-sm"
                                            value={data.name_en}
                                            onChange={(e) =>
                                                setData(
                                                    "name_en",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.name_en} />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "كود الموسم (بادئة الترقيم)"
                                                    : "Season Code (Numbering Prefix)"
                                            }
                                        />
                                        <TextInput
                                            className="mt-1 block w-full text-sm uppercase font-mono"
                                            value={data.code}
                                            onChange={(e) =>
                                                setData("code", e.target.value)
                                            }
                                            required
                                        />
                                        <InputError message={errors.code} />
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.is_active}
                                                onChange={(e) =>
                                                    setData(
                                                        "is_active",
                                                        e.target.checked,
                                                    )
                                                }
                                                className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <span className="text-sm font-semibold text-text">
                                                {lang === "ar"
                                                    ? "موسم نشط للمستندات الجديدة"
                                                    : "Active season for new documents"}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "تاريخ البداية"
                                                    : "Start Date"
                                            }
                                        />
                                        <TextInput
                                            type="date"
                                            className="mt-1 block w-full text-sm"
                                            value={data.start_date}
                                            onChange={(e) =>
                                                setData(
                                                    "start_date",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError
                                            message={errors.start_date}
                                        />
                                    </div>
                                    <div>
                                        <InputLabel
                                            value={
                                                lang === "ar"
                                                    ? "تاريخ النهاية"
                                                    : "End Date"
                                            }
                                        />
                                        <TextInput
                                            type="date"
                                            className="mt-1 block w-full text-sm"
                                            value={data.end_date}
                                            onChange={(e) =>
                                                setData(
                                                    "end_date",
                                                    e.target.value,
                                                )
                                            }
                                            required
                                        />
                                        <InputError message={errors.end_date} />
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <h3 className="text-sm font-bold text-text mb-4">
                                        {lang === "ar"
                                            ? "المدد الزمنية الافتراضية لعقود هذا الموسم"
                                            : "Default Period Options for Contracts"}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "المدة الإلزامية (بالأشهر)"
                                                        : "Mandatory Period (Months)"
                                                }
                                            />
                                            <div className="mt-1 flex items-center gap-3">
                                                <TextInput
                                                    type="number"
                                                    className="w-full text-sm"
                                                    value={
                                                        data.mandatory_period
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "mandatory_period",
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
                                            <InputError
                                                message={
                                                    errors.mandatory_period
                                                }
                                            />
                                        </div>
                                        <div>
                                            <InputLabel
                                                value={
                                                    lang === "ar"
                                                        ? "فترة التجديد التلقائي (بالأشهر)"
                                                        : "Renewal Period (Months)"
                                                }
                                            />
                                            <div className="mt-1 flex items-center gap-3">
                                                <TextInput
                                                    type="number"
                                                    className="w-full text-sm"
                                                    value={data.renewal_period}
                                                    onChange={(e) =>
                                                        setData(
                                                            "renewal_period",
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
                                            <InputError
                                                message={errors.renewal_period}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-border">
                                    <PrimaryButton
                                        type="submit"
                                        disabled={processing}
                                    >
                                        <Save className="h-4 w-4 me-2" />
                                        {lang === "ar"
                                            ? "حفظ إعدادات الموسم"
                                            : "Save Season Settings"}
                                    </PrimaryButton>
                                </div>
                            </form>
                        )}

                        {/* Tab 2: Season Terms & Conditions */}
                        {activeTab === "terms" && (
                            <div className="space-y-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Left Panel: Terms Library */}
                                    <div className="w-full lg:w-1/2 flex flex-col space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {lang === "ar"
                                                    ? "مكتبة الشروط العامة للتطبيق"
                                                    : "Global Terms Library"}
                                            </h3>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    placeholder={
                                                        lang === "ar"
                                                            ? "بحث في الشروط..."
                                                            : "Search terms..."
                                                    }
                                                    className="ps-8 pe-2 py-1 border border-border rounded-md text-[11px] bg-surface focus:ring-1 focus:ring-primary focus:border-primary w-48"
                                                    value={termSearch}
                                                    onChange={(e) =>
                                                        setTermSearch(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <Search className="absolute start-2 top-1.5 h-3.5 w-3.5 text-text-muted" />
                                            </div>
                                        </div>

                                        <div className="border border-border rounded-xl divide-y divide-border max-h-[450px] overflow-y-auto bg-surface shadow-sm">
                                            {allTerms.filter((t) =>
                                                t.text_ar.includes(termSearch),
                                            ).length === 0 ? (
                                                <div className="p-8 text-center text-text-muted italic text-xs">
                                                    {lang === "ar"
                                                        ? "لا يوجد شروط مطابقة للبحث"
                                                        : "No terms match your search"}
                                                </div>
                                            ) : (
                                                allTerms
                                                    .filter((t) =>
                                                        t.text_ar.includes(
                                                            termSearch,
                                                        ),
                                                    )
                                                    .map((term) => {
                                                        const isIn =
                                                            seasonTerms.some(
                                                                (t) =>
                                                                    t.id ===
                                                                        term.id ||
                                                                    t.parent_id ===
                                                                        term.id,
                                                            );
                                                        return (
                                                            <div
                                                                key={term.id}
                                                                onClick={() =>
                                                                    toggleTerm(
                                                                        term,
                                                                    )
                                                                }
                                                                className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                                    isIn
                                                                        ? "bg-primary/5 hover:bg-primary/10"
                                                                        : "hover:bg-surface-muted/30"
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                                                        isIn
                                                                            ? "bg-primary border-primary"
                                                                            : "border-border"
                                                                    }`}
                                                                >
                                                                    {isIn && (
                                                                        <Check className="h-2.5 w-2.5 text-white" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs text-text leading-relaxed font-medium">
                                                                        {
                                                                            term.text_ar
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Panel: Season Terms List & Custom Terms Form */}
                                    <div className="w-full lg:w-1/2 flex flex-col space-y-4">
                                        {/* Inline Form to add a new custom term */}
                                        <div className="bg-surface-muted/20 border border-border rounded-xl p-4 space-y-3 shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-text">
                                                    {lang === "ar"
                                                        ? "إضافة شرط مخصص لهذا الموسم مباشرة:"
                                                        : "Add a Custom Term to this Season:"}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setNewTermForm(
                                                            (prev) => ({
                                                                ...prev,
                                                                showForm:
                                                                    !prev.showForm,
                                                            }),
                                                        )
                                                    }
                                                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                                                >
                                                    {newTermForm.showForm
                                                        ? lang === "ar"
                                                            ? "إغلاق النموذج"
                                                            : "Close Form"
                                                        : lang === "ar"
                                                          ? "إضافة شرط"
                                                          : "Add Term"}
                                                </button>
                                            </div>

                                            {newTermForm.showForm && (
                                                <form
                                                    onSubmit={saveNewTerm}
                                                    className="space-y-3"
                                                >
                                                    <div>
                                                        <textarea
                                                            placeholder={
                                                                lang === "ar"
                                                                    ? "أدخل نص الشرط المخصص باللغة العربية..."
                                                                    : "Enter custom term text in Arabic..."
                                                            }
                                                            className="w-full rounded-md border-border bg-surface text-xs focus:ring-primary focus:border-primary min-h-[70px]"
                                                            value={
                                                                newTermForm.text_ar
                                                            }
                                                            onChange={(e) =>
                                                                setNewTermForm({
                                                                    ...newTermForm,
                                                                    text_ar:
                                                                        e.target
                                                                            .value,
                                                                })
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <PrimaryButton
                                                            type="submit"
                                                            className="!py-1 !px-3 !text-xs"
                                                        >
                                                            <Plus className="h-3 w-3 me-1" />
                                                            {lang === "ar"
                                                                ? "إضافة للشرائح"
                                                                : "Add to Terms"}
                                                        </PrimaryButton>
                                                    </div>
                                                </form>
                                            )}
                                        </div>

                                        {/* Active Terms Count */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                                                {lang === "ar"
                                                    ? `شروط الموسم الحالية (${seasonTerms.length})`
                                                    : `Season Terms (${seasonTerms.length})`}
                                            </h3>
                                        </div>

                                        {/* List of active season terms */}
                                        {seasonTerms.length === 0 ? (
                                            <div className="border border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center bg-surface-muted/10 flex-1">
                                                <LayoutList className="h-8 w-8 text-text-muted mb-2 opacity-30" />
                                                <p className="text-xs text-text-muted italic">
                                                    {lang === "ar"
                                                        ? "لم يتم تفعيل أي شروط للموسم، يرجى اختيارها من اليمين."
                                                        : "No terms active. Click global terms on the left to enable."}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="border border-border rounded-xl divide-y divide-border bg-surface shadow-sm max-h-[350px] overflow-y-auto">
                                                {seasonTerms.map(
                                                    (term, index) => (
                                                        <div
                                                            key={term.id}
                                                            draggable
                                                            onDragStart={() =>
                                                                onDragStart(
                                                                    index,
                                                                )
                                                            }
                                                            onDragEnter={() =>
                                                                onDragEnter(
                                                                    index,
                                                                )
                                                            }
                                                            onDragEnd={
                                                                onDragEnd
                                                            }
                                                            onDragOver={(e) =>
                                                                e.preventDefault()
                                                            }
                                                            className={`flex items-start gap-2 px-3 py-2 select-none transition-colors ${
                                                                dragOver ===
                                                                index
                                                                    ? "bg-primary/5"
                                                                    : "hover:bg-surface-muted/20"
                                                            }`}
                                                        >
                                                            <div className="cursor-grab active:cursor-grabbing text-text-muted mt-1 shrink-0">
                                                                <GripVertical className="h-4.5 w-4.5" />
                                                            </div>
                                                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">
                                                                {index + 1}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-text leading-relaxed font-medium">
                                                                    {
                                                                        term.text_ar
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        openEditTermModal(
                                                                            term,
                                                                        )
                                                                    }
                                                                    className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                                                    title={
                                                                        lang ===
                                                                        "ar"
                                                                            ? "تعديل"
                                                                            : "Edit"
                                                                    }
                                                                >
                                                                    <Edit className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        deleteTerm(
                                                                            term.id,
                                                                        )
                                                                    }
                                                                    className="p-1 rounded-md text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                                    title={
                                                                        lang ===
                                                                        "ar"
                                                                            ? "حذف"
                                                                            : "Delete"
                                                                    }
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        )}
                                        <p className="text-[10px] text-text-muted italic text-center">
                                            {lang === "ar"
                                                ? "* اسحب الشروط لإعادة ترتيبها فورياً في وثيقة العقد."
                                                : "* Drag and drop terms to reorder them."}
                                        </p>
                                    </div>
                                </div>

                                {/* Smart Variables Guide */}
                                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl max-w-xl">
                                    <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                        <Variable className="h-4 w-4 text-amber-600" />
                                        {lang === "ar"
                                            ? "دليل المتغيرات النشطة المتاحة في الشرائح"
                                            : "Smart Variables Guide"}
                                    </div>
                                    <p className="text-[11px] text-amber-700/80 mb-2 leading-relaxed">
                                        {lang === "ar"
                                            ? "سيقوم التطبيق تلقائياً بتعويض هذه المتغيرات ببيانات العقد قبل تصدير الوثيقة للطباعة:"
                                            : "The app will automatically replace these variables with actual values before printing:"}
                                    </p>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                        {[
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
                                                        ? "اسم المندوب للتوقيع"
                                                        : "Contact Name",
                                                code: "{$contact_name}",
                                            },
                                            {
                                                label:
                                                    lang === "ar"
                                                        ? "رقم العقد التسلسلي"
                                                        : "Contract No.",
                                                code: "{$contract_number}",
                                            },
                                            {
                                                label:
                                                    lang === "ar"
                                                        ? "تاريخ التحرير والبداية"
                                                        : "Start Date",
                                                code: "{$start_date}",
                                            },
                                            {
                                                label:
                                                    lang === "ar"
                                                        ? "المدة الإلزامية"
                                                        : "Mandatory Per.",
                                                code: "{$mandatory_period}",
                                            },
                                            {
                                                label:
                                                    lang === "ar"
                                                        ? "فترة التجديد التلقائي"
                                                        : "Renewal Per.",
                                                code: "{$renew_period}",
                                            },
                                        ].map((v) => (
                                            <div
                                                key={v.code}
                                                className="flex items-center justify-between border-b border-amber-500/10 pb-1"
                                            >
                                                <span className="text-[10px] text-amber-700 font-medium">
                                                    {v.label}
                                                </span>
                                                <code className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded text-amber-600 font-mono">
                                                    {v.code}
                                                </code>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab 3: Contract Blocks/Parts */}
                        {activeTab === "blocks" && (
                            <div className="space-y-6">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-primary">
                                            {lang === "ar"
                                                ? "إعدادات هيكلية وثيقة العقد للموسم (التأثير الفوري)"
                                                : "Contract document visual blocks system"}
                                        </p>
                                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                            {lang === "ar"
                                                ? "قم بتعديل محتويات البنود والنصوص المرجعية للموسم، أو تفعيل وتعطيل أجزاء المستند. التعديلات هنا ستنعكس فورياً كقيم مرجعية لجميع العقود المنشأة حديثاً تحت هذا الموسم."
                                                : "Modify season template text blocks, enable/disable document components. Changes here automatically populate new contracts under this season."}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    {localBlocks.map((block) => {
                                        const meta = getBlockMetadata(
                                            block.key,
                                        );
                                        return (
                                            <div
                                                key={block.id}
                                                className={`border rounded-2xl shadow-sm bg-surface p-5 transition-all ${
                                                    block.is_enabled
                                                        ? "border-border"
                                                        : "border-border-muted bg-surface-muted/10 opacity-75"
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border mb-4">
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`p-2 rounded-xl shrink-0 ${block.is_enabled ? "bg-primary/10 text-primary" : "bg-text-muted/10 text-text-muted"}`}
                                                        >
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-sm font-bold text-text">
                                                                    {meta.name}
                                                                </h4>
                                                                <span className="text-[10px] font-mono bg-surface-muted border border-border px-1.5 py-0.5 rounded text-text-muted">
                                                                    {block.key}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-text-muted mt-0.5">
                                                                {meta.desc}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        {/* Toggle Switch */}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleToggleBlock(
                                                                    block,
                                                                    !block.is_enabled,
                                                                )
                                                            }
                                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                block.is_enabled
                                                                    ? "bg-primary"
                                                                    : "bg-gray-200 dark:bg-zinc-700"
                                                            }`}
                                                        >
                                                            <span className="sr-only">
                                                                Toggle Block
                                                            </span>
                                                            <span
                                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                    block.is_enabled
                                                                        ? lang ===
                                                                          "ar"
                                                                            ? "-translate-x-5"
                                                                            : "translate-x-5"
                                                                        : "translate-x-0"
                                                                }`}
                                                            />
                                                        </button>

                                                        <span className="text-xs font-semibold text-text">
                                                            {block.is_enabled ? (
                                                                <span className="text-emerald-600 flex items-center gap-1">
                                                                    <Eye className="h-4 w-4" />
                                                                    {lang ===
                                                                    "ar"
                                                                        ? "مفعّل في الطباعة"
                                                                        : "Active in Print"}
                                                                </span>
                                                            ) : (
                                                                <span className="text-text-muted flex items-center gap-1">
                                                                    <EyeOff className="h-4 w-4" />
                                                                    {lang ===
                                                                    "ar"
                                                                        ? "معطّل"
                                                                        : "Disabled"}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Text Editing Content */}
                                                {meta.hasText &&
                                                    block.is_enabled && (
                                                        <div className="space-y-3">
                                                            <textarea
                                                                placeholder={
                                                                    meta.placeholder
                                                                }
                                                                value={
                                                                    block
                                                                        .content
                                                                        ?.text ||
                                                                    ""
                                                                }
                                                                onChange={(e) =>
                                                                    handleBlockTextChange(
                                                                        block.id,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                className="w-full rounded-xl border-border bg-surface text-xs focus:ring-primary focus:border-primary min-h-[100px] leading-relaxed"
                                                            />
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    {blockSuccessMsg[
                                                                        block.id
                                                                    ] && (
                                                                        <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                            {lang ===
                                                                            "ar"
                                                                                ? "تم الحفظ بنجاح!"
                                                                                : "Saved successfully!"}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <PrimaryButton
                                                                    type="button"
                                                                    disabled={
                                                                        savingBlockId ===
                                                                        block.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleSaveBlock(
                                                                            block,
                                                                        )
                                                                    }
                                                                    className="!py-1 !px-3.5 !text-xs"
                                                                >
                                                                    {savingBlockId ===
                                                                    block.id ? (
                                                                        <span>
                                                                            ...
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            <Save className="h-3.5 w-3.5 me-1" />
                                                                            {lang ===
                                                                            "ar"
                                                                                ? "حفظ التعديل"
                                                                                : "Save Changes"}
                                                                        </>
                                                                    )}
                                                                </PrimaryButton>
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Term Edit Modal */}
            <Modal
                show={!!termToEdit}
                onClose={() => setTermToEdit(null)}
                maxWidth="md"
            >
                <form onSubmit={saveTermText} className="p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                        <h3 className="font-bold text-lg text-text">
                            {lang === "ar"
                                ? "تعديل نص الشرط للموسم"
                                : "Edit Term Text for Season"}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setTermToEdit(null)}
                            className="text-text-muted hover:text-text"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "نص الشرط (عربي) *"
                                        : "Term Text (Arabic) *"
                                }
                            />
                            <textarea
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[120px]"
                                value={termEditForm.text_ar}
                                onChange={(e) =>
                                    setTermEditForm({
                                        ...termEditForm,
                                        text_ar: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>
                        <div>
                            <InputLabel
                                value={
                                    lang === "ar"
                                        ? "نص الشرط (إنجليزي)"
                                        : "Term Text (English)"
                                }
                            />
                            <textarea
                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[120px]"
                                value={termEditForm.text_en}
                                onChange={(e) =>
                                    setTermEditForm({
                                        ...termEditForm,
                                        text_en: e.target.value,
                                    })
                                }
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
                        <SecondaryButton
                            type="button"
                            onClick={() => setTermToEdit(null)}
                        >
                            {lang === "ar" ? "إلغاء" : "Cancel"}
                        </SecondaryButton>
                        <PrimaryButton disabled={termEditForm.processing}>
                            <Save className="h-4 w-4 me-1.5" />
                            {lang === "ar" ? "حفظ التعديلات" : "Save Changes"}
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
