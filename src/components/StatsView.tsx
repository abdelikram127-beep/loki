import { Download } from 'lucide-react';
import type { Platform, ProjectItem, VideoItem } from '../types';
import { exportVideosToCsv, PLATFORM_LABELS, PLATFORM_STYLES, PROJECT_COLORS } from '../lib/platforms';
import { PlatformIcon } from './PlatformIcon';

interface StatsViewProps {
  videos: VideoItem[];
  projects: ProjectItem[];
  onOpenProject: (projectId: string) => void;
}

export function StatsView({ videos, projects, onOpenProject }: StatsViewProps) {
  const total = videos.length;
  const favorites = videos.filter((v) => v.isFavorite).length;
  const withNotes = videos.filter((v) => v.notes.trim().length > 0).length;

  const platforms: Platform[] = ['youtube', 'instagram', 'tiktok'];
  const platformCounts = platforms.map((platform) => {
    const count = videos.filter((v) => v.platform === platform).length;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    return { platform, count, percent };
  });

  const projectStats = projects
    .map((p) => ({
      project: p,
      count: videos.filter((v) => v.projectIds.includes(p.id)).length,
    }))
    .sort((a, b) => b.count - a.count);

  const tagCounts = new Map<string, number>();
  for (const v of videos) {
    for (const tag of v.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
            Aperçu de la bibliothèque
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Répartition de vos vidéos enregistrées par plateforme et par projet.
          </p>
        </div>

        <button
          type="button"
          onClick={() => exportVideosToCsv(videos, projects, 'clipotheque-bibliotheque.csv')}
          disabled={videos.length === 0}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131A26] text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Exporter tout (CSV)
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total des vidéos</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {total}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Projets actifs</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {projects.length}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Vidéos favorites</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {favorites}
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Avec notes</p>
          <p className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {withNotes}
          </p>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platforms */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Répartition par plateforme
          </h3>
          <div className="mt-5 space-y-4">
            {platformCounts.map(({ platform, count, percent }) => (
              <div key={platform} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className={`inline-flex items-center gap-2 font-semibold ${PLATFORM_STYLES[platform].text}`}>
                    <PlatformIcon platform={platform} className="w-4 h-4" />
                    {PLATFORM_LABELS[platform]}
                  </span>
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    {count} ({percent}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${PLATFORM_STYLES[platform].bar}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Projets les plus fournis
          </h3>
          {projectStats.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Aucun projet pour le moment.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
              {projectStats.map(({ project, count }) => {
                const token = PROJECT_COLORS[project.color] ?? PROJECT_COLORS.blue;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onOpenProject(project.id)}
                    className="w-full min-h-[44px] py-2.5 flex items-center justify-between gap-3 text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${token.dot}`} />
                      <span className="truncate">{project.name}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                      {count} {count > 1 ? 'vidéos' : 'vidéo'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Top Tags */}
      {topTags.length > 0 && (
        <section className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Tags fréquents
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
            {topTags.map(([tag, count]) => (
              <span key={tag} className="inline-flex items-center gap-1.5">
                <span className="font-medium text-slate-800 dark:text-slate-200">#{tag}</span>
                <span className="font-mono text-xs text-slate-400 tabular-nums">({count})</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
