import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import { 
    FileText, Home, ChevronRight, Save, Plus, Trash2, Layers, 
    Variable, Table, Sparkles, Printer, Check, Info
} from "lucide-react";
import PageHeader from "@/Components/PageHeader";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";

export default function ContractAdminSettings({ headerLayouts, footerLayouts, smartVariables, tableColumns }) {
    const { lang } = useLang();
    const [activeSection, setActiveSection] = useState("layouts"); // layouts, variables, table

    // Initialize Inertia form
    const { data, setData, post, processing } = useForm({
        headerLayouts: headerLayouts || [],
        footerLayouts: footerLayouts || [],
        smartVariables: smartVariables || [],
        tableColumns: tableColumns || [],
    });

    // --- State helpers for adding items ---
    const [newHeader, setNewHeader] = useState({ id: "", name_ar: "", name_en: "" });
    const [newFooter, setNewFooter] = useState({ id: "", name_ar: "", name_en: "" });
    const [newVar, setNewVar] = useState({ code: "", label_ar: "", label_en: "" });

    // --- Action Handlers ---
    const handleAddHeader = () => {
        if (!newHeader.id || !newHeader.name_ar || !newHeader.name_en) return;
        setData("headerLayouts", [...data.headerLayouts, { ...newHeader }]);
        setNewHeader({ id: "", name_ar: "", name_en: "" });
    };

    const handleRemoveHeader = (id) => {
        setData("headerLayouts", data.headerLayouts.filter(item => item.id !== id));
    };

    const handleAddFooter = () => {
        if (!newFooter.id || !newFooter.name_ar || !newFooter.name_en) return;
        setData("footerLayouts", [...data.footerLayouts, { ...newFooter }]);
        setNewFooter({ id: "", name_ar: "", name_en: "" });
    };

    const handleRemoveFooter = (id) => {
        setData("footerLayouts", data.footerLayouts.filter(item => item.id !== id));
    };

    const handleAddVar = () => {
        if (!newVar.code || !newVar.label_ar || !newVar.label_en) return;
        // Make sure it starts with {$
        let code = newVar.code.trim();
        if (!code.startsWith("{$") && !code.startsWith("[")) {
            code = `{$${code}}`;
        }
        setData("smartVariables", [...data.smartVariables, { ...newVar, code }]);
        setNewVar({ code: "", label_ar: "", label_en: "" });
    };

    const handleRemoveVar = (code) => {
        setData("smartVariables", data.smartVariables.filter(item => item.code !== code));
    };

    const handleToggleColumnDefault = (index) => {
        const updated = [...data.tableColumns];
        updated[index].default_visible = !updated[index].default_visible;
        setData("tableColumns", updated);
    };

    const handleColumnLabelChange = (index, field, value) => {
        const updated = [...data.tableColumns];
        updated[index][field] = value;
        setData("tableColumns", updated);
    };

    const handleSaveAll = (e) => {
        if (e) e.preventDefault();
        post(route("saas.settings.contracts.update"));
    };

    const t = {
        title: lang === "ar" ? "إعدادات هياكل العقود المركزية" : "Central Contract Structures",
        parent: lang === "ar" ? "إعدادات النظام" : "System Settings",
        desc: lang === "ar" 
            ? "تهيئة الخيارات المتاحة للمستأجرين مثل تصاميم الهيدر/الفوتر، المتغيرات الذكية، وجدول الأصناف الافتراضي." 
            : "Configure layout designs, smart variables, and items table fields available globally to all tenants.",
    };

    const breadcrumbs = (
        <div className="flex items-center gap-[6px] text-xs text-text-muted">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <Link href={route("saas.settings.index")} className="hover:text-primary transition-colors">
                {t.parent}
            </Link>
            <ChevronRight className={`h-3.5 w-3.5 ${lang === "ar" && "rotate-180"}`} />
            <span className="text-primary font-medium">{t.title}</span>
        </div>
    );

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={t.title} />

            <div className="mx-auto max-w-5xl space-y-4 pb-12" dir={lang === "ar" ? "rtl" : "ltr"}>
                
                {/* Header Section */}
                <PageHeader
                    icon={Layers}
                    title={t.title}
                    description={<p className="text-xs text-text-muted mt-0.5">{t.desc}</p>}
                    actions={
                        <PrimaryButton 
                            onClick={handleSaveAll} 
                            disabled={processing}
                            className="rounded-none h-[42px] px-6"
                        >
                            <Save className="h-4 w-4 me-2" />
                            {lang === "ar" ? "حفظ كافة التعديلات" : "Save Configurations"}
                        </PrimaryButton>
                    }
                />

                {/* Main Config Container */}
                <div className="bg-surface border border-border rounded-none shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-border bg-surface-muted/30">
                        {[
                            { id: "layouts", label: lang === "ar" ? "مخططات الطباعة (هيدر/فوتر)" : "Print Layouts", icon: Printer },
                            { id: "variables", label: lang === "ar" ? "المتغيرات الذكية" : "Smart Variables", icon: Variable },
                            { id: "table", label: lang === "ar" ? "مخطط جدول الأصناف" : "Items Table Layout", icon: Table },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 rounded-none ${
                                    activeSection === tab.id 
                                        ? 'border-primary text-primary bg-surface' 
                                        : 'border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Section Content */}
                    <div className="p-6 flex-1">
                        
                        {/* 1. PRINT LAYOUTS (Headers & Footers list) */}
                        {activeSection === "layouts" && (
                            <div className="space-y-8">
                                
                                {/* HEADER LAYOUTS SECTION */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-text">{lang === "ar" ? "مخططات الترويسة المتاحة (Header Layouts)" : "Available Header Designs"}</h3>
                                        <p className="text-xs text-text-muted mt-0.5">{lang === "ar" ? "المخططات المجهزة برمجياً وتظهر للمستأجرين في قائمة الخيارات." : "List of header layouts selectable by tenants in layout settings."}</p>
                                    </div>

                                    {/* Add Header form */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border bg-surface-muted/20 rounded-none items-end">
                                        <div>
                                            <InputLabel value={lang === "ar" ? "رقم التصميم (ID)" : "Layout ID"} />
                                            <TextInput 
                                                className="mt-1 block w-full rounded-none h-[38px] text-xs font-mono" 
                                                value={newHeader.id}
                                                onChange={e => setNewHeader({ ...newHeader, id: e.target.value })}
                                                placeholder="e.g. 6"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <InputLabel value={lang === "ar" ? "اسم التصميم (عربي)" : "Design Name (Arabic)"} />
                                            <TextInput 
                                                className="mt-1 block w-full rounded-none h-[38px] text-xs" 
                                                value={newHeader.name_ar}
                                                onChange={e => setNewHeader({ ...newHeader, name_ar: e.target.value })}
                                                placeholder="تصميم 6: هيدر حديث..."
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value={lang === "ar" ? "الاسم بالإنجليزي" : "Design Name (English)"} />
                                            <TextInput 
                                                className="mt-1 block w-full rounded-none h-[38px] text-xs font-mono" 
                                                value={newHeader.name_en}
                                                onChange={e => setNewHeader({ ...newHeader, name_en: e.target.value })}
                                                placeholder="Design 6: Modern Minimalist"
                                            />
                                        </div>
                                        <div className="md:col-span-4 flex justify-end">
                                            <PrimaryButton type="button" onClick={handleAddHeader} className="rounded-none">
                                                <Plus className="h-4 w-4 me-2" />
                                                {lang === "ar" ? "إضافة ترويسة جديدة" : "Add Header Design"}
                                            </PrimaryButton>
                                        </div>
                                    </div>

                                    {/* Headers Table */}
                                    <div className="border border-border rounded-none overflow-hidden bg-surface divide-y divide-border">
                                        {data.headerLayouts.map(layout => (
                                            <div key={layout.id} className="flex justify-between items-center p-3 text-xs hover:bg-surface-muted/30">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono bg-zinc-100 px-2 py-1 border border-zinc-200 text-black font-bold">#{layout.id}</span>
                                                    <div>
                                                        <p className="font-bold text-text">{layout.name_ar}</p>
                                                        <p className="text-[10px] text-text-muted font-mono" dir="ltr">{layout.name_en}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveHeader(layout.id)}
                                                    className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* FOOTER LAYOUTS SECTION */}
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div>
                                        <h3 className="text-sm font-bold text-text">{lang === "ar" ? "مخططات التذييل المتاحة (Footer Layouts)" : "Available Footer Designs"}</h3>
                                        <p className="text-xs text-text-muted mt-0.5">{lang === "ar" ? "تصاميم التذييل المتوفرة للمستأجرين في قائمة الخيارات." : "List of footer layouts selectable by tenants in layout settings."}</p>
                                    </div>

                                    {/* Add Footer form */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border bg-surface-muted/20 rounded-none items-end">
                                        <div>
                                            <InputLabel value={lang === "ar" ? "رقم التصميم (ID)" : "Layout ID"} />
                                            <TextInput 
                                                className="mt-1 block w-full rounded-none h-[38px] text-xs font-mono" 
                                                value={newFooter.id}
                                                onChange={e => setNewFooter({ ...newFooter, id: e.target.value })}
                                                placeholder="e.g. 6"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <InputLabel value={lang === "ar" ? "اسم التصميم (عربي)" : "Design Name (Arabic)"} />
                                            <TextInput 
                                                className="mt-1 block w-full rounded-none h-[38px] text-xs" 
                                                value={newFooter.name_ar}
                                                onChange={e => setNewFooter({ ...newFooter, name_ar: e.target.value })}
                                                placeholder="تعديل 6: شريط تواصل سفلي..."
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value={lang === "ar" ? "الاسم بالإنجليزي" : "Design Name (English)"} />
                                            <TextInput 
                                                className="mt-1 block w-full rounded-none h-[38px] text-xs font-mono" 
                                                value={newFooter.name_en}
                                                onChange={e => setNewFooter({ ...newFooter, name_en: e.target.value })}
                                                placeholder="Design 6: Modern Footer"
                                            />
                                        </div>
                                        <div className="md:col-span-4 flex justify-end">
                                            <PrimaryButton type="button" onClick={handleAddFooter} className="rounded-none">
                                                <Plus className="h-4 w-4 me-2" />
                                                {lang === "ar" ? "إضافة تذييل جديد" : "Add Footer Design"}
                                            </PrimaryButton>
                                        </div>
                                    </div>

                                    {/* Footers Table */}
                                    <div className="border border-border rounded-none overflow-hidden bg-surface divide-y divide-border">
                                        {data.footerLayouts.map(layout => (
                                            <div key={layout.id} className="flex justify-between items-center p-3 text-xs hover:bg-surface-muted/30">
                                                <div className="flex items-center gap-4">
                                                    <span className="font-mono bg-zinc-100 px-2 py-1 border border-zinc-200 text-black font-bold">#{layout.id}</span>
                                                    <div>
                                                        <p className="font-bold text-text">{layout.name_ar}</p>
                                                        <p className="text-[10px] text-text-muted font-mono" dir="ltr">{layout.name_en}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveFooter(layout.id)}
                                                    className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. SMART VARIABLES (Variables definition) */}
                        {activeSection === "variables" && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-text">{lang === "ar" ? "إدارة المتغيرات الذكية" : "Smart Variables Management"}</h3>
                                    <p className="text-xs text-text-muted mt-0.5">{lang === "ar" ? "هذه المتغيرات يتم تعويض قيمها تلقائياً عند طباعة العقود. تظهر كأزرار لحقنها في المحرر الذكي للمستأجرين." : "These variables interpolate dynamically at print. They appear as buttons in the tenant's smart editor."}</p>
                                </div>

                                {/* Add Variable form */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border bg-surface-muted/20 rounded-none items-end">
                                    <div>
                                        <InputLabel value={lang === "ar" ? "كود المتغير (Code)" : "Variable Code"} />
                                        <TextInput 
                                            className="mt-1 block w-full rounded-none h-[38px] text-xs font-mono text-primary" 
                                            value={newVar.code}
                                            onChange={e => setNewVar({ ...newVar, code: e.target.value })}
                                            placeholder="{$custom_var}"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <InputLabel value={lang === "ar" ? "اسم المتغير (عربي)" : "Label (Arabic)"} />
                                        <TextInput 
                                            className="mt-1 block w-full rounded-none h-[38px] text-xs" 
                                            value={newVar.label_ar}
                                            onChange={e => setNewVar({ ...newVar, label_ar: e.target.value })}
                                            placeholder="رقم المستند المرفق..."
                                        />
                                    </div>
                                    <div>
                                        <InputLabel value={lang === "ar" ? "الاسم بالإنجليزي" : "Label (English)"} />
                                        <TextInput 
                                            className="mt-1 block w-full rounded-none h-[38px] text-xs font-mono" 
                                            value={newVar.label_en}
                                            onChange={e => setNewVar({ ...newVar, label_en: e.target.value })}
                                            placeholder="Attached Document No."
                                        />
                                    </div>
                                    <div className="md:col-span-4 flex justify-end">
                                        <PrimaryButton type="button" onClick={handleAddVar} className="rounded-none">
                                            <Plus className="h-4 w-4 me-2" />
                                            {lang === "ar" ? "إضافة متغير جديد" : "Add Smart Variable"}
                                        </PrimaryButton>
                                    </div>
                                </div>

                                {/* Variables Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {data.smartVariables.map(variable => (
                                        <div key={variable.code} className="flex justify-between items-center p-3 text-xs border border-border bg-surface hover:bg-surface-muted/20 transition-all rounded-none">
                                            <div className="space-y-1">
                                                <span className="font-mono bg-primary/5 text-primary px-2 py-0.5 border border-primary/10 font-bold block w-fit rounded-none">{variable.code}</span>
                                                <p className="font-bold text-text">{variable.label_ar}</p>
                                                <p className="text-[10px] text-text-muted font-mono" dir="ltr">{variable.label_en}</p>
                                            </div>
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveVar(variable.code)}
                                                className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. ITEMS TABLE LAYOUT (Table columns configuration) */}
                        {activeSection === "table" && (
                            <div className="space-y-6">
                                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-none mb-4">
                                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-primary">{lang === "ar" ? "تعديل هيكل جدول المواد والأصناف الافتراضي" : "Storage Items Table Architecture"}</p>
                                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                                            {lang === "ar" 
                                                ? "هنا يمكن تهيئة أسماء أعمدة الجدول والظهور الافتراضي لها. يمكن للمستأجرين لاحقاً اختيار حقول الجدول المطلوب ظهورها في عقودهم الخاصة."
                                                : "Configure column names and default visibility. Tenants can customize which columns appear in their output files."}
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-border rounded-none overflow-hidden bg-surface divide-y divide-border text-xs">
                                    <div className="grid grid-cols-12 gap-4 p-3 bg-zinc-50 font-bold text-black border-b border-border">
                                        <div className="col-span-3">{lang === "ar" ? "رمز الحقل (Code)" : "Field Code"}</div>
                                        <div className="col-span-4">{lang === "ar" ? "اسم العمود (عربي)" : "Column Title (Arabic)"}</div>
                                        <div className="col-span-4">{lang === "ar" ? "اسم العمود (إنجليزي)" : "Column Title (English)"}</div>
                                        <div className="col-span-1 text-center">{lang === "ar" ? "مرئي افتراضياً" : "Visible"}</div>
                                    </div>
                                    {data.tableColumns.map((col, index) => (
                                        <div key={col.code} className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-surface-muted/30">
                                            <div className="col-span-3 font-mono font-bold text-text">{col.code}</div>
                                            <div className="col-span-4">
                                                <TextInput 
                                                    className="w-full text-xs rounded-none h-[34px] px-2"
                                                    value={col.label_ar}
                                                    onChange={e => handleColumnLabelChange(index, "label_ar", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-4">
                                                <TextInput 
                                                    className="w-full text-xs font-mono rounded-none h-[34px] px-2"
                                                    value={col.label_en}
                                                    onChange={e => handleColumnLabelChange(index, "label_en", e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <input 
                                                    type="checkbox"
                                                    checked={col.default_visible}
                                                    onChange={() => handleToggleColumnDefault(index)}
                                                    className="rounded-none border-border text-primary focus:ring-primary h-4.5 w-4.5 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
