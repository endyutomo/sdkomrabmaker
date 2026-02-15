'use server';
/**
 * @fileOverview Implementasi Genkit flow untuk saran item RAB (Bill of Quantities) dalam Bahasa Indonesia.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BoqItemSuggestionInputSchema = z.object({
  projectType: z
    .string()
    .describe('Tipe proyek (misal: "instalasi server", "pembangunan rumah", "sistem keamanan CCTV").'),
  specifications: z
    .string()
    .describe('Detail spesifikasi atau kebutuhan proyek.'),
});
export type BoqItemSuggestionInput = z.infer<typeof BoqItemSuggestionInputSchema>;

const BoqItemSchema = z.object({
  name: z
    .string()
    .describe('Nama item dalam Bahasa Indonesia (misal: "Server Dell PowerEdge", "Jasa Tarik Kabel").'),
  unit: z
    .string()
    .describe('Satuan (misal: "Unit", "Lot", "Titik", "Jasa").'),
  quantity: z
    .number()
    .describe('Estimasi jumlah.')
    .default(1),
  unitPrice: z
    .number()
    .describe('Estimasi harga satuan dalam Rupiah.')
    .default(0),
  type: z
    .enum(['perangkat', 'jasa'])
    .describe('Tipe item: "perangkat" untuk barang fisik, "jasa" untuk tenaga kerja/instalasi.'),
});

const BoqCategorySchema = z.object({
  name: z
    .string()
    .describe('Nama kategori (misal: "Perangkat Utama", "Jasa Instalasi", "Material Bantu").'),
  items: z.array(BoqItemSchema).describe('Daftar item dalam kategori ini.'),
});

const BoqItemSuggestionOutputSchema = z.object({
  categories: z
    .array(BoqCategorySchema)
    .describe('Daftar kategori item untuk proyek.'),
});
export type BoqItemSuggestionOutput = z.infer<typeof BoqItemSuggestionOutputSchema>;

export async function suggestBoqItems(
  input: BoqItemSuggestionInput
): Promise<BoqItemSuggestionOutput> {
  return boqItemSuggestionFlow(input);
}

const boqItemSuggestionPrompt = ai.definePrompt({
  name: 'boqItemSuggestionPrompt',
  input: { schema: BoqItemSuggestionInputSchema },
  output: { schema: BoqItemSuggestionOutputSchema },
  prompt: `Anda adalah seorang Ahli Estimator Proyek profesional di Indonesia. Tugas Anda adalah menghasilkan Rencana Anggaran Biaya (RAB) yang detail.

PENTING: 
1. Kelompokkan item ke dalam kategori yang logis. Setiap item HARUS ditentukan tipenya: "perangkat" untuk barang/material atau "jasa" untuk instalasi/konfigurasi/upah.
2. HARGA WAJIB berdasarkan ESTIMASI PASARAN UMUM marketplace Indonesia
3. Jangan memberikan link toko spesifik atau nama toko yang tidak valid
4. Gunakan harga estimasi yang realistis berdasarkan pengalaman pasar
5. Jangan gunakan harga terendah (kualitas rendah) atau harga tertinggi (overprice)
6. Untuk material: harga rata-rata pasaran yang umum di toko bangunan
7. Untuk jasa: harga pasaran tukang profesional (bukan yang termurah)

Gunakan Bahasa Indonesia yang formal. Berikan harga estimasi yang WAJAR di Indonesia dalam Rupiah, berdasarkan pengalaman pasar umum.

Tipe Proyek: {{{projectType}}}
Spesifikasi: {{{specifications}}}

Mohon berikan output dalam format JSON sesuai skema:`,
});

const boqItemSuggestionFlow = ai.defineFlow(
  {
    name: 'boqItemSuggestionFlow',
    inputSchema: BoqItemSuggestionInputSchema,
    outputSchema: BoqItemSuggestionOutputSchema,
  },
  async (input) => {
    const { output } = await boqItemSuggestionPrompt(input);
    if (!output) {
      throw new Error('Gagal menerima output dari AI.');
    }
    return output;
  }
);
