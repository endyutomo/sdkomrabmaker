'use server';
/**
 * @fileOverview This file implements a Genkit flow for suggesting Bill of Quantities (BOQ) items in Indonesian.
 *
 * - suggestBoqItems - A function that suggests BOQ items based on project type and specifications.
 * - BoqItemSuggestionInput - The input type for the suggestBoqItems function.
 * - BoqItemSuggestionOutput - The return type for the suggestBoqItems function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BoqItemSuggestionInputSchema = z.object({
  projectType: z
    .string()
    .describe('The type of project (e.g., "residential building", "road construction").'),
  specifications: z
    .string()
    .describe('Detailed specifications or requirements for the project.'),
});
export type BoqItemSuggestionInput = z.infer<typeof BoqItemSuggestionInputSchema>;

const BoqItemSchema = z.object({
  name: z
    .string()
    .describe('The name or description of the item in Indonesian (e.g., "Pondasi beton", "Pasangan bata dinding").'),
  unit: z
    .string()
    .describe('The Indonesian unit of measurement (e.g., "m3", "m2", "ls", "titik").'),
  quantity: z
    .number()
    .describe('A suggested quantity estimate.')
    .default(1),
  unitPrice: z
    .number()
    .describe('A suggested unit price in IDR.')
    .default(0),
});

const BoqCategorySchema = z.object({
  name: z
    .string()
    .describe('The name of the category in Indonesian (e.g., "Pekerjaan Tanah", "Pekerjaan Struktur").'),
  items: z.array(BoqItemSchema).describe('A list of items within this category.'),
});

const BoqItemSuggestionOutputSchema = z.object({
  categories: z
    .array(BoqCategorySchema)
    .describe('A list of categorized items for the project.'),
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
  prompt: `Anda adalah seorang Ahli Quantity Surveyor profesional di Indonesia. Tugas Anda adalah menghasilkan Rencana Anggaran Biaya (RAB) yang komprehensif berdasarkan tipe proyek dan spesifikasi yang diberikan.

Gunakan Bahasa Indonesia yang formal dan teknis untuk semua nama item, kategori, dan satuan (misalnya m3, m2, kg, m', ls).

Kategorikan item RAB secara logis (Pekerjaan Persiapan, Tanah, Struktur, Arsitektur, dll). Berikan nama item, satuan, estimasi volume yang masuk akal, dan estimasi harga satuan dalam Rupiah.

Tipe Proyek: {{{projectType}}}
Spesifikasi: {{{specifications}}}

Mohon berikan output dalam format JSON sesuai skema berikut:`,
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
