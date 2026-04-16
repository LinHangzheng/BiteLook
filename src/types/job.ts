import type { ParsedMenu, MenuItem, ProcessingProgress } from './menu';

export type JobStatus = 'pending' | 'parsing' | 'generating' | 'completed' | 'failed';

export interface JobData {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: JobStatus;
  progress: ProcessingProgress | null;
  parsedMenu: ParsedMenu | null;
  menuItems: MenuItem[];
  error: string | null;
  inviteCode: string;
}

export interface GeneratedImageData {
  imageBase64: string | null;
  error?: string;
}

// 24 hours TTL for job data
export const JOB_TTL_SECONDS = 86400;
