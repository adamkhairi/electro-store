import React from 'react';
import { cn } from '../../lib/utils';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

// Main page wrapper with full width and consistent background
export const PageWrapper = ({ children, className }: PageWrapperProps) => {
  return (
    <div className={cn('min-h-full bg-gray-50', className)}>
      <div className="py-3 px-3 sm:py-4 sm:px-4 md:py-6 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};

// Consistent page header with title, description, and actions
export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => {
  return (
    <div className={cn('mb-4 sm:mb-6', className)}>
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 break-words">
            {title}
          </h1>
          {description && (
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex-shrink-0 flex flex-wrap gap-2 sm:gap-3">{actions}</div>}
      </div>
    </div>
  );
};

// Consistent content wrapper
export const PageContent = ({ children, className }: PageContentProps) => {
  return <div className={cn('space-y-6', className)}>{children}</div>;
};

// Consistent stats/metrics grid
export const StatsGrid = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6',
        className
      )}
    >
      {children}
    </div>
  );
};

// Consistent stat card
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export const StatCard = ({
  title,
  value,
  icon,
  iconColor = 'bg-primary-500',
  trend,
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 md:p-6 transition-colors duration-200 hover:border-gray-300 touch-manipulation">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 break-all">{value}</p>
            {trend && (
              <span
                className={cn(
                  'text-xs sm:text-sm font-medium whitespace-nowrap',
                  trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white',
              iconColor
            )}
          >
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

// Consistent content card
interface ContentCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const ContentCard = ({
  title,
  description,
  children,
  className,
  headerActions,
}: ContentCardProps) => {
  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {(title || description || headerActions) && (
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex-1 min-w-0">
              {title && (
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs sm:text-sm text-gray-600">{description}</p>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0 flex flex-wrap gap-2">{headerActions}</div>
            )}
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

// Consistent loading state
export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      <p className="mt-4 text-sm text-gray-600">{message}</p>
    </div>
  );
};

// Consistent empty state
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="text-center py-12 px-4">
      <div className="mx-auto h-12 w-12 text-gray-400">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
