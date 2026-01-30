import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface StyleAnalysisRecord {
  id?: string;
  created_at?: string;
  image_url: string;
  tags: string[];
  vogue_description: string;
  style_dna: Array<{ label: string; value: number }>;
  timestamp: string;
  tpo?: string;
}

// Convert base64 data URL to Blob
function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Upload image to Supabase Storage and return public URL
export async function uploadImage(imageDataURL: string): Promise<string> {
  const blob = dataURLtoBlob(imageDataURL);
  const fileName = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('photos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Save analysis to Supabase database and return the record ID
export async function saveAnalysis(
  imageUrl: string,
  tags: string[],
  vogueDescription: string,
  styleDNA: Array<{ label: string; value: number }>,
  timestamp: string
): Promise<string> {
  const { data, error } = await supabase
    .from('style_analyses')
    .insert({
      image_url: imageUrl,
      tags: tags,
      vogue_description: vogueDescription,
      style_dna: styleDNA,
      timestamp: timestamp,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to save analysis: ${error.message}`);
  }

  return data.id;
}

// Fetch analysis by ID (for share page)
export async function getAnalysisById(id: string): Promise<StyleAnalysisRecord | null> {
  const { data, error } = await supabase
    .from('style_analyses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Failed to fetch analysis:', error.message);
    return null;
  }

  return data;
}
