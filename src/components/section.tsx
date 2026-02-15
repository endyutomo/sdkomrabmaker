import React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
    children: React.ReactNode;
}

export function Section({ children, className, ...props }: SectionProps) {
    return (
        <section className={cn("py-8 md:py-12 lg:py-16", className)} {...props}>
            <div className="container px-4 md:px-6">
                {children}
            </div>
        </section>
    );
}
