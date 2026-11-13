import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Library,
  FolderKanban,
  Search,
  BarChart3,
  Plus,
  Sun,
  Moon,
  Heart,
  SlidersHorizontal,
  X,
  ArrowUpDown,
} from 'lucide-react';
import type {
  AppView,
  LibraryData,
  PlatformFilter,
  ProjectItem,
  SortField,
  VideoItem,
} from './types';
import { PLATFORM_LABELS, PLATFORM_STYLES, PROJECT_COLORS } from './lib/platforms';
import { resolveVideoThumbnail } from './lib/thumbnails';
import { VideoCard } from './components/VideoCard';
import { AddVideoModal } from './components/AddVideoModal';
import { VideoDetailModal } from './components/VideoDetailModal';
import { ProjectModal } from './components/ProjectModal';
import { ProjectDetailView } from './components/ProjectDetailView';
import { StatsView } from './components/StatsView';
import { PlatformIcon } from './components/PlatformIcon';

export default function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Navigation & Filters
  const [view, setView] = useState<AppView>('library');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('newest');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addDefaultProjectId, setAddDefaultProjectId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Theme (Light / Dark)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('clipotheque-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('clipotheque-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('clipotheque-theme', 'light');
    }
  }, [isDark]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/library');
      if (!res.ok) throw new Error('Erreur serveur');
      const data = (await res.json()) as LibraryData;
      setVideos(data.videos || []);
      setProjects(data.projects || []);
    } catch {
      setLoadError('Impossible de charger la bibliothèque vidéo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Derived data
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const v of videos) {
      for (const t of v.tags) set.add(t);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [videos]);

  const filterCounts = useMemo(() => {
    return {
      all: videos.length,
      youtube: videos.filter((v) => v.platform === 'youtube').length,
      instagram: videos.filter((v) => v.platform === 'instagram').length,
      tiktok: videos.filter((v) => v.platform === 'tiktok').length,
      favorites: videos.filter((v) => v.isFavorite).length,
    };
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const list = videos.filter((v) => {
      if (platformFilter === 'favorites' && !v.isFavorite) return false;
      if (
        platformFilter !== 'all' &&
        platformFilter !== 'favorites' &&
        v.platform !== platformFilter
      ) {
        return false;
      }
      if (selectedTag && !v.tags.includes(selectedTag)) return false;

      if (q) {
        const hay = [v.title, v.author, v.notes, ...v.tags].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'fr');
      }
      return a.platform.localeCompare(b.platform, 'fr');
    });
  }, [videos, platformFilter, selectedTag, searchQuery, sortBy]);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  // Handlers
  const handleToggleFavorite = async (video: VideoItem) => {
    const nextFav = !video.isFavorite;
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, isFavorite: nextFav } : v))
    );
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: nextFav }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setVideos((prev) =>
        prev.map((v) => (v.id === video.id ? { ...v, isFavorite: !nextFav } : v))
      );
    }
  };

  const handleVideoCreated = (newVideo: VideoItem) => {
    setVideos((prev) => [newVideo, ...prev]);
    setProjects((prev) =>
      prev.map((p) =>
        newVideo.projectIds.includes(p.id) && !p.videoOrder.includes(newVideo.id)
          ? { ...p, videoOrder: [newVideo.id, ...p.videoOrder] }
          : p
      )
    );
  };

  const handleVideoUpdated = (updated: VideoItem) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setSelectedVideo(updated);
    setProjects((prev) =>
      prev.map((p) => {
        const shouldHave = updated.projectIds.includes(p.id);
        const has = p.videoOrder.includes(updated.id);
        if (shouldHave && !has) {
          return { ...p, videoOrder: [...p.videoOrder, updated.id] };
        }
        if (!shouldHave && has) {
          return { ...p, videoOrder: p.videoOrder.filter((id) => id !== updated.id) };
        }
        return p;
      })
    );
  };

  const handleVideoDeleted = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== videoId));
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        videoOrder: p.videoOrder.filter((id) => id !== videoId),
      }))
    );
  };

  const handleProjectSaved = (project: ProjectItem, isEdit: boolean) => {
    if (isEdit) {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    } else {
      setProjects((prev) => [...prev, project]);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        setVideos((prev) =>
          prev.map((v) => ({
            ...v,
            projectIds: v.projectIds.filter((id) => id !== projectId),
          }))
        );
        if (activeProjectId === projectId) {
          setActiveProjectId(null);
          setView('projects');
        }
      }
    } catch {
      // ignore quietly
    }
  };

  const handleReorderProjectVideos = async (projectId: string, nextOrder: string[]) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, videoOrder: nextOrder } : p))
    );
    try {
      await fetch(`/api/projects/${projectId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoOrder: nextOrder }),
      });
    } catch {
      fetchLibrary();
    }
  };

  const openProjectDetail = (projectId: string) => {
    setActiveProjectId(projectId);
    setView('project-detail');
  };

  const openAddVideo = (projectId: string | null = null) => {
    setAddDefaultProjectId(projectId);
    setAddModalOpen(true);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    if (view !== 'library' && view !== 'search') {
      setView('library');
    }
  };

  const pageTitle = useMemo(() => {
    if (view === 'library') return 'Bibliothèque';
    if (view === 'projects') return 'Projets';
    if (view === 'project-detail') return activeProject?.name || 'Projet';
    if (view === 'search') return 'Recherche & Filtres';
    return 'Statistiques';
  }, [view, activeProject]);

  const filterTabs: { id: PlatformFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Toutes', count: filterCounts.all },
    { id: 'youtube', label: 'YouTube', count: filterCounts.youtube },
    { id: 'instagram', label: 'Instagram', count: filterCounts.instagram },
    { id: 'tiktok', label: 'TikTok', count: filterCounts.tiktok },
    { id: 'favorites', label: 'Favoris', count: filterCounts.favorites },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1520]">
        {/* Brand Wordmark */}
        <div className="h-16 px-6 flex items-center border-b border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setView('library')}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Clipothèque
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
          <nav className="space-y-1" aria-label="Navigation principale">
            <button
              type="button"
              onClick={() => setView('library')}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                view === 'library'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <Library className="h-4 w-4 shrink-0" />
                Bibliothèque
              </span>
              <span className="font-mono text-xs tabular-nums opacity-75">{videos.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setView('projects')}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                view === 'projects' || view === 'project-detail'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <FolderKanban className="h-4 w-4 shrink-0" />
                Projets
              </span>
              <span className="font-mono text-xs tabular-nums opacity-75">{projects.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setView('search')}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                view === 'search'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Search className="h-4 w-4 shrink-0" />
              Recherche
            </button>

            <button
              type="button"
              onClick={() => setView('stats')}
              className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                view === 'stats'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 shrink-0" />
              Statistiques
            </button>
          </nav>

          {/* Projects Quick List */}
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Mes projets
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingProject(null);
                  setProjectModalOpen(true);
                }}
                aria-label="Créer un projet"
                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-0.5">
              {projects.map((proj) => {
                const count = videos.filter((v) => v.projectIds.includes(proj.id)).length;
                const active = view === 'project-detail' && activeProjectId === proj.id;
                const token = PROJECT_COLORS[proj.color] ?? PROJECT_COLORS.blue;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => openProjectDetail(proj.id)}
                    className={`w-full min-h-[40px] px-3 py-1.5 rounded-xl text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-100 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${token.dot}`} />
                      <span className="truncate">{proj.name}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-400 tabular-nums shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Theme Switch */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => setIsDark(!isDark)}
            className="w-full min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {isDark ? 'Thème clair' : 'Thème sombre'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Desktop Top Bar (3-zone contract) */}
        <header className="hidden lg:flex h-16 sticky top-0 z-30 items-center justify-between gap-8 px-8 bg-slate-50/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
          {/* Zone 1: Current context title */}
          <h1 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 truncate max-w-xs">
            {pageTitle}
          </h1>

          {/* Zone 2: Quick search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (view !== 'library' && view !== 'search') {
                  setView('library');
                }
              }}
              placeholder="Rechercher par titre, tag ou note..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Zone 3: Single Primary Action */}
          <button
            type="button"
            onClick={() => openAddVideo(view === 'project-detail' ? activeProjectId : null)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Ajouter une vidéo
          </button>
        </header>

        {/* Mobile Compact Top App Bar (52px) */}
        <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 flex items-center justify-between gap-3 bg-white/90 dark:bg-[#0F1520]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setView('library')}
            className="font-display text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Clipothèque
          </button>

          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            {pageTitle}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label={isDark ? 'Passer au thème clair' : 'Passer au thème sombre'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={() => setView('stats')}
              aria-label="Statistiques et export"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Main Viewport Container */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loadError ? (
            <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-red-200 dark:border-red-900 p-8 text-center">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{loadError}</p>
              <button
                type="button"
                onClick={fetchLibrary}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium cursor-pointer"
              >
                Réessayer
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-slate-200 dark:bg-slate-800" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* VIEW 1: LIBRARY */}
              {view === 'library' && (
                <div className="space-y-6">
                  {/* Toolbar: Platform Segmented Filter + Sort */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div
                      className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 overflow-x-auto"
                      role="tablist"
                      aria-label="Filtrer par plateforme"
                    >
                      {filterTabs.map((tab) => {
                        const active = platformFilter === tab.id;
                        const isPlatform =
                          tab.id === 'youtube' || tab.id === 'instagram' || tab.id === 'tiktok';
                        const activeStyle = isPlatform
                          ? PLATFORM_STYLES[tab.id as 'youtube' | 'instagram' | 'tiktok'].activeTab
                          : 'bg-white dark:bg-[#1C2536] text-slate-900 dark:text-slate-100';
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setPlatformFilter(tab.id)}
                            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              active
                                ? `${activeStyle} shadow-xs font-semibold`
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                          >
                            {isPlatform && (
                              <PlatformIcon
                                platform={tab.id as 'youtube' | 'instagram' | 'tiktok'}
                                className="h-3.5 w-3.5 shrink-0"
                              />
                            )}
                            {tab.id === 'favorites' && (
                              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
                            )}
                            <span>{tab.label}</span>
                            <span className="font-mono text-[11px] opacity-70 tabular-nums">
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {selectedTag && (
                        <button
                          type="button"
                          onClick={() => setSelectedTag(null)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <span>Tag : #{selectedTag}</span>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <ArrowUpDown className="h-3.5 w-3.5 shrink-0" />
                        <span className="sr-only">Trier par</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortField)}
                          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                        >
                          <option value="newest">Plus récentes</option>
                          <option value="oldest">Plus anciennes</option>
                          <option value="title">Titre (A-Z)</option>
                          <option value="platform">Plateforme</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Mobile inline quick search */}
                  <div className="lg:hidden relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par titre, tag ou note..."
                      className="w-full min-h-[44px] pl-10 pr-4 rounded-xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  {/* Video Grid */}
                  {videos.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-12 text-center">
                      <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Votre bibliothèque est vide
                      </h2>
                      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        Collez un lien YouTube, Instagram ou TikTok pour extraire ses informations et commencer à organiser vos vidéos.
                      </p>
                      <button
                        type="button"
                        onClick={() => openAddVideo(null)}
                        className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter ma première vidéo
                      </button>
                    </div>
                  ) : filteredVideos.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-10 text-center">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Aucune vidéo ne correspond à vos critères.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPlatformFilter('all');
                          setSearchQuery('');
                          setSelectedTag(null);
                        }}
                        className="mt-4 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Réinitialiser les filtres
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredVideos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          projects={projects}
                          onSelect={setSelectedVideo}
                          onToggleFavorite={handleToggleFavorite}
                          onTagClick={handleTagClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: PROJECTS LIST */}
              {view === 'projects' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
                        Projets & Playlists
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Regroupez vos vidéos par thématique et réorganisez leur ordre de lecture.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProject(null);
                        setProjectModalOpen(true);
                      }}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Nouveau projet
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-12 text-center">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        Aucun projet créé pour le moment.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProject(null);
                          setProjectModalOpen(true);
                        }}
                        className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        Créer un premier projet
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {projects.map((proj) => {
                        const projVideos = videos.filter((v) => v.projectIds.includes(proj.id));
                        const token = PROJECT_COLORS[proj.color] ?? PROJECT_COLORS.blue;
                        const previewThumbs = projVideos.slice(0, 3);
                        return (
                          <button
                            key={proj.id}
                            type="button"
                            onClick={() => openProjectDetail(proj.id)}
                            className="group text-left rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-2.5 min-w-0">
                                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${token.dot}`} />
                                  <span className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate transition-colors">
                                    {proj.name}
                                  </span>
                                </span>
                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                                  {projVideos.length}
                                </span>
                              </div>

                              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2.5em]">
                                {proj.description || 'Aucune description ajoutée.'}
                              </p>
                            </div>

                            {/* Visual thumbnail strip */}
                            <div className="mt-4 grid grid-cols-3 gap-2">
                              {[0, 1, 2].map((slot) => {
                                const vid = previewThumbs[slot];
                                const thumb = vid ? resolveVideoThumbnail(vid) : '';
                                return (
                                  <div
                                    key={slot}
                                    className="aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center"
                                  >
                                    {vid && thumb ? (
                                      <img
                                        src={thumb}
                                        alt=""
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : vid ? (
                                      <PlatformIcon
                                        platform={vid.platform}
                                        className="w-4 h-4 text-slate-400"
                                      />
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: PROJECT DETAIL */}
              {view === 'project-detail' && activeProject && (
                <ProjectDetailView
                  project={activeProject}
                  videos={videos}
                  onBack={() => setView('projects')}
                  onEditProject={(proj) => {
                    setEditingProject(proj);
                    setProjectModalOpen(true);
                  }}
                  onDeleteProject={handleDeleteProject}
                  onSelectVideo={setSelectedVideo}
                  onToggleFavorite={handleToggleFavorite}
                  onReorderVideos={handleReorderProjectVideos}
                  onAddVideoToProject={(projId) => openAddVideo(projId)}
                />
              )}

              {/* VIEW 4: DEDICATED SEARCH & FILTERS */}
              {view === 'search' && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-white dark:bg-[#131A26] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                      <span>Recherche avancée et filtres</span>
                    </div>

                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tapez un mot-clé (titre, créateur, tag, note personnelle)..."
                        className="w-full min-h-[48px] pl-12 pr-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {filterTabs.map((tab) => {
                        const active = platformFilter === tab.id;
                        const isPlatform =
                          tab.id === 'youtube' || tab.id === 'instagram' || tab.id === 'tiktok';
                        const activeClass = isPlatform
                          ? PLATFORM_STYLES[tab.id as 'youtube' | 'instagram' | 'tiktok'].activeBorder
                          : tab.id === 'favorites'
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : 'bg-blue-600 border-blue-600 text-white';
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setPlatformFilter(tab.id)}
                            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                              active
                                ? activeClass
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            {isPlatform && (
                              <PlatformIcon
                                platform={tab.id as 'youtube' | 'instagram' | 'tiktok'}
                                className="h-3.5 w-3.5 shrink-0"
                              />
                            )}
                            {tab.id === 'favorites' && (
                              <Heart className={`h-3.5 w-3.5 ${active ? 'fill-current' : 'text-rose-500'}`} />
                            )}
                            <span>{tab.label} ({tab.count})</span>
                          </button>
                        );
                      })}
                    </div>

                    {allTags.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                          Filtrer par tag :
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setSelectedTag(null)}
                            className={`min-h-[32px] font-medium cursor-pointer ${
                              selectedTag === null
                                ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                            }`}
                          >
                            Tous les tags
                          </button>
                          {allTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                              className={`min-h-[32px] font-medium cursor-pointer ${
                                selectedTag === tag
                                  ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">
                      {filteredVideos.length} {filteredVideos.length > 1 ? 'résultats' : 'résultat'}
                    </span>
                    <span>
                      {platformFilter !== 'all' ? PLATFORM_LABELS[platformFilter as 'youtube' | 'instagram' | 'tiktok'] ?? 'Favoris' : 'Toutes plateformes'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        projects={projects}
                        onSelect={setSelectedVideo}
                        onToggleFavorite={handleToggleFavorite}
                        onTagClick={handleTagClick}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 5: STATS */}
              {view === 'stats' && (
                <StatsView
                  videos={videos}
                  projects={projects}
                  onOpenProject={openProjectDetail}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label="Navigation mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 dark:bg-[#0F1520]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center"
      >
        <button
          type="button"
          onClick={() => setView('library')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            view === 'library'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Library className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-tight">Bibliothèque</span>
        </button>

        <button
          type="button"
          onClick={() => setView('projects')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            view === 'projects' || view === 'project-detail'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <FolderKanban className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-tight">Projets</span>
        </button>

        <button
          type="button"
          onClick={() => openAddVideo(view === 'project-detail' ? activeProjectId : null)}
          className="min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-blue-600 dark:text-blue-400 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span className="text-[10px] font-semibold tracking-tight">Ajouter</span>
        </button>

        <button
          type="button"
          onClick={() => setView('search')}
          className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            view === 'search'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium tracking-tight">Recherche</span>
        </button>
      </nav>

      {/* Modals */}
      <AddVideoModal
        open={addModalOpen}
        projects={projects}
        defaultProjectId={addDefaultProjectId}
        onClose={() => setAddModalOpen(false)}
        onCreated={handleVideoCreated}
      />

      <VideoDetailModal
        video={selectedVideo}
        projects={projects}
        onClose={() => setSelectedVideo(null)}
        onUpdated={handleVideoUpdated}
        onDeleted={handleVideoDeleted}
      />

      <ProjectModal
        open={projectModalOpen}
        editingProject={editingProject}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSaved={handleProjectSaved}
      />
    </div>
  );
}
