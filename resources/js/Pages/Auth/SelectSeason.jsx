import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { useLang } from '@/Contexts/LanguageContext';
import { Calendar, ChevronRight, LogOut, ArrowRight } from 'lucide-react';
import GuestLayout from '@/Layouts/GuestLayout';
import PrimaryButton from '@/Components/PrimaryButton';
import InputError from '@/Components/InputError';

export default function SelectSeason({ seasons }) {
    const { lang } = useLang();
    const { data, setData, post, processing, errors } = useForm({
        season_id: ''
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('season.store'));
    };

    return (
        <GuestLayout>
            <Head title={lang === 'ar' ? 'اختيار الموسم' : 'Select Season'} />

            <div className="text-center mb-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Calendar className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-text mb-1">
                    {lang === 'ar' ? 'أهلاً بك' : 'Welcome'}
                </h2>
                <p className="text-sm text-text-muted">
                    {lang === 'ar' ? 'يرجى اختيار موسم العمل للمتابعة' : 'Please select a working season to continue'}
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-3">
                    {seasons.length === 0 ? (
                        <div className="p-4 rounded-xl border border-warning/30 bg-warning/10 text-center">
                            <p className="text-sm text-warning-dark font-medium mb-1">
                                {lang === 'ar' ? 'لا يوجد مواسم نشطة' : 'No active seasons available'}
                            </p>
                            <p className="text-xs text-warning-dark/80">
                                {lang === 'ar' ? 'يرجى التواصل مع مدير النظام لإضافة موسم جديد' : 'Please contact the system administrator to add a new season'}
                            </p>
                        </div>
                    ) : (
                        seasons.map(season => (
                            <label 
                                key={season.id} 
                                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    data.season_id === season.id.toString() 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-border bg-surface hover:border-primary/40'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="radio" 
                                        name="season_id" 
                                        value={season.id}
                                        checked={data.season_id === season.id.toString()}
                                        onChange={(e) => setData('season_id', e.target.value)}
                                        className="text-primary focus:ring-primary h-4 w-4 border-border"
                                    />
                                    <div>
                                        <p className="font-bold text-text">{lang === 'ar' ? season.name_ar : (season.name_en || season.name_ar)}</p>
                                        <p className="text-[11px] text-text-muted mt-0.5" dir="ltr">
                                            {season.start_date} → {season.end_date}
                                        </p>
                                    </div>
                                </div>
                                {data.season_id === season.id.toString() && (
                                    <ChevronRight className={`h-5 w-5 text-primary ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                )}
                            </label>
                        ))
                    )}
                </div>

                <InputError message={errors.season_id} className="text-center" />

                <div className="flex flex-col gap-3 pt-2">
                    <PrimaryButton 
                        disabled={processing || !data.season_id} 
                        className="w-full justify-center py-3 text-sm font-bold"
                    >
                        {lang === 'ar' ? 'متابعة الدخول' : 'Continue'}
                        <ArrowRight className={`h-4 w-4 ms-2 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    </PrimaryButton>

                    <button
                        type="button"
                        onClick={() => post(route('logout'))}
                        className="text-sm font-medium text-text-muted hover:text-danger flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        {lang === 'ar' ? 'تسجيل الخروج' : 'Log out'}
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
