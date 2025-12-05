import { supabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'playtoon-images'; // Supabase Storage bucket name

/**
 * Upload image to Supabase Storage
 * @param file - Image file to upload
 * @param path - Path in storage (e.g., 'webtoons/{webtoonId}/cuts/{cutId}.jpg')
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
  file: File,
  path: string
): Promise<string> {
  try {
    console.log('Uploading image:', { bucket: STORAGE_BUCKET, path, fileName: file.name, fileSize: file.size });
    
    // Check if bucket exists by trying to list it first
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Failed to list buckets:', {
        message: listError.message,
        statusCode: (listError as any).statusCode,
        error: JSON.stringify(listError, Object.getOwnPropertyNames(listError)),
      });
      // Continue anyway - might be a permission issue but bucket could still exist
    }
    
    if (buckets && buckets.length > 0) {
      console.log('Available buckets:', buckets.map(b => b.name));
      const bucketExists = buckets.some(b => b.name === STORAGE_BUCKET);
      if (!bucketExists) {
        const availableBuckets = buckets.map(b => b.name).join(', ');
        throw new Error(`Storage bucket "${STORAGE_BUCKET}" not found. Available buckets: ${availableBuckets}. Please create the bucket "${STORAGE_BUCKET}" in Supabase dashboard (Storage > New bucket) or update STORAGE_BUCKET in imageStorage.ts to match an existing bucket name.`);
      }
    } else {
      // No buckets found - this could mean:
      // 1. Bucket doesn't exist yet
      // 2. Permission issue (can't list buckets)
      console.warn('No buckets found or cannot list buckets. Attempting to upload anyway...');
      // We'll try to upload and let the upload error tell us if bucket doesn't exist
    }
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error('Supabase upload error:', error);
      console.error('Error details:', {
        message: error.message,
      });
      
      // Provide helpful error message for RLS policy errors
      if (error.message?.includes('row-level security') || 
          error.message?.includes('RLS') ||
          error.message?.includes('policy')) {
        const detailedMessage = `Storage upload failed due to Row Level Security (RLS) policy.\n\n` +
          `Please check the following in Supabase dashboard:\n` +
          `1. Go to Storage > playtoon-images > Policies\n` +
          `2. Create a new policy with:\n` +
          `   - Policy name: "Allow public uploads"\n` +
          `   - Allowed operation: INSERT\n` +
          `   - Policy definition: true\n` +
          `3. Also create a policy for SELECT (read access):\n` +
          `   - Policy name: "Allow public reads"\n` +
          `   - Allowed operation: SELECT\n` +
          `   - Policy definition: true\n` +
          `4. Make sure the bucket is set to "Public bucket" in Settings\n\n` +
          `Error details: ${error.message || 'Unknown error'}`;
        throw new Error(detailedMessage);
      }
      
      throw error;
    }

    if (!data) {
      throw new Error('Upload succeeded but no data returned');
    }

    console.log('Upload successful, data:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    console.log('Public URL:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    if (error?.message) {
      throw new Error(error.message);
    }
    throw error;
  }
}

/**
 * Delete image from Supabase Storage
 * @param path - Path in storage (e.g., 'webtoons/{webtoonId}/cuts/{cutId}.jpg')
 */
export async function deleteImage(path: string): Promise<void> {
  try {
    // Extract path from full URL if needed
    const storagePath = path.includes(STORAGE_BUCKET)
      ? path.split(`${STORAGE_BUCKET}/`)[1]
      : path;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Failed to delete image:', error);
    throw error;
  }
}

/**
 * Extract storage path from public URL
 */
export function getStoragePathFromUrl(url: string): string | null {
  try {
    // Supabase Storage URL format: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

