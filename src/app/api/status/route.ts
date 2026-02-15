import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Project, HealthStatus } from '@/lib/projects';

// Cache health statuses for 30 seconds to avoid hammering endpoints
const cache = new Map<string, { data: HealthStatus; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

async function checkEndpointHealth(project: Project): Promise<HealthStatus> {
  const now = new Date().toISOString();
  
  if (!project.liveUrl) {
    return {
      projectId: project.id,
      status: 'unchecked',
      responseTimeMs: null,
      lastChecked: now,
      error: 'No live URL configured'
    };
  }

  // Check cache first
  const cacheKey = project.id;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = project.healthEndpoint 
      ? `${project.liveUrl}${project.healthEndpoint}`
      : project.liveUrl;

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Atlas-Command-Center/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    let status: HealthStatus['status'] = 'down';
    let error: string | null = null;

    if (response.ok) {
      if (responseTime > 2000) {
        status = 'degraded';
        error = `Slow response: ${responseTime}ms`;
      } else {
        status = 'healthy';
      }
    } else {
      status = 'down';
      error = `HTTP ${response.status}: ${response.statusText}`;
    }

    const healthStatus: HealthStatus = {
      projectId: project.id,
      status,
      responseTimeMs: responseTime,
      lastChecked: now,
      error
    };

    // Update cache
    cache.set(cacheKey, { data: healthStatus, timestamp: Date.now() });
    
    return healthStatus;
  } catch (error: unknown) {
    const healthStatus: HealthStatus = {
      projectId: project.id,
      status: 'down',
      responseTimeMs: null,
      lastChecked: now,
      error: error instanceof Error ? (error.name === 'AbortError' ? 'Timeout (>5s)' : error.message) : String(error)
    };

    // Cache error responses too (for shorter duration)
    cache.set(cacheKey, { data: healthStatus, timestamp: Date.now() });
    
    return healthStatus;
  }
}

export async function GET() {
  try {
    // Load projects
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = await fs.readFile(projectsPath, 'utf-8');
    const projects: Project[] = JSON.parse(projectsData);

    // Check health of all projects concurrently
    const healthChecks = await Promise.all(
      projects.map(project => checkEndpointHealth(project))
    );

    return NextResponse.json(healthChecks);
  } catch (error: unknown) {
    console.error('Error checking project health:', error);
    return NextResponse.json(
      { error: 'Failed to check project health' },
      { status: 500 }
    );
  }
}