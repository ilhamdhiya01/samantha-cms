import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

type Tone = 'gray' | 'green' | 'red' | 'blue' | 'amber';

export function Badge({
  tone = 'gray',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  const styles: Record<Tone, string> = {
    gray: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-sky-100 text-sky-700',
    amber: 'bg-amber-100 text-amber-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        styles[tone],
        className
      )}
      {...rest}
    />
  );
}
