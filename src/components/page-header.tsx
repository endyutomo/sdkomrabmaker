import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
}

export function PageHeader({ title, description, className, ...props }: PageHeaderProps) {
    return (
        <div className={cn("space-y-4 pb-8 border-b mb-8", className)} {...props}>
            <h1 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl">
                {title}
            </h1>
            {description && (
                <p className="text-muted-foreground text-lg md:text-xl max-w-[700px]">
                    {description}
                </p>
            )}
        </div>
    );
}
