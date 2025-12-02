import React from 'react';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

const buttonVariants = {
  default: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm dark:bg-brand-500 dark:text-slate-50 dark:hover:bg-brand-500/90',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/90',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80',
  ghost: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50',
  link: 'text-brand-600 underline-offset-4 hover:underline dark:text-slate-50',
};

const buttonSizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 rounded-md px-3',
  lg: 'h-11 rounded-md px-8',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef(({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  href,
  type = 'button',
  ...props
}, ref) => {
  // If asChild is true, we assume the child will handle the rendering,
  // but to simplify for this project (without radix slot),
  // we will just stick to rendering Link if href is present, or button otherwise.
  // We will NOT render children as the component itself if asChild is true to avoid complexity,
  // instead we rely on the caller to NOT nest Links if they use href here.

  const Comp = href ? Link : 'button';
  const toProp = href ? { to: href } : {};

  return (
    <Comp
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      ref={ref}
      type={!href ? type : undefined}
      {...toProp}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
