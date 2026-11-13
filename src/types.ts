export type Platform = 'youtube' | 'instagram' | 'tiktok';

export interface VideoItem {
  id: string;
  url: string;
  platform: Platform;
  videoId: string;
  embedUrl: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  fallbackKey?: 'architecture' | 'design' | 'culinary';
  duration: string;
  addedAt: string;
  projectIds: string[];
  tags: string[];
  notes: string;
  isFavorite: boolean;
}

export type ProjectColor = 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  color: ProjectColor;
  videoOrder: string[];
  createdAt: string;
}

export interface LibraryData {
  videos: VideoItem[];
  projects: ProjectItem[];
}

export interface ExtractedMetadata {
  platform: Platform;
  videoId: string;
  embedUrl: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  duration: string;
  oembedSuccess: boolean;
}

export type PlatformFilter = 'all' | 'youtube' | 'instagram' | 'tiktok' | 'favorites';
export type SortField = 'newest' | 'oldest' | 'title' | 'platform';
export type AppView = 'library' | 'projects' | 'project-detail' | 'search' | 'stats';
