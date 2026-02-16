'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Project,
  HealthStatus,
  GitHubInfo,
  LiveHealthPing,
  ProjectWithStatus,
  DashboardStats
} from '@/lib/projects';
import ProjectCard from '@/components/ProjectCard';
import StatsBar from '@/components/StatsBar';

const normalizeUrl = (url: string) => url.replace(/\/+$/, '').toLowerCase();

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [healthData, setHealthData] = useState<HealthStatus[]>([]);
  const [githubData, setGithubData] = useState<GitHubInfo[]>([]);
  const [liveHealthData, setLiveHealthData] = useState<LiveHealthPing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [lastHealthCheckedAt, setLastHealthCheckedAt] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Load projects data
  useEffect(() => {
    fetch('/data/projects.json')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        // Store in localStorage for other components
        localStorage.setItem('projects', JSON.stringify(data));
      })
      .catch(err => console.error('Failed to load projects:', err));
  }, []);

  // Keep a lightweight timer for "Last checked: X seconds ago"
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch health and GitHub data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [healthRes, githubRes, liveHealthRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/github'),
        fetch('/api/health')
      ]);

      if (healthRes.ok) {
        const statusData: HealthStatus[] = await healthRes.json();
        setHealthData(statusData);
      }

      if (githubRes.ok) {
        const githubPayload: GitHubInfo[] = await githubRes.json();
        setGithubData(githubPayload);
      }

      if (liveHealthRes.ok) {
        const liveHealthPayload: LiveHealthPing[] = await liveHealthRes.json();
        setLiveHealthData(liveHealthPayload);
        setLastHealthCheckedAt(new Date().toISOString());
      }

      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const liveHealthByUrl = useMemo(() => {
    const entries = liveHealthData.map((ping) => [normalizeUrl(ping.url), ping] as const);
    return new Map<string, LiveHealthPing>(entries);
  }, [liveHealthData]);

  // Combine project data with health and GitHub info
  const projectsWithStatus: ProjectWithStatus[] = projects.map(project => {
    const fallbackHealth = healthData.find(h => h.projectId === project.id) || {
      projectId: project.id,
      status: 'unchecked' as const,
      responseTimeMs: null,
      lastChecked: new Date().toISOString(),
      error: 'Not checked yet'
    };

    const livePing = project.liveUrl
      ? liveHealthByUrl.get(normalizeUrl(project.liveUrl))
      : undefined;

    const health: HealthStatus = livePing
      ? {
          projectId: project.id,
          status: livePing.status === 'up' ? 'healthy' : 'down',
          responseTimeMs: livePing.responseMs,
          lastChecked: lastHealthCheckedAt ?? fallbackHealth.lastChecked,
          error: livePing.status === 'down'
            ? (livePing.statusCode ? `HTTP ${livePing.statusCode}` : 'Service unreachable')
            : null
        }
      : fallbackHealth;

    const github = githubData.find(g => g.projectId === project.id) || null;

    return { project, health, github };
  });

  // Filter projects based on search query
  const filteredProjects = projectsWithStatus.filter(({ project }) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.stack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalProjects: projects.length,
    healthyCount: healthData.filter(h => h.status === 'healthy').length,
    degradedCount: healthData.filter(h => h.status === 'degraded').length,
    downCount: healthData.filter(h => h.status === 'down').length,
    uncheckedCount: healthData.filter(h => h.status === 'unchecked').length,
    totalCommits24h: githubData.reduce((sum, g) => sum + g.commitCount24h, 0),
    lastChecked: lastUpdate
  };
  const healthAgeSeconds = lastHealthCheckedAt
    ? Math.max(0, Math.floor((nowMs - new Date(lastHealthCheckedAt).getTime()) / 1000))
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030810] flex items-center justify-center">
        <div className="text-white text-lg">Loading Atlas Command Center...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030810]">
      {/* Stats Bar */}
      <StatsBar
        stats={stats}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchData(true)}
        onSearch={setSearchQuery}
      />

      {/* Main Content */}
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="text-white/60 text-sm">
            {searchQuery ? (
              <>
              Showing {filteredProjects.length} of {projects.length} projects
              {searchQuery && ` matching "${searchQuery}"`}
              </>
            ) : (
              ''
            )}
          </span>
          <span className="text-white/40 text-xs">
            Last checked: {healthAgeSeconds === null ? 'Not checked yet' : `${healthAgeSeconds}s ago`}
          </span>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(({ project, health, github }) => (
            <ProjectCard
              key={project.id}
              projectWithStatus={{ project, health, github }}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <div className="text-white/60 text-lg mb-2">No projects found</div>
            <div className="text-white/40 text-sm">
              Try adjusting your search terms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
