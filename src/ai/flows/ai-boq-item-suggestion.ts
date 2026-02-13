'use server';
/**
 * @fileOverview This file implements a Genkit flow for suggesting Bill of Quantities (BOQ) items.
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
    .describe('The name or description of the BOQ item (e.g., "Concrete footing", "Brickwork to walls").'),
  unit: z
    .string()
    .describe('The unit of measurement for the item (e.g., "m3", "m2", "ls", "nr").'),
  quantity: z
    .number()
    .describe(
      'A suggested quantity for the item. Provide a reasonable estimate if no specific details are given, otherwise default to 1 if estimation is impossible.'
    )
    .default(1),
  unitPrice: z
    .number()
    .describe(
      'A suggested unit price for the item. Provide a reasonable estimate if no specific details are given, otherwise default to 0.'
    )
    .default(0),
});

const BoqCategorySchema = z.object({
  name: z
    .string()
    .describe('The name of the category (e.g., "Foundations", "Superstructure", "Finishes").'),
  items: z.array(BoqItemSchema).describe('A list of BOQ items within this category.'),
});

const BoqItemSuggestionOutputSchema = z.object({
  categories: z
    .array(BoqCategorySchema)
    .describe('A list of categorized BOQ items for the project.'),
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
  prompt: `You are an expert Quantity Surveyor. Your task is to generate a comprehensive Bill of Quantities (BOQ) for a construction project based on the provided project type and specifications.

Categorize the BOQ items logically and for each item, provide a name, a suitable unit of measurement, a suggested quantity, and a suggested unit price.

Project Type: {{{projectType}}}
Specifications: {{{specifications}}}

Please provide the output in JSON format, strictly adhering to the following schema:`,
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
      throw new Error('No output received from the BOQ item suggestion prompt.');
    }
    return output;
  }
);
