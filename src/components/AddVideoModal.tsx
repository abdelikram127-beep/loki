import { useEffect, useState, type FormEvent } from 'react';
import { X, Link as LinkIcon, Loader2, Check, ClipboardPaste, Heart } from 'lucide-react';
import type { ExtractedMetadata, ProjectItem, VideoItem } from '../types';
import { PLATFORM_LABELS, PLATFORM_STYLES } from '../lib/platforms';
import { PlatformIcon } from './PlatformIcon';

interface AddVideoModalProps {
  open: boolean;
  projects: ProjectItem[];
  defaultProjectId?: string | null;
  onClose: () => void;
  onCreated: (video: VideoItem) => void;
}

export function AddVideoModal({
  open,
  projects,
  defaultProjectId,
  onClose,
  onCreated,
}: AddVideoModalProps) {
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState<ExtractedMetadata | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    defaultProjectId ? [defaultProjectId] : []
  );
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedProjects(defaultProjectId ? [defaultProjectId] : []);
    }
  }, [open, defaultProjectId]);

  if (!open) return null;

  const resetForm = () => {
    setUrl('');
    setMetadata(null);
    setTitle('');
    setAuthor('');
    setThumbnailUrl('');
    setDuration('');
    setNotes('');
    setTagInput('');
    setTags([]);
    setSelectedProjects(defaultProjectId ? [defaultProjectId] : []);
    setIsFavorite(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleExtract = async (targetUrl?: string) => {
    const cleanUrl = (targetUrl ?? url).trim();
    if (!cleanUrl) {
      setError('Collez un lien YouTube, Instagram ou TikTok.');
      return;
    }

    setError('');
    setExtracting(true);
    try {
      const res = await fetch('/api/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de lire ce lien.');
        setMetadata(null);
        return;
      }

      const extracted = data as ExtractedMetadata;
      setMetadata(extracted);
      setTitle(extracted.title || '');
      setAuthor(extracted.author || '');
      setThumbnailUrl(extracted.thumbnailUrl || '');
      setDuration(extracted.duration || '');
    } catch {
      setError('Erreur réseau lors de l’analyse du lien.');
    } finally {
      setExtracting(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        await handleExtract(text);
      }
    } catch {
      setError('Accès au presse-papiers refusé. Collez le lien manuellement (Ctrl+V).');
    }
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const toggleProject = (id: string) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!metadata) {
      await handleExtract();
      return;
    }
    if (!title.trim()) {
      setError('Le titre de la vidéo est requis.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          platform: metadata.platform,
          videoId: metadata.videoId,
          embedUrl: metadata.embedUrl,
          title: title.trim(),
          author: author.trim(),
          thumbnailUrl: thumbnailUrl.trim(),
          duration: duration.trim(),
          projectIds: selectedProjects,
          tags,
          notes: notes.trim(),
          isFavorite,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible d’enregistrer la vidéo.');
        return;
      }

      onCreated(data as VideoItem);
      resetForm();
      onClose();
    } catch {
      setError('Erreur réseau lors de l’enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-video-title"
    >
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h2
            id="add-video-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Ajouter une vidéo
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Step 1: Link Paste */}
          <div>
            <label
              htmlFor="video-url-input"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              Lien YouTube, Instagram ou TikTok
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <LinkIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="video-url-input"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted && (pasted.startsWith('http://') || pasted.startsWith('https://'))) {
                      setTimeout(() => handleExtract(pasted), 60);
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ClipboardPaste className="h-4 w-4" />
                  Coller
                </button>
                <button
                  type="button"
                  onClick={() => handleExtract()}
                  disabled={extracting || !url.trim()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    'Extraire les infos'
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Extraction via oEmbed officiel (sans scraping). Vous pouvez personnaliser tous les champs ci-dessous.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Step 2: Extracted Preview & Editable Fields */}
          {metadata && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              {/* Preview Strip */}
              <div className="flex flex-col sm:flex-row gap-4 items-start p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                <div className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={title || 'Miniature'}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <PlatformIcon platform={metadata.platform} className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <PlatformIcon platform={metadata.platform} className="w-3.5 h-3.5" />
                    <span className={`font-semibold ${PLATFORM_STYLES[metadata.platform].text}`}>
                      {PLATFORM_LABELS[metadata.platform]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {metadata.oembedSuccess
                        ? 'Métadonnées récupérées'
                        : 'Lien détecté (édition manuelle prête)'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                    {title || 'Sans titre'}
                  </p>
                  {author && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{author}</p>
                  )}
                </div>
              </div>

              {/* Editable Title & Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="video-title-input"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Titre personnalisé
                  </label>
                  <input
                    id="video-title-input"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de la vidéo"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="video-author-input"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Chaîne / Créateur
                  </label>
                  <input
                    id="video-author-input"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Nom du créateur"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="video-duration-input"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Durée (optionnel)
                  </label>
                  <input
                    id="video-duration-input"
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="ex. 04:30"
                    className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Projects selection */}
              <div>
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Classer dans un ou plusieurs projets
                </span>
                {projects.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aucun projet créé pour le moment.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {projects.map((proj) => {
                      const active = selectedProjects.includes(proj.id);
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => toggleProject(proj.id)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
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
                  htmlFor="video-tags-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Tags libres
                </label>
                <div className="flex gap-2">
                  <input
                    id="video-tags-input"
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Ajouter un tag et appuyer sur Entrée"
                    className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                          aria-label={`Retirer le tag ${t}`}
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
              <div>
                <label
                  htmlFor="video-notes-input"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Notes personnelles
                </label>
                <textarea
                  id="video-notes-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pourquoi sauvegardez-vous cette vidéo ? Passages clés, idées..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
                />
              </div>

              {/* Favorite toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl border text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer ${
                    isFavorite
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Marquée comme favorite' : 'Marquer comme favorite'}
                </button>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!metadata || saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer dans la bibliothèque'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
