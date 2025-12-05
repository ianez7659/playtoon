import { supabase } from '@/lib/supabase';

// Database types (will be generated from Supabase)
// For now, we'll define them manually
type WebtoonRow = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

type CutRow = {
  id: string;
  webtoon_id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  animation_type: string | null;
  out_effect: string | null;
  duration: number | null;
  type: string | null;
  created_at: string;
};

export type AnimationType = 'basic' | 'parallax' | 'morphing' | '3d-flip' | 'physics' | 'timeline' | 'texture' | 'smooth-scroll' | 'blur-fade' | 'ripple' | 'shutter' | 'slice';

export type OutEffectType = "fade-out" | "slice" | "zoom-out" | "slide-out" | "shutter-out";

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

export interface WebtoonData {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  cuts: CutData[];
  createdAt: string;
}

// Helper function to convert CutRow to CutData
function cutRowToCutData(cutRow: CutRow): CutData {
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

// Helper function to convert CutData to CutRow (for insert/update)
function cutDataToCutRow(cutData: CutData, webtoonId: string): Omit<CutRow, 'id' | 'created_at'> {
  return {
    webtoon_id: webtoonId,
    title: cutData.title || null,
    description: cutData.description || null,
    image_url: cutData.imageUrl || null,
    animation_type: cutData.animationType || null,
    out_effect: cutData.outEffect || null,
    duration: cutData.duration || null,
    type: cutData.type || null,
  };
}

/**
 * Save a new webtoon to Supabase
 */
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
  } catch (error: any) {
    console.error('Failed to save webtoon:', error);
    
    // If it's already a formatted error message, throw it as is
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    // Otherwise, create a formatted error
    const errorMessage = error?.message || String(error) || 'Unknown error occurred';
    throw new Error(`Failed to save webtoon: ${errorMessage}`);
  }
};

/**
 * Get all webtoons from Supabase
 */
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
    return webtoons.map((webtoon: any) => ({
      id: webtoon.id,
      title: webtoon.title,
      description: webtoon.description || '',
      thumbnailUrl: webtoon.thumbnail_url || undefined,
      cuts: (webtoon.cuts || []).map(cutRowToCutData),
      createdAt: webtoon.created_at,
    }));
  } catch (error) {
    console.error('Failed to load webtoons:', error);
    return [];
  }
};

/**
 * Get a webtoon by ID from Supabase
 */
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
    };
  } catch (error: any) {
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

/**
 * Delete a webtoon from Supabase
 * Cuts will be automatically deleted due to CASCADE
 */
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

/**
 * Update a webtoon in Supabase
 */
export const updateWebtoon = async (id: string, updatedData: Partial<WebtoonData>): Promise<void> => {
  try {
    // Update webtoon
    const webtoonUpdate: Partial<WebtoonRow> = {};
    if (updatedData.title !== undefined) webtoonUpdate.title = updatedData.title;
    if (updatedData.description !== undefined) webtoonUpdate.description = updatedData.description || null;
    if (updatedData.thumbnailUrl !== undefined) webtoonUpdate.thumbnail_url = updatedData.thumbnailUrl || null;

    if (Object.keys(webtoonUpdate).length > 0) {
      const { error: webtoonError } = await supabase
        .from('webtoons')
        .update(webtoonUpdate)
        .eq('id', id);

      if (webtoonError) {
        throw webtoonError;
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
        throw deleteError;
      }

      // Insert new cuts
      if (updatedData.cuts.length > 0) {
        const cutsToInsert = updatedData.cuts.map(cut => cutDataToCutRow(cut, id));
        
        const { error: cutsError } = await supabase
          .from('cuts')
          .insert(cutsToInsert);

        if (cutsError) {
          throw cutsError;
        }
      }
    }
  } catch (error) {
    console.error('Failed to update webtoon:', error);
    throw error;
  }
};
