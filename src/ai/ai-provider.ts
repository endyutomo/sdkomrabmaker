// AI Provider Types and Manager
export enum AIProvider {
    LITELLM = 'litellm',
    GEMINI = 'gemini',
    PUTER = 'puter',
    OPENAI = 'openai',
    CLAUDE = 'claude',
    GROK = 'grok',
    GEMINI_3_PRO = 'gemini_3_pro'
}

export interface AIProviderConfig {
    name: string;
    displayName: string;
    icon: string;
    available: boolean;
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
    [AIProvider.LITELLM]: {
        name: 'litellm',
        displayName: 'LiteLLM (Rekomendasi)',
        icon: '💎',
        available: true
    },
    [AIProvider.GEMINI]: {
        name: 'gemini',
        displayName: 'Google Gemini',
        icon: '🤖',
        available: true
    },
    [AIProvider.PUTER]: {
        name: 'puter',
        displayName: 'Puter AI (Gemini 2.5)',
        icon: '🚀',
        available: typeof window !== 'undefined' && 'puter' in window
    },
    [AIProvider.OPENAI]: {
        name: 'openai',
        displayName: 'OpenAI (GPT-4o)',
        icon: '🧠',
        available: typeof window !== 'undefined' && 'puter' in window
    },
    [AIProvider.CLAUDE]: {
        name: 'claude',
        displayName: 'Claude (Sonnet 4.5)',
        icon: '🎭',
        available: typeof window !== 'undefined' && 'puter' in window
    },
    [AIProvider.GROK]: {
        name: 'grok',
        displayName: 'Grok (4.1 Fast)',
        icon: '⚡',
        available: typeof window !== 'undefined' && 'puter' in window
    },
    [AIProvider.GEMINI_3_PRO]: {
        name: 'gemini_3_pro',
        displayName: 'Gemini 3 Pro',
        icon: '🌌',
        available: typeof window !== 'undefined' && 'puter' in window
    }
};

// Local storage key
const AI_PROVIDER_KEY = 'sdkom_ai_provider';

// Get active provider from localStorage
export function getActiveProvider(): AIProvider {
    if (typeof window === 'undefined') return AIProvider.LITELLM;

    const stored = localStorage.getItem(AI_PROVIDER_KEY);
    if (stored && Object.values(AIProvider).includes(stored as AIProvider)) {
        return stored as AIProvider;
    }

    return AIProvider.LITELLM;
}

// Set active provider
export function setActiveProvider(provider: AIProvider): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AI_PROVIDER_KEY, provider);
}

// Check if Puter is available
export function isPuterAvailable(): boolean {
    return typeof window !== 'undefined' && 'puter' in window;
}
