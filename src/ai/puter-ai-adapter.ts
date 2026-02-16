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
}

/**
 * Suggest item price using Puter AI (Client Side)
 */
export async function suggestItemPriceClient(
    input: PriceSuggestionInput
): Promise<PriceSuggestionOutput> {

    // Build prompt manually 
    const promptText = `Anda adalah ahli estimasi harga untuk proyek di Indonesia dengan pengetahuan mendalam tentang brand premium dan generik.
Tugas Anda adalah memberikan estimasi harga yang AMAN untuk item berikut berdasarkan MULTIPLE MARKETPLACE TERPERCAYA.

PENTING: Berikan harga TERTINGGI/MAKSIMUM yang REALISTIS dari marketplace Indonesia berikut:
- Tokopedia (seller rating 4-5 bintang)
- Shopee (seller rating 4-5 bintang)  
- Bukalapak (seller rating 4-5 bintang)
- Lazada (seller rating 4-5 bintang)

Item: ${input.itemName}
Tipe: ${input.itemType}

=== BRAND AWARENESS DATABASE ===
Deteksi apakah item mengandung brand premium berikut dan sesuaikan harga:

NETWORKING & CABLING (Premium 3-10x dari generik):
- Belden, Commscope, AMP, Panduit, Schneider Electric, Legrand, Molex
- Harga Kabel UTP Cat6 Belden 305m: Rp 2.000.000 - 2.500.000
- Harga Kabel UTP Cat6 Generik 305m: Rp 300.000 - 500.000

ELECTRICAL (Premium 2-5x dari generik):
- Broco, Eterna, Clipsal, Schneider, ABB, Siemens, Legrand
- MCB Schneider: Rp 80.000 - 150.000
- MCB Generik: Rp 20.000 - 40.000

PIPE & PLUMBING (Premium 1.5-3x dari generik):
- Rucika, Wavin, Pralon Premium, Maspion
- Pipa PVC Rucika 3": Rp 80.000 - 120.000/batang
- Pipa PVC Generik 3": Rp 30.000 - 50.000/batang

PAINT (Premium 2-4x dari generik):
- Nippon, Dulux, Avian, Jotun, ICI, Kansai
- Cat Nippon Weathershield 20kg: Rp 800.000 - 1.200.000
- Cat Generik 20kg: Rp 200.000 - 400.000

CEMENT & BUILDING MATERIALS (Premium 1.2-2x dari generik):
- Tiga Roda, Holcim, Semen Indonesia (Gresik), Conch
- Semen Tiga Roda 50kg: Rp 65.000 - 75.000
- Semen Generik 50kg: Rp 50.000 - 60.000

SANITARY (Premium 2-5x dari generik):
- TOTO, American Standard, Kohler, Grohe, Wasser
- Closet TOTO: Rp 1.500.000 - 3.000.000
- Closet Generik: Rp 500.000 - 800.000

Instruksi:
1. DETEKSI BRAND: Periksa apakah item mengandung brand premium
2. Jika BRAND PREMIUM terdeteksi: gunakan harga premium sesuai database, set isPremiumBrand = true, set brandDetected = nama brand
3. Jika TIDAK ADA BRAND: gunakan harga TERTINGGI/MAKSIMUM, set isPremiumBrand = false
4. Berikan RANGE HARGA (min dan max) yang akurat
5. Output WAJIB dalam format JSON yang valid

Output harus dalam format JSON dengan struktur persis seperti ini:
{
  "suggestedPrice": number,
  "priceRange": { "min": number, "max": number },
  "marketplaceSources": ["Tokopedia", "Shopee", ...],
  "sourceUrl": "https://...",
  "sourceName": "string",
  "priceRangeNote": "string",
  "brandDetected": "string" (optional),
  "isPremiumBrand": boolean (optional),
  "brandNote": "string" (optional)
}`;

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
