
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
  suggestedPrice: z.number().describe('Estimasi harga WAJAR dalam Rupiah dari toko rating 4-5 bintang.'),
  sourceUrl: z.string().url().describe('Tautan referensi harga.'),
  sourceName: z.string().describe('Nama sumber harga (misal: "Toko Bangunan Terpercaya Tokopedia").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang rentang harga pasar dari seller rating 4-5 bintang.'),
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

PENTING: Berikan harga yang WAJAR dari toko dengan rating 4-5 bintang di marketplace Indonesia.
Jangan gunakan harga terendah (kualitas rendah) atau harga tertinggi (overprice).
Gunakan harga rata-rata dari penjual terpercaya.

Item: {{{itemName}}}
Tipe: {{{itemType}}}

Instruksi:
1. Jika perangkat, cari harga dari toko bangunan online dengan rating 4-5 bintang di Tokopedia/Shopee/Bukalapak. **Prioritaskan seller dengan rating 4-5 bintang dan lokasi Jabodetabek.** Ambil harga yang wajar (rata-rata, bukan yang termahal atau termurah).
2. Jika jasa, gunakan standar harga jasa profesional di Indonesia dengan rating/reputasi baik (bukan tukang murah). Preferensi wilayah Jabodetabek.
3. Berikan URL asli yang merujuk pada harga tersebut.
4. Berikan catatan singkat mengapa harga tersebut diambil (misal: "Harga rata-rata dari seller rating 4.8 bintang di Jakarta").

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
