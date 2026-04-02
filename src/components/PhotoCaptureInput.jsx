// PhotoCaptureInput — reusable photo capture component
// Handles camera/gallery triggers, polaroid preview, torn-paper caption, and upload via photoUtils
//
// Props:
// - prompt (string) — the photo prompt text displayed above the capture area
// - onPhotoSubmit (function) — callback with (path, caption) after successful upload
// - sessionId (string) — current session ID
// - playerId (string) — 'player1' or 'player2'
// - sectionId (string) — section identifier for storage path
// - promptIndex (number) — 0, 1, or 2 for the 3 prompts per section

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPhoto, createPreviewUrl, revokePreviewUrl } from '../utils/photoUtils'
import TornPaperCaption from './TornPaperCaption'

export default function PhotoCaptureInput({
  prompt,
  onPhotoSubmit,
  sessionId,
  playerId,
  sectionId,
  promptIndex,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  // Revoke blob URL on unmount or when previewUrl changes — prevent memory leak
  useEffect(() => {
    return () => { revokePreviewUrl(previewUrl) }
  }, [previewUrl])

  function handleFileSelected(file) {
    if (!file) return
    revokePreviewUrl(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(createPreviewUrl(file))
    setError(null)
  }

  function handleRemove() {
    revokePreviewUrl(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (galleryInputRef.current) galleryInputRef.current.value = ''
  }

  async function handleSubmit() {
    setUploading(true)
    setError(null)
    const { path, error: uploadError } = await uploadPhoto(
      supabase,
      sessionId,
      playerId,
      sectionId,
      promptIndex,
      selectedFile
    )
    if (uploadError) {
      setError(uploadError)
      setUploading(false)
      return
    }
    onPhotoSubmit(path, caption)
    setUploading(false)
  }

  // Photo-selected state
  if (selectedFile) {
    return (
      <div>
        {/* Prompt text */}
        <p style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
          color: 'var(--text-primary)',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          {prompt}
        </p>

        {/* Polaroid frame — exact styles from VisionTab CorkBoardSlot */}
        <div style={{
          background: '#fff',
          padding: '6px 6px 22px',
          boxShadow: '2px 3px 8px rgba(0,0,0,0.18)',
          borderRadius: 1,
          position: 'relative',
          maxWidth: 340,
          margin: '0 auto',
        }}>
          {/* Remove button — top-right corner circle */}
          <button
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Remove photo"
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              border: 'none',
              color: '#fff',
              fontSize: '0.55rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 11,
            }}
          >
            ✕
          </button>

          {/* Photo preview */}
          <img
            src={previewUrl}
            alt={caption || 'your photo'}
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 1,
            }}
          />
        </div>

        {/* Torn paper caption — below polaroid */}
        <div style={{ maxWidth: 340, margin: '0 auto' }}>
          <TornPaperCaption
            value={caption}
            onChange={setCaption}
            disabled={uploading}
          />
        </div>

        {/* Submit button */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={uploading}
            type="button"
            style={uploading ? { opacity: 0.6 } : {}}
          >
            {uploading ? 'Saving...' : 'Add this photo'}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p style={{
            color: '#E07A68',
            fontFamily: 'var(--font-hand)',
            fontSize: '0.875rem',
            textAlign: 'center',
            marginTop: 8,
          }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  // Idle state — no photo selected
  return (
    <div style={{ textAlign: 'center' }}>
      {/* Prompt text */}
      <p style={{
        fontFamily: 'var(--font-hand)',
        fontSize: '1rem',
        color: 'var(--text-primary)',
        marginBottom: 16,
      }}>
        {prompt}
      </p>

      {/* Empty dashed area */}
      <div style={{
        border: '2px dashed var(--border-pencil)',
        borderRadius: 4,
        padding: 32,
        marginBottom: 16,
        color: 'var(--text-light)',
      }}>
        <p style={{ fontFamily: 'Caveat, cursive', fontSize: '1.25rem', margin: '0 0 4px' }}>
          No photo yet
        </p>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '0.875rem', margin: 0 }}>
          Tap below to take a photo or choose one from your gallery.
        </p>
      </div>

      {/* Two trigger buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <label className="btn btn-secondary" style={{ cursor: 'pointer', minHeight: 44 }}>
          Take Photo
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
        </label>
        <label className="btn btn-secondary" style={{ cursor: 'pointer', minHeight: 44 }}>
          Choose from Gallery
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileSelected(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  )
}
