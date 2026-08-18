import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  badgeText?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-blue-50',
  iconColor = 'text-blue-600',
  trend,
  badgeText,
  badgeColor = 'blue',
  href,
  onClick,
  isActive = false
}) => {
  const badgeClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }[badgeColor];

  const content = (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl p-5 border transition-all duration-200 shadow-xs hover:shadow-md ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-slate-200/80 hover:border-slate-300'
      } ${onClick || href ? 'cursor-pointer group' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={`inline-flex items-center text-xs font-medium ${
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 font-normal line-clamp-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconBgColor} ${iconColor} transition-transform group-hover:scale-105`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {badgeText && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${badgeClasses}`}>
            {badgeText}
          </span>
          {(href || onClick) && (
            <span className="text-xs font-medium text-blue-600 group-hover:translate-x-0.5 transition-transform">
              Drill down →
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
};
