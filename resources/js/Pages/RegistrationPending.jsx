import { Head, Link } from "@inertiajs/react";
import { Warehouse, CheckCircle2, Mail, Clock, ArrowRight } from "lucide-react";

export default function RegistrationPending({ email, company_name }) {
    return (
        <div
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900"
            dir="rtl"
        >
            <Head title="تم استلام طلبك - WHM Cloud" />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                                <Warehouse className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                WHM Cloud
                            </span>
                        </div>
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-semibold transition-colors"
                        >
                            <ArrowRight className="w-4 h-4" />
                            العودة للرئيسية
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-16 px-4">
                <div className="max-w-lg w-full">
                    {/* Success Card */}
                    <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200 overflow-hidden">
                        {/* Top Banner */}
                        <div className="bg-gradient-to-l from-emerald-500 to-teal-500 p-8 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-1">
                                تم استلام طلبك بنجاح!
                            </h1>
                            {company_name && (
                                <p className="text-emerald-100 text-sm">
                                    {company_name}
                                </p>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-8 space-y-6">
                            {/* Email Notice */}
                            <div className="flex items-start gap-4 bg-indigo-50 rounded-2xl p-4">
                                <div className="p-2 bg-indigo-100 rounded-xl flex-shrink-0 mt-0.5">
                                    <Mail className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 mb-1">
                                        راجع بريدك الإلكتروني
                                    </p>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        سيصلك رابط التفعيل على{" "}
                                        {email ? (
                                            <span className="font-semibold text-indigo-600">
                                                {email}
                                            </span>
                                        ) : (
                                            "بريدك الإلكتروني"
                                        )}{" "}
                                        بعد مراجعة الطلب والموافقة عليه.
                                    </p>
                                </div>
                            </div>

                            {/* Response Time */}
                            <div className="flex items-start gap-4 bg-amber-50 rounded-2xl p-4">
                                <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0 mt-0.5">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 mb-1">
                                        مدة الاستجابة المتوقعة
                                    </p>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        <span className="font-bold text-amber-600 text-base">
                                            1 - 2 ساعة
                                        </span>{" "}
                                        خلال أوقات الدوام الرسمي.
                                    </p>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
                                <p className="font-bold text-slate-700 text-sm">
                                    ماذا يحدث بعد ذلك؟
                                </p>
                                {[
                                    "سيراجع فريقنا طلبك ويتحقق من البيانات",
                                    "ستتلقى بريدًا إلكترونيًا يحتوي على رابط تفعيل حسابك",
                                    "بعد التفعيل يمكنك الدخول لنظامك فورًا",
                                ].map((step, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 text-sm text-slate-600"
                                    >
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <Link
                                href="/"
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-indigo-100"
                            >
                                <ArrowRight className="w-5 h-5" />
                                العودة للصفحة الرئيسية
                            </Link>
                        </div>
                    </div>

                    <p className="text-center text-slate-500 text-xs mt-6">
                        إذا لم يصلك البريد خلال ساعتين، تواصل معنا مباشرة
                    </p>
                </div>
            </div>
        </div>
    );
}
