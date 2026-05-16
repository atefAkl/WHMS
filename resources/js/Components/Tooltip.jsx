/**
 * Tooltip component — CSS-only, RTL-aware, zero dependencies.
 *
 * Usage:
 *   <Tooltip text="تعديل">
 *     <button><Edit /></button>
 *   </Tooltip>
 *
 * Props:
 *   text      — tooltip label (string)
 *   placement — 'top' | 'bottom' | 'left' | 'right'  (default: 'top')
 *   children  — the element that triggers the tooltip
 */
export default function Tooltip({ text, placement = 'top', children }) {
    if (!text) return children;

    const base =
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-md ' +
        'bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg ' +
        'opacity-0 transition-opacity duration-150 group-hover:opacity-100 ' +
        'dark:bg-gray-700';

    const positions = {
        top:    'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
        bottom: 'top-full  left-1/2 -translate-x-1/2 mt-1.5',
        left:   'right-full top-1/2 -translate-y-1/2  me-1.5',
        right:  'left-full  top-1/2 -translate-y-1/2  ms-1.5',
    };

    return (
        <div className="relative inline-flex group">
            {children}
            <span className={`${base} ${positions[placement] ?? positions.top}`}>
                {text}
            </span>
        </div>
    );
}
