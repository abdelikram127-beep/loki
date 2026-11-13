import thumbArchitecture from '../assets/images/thumb_architecture_film_1794584196720.jpg';
import thumbDesign from '../assets/images/thumb_design_studio_1794584197013.jpg';
import thumbCulinary from '../assets/images/thumb_culinary_craft_1794584197088.jpg';
import type { VideoItem } from '../types';

export const FALLBACK_THUMBNAILS: Record<NonNullable<VideoItem['fallbackKey']>, string> = {
  architecture: thumbArchitecture,
  design: thumbDesign,
  culinary: thumbCulinary,
};

export function resolveVideoThumbnail(video: Pick<VideoItem, 'thumbnailUrl' | 'fallbackKey'>): string {
  if (video.thumbnailUrl && !video.thumbnailUrl.startsWith('fallback:')) {
    return video.thumbnailUrl;
  }
  if (video.thumbnailUrl?.startsWith('fallback:')) {
    const key = video.thumbnailUrl.replace('fallback:', '') as NonNullable<VideoItem['fallbackKey']>;
    if (FALLBACK_THUMBNAILS[key]) {
      return FALLBACK_THUMBNAILS[key];
    }
  }
  if (video.fallbackKey && FALLBACK_THUMBNAILS[video.fallbackKey]) {
    return FALLBACK_THUMBNAILS[video.fallbackKey];
  }
  return '';
}
