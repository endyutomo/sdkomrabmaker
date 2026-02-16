// AI Provider Types and Manager
export enum AIProvider {
    GEMINI = 'gemini',
    PUTER = 'puter'
}

export interface AIProviderConfig {
    name: string;
    displayName: string;
    icon: string;
    available: boolean;
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
    [AIProvider.GEMINI]: {
        name: 'gemini',
        displayName: 'Google Gemini',
        icon: '🤖',
        available: true
    },
    [AIProvider.PUTER]: {
        name: 'puter',
        displayName: 'Puter AI',
        icon: '🚀',
        available: typeof window !== 'undefined' && 'puter' in window
    }
};

// Local storage key
const AI_PROVIDER_KEY = 'sdkom_ai_provider';

// Get active provider from localStorage
export function getActiveProvider(): AIProvider {
    if (typeof window === 'undefined') return AIProvider.GEMINI;

    const stored = localStorage.getItem(AI_PROVIDER_KEY);
    if (stored && Object.values(AIProvider).includes(stored as AIProvider)) {
        return stored as AIProvider;
    }

    return AIProvider.GEMINI;
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
