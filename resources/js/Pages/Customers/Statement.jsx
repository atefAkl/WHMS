import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link } from "@inertiajs/react";
import { useLang } from "@/Contexts/LanguageContext";
import PageHeader from "@/Components/PageHeader";
import { Printer, ArrowRight, ArrowLeft } from "lucide-react";

export default function Statement({ auth, customer, transactions, total_balance }) {
    const { lang } = useLang();
    const t = (key, replacements = {}) => __(key, replacements);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
            style: "currency",
            currency: "SAR",
        }).format(amount);
    };

    const handlePrint = () => {
        window.print();
    };

    const ArrowIcon = lang === "ar" ? ArrowRight : ArrowLeft;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center print:hidden">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route("customers.index")}
                            className="p-2 rounded-full hover:bg-surface-muted text-text-muted transition-colors"
                        >
                            <ArrowIcon className="w-5 h-5" />
                        </Link>
                        <PageHeader
                            title={lang === 'ar' ? 'كشف حساب عميل' : 'Customer Statement'}
                            subtitle={`${lang === 'ar' ? 'العميل:' : 'Customer:'} ${lang === 'ar' ? customer.name_ar : customer.name_en}`}
                        />
                    </div>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md shadow-sm text-text bg-surface hover:bg-surface-muted"
                    >
                        <Printer className="w-4 h-4 mr-2 ml-2" />
                        {lang === "ar" ? "طباعة كشف الحساب" : "Print Statement"}
                    </button>
                </div>
            }
        >
            <Head title={`${lang === 'ar' ? 'كشف حساب' : 'Statement'} - ${customer.name_en}`} />

            <div className="py-6 print:py-0">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Print Header */}
                    <div className="hidden print:block text-center mb-8">
                        <h1 className="text-2xl font-bold text-text mb-2">
                            {lang === 'ar' ? 'كشف حساب عميل' : 'Customer Statement'}
                        </h1>
                        <h2 className="text-lg text-text-muted mb-4">
                            {lang === 'ar' ? customer.name_ar : customer.name_en}
                        </h2>
                        <div className="flex justify-between text-sm text-text-muted border-b border-border pb-4">
                            <div>
                                <span className="font-bold">{lang === 'ar' ? 'تاريخ الطباعة:' : 'Print Date:'}</span> {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                            </div>
                            <div>
                                <span className="font-bold">{lang === 'ar' ? 'الرصيد الإجمالي:' : 'Total Balance:'}</span> <span dir="ltr">{formatCurrency(total_balance)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-surface overflow-hidden shadow-sm sm:rounded-lg mb-6 border border-border print:hidden">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <div className="text-sm font-medium text-text-muted">
                                        {lang === 'ar' ? 'إجمالي المدين' : 'Total Debit'}
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-error" dir="ltr">
                                        {formatCurrency(transactions.reduce((sum, tx) => sum + parseFloat(tx.debit), 0))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-text-muted">
                                        {lang === 'ar' ? 'إجمالي الدائن' : 'Total Credit'}
                                    </div>
                                    <div className="mt-1 text-2xl font-semibold text-success" dir="ltr">
                                        {formatCurrency(transactions.reduce((sum, tx) => sum + parseFloat(tx.credit), 0))}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-text-muted">
                                        {lang === 'ar' ? 'الرصيد النهائي' : 'Final Balance'}
                                    </div>
                                    <div className={`mt-1 text-2xl font-semibold ${total_balance > 0 ? 'text-error' : total_balance < 0 ? 'text-success' : 'text-text'}`} dir="ltr">
                                        {formatCurrency(Math.abs(total_balance))}
                                        <span className="text-sm ml-2">
                                            {total_balance > 0 
                                                ? (lang === 'ar' ? 'مدين (عليه)' : 'Debit') 
                                                : total_balance < 0 
                                                    ? (lang === 'ar' ? 'دائن (له)' : 'Credit') 
                                                    : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-surface overflow-hidden shadow-sm sm:rounded-lg border border-border">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-surface-muted">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'التاريخ' : 'Date'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'نوع الحركة' : 'Type'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'المرجع' : 'Reference'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'البيان' : 'Description'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'مدين' : 'Debit'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'دائن' : 'Credit'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-text-muted uppercase tracking-wider">
                                            {lang === 'ar' ? 'الرصيد' : 'Balance'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-border">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-8 text-center text-text-muted">
                                                {lang === 'ar' ? 'لا توجد حركات مالية مسجلة لهذا العميل' : 'No financial transactions recorded for this customer.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((tx, index) => (
                                            <tr key={`${tx.type}-${tx.id}-${index}`} className="hover:bg-surface-muted transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                                    {tx.date}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        tx.type === 'invoice' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
                                                    }`}>
                                                        {lang === 'ar' ? tx.type_ar : tx.type_en}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-text font-medium" dir="ltr">
                                                    {tx.reference}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-text max-w-xs truncate">
                                                    {tx.description}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-error font-medium" dir="ltr">
                                                    {parseFloat(tx.debit) > 0 ? formatCurrency(tx.debit) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-success font-medium" dir="ltr">
                                                    {parseFloat(tx.credit) > 0 ? formatCurrency(tx.credit) : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-text" dir="ltr">
                                                    {formatCurrency(Math.abs(tx.balance))}
                                                    <span className="text-xs font-normal text-text-muted ml-1">
                                                        {tx.balance > 0 ? 'Dr' : tx.balance < 0 ? 'Cr' : ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { size: A4; margin: 2cm; }
                    body * { visibility: hidden; }
                    .print\\:block, .print\\:block * { visibility: visible; }
                    .bg-surface, .bg-surface * { visibility: visible; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: start; }
                    .max-w-7xl { width: 100%; max-w: none; margin: 0; padding: 0; position: absolute; left: 0; top: 0; }
                }
            `}} />
        </AuthenticatedLayout>
    );
}
