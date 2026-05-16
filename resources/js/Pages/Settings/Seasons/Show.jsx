import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useLang } from '@/Contexts/LanguageContext';
import { 
    Calendar, Home, ChevronRight, FileText, LayoutList, Clock, 
    Save, X, GripVertical, Check, Variable, Search, Info, Plus 
} from 'lucide-react';
import PrimaryButton from '@/Components/PrimaryButton';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import TextInput from '@/Components/TextInput';
import Tooltip from '@/Components/Tooltip';

export default function Show({ season, allTerms }) {
    const { lang } = useLang();
    const [activeTab, setActiveTab] = useState('parts'); // parts, terms, periods
    const [termSearch, setTermSearch] = useState('');
    const [seasonTerms, setSeasonTerms] = useState(season.terms || []);
    
    // Drag and drop refs
    const dragIndex = useRef(null);
    const [dragOver, setDragOver] = useState(null);

    const { data, setData, put, processing, errors } = useForm({
        name_ar: season.name_ar || '',
        name_en: season.name_en || '',
        start_date: season.start_date || '',
        end_date: season.end_date || '',
        is_active: !!season.is_active,
        introduction: season.introduction || '',
        preamble: season.preamble || '',
        mandatory_period: season.mandatory_period || 12,
        renewal_period: season.renewal_period || 12,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('settings.seasons.update', season.id));
    };

    // ── Term Sync Logic ──────────────────────────────────────────
    const toggleTerm = async (term) => {
        const isAssigned = seasonTerms.some(t => t.id === term.id);
        let newList;
        if (isAssigned) {
            newList = seasonTerms.filter(t => t.id !== term.id);
        } else {
            newList = [...seasonTerms, term];
        }
        setSeasonTerms(newList);
        await axios.post(route('seasons.terms.sync', season.id), { term_ids: newList.map(t => t.id) });
    };

    const onDragStart = (index) => { dragIndex.current = index; };
    const onDragEnter = (index) => { setDragOver(index); };
    const onDragEnd = async () => {
        if (dragIndex.current === null || dragOver === null || dragIndex.current === dragOver) {
            dragIndex.current = null; setDragOver(null); return;
        }
        const reordered = [...seasonTerms];
        const [moved] = reordered.splice(dragIndex.current, 1);
        reordered.splice(dragOver, 0, moved);
        setSeasonTerms(reordered);
        dragIndex.current = null; setDragOver(null);
        await axios.post(route('seasons.terms.reorder', season.id), { ordered_ids: reordered.map(t => t.id) });
    };

    const breadcrumbs = (
        <div className="flex items-center gap-2 text-sm text-text-muted">
            <Home className="h-4 w-4" />
            <ChevronRight className={lang === 'ar' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('settings.index'))}>
                {lang === 'ar' ? 'الإعدادات' : 'Settings'}
            </span>
            <ChevronRight className={lang === 'ar' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => router.get(route('settings.seasons.index'))}>
                {lang === 'ar' ? 'المواسم' : 'Seasons'}
            </span>
            <ChevronRight className={lang === 'ar' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
            <span className="text-primary font-medium">{season.name_ar}</span>
        </div>
    );

    const tabs = [
        { id: 'parts', label: lang === 'ar' ? 'أجزاء العقد' : 'Contract Parts', icon: FileText },
        { id: 'terms', label: lang === 'ar' ? 'شروط الموسم' : 'Season Terms', icon: LayoutList },
        { id: 'periods', label: lang === 'ar' ? 'المدد الزمنية' : 'Periods', icon: Clock },
    ];

    return (
        <AuthenticatedLayout header={breadcrumbs}>
            <Head title={`${lang === 'ar' ? 'إعدادات الموسم' : 'Season Settings'} - ${season.name_ar}`} />

            <div className="mx-auto max-w-5xl space-y-4">
                
                {/* 1. Header Info */}
                <div className="bg-surface border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text">{season.name_ar}</h1>
                            <p className="text-xs text-text-muted">
                                {season.start_date} → {season.end_date}
                                <span className={`ms-2 px-1.5 py-0.5 rounded-full text-[10px] ${season.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-gray-500/10 text-gray-500'}`}>
                                    {season.is_active ? (lang === 'ar' ? 'نشط حالياً' : 'Currently Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                                </span>
                            </p>
                        </div>
                    </div>
                    <PrimaryButton onClick={submit} disabled={processing}>
                        <Save className="h-4 w-4 me-2" />
                        {lang === 'ar' ? 'حفظ كافة التعديلات' : 'Save All Changes'}
                    </PrimaryButton>
                </div>

                {/* 2. Tabs Navigation */}
                <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                    <div className="flex border-b border-border bg-surface-muted/30">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                                    activeTab === tab.id 
                                        ? 'border-primary text-primary bg-surface' 
                                        : 'border-transparent text-text-muted hover:text-text hover:bg-surface-muted/50'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 flex-1">
                        <form onSubmit={submit}>
                            
                            {/* Tab: Contract Parts */}
                            {activeTab === 'parts' && (
                                <div className="space-y-6 max-w-3xl">
                                    <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10 mb-4">
                                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-primary">{lang === 'ar' ? 'مقدمة وتمهيد العقد' : 'Contract Intro & Preamble'}</p>
                                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                                {lang === 'ar' ? 'هذه النصوص ستظهر تلقائياً في بداية كل عقد ينتمي لهذا الموسم.' : 'These texts will appear automatically at the start of every contract in this season.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel value={lang === 'ar' ? 'مقدمة العقد' : 'Contract Introduction'} />
                                            <textarea
                                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[120px]"
                                                value={data.introduction}
                                                onChange={e => setData('introduction', e.target.value)}
                                                placeholder={lang === 'ar' ? 'مثال: الحمد لله والصلاة والسلام على رسول الله...' : 'Ex: In the name of Allah...'}
                                            />
                                            <InputError message={errors.introduction} />
                                        </div>

                                        <div>
                                            <InputLabel value={lang === 'ar' ? 'تمهيد العقد' : 'Contract Preamble'} />
                                            <textarea
                                                className="mt-1 block w-full rounded-md border-border bg-surface shadow-sm focus:border-primary focus:ring-primary text-sm min-h-[120px]"
                                                value={data.preamble}
                                                onChange={e => setData('preamble', e.target.value)}
                                                placeholder={lang === 'ar' ? 'مثال: حيث أن الطرف الأول يمتلك مستودعات، والطرف الثاني يرغب في...' : 'Ex: Whereas the first party owns warehouses...'}
                                            />
                                            <InputError message={errors.preamble} />
                                        </div>
                                    </div>

                                    {/* Smart Variables Guide */}
                                    <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl max-w-xl">
                                        <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-xs uppercase tracking-wider">
                                            <Variable className="h-4 w-4 text-amber-600" />
                                            {lang === 'ar' ? 'دليل المتغيرات الذكية' : 'Smart Variables Guide'}
                                        </div>
                                        <p className="text-[11px] text-amber-700/80 mb-3 leading-relaxed">
                                            {lang === 'ar' ? 'يمكنك استخدام هذه المتغيرات في نصوص العقد ليتم استبدالها آلياً ببيانات العقد الحقيقية عند الطباعة:' : 'Use these variables in contract texts to automatically replace them with real contract data when printing:'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                            {[
                                                { label: lang === 'ar' ? 'اسم العميل' : 'Customer Name', code: '{$customer_name}' },
                                                { label: lang === 'ar' ? 'هاتف العميل' : 'Customer Phone', code: '{$customer_phone}' },
                                                { label: lang === 'ar' ? 'اسم المندوب' : 'Contact Name', code: '{$contact_name}' },
                                                { label: lang === 'ar' ? 'رقم العقد' : 'Contract No.', code: '{$contract_number}' },
                                                { label: lang === 'ar' ? 'تاريخ البداية' : 'Start Date', code: '{$start_date}' },
                                                { label: lang === 'ar' ? 'الفترة الإلزامية' : 'Mandatory Per.', code: '{$mandatory_period}' },
                                                { label: lang === 'ar' ? 'فترة التجديد' : 'Renewal Per.', code: '{$renew_period}' },
                                            ].map(v => (
                                                <div key={v.code} className="flex items-center justify-between group border-b border-amber-500/10 pb-1">
                                                    <span className="text-[10px] text-amber-700">{v.label}</span>
                                                    <code className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded text-amber-600 font-mono">
                                                        {v.code}
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Season Terms */}
                            {activeTab === 'terms' && (
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Left: Library */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{lang === 'ar' ? 'مكتبة الشروط العامة' : 'Global Terms Library'}</h3>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder={lang === 'ar' ? 'بحث...' : 'Search...'} 
                                                    className="ps-8 pe-2 py-1 border border-border rounded-md text-[11px] focus:ring-0 focus:border-primary w-40"
                                                    value={termSearch}
                                                    onChange={e => setTermSearch(e.target.value)}
                                                />
                                                <Search className="absolute start-2 top-1.5 h-3.5 w-3.5 text-text-muted" />
                                            </div>
                                        </div>
                                        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border max-h-[400px] overflow-y-auto bg-surface-muted/10">
                                            {allTerms.filter(t => t.text_ar.includes(termSearch)).map(term => {
                                                const isIn = seasonTerms.some(t => t.id === term.id);
                                                return (
                                                    <div key={term.id} onClick={() => toggleTerm(term)} className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isIn ? 'bg-primary/5' : 'hover:bg-surface-muted/40'}`}>
                                                        <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isIn ? 'bg-primary border-primary' : 'border-border'}`}>
                                                            {isIn && <Check className="h-2.5 w-2.5 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] text-text leading-relaxed line-clamp-2">{term.text_ar}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right: Active/Reorder */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">{lang === 'ar' ? `شروط هذا الموسم (${seasonTerms.length})` : `Season Terms (${seasonTerms.length})`}</h3>
                                        </div>
                                        {seasonTerms.length === 0 ? (
                                            <div className="border border-dashed border-border rounded-xl p-8 text-center flex flex-col items-center justify-center bg-surface-muted/10 flex-1">
                                                <LayoutList className="h-8 w-8 text-text-muted mb-2 opacity-30" />
                                                <p className="text-[11px] text-text-muted italic">{lang === 'ar' ? 'اختر شروطاً من المكتبة لتفعيلها لهذا الموسم' : 'Select terms from library to enable for this season'}</p>
                                            </div>
                                        ) : (
                                            <div className="border border-border rounded-xl divide-y divide-border max-h-[400px] overflow-y-auto bg-surface shadow-sm">
                                                {seasonTerms.map((term, index) => (
                                                    <div
                                                        key={term.id}
                                                        draggable
                                                        onDragStart={() => onDragStart(index)}
                                                        onDragEnter={() => onDragEnter(index)}
                                                        onDragEnd={onDragEnd}
                                                        onDragOver={e => e.preventDefault()}
                                                        className={`flex items-start gap-3 px-3 py-2.5 select-none transition-colors ${dragOver === index ? 'bg-primary/5 border-s-2 border-primary' : 'hover:bg-surface-muted/30'}`}
                                                    >
                                                        <div className="cursor-grab active:cursor-grabbing text-text-muted mt-0.5 shrink-0">
                                                            <GripVertical className="h-4 w-4" />
                                                        </div>
                                                        <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">{index + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[12px] text-text leading-relaxed">{term.text_ar}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="mt-2 text-[10px] text-text-muted italic text-center">{lang === 'ar' ? '* اسحب الشروط لترتيبها حسب الأولوية في العقد' : '* Drag terms to reorder priority in contract'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Tab: Periods */}
                            {activeTab === 'periods' && (
                                <div className="space-y-6 max-w-xl">
                                    <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 mb-4">
                                        <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-600">{lang === 'ar' ? 'ضبط الفترات الزمنية الافتراضية' : 'Default Period Settings'}</p>
                                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                                {lang === 'ar' ? 'هذه القيم ستُستخدم كقيم افتراضية للمتغيرات {$mandatory_period} و {$renew_period} عند إنشاء عقود جديدة.' : 'These values will be defaults for {$mandatory_period} and {$renew_period} in new contracts.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <InputLabel value={lang === 'ar' ? 'المدة الإلزامية (بالأشهر)' : 'Mandatory Period (Months)'} />
                                            <div className="mt-1 flex items-center gap-3">
                                                <TextInput 
                                                    type="number" 
                                                    className="w-full" 
                                                    value={data.mandatory_period} 
                                                    onChange={e => setData('mandatory_period', e.target.value)} 
                                                />
                                                <span className="text-sm text-text-muted shrink-0">{lang === 'ar' ? 'شهر' : 'Months'}</span>
                                            </div>
                                            <InputError message={errors.mandatory_period} />
                                        </div>

                                        <div>
                                            <InputLabel value={lang === 'ar' ? 'فترة التجديد التلقائي (بالأشهر)' : 'Renewal Period (Months)'} />
                                            <div className="mt-1 flex items-center gap-3">
                                                <TextInput 
                                                    type="number" 
                                                    className="w-full" 
                                                    value={data.renewal_period} 
                                                    onChange={e => setData('renewal_period', e.target.value)} 
                                                />
                                                <span className="text-sm text-text-muted shrink-0">{lang === 'ar' ? 'شهر' : 'Months'}</span>
                                            </div>
                                            <InputError message={errors.renewal_period} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>
                </div>

            </div>
        </AuthenticatedLayout>
    );
}
