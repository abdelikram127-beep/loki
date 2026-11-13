import { useEffect, useState, type FormEvent } from 'react';
import {
  X,
  Heart,
  ExternalLink,
  Trash2,
  Check,
  Loader2,
  Save,
  Copy,
} from 'lucide-react';
import type { ProjectItem, VideoItem } from '../types';
import { formatFrenchDate, isPortraitPlatform, PLATFORM_LABELS, PLATFORM_STYLES } from '../lib/platforms';
import { PlatformIcon } from './PlatformIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface VideoDetailModalProps {
  video: VideoItem | null;
  projects: ProjectItem[];
  onClose: () => void;
  onUpdated: (updated: VideoItem) => void;
  onDeleted: (videoId: string) => void;
}

export function VideoDetailModal({
  video,
  projects,
  onClose,
  onUpdated,
  onDeleted,
}: VideoDetailModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (video) {
      setTitle(video.title);
      setAuthor(video.author);
      setDuration(video.duration);
      setNotes(video.notes);
      setTags(video.tags);
      setProjectIds(video.projectIds);
      setIsFavorite(video.isFavorite);
      setError('');
      setSavedFeedback(false);
    }
  }, [video]);

  if (!video) return null;

  const isPortrait = isPortraitPlatform(video.platform, video.url);

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const toggleProject = (id: string) => {
    setProjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError('Le titre ne peut pas être vide.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          duration: duration.trim(),
          notes,
          tags,
          projectIds,
          isFavorite,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Échec de la mise à jour.');
        return;
      }
      onUpdated(data as VideoItem);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch {
      setError('Erreur réseau lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFavoriteImmediate = async () => {
    const nextFav = !isFavorite;
    setIsFavorite(nextFav);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: nextFav }),
      });
      if (res.ok) {
        const updated = (await res.json()) as VideoItem;
        onUpdated(updated);
      }
    } catch {
      setIsFavorite(!nextFav);
    }
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDeleteOpen(false);
        onDeleted(video.id);
        onClose();
      } else {
        setError('Impossible de supprimer cette vidéo.');
      }
    } catch {
      setError('Erreur réseau lors de la suppression.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(video.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1800);
    } catch {
      // Ignore clipboard failure quietly
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-6 bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-video-title"
      >
        <div className="w-full lg:max-w-5xl h-[94vh] lg:h-[86vh] flex flex-col rounded-t-3xl lg:rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
          {/* Top Header */}
          <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <PlatformIcon platform={video.platform} className="w-4 h-4 shrink-0" />
              <span className={`text-xs font-semibold whitespace-nowrap ${PLATFORM_STYLES[video.platform].text}`}>
                {PLATFORM_LABELS[video.platform]}
              </span>
              <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
                Ajoutée le {formatFrenchDate(video.addedAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleFavoriteImmediate}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                  isFavorite
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                aria-label="Supprimer la vidéo"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Split Content */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Embedded Player */}
            <div className="lg:col-span-7 bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
              <div
                className={`w-full overflow-hidden rounded-xl bg-black border border-slate-800 ${
                  isPortrait ? 'max-w-[340px] aspect-[9/16] max-h-[540px]' : 'aspect-video'
                }`}
              >
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="mt-4 w-full flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span className="truncate max-w-full sm:max-w-[60%]">{video.url}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedLink ? 'Copié' : 'Copier le lien'}
                  </button>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    Ouvrir sur {PLATFORM_LABELS[video.platform]}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Metadata & Notes Editor */}
            <form
              onSubmit={handleSave}
              className="lg:col-span-5 p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto"
            >
              <div>
                <label
                  htmlFor="detail-video-title"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Titre
                </label>
                <input
                  id="detail-video-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="detail-video-author"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Créateur / Chaîne
                  </label>
                  <input
                    id="detail-video-author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Créateur"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="detail-video-duration"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Durée
                  </label>
                  <input
                    id="detail-video-duration"
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="00:00"
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Projects */}
              <div>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Projets associés
                </span>
                {projects.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Aucun projet disponible.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projects.map((proj) => {
                      const active = projectIds.includes(proj.id);
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => toggleProject(proj.id)}
                          className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          {active && <Check className="h-3.5 w-3.5" />}
                          {proj.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="detail-video-tags"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Tags
                </label>
                <div className="flex gap-2">
                  <input
                    id="detail-video-tags"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Nouveau tag..."
                    className="flex-1 min-h-[44px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                    {tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1">
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => setTags(tags.filter((item) => item !== t))}
                          aria-label={`Supprimer ${t}`}
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="flex-1 flex flex-col">
                <label
                  htmlFor="detail-video-notes"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Notes personnelles
                </label>
                <textarea
                  id="detail-video-notes"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez vos notes, timestamps ou idées..."
                  className="w-full flex-1 min-h-[110px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  {savedFeedback ? 'Modifications enregistrées' : ''}
                </span>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Supprimer cette vidéo ?"
        description={`« ${video.title} » sera retirée définitivement de votre bibliothèque et de tous vos projets.`}
        confirmLabel={deleting ? 'Suppression...' : 'Supprimer la vidéo'}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
