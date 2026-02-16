"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun, Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const COLOR_THEMES = [
    { id: "default", name: "Classic Blue", color: "bg-[#2E3192]" },
    { id: "ocean", name: "Ocean Breeze", color: "bg-[#0EA5E9]" },
    { id: "rose", name: "Rose Garden", color: "bg-[#E11D48]" },
    { id: "emerald", name: "Emerald Forest", color: "bg-[#10B981]" },
    { id: "amber", name: "Amber Sunset", color: "bg-[#F59E0B]" },
];

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [colorTheme, setColorTheme] = useState("default");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedColor = localStorage.getItem("sdkom-color-theme") || "default";
        setColorTheme(savedColor);
        document.documentElement.setAttribute("data-theme", savedColor);
    }, []);

    const handleColorChange = (id: string) => {
        setColorTheme(id);
        localStorage.setItem("sdkom-color-theme", id);
        document.documentElement.setAttribute("data-theme", id);
    };

    if (!mounted) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Palette className="h-5 w-5" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-2xl border-slate-200 dark:border-slate-800">
                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Mode Tampilan</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-1 p-1">
                    <Button
                        variant={theme === 'light' ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => setTheme('light')}
                    >
                        <Sun className="h-3.5 w-3.5" /> Terang
                    </Button>
                    <Button
                        variant={theme === 'dark' ? 'default' : 'ghost'}
                        size="sm"
                        className="text-xs h-8 gap-1.5"
                        onClick={() => setTheme('dark')}
                    >
                        <Moon className="h-3.5 w-3.5" /> Gelap
                    </Button>
                </div>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">Tema Warna</DropdownMenuLabel>
                <div className="grid grid-cols-1 gap-1">
                    {COLOR_THEMES.map((t) => (
                        <DropdownMenuItem
                            key={t.id}
                            className={cn(
                                "flex items-center justify-between gap-2 px-2 py-2 cursor-pointer rounded-lg transition-all",
                                colorTheme === t.id ? "bg-primary/5 text-primary font-bold" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                            )}
                            onClick={() => handleColorChange(t.id)}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={cn("h-4 w-4 rounded-full shadow-inner", t.color)} />
                                <span className="text-sm">{t.name}</span>
                            </div>
                            {colorTheme === t.id && <Check className="h-4 w-4" />}
                        </DropdownMenuItem>
                    ))}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
