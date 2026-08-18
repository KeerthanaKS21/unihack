import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number; // 0.0 to 1.0 or 0 to 100
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true
}) => {
  const percentage = score <= 1 ? Math.round(score * 100) : Math.round(score);

  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let Icon = ShieldCheck;

  if (percentage < 70) {
    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = ShieldAlert;
  } else if (percentage < 90) {
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = Sparkles;
  }

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${badgeColor} ${sizeClass}`}>
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span>AI Confidence:</span>}
      <span className="font-semibold">{percentage}%</span>
    </span>
  );
};
