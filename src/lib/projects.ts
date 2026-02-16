export interface Project {
  id: string;
  name: string;
  emoji: string;
  description: string;
  stack: string[];
  liveUrl: string | null;
  healthEndpoint: string | null;
  githubRepo: string;
  links: Array<{ label: string; url: string }>;
}

export interface HealthStatus {
  projectId: string;
  status: 'healthy' | 'degraded' | 'down' | 'unchecked';
  responseTimeMs: number | null;
  lastChecked: string;
  error: string | null;
}

export interface LiveHealthPing {
  url: string;
  status: 'up' | 'down';
  responseMs: number;
  statusCode: number | null;
}

export interface GitHubInfo {
  projectId: string;
  lastCommitMessage: string;
  lastCommitDate: string;
  commitCount24h: number;
}

export interface ProjectWithStatus {
  project: Project;
  health: HealthStatus;
  github: GitHubInfo | null;
}

export interface DashboardStats {
  totalProjects: number;
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  uncheckedCount: number;
  totalCommits24h: number;
  lastChecked: string;
}

// Utility functions
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function formatUptime(healthStatus: HealthStatus): string {
  if (healthStatus.status === 'down') {
    return `Down since ${formatTimeAgo(healthStatus.lastChecked)}`;
  }
  
  if (healthStatus.status === 'healthy' || healthStatus.status === 'degraded') {
    return `Up for ${formatTimeAgo(healthStatus.lastChecked)}`;
  }
  
  return 'Unknown';
}

export function getStatusColor(status: HealthStatus['status']): string {
  switch (status) {
    case 'healthy': return 'text-green-500';
    case 'degraded': return 'text-yellow-500';
    case 'down': return 'text-red-500';
    case 'unchecked': return 'text-gray-500';
    default: return 'text-gray-500';
  }
}

export function getStatusDotColor(status: HealthStatus['status']): string {
  switch (status) {
    case 'healthy': return 'bg-green-500';
    case 'degraded': return 'bg-yellow-500';
    case 'down': return 'bg-red-500';
    case 'unchecked': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}
