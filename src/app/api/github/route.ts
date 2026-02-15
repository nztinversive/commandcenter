import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Project, GitHubInfo } from '@/lib/projects';

// Cache GitHub data for 5 minutes to respect rate limits
const cache = new Map<string, { data: GitHubInfo; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchGitHubInfo(project: Project): Promise<GitHubInfo> {
  // Check cache first
  const cacheKey = project.id;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const [owner, repo] = project.githubRepo.split('/');
    const baseUrl = 'https://api.github.com';
    
    // Get latest commits (last 24 hours)
    const since = new Date();
    since.setHours(since.getHours() - 24);
    
    const commitsUrl = `${baseUrl}/repos/${owner}/${repo}/commits?since=${since.toISOString()}&per_page=100`;
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Atlas-Command-Center/1.0'
    };
    
    // Add authorization if token is available
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const commitsResponse = await fetch(commitsUrl, { headers });
    
    if (!commitsResponse.ok) {
      throw new Error(`GitHub API error: ${commitsResponse.status}`);
    }
    
    const commits = await commitsResponse.json();
    
    // Get latest commit info
    const latestCommitUrl = `${baseUrl}/repos/${owner}/${repo}/commits/HEAD`;
    const latestResponse = await fetch(latestCommitUrl, { headers });
    
    let lastCommitMessage = 'No commits';
    let lastCommitDate = new Date().toISOString();
    
    if (latestResponse.ok) {
      const latestCommit = await latestResponse.json();
      lastCommitMessage = latestCommit.commit.message.split('\n')[0]; // First line only
      lastCommitDate = latestCommit.commit.author.date;
    }

    const githubInfo: GitHubInfo = {
      projectId: project.id,
      lastCommitMessage,
      lastCommitDate,
      commitCount24h: Array.isArray(commits) ? commits.length : 0
    };

    // Update cache
    cache.set(cacheKey, { data: githubInfo, timestamp: Date.now() });
    
    return githubInfo;
  } catch (error: unknown) {
    console.error(`GitHub API error for ${project.githubRepo}:`, error);
    
    // Return placeholder data on error
    const githubInfo: GitHubInfo = {
      projectId: project.id,
      lastCommitMessage: 'API Error',
      lastCommitDate: new Date().toISOString(),
      commitCount24h: 0
    };

    // Cache error responses for shorter duration
    cache.set(cacheKey, { data: githubInfo, timestamp: Date.now() });
    
    return githubInfo;
  }
}

export async function GET() {
  try {
    // Load projects
    const projectsPath = path.join(process.cwd(), 'data', 'projects.json');
    const projectsData = await fs.readFile(projectsPath, 'utf-8');
    const projects: Project[] = JSON.parse(projectsData);

    // Fetch GitHub info for all projects concurrently
    const githubInfos = await Promise.all(
      projects.map(project => fetchGitHubInfo(project))
    );

    return NextResponse.json(githubInfos);
  } catch (error: unknown) {
    console.error('Error fetching GitHub data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub data' },
      { status: 500 }
    );
  }
}