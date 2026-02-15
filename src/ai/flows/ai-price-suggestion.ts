
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
  suggestedPrice: z.number().describe('Estimasi harga WAJAR dalam Rupiah dari Shopee Mall/seller rating 4.5+ bintang.'),
  sourceUrl: z.string().url().describe('Tautan referensi harga dari Shopee.'),
  sourceName: z.string().describe('Nama sumber harga (misal: "Shopee Mall Official Store" atau "Shopee Seller Rating 4.8").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang rentang harga dari Shopee seller rating 4.5+ bintang.'),
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
  prompt: `Anda adalah ahli riset pasar untuk estimasi proyek di Indonesia.
Tugas Anda adalah menemukan referensi harga pasar yang WAJAR untuk item berikut.

PENTING: Berikan harga yang WAJAR dari SHOPEE MALL dan toko Shopee dengan rating 4.5-5 bintang.
Prioritaskan Shopee Mall untuk material bangunan dan peralatan.
Untuk toko biasa, gunakan yang memiliki rating minimal 4.5 bintang dan minimal 100+ ulasan.
Jangan gunakan harga terendah (kualitas rendah) atau harga tertinggi (overprice).

Item: {{{itemName}}}
Tipe: {{{itemType}}}

Instruksi:
1. Jika perangkat, cari harga dari Shopee Mall (official store) atau seller dengan rating 4.5+ bintang. **Prioritaskan Shopee Mall untuk material bangunan.** Ambil harga yang wajar (rata-rata, bukan yang termahal atau termurah).
2. Jika jasa, gunakan standar harga jasa profesional di Indonesia dengan reputasi baik (bukan tukang murah).
3. Berikan URL asli dari Shopee yang merujuk pada harga tersebut.
4. Berikan catatan singkat mengapa harga tersebut diambil (misal: "Harga rata-rata dari Shopee Mall official store" atau "Harga dari seller rating 4.8 bintang dengan 500+ ulasan").

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
