import { buildLlmsTxt } from '@/lib/seo/llms-txt';
import { getFeatureFlags } from '@/lib/supabase/feature-flags-server';

export const revalidate = 3600;

export async function GET() {
  const flags = await getFeatureFlags();
  return new Response(buildLlmsTxt(flags), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
    },
  });
}
