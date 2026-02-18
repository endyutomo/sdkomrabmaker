import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { openAI } from 'genkitx-openai';

// Check if LiteLLM credentials are available
const litellmApiKey = process.env.LITELLM_API_KEY;
const litellmBaseUrl = process.env.LITELLM_BASE_URL;

// Only configure LiteLLM if credentials are available
const plugins = [googleAI()];

if (litellmApiKey && litellmBaseUrl) {
  try {
    plugins.push(
      openAI({
        apiKey: litellmApiKey,
        baseURL: litellmBaseUrl,
      })
    );
    console.log('LiteLLM provider configured successfully');
  } catch (error) {
    console.error('Failed to configure LiteLLM:', error);
  }
} else {
  console.warn('LiteLLM credentials not found. Only Google AI will be available.');
}

export const ai = genkit({
  plugins: plugins,
  model: litellmApiKey ? 'openai/gpt-4o' : 'google/gemini-1.5-flash',
});
