import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

function buildFoodPrompt(dishName: string, description: string, ingredients?: string[]): string {
  const ingredientList = ingredients?.length
    ? `, featuring ${ingredients.slice(0, 5).join(', ')}`
    : '';

  return `Professional food photography of "${dishName}": ${description}${ingredientList}.
Appetizing presentation, well-lit with soft natural lighting, high-quality restaurant style plating,
on an elegant ceramic plate with subtle garnish, shallow depth of field, warm color tones,
top-down or 45-degree angle shot, clean background, no text or watermarks.`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateDishImage(
  dishName: string,
  description: string,
  ingredients?: string[]
): Promise<string | null> {
  const prompt = buildFoodPrompt(dishName, description, ingredients);
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Generating image for: ${dishName} (attempt ${attempt + 1})`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
        config: {
          responseModalities: ['image', 'text'],
        },
      });

      // Check for inline image data in the response
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            console.log('Got image from Gemini');
            return part.inlineData.data;
          }
        }
      }

      console.log('No image in Gemini response');
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Image generation error (attempt ${attempt + 1}):`, errorMessage);

      // Check if it's a rate limit error
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 10000; // 10s, 20s, 40s
          console.log(`Rate limited. Waiting ${waitTime / 1000}s before retry...`);
          await sleep(waitTime);
          continue;
        }
      }

      // For other errors or final retry, return null
      return null;
    }
  }

  return null;
}
