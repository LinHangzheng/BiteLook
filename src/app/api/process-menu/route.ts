import { NextRequest } from 'next/server';
import { parseMenuImage, parseMultipleMenuImages } from '@/lib/google-ai/gemini-client';
import { generateDishImage } from '@/lib/google-ai/imagen-client';
import { validateInviteCode } from '@/lib/validate-invite';
import { processConcurrently } from '@/lib/utils/concurrency-limiter';
import type { MenuImage } from '@/types/menu';

export async function POST(request: NextRequest) {
  // Validate invite code first
  const isValidated = await validateInviteCode();
  if (!isValidated) {
    return new Response(JSON.stringify({ error: 'Unauthorized - Invalid or missing invite code' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();

  // Support both single and multi-image formats for backwards compatibility
  let images: MenuImage[];

  if (body.imageBase64 && body.mimeType) {
    // Single image format (old format)
    images = [{
      id: 'single',
      base64: body.imageBase64,
      mimeType: body.mimeType,
      order: 0,
    }];
  } else if (body.images && Array.isArray(body.images)) {
    // Multiple images format (new format)
    images = body.images;

    // Validate
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (images.length > 5) {
      return new Response(JSON.stringify({ error: 'Maximum 5 images allowed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Missing image data. Please provide either imageBase64 or images array.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        // Step 1: Extract text and parse menu (single or multiple images)
        send({
          type: 'progress',
          stage: 'parsing',
          currentImage: 1,
          totalImages: images.length,
          message: images.length > 1
            ? `Extracting text from ${images.length} menu pages...`
            : 'Extracting text from your menu...',
        });

        const parsedMenu = images.length > 1
          ? await parseMultipleMenuImages(images)
          : await parseMenuImage(images[0].base64, images[0].mimeType);

        // DEBUG: Log parsed menu summary to server console
        console.log(`\n========== MENU PARSING COMPLETE ==========`);
        console.log(`Total dishes detected: ${parsedMenu.items.length}`);
        console.log(`Language: ${parsedMenu.originalLanguage}`);
        console.log(`Dishes: ${parsedMenu.items.map(item => item.name).join(', ')}`);
        console.log(`===========================================\n`);

        send({
          type: 'parsed',
          data: parsedMenu,
        });

        // Step 2: Generate images for each dish (in parallel with concurrency limit)
        const totalItems = parsedMenu.items.length;

        send({
          type: 'progress',
          stage: 'generating',
          currentItem: 0,
          totalItems,
          message: `Generating images for ${totalItems} dishes (3 at a time)...`,
        });

        await processConcurrently(
          parsedMenu.items,
          async (item, index) => {
            const dishName = item.translatedName || item.name;

            try {
              const imageBase64Result = await generateDishImage(
                dishName,
                item.translatedDescription || item.description,
                item.ingredients
              );

              return imageBase64Result;
            } catch (err) {
              console.error(`Error generating image for ${dishName}:`, err);
              throw err;
            }
          },
          {
            concurrency: 3, // Only 3 concurrent requests for optimal performance
            onProgress: (completed, total, result) => {
              // Send result to client
              if (result.success && result.data) {
                send({
                  type: 'image',
                  itemIndex: result.index,
                  imageBase64: result.data,
                });
              } else {
                send({
                  type: 'image_error',
                  itemIndex: result.index,
                  error: result.error || 'Failed to generate image',
                });
              }

              // Update overall progress
              send({
                type: 'progress',
                stage: 'generating',
                currentItem: completed,
                totalItems: total,
                message: `Generated ${completed} of ${total} images...`,
              });
            },
            onError: (index, error) => {
              console.error(`Image generation failed for index ${index}:`, error);
            },
          }
        );

        send({
          type: 'progress',
          stage: 'complete',
          message: 'Done! Your visual menu is ready.',
        });

        send({ type: 'complete' });
      } catch (error) {
        console.error('Processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Processing failed';

        // Provide user-friendly error messages
        let userMessage = errorMessage;
        if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('quota')) {
          userMessage = 'API rate limit exceeded. Please wait a minute and try again, or check your Google AI billing settings.';
        } else if (errorMessage.includes('API_KEY_INVALID')) {
          userMessage = 'Invalid API key. Please check your GOOGLE_GENAI_API_KEY in .env.local';
        }

        send({
          type: 'error',
          message: userMessage,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
