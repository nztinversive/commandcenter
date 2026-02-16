import { ProjectWithStatus, formatTimeAgo, formatUptime, getStatusColor } from '@/lib/projects';
import StatusDot from './StatusDot';

interface ProjectCardProps {
  projectWithStatus: ProjectWithStatus;
}

export default function ProjectCard({ projectWithStatus }: ProjectCardProps) {
  const { project, health, github } = projectWithStatus;

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 hover:bg-white/[0.05] transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{project.emoji}</span>
          <h3 className="text-lg font-semibold text-white">{project.name}</h3>
        </div>
        <StatusDot status={health.status} size="md" pulse={health.status === 'healthy'} />
      </div>

      {/* Tech Stack */}
      <div className="flex flex-wrap gap-2 mb-4">
        {project.stack.map((tech, index) => (
          <span 
            key={index}
            className="px-2 py-1 text-xs bg-white/[0.08] text-white/70 rounded border border-white/10"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-white/60 text-sm mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Status Info */}
      <div className="mb-4">
        {project.liveUrl ? (
          <>
            <div className="text-[#B8860B] text-sm mb-1 truncate">
              <a 
                href={project.liveUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {project.liveUrl.replace(/^https?:\/\//, '')}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {health.responseTimeMs !== null && health.status !== 'down' && (
                <span className={getStatusColor(health.status)}>
                  {health.responseTimeMs}ms
                </span>
              )}
              <span className="text-white/60">·</span>
              <span className="text-white/60">
                {formatUptime(health)}
              </span>
            </div>
            {health.error && (
              <div className="text-red-400 text-xs mt-1">
                {health.error}
              </div>
            )}
          </>
        ) : (
          <div className="text-white/40 text-sm">
            Not deployed
          </div>
        )}
      </div>

      {/* Last Commit */}
      {github && (
        <div className="mb-4 p-3 bg-white/[0.02] rounded-lg border border-white/5">
          <div className="text-white/80 text-sm mb-1 line-clamp-2">
            {github.lastCommitMessage}
          </div>
          <div className="text-white/40 text-xs">
            {formatTimeAgo(github.lastCommitDate)}
            {github.commitCount24h > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-[#B8860B]/20 text-[#B8860B] rounded text-xs">
                +{github.commitCount24h} today
              </span>
            )}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-2">
        <a
          href={`https://github.com/${project.githubRepo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-xs bg-white/[0.08] text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded transition-colors"
        >
          GitHub
        </a>
        
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs bg-[#B8860B]/20 text-[#B8860B] hover:bg-[#B8860B]/30 border border-[#B8860B]/30 rounded transition-colors"
          >
            Live
          </a>
        )}
        
        {project.links.map((link, index) => (
          <a
            key={index}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs bg-white/[0.08] text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded transition-colors"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
