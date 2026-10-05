import axios from 'axios'
import { api } from './api'

/**
 * Presign → PUT direct to R2 → return the key to save. The file never passes through our
 * server. Content-Type must match exactly what was presigned (it's bound into the signature).
 */
export async function uploadViaPresign(presignUrl: string, file: File, params: Record<string, string | number> = {}): Promise<{ key: string; url?: string }> {
  const { upload_url, key, url } = await api.post<{ upload_url: string; key: string; url?: string }>(presignUrl, { ...params, content_type: file.type })
  // A plain axios call, not the `http` instance: this goes straight to R2, not our API (no
  // cookie, no X-Requested-With — those would just be extra unsigned headers R2 doesn't expect).
  await axios.put(upload_url, file, { headers: { 'Content-Type': file.type } })
  return { key, url }
}
