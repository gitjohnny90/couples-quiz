// Photo utilities for Daily Photo Challenge — Supabase Storage helpers

/**
 * Compress an image file to a JPEG Blob at max maxWidth pixels wide.
 * Returns a Promise resolving to a Blob (not a base64 data URL).
 *
 * @param {File} file - The source image file
 * @param {number} maxWidth - Maximum output width in pixels (default 800)
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Failed to compress image'))
          },
          'image/jpeg',
          0.7
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Compress and upload a photo to Supabase Storage.
 * Path format: {sessionId}/{playerId}/{sectionId}_{promptIndex}.jpg
 * Uses upsert so retaking a photo replaces the previous one.
 *
 * @param {object} supabase - Supabase client instance (passed by caller)
 * @param {string} sessionId
 * @param {string} playerId - 'player1' or 'player2'
 * @param {string} sectionId - Themed section slug (e.g. 'morning')
 * @param {number} promptIndex - 0-based index of the prompt within the section
 * @param {File} file - The source image file
 * @returns {Promise<{ path: string|null, error: string|null }>}
 */
export async function uploadPhoto(supabase, sessionId, playerId, sectionId, promptIndex, file) {
  try {
    const blob = await compressImage(file)
    const path = `${sessionId}/${playerId}/${sectionId}_${promptIndex}.jpg`
    const { data, error } = await supabase.storage
      .from('daily-photos')
      .upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      })
    if (error) return { path: null, error: error.message }
    return { path: data.path, error: null }
  } catch (err) {
    return { path: null, error: err.message || 'Something went wrong. Please try again.' }
  }
}

/**
 * Create a signed URL for viewing a stored photo.
 * Returns the raw Supabase response: { data: { signedUrl }, error }.
 *
 * @param {object} supabase - Supabase client instance (passed by caller)
 * @param {string} path - Storage object path (e.g. 'session_id/player1/morning_0.jpg')
 * @param {number} expiresIn - Expiry in seconds (default 3600 = 1 hour)
 * @returns {Promise<{ data: { signedUrl: string }|null, error: object|null }>}
 */
export function getPhotoUrl(supabase, path, expiresIn = 3600) {
  return supabase.storage
    .from('daily-photos')
    .createSignedUrl(path, expiresIn)
}

/**
 * Create a local object URL for instant preview before uploading.
 * Call revokePreviewUrl() when the preview is no longer needed to avoid memory leaks.
 *
 * @param {File} file
 * @returns {string} blob: URL
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file)
}

/**
 * Revoke a blob: URL created by createPreviewUrl() to free memory.
 * Safe to call with null / non-blob URLs — no-ops in that case.
 *
 * @param {string|null} url
 */
export function revokePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
