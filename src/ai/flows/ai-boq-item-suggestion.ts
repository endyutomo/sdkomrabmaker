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

Jika proyek melibatkan teknologi, pastikan Anda memisahkan kategori antara "Perangkat/Hardware", "Jasa Instalasi/Konfigurasi", dan "Material Pendukung". 

Gunakan Bahasa Indonesia yang formal. Berikan harga pasar yang wajar di Indonesia dalam Rupiah.

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
