import { supabase } from '@/lib/supabase';
import type { SeriesData, SeriesRow } from './types';
import { seriesRowToSeriesData } from './helpers';

// Save a new series to Supabase
export const saveSeries = async (seriesData: SeriesData): Promise<void> => {
  try {
    console.log('Saving series:', seriesData.id);
    
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .insert({
        id: seriesData.id,
        title: seriesData.title,
        description: seriesData.description || null,
        thumbnail_url: seriesData.thumbnailUrl || null,
        genre: seriesData.genre || null,
        type: seriesData.type || null,
        view_count: seriesData.viewCount || 0,
        last_viewed_at: seriesData.lastViewedAt || null,
      })
      .select()
      .single();

    if (seriesError) {
      const errorMessage = seriesError.message || String(seriesError) || 'Unknown error';
      console.error('Failed to insert series:', {
        message: errorMessage,
        code: seriesError.code,
        details: seriesError.details,
        hint: seriesError.hint,
      });
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        throw new Error(`Database RLS policy error: ${errorMessage}. Please configure RLS policies in Supabase dashboard: Table Editor > series > Policies.`);
      }
      
      throw new Error(`Failed to save series: ${errorMessage}`);
    }

    console.log('Series inserted successfully:', series?.id);
  } catch (error: unknown) {
    console.error('Failed to save series:', error);
    
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : String(error) || 'Unknown error occurred';
    throw new Error(`Failed to save series: ${errorMessage}`);
  }
};

// Get all series from Supabase
export const getSeries = async (): Promise<SeriesData[]> => {
  try {
    const { data: series, error: seriesError } = await supabase
      .from('series')
      .select('*')
      .order('created_at', { ascending: false });

    if (seriesError) {
      throw seriesError;
    }

    if (!series) {
      return [];
    }

    return series.map((s) => seriesRowToSeriesData(s as SeriesRow));
  } catch (error: unknown) {
    console.error('Failed to load series:', error);
    return [];
  }
};

// Get a series by ID from Supabase
export const getSeriesById = async (id: string): Promise<SeriesData | null> => {
  try {
    const { data: series, error } = await supabase
      .from('series')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      const notFoundCodes = ['PGRST116', '42P01'];
      const isNotFoundError = notFoundCodes.includes(error.code || '') || 
                              error.message?.includes('No rows') ||
                              error.message?.includes('not found');
      
      if (isNotFoundError) {
        return null;
      }
      
      const errorMessage = error.message || String(error) || 'Unknown error';
      console.warn('Supabase query error:', errorMessage);
      return null;
    }

    if (!series) {
      return null;
    }

    return seriesRowToSeriesData(series);
  } catch (error: unknown) {
    console.error('Unexpected error in getSeriesById:', error);
    return null;
  }
};

// Delete a series from Supabase
// Episodes and cuts will be automatically deleted due to CASCADE
export const deleteSeries = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('series')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete series:', error);
    throw error;
  }
};

// Update a series in Supabase
export const updateSeries = async (id: string, updatedData: Partial<SeriesData>): Promise<void> => {
  try {
    const seriesUpdate: Partial<SeriesRow> = {};
    if (updatedData.title !== undefined) seriesUpdate.title = updatedData.title;
    if (updatedData.description !== undefined) seriesUpdate.description = updatedData.description || null;
    if (updatedData.thumbnailUrl !== undefined) seriesUpdate.thumbnail_url = updatedData.thumbnailUrl || null;
    if (updatedData.genre !== undefined) seriesUpdate.genre = updatedData.genre || null;
    if (updatedData.type !== undefined) seriesUpdate.type = updatedData.type || null;
    if (updatedData.viewCount !== undefined) seriesUpdate.view_count = updatedData.viewCount || 0;

    if (Object.keys(seriesUpdate).length > 0) {
      seriesUpdate.updated_at = new Date().toISOString();
      
      const { error: seriesError } = await supabase
        .from('series')
        .update(seriesUpdate)
        .eq('id', id);

      if (seriesError) {
        const errorMessage = seriesError.message || String(seriesError) || 'Unknown error';
        throw new Error(`Failed to update series: ${errorMessage}`);
      }
    }
  } catch (error: unknown) {
    console.error('Failed to update series:', error);
    
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : String(error) || 'Unknown error occurred';
    throw new Error(`Failed to update series: ${errorMessage}`);
  }
};

//Sync series view_count from webtoon_views table
export const syncSeriesViewCounts = async (): Promise<void> => {
  try {
    // Get all series
    const { data: allSeries, error: seriesError } = await supabase
      .from('series')
      .select('id');

    if (seriesError || !allSeries) {
      console.error('Failed to fetch series for sync:', seriesError);
      return;
    }

    // For each series, count views from webtoon_views table
    for (const series of allSeries) {
      const { data: views, error: viewsError } = await supabase
        .from('webtoon_views')
        .select('id')
        .or(`series_id.eq.${series.id},webtoon_id.eq.${series.id}`);

      if (viewsError) {
        console.error(`Failed to count views for series ${series.id}:`, viewsError);
        continue;
      }

      const actualViewCount = views?.length || 0;

      // Update series view_count if it doesn't match
      const { data: currentSeries, error: fetchError } = await supabase
        .from('series')
        .select('view_count')
        .eq('id', series.id)
        .single();

      if (fetchError) {
        console.error(`Failed to fetch series ${series.id}:`, fetchError);
        continue;
      }

      const currentViewCount = currentSeries?.view_count || 0;

      if (currentViewCount !== actualViewCount) {
        console.log(`Syncing view count for series ${series.id}: ${currentViewCount} -> ${actualViewCount}`);
        await supabase
          .from('series')
          .update({ view_count: actualViewCount })
          .eq('id', series.id);
      }
    }
  } catch (error) {
    console.error('Unexpected error syncing view counts:', error);
  }
};

