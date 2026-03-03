import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function detectLanguage(text: string): 'en' | 'ru' | 'unknown' {
  if (!text.trim()) return 'unknown';
  const cyrillicPattern = /[\u0400-\u04FF]/;
  const latinPattern = /[a-zA-Z]/;
  if (cyrillicPattern.test(text)) return 'ru';
  if (latinPattern.test(text)) return 'en';
  return 'unknown';
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch {
      reject(new Error('Copy failed'));
    } finally {
      document.body.removeChild(textarea);
    }
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
