import Sidebar from '@/Components/Sidebar';
import Topbar from '@/Components/Topbar';

export default function AuthenticatedLayout({ header, children }) {
    return (
        <div className="flex h-screen bg-background text-text">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <Topbar header={header} />

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto px-6 pt-2 pb-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
