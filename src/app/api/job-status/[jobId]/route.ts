import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { getInviteCode } from '@/lib/validate-invite';
import type { JobData, GeneratedImageData } from '@/types/job';

// CORS headers for Capacitor native app requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Invite-Code',
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { jobId } = await params;

  // Get invite code from cookie or header (for Capacitor native apps)
  const inviteCode = await getInviteCode();

  if (!inviteCode) {
    return NextResponse.json(
      { error: 'Unauthorized - Missing invite code' },
      { status: 401, headers: corsHeaders }
    );
  }

  // Fetch job from KV
  let job: JobData | null = null;
  try {
    job = await kv.get<JobData>(`job:${jobId}`);
  } catch (error) {
    console.error('Failed to fetch job from KV:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job status' },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found or expired' },
      { status: 404, headers: corsHeaders }
    );
  }

  // Verify job belongs to this user
  if (job.inviteCode !== inviteCode.toUpperCase()) {
    return NextResponse.json(
      { error: 'Unauthorized - Job belongs to different user' },
      { status: 403, headers: corsHeaders }
    );
  }

  // Build response
  const response: {
    jobId: string;
    status: string;
    progress: typeof job.progress;
    parsedMenu: typeof job.parsedMenu;
    menuItems: typeof job.menuItems;
    generatedImages: Array<{ itemIndex: number; imageBase64: string | null; error?: string }>;
    error: string | null;
  } = {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    parsedMenu: job.parsedMenu,
    menuItems: job.menuItems,
    generatedImages: [],
    error: job.error,
  };

  // If we have a parsed menu, fetch all generated images
  if (job.parsedMenu && job.parsedMenu.items.length > 0) {
    try {
      const imagePromises = job.parsedMenu.items.map(async (_, index) => {
        const imageData = await kv.get<GeneratedImageData>(
          `job:${jobId}:images:${index}`
        );
        return {
          itemIndex: index,
          imageBase64: imageData?.imageBase64 || null,
          error: imageData?.error,
        };
      });

      response.generatedImages = await Promise.all(imagePromises);
    } catch (error) {
      console.error('Failed to fetch generated images:', error);
      // Continue without images - job status is still useful
    }
  }

  return NextResponse.json(response, { headers: corsHeaders });
}
