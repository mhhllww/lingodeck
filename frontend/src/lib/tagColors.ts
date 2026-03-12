const TAG_COLORS: Record<string, string> = {
  travel:     'bg-sky-100/60 text-sky-700/70 dark:bg-sky-900/20 dark:text-sky-400/60',
  business:   'bg-indigo-100/60 text-indigo-700/70 dark:bg-indigo-900/20 dark:text-indigo-400/60',
  food:       'bg-orange-100/60 text-orange-700/70 dark:bg-orange-900/20 dark:text-orange-400/60',
  technology: 'bg-cyan-100/60 text-cyan-700/70 dark:bg-cyan-900/20 dark:text-cyan-400/60',
  nature:     'bg-green-100/60 text-green-700/70 dark:bg-green-900/20 dark:text-green-400/60',
  health:     'bg-emerald-100/60 text-emerald-700/70 dark:bg-emerald-900/20 dark:text-emerald-400/60',
  emotions:   'bg-pink-100/60 text-pink-700/70 dark:bg-pink-900/20 dark:text-pink-400/60',
  sport:      'bg-red-100/60 text-red-700/70 dark:bg-red-900/20 dark:text-red-400/60',
  education:  'bg-violet-100/60 text-violet-700/70 dark:bg-violet-900/20 dark:text-violet-400/60',
  law:        'bg-slate-100/60 text-slate-600/70 dark:bg-slate-800/30 dark:text-slate-400/60',
  finance:    'bg-yellow-100/60 text-yellow-700/70 dark:bg-yellow-900/20 dark:text-yellow-400/60',
  politics:   'bg-rose-100/60 text-rose-700/70 dark:bg-rose-900/20 dark:text-rose-400/60',
  art:        'bg-purple-100/60 text-purple-700/70 dark:bg-purple-900/20 dark:text-purple-400/60',
  music:      'bg-fuchsia-100/60 text-fuchsia-700/70 dark:bg-fuchsia-900/20 dark:text-fuchsia-400/60',
  science:    'bg-blue-100/60 text-blue-700/70 dark:bg-blue-900/20 dark:text-blue-400/60',
  fashion:    'bg-rose-100/60 text-rose-600/70 dark:bg-rose-900/20 dark:text-rose-400/60',
  family:     'bg-teal-100/60 text-teal-700/70 dark:bg-teal-900/20 dark:text-teal-400/60',
  society:    'bg-amber-100/60 text-amber-700/70 dark:bg-amber-900/20 dark:text-amber-400/60',
  religion:   'bg-stone-100/60 text-stone-600/70 dark:bg-stone-800/30 dark:text-stone-400/60',
  home:       'bg-lime-100/60 text-lime-700/70 dark:bg-lime-900/20 dark:text-lime-400/60',
  animals:    'bg-green-100/60 text-green-600/70 dark:bg-green-900/20 dark:text-green-400/60',
  weather:    'bg-sky-100/60 text-sky-600/70 dark:bg-sky-900/20 dark:text-sky-400/60',
  time:       'bg-gray-100/60 text-gray-600/70 dark:bg-gray-800/30 dark:text-gray-400/60',
  body:       'bg-pink-100/60 text-pink-600/70 dark:bg-pink-900/20 dark:text-pink-400/60',
  culture:    'bg-purple-100/60 text-purple-600/70 dark:bg-purple-900/20 dark:text-purple-400/60',
  formal:     'bg-slate-100/60 text-slate-600/70 dark:bg-slate-800/30 dark:text-slate-400/60',
  informal:   'bg-orange-100/60 text-orange-600/70 dark:bg-orange-900/20 dark:text-orange-400/60',
  slang:      'bg-yellow-100/60 text-yellow-700/70 dark:bg-yellow-900/20 dark:text-yellow-400/60',
  academic:   'bg-indigo-100/60 text-indigo-600/70 dark:bg-indigo-900/20 dark:text-indigo-400/60',
  literary:   'bg-violet-100/60 text-violet-600/70 dark:bg-violet-900/20 dark:text-violet-400/60',
};

const FALLBACK = 'bg-[var(--muted)] text-[var(--muted-foreground)]';

export function getTagClasses(tag: string): string {
  return TAG_COLORS[tag] ?? FALLBACK;
}
