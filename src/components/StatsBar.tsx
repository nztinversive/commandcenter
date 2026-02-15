import { DashboardStats, formatTimeAgo } from '@/lib/projects';
import StatusDot from './StatusDot';

interface StatsBarProps {
  stats: DashboardStats;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onSearch?: (query: string) => void;
}

export default function StatsBar({ stats, isRefreshing, onRefresh, onSearch }: StatsBarProps) {
  return (
    <div className="bg-white/[0.02] border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        {/* Main Stats */}
        <div className="flex items-center gap-8">
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.totalProjects}
            </div>
            <div className="text-sm text-white/60">Total Projects</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StatusDot status="healthy" size="sm" />
              <span className="text-green-500 font-medium">{stats.healthyCount}</span>
              <span className="text-white/60 text-sm">Healthy</span>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusDot status="degraded" size="sm" />
              <span className="text-yellow-500 font-medium">{stats.degradedCount}</span>
              <span className="text-white/60 text-sm">Degraded</span>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusDot status="down" size="sm" />
              <span className="text-red-500 font-medium">{stats.downCount}</span>
              <span className="text-white/60 text-sm">Down</span>
            </div>
            
            <div className="flex items-center gap-2">
              <StatusDot status="unchecked" size="sm" />
              <span className="text-gray-500 font-medium">{stats.uncheckedCount}</span>
              <span className="text-white/60 text-sm">Unchecked</span>
            </div>
          </div>

          <div className="border-l border-white/10 pl-6">
            <div className="text-xl font-bold text-[#B8860B]">
              {stats.totalCommits24h}
            </div>
            <div className="text-sm text-white/60">Commits Today</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-white/40">
            Last check: {formatTimeAgo(stats.lastChecked)}
          </div>
          
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-[#B8860B]/20 text-[#B8860B] border border-[#B8860B]/30 rounded-lg hover:bg-[#B8860B]/30 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh All'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search projects..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full px-4 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#B8860B]/50 focus:bg-white/[0.08]"
          />
          <div className="absolute right-3 top-2.5 text-white/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <button 
          onClick={() => {
            // Open all GitHub repos
            const projects = JSON.parse(localStorage.getItem('projects') || '[]');
            projects.forEach((project: { githubRepo: string }) => {
              window.open(`https://github.com/${project.githubRepo}`, '_blank');
            });
          }}
          className="px-4 py-2 text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-colors text-sm"
        >
          Open All GitHub
        </button>
      </div>
    </div>
  );
}