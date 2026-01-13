import { GoogleGenAI } from '@google/genai';
import type { ParsedMenu } from '@/types/menu';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

const menuSchema = {
  type: 'object',
  properties: {
    originalLanguage: {
      type: 'string',
      description: 'The detected language of the menu',
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The dish name in its original language',
          },
          translatedName: {
            type: 'string',
            description: 'English translation of the dish name (if original is not English)',
          },
          description: {
            type: 'string',
            description: 'A brief description of the dish based on available information',
          },
          translatedDescription: {
            type: 'string',
            description: 'English translation of the description (if original is not English)',
          },
          price: {
            type: 'string',
            description: 'The price as shown on the menu',
          },
          category: {
            type: 'string',
            description: 'Menu category (e.g., Appetizers, Main Course, Desserts)',
          },
          ingredients: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key ingredients if visible or inferable from the dish name',
          },
        },
        required: ['name', 'description'],
      },
    },
  },
  required: ['originalLanguage', 'items'],
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function parseMenuImage(
  imageBase64: string,
  mimeType: string,
  maxRetries = 3
): Promise<ParsedMenu> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', // Using 2.0-flash
        contents: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: `Analyze this restaurant menu image carefully. Extract all menu items you can see.

For each dish:
1. Extract the exact dish name as written
2. If the menu is not in English, provide an English translation
3. Write a brief, appetizing description of the dish (what it likely contains and how it's prepared)
4. Include the price if visible
5. Categorize the dish (Appetizers, Main Course, Soups, Salads, Desserts, Beverages, etc.)
6. List key ingredients you can identify or reasonably infer

Be thorough - extract EVERY dish from the menu. If text is partially visible or unclear, make your best interpretation.`,
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: menuSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('No response from Gemini');
      }

      return JSON.parse(text) as ParsedMenu;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a rate limit error (429)
      if (lastError.message.includes('429') || lastError.message.includes('RESOURCE_EXHAUSTED')) {
        const waitTime = Math.pow(2, attempt) * 5000; // Exponential backoff: 5s, 10s, 20s
        console.log(`Rate limited. Retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }

      // For other errors, throw immediately
      throw lastError;
    }
  }

  throw lastError || new Error('Failed to parse menu after retries');
}
