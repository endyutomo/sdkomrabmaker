"use client";

import React, { useState } from "react";
import { MessageSquare, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatSidebar } from "./ai-chat-sidebar";
import { cn } from "@/lib/utils";

export function FloatingChatButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Tooltip hint */}
                {!isOpen && (
                    <div className="bg-white px-4 py-2 rounded-xl shadow-xl border text-sm font-bold text-primary flex items-center gap-2 animate-bounce cursor-pointer group hover:bg-slate-50" onClick={() => setIsOpen(true)}>
                        <Sparkles className="h-4 w-4 text-accent" />
                        Tanya SDKOM
                    </div>
                )}

                <Button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "h-14 w-14 rounded-2xl shadow-2xl items-center justify-center transition-all duration-300",
                        isOpen
                            ? "bg-slate-200 text-slate-700 hover:bg-slate-300 rotate-90"
                            : "boq-accent-gradient text-white hover:scale-110 active:scale-95 shadow-primary/20"
                    )}
                >
                    {isOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <MessageSquare className="h-6 w-6 fill-current" />
                    )}
                </Button>
            </div>

            <AIChatSidebar open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
}
