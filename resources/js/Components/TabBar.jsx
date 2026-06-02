/**
 * TabBar — Shared horizontal tab navigation component.
 *
 * Designed to be used as a card header. Place it at the top of a card
 * container and render the page title, actions, and tab content in the
 * card body below it.
 *
 * Usage:
 *   <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
 *
 * Props:
 *   tabs      — Array of { id, label, icon? (Lucide component) }
 *   activeTab — The currently active tab ID
 *   onChange  — Callback when a tab is clicked: (tabId) => void
 *   className — Optional extra className for the outer container
 */
export default function TabBar({
    tabs = [],
    activeTab,
    onChange,
    className = "",
}) {
    return (
        <div
            className={`bg-surface-muted/30 border-b border-border flex overflow-x-auto scrollbar-none gap-1 ${className}`}
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`flex items-center gap-2 px-4 text-sm font-bold transition-all duration-300 whitespace-nowrap shrink-0 rounded-t-lg ${
                            isActive
                                ? "bg-primary text-white shadow-sm pt-2 pb-4"
                                : "text-text-muted hover:bg-primary/10 hover:text-primary pt-3 pb-3 hover:pt-2 hover:pb-4"
                        }`}
                    >
                        {tab.icon && <tab.icon className="h-4 w-4" />}
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
