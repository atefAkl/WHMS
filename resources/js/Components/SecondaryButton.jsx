export default function SecondaryButton({
    type = "button",
    className = "",
    disabled,
    children,
    tooltip,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center rounded-md border border-border bg-surface px-4 py-[3px] text-xs font-semibold uppercase tracking-widest text-text shadow-sm transition duration-150 ease-in-out hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-25 relative group ${
                    disabled && "opacity-25"
                } ` + className
            }
            disabled={disabled}
        >
            {children}
            {tooltip && (
                <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-slate-900/95 text-white text-[10px] font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-[9999] shadow-md">
                    {tooltip}
                </span>
            )}
        </button>
    );
}
