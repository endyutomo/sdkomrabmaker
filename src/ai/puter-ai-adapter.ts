// Puter AI Adapter - Makes Puter AI compatible with Genkit-style interface
import { AIProvider, getActiveProvider } from './ai-provider';
import { createPriceSuggestionPrompt } from '@/ai/prompts/price-suggestion-prompt';

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
        let model = options.model;

        // If model is not explicitly provided, determine based on active provider
        if (!model) {
            const provider = getActiveProvider();
            if (provider === AIProvider.OPENAI) {
                model = 'gpt-5-nano'; // As requested by user
            } else if (provider === AIProvider.CLAUDE) {
                model = 'claude-sonnet-4-5'; // As requested by user
            } else if (provider === AIProvider.GROK) {
                model = 'x-ai/grok-4-1-fast'; // As requested by user
            } else if (provider === AIProvider.GEMINI_3_PRO) {
                model = 'google/gemini-3-pro-preview'; // As requested by user
            } else {
                model = 'google/gemini-2.5-flash'; // Default for Puter provider
            }
        }

        const response = await window.puter.ai.chat(prompt, { model });

        // Standardize response to string
        if (typeof response === 'string') {
            return response;
        }

        if (typeof response === 'object' && response !== null) {
            // Handle { message: { content: "..." | [...] } }
            const message = (response as any).message;
            if (message?.content) {
                if (typeof message.content === 'string') {
                    return message.content;
                }
                if (Array.isArray(message.content)) {
                    // Extract text from blocks (Claude style)
                    return message.content
                        .map((block: any) => {
                            if (typeof block === 'string') return block;
                            if (block?.text) return block.text;
                            return JSON.stringify(block);
                        })
                        .join("");
                }
                return String(message.content);
            }

            // Handle direct array response
            if (Array.isArray(response)) {
                return JSON.stringify(response);
            }

            // Fallback for other object structures
            return JSON.stringify(response);
        }

        return String(response);
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
    const provider = getActiveProvider();
    return provider === AIProvider.PUTER ||
        provider === AIProvider.OPENAI ||
        provider === AIProvider.CLAUDE ||
        provider === AIProvider.GROK ||
        provider === AIProvider.GEMINI_3_PRO;
}
// Re-export types from a shared location or define here if needed. 
// Ideally these should be in a shared types file, but for now we'll define minimal interface to avoid circular deps
// or huge refactors. We need to match PriceSuggestionInput and PriceSuggestionOutput structure.

export interface PriceSuggestionInput {
    itemName: string;
    itemType: 'perangkat' | 'jasa';
}

export interface PriceSuggestionOutput {
    suggestedPrice: number;
    priceRange: {
        min: number;
        max: number;
    };
    marketplaceSources: string[];
    sourceUrl: string;
    sourceName: string;
    priceRangeNote: string;
    brandDetected?: string;
    isPremiumBrand?: boolean;
    brandNote?: string;
    modelType?: string;
    imageUrl?: string;
}

/**
 * Suggest item price using Puter AI (Client Side)
 */
export async function suggestItemPriceClient(
    input: PriceSuggestionInput
): Promise<PriceSuggestionOutput> {

    // Build prompt using shared template
    const promptText = createPriceSuggestionPrompt(input.itemName, input.itemType);

    try {
        // Model will be determined automatically by callPuterAI based on active provider
        const response = await callPuterAI(promptText);
        const parsed = parseAIJSON<PriceSuggestionOutput>(response);
        return parsed;
    } catch (error) {
        console.error('Puter AI price suggestion failed:', error);
        throw error;
    }
}
