'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;
  max: number;
}

export function ProgressBar({ value, max }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-[var(--accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-[var(--muted-foreground)] tabular-nums shrink-0">
        {value} / {max}
      </span>
    </div>
  );
}
