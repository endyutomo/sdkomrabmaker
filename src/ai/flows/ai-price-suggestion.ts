
'use server';
/**
 * @fileOverview Genkit flow untuk menyarankan harga item berdasarkan marketplace rating 4-5 bintang.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { shouldUsePuterAI, callPuterAI, parseAIJSON } from '@/ai/puter-ai-adapter';
import { PRICE_SUGGESTION_SYSTEM_PROMPT, createPriceSuggestionPrompt } from '@/ai/prompts/price-suggestion-prompt';

const PriceSuggestionInputSchema = z.object({
  itemName: z.string().describe('Nama perangkat atau jasa yang ingin dicari harganya.'),
  itemType: z.enum(['perangkat', 'jasa']).describe('Tipe item.'),
});
export type PriceSuggestionInput = z.infer<typeof PriceSuggestionInputSchema>;

const PriceSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().describe('Estimasi harga STANDAR/RATA-RATA PASARAN dalam Rupiah dari seller terpercaya di multiple marketplace.'),
  priceRange: z.object({
    min: z.number().describe('Harga terendah dari seller rating 4-5 bintang.'),
    max: z.number().describe('Harga tertinggi dari seller rating 4-5 bintang.'),
  }).describe('Range harga dari berbagai marketplace.'),
  marketplaceSources: z.array(z.string()).describe('Daftar marketplace yang dijadikan referensi (misal: ["Tokopedia", "Shopee", "Bukalapak", "Lazada"]).'),
  sourceUrl: z.string().describe('Tautan referensi umum (bukan toko spesifik).'),
  sourceName: z.string().describe('Nama sumber harga (misal: "Estimasi Multi-Marketplace" atau "Rata-Rata Pasaran Online").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang estimasi harga dan marketplace yang digunakan.'),
  brandDetected: z.string().optional().describe('Brand premium yang terdeteksi dalam nama item (misal: "Belden", "Rucika", "Nippon").'),
  isPremiumBrand: z.boolean().optional().describe('Apakah item mengandung brand premium yang memerlukan harga lebih tinggi.'),
  brandNote: z.string().optional().describe('Catatan tentang brand premium dan alasan harga lebih tinggi.'),
  modelType: z.string().optional().describe('Tipe atau nomor model spesifik yang disarankan (misal: "QA55QN85B").'),
  imageUrl: z.string().optional().describe('URL foto produk yang representatif dan valid (opsional, bisa kosong).'),
});
export type PriceSuggestionOutput = z.infer<typeof PriceSuggestionOutputSchema>;

export async function suggestItemPrice(
  input: PriceSuggestionInput
): Promise<PriceSuggestionOutput> {
  // Check if we should use Puter AI (client-side only)
  if (typeof window !== 'undefined' && shouldUsePuterAI()) {
    return await suggestItemPriceWithPuter(input);
  }

  // Default to Genkit/Gemini
  return priceSuggestionFlow(input);
}

const priceSuggestionPrompt = ai.definePrompt({
  name: 'priceSuggestionPrompt',
  input: { schema: PriceSuggestionInputSchema },
  output: { schema: PriceSuggestionOutputSchema },
  prompt: `
${PRICE_SUGGESTION_SYSTEM_PROMPT}

Item: {{{itemName}}}
Tipe: {{{itemType}}}

Output harus dalam format JSON.`,
});

const priceSuggestionFlow = ai.defineFlow(
  {
    name: 'priceSuggestionFlow',
    inputSchema: PriceSuggestionInputSchema,
    outputSchema: PriceSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await priceSuggestionPrompt(input);
    if (!output) {
      throw new Error('Gagal mendapatkan saran harga yang wajar.');
    }
    return output;
  }
);

/**
 * Suggest item price using Puter AI
 */
async function suggestItemPriceWithPuter(
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
