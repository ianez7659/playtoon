import { supabase } from '@/lib/supabase';

// Track ongoing increment operations to prevent duplicate calls
const ongoingIncrements = new Set<string>();

// Get view count for series in the last 24 hours
export const getViewCounts24h = async (): Promise<Record<string, number>> => {
  try {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log('Fetching 24h view counts from:', twentyFourHoursAgo.toISOString());

    // Try to get from series_id first, fallback to webtoon_id for backward compatibility
    const { data, error } = await supabase
      .from('webtoon_views')
      .select('series_id, webtoon_id, viewed_at')
      .gte('viewed_at', twentyFourHoursAgo.toISOString())
      .order('viewed_at', { ascending: false });

    if (error) {
      console.error('Failed to get 24h view counts:', {
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return {};
    }

    console.log('Raw view data from database:', {
      totalRows: data?.length || 0,
      sampleRows: data?.slice(0, 5)
    });

    // Count views per series
    const viewCounts: Record<string, number> = {};
    data?.forEach((view) => {
      // Prioritize series_id, fallback to webtoon_id
      const seriesId = view.series_id || view.webtoon_id;
      if (seriesId) {
        viewCounts[seriesId] = (viewCounts[seriesId] || 0) + 1;
      } else {
        console.warn('View record without series_id or webtoon_id:', view);
      }
    });

    console.log('getViewCounts24h result:', {
      totalViews: data?.length || 0,
      uniqueSeries: Object.keys(viewCounts).length,
      viewCounts: viewCounts,
      sampleCounts: Object.entries(viewCounts).slice(0, 5)
    });

    return viewCounts;
  } catch (error) {
    console.error('Unexpected error getting 24h view counts:', error);
    return {};
  }
};

// Increment view count for a series
export const incrementSeriesViewCount = async (seriesId: string): Promise<void> => {
  // Prevent duplicate calls for the same seriesId
  if (ongoingIncrements.has(seriesId)) {
    console.log(`⚠️ incrementSeriesViewCount already in progress for ${seriesId}, skipping...`);
    return;
  }

  ongoingIncrements.add(seriesId);

  try {
    // First, log view event for trending calculation (24h view count)    
    try {
      // First verify that the series exists
      const { data: seriesCheck, error: checkError } = await supabase
        .from('series')
        .select('id')
        .eq('id', seriesId)
        .single();
      
      if (checkError || !seriesCheck) {
        console.warn('⚠️ Series not found, skipping view log:', seriesId);
        ongoingIncrements.delete(seriesId);
        return; // Don't log view if series doesn't exist
      }
      
      // Insert view log with series_id only (don't include webtoon_id for series views)
      const insertData: { series_id: string; viewed_at: string } = {
        series_id: seriesId,
        viewed_at: new Date().toISOString(),
      };
      
      console.log('Attempting to insert view log:', insertData);
      
      const { data: viewLogData, error: viewLogError } = await supabase
        .from('webtoon_views')
        .insert(insertData)
        .select();

      if (viewLogError) {
        // Extract error information safely
        const errorMessage = viewLogError.message || String(viewLogError) || 'Unknown error';
        const errorCode = viewLogError.code || 'NO_CODE';
        const errorDetails = viewLogError.details || null;
        const errorHint = viewLogError.hint || null;
        
        // Check for common error patterns FIRST (before logging)
        const errorStr = errorMessage.toLowerCase();
        const isRLSError = errorStr.includes('row-level security') || 
            errorStr.includes('rls') || 
            errorStr.includes('policy') || 
            errorStr.includes('permission denied') ||
            errorStr.includes('new row violates') ||
            errorCode === '42501' ||
            errorCode === 'PGRST301';
        
        if (isRLSError) {
          // RLS error - log as warning with helpful instructions (don't log as error)
          console.warn('⚠️ RLS policy error detected for webtoon_views table!');
          console.warn('📋 To fix this, go to Supabase Dashboard:');
          console.warn('   1. Navigate to: Table Editor > webtoon_views > Policies');
          console.warn('   2. Click "New Policy"');
          console.warn('   3. Policy name: "Allow public inserts"');
          console.warn('   4. Allowed operation: INSERT');
          console.warn('   5. Policy definition: true');
          console.warn('   6. Save the policy');
          console.warn('');
          console.warn('   Alternatively, you can run this SQL in Supabase SQL Editor:');
          console.warn('   CREATE POLICY "Allow public inserts" ON webtoon_views FOR INSERT WITH CHECK (true);');
          console.warn('   ⚠️ Continuing with direct view_count increment (fallback mode)...');
          
          // Fallback: Even if view log fails, still increment view_count directly
          // This ensures view_count is updated even when RLS policy is not configured
          try {
            const { data: series, error: fetchError } = await supabase
              .from('series')
              .select('view_count')
              .eq('id', seriesId)
              .single();

            if (!fetchError && series) {
              const currentViewCount = series?.view_count || 0;
              const { error: updateError } = await supabase
                .from('series')
                .update({ 
                  view_count: currentViewCount + 1,
                  last_viewed_at: new Date().toISOString()
                })
                .eq('id', seriesId);

              if (updateError) {
                console.error('Failed to increment series view count (fallback):', updateError);
              } else {
                console.log(`View count incremented (fallback) for series ${seriesId}: ${currentViewCount} -> ${currentViewCount + 1}`);
              }
            }
          } catch (fallbackError) {
            console.error('Unexpected error in fallback view count increment:', fallbackError);
          }
          
          ongoingIncrements.delete(seriesId);
          return; // Exit early, view_count already updated via fallback
        } else {
          // Other errors - log as error with details
          const errorInfo = {
            message: errorMessage,
            code: errorCode,
            details: errorDetails,
            hint: errorHint,
          };
          
          console.error('Failed to log view event:', JSON.stringify(errorInfo, null, 2));
          console.error('Insert data that failed:', JSON.stringify(insertData, null, 2));
          console.error('Series ID:', seriesId);
          
          if (errorStr.includes('relation') && errorStr.includes('does not exist')) {
            console.error('⚠️ Table does not exist!');
            console.error('Solution: Create webtoon_views table first');
          } else if (errorStr.includes('column') && errorStr.includes('does not exist')) {
            console.error('⚠️ Column does not exist!');
            console.error('Solution: Check table schema matches expected columns');
          }
        }
        
        ongoingIncrements.delete(seriesId);
        return; // Don't increment view_count if log failed
      } else {
        console.log('View event logged successfully:', viewLogData);
      }
    } catch (viewLogError: unknown) {
      // Enhanced error logging for unexpected errors
      const errorInfo = viewLogError instanceof Error 
        ? {
            message: viewLogError.message,
            stack: viewLogError.stack,
            name: viewLogError.name,
          }
        : {
            error: String(viewLogError),
            type: typeof viewLogError,
          };
      
      console.error('Unexpected error logging view event:', errorInfo);
      console.error('Series ID:', seriesId);
      ongoingIncrements.delete(seriesId);
      return; // Don't increment view_count if log failed
    }

    // After logging, count actual views from webtoon_views and update series.view_count
    try {
      const { data: views, error: viewsError } = await supabase
        .from('webtoon_views')
        .select('id')
        .or(`series_id.eq.${seriesId},webtoon_id.eq.${seriesId}`);

      if (viewsError) {
        console.error('Failed to count views for series:', viewsError);
        // Fallback to incrementing by 1 if counting fails
        const { data: series, error: fetchError } = await supabase
          .from('series')
          .select('view_count')
          .eq('id', seriesId)
          .single();

        if (!fetchError && series) {
          const currentViewCount = series?.view_count || 0;
          await supabase
            .from('series')
            .update({ 
              view_count: currentViewCount + 1,
              last_viewed_at: new Date().toISOString()
            })
            .eq('id', seriesId);
        }
        ongoingIncrements.delete(seriesId);
        return;
      }

      const actualViewCount = views?.length || 0;
      
      // Update view_count to match actual count from webtoon_views
      const { error: updateError } = await supabase
        .from('series')
        .update({ 
          view_count: actualViewCount,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', seriesId);

      if (updateError) {
        console.error('Failed to update series view count:', updateError);
      } else {
        console.log(`View count synced for series ${seriesId}: ${actualViewCount}`);
      }
    } catch (error) {
      console.error('Unexpected error updating view count:', error);
    } finally {
      ongoingIncrements.delete(seriesId);
    }
  } catch (error) {
    console.error('Unexpected error incrementing series view count:', error);
    ongoingIncrements.delete(seriesId);
  }
};

 // Increment view count for an episode
export const incrementEpisodeViewCount = async (episodeId: string): Promise<void> => {
  try {
    // Get current view count
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('view_count')
      .eq('id', episodeId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch episode for view count:', fetchError);
      return; // Don't throw, just log and return
    }

    const currentViewCount = episode?.view_count || 0;
    
    // Increment view count and update last_viewed_at
    const { error: updateError } = await supabase
      .from('episodes')
      .update({ 
        view_count: currentViewCount + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', episodeId);

    if (updateError) {
      console.error('Failed to increment episode view count:', updateError);
    } else {
      console.log(`View count incremented for episode ${episodeId}: ${currentViewCount} -> ${currentViewCount + 1}`);
    }
  } catch (error) {
    console.error('Unexpected error incrementing episode view count:', error);
  }
};
