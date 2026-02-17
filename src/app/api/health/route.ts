import { NextResponse } from 'next/server';

const HEALTH_URLS = [
  'https://atlas-taskboard.onrender.com',
  'https://contentops.onrender.com',
  'https://atlas-command-center.onrender.com',
  'https://fw-3d-walkthrough.onrender.com',
  'https://fw-image-studio.onrender.com',
  'https://fw-salesmap.onrender.com',
  'https://fw-sitechecker.onrender.com',
  'https://homedesign-ai.onrender.com'
] as const;

const REQUEST_TIMEOUT_MS = 10_000;

type LiveHealthResponse = {
  url: string;
  status: 'up' | 'down';
  responseMs: number;
  statusCode: number | null;
};

async function pingUrl(url: string): Promise<LiveHealthResponse> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Atlas-Command-Center/1.0'
      }
    });

    return {
      url,
      status: response.ok ? 'up' : 'down',
      responseMs: Date.now() - startedAt,
      statusCode: response.status
    };
  } catch {
    return {
      url,
      status: 'down',
      responseMs: Date.now() - startedAt,
      statusCode: null
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  try {
    const healthChecks = await Promise.all(HEALTH_URLS.map((url) => pingUrl(url)));

    return NextResponse.json(healthChecks, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    console.error('Error running live health checks:', error);

    return NextResponse.json(
      { error: 'Failed to run live health checks' },
      { status: 500 }
    );
  }
}
