import { HealthStatus, getStatusDotColor } from '@/lib/projects';

interface StatusDotProps {
  status: HealthStatus['status'];
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export default function StatusDot({ status, size = 'md', pulse = false }: StatusDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const pulseClass = pulse && status === 'healthy' ? 'animate-pulse' : '';

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${getStatusDotColor(status)}
        ${pulseClass}
        rounded-full
        flex-shrink-0
      `}
    />
  );
}