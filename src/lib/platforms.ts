import type { Platform, ProjectColor, ProjectItem, VideoItem } from '../types';

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

export const PLATFORM_STYLES: Record<
  Platform,
  { text: string; bar: string; activeTab: string; activeBorder: string }
> = {
  youtube: {
    text: 'text-[#DC2626] dark:text-[#F87171]',
    bar: 'bg-[#FF0000]',
    activeTab: 'bg-red-50 dark:bg-red-950/60 text-[#DC2626] dark:text-[#FCA5A5]',
    activeBorder: 'bg-[#FF0000] border-[#FF0000] text-white',
  },
  instagram: {
    text: 'text-[#D91B60] dark:text-[#F472B6]',
    bar: 'bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
    activeTab: 'bg-pink-50 dark:bg-pink-950/60 text-[#C026D3] dark:text-[#F9A8D4]',
    activeBorder: 'bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] border-transparent text-white',
  },
  tiktok: {
    text: 'text-[#0F172A] dark:text-[#25F4EE]',
    bar: 'bg-gradient-to-r from-[#25F4EE] via-[#0F172A] to-[#FE2C55] dark:via-slate-100',
    activeTab: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950',
    activeBorder: 'bg-[#0F172A] dark:bg-white border-[#0F172A] dark:border-white text-white dark:text-slate-950',
  },
};

export const PROJECT_COLORS: Record<
  ProjectColor,
  { label: string; dot: string; subtleBg: string; subtleText: string }
> = {
  slate: {
    label: 'Ardoise',
    dot: 'bg-slate-600 dark:bg-slate-400',
    subtleBg: 'bg-slate-100 dark:bg-slate-800',
    subtleText: 'text-slate-700 dark:text-slate-300',
  },
  blue: {
    label: 'Cobalt',
    dot: 'bg-blue-600 dark:bg-blue-400',
    subtleBg: 'bg-blue-50 dark:bg-blue-950/50',
    subtleText: 'text-blue-700 dark:text-blue-300',
  },
  emerald: {
    label: 'Émeraude',
    dot: 'bg-emerald-600 dark:bg-emerald-400',
    subtleBg: 'bg-emerald-50 dark:bg-emerald-950/50',
    subtleText: 'text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    label: 'Ambre',
    dot: 'bg-amber-600 dark:bg-amber-400',
    subtleBg: 'bg-amber-50 dark:bg-amber-950/50',
    subtleText: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    label: 'Corail',
    dot: 'bg-rose-600 dark:bg-rose-400',
    subtleBg: 'bg-rose-50 dark:bg-rose-950/50',
    subtleText: 'text-rose-700 dark:text-rose-300',
  },
  indigo: {
    label: 'Indigo',
    dot: 'bg-indigo-600 dark:bg-indigo-400',
    subtleBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    subtleText: 'text-indigo-700 dark:text-indigo-300',
  },
};

export function detectPlatformFromUrl(rawUrl: string): Platform | null {
  const normalized = rawUrl.trim().toLowerCase();
  if (
    normalized.includes('youtube.com') ||
    normalized.includes('youtu.be') ||
    normalized.includes('youtube-nocookie.com')
  ) {
    return 'youtube';
  }
  if (normalized.includes('instagram.com') || normalized.includes('instagr.am')) {
    return 'instagram';
  }
  if (normalized.includes('tiktok.com')) {
    return 'tiktok';
  }
  return null;
}

export function formatFrenchDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoDate;
  }
}

export function isPortraitPlatform(platform: Platform, url: string): boolean {
  if (platform === 'tiktok' || platform === 'instagram') return true;
  if (platform === 'youtube' && url.includes('/shorts/')) return true;
  return false;
}

export function exportVideosToCsv(videos: VideoItem[], projects: ProjectItem[], filename: string): void {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const escapeCsv = (val: string) => {
    const safe = (val ?? '').replace(/"/g, '""');
    return `"${safe}"`;
  };

  const headers = [
    'Titre',
    'Plateforme',
    'Auteur',
    'Durée',
    'Projets',
    'Tags',
    'Favori',
    'Date ajout',
    'Notes',
    'Lien original',
  ];

  const rows = videos.map((v) => [
    escapeCsv(v.title),
    escapeCsv(PLATFORM_LABELS[v.platform]),
    escapeCsv(v.author),
    escapeCsv(v.duration),
    escapeCsv(v.projectIds.map((id) => projectMap.get(id) ?? '').filter(Boolean).join('; ')),
    escapeCsv(v.tags.join('; ')),
    escapeCsv(v.isFavorite ? 'Oui' : 'Non'),
    escapeCsv(formatFrenchDate(v.addedAt)),
    escapeCsv(v.notes),
    escapeCsv(v.url),
  ]);

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
