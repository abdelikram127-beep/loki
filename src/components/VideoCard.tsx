import { useState } from 'react';
import { Heart, Play, FileText } from 'lucide-react';
import type { ProjectItem, VideoItem } from '../types';
import { formatFrenchDate, PLATFORM_LABELS, PLATFORM_STYLES } from '../lib/platforms';
import { resolveVideoThumbnail } from '../lib/thumbnails';
import { PlatformIcon } from './PlatformIcon';

interface VideoCardProps {
  video: VideoItem;
  projects: ProjectItem[];
  onSelect: (video: VideoItem) => void;
  onToggleFavorite: (video: VideoItem) => void;
  onTagClick?: (tag: string) => void;
}

export function VideoCard({
  video,
  projects,
  onSelect,
  onToggleFavorite,
  onTagClick,
}: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const resolvedThumb = resolveVideoThumbnail(video);
  const assignedProjects = projects.filter((p) => video.projectIds.includes(p.id));

  return (
    <article className="group flex flex-col rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200/80 dark:border-slate-800/90 overflow-hidden transition-colors hover:border-slate-300 dark:hover:border-slate-700">
      {/* Thumbnail area */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <button
          type="button"
          onClick={() => onSelect(video)}
          className="block w-full h-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          aria-label={`Ouvrir ${video.title}`}
        >
          {resolvedThumb && !imgError ? (
            <img
              src={resolvedThumb}
              alt={video.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-500 dark:text-slate-400 p-4">
              <PlatformIcon platform={video.platform} className="w-7 h-7 opacity-80" />
              <span className="text-xs font-medium text-center line-clamp-1 max-w-[200px]">
                {video.author || PLATFORM_LABELS[video.platform]}
              </span>
            </div>
          )}

          {/* Subtle bottom gradient scrim for duration legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />

          {/* Center play affordance on hover */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/75 text-white backdrop-blur-sm">
              <Play className="h-5 w-5 fill-current ml-0.5" />
            </span>
          </div>

          {/* Duration indicator */}
          {video.duration && (
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-slate-950/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white tabular-nums">
              {video.duration}
            </span>
          )}
        </button>

        {/* Favorite quick button (>= 44x44px hitbox) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(video);
          }}
          aria-label={video.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className="absolute top-1.5 right-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-white transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg backdrop-blur-md transition-colors ${
              video.isFavorite
                ? 'bg-rose-600 text-white'
                : 'bg-slate-950/45 text-white/90 hover:bg-slate-950/70'
            }`}
          >
            <Heart className={`h-4 w-4 ${video.isFavorite ? 'fill-current' : ''}`} />
          </span>
        </button>
      </div>

      {/* Content body — zero-pill metadata discipline */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <PlatformIcon platform={video.platform} className="w-3.5 h-3.5 shrink-0" />
          <span className={`font-semibold ${PLATFORM_STYLES[video.platform].text}`}>
            {PLATFORM_LABELS[video.platform]}
          </span>
          {video.author && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{video.author}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span className="shrink-0 tabular-nums">{formatFrenchDate(video.addedAt)}</span>
        </div>

        <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug text-slate-900 dark:text-slate-100 line-clamp-2">
          <button
            type="button"
            onClick={() => onSelect(video)}
            className="text-left hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            {video.title}
          </button>
        </h3>

        {video.notes && (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400 dark:text-slate-500" />
            <span>{video.notes}</span>
          </p>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
          <div className="truncate">
            {assignedProjects.length > 0 ? (
              <span>{assignedProjects.map((p) => p.name).join(' · ')}</span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">Sans projet</span>
            )}
          </div>

          {video.tags.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0 max-w-[55%] overflow-hidden">
              {video.tags.slice(0, 2).map((tag, i) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag)}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate cursor-pointer"
                >
                  {i > 0 ? `· #${tag}` : `#${tag}`}
                </button>
              ))}
              {video.tags.length > 2 && (
                <span className="tabular-nums text-slate-400">+{video.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
