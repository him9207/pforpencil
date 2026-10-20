import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'purple';
}

export function Badge({ className = '', variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-blue-100 text-[#1a56db] border-blue-200',
    secondary: 'bg-stone-100 text-stone-700 border-stone-200',
    outline: 'border border-stone-300 text-stone-700 bg-white',
    success: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  }[variant];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Badge;
