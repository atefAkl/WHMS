import { Head, Link, useForm } from "@inertiajs/react";
import {
    Warehouse,
    ShieldCheck,
    Zap,
    Globe,
    LayoutDashboard,
    FileText,
    Calendar,
    ArrowRight,
    CheckCircle2,
    Building2,
    Mail,
    Phone,
    Globe2,
} from "lucide-react";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

function Toast({ message, type = "success", onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 6000);
        return () => clearTimeout(timer);
    }, []);

    const isSuccess = type === "success";
    return (
        <div
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-base font-bold transition-all animate-bounce-once ${
                isSuccess ? "bg-emerald-500" : "bg-rose-500"
            }`}
            style={{ minWidth: 320, maxWidth: 500 }}
            dir="rtl"
        >
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <span className="flex-1">{message}</span>
            <button
                onClick={onClose}
                className="ml-2 opacity-80 hover:opacity-100"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}

export default function Welcome({ auth, flash }) {
    const [toast, setToast] = useState(
        flash?.success
            ? { message: flash.success, type: "success" }
            : flash?.error
              ? { message: flash.error, type: "error" }
              : null,
    );

    const { data, setData, post, processing, errors, reset } = useForm({
        company_name: "",
        email: "",
        phone: "",
        requested_subdomain: "",
        plan: "starter",
    });

    const submit = (e) => {
        e.preventDefault();
        post("/register-warehouse", {
            onSuccess: () => reset(),
        });
    };

    return (
        <div
            className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900"
            dir="rtl"
        >
            <Head title="مرحباً بك في نظام إدارة المستودعات المتطور" />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

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
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route("dashboard")}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md"
                                >
                                    لوحة التحكم
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route("login")}
                                        className="text-slate-600 font-medium hover:text-indigo-600 transition-colors"
                                    >
                                        تسجيل الدخول
                                    </Link>
                                    <a
                                        href="#register"
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md"
                                    >
                                        ابدأ الآن
                                    </a>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative py-20 overflow-hidden bg-white">
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8 text-center lg:text-right">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold animate-fade-in">
                                <Zap className="w-4 h-4 fill-current" />
                                <span>
                                    الجيل الجديد من إدارة المستودعات اللوجستية
                                </span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight">
                                أدر مستودعك <br />
                                <span className="text-indigo-600">
                                    بذكاء واحترافية
                                </span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                                نظام سحابي متكامل لإدارة العقود، تتبع المخزون،
                                وأتمتة العمليات اللوجستية. مصمم خصيصاً
                                للمستودعات الكبرى وشركات التبريد.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <a
                                    href="#register"
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200"
                                >
                                    انضم إلينا الآن
                                    <ArrowRight className="w-5 h-5 rotate-180" />
                                </a>
                                <a
                                    href="#features"
                                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-indigo-600 border-2 border-indigo-100 rounded-2xl font-bold text-lg hover:border-indigo-600 transition-all"
                                >
                                    استكشف المميزات
                                </a>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl opacity-10 blur-2xl"></div>
                            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden group">
                                <img
                                    src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1200"
                                    alt="Warehouse Management System Dashboard"
                                    className="w-full h-auto"
                                />
                                <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-transparent transition-all duration-500"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-20">
                        <h2 className="text-4xl font-extrabold text-slate-900">
                            لماذا تختار منصة WHM Cloud؟
                        </h2>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                            نقدم لك كل الأدوات التي تحتاجها لإدارة مستودعك من
                            مكان واحد بكل سهولة وأمان.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                title: "إدارة عقود ذكية",
                                desc: "أنشئ عقودك بمتغيرات ديناميكية وشروط مرنة تتناسب مع كل عميل.",
                                icon: FileText,
                                color: "bg-blue-500",
                            },
                            {
                                title: "تتبع المواسم",
                                desc: "خصص إعداداتك بناءً على المواسم الإنتاجية والمدد الإلزامية.",
                                icon: Calendar,
                                color: "bg-emerald-500",
                            },
                            {
                                title: "نظام SaaS متكامل",
                                desc: "احصل على نطاق خاص بك (Domain) وقاعدة بيانات مستقلة لبياناتك.",
                                icon: Globe,
                                color: "bg-indigo-500",
                            },
                            {
                                title: "أمان عالي الجودة",
                                desc: "تشفير كامل للبيانات مع نسخ احتياطي دوري لضمان سلامة معلوماتك.",
                                icon: ShieldCheck,
                                color: "bg-rose-500",
                            },
                            {
                                title: "واجهات مستخدم عصرية",
                                desc: "تجربة مستخدم سهلة وسريعة تعمل على كافة الأجهزة والمتصفحات.",
                                icon: LayoutDashboard,
                                color: "bg-amber-500",
                            },
                            {
                                title: "دعم فني متواصل",
                                desc: "فريق مختص لمساعدتك في ضبط النظام والرد على استفساراتك.",
                                icon: CheckCircle2,
                                color: "bg-violet-500",
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="p-8 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-2 transition-all group"
                            >
                                <div
                                    className={`w-14 h-14 ${feature.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-all`}
                                >
                                    <feature.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Registration Form Section */}
            <section
                id="register"
                className="py-24 relative overflow-hidden bg-white"
            >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-600 skew-x-12 translate-x-1/2 -z-10 hidden lg:block"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="lg:text-white space-y-8">
                            <h2 className="text-4xl font-black leading-tight lg:text-white text-slate-900">
                                هل أنت مستعد للتحول الرقمي؟ <br />
                                <span className="text-indigo-600 lg:text-indigo-200">
                                    سجل مستودعك الآن
                                </span>
                            </h2>
                            <ul className="space-y-4">
                                {[
                                    "تجربة مجانية لمدة 14 يوم",
                                    "لا حاجة لبطاقة ائتمان",
                                    "دعم فني لعملية التهيئة",
                                    "تفعيل الحساب خلال أقل من 24 ساعة",
                                ].map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-3 font-semibold"
                                    >
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
                            <form onSubmit={submit} className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-slate-900">
                                        طلب تسجيل مستخدم جديد
                                    </h3>
                                    <p className="text-slate-500">
                                        املأ البيانات التالية وسيتواصل معك
                                        فريقنا
                                    </p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <InputLabel value="اسم المنشأة/الشركة" />
                                        <div className="relative">
                                            <Building2 className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <TextInput
                                                className="w-full pr-10"
                                                value={data.company_name}
                                                onChange={(e) =>
                                                    setData(
                                                        "company_name",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="شركة مخازن المتحد"
                                            />
                                        </div>
                                        <InputError
                                            message={errors.company_name}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <InputLabel value="النطاق المطلوب (Subdomain)" />
                                        <div className="relative">
                                            <Globe2 className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <TextInput
                                                className="w-full pr-10"
                                                value={data.requested_subdomain}
                                                onChange={(e) =>
                                                    setData(
                                                        "requested_subdomain",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="almutahida"
                                            />
                                            <span className="absolute left-3 top-3 text-sm text-slate-400 font-mono">
                                                .whms.test
                                            </span>
                                        </div>
                                        <InputError
                                            message={errors.requested_subdomain}
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <InputLabel value="البريد الإلكتروني" />
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <TextInput
                                                type="email"
                                                className="w-full pr-10"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="admin@example.com"
                                            />
                                        </div>
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1">
                                        <InputLabel value="رقم الجوال" />
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <TextInput
                                                className="w-full pr-10 text-left"
                                                value={data.phone}
                                                onChange={(e) =>
                                                    setData(
                                                        "phone",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="05xxxxxxx"
                                                dir="ltr"
                                            />
                                        </div>
                                        <InputError message={errors.phone} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <InputLabel value="اختر الباقة المناسبة" />
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            "starter",
                                            "business",
                                            "enterprise",
                                        ].map((plan) => (
                                            <label
                                                key={plan}
                                                className={`
                                                relative p-4 border-2 rounded-2xl cursor-pointer text-center transition-all
                                                ${data.plan === plan ? "border-indigo-600 bg-indigo-50" : "border-slate-100 hover:border-indigo-200"}
                                            `}
                                            >
                                                <input
                                                    type="radio"
                                                    name="plan"
                                                    value={plan}
                                                    className="sr-only"
                                                    onChange={(e) =>
                                                        setData(
                                                            "plan",
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                                <span className="block font-bold text-sm uppercase">
                                                    {plan === "starter"
                                                        ? "أساسية"
                                                        : plan === "business"
                                                          ? "أعمال"
                                                          : "احترافية"}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <PrimaryButton
                                    className="w-full justify-center py-4 text-lg rounded-2xl shadow-lg shadow-indigo-100"
                                    disabled={processing}
                                >
                                    إرسال طلب التسجيل
                                </PrimaryButton>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 bg-slate-900 text-slate-400 border-t border-slate-800 text-center">
                <div className="max-w-7xl mx-auto px-4 space-y-4">
                    <p className="font-semibold">
                        &copy; 2026 Warehouse Cloud OS. جميع الحقوق محفوظة.
                    </p>
                    <div className="flex justify-center gap-6 text-sm">
                        <a
                            href="#"
                            className="hover:text-white transition-colors"
                        >
                            سياسة الخصوصية
                        </a>
                        <a
                            href="#"
                            className="hover:text-white transition-colors"
                        >
                            شروط الاستخدام
                        </a>
                        <a
                            href="#"
                            className="hover:text-white transition-colors"
                        >
                            اتصل بنا
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
