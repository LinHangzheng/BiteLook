import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { validateSession } from '@/lib/validate-session';
import { corsHeaders } from '@/lib/cors';
import type { JobData, GeneratedImageData } from '@/types/job';

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

  const session = await validateSession();
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or expired session' },
      { status: 401, headers: corsHeaders }
    );
  }

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
  // Migration fallback: old jobs have inviteCode instead of userId
  const jobOwner = job.userId || (job as JobData & { inviteCode?: string }).inviteCode;
  const isOwner = job.userId
    ? job.userId === session.userId
    : jobOwner === session.inviteCode;

  if (!isOwner) {
    return NextResponse.json(
      { error: 'Unauthorized - Job belongs to different user' },
      { status: 403, headers: corsHeaders }
    );
  }

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
    }
  }

  return NextResponse.json(response, { headers: corsHeaders });
}
