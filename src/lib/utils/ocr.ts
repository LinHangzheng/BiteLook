import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY!,
});

export async function extractTextFromImage(
  imageBase64: string,
  mimeType: string
): Promise<string> {
  try {
    console.log('Starting text extraction with Gemini...');

    // Use Gemini to extract raw text only (no parsing)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        {
          text: `Extract ALL text from this menu image. Return ONLY the raw text exactly as it appears, preserving:
- Exact spelling and capitalization
- Line breaks and spacing (use \\n for new lines)
- Numbers, prices, and special characters
- Section headers and categories

Output format: Plain text only, no JSON, no formatting, no interpretation. Just copy every single word you see from top to bottom, left to right.

Example output:
APPETIZERS
Spring Rolls $8.99
Fresh and crispy
Chicken Wings $12.99

MAIN COURSE
Grilled Salmon $24.99
...etc

Extract everything now:`,
        },
      ],
    });

    const extractedText = response.text || '';

    console.log(`\n========== TEXT EXTRACTION COMPLETE ==========`);
    console.log(`Extracted ${extractedText.length} characters`);
    console.log(`Text preview (first 500 chars):`);
    console.log(extractedText.substring(0, 500));
    console.log(`============================================\n`);

    return extractedText;
  } catch (error) {
    console.error('Text extraction failed:', error);
    return ''; // Return empty string if extraction fails, LLM will work without it
  }
}
