'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { DECK_COLORS } from '@/store/useCardStore';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Called with draft color while picking (for live preview in parent). */
  onPreview?: (color: string) => void;
  /** Size of the trigger circle in Tailwind classes. Default: "h-3 w-3" */
  size?: string;
}

export function ColorPicker({ value, onChange, onPreview, size = 'h-3 w-3' }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const rafRef = useRef<number>(0);
  const latestRef = useRef(value);

  useEffect(() => {
    setDraft(value);
    latestRef.current = value;
  }, [value]);

  // Throttled preview via rAF
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    latestRef.current = e.target.value;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setDraft(latestRef.current);
        onPreview?.(latestRef.current);
        rafRef.current = 0;
      });
    }
  }, [onPreview]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const isPreset = DECK_COLORS.includes(draft as typeof DECK_COLORS[number]);

  const handlePreset = useCallback((c: string) => {
    setDraft(c);
    latestRef.current = c;
    onPreview?.(c);
    onChange(c);
  }, [onChange, onPreview]);

  // Commit when popover closes
  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (!next) {
      if (latestRef.current !== value) {
        onChange(latestRef.current);
      }
      // Reset preview
      onPreview?.(latestRef.current);
    }
  }, [onChange, onPreview, value]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(size, 'rounded-full shrink-0 cursor-pointer ring-offset-2 ring-offset-[var(--background)] hover:ring-2 hover:ring-[var(--foreground)]/30 transition-all')}
          style={{ backgroundColor: draft }}
          aria-label="Change color"
          onClick={(e) => e.stopPropagation()}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          {DECK_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => handlePreset(c)}
              className={cn(
                'h-7 w-7 rounded-full transition-all',
                draft === c
                  ? 'ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--foreground)] scale-110'
                  : 'hover:scale-110'
              )}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
          <div className="relative ml-1">
            <input
              type="color"
              defaultValue={value}
              onInput={handleInput as unknown as React.FormEventHandler}
              className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7"
              title="Pick custom color"
            />
            <div
              className={cn(
                'h-7 w-7 rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center transition-all pointer-events-none',
                !isPreset && 'ring-2 ring-offset-2 ring-offset-[var(--background)] ring-[var(--foreground)] scale-110 border-solid border-transparent'
              )}
              style={!isPreset ? { backgroundColor: draft } : undefined}
            >
              {isPreset && (
                <span className="text-[var(--muted-foreground)] text-xs font-bold">+</span>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
