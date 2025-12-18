import { supabase } from '@/lib/supabase';
import type { WebtoonData, WebtoonRow, Genre } from './types';
import { cutRowToCutData, cutDataToCutRow } from './helpers';

// Save a new webtoon to Supabase
// @deprecated Use saveSeries and saveEpisode instead
export const saveWebtoon = async (webtoonData: WebtoonData): Promise<void> => {
  try {
    console.log('Saving webtoon:', webtoonData.id);
    
    // Insert webtoon
    const { data: webtoon, error: webtoonError } = await supabase
      .from('webtoons')
      .insert({
        id: webtoonData.id,
        title: webtoonData.title,
        description: webtoonData.description || null,
        thumbnail_url: webtoonData.thumbnailUrl || null,
        created_at: webtoonData.createdAt,
        type: webtoonData.type || null, // Save webtoon type
        genre: webtoonData.genre || null, // Save genre
        view_count: webtoonData.viewCount || 0, // Save view count
      })
      .select()
      .single();

    if (webtoonError) {
      const errorMessage = webtoonError.message || String(webtoonError) || 'Unknown error';
      console.error('Failed to insert webtoon:', {
        message: errorMessage,
        code: webtoonError.code,
        details: webtoonError.details,
        hint: webtoonError.hint,
      });
      
      // Check for RLS policy error
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        throw new Error(`Database RLS policy error: ${errorMessage}. Please configure RLS policies in Supabase dashboard: Table Editor > webtoons > Policies. Create policies that allow INSERT and SELECT operations.`);
      }
      
      throw new Error(`Failed to save webtoon: ${errorMessage}`);
    }

    console.log('Webtoon inserted successfully:', webtoon?.id);

    // Insert cuts
    if (webtoonData.cuts && webtoonData.cuts.length > 0) {
      const cutsToInsert = webtoonData.cuts.map(cut => cutDataToCutRow(cut, webtoonData.id));
      
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
        
        // Check for RLS policy error
        if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
          throw new Error(`Database RLS policy error: ${errorMessage}. Please configure RLS policies in Supabase dashboard: Table Editor > cuts > Policies. Create policies that allow INSERT and SELECT operations.`);
        }
        
        throw new Error(`Failed to save cuts: ${errorMessage}`);
      }
      
      console.log('Cuts inserted successfully');
    }
  } catch (error: unknown) {
    console.error('Failed to save webtoon:', error);
    
    // If it's already a formatted error message, throw it as is
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    // Otherwise, create a formatted error
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : String(error) || 'Unknown error occurred';
    throw new Error(`Failed to save webtoon: ${errorMessage}`);
  }
};

// Get all webtoons from Supabase
// @deprecated Use getSeries and getEpisodes instead
export const getWebtoons = async (): Promise<WebtoonData[]> => {
  try {
    // Fetch webtoons with their cuts
    const { data: webtoons, error: webtoonsError } = await supabase
      .from('webtoons')
      .select(`
        *,
        cuts (*)
      `)
      .order('created_at', { ascending: false });

    if (webtoonsError) {
      throw webtoonsError;
    }

    if (!webtoons) {
      return [];
    }

    // Transform data to match WebtoonData interface
    return webtoons.map((webtoon) => ({
      id: webtoon.id,
      title: webtoon.title,
      description: webtoon.description || '',
      thumbnailUrl: webtoon.thumbnail_url || undefined,
      cuts: (webtoon.cuts || []).map(cutRowToCutData),
      createdAt: webtoon.created_at,
      type: webtoon.type as 'amateur' | 'regular' | undefined, // Include type field
      genre: webtoon.genre as Genre | undefined, // Include genre field
      viewCount: webtoon.view_count || 0, // Include view count field
      lastViewedAt: webtoon.last_viewed_at || undefined, // Include last viewed at field
    }));
  } catch (error: unknown) {
    console.error('Failed to load webtoons:', error);
    return [];
  }
};

