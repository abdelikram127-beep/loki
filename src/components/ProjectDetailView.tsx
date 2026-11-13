import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Download,
  Plus,
  GripVertical,
  Play,
  Heart,
} from 'lucide-react';
import type { ProjectItem, VideoItem } from '../types';
import { exportVideosToCsv, formatFrenchDate, PLATFORM_LABELS, PLATFORM_STYLES, PROJECT_COLORS } from '../lib/platforms';
import { resolveVideoThumbnail } from '../lib/thumbnails';
import { PlatformIcon } from './PlatformIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface ProjectDetailViewProps {
  project: ProjectItem;
  videos: VideoItem[];
  onBack: () => void;
  onEditProject: (project: ProjectItem) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onSelectVideo: (video: VideoItem) => void;
  onToggleFavorite: (video: VideoItem) => void;
  onReorderVideos: (projectId: string, nextOrder: string[]) => Promise<void>;
  onAddVideoToProject: (projectId: string) => void;
}

export function ProjectDetailView({
  project,
  videos,
  onBack,
  onEditProject,
  onDeleteProject,
  onSelectVideo,
  onToggleFavorite,
  onReorderVideos,
  onAddVideoToProject,
}: ProjectDetailViewProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Order videos according to project.videoOrder
  const projectVideos = videos.filter((v) => v.projectIds.includes(project.id));
  const orderMap = new Map(project.videoOrder.map((id, idx) => [id, idx]));
  const orderedVideos = [...projectVideos].sort((a, b) => {
    const idxA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const idxB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return idxA - idxB;
  });

  const colorToken = PROJECT_COLORS[project.color] ?? PROJECT_COLORS.blue;

  const moveVideo = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= orderedVideos.length) return;
    const ids = orderedVideos.map((v) => v.id);
    const [removed] = ids.splice(index, 1);
    ids.splice(target, 0, removed);
    onReorderVideos(project.id, ids);
  };

  const handleDropOnIndex = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const ids = orderedVideos.map((v) => v.id);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [removed] = ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, removed);
    setDraggedId(null);
    onReorderVideos(project.id, ids);
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3 py-2 -ml-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Tous les projets
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                exportVideosToCsv(
                  orderedVideos,
                  [project],
                  `projet-${project.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.csv`
                )
              }
              disabled={orderedVideos.length === 0}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Exporter CSV
            </button>
            <button
              type="button"
              onClick={() => onEditProject(project)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/60 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full shrink-0 ${colorToken.dot}`} />
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                {project.name}
              </h2>
            </div>
            {project.description && (
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                {project.description}
              </p>
            )}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {orderedVideos.length} {orderedVideos.length > 1 ? 'vidéos' : 'vidéo'} · Glissez-déposez ou utilisez les flèches pour réorganiser
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAddVideoToProject(project.id)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ajouter dans ce projet
          </button>
        </div>
      </div>

      {/* Ordered Video List */}
      {orderedVideos.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-10 text-center">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Ce projet ne contient aucune vidéo pour l’instant.
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ajoutez une nouvelle vidéo ou associez-en une depuis votre bibliothèque.
          </p>
          <button
            type="button"
            onClick={() => onAddVideoToProject(project.id)}
            className="mt-5 min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ajouter une vidéo
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {orderedVideos.map((video, index) => {
            const thumb = resolveVideoThumbnail(video);
            return (
              <div
                key={video.id}
                draggable
                onDragStart={() => setDraggedId(video.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnIndex(video.id)}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 transition-colors ${
                  draggedId === video.id
                    ? 'bg-blue-50/50 dark:bg-blue-950/20'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/40'
                }`}
              >
                {/* Index & Drag Handle */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="hidden sm:flex text-slate-400 cursor-grab active:cursor-grabbing"
                    title="Glisser pour réorganiser"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="w-6 text-xs font-mono text-slate-400 tabular-nums">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Thumbnail */}
                <button
                  type="button"
                  onClick={() => onSelectVideo(video)}
                  className="relative w-full sm:w-36 aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 group cursor-pointer"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={video.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <PlatformIcon platform={video.platform} className="w-6 h-6" />
                    </div>
                  )}
                  <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Play className="h-5 w-5 fill-current" />
                  </span>
                  {video.duration && (
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-slate-950/80 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums">
                      {video.duration}
                    </span>
                  )}
                </button>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <PlatformIcon platform={video.platform} className="w-3.5 h-3.5" />
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
                    <span className="tabular-nums">{formatFrenchDate(video.addedAt)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectVideo(video)}
                    className="mt-1 text-left font-display text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1 cursor-pointer"
                  >
                    {video.title}
                  </button>

                  {video.notes && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {video.notes}
                    </p>
                  )}
                </div>

                {/* Actions: Favorite + Up / Down reorder */}
                <div className="flex items-center justify-end gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(video)}
                    aria-label={video.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                      video.isFavorite
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${video.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveVideo(index, -1)}
                    disabled={index === 0}
                    aria-label="Monter la vidéo"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveVideo(index, 1)}
                    disabled={index === orderedVideos.length - 1}
                    aria-label="Descendre la vidéo"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce projet ?"
        description={`Le projet « ${project.name} » sera supprimé. Vos vidéos resteront conservées dans votre bibliothèque générale.`}
        confirmLabel="Supprimer le projet"
        onConfirm={async () => {
          setConfirmOpen(false);
          await onDeleteProject(project.id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
