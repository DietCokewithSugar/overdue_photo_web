import { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60';

  const variants: Record<typeof variant, string> = {
    primary: 'bg-brand-400 text-neutral-950 hover:bg-brand-300',
    secondary: 'bg-white/10 text-neutral-50 hover:bg-white/15',
    ghost: 'bg-transparent text-neutral-300 hover:text-neutral-50'
  } as const;

  return <button className={cn(base, variants[variant], className)} {...props} />;
}