// Get a webtoon by ID from Supabase
// @deprecated Use getSeriesById and getEpisodeById instead
export const getWebtoonById = async (id: string): Promise<WebtoonData | null> => {
  try {
    const { data: webtoon, error } = await supabase
      .from('webtoons')
      .select(`
        *,
        cuts (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 means no rows returned - this is normal for new webtoons
      // Also check for other "not found" error codes
      const notFoundCodes = ['PGRST116', '42P01']; // 42P01 = relation does not exist
      const isNotFoundError = notFoundCodes.includes(error.code || '') || 
                              error.message?.includes('No rows') ||
                              error.message?.includes('not found') ||
                              error.message?.includes('does not exist');
      
      if (isNotFoundError) {
        // This is normal for new webtoons - silently return null
        return null;
      }
      
      // For other errors, log but don't crash
      // Try to extract error message safely
      const errorMessage = error.message || String(error) || 'Unknown error';
      console.warn('Supabase query error (non-critical):', errorMessage);
      
      // Return null instead of throwing to prevent UI crashes
      return null;
    }

    if (!webtoon) {
      console.log('No webtoon data returned');
      return null;
    }

    console.log('Webtoon loaded successfully:', webtoon.id);

    return {
      id: webtoon.id,
      title: webtoon.title,
      description: webtoon.description || '',
      thumbnailUrl: webtoon.thumbnail_url || undefined,
      cuts: (webtoon.cuts || []).map(cutRowToCutData),
      createdAt: webtoon.created_at,
      type: webtoon.type as 'amateur' | 'regular' | undefined, // Include type field
      genre: webtoon.genre as Genre | undefined, // Include genre field
      viewCount: webtoon.view_count || 0, // Include view count field
      lastViewedAt: webtoon.last_viewed_at || undefined, // Include last viewed at field
    };
  } catch (error: unknown) {
    // Catch any unexpected errors
    console.error('Unexpected error in getWebtoonById:', error);
    console.error('Error type:', typeof error);
    try {
      console.error('Error stringified:', JSON.stringify(error, null, 2));
    } catch (e) {
      console.error('Error toString:', String(error));
    }
    
    // Return null instead of throwing to prevent UI crashes
    return null;
  }
};

// Delete a webtoon from Supabase
// @deprecated Use deleteSeries instead
export const deleteWebtoon = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('webtoons')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete webtoon:', error);
    throw error;
  }
};

// Update a webtoon in Supabase
// @deprecated Use updateSeries and updateEpisode instead
export const updateWebtoon = async (id: string, updatedData: Partial<WebtoonData>): Promise<void> => {
  try {
    // Update webtoon
    const webtoonUpdate: Partial<WebtoonRow> = {};
    if (updatedData.title !== undefined) webtoonUpdate.title = updatedData.title;
    if (updatedData.description !== undefined) webtoonUpdate.description = updatedData.description || null;
    if (updatedData.thumbnailUrl !== undefined) webtoonUpdate.thumbnail_url = updatedData.thumbnailUrl || null;
    if (updatedData.type !== undefined) webtoonUpdate.type = updatedData.type || null; // Update type field
    if (updatedData.genre !== undefined) webtoonUpdate.genre = updatedData.genre || null; // Update genre field
    if (updatedData.viewCount !== undefined) webtoonUpdate.view_count = updatedData.viewCount || 0; // Update view count field

    if (Object.keys(webtoonUpdate).length > 0) {
      console.log('Updating webtoon with data:', webtoonUpdate);
      const { error: webtoonError } = await supabase
        .from('webtoons')
        .update(webtoonUpdate)
        .eq('id', id);

      if (webtoonError) {
        const errorMessage = webtoonError.message || String(webtoonError) || 'Unknown error';
        console.error('Failed to update webtoon in database:', {
          message: errorMessage,
          code: webtoonError.code,
          details: webtoonError.details,
          hint: webtoonError.hint,
        });
        
        // Check for column not found error (genre column might not exist)
        if (errorMessage.includes('column') && errorMessage.includes('genre')) {
          throw new Error(`Database column 'genre' does not exist. Please add a 'genre' column (text, nullable) to the 'webtoons' table in Supabase.`);
        }
        
        throw new Error(`Failed to update webtoon: ${errorMessage}`);
      }
    }

    // Update cuts if provided
    if (updatedData.cuts !== undefined) {
      // Delete existing cuts
      const { error: deleteError } = await supabase
        .from('cuts')
        .delete()
        .eq('webtoon_id', id);

      if (deleteError) {
        const errorMessage = deleteError.message || String(deleteError) || 'Unknown error';
        console.error('Failed to delete cuts:', {
          message: errorMessage,
          code: deleteError.code,
          details: deleteError.details,
        });
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
          console.error('Failed to insert cuts:', {
            message: errorMessage,
            code: cutsError.code,
            details: cutsError.details,
          });
          throw new Error(`Failed to insert cuts: ${errorMessage}`);
        }
      }
    }
  } catch (error: unknown) {
    console.error('Failed to update webtoon:', error);
    
    // If it's already a formatted error message, throw it as is
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    // Otherwise, create a formatted error
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : String(error) || 'Unknown error occurred';
    throw new Error(`Failed to update webtoon: ${errorMessage}`);
  }
};

// Increment view count for a webtoon
// @deprecated Use incrementSeriesViewCount instead
export const incrementWebtoonViewCount = async (id: string): Promise<void> => {
  try {
    // Get current view count
    const { data: webtoon, error: fetchError } = await supabase
      .from('webtoons')
      .select('view_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Failed to fetch webtoon for view count:', fetchError);
      return; // Don't throw, just log and return
    }

    const currentViewCount = webtoon?.view_count || 0;
    
    // Increment view count and update last_viewed_at
    const { error: updateError } = await supabase
      .from('webtoons')
      .update({ 
        view_count: currentViewCount + 1,
        last_viewed_at: new Date().toISOString() // Update last viewed timestamp
      })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to increment view count:', updateError);
      // Don't throw, just log the error
    } else {
      console.log(`View count incremented for webtoon ${id}: ${currentViewCount} -> ${currentViewCount + 1}`);
    }

    // Log view event for trending calculation
    try {
      // First verify that the webtoon exists
      const { data: webtoonCheck, error: checkError } = await supabase
        .from('webtoons')
        .select('id')
        .eq('id', id)
        .single();
      
      if (checkError || !webtoonCheck) {
        console.warn('⚠️ Webtoon not found, skipping view log:', id);
        return; // Don't log view if webtoon doesn't exist
      }
      
      const insertData = {
        webtoon_id: id,
        viewed_at: new Date().toISOString()
      };
      
      console.log('Attempting to insert view log:', insertData);
      
      const { data: viewLogData, error: viewLogError } = await supabase
        .from('webtoon_views')
        .insert(insertData)
        .select();

      if (viewLogError) {
        // Try to get error details in multiple ways
        let errorMessage = '';
        let errorCode = '';
        let errorDetails = '';
        let errorHint = '';
        
        try {
          // Try to access error properties safely
          if (viewLogError && typeof viewLogError === 'object') {
            const errObj = viewLogError as {
              message?: unknown;
              code?: unknown;
              details?: unknown;
              hint?: unknown;
            };
            errorMessage = errObj.message ? String(errObj.message) : '';
            errorCode = errObj.code ? String(errObj.code) : '';
            errorDetails = errObj.details ? String(errObj.details) : '';
            errorHint = errObj.hint ? String(errObj.hint) : '';
          }
          
          // Fallback to string conversion
          if (!errorMessage) {
            errorMessage = String(viewLogError) || 'Unknown error';
          }
        } catch (e) {
          errorMessage = 'Error object could not be parsed: ' + String(e);
        }
        
        // Log all error information in a single console.error to avoid multiple errors
        const errorInfo = {
          message: errorMessage || 'No message',
          code: errorCode || 'No code',
          details: errorDetails || 'No details',
          hint: errorHint || 'No hint',
          errorType: typeof viewLogError,
          errorKeys: viewLogError ? Object.keys(viewLogError) : []
        };
        
        console.error('❌ Failed to log view event:', errorInfo);
        
        // Check for common error patterns
        const errorStr = (errorMessage || '').toLowerCase();
        if (errorStr.includes('row-level security') || 
            errorStr.includes('rls') || 
            errorStr.includes('policy') || 
            errorStr.includes('permission denied') ||
            errorStr.includes('new row violates') ||
            errorCode === '42501' ||
            errorCode === 'PGRST301') {
          console.warn('⚠️ RLS policy error detected!');
          console.warn('Solution: Go to Supabase > Table Editor > webtoon_views > Policies');
          console.warn('Create INSERT policy with: with check (true)');
        } else if (errorStr.includes('relation') && errorStr.includes('does not exist')) {
          console.warn('⚠️ Table does not exist!');
          console.warn('Solution: Create webtoon_views table first');
        } else if (errorStr.includes('column') && errorStr.includes('does not exist')) {
          console.warn('⚠️ Column does not exist!');
          console.warn('Solution: Check table schema matches expected columns');
        }
        // Don't throw, just log the error - view count increment still succeeded
      } else {
        console.log('✅ View event logged successfully');
      }
    } catch (err: unknown) {
      // Catch any unexpected errors
      console.error('💥 Unexpected error logging view event:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err && typeof err === 'object' && 'message' in err ? String((err as { message?: unknown }).message) : String(err));
      // Don't throw, view count increment still succeeded
    }
  } catch (error) {
    console.error('Unexpected error incrementing view count:', error);
    // Don't throw, just log the error
  }
};

