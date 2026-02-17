'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export async function chatWithAI(prompt: string): Promise<string> {
    const { text } = await ai.generate(prompt);
    return text;
}
