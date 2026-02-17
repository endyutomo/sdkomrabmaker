
'use server';
/**
 * @fileOverview Genkit flow untuk menyarankan harga item berdasarkan marketplace rating 4-5 bintang.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { shouldUsePuterAI, callPuterAI, parseAIJSON } from '@/ai/puter-ai-adapter';

const PriceSuggestionInputSchema = z.object({
  itemName: z.string().describe('Nama perangkat atau jasa yang ingin dicari harganya.'),
  itemType: z.enum(['perangkat', 'jasa']).describe('Tipe item.'),
});
export type PriceSuggestionInput = z.infer<typeof PriceSuggestionInputSchema>;

const PriceSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().describe('Estimasi harga TERTINGGI/MAKSIMUM dalam Rupiah dari seller terpercaya di multiple marketplace untuk RAB yang aman.'),
  priceRange: z.object({
    min: z.number().describe('Harga terendah dari seller rating 4-5 bintang.'),
    max: z.number().describe('Harga tertinggi dari seller rating 4-5 bintang.'),
  }).describe('Range harga dari berbagai marketplace.'),
  marketplaceSources: z.array(z.string()).describe('Daftar marketplace yang dijadikan referensi (misal: ["Tokopedia", "Shopee", "Bukalapak", "Lazada"]).'),
  sourceUrl: z.string().url().describe('Tautan referensi umum (bukan toko spesifik).'),
  sourceName: z.string().describe('Nama sumber harga (misal: "Estimasi Multi-Marketplace" atau "Rata-Rata Pasaran Online").'),
  priceRangeNote: z.string().describe('Catatan singkat tentang estimasi harga dan marketplace yang digunakan.'),
  brandDetected: z.string().optional().describe('Brand premium yang terdeteksi dalam nama item (misal: "Belden", "Rucika", "Nippon").'),
  isPremiumBrand: z.boolean().optional().describe('Apakah item mengandung brand premium yang memerlukan harga lebih tinggi.'),
  brandNote: z.string().optional().describe('Catatan tentang brand premium dan alasan harga lebih tinggi.'),
  modelType: z.string().optional().describe('Tipe atau nomor model spesifik yang disarankan (misal: "QA55QN85B").'),
  imageUrl: z.string().url().optional().describe('URL foto produk yang representatif dan valid.'),
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
  prompt: `Anda adalah ahli estimasi harga untuk proyek di Indonesia dengan pengetahuan mendalam tentang brand premium dan generik.
Tugas Anda adalah memberikan estimasi harga yang AMAN untuk item berikut berdasarkan MULTIPLE MARKETPLACE TERPERCAYA.

PENTING: Berikan harga TERTINGGI/MAKSIMUM yang REALISTIS dari marketplace Indonesia berikut:
- Tokopedia (seller rating 4-5 bintang)
- Shopee (seller rating 4-5 bintang)  
- Bukalapak (seller rating 4-5 bintang)
- Lazada (seller rating 4-5 bintang)

Item: {{{itemName}}}
Tipe: {{{itemType}}}

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
1. DETEKSI BRAND & MODEL: Periksa apakah {{{itemName}}} mengandung brand premium. Jika nama item sangat umum (misal: "Smart TV 55 inch"), sarankan satu MODEL TYPE spesifik yang lazim di pasaran Indonesia (misal: "Samsung Crystal UHD UA55AU7000").
2. Jika BRAND PREMIUM terdeteksi:
   - Gunakan harga premium sesuai database di atas
   - Set isPremiumBrand = true
   - Set brandDetected = nama brand (misal: "Belden")
   - Berikan brandNote yang menjelaskan kenapa harga lebih tinggi
3. TIPE MODEL (modelType): Berikan kode model atau nama tipe yang spesifik untuk item tersebut guna membantu identifikasi produk.
4. FOTO PRODUK (imageUrl):
   - PRIORITAS 1: URL dari Wikimedia Commons (sangat stabil). Format: 'https://upload.wikimedia.org/...'
    - PRIORITAS 2: URL resmi dari website brand(Samsung, Sony, dll).
   - HINDARI: URL dari e- commerce(Tokopedia / Shopee) karena sering expired / blocked.
   - HINDARI: URL placeholder atau dummy.
   - Jika tidak ada URL valid, kosongkan saja jangan dipaksa.
5. Jika TIDAK ADA BRAND atau brand GENERIK:
  - Gunakan harga TERTINGGI / MAKSIMUM dari seller rating 4 - 5 bintang
- Set isPremiumBrand = false
- Harga aman untuk RAB(dengan buffer)
6. Berikan RANGE HARGA(min dan max) yang akurat
7. Jika jasa, gunakan standar harga jasa profesional di Indonesia
8. Berikan URL referensi umum(bukan toko spesifik)
9. Sebutkan marketplace yang dijadikan referensi
10. JANGAN memberikan harga generik untuk brand premium
11. Fokus pada seller dengan review positif dan rating tinggi

CONTOH:
  - Input: "Kabel UTP Cat6 Belden 305m"
  Output: suggestedPrice: 2500000, isPremiumBrand: true, brandDetected: "Belden"

- Input: "Kabel UTP Cat6 305m"(tanpa brand)
  Output: suggestedPrice: 500000, isPremiumBrand: false(gunakan harga maksimum dari range)

- Input: "Smart TV Samsung 55 inch" 
  Output: suggestedPrice: 8500000, modelType: "Samsung UA55AU7002", imageUrl: "https://images.samsung.com/is/image/samsung/p6pim/id/ua55au7002kxxd/gallery/id-uhd-au7000-ua55au7002kxxd-533411130"

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
  // Build prompt manually since we can't use Genkit prompt with Puter directly
  const promptText = `Anda adalah ahli estimasi harga untuk proyek di Indonesia dengan pengetahuan mendalam tentang brand premium dan generik.
Tugas Anda adalah memberikan estimasi harga yang AMAN untuk item berikut berdasarkan MULTIPLE MARKETPLACE TERPERCAYA.

  PENTING: Berikan harga TERTINGGI / MAKSIMUM yang REALISTIS dari marketplace Indonesia berikut:
  - Tokopedia(seller rating 4 - 5 bintang)
  - Shopee(seller rating 4 - 5 bintang)
  - Bukalapak(seller rating 4 - 5 bintang)
  - Lazada(seller rating 4 - 5 bintang)

Item: ${input.itemName}
Tipe: ${input.itemType}

=== BRAND AWARENESS DATABASE ===
Deteksi apakah item mengandung brand premium berikut dan sesuaikan harga:

  NETWORKING & CABLING(Premium 3 - 10x dari generik):
  - Belden, Commscope, AMP, Panduit, Schneider Electric, Legrand, Molex
- Harga Kabel UTP Cat6 Belden 305m: Rp 2.000.000 - 2.500.000
- Harga Kabel UTP Cat6 Generik 305m: Rp 300.000 - 500.000

ELECTRICAL(Premium 2 - 5x dari generik):
  - Broco, Eterna, Clipsal, Schneider, ABB, Siemens, Legrand
- MCB Schneider: Rp 80.000 - 150.000
- MCB Generik: Rp 20.000 - 40.000

PIPE & PLUMBING(Premium 1.5 - 3x dari generik):
  - Rucika, Wavin, Pralon Premium, Maspion
- Pipa PVC Rucika 3": Rp 80.000 - 120.000/batang
- Pipa PVC Generik 3": Rp 30.000 - 50.000/batang

PAINT(Premium 2 - 4x dari generik):
  - Nippon, Dulux, Avian, Jotun, ICI, Kansai
- Cat Nippon Weathershield 20kg: Rp 800.000 - 1.200.000
- Cat Generik 20kg: Rp 200.000 - 400.000

CEMENT & BUILDING MATERIALS(Premium 1.2 - 2x dari generik):
  - Tiga Roda, Holcim, Semen Indonesia(Gresik), Conch
- Semen Tiga Roda 50kg: Rp 65.000 - 75.000
- Semen Generik 50kg: Rp 50.000 - 60.000

SANITARY(Premium 2 - 5x dari generik):
  - TOTO, American Standard, Kohler, Grohe, Wasser
- Closet TOTO: Rp 1.500.000 - 3.000.000
- Closet Generik: Rp 500.000 - 800.000

Instruksi:
  1. DETEKSI BRAND & MODEL: Sarankan MODEL TYPE spesifik jika nama item terlalu umum.
2. Jika BRAND PREMIUM terdeteksi: gunakan harga premium, set isPremiumBrand = true, set brandDetected = nama brand
3. Jika TIDAK ADA BRAND: gunakan harga TERTINGGI / MAKSIMUM, set isPremiumBrand = false
4. FOTO PRODUK(imageUrl):
  - PRIORITAS 1: URL dari Wikimedia Commons(sangat stabil). Format: 'https://upload.wikimedia.org/...'
- PRIORITAS 2: URL resmi dari website brand.
   - HINDARI: URL marketplace / e - commerce.
   - Jika tidak ada, kosongkan.
5. TIPE MODEL(modelType): Berikan kode model produk yang spesifik.
6. Berikan RANGE HARGA(min dan max) yang akurat
7. Output WAJIB dalam format JSON yang valid

Output harus dalam format JSON dengan struktur persis seperti ini:
  {
    "suggestedPrice": number,
    "priceRange": { "min": number, "max": number },
    "marketplaceSources": ["Tokopedia", "Shopee", ...],
    "sourceUrl": "https://...",
    "sourceName": "string",
    "priceRangeNote": "string",
    "brandDetected": "string"(optional),
    "isPremiumBrand": boolean(optional),
    "brandNote": "string"(optional),
    "modelType": "string"(optional),
    "imageUrl": "string"(optional)
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
