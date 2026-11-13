import { useEffect, useState, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { ProjectColor, ProjectItem } from '../types';
import { PROJECT_COLORS } from '../lib/platforms';

interface ProjectModalProps {
  open: boolean;
  editingProject?: ProjectItem | null;
  onClose: () => void;
  onSaved: (project: ProjectItem, isEdit: boolean) => void;
}

const COLOR_KEYS: ProjectColor[] = ['blue', 'emerald', 'indigo', 'amber', 'rose', 'slate'];

export function ProjectModal({
  open,
  editingProject,
  onClose,
  onSaved,
}: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ProjectColor>('blue');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setDescription(editingProject.description);
      setColor(editingProject.color);
    } else {
      setName('');
      setDescription('');
      setColor('blue');
    }
    setError('');
  }, [editingProject, open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Le nom du projet est obligatoire.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const isEdit = Boolean(editingProject);
      const endpoint = isEdit ? `/api/projects/${editingProject!.id}` : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          color,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Impossible de sauvegarder le projet.');
        return;
      }

      onSaved(data as ProjectItem, isEdit);
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
      aria-labelledby="project-modal-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="project-modal-title"
            className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {editingProject ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="project-name-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Nom du projet
            </label>
            <input
              id="project-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Tutoriels Montage Vidéo"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="project-desc-input"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Description (optionnel)
            </label>
            <textarea
              id="project-desc-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objectif de cette playlist ou thématique..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Couleur de repère
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_KEYS.map((key) => {
                const token = PROJECT_COLORS[key];
                const active = color === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${token.dot}`} />
                    <span>{token.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingProject ? 'Enregistrer' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
