import Sidebar from '@/Components/Sidebar';
import Topbar from '@/Components/Topbar';
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function AuthenticatedLayout({ header, children }) {
    const { auth } = usePage().props;
    const showButtonText = auth?.user?.preferences?.show_button_text ?? false;

    useEffect(() => {
        const root = document.documentElement;
        if (showButtonText) {
            root.classList.add('show-button-text');
        } else {
            root.classList.remove('show-button-text');
        }
    }, [showButtonText]);

    return (
        <div className="flex h-screen print:h-auto bg-background text-text print:bg-white print:text-black">
            {/* Sidebar */}
            <div className="print:hidden shrink-0">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
                {/* Topbar */}
                <div className="print:hidden">
                    <Topbar header={header} />
                </div>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto px-6 pt-2 pb-2 print:p-0 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
}
