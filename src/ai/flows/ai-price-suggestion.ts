
'use server';
/**
 * @fileOverview Genkit flow untuk menyarankan harga item berdasarkan harga tertinggi di pasar.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PriceSuggestionInputSchema = z.object({
  itemName: z.string().describe('Nama perangkat atau jasa yang ingin dicari harganya.'),
  itemType: z.enum(['perangkat', 'jasa']).describe('Tipe item.'),
});
export type PriceSuggestionInput = z.infer<typeof PriceSuggestionInputSchema>;

const PriceSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().describe('Estimasi harga TERTINGGI dalam Rupiah.'),
  sourceUrl: z.string().url().describe('Tautan referensi harga tertinggi.'),
  sourceName: z.string().describe('Nama sumber harga tertinggi (misal: "Official Store Tokopedia").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang rentang harga pasar.'),
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
Tugas Anda adalah menemukan referensi harga pasar terbaru untuk item berikut.

PENTING: Berikan harga TERTINGGI (Upper Bound/High-End) yang masuk akal di marketplace atau standar industri. 
Ini bertujuan agar user memiliki cadangan anggaran (budget safety margin) yang cukup.

Item: {{{itemName}}}
Tipe: {{{itemType}}}

Instruksi:
1. Jika perangkat, cari harga dari Official Store atau penjual bereputasi tinggi di Tokopedia/Shopee/Bhinneka. **Prioritaskan sumber atau toko yang berlokasi di wilayah Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi).** Ambil harga tertingginya.
2. Jika jasa, gunakan standar harga jasa profesional atau vendor kelas atas di wilayah Indonesia, dengan preferensi Jabodetabek jika tersedia.
3. Berikan URL asli yang merujuk pada harga tersebut.
4. Berikan catatan singkat mengapa harga tersebut diambil (misal: "Harga varian tertinggi dari Official Store di Jakarta").

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
      throw new Error('Gagal mendapatkan saran harga tertinggi.');
    }
    return output;
  }
);
