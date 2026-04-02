// TornPaperCaption — caption input styled as a torn-paper strip below a photo
// Used by PhotoCaptureInput component

/**
 * Props:
 * - value (string) — controlled caption text
 * - onChange (function) — called with new caption string on every keystroke
 * - maxLength (number, default 80) — character limit
 * - disabled (boolean, default false) — disables input during upload
 */
export default function TornPaperCaption({ value, onChange, maxLength = 80, disabled = false }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      background: '#fff',
      border: '1.5px solid var(--border-pencil)',
      borderBottom: 'none',
      marginTop: -1,
    }}>
      <label
        htmlFor="photo-caption"
        style={{
          display: 'block',
          fontFamily: 'var(--font-hand)',
          fontSize: '0.75rem',
          color: 'var(--text-light)',
          padding: '4px 8px 0',
        }}
      >
        Caption (optional)
      </label>
      <input
        id="photo-caption"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="add a caption..."
        maxLength={maxLength}
        disabled={disabled}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          fontFamily: 'Caveat, cursive',
          fontSize: '0.8rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          padding: '2px 8px 6px',
          background: 'transparent',
          height: 40,
          boxSizing: 'border-box',
        }}
      />
      {/* Character count */}
      <span style={{
        position: 'absolute',
        bottom: 4,
        right: 8,
        fontFamily: 'var(--font-hand)',
        fontSize: '0.75rem',
        color: 'var(--text-light)',
      }}>
        {value.length}/{maxLength}
      </span>
      {/* Torn edge bottom — uses existing .torn-edge class from index.css */}
      <div className="torn-edge" />
    </div>
  )
}
