
'use server';
/**
 * @fileOverview Genkit flow untuk menyarankan harga item berdasarkan marketplace rating 4-5 bintang.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PriceSuggestionInputSchema = z.object({
  itemName: z.string().describe('Nama perangkat atau jasa yang ingin dicari harganya.'),
  itemType: z.enum(['perangkat', 'jasa']).describe('Tipe item.'),
});
export type PriceSuggestionInput = z.infer<typeof PriceSuggestionInputSchema>;

const PriceSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().describe('Estimasi harga WAJAR dalam Rupiah berdasarkan pasaran umum.'),
  sourceUrl: z.string().url().describe('Tautan referensi umum (bukan toko spesifik).'),
  sourceName: z.string().describe('Nama sumber harga (misal: "Estimasi Pasaran Marketplace" atau "Harga Rata-Rata Pasaran").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang estimasi harga pasaran.'),
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
  prompt: `Anda adalah ahli estimasi harga untuk proyek di Indonesia.
Tugas Anda adalah memberikan estimasi harga yang WAJAR untuk item berikut.

PENTING: Berikan harga estimasi berdasarkan PASARAN UMUM marketplace Indonesia.
Jangan memberikan link toko spesifik yang mungkin tidak ada.
Gunakan pengalaman dan pengetahuan umum tentang harga pasar.

Item: {{{itemName}}}
Tipe: {{{itemType}}}

Instruksi:
1. Jika perangkat, berikan harga rata-rata pasaran yang umum di marketplace.
2. Jika jasa, gunakan standar harga jasa profesional di Indonesia.
3. Berikan URL referensi umum (bukan toko spesifik), misalnya halaman kategori marketplace.
4. Berikan catatan singkat bahwa ini adalah estimasi pasaran.
5. Jangan membuat link toko atau nama toko spesifik yang tidak valid.

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
