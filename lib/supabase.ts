import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to upload file to Supabase Storage
export async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data;
}

// Helper function to get public URL for a file
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// Helper function to get a signed (time-limited) URL for a private file
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 120
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

// Helper function to delete file from Supabase Storage
export async function deleteFileFromSupabase(bucket: string, path: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Helper function to download file from Supabase Storage
export async function downloadFileFromSupabase(bucket: string, path: string): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  // Convert Blob to Buffer
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
