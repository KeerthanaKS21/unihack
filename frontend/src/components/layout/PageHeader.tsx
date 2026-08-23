import React from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'purple' | 'ai';
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }],
  badge,
  badgeVariant = 'primary',
  action
}) => {
  const badgeStyles = {
    primary: 'bg-blue-500/10 text-blue-700 border-blue-500/20 shadow-2xs',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 shadow-2xs',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20 shadow-2xs',
    purple: 'bg-purple-500/10 text-purple-700 border-purple-500/20 shadow-2xs',
    ai: 'bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 text-blue-700 border-blue-200/90 shadow-2xs'
  }[badgeVariant];

  return (
    <div className="mb-8 pb-4 border-b border-slate-200/60">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-2 font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-blue-600 font-medium transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-700 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              {title}
            </h1>
            {badge && (
              <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border font-bold ${badgeStyles}`}>
                {badgeVariant === 'ai' && <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-3xl font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0 flex items-center gap-2.5">{action}</div>}
      </div>
    </div>
  );
};
