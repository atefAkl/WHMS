import React from 'react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, Link } from '@inertiajs/react'

export default function TenantNotFound({ domain }) {
    return (
        <AuthenticatedLayout>
            <Head title="Tenant Not Found" />
            <div className="max-w-3xl mx-auto p-12 text-center">
                <h1 className="text-2xl font-bold mb-4">المستأجر غير موجود</h1>
                <p className="text-text-muted mb-6">
                    نعتذر، لم نتمكن من العثور على مستأجر مرتبط بالنطاق
                    {domain ? <span> <strong>{domain}</strong></span> : null}.
                </p>
                <p className="text-sm text-text-muted mb-6">
                    قد يكون النطاق غير مسجَّل بعد أو تم حذفه. يمكنك العودة إلى لوحة التحكم المركزية أو التواصل مع الدعم.
                </p>

                <div className="flex gap-3 justify-center">
                    <Link href={route('saas.tenants.index')} className="px-4 py-2 bg-indigo-600 text-white rounded">العودة للقائمة</Link>
                    <a href="/" className="px-4 py-2 bg-white border rounded">الصفحة الرئيسية</a>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}
