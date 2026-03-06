import { useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"
import { motion } from "framer-motion"
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from "../components/Doodles"

export default function ResetPasswordPage() {
  const { user, authEvent } = useContext(AuthContext)
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  // Detect recovery flow from URL hash (most reliable — fires before auth event)
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      setReady(true)
    }
  }, [])

  // Also listen for PASSWORD_RECOVERY auth event as fallback
  useEffect(() => {
    if (authEvent === "PASSWORD_RECOVERY") {
      setReady(true)
    }
  }, [authEvent])

  // Once Supabase processes hash tokens, user will be set — that also means ready
  useEffect(() => {
    if (user && window.location.hash.includes('access_token')) {
      setReady(true)
    }
  }, [user])

  // If user lands here without hash tokens, redirect after timeout
  useEffect(() => {
    const hasRecoveryHash = window.location.hash.includes('type=recovery') ||
                            window.location.hash.includes('access_token')
    // Don't redirect if hash tokens are present — Supabase may still be processing
    if (hasRecoveryHash) return

    const timer = setTimeout(() => {
      if (!ready && !user) {
        navigate("/auth", { replace: true })
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [ready, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 6) {
      setError("password needs to be at least 6 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("passwords don't match — try again")
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (updateError) throw updateError
      setSuccess(true)
      setTimeout(() => navigate("/", { replace: true }), 2000)
    } catch (err) {
      console.error("Password update error:", err)
      if (err.message?.includes("same")) {
        setError("that's the same password — pick a new one")
      } else {
        setError(err.message || "something went wrong — try again")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      <PageDoodles seed={11} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{ position: "relative", marginBottom: 4, marginTop: 16 }}>
          <DoodleHeart size={36} color="#E88D7A" opacity={0.6} rotate={-5} />
          <div style={{ position: "absolute", top: -8, right: -18 }}>
            <DoodleHeart size={18} color="#D4A843" opacity={0.4} rotate={12} />
          </div>
          <div style={{ position: "absolute", bottom: -4, left: -14 }}>
            <DoodleStar size={14} opacity={0.3} rotate={-8} />
          </div>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-hand)",
            fontSize: "2.2rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 2,
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          new password
        </h1>

        <SquigglyUnderline width={140} color="#E88D7A" opacity={0.5} style={{ marginBottom: 12 }} />

        <p
          style={{
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: 24,
            maxWidth: 300,
            fontFamily: "var(--font-body)",
            fontSize: "1.05rem",
            lineHeight: 1.5,
          }}
        >
          {success
            ? ""
            : ready
            ? "pick a new password for your account"
            : "opening the notebook..."}
        </p>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass"
            style={{
              padding: "28px 24px",
              textAlign: "center",
              width: "100%",
              maxWidth: 380,
              transform: "rotate(0.3deg)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <p style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.5rem",
              color: "var(--accent-sage)",
              marginBottom: 8,
            }}>
              password updated!
            </p>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.95rem",
              color: "var(--text-secondary)",
            }}>
              taking you back to your notebook...
            </p>
          </motion.div>
        ) : ready ? (
          <form
            onSubmit={handleSubmit}
            className="glass"
            style={{
              padding: "24px 24px 20px",
              marginBottom: 20,
              width: "100%",
              maxWidth: 380,
              transform: "rotate(-0.3deg)",
            }}
          >
            <label
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.15rem",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              new password:
            </label>
            <div style={{ position: "relative", width: "100%", marginBottom: 16 }}>
              <input
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder="at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: "100%", boxSizing: "border-box", paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  fontSize: "1.1rem",
                  color: "var(--text-light)",
                  lineHeight: 1,
                  opacity: 0.6,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
              >
                {showPassword ? "🙈" : "🐵"}
              </button>
            </div>

            <label
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.15rem",
                color: "var(--text-secondary)",
                display: "block",
                marginBottom: 6,
              }}
            >
              confirm password:
            </label>
            <input
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder="type it again..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              style={{ width: "100%", marginBottom: 20, boxSizing: "border-box" }}
            />

            <button
              className="btn btn-primary"
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              style={{ width: "100%" }}
            >
              {loading ? "saving..." : "set new password"}
            </button>

            {error && (
              <p
                style={{
                  color: "var(--accent-coral)",
                  fontSize: "0.85rem",
                  marginTop: 10,
                  textAlign: "center",
                  fontStyle: "italic",
                }}
              >
                {error}
              </p>
            )}
          </form>
        ) : null}
      </motion.div>
    </div>
  )
}
