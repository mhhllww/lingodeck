import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors cursor-default',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white',
        secondary: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
        outline: 'border border-[var(--border)] text-[var(--foreground)]',
        clickable:
          'bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-white cursor-pointer active:scale-95 transition-all',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
