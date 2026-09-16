import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  category?: string;
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  category,
  breadcrumbs,
  title,
  description,
  icon: Icon,
  actions,
  badge,
  children,
}) => {
  return (
    <div className="border-b border-slate-200 pb-4 mb-6">
      {/* Breadcrumb row */}
      {(category || (breadcrumbs && breadcrumbs.length > 0)) && (
        <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 mb-2">
          {category && <span>{category}</span>}
          {category && breadcrumbs && breadcrumbs.length > 0 && <span className="text-slate-300">/</span>}
          {breadcrumbs &&
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-[#0F766E] transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-600">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
        </div>
      )}

      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center space-x-2">
            <span>{title}</span>
            {badge}
          </h1>
        </div>

        {/* Action Toolbar */}
        {(actions || children) && (
          <div className="flex items-center space-x-2 shrink-0 self-start sm:self-auto">
            {actions}
            {children}
          </div>
        )}
      </div>

      {/* Description — only shown when provided, kept minimal */}
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
