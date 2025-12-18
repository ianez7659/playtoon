// Genre type
export type Genre = 'action' | 'romance' | 'comedy' | 'drama' | 'fantasy' | 'horror' | 'sci-fi';

// Database row types (internal use)
export type WebtoonRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  type: string | null; // 'amateur' | 'regular' | null
  genre: string | null; // Genre string or null
  view_count: number | null; // View count for popularity sorting
  last_viewed_at: string | null; // Timestamp of last view for trending
};

export type CutRow = {
  id: string;
  webtoon_id: string | null; // Keep for backward compatibility
  episode_id: string | null; // New field for episodes
  title: string | null;
  description: string | null;
  image_url: string | null;
  animation_type: string | null;
  out_effect: string | null;
  duration: number | null;
  type: string | null;
  created_at: string;
};

export type SeriesRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  genre: string | null;
  type: string | null;
  view_count: number | null;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EpisodeRow = {
  id: string;
  series_id: string;
  episode_title: string;
  view_count: number | null;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Animation types
export type AnimationType = 'basic' | 'parallax' | 'morphing' | '3d-flip' | 'physics' | 'timeline' | 'texture' | 'smooth-scroll' | 'blur-fade' | 'ripple' | 'shutter' | 'slice';

export type OutEffectType = "fade-out" | "slice" | "zoom-out" | "slide-out" | "shutter-out";

// Data interfaces
export interface CutData {
  id?: string; // Added for Supabase
  title: string;
  description: string;
  imageUrl?: string;
  animationType?: AnimationType;
  outEffect?: OutEffectType;
  duration?: number;
  type?: 'image' | 'command-battle';
}

// Series interface (작품 레벨)
export interface SeriesData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  genre?: Genre;
  type?: 'amateur' | 'regular';
  viewCount?: number;
  lastViewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// Episode interface (에피소드 레벨)
export interface EpisodeData {
  id: string;
  seriesId: string;
  episodeTitle: string;
  cuts: CutData[];
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  lastViewedAt?: string;
}

// Legacy WebtoonData interface (for backward compatibility)
// @deprecated Use SeriesData and EpisodeData instead
export interface WebtoonData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  cuts: CutData[];
  createdAt: string;
  type?: 'amateur' | 'regular'; // 'amateur' for originals page, 'regular' for dashboard
  genre?: Genre; // Genre of the webtoon
  viewCount?: number; // View count for popularity sorting
  lastViewedAt?: string; // Timestamp of last view for trending
}

