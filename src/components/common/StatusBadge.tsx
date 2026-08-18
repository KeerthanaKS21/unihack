import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, XCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let IconComponent = Clock;

  if (
    normalized.includes('verified') ||
    normalized.includes('compliant') ||
    normalized.includes('exact match') ||
    normalized.includes('approved') ||
    normalized.includes('synchronized') ||
    normalized.includes('published') ||
    normalized.includes('resolved') ||
    normalized.includes('complete') ||
    normalized.includes('compatible')
  ) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    IconComponent = CheckCircle2;
  } else if (
    normalized.includes('review') ||
    normalized.includes('pending') ||
    normalized.includes('warning') ||
    normalized.includes('closest alternative') ||
    normalized.includes('action required') ||
    normalized.includes('draft') ||
    normalized.includes('ready')
  ) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    IconComponent = AlertTriangle;
  } else if (
    normalized.includes('critical') ||
    normalized.includes('conflict') ||
    normalized.includes('expired') ||
    normalized.includes('non-compliant') ||
    normalized.includes('incompatible') ||
    normalized.includes('not recommended') ||
    normalized.includes('rejected') ||
    normalized.includes('missing')
  ) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    IconComponent = XCircle;
  } else if (normalized.includes('processing') || normalized.includes('uploading') || normalized.includes('matched')) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    IconComponent = Sparkles;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${colorClasses} ${sizeClasses}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span className="capitalize">{status}</span>
    </span>
  );
};
