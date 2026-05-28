import React from "react";

export default function PageHeader({
    icon: Icon,
    title,
    description,
    actions,
    className = "",
}) {
    return (
        <div
            className={`rounded-xl border border-border bg-surface shadow-sm p-2.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2 transition-shadow hover:shadow-md ${className}`}
        >
            <div className="flex items-center gap-2">
                {Icon && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary shadow-inner shrink-0 hover:bg-primary/20 hover:scale-105 transition-all cursor-pointer">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {typeof title === "string" ? (
                            <h1 className="text-lg font-extrabold text-text leading-tight">
                                {title}
                            </h1>
                        ) : (
                            title
                        )}
                    </div>
                    {description && <div className="mt-1">{description}</div>}
                </div>
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-border">
                    {actions}
                </div>
            )}
        </div>
    );
}
