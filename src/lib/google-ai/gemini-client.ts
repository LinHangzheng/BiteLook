import { GoogleGenAI } from '@google/genai';
import type { ParsedMenu, MenuImage } from '@/types/menu';
import { extractTextFromImage } from '@/lib/utils/ocr';

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

  // Step 1: Extract raw text using OCR (with retry)
  let ocrText = '';
  try {
    ocrText = await extractTextFromImage(imageBase64, mimeType);
    if (!ocrText) {
      console.warn('⚠️  Text extraction returned empty, will proceed with image-only parsing');
    }
  } catch (error) {
    console.error('Text extraction error, will proceed with image-only parsing:', error);
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Using Gemini 3 Flash preview
        contents: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: `You are an expert at analyzing restaurant menu images with deep cultural and culinary knowledge.

${ocrText ? `\n========== RAW TEXT EXTRACTED FROM IMAGE ==========\n${ocrText}\n===================================================\n\nIMPORTANT: Use this extracted text as your PRIMARY source for dish names, prices, and text content. The text above was extracted via OCR and represents the exact words on the menu. Cross-reference with the image to understand layout and structure.\n\n` : ''}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

0. USE OCR TEXT AS PRIMARY SOURCE:
   - The raw text above was extracted via OCR from the menu image
   - Use this text as your PRIMARY source for exact dish names, prices, and descriptions
   - The OCR text contains the EXACT words from the menu - copy them precisely
   - Use the image for understanding layout, structure, and which text belongs to which dish
   - If there's a discrepancy between what you see in the image and the OCR text, TRUST THE OCR TEXT

1. MENU STRUCTURE - VERY IMPORTANT:
   - First, identify if the menu has section headers or category labels (like "Appetizers", "Chef's Specials", "Signature Dishes", "Entrées", etc.)
   - These headers are usually larger text, bold, or visually separated from dish names
   - PRESERVE THE EXACT CATEGORY NAME as written on the menu
   - Each dish should be assigned to the category/section where it appears on the menu
   - If a dish is under a "Chef's Specials" header, categorize it as "Chef's Specials"
   - If no clear category header is visible for a dish, only then use standard categories

2. DISH NAMES - EXACT EXTRACTION:
   - Extract the EXACT dish name as written on the menu
   - Do not add or remove words
   - Preserve capitalization as shown (Title Case, UPPERCASE, etc.)
   - Do not include prices, descriptions, or other text in the name field
   - The name should be exactly what a customer would say when ordering

3. COMPLETENESS: Extract EVERY SINGLE dish visible on this menu. Do not skip any items, even if:
   - Text is partially visible, blurry, or at an angle
   - The dish name seems similar to others
   - Quality is low or there are many items on the page
   - Use context clues and adjacent text to infer complete names for partially obscured text

4. CULTURAL CONTEXT:
   - Identify the cuisine type (Chinese, Japanese, Italian, Thai, American, etc.)
   - Use your knowledge of that cuisine to:
     * Provide accurate, culturally-aware translations (if non-English)
     * Infer likely ingredients based on traditional recipes
     * Describe typical preparation methods
   - Example: "宫保鸡丁" → "Kung Pao Chicken" not "Palace Guard Chicken Pieces"

5. TRANSLATIONS (for non-English menus):
   - If menu is not in English, provide natural translations using common English names
   - Preserve original formatting and special characters
   - Use well-known dish names when applicable

6. DESCRIPTIONS (2-3 sentences):
   - Include main ingredients, cooking method, flavor profile, and presentation
   - Use cultural knowledge to fill gaps in visible information
   - Make descriptions vivid and appetizing

7. INGREDIENTS (5-8 per dish):
   - List in order of prominence
   - Include cooking methods if culturally significant (e.g., "wok-fried", "steamed")
   - Use knowledge of the cuisine to identify typical ingredients

8. CATEGORIZATION - FOLLOW THIS ORDER:
   PRIORITY 1: Use the exact category/section header from the menu (e.g., "Chef's Specials", "House Favorites", "Signature Dishes")
   PRIORITY 2: If no header exists, infer from menu position and dish type
   PRIORITY 3: Only use these standard categories as last resort: Appetizers, Soups, Salads, Main Course, Seafood, Meat, Vegetarian, Noodles & Rice, Desserts, Beverages

9. PRICES:
   - Extract exact price as shown (include currency symbol)
   - Keep price ranges (e.g., "$10-15")
   - Leave empty if not visible (don't guess)
   - Never include price in the dish name

Extract every dish with complete, accurate information, preserving the menu's original structure and categories.`,
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

      const parsedMenu = JSON.parse(text) as ParsedMenu;

      // DEBUG: Log what the LLM extracted
      console.log('\n========== LLM MENU EXTRACTION DEBUG ==========');
      console.log('Detected Language:', parsedMenu.originalLanguage);
      console.log('Total Items Detected:', parsedMenu.items.length);
      console.log('\nExtracted Items:');
      parsedMenu.items.forEach((item, idx) => {
        console.log(`\n--- Dish ${idx + 1} ---`);
        console.log('Name:', item.name);
        console.log('Translated Name:', item.translatedName || 'N/A');
        console.log('Description:', item.description?.substring(0, 100) + '...');
        console.log('Price:', item.price || 'N/A');
        console.log('Category:', item.category || 'N/A');
        console.log('Ingredients:', item.ingredients?.join(', ') || 'N/A');
      });
      console.log('\n==============================================\n');

      return parsedMenu;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMsg = lastError.message;

      console.error(`❌ Parsing attempt ${attempt + 1}/${maxRetries} failed:`, errorMsg);

      // Check if it's a rate limit error (429)
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt) * 5000; // Exponential backoff: 5s, 10s, 20s
          console.log(`⚠️  Rate limited. Retrying in ${waitTime / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(waitTime);
          continue;
        }
      }

      // Check for timeout errors
      if (errorMsg.includes('timeout') || errorMsg.includes('DEADLINE_EXCEEDED')) {
        if (attempt < maxRetries - 1) {
          console.log(`⚠️  Request timeout. Retrying... (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(3000);
          continue;
        }
      }

      // For other errors, throw immediately
      throw lastError;
    }
  }

  throw lastError || new Error('Failed to parse menu after retries');
}

