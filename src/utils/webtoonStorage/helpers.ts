import type { CutRow, CutData, SeriesRow, SeriesData, EpisodeRow, EpisodeData, AnimationType, OutEffectType } from './types';

// Convert CutRow to CutData
export function cutRowToCutData(cutRow: CutRow): CutData {
  return {
    id: cutRow.id,
    title: cutRow.title || '',
    description: cutRow.description || '',
    imageUrl: cutRow.image_url || undefined,
    animationType: cutRow.animation_type as AnimationType | undefined,
    outEffect: cutRow.out_effect as OutEffectType | undefined,
    duration: cutRow.duration || undefined,
    type: cutRow.type as 'image' | 'command-battle' | undefined,
  };
}

// Convert CutData to CutRow (for insert/update)
export function cutDataToCutRow(cutData: CutData, episodeId: string): Omit<CutRow, 'id' | 'created_at'> {
  return {
    webtoon_id: null, // Deprecated, use episode_id
    episode_id: episodeId,
    title: cutData.title || null,
    description: cutData.description || null,
    image_url: cutData.imageUrl || null,
    animation_type: cutData.animationType || null,
    out_effect: cutData.outEffect || null,
    duration: cutData.duration || null,
    type: cutData.type || null,
  };
}

// Convert SeriesRow to SeriesData
export function seriesRowToSeriesData(seriesRow: SeriesRow): SeriesData {
  return {
    id: seriesRow.id,
    title: seriesRow.title,
    description: seriesRow.description || '',
    thumbnailUrl: seriesRow.thumbnail_url || undefined,
    genre: seriesRow.genre as SeriesData['genre'],
    type: seriesRow.type as 'amateur' | 'regular' | undefined,
    viewCount: seriesRow.view_count || 0,
    lastViewedAt: seriesRow.last_viewed_at || undefined,
    createdAt: seriesRow.created_at,
    updatedAt: seriesRow.updated_at,
  };
}

// Convert SeriesData to SeriesRow (for insert/update)
export function seriesDataToSeriesRow(seriesData: SeriesData): Omit<SeriesRow, 'created_at' | 'updated_at'> {
  return {
    id: seriesData.id,
    title: seriesData.title,
    description: seriesData.description || null,
    thumbnail_url: seriesData.thumbnailUrl || null,
    genre: seriesData.genre || null,
    type: seriesData.type || null,
    view_count: seriesData.viewCount || 0,
    last_viewed_at: seriesData.lastViewedAt || null,
  };
}

// Convert EpisodeRow to EpisodeData
export function episodeRowToEpisodeData(episodeRow: EpisodeRow, cuts: CutData[]): EpisodeData {
  return {
    id: episodeRow.id,
    seriesId: episodeRow.series_id,
    episodeTitle: episodeRow.episode_title,
    cuts: cuts,
    createdAt: episodeRow.created_at,
    updatedAt: episodeRow.updated_at,
    viewCount: episodeRow.view_count || 0,
    lastViewedAt: episodeRow.last_viewed_at || undefined,
  };
}

// Convert EpisodeData to EpisodeRow (for insert/update)
export function episodeDataToEpisodeRow(episodeData: EpisodeData): Omit<EpisodeRow, 'created_at' | 'updated_at'> {
  return {
    id: episodeData.id,
    series_id: episodeData.seriesId,
    episode_title: episodeData.episodeTitle,
    view_count: episodeData.viewCount || 0,
    last_viewed_at: episodeData.lastViewedAt || null,
  };
}

