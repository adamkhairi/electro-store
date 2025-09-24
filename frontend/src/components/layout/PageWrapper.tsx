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

// Main page wrapper with consistent spacing and background
export const PageWrapper = ({ children, className }: PageWrapperProps) => {
  return (
    <div className={cn('min-h-full bg-gray-50', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  );
};

// Consistent page header with title, description, and actions
export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => {
  return (
    <div className={cn('pb-8', className)}>
      <div className="md:flex md:items-start md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-2 text-base text-gray-600">{description}</p>}
        </div>
        {actions && (
          <div className="mt-4 md:mt-0 md:ml-4 flex flex-col sm:flex-row gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
};

// Consistent content wrapper
export const PageContent = ({ children, className }: PageContentProps) => {
  return <div className={cn('space-y-8', className)}>{children}</div>;
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
    <div className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4', className)}>
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
  iconColor = 'bg-blue-500',
  trend,
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconColor)}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {trend && (
              <p
                className={cn(
                  'ml-2 text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.value}
              </p>
            )}
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
    <div className={cn('bg-white rounded-lg border border-gray-200', className)}>
      {(title || description || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
            {headerActions && <div className="ml-4">{headerActions}</div>}
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

// Consistent loading state
export const LoadingSpinner = ({ message = 'Loading...' }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-base text-gray-600">{message}</p>
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
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400">{icon}</div>
      <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
