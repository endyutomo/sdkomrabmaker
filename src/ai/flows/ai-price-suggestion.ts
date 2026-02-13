'use server';
/**
 * @fileOverview Genkit flow untuk menyarankan harga item spesifik berdasarkan data pasar.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PriceSuggestionInputSchema = z.object({
  itemName: z.string().describe('Nama perangkat atau jasa yang ingin dicari harganya.'),
  itemType: z.enum(['perangkat', 'jasa']).describe('Tipe item.'),
});
export type PriceSuggestionInput = z.infer<typeof PriceSuggestionInputSchema>;

const PriceSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().describe('Estimasi harga satuan dalam Rupiah.'),
  sourceUrl: z.string().url().describe('Tautan referensi harga (misal dari marketplace atau portal harga jasa).'),
  sourceName: z.string().describe('Nama sumber (misal: "Tokopedia", "HSP", "Shopee").'),
});
export type PriceSuggestionOutput = z.infer<typeof PriceSuggestionOutputSchema>;

export async function suggestItemPrice(
  input: PriceSuggestionInput
): Promise<PriceSuggestionOutput> {
  return priceSuggestionFlow(input);
}

const priceSuggestionPrompt = ai.definePrompt({
  name: 'priceSuggestionPrompt',
  input: { schema: PriceSuggestionInputSchema },
  output: { schema: PriceSuggestionOutputSchema },
  prompt: `Anda adalah asisten riset pasar konstruksi dan teknologi di Indonesia.
Berikan estimasi harga terbaru untuk item berikut di pasar Indonesia.
Jika itu perangkat, berikan estimasi harga dari marketplace besar (Tokopedia/Shopee/Bhinneka).
Jika itu jasa, berikan estimasi sesuai standar upah minimum atau harga jasa umum di industri.

Item: {{{itemName}}}
Tipe: {{{itemType}}}

PENTING: Berikan tautan (URL) referensi yang masuk akal dan nyata yang berkaitan dengan item tersebut di Indonesia.
Output harus dalam JSON.`,
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
      throw new Error('Gagal mendapatkan saran harga.');
    }
    return output;
  }
);
