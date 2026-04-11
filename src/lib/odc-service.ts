import { supabase } from './supabase';
import { OdcFormData, OdcRecord, OdcStatus } from './types';

const BUCKET = 'odc-documents';

// ─── Convert File to base64 data URL (fallback when bucket unavailable) ──────
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Upload files to Supabase Storage (with base64 fallback) ─────────────────
export async function uploadDocuments(files: File[]): Promise<string[]> {
  if (!files.length) return [];

  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      // Bucket not found or storage error → fall back to base64 data URL
      // This keeps the record saveable even without the storage bucket
      console.warn(`Storage upload failed (${error.message}), falling back to base64 for: ${file.name}`);
      try {
        const dataUrl = await fileToDataUrl(file);
        urls.push(dataUrl);
      } catch {
        // If even base64 fails, store placeholder
        urls.push(`[file:${file.name}]`);
      }
      continue;
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(publicData.publicUrl);
  }

  return urls;
}

// ─── Create a new ODC record ──────────────────────────────────────────────────
export async function createOdcRecord(
  formData: OdcFormData
): Promise<OdcRecord> {
  const payload = {
    ...formData,
    document_urls: [], // Keep it empty for DB schema compatibility
    status: 'pending' as OdcStatus,
  };

  const { data, error } = await supabase
    .from('odc_records')
    .insert(payload)
    .select()
    .single();

  if (error) {
    // Provide a helpful error for common setup issues
    if (error.message.includes("relation") || error.message.includes("schema cache") || error.message.includes("table")) {
      throw new Error(
        'Database table not found. Please run the SQL migration in your Supabase Dashboard → SQL Editor using the file: supabase/migrations/001_init.sql'
      );
    }
    throw new Error(`Failed to create record: ${error.message}`);
  }

  return data as OdcRecord;
}

// ─── Fetch all ODC records ────────────────────────────────────────────────────
export async function getOdcRecords(): Promise<OdcRecord[]> {
  const { data, error } = await supabase
    .from('odc_records')
    .select('*')
    .order('created_at', { ascending: false });

  // Return empty array if table doesn't exist yet (setup pending)
  if (error) {
    console.warn('Could not fetch ODC records:', error.message);
    return [];
  }
  return (data ?? []) as OdcRecord[];
}

// ─── Fetch single ODC record ──────────────────────────────────────────────────
export async function getOdcRecord(id: string): Promise<OdcRecord> {
  const { data, error } = await supabase
    .from('odc_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Failed to fetch record: ${error.message}`);
  return data as OdcRecord;
}

// ─── Update ODC record status ─────────────────────────────────────────────────
export async function updateOdcStatus(id: string, status: OdcStatus): Promise<void> {
  const { error } = await supabase
    .from('odc_records')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

// ─── Delete ODC record (+ storage files) ─────────────────────────────────────
export async function deleteOdcRecord(id: string): Promise<void> {
  // Try to fetch and remove storage files (best-effort, don't block delete)
  try {
    const record = await getOdcRecord(id);
    const storedUrls = (record.document_urls ?? []).filter(
      (url) => url.startsWith('http') // only real storage URLs, not base64
    );
    if (storedUrls.length) {
      const paths = storedUrls.map((url) => {
        const parts = url.split(`/${BUCKET}/`);
        return parts[1] ?? '';
      }).filter(Boolean);
      if (paths.length) {
        await supabase.storage.from(BUCKET).remove(paths);
      }
    }
  } catch {
    // Ignore storage cleanup errors
  }

  const { error } = await supabase.from('odc_records').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete record: ${error.message}`);
}

// ─── Get summary stats ────────────────────────────────────────────────────────
export async function getOdcStats() {
  const { data, error } = await supabase
    .from('odc_records')
    .select('id, status, candidate_count, created_at');

  // Return zeros if table doesn't exist yet
  if (error) return { total: 0, pending: 0, totalStudents: 0, thisMonth: 0 };

  const now = new Date();
  const thisMonth = data.filter((r) => {
    const d = new Date(r.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    total: data.length,
    pending: data.filter((r) => r.status === 'pending').length,
    totalStudents: data.reduce((sum, r) => sum + (r.candidate_count ?? 0), 0),
    thisMonth: thisMonth.length,
  };
}
