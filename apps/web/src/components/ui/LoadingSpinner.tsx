'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const base = `${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-gray-500`;
  return <div className={className ? `${base} ${className}` : base} />;
}
