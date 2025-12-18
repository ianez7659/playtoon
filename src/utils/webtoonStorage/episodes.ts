import { supabase } from '@/lib/supabase';
import type { EpisodeData, EpisodeRow } from './types';
import { cutRowToCutData, cutDataToCutRow, episodeRowToEpisodeData } from './helpers';

// Save a new episode to Supabase
export const saveEpisode = async (episodeData: EpisodeData): Promise<void> => {
  try {
    console.log('Saving episode:', episodeData.id);
    
    // Insert episode
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        id: episodeData.id,
        series_id: episodeData.seriesId,
        episode_title: episodeData.episodeTitle,
      })
      .select()
      .single();

    if (episodeError) {
      const errorMessage = episodeError.message || String(episodeError) || 'Unknown error';
      console.error('Failed to insert episode:', {
        message: errorMessage,
        code: episodeError.code,
        details: episodeError.details,
        hint: episodeError.hint,
      });
      
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        throw new Error(`Database RLS policy error: ${errorMessage}. Please configure RLS policies in Supabase dashboard: Table Editor > episodes > Policies.`);
      }
      
      throw new Error(`Failed to save episode: ${errorMessage}`);
    }

    console.log('Episode inserted successfully:', episode?.id);

    // Insert cuts
    if (episodeData.cuts && episodeData.cuts.length > 0) {
      const cutsToInsert = episodeData.cuts.map(cut => cutDataToCutRow(cut, episodeData.id));
      
      console.log('Inserting cuts:', cutsToInsert.length);
      
      const { error: cutsError } = await supabase
        .from('cuts')
        .insert(cutsToInsert);

      if (cutsError) {
        const errorMessage = cutsError.message || String(cutsError) || 'Unknown error';
        console.error('Failed to insert cuts:', {
          message: errorMessage,
          code: cutsError.code,
          details: cutsError.details,
          hint: cutsError.hint,
        });
        
        if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
          throw new Error(`Database RLS policy error: ${errorMessage}. Please configure RLS policies in Supabase dashboard: Table Editor > cuts > Policies.`);
        }
        
        throw new Error(`Failed to save cuts: ${errorMessage}`);
      }
      
      console.log('Cuts inserted successfully');
    }
  } catch (error: unknown) {
    console.error('Failed to save episode:', error);
    
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : String(error) || 'Unknown error occurred';
    throw new Error(`Failed to save episode: ${errorMessage}`);
  }
};

// Get all episodes for a series from Supabase
export const getEpisodes = async (seriesId: string): Promise<EpisodeData[]> => {
  try {
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select(`
        *,
        cuts (*)
      `)
      .eq('series_id', seriesId)
      .order('created_at', { ascending: false });

    if (episodesError) {
      throw episodesError;
    }

    if (!episodes) {
      return [];
    }

    return episodes.map((episode) => {
      const episodeRow = episode as unknown as EpisodeRow & { cuts?: unknown[] };
      const cuts = (episodeRow.cuts || []).map((cut) => cutRowToCutData(cut as unknown as import('./types').CutRow));
      return episodeRowToEpisodeData(episodeRow, cuts);
    });
  } catch (error: unknown) {
    console.error('Failed to load episodes:', error);
    return [];
  }
};

// Get an episode by ID from Supabase
export const getEpisodeById = async (id: string): Promise<EpisodeData | null> => {
  try {
    const { data: episode, error } = await supabase
      .from('episodes')
      .select(`
        *,
        cuts (*)
      `)
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

    if (!episode) {
      return null;
    }

    const episodeRow = episode as unknown as EpisodeRow & { cuts?: unknown[] };
    const cuts = (episodeRow.cuts || []).map((cut) => cutRowToCutData(cut as unknown as import('./types').CutRow));
    return episodeRowToEpisodeData(episodeRow, cuts);
  } catch (error: unknown) {
    console.error('Unexpected error in getEpisodeById:', error);
    return null;
  }
};

//Delete an episode from Supabase
export const deleteEpisode = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete episode:', error);
    throw error;
  }
};

// Update an episode in Supabase
export const updateEpisode = async (id: string, updatedData: Partial<EpisodeData>): Promise<void> => {
  try {
    // Update episode
    const episodeUpdate: Partial<EpisodeRow> = {};
    if (updatedData.episodeTitle !== undefined) episodeUpdate.episode_title = updatedData.episodeTitle;

    if (Object.keys(episodeUpdate).length > 0) {
      episodeUpdate.updated_at = new Date().toISOString();
      
      const { error: episodeError } = await supabase
        .from('episodes')
        .update(episodeUpdate)
        .eq('id', id);

      if (episodeError) {
        const errorMessage = episodeError.message || String(episodeError) || 'Unknown error';
        throw new Error(`Failed to update episode: ${errorMessage}`);
      }
    }

    // Update cuts if provided
    if (updatedData.cuts !== undefined) {
      // Delete existing cuts
      const { error: deleteError } = await supabase
        .from('cuts')
        .delete()
        .eq('episode_id', id);

      if (deleteError) {
        const errorMessage = deleteError.message || String(deleteError) || 'Unknown error';
        throw new Error(`Failed to delete cuts: ${errorMessage}`);
      }

      // Insert new cuts
      if (updatedData.cuts.length > 0) {
        const cutsToInsert = updatedData.cuts.map(cut => cutDataToCutRow(cut, id));
        
        const { error: cutsError } = await supabase
          .from('cuts')
          .insert(cutsToInsert);

        if (cutsError) {
          const errorMessage = cutsError.message || String(cutsError) || 'Unknown error';
          throw new Error(`Failed to insert cuts: ${errorMessage}`);
        }
      }
    }
  } catch (error: unknown) {
    console.error('Failed to update episode:', error);
    
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : String(error) || 'Unknown error occurred';
    throw new Error(`Failed to update episode: ${errorMessage}`);
  }
};
