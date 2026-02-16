'use client';

import { useState, useEffect } from 'react';
import { AIProvider, getActiveProvider, setActiveProvider, AI_PROVIDERS } from '@/ai/ai-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bot, Check } from 'lucide-react';

export function AIProviderSelector() {
    const [activeProvider, setActive] = useState<AIProvider>(AIProvider.GEMINI);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setActive(getActiveProvider());
    }, []);

    const handleProviderChange = (provider: AIProvider) => {
        setActive(provider);
        setActiveProvider(provider);
        // Reload page to apply changes
        window.location.reload();
    };

    if (!mounted) {
        return null;
    }

    const currentProvider = AI_PROVIDERS[activeProvider];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentProvider.icon} {currentProvider.displayName}</span>
                    <span className="sm:hidden">{currentProvider.icon}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>AI Provider</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(AI_PROVIDERS).map(([key, config]) => {
                    const isActive = activeProvider === key;
                    const isAvailable = config.available;

                    return (
                        <DropdownMenuItem
                            key={key}
                            onClick={() => isAvailable && handleProviderChange(key as AIProvider)}
                            disabled={!isAvailable}
                            className="flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <span>{config.icon}</span>
                                <span>{config.displayName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isAvailable && (
                                    <Badge variant="secondary" className="text-[9px] px-1">
                                        N/A
                                    </Badge>
                                )}
                                {isActive && <Check className="h-4 w-4 text-primary" />}
                            </div>
                        </DropdownMenuItem>
                    );
                })}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
                    Pilih AI engine untuk estimasi harga
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
