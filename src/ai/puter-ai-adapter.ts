// Puter AI Adapter - Makes Puter AI compatible with Genkit-style interface
import { AIProvider, getActiveProvider } from './ai-provider';

// Declare puter global type
declare global {
    interface Window {
        puter?: {
            ai: {
                chat: (prompt: string, options?: { model?: string }) => Promise<string>;
            };
        };
    }
}

export interface PuterAIOptions {
    model?: string;
    temperature?: number;
}

/**
 * Call Puter AI with a text prompt
 */
export async function callPuterAI(
    prompt: string,
    options: PuterAIOptions = {}
): Promise<string> {
    if (typeof window === 'undefined' || !window.puter) {
        throw new Error('Puter AI is not available. Make sure the Puter SDK is loaded.');
    }

    try {
        const model = options.model || 'claude-3.5-sonnet';
        const response = await window.puter.ai.chat(prompt, { model });
        return response;
    } catch (error) {
        console.error('Puter AI Error:', error);
        throw new Error(`Puter AI failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseAIJSON<T>(response: string): T {
    // Remove markdown code blocks if present
    let cleaned = response.trim();

    // Remove ```json and ``` markers
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    try {
        return JSON.parse(cleaned) as T;
    } catch (error) {
        console.error('Failed to parse AI response:', cleaned);
        throw new Error('AI returned invalid JSON format');
    }
}

/**
 * Check if Puter AI should be used based on active provider
 */
export function shouldUsePuterAI(): boolean {
    return getActiveProvider() === AIProvider.PUTER;
}
