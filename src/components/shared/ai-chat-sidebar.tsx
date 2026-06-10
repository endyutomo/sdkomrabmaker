"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    X,
    Send,
    User,
    Loader2,
    MessageSquare,
    ChevronRight,
    Sparkles,
    RotateCcw,
    Paperclip,
    File,
    Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { callPuterAI } from "@/ai/puter-ai-adapter";
import { AIProvider, getActiveProvider, AI_PROVIDERS, setActiveProvider } from "@/ai/ai-provider";
import { cn } from "@/lib/utils";
import { uploadFile } from "@/lib/storage";
import { Logo } from "@/components/ui/logo";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

interface Attachment {
    url: string;
    name: string;
    type: string;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    provider?: AIProvider;
    attachments?: Attachment[];
}

interface AIChatSidebarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const CHAT_HISTORY_KEY = "sdkom_chat_history";
const INITIAL_GREETING: Message[] = [
    {
        id: "1",
        role: "assistant",
        content: "Halo! Saya adalah asisten AI Anda. Ada yang bisa saya bantu terkait proyek RAB Anda?",
        timestamp: new Date()
    }
];

export function AIChatSidebar({ open, onOpenChange }: AIChatSidebarProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeProvider, setActiveProviderState] = useState<AIProvider>(AIProvider.GEMINI);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load messages from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                // Convert string dates back to Date objects
                const historicalMessages = parsed.map((msg: any) => ({
                    ...msg,
                    content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(historicalMessages);
            } catch (e) {
                console.error("Failed to parse chat history", e);
                setMessages(INITIAL_GREETING);
            }
        } else {
            setMessages(INITIAL_GREETING);
        }
    }, []);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (open) {
            setActiveProviderState(getActiveProvider());
        }
    }, [open]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleProviderChange = (provider: AIProvider) => {
        setActiveProviderState(provider);
        setActiveProvider(provider);
    };

    const handleClearChat = () => {
        setIsClearDialogOpen(true);
    };

    const confirmClearChat = () => {
        const freshGreeting: Message[] = [
            {
                id: Date.now().toString(),
                role: "assistant",
                content: "Halo! Saya adalah asisten AI Anda. Ada yang bisa saya bantu terkait proyek RAB Anda?",
                timestamp: new Date()
            }
        ];
        setMessages(freshGreeting);
        localStorage.removeItem(CHAT_HISTORY_KEY);
        setIsClearDialogOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removePendingFile = (index: number) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!input.trim() && pendingFiles.length === 0) || isLoading) return;

        setIsLoading(true);
        setIsUploading(pendingFiles.length > 0);

        let attachments: Attachment[] = [];

        try {
            // Upload files if any
            if (pendingFiles.length > 0) {
                const uploadPromises = pendingFiles.map(async (file) => {
                    const url = await uploadFile(file);
                    return {
                        url,
                        name: file.name,
                        type: file.type
                    };
                });
                attachments = await Promise.all(uploadPromises);
            }

            const userMessage: Message = {
                id: Date.now().toString(),
                role: "user",
                content: input,
                timestamp: new Date(),
                attachments: attachments.length > 0 ? attachments : undefined
            };

            setMessages(prev => [...prev, userMessage]);
            setInput("");
            setPendingFiles([]);
            setIsUploading(false);

            const provider = getActiveProvider();

            // Prepare context with attachments for AI
            let aiPrompt = input;
            if (attachments.length > 0) {
                const fileList = attachments.map(a => `- ${a.name} (${a.url})`).join("\n");
                aiPrompt += `\n\n[USER ATTACHMENTS]\n${fileList}\n\nAnalisis file di atas jika itu adalah gambar atau dokumen terkait RAB.`;
            }

            const response = await callPuterAI(aiPrompt);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: response,
                timestamp: new Date(),
                provider: provider
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error: any) {
            console.error("Chat failed:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `Maaf, terjadi kesalahan: ${error.message || "Gagal menghubungi AI."}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setIsUploading(false);
        }
    };

    const providerConfig = AI_PROVIDERS[activeProvider];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full border-l shadow-2xl">
                <SheetHeader className="p-4 border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                <Logo className="h-7 w-7" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-primary text-left">AI Chat Assistant</SheetTitle>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Provider:</span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="h-6 px-2 text-[10px] font-bold gap-1 bg-white hover:bg-slate-50 border-slate-200">
                                                <span>{providerConfig.icon}</span>
                                                <span>{providerConfig.displayName}</span>
                                                <ChevronRight className="h-3 w-3 rotate-90 ml-0.5 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-56">
                                            {Object.entries(AI_PROVIDERS).map(([key, config]) => (
                                                <DropdownMenuItem
                                                    key={key}
                                                    className={cn(
                                                        "flex items-center gap-2 cursor-pointer font-medium",
                                                        activeProvider === key ? "bg-primary/5 text-primary font-bold" : ""
                                                    )}
                                                    onClick={() => handleProviderChange(key as AIProvider)}
                                                    disabled={!config.available}
                                                >
                                                    <span className="text-lg">{config.icon}</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{config.displayName}</span>
                                                        {!config.available && <span className="text-[10px] text-muted-foreground">(Tidak Tersedia)</span>}
                                                    </div>
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <ThemeSwitcher />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors rounded-lg"
                                onClick={handleClearChat}
                                title="Bersihkan Chat"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <ScrollArea className="flex-1 p-4" viewportRef={scrollRef}>
                        <div className="space-y-6 pb-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex w-full mb-4",
                                        message.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}>
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                            message.role === "user"
                                                ? "bg-primary text-white"
                                                : "bg-white border border-slate-100"
                                        )}>
                                            {message.role === "user" ? <User className="h-4 w-4" /> : <Logo className="h-5 w-5" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl p-4 text-sm leading-relaxed",
                                            message.role === "user"
                                                ? "bg-primary text-white rounded-tr-none shadow-md shadow-primary/10"
                                                : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none"
                                        )}>
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className="mb-3 space-y-2">
                                                    {message.attachments.map((att, idx) => (
                                                        <div key={idx} className="rounded-lg overflow-hidden border border-white/20 shadow-sm bg-white/10">
                                                            {att.type.startsWith('image/') ? (
                                                                <img src={att.url} alt={att.name} className="max-w-full h-auto block" />
                                                            ) : (
                                                                <a
                                                                    href={att.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 p-2 text-xs hover:bg-white/10 transition-colors"
                                                                >
                                                                    <File className="h-4 w-4" />
                                                                    <span className="truncate flex-1">{att.name}</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <ReactMarkdown>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</ReactMarkdown>
                                            {message.provider && message.role === "assistant" && (
                                                <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center gap-1.5 opacity-50 text-[10px] font-medium">
                                                    <span>Ditenagai oleh</span>
                                                    <span className="font-bold">{AI_PROVIDERS[message.provider].displayName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start mb-4">
                                    <div className="flex gap-3 max-w-[85%] animate-pulse">
                                        <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0">
                                            <Logo className="h-5 w-5" />
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            <span className="text-sm text-slate-500 font-medium">
                                                {isUploading ? "Mengunggah file..." : "AI sedang berpikir..."}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="p-4 border-t bg-slate-50/50 space-y-3">
                    {/* Pending Files Preview */}
                    {pendingFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
                            {pendingFiles.map((file, idx) => (
                                <div key={idx} className="relative group rounded-lg border bg-white p-2 flex items-center gap-2 pr-8 shadow-sm">
                                    {file.type.startsWith('image/') ? (
                                        <ImageIcon className="h-4 w-4 text-primary" />
                                    ) : (
                                        <File className="h-4 w-4 text-slate-400" />
                                    )}
                                    <span className="text-[10px] font-bold truncate max-w-[100px]">{file.name}</span>
                                    <button
                                        onClick={() => removePendingFile(idx)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-destructive transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 items-end">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm hover:shadow-md shrink-0"
                            disabled={isLoading}
                        >
                            <Paperclip className="h-5 w-5" />
                        </button>
                        <input
                            type="file"
                            multiple
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        <div className="flex-1 flex gap-2 bg-white p-1 rounded-xl border shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all min-h-[48px] items-center">
                            <Input
                                placeholder="Tanyakan apa saja tentang RAB..."
                                className="border-none focus-visible:ring-0 px-3 bg-transparent h-10"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            />
                            <Button
                                size="icon"
                                className="h-10 w-10 rounded-lg boq-accent-gradient shadow-md shrink-0"
                                onClick={handleSend}
                                disabled={isLoading || (!input.trim() && pendingFiles.length === 0)}
                            >
                                <Send className="h-4 w-4 text-white" />
                            </Button>
                        </div>
                    </div>
                    <p className="text-[10px] text-center mt-3 text-muted-foreground font-medium">
                        AI dapat memberikan informasi yang tidak akurat. Mohon verifikasi hasil manual.
                    </p>
                </div>

                {/* Clear Chat Confirmation */}
                <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
                    <AlertDialogContent className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                        <AlertDialogHeader className="space-y-3">
                            <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-1">
                                <RotateCcw className="h-6 w-6" />
                            </div>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                Bersihkan Riwayat Chat?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-slate-500 font-medium">
                                Seluruh percakapan Anda dengan asisten AI di sesi ini akan dihapus secara permanen.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-6">
                            <AlertDialogCancel className="rounded-xl font-medium">Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmClearChat}
                                className="rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20"
                            >
                                Ya, Bersihkan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SheetContent>
        </Sheet>
    );
}
