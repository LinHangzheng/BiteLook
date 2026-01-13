import { NextRequest } from 'next/server';
import { parseMenuImage } from '@/lib/google-ai/gemini-client';
import { generateDishImage } from '@/lib/google-ai/imagen-client';

export async function POST(request: NextRequest) {
  const { imageBase64, mimeType } = await request.json();

  if (!imageBase64 || !mimeType) {
    return new Response(JSON.stringify({ error: 'Missing image data' }), {
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
        // Step 1: Parse menu
        send({
          type: 'progress',
          stage: 'parsing',
          message: 'Analyzing your menu...',
        });

        const parsedMenu = await parseMenuImage(imageBase64, mimeType);

        send({
          type: 'parsed',
          data: parsedMenu,
        });

        // Step 2: Generate images for each dish
        const totalItems = parsedMenu.items.length;

        send({
          type: 'progress',
          stage: 'generating',
          currentItem: 0,
          totalItems,
          message: `Generating images for ${totalItems} dishes...`,
        });

        for (let i = 0; i < totalItems; i++) {
          const item = parsedMenu.items[i];
          const dishName = item.translatedName || item.name;

          send({
            type: 'progress',
            stage: 'generating',
            currentItem: i + 1,
            totalItems,
            message: `Creating image for "${dishName}"...`,
          });

          try {
            const imageBase64Result = await generateDishImage(
              dishName,
              item.translatedDescription || item.description,
              item.ingredients
            );

            if (imageBase64Result) {
              send({
                type: 'image',
                itemIndex: i,
                imageBase64: imageBase64Result,
              });
            } else {
              send({
                type: 'image_error',
                itemIndex: i,
                error: 'Failed to generate image',
              });
            }
          } catch (err) {
            console.error(`Error generating image for ${dishName}:`, err);
            send({
              type: 'image_error',
              itemIndex: i,
              error: 'Failed to generate image',
            });
          }
        }

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
