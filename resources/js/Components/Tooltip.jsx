/**
 * Tooltip component — Portal-based, RTL-aware, overflow-safe.
 *
 * Renders the tooltip bubble via a React portal into document.body so it
 * always escapes overflow:hidden / clipping parent containers.
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
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ text, placement = "top", children }) {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const GAP = 6; // px gap between trigger and bubble

    const calcPosition = useCallback(
        (rect) => {
            const scrollX = window.scrollX;
            const scrollY = window.scrollY;

            switch (placement) {
                case "bottom":
                    return {
                        top: rect.bottom + scrollY + GAP,
                        left: rect.left + scrollX + rect.width / 2,
                        transform: "translateX(-50%)",
                    };
                case "left":
                    return {
                        top: rect.top + scrollY + rect.height / 2,
                        left: rect.left + scrollX - GAP,
                        transform: "translate(-100%, -50%)",
                    };
                case "right":
                    return {
                        top: rect.top + scrollY + rect.height / 2,
                        left: rect.right + scrollX + GAP,
                        transform: "translateY(-50%)",
                    };
                case "top":
                default:
                    return {
                        top: rect.top + scrollY - GAP,
                        left: rect.left + scrollX + rect.width / 2,
                        transform: "translate(-50%, -100%)",
                    };
            }
        },
        [placement],
    );

    const show = useCallback(() => {
        if (!triggerRef.current) return;
        if (document.documentElement.classList.contains("show-button-text")) {
            return;
        }
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords(calcPosition(rect));
        setVisible(true);
    }, [calcPosition]);

    const hide = useCallback(() => setVisible(false), []);

    if (!text) return children;

    const bubble = visible
        ? createPortal(
              <span
                  style={{
                      position: "fixed",
                      top: coords.top,
                      left: coords.left,
                      transform: coords.transform,
                      zIndex: 9999,
                      pointerEvents: "none",
                  }}
                  className="whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg dark:bg-gray-700 animate-fade-in"
              >
                  {text}
              </span>,
              document.body,
          )
        : null;

    return (
        <>
            <div
                ref={triggerRef}
                className="inline-flex"
                onMouseEnter={show}
                onMouseLeave={hide}
                onFocus={show}
                onBlur={hide}
            >
                {children}
            </div>
            {bubble}
        </>
    );
}
