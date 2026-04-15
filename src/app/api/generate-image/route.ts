import { NextRequest, NextResponse } from 'next/server';
import { generateDishImage } from '@/lib/google-ai/imagen-client';
import { validateInviteCode } from '@/lib/validate-invite';

export async function POST(request: NextRequest) {
  const isValidated = await validateInviteCode();
  if (!isValidated) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing invite code' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { dishName, description, ingredients } = body;

  if (!dishName || !description) {
    return NextResponse.json(
      { error: 'Missing required fields: dishName and description' },
      { status: 400 }
    );
  }

  try {
    const imageBase64 = await generateDishImage(dishName, description, ingredients);

    return NextResponse.json({ imageBase64 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Image generation failed';
    console.error('On-demand image generation error:', errorMessage);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait and try again.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    );
  }
}