export async function parseMultipleMenuImages(
  images: MenuImage[],
  maxRetries = 3
): Promise<ParsedMenu> {
  const parsedPages: ParsedMenu[] = [];
  let detectedLanguage: string | null = null;

  // Parse each image sequentially to maintain context
  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    // Step 1: Extract raw text using OCR for this page
    console.log(`Extracting text from page ${i + 1}/${images.length}...`);
    const ocrText = await extractTextFromImage(image.base64, image.mimeType);

    // Build context info from previous pages
    const contextInfo = parsedPages.length > 0
      ? `\n\nCONTEXT: Previous pages contained ${parsedPages.reduce((sum, p) => sum + p.items.length, 0)} dishes. Continue extracting dishes from this page (page ${i + 1} of ${images.length}), carefully avoiding duplicates of dishes you've already seen.`
      : images.length > 1
      ? `\n\nCONTEXT: This is page ${i + 1} of ${images.length} from a multi-page menu.`
      : '';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              mimeType: image.mimeType,
              data: image.base64,
            },
          },
          {
            text: `You are an expert at analyzing restaurant menu images with deep cultural and culinary knowledge.

${ocrText ? `\n========== RAW TEXT EXTRACTED FROM IMAGE (PAGE ${i + 1}) ==========\n${ocrText}\n===================================================\n\nIMPORTANT: Use this extracted text as your PRIMARY source for dish names, prices, and text content. The text above was extracted via OCR and represents the exact words on the menu. Cross-reference with the image to understand layout and structure.\n\n` : ''}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

0. USE OCR TEXT AS PRIMARY SOURCE:
   - The raw text above was extracted via OCR from the menu image
   - Use this text as your PRIMARY source for exact dish names, prices, and descriptions
   - The OCR text contains the EXACT words from the menu - copy them precisely
   - Use the image for understanding layout, structure, and which text belongs to which dish
   - If there's a discrepancy between what you see in the image and the OCR text, TRUST THE OCR TEXT

1. MENU STRUCTURE - VERY IMPORTANT:
   - First, identify if the menu has section headers or category labels (like "Appetizers", "Chef's Specials", "Signature Dishes", "Entrées", etc.)
   - These headers are usually larger text, bold, or visually separated from dish names
   - PRESERVE THE EXACT CATEGORY NAME as written on the menu
   - Each dish should be assigned to the category/section where it appears on the menu
   - If a dish is under a "Chef's Specials" header, categorize it as "Chef's Specials"
   - If no clear category header is visible for a dish, only then use standard categories

2. DISH NAMES - EXACT EXTRACTION:
   - Extract the EXACT dish name as written on the menu
   - Do not add or remove words
   - Preserve capitalization as shown (Title Case, UPPERCASE, etc.)
   - Do not include prices, descriptions, or other text in the name field
   - The name should be exactly what a customer would say when ordering

3. COMPLETENESS: Extract EVERY SINGLE dish visible on this menu. Do not skip any items, even if:
   - Text is partially visible, blurry, or at an angle
   - The dish name seems similar to others
   - Quality is low or there are many items on the page
   - Use context clues and adjacent text to infer complete names for partially obscured text

4. CULTURAL CONTEXT:
   - Identify the cuisine type (Chinese, Japanese, Italian, Thai, American, etc.)
   - Use your knowledge of that cuisine to:
     * Provide accurate, culturally-aware translations (if non-English)
     * Infer likely ingredients based on traditional recipes
     * Describe typical preparation methods
   - Example: "宫保鸡丁" → "Kung Pao Chicken" not "Palace Guard Chicken Pieces"

5. TRANSLATIONS (for non-English menus):
   - If menu is not in English, provide natural translations using common English names
   - Preserve original formatting and special characters
   - Use well-known dish names when applicable

6. DESCRIPTIONS (2-3 sentences):
   - Include main ingredients, cooking method, flavor profile, and presentation
   - Use cultural knowledge to fill gaps in visible information
   - Make descriptions vivid and appetizing

7. INGREDIENTS (5-8 per dish):
   - List in order of prominence
   - Include cooking methods if culturally significant (e.g., "wok-fried", "steamed")
   - Use knowledge of the cuisine to identify typical ingredients

8. CATEGORIZATION - FOLLOW THIS ORDER:
   PRIORITY 1: Use the exact category/section header from the menu (e.g., "Chef's Specials", "House Favorites", "Signature Dishes")
   PRIORITY 2: If no header exists, infer from menu position and dish type
   PRIORITY 3: Only use these standard categories as last resort: Appetizers, Soups, Salads, Main Course, Seafood, Meat, Vegetarian, Noodles & Rice, Desserts, Beverages

9. PRICES:
   - Extract exact price as shown (include currency symbol)
   - Keep price ranges (e.g., "$10-15")
   - Leave empty if not visible (don't guess)
   - Never include price in the dish name

Extract every dish with complete, accurate information, preserving the menu's original structure and categories.${contextInfo}`,
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

      const parsedPage = JSON.parse(text) as ParsedMenu;

      // DEBUG: Log what was extracted from this page
      console.log(`\n========== PAGE ${i + 1} EXTRACTION DEBUG ==========`);
      console.log('Detected Language:', parsedPage.originalLanguage);
      console.log('Items on this page:', parsedPage.items.length);
      parsedPage.items.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} ${item.price ? '(' + item.price + ')' : ''}`);
      });
      console.log('==============================================\n');

      // Track language consistency
      if (i === 0) {
        detectedLanguage = parsedPage.originalLanguage;
      } else if (parsedPage.originalLanguage !== detectedLanguage) {
        console.warn(`Language mismatch: page 1 is ${detectedLanguage}, page ${i + 1} is ${parsedPage.originalLanguage}`);
      }

      parsedPages.push(parsedPage);
      console.log(`Successfully parsed page ${i + 1}/${images.length}: ${parsedPage.items.length} dishes found`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Handle rate limits with retry
      if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        const waitTime = Math.pow(2, 0) * 5000;
        console.log(`Rate limited on page ${i + 1}. Waiting ${waitTime / 1000}s before retry...`);
        await sleep(waitTime);
        i--; // Retry this page
        continue;
      }

      throw new Error(`Failed to parse page ${i + 1}: ${errorMessage}`);
    }
  }

  // Merge all pages
  return mergeMenuPages(parsedPages, detectedLanguage || 'Unknown');
}

function mergeMenuPages(pages: ParsedMenu[], language: string): ParsedMenu {
  const allItems: ParsedMenu['items'] = [];
  const seenNames = new Set<string>();

  for (const page of pages) {
    for (const item of page.items) {
      // Create unique key for deduplication
      // Normalize: lowercase, remove spaces/punctuation for fuzzy matching
      const normalizedName = (item.translatedName || item.name)
        .toLowerCase()
        .replace(/[\s\-_.,!?()]/g, '');

      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName);
        allItems.push(item);
      } else {
        console.log(`Skipping duplicate dish: ${item.name} (${item.translatedName || 'no translation'})`);
      }
    }
  }

  console.log(`Merged ${pages.length} pages: ${allItems.length} unique dishes (${pages.reduce((sum, p) => sum + p.items.length, 0) - allItems.length} duplicates removed)`);

  return {
    originalLanguage: language,
    items: allItems,
  };
}
