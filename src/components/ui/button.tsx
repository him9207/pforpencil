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
      default: 'bg-[#1e6f47] text-white hover:bg-[#165636] shadow-md hover:shadow-lg',
      primary: 'bg-[#1e6f47] text-white hover:bg-[#165636] shadow-md hover:shadow-lg',
      secondary: 'bg-[#e6f4ea] text-[#1e6f47] border border-emerald-300/80 hover:bg-[#d8edd9] shadow-xs',
      outline: 'border-2 border-[#1e6f47] text-[#1e6f47] hover:bg-[#e6f4ea] hover:text-[#165636]',
      ghost: 'text-[#1e6f47] hover:bg-[#e6f4ea]/60',
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
