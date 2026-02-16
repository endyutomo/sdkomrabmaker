
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
  suggestedPrice: z.number().describe('Estimasi harga MEDIAN/RATA-RATA dalam Rupiah dari multiple marketplace.'),
  priceRange: z.object({
    min: z.number().describe('Harga terendah dari seller rating 4-5 bintang.'),
    max: z.number().describe('Harga tertinggi dari seller rating 4-5 bintang.'),
  }).describe('Range harga dari berbagai marketplace.'),
  marketplaceSources: z.array(z.string()).describe('Daftar marketplace yang dijadikan referensi (misal: ["Tokopedia", "Shopee", "Bukalapak", "Lazada"]).'),
  sourceUrl: z.string().url().describe('Tautan referensi umum (bukan toko spesifik).'),
  sourceName: z.string().describe('Nama sumber harga (misal: "Estimasi Multi-Marketplace" atau "Rata-Rata Pasaran Online").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang estimasi harga dan marketplace yang digunakan.'),
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
Tugas Anda adalah memberikan estimasi harga yang WAJAR untuk item berikut berdasarkan MULTIPLE MARKETPLACE TERPERCAYA.

PENTING: Berikan harga estimasi berdasarkan RATA-RATA dari marketplace Indonesia berikut:
- Tokopedia (seller rating 4-5 bintang)
- Shopee (seller rating 4-5 bintang)  
- Bukalapak (seller rating 4-5 bintang)
- Lazada (seller rating 4-5 bintang)

Item: {{{itemName}}}
Tipe: {{{itemType}}}

Instruksi:
1. Jika perangkat, bandingkan harga di Tokopedia, Shopee, Bukalapak, dan Lazada dari seller rating 4-5 bintang
2. Berikan RANGE HARGA (min dan max) dari seller terpercaya di marketplace tersebut
3. Hitung harga MEDIAN/RATA-RATA sebagai suggestedPrice
4. Jika jasa, gunakan standar harga jasa profesional di Indonesia
5. Berikan URL referensi umum (bukan toko spesifik), misalnya halaman kategori marketplace
6. Sebutkan marketplace mana saja yang dijadikan referensi dalam array marketplaceSources
7. Berikan catatan singkat tentang range harga dan marketplace yang digunakan
8. Hindari harga outlier (terlalu murah = kualitas rendah, terlalu mahal = overprice)
9. Fokus pada seller dengan banyak review positif dan rating tinggi

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
