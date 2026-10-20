import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-bold transition-all focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none rounded-xl cursor-pointer active:scale-98 select-none';
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    }[size];

    const variantClasses = {
      default: 'bg-[#10246f] text-white hover:bg-[#0c1a4f] shadow-md hover:shadow-lg',
      primary: 'bg-[#1a56db] text-white hover:bg-[#10246f] shadow-md hover:shadow-lg',
      secondary: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md',
      outline: 'border-2 border-[#10246f] text-[#10246f] hover:bg-[#10246f] hover:text-white',
      ghost: 'text-[#10246f] hover:bg-blue-50',
      accent: 'bg-amber-400 text-stone-900 hover:bg-amber-300 shadow-md',
    }[variant];

    return (
      <button
        ref={ref}
        className={`${base} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
