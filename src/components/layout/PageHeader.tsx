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
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    ai: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/80 shadow-2xs'
  }[badgeVariant];

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-blue-600 font-medium transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-800 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-semibold ${badgeStyles}`}>
                {badgeVariant === 'ai' && <Sparkles className="w-3 h-3 text-blue-600" />}
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
};
