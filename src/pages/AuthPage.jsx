import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import { motion } from "framer-motion"
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from "../components/Doodles"

export default function AuthPage() {
  const { signUp, signIn, resetPasswordForEmail } = useContext(AuthContext)
  const navigate = useNavigate()

  const [mode, setMode] = useState("signin") // "signin" or "signup"
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (mode === "forgot") {
        if (!email.trim()) {
          setError("enter your email first")
          setLoading(false)
          return
        }
        await resetPasswordForEmail(email.trim())
        setResetSent(true)
      } else if (mode === "signup") {
        if (!displayName.trim()) {
          setError("what should we call you?")
          setLoading(false)
          return
        }
        const data = await signUp(email.trim(), password, displayName.trim())
        // If email confirmation is required, user won't be auto-signed in
        if (data.user && !data.session) {
          setError("check your email to confirm your account, then sign in!")
          setMode("signin")
          setLoading(false)
          return
        }
        navigate("/")
      } else {
        await signIn(email.trim(), password)
        navigate("/")
      }
    } catch (err) {
      console.error("Auth error:", err)
      if (mode === "forgot") {
        setError("couldn't send the reset link — check your email and try again")
      } else if (err.message?.includes("Invalid login")) {
        setError("wrong email or password — try again")
      } else if (err.message?.includes("already registered")) {
        setError("that email is taken — try signing in instead")
      } else if (err.message?.includes("least 6")) {
        setError("password needs to be at least 6 characters")
      } else {
        setError(err.message || "something went wrong — try again")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      <PageDoodles seed={9} />

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
            fontSize: "2.6rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 2,
            color: "var(--text-primary)",
            lineHeight: 1.1,
          }}
        >
          The Us Quiz
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
          {mode === "signup"
            ? "let's get you set up"
            : mode === "forgot"
            ? "no worries, we'll fix this"
            : "welcome back"}
        </p>

        {/* Mode toggle tabs */}
        {mode !== "forgot" && (
          <div
            style={{
              display: "flex",
              gap: 0,
              marginBottom: 16,
              width: "100%",
              maxWidth: 380,
            }}
          >
            {["signin", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setResetSent(false) }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  fontFamily: "var(--font-hand)",
                  fontSize: "1.15rem",
                  fontWeight: mode === m ? 700 : 400,
                  color: mode === m ? "var(--accent-coral)" : "var(--text-light)",
                  background: "none",
                  border: "none",
                  borderBottom: mode === m
                    ? "2px solid var(--accent-coral)"
                    : "1px solid var(--border-pencil)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {m === "signin" ? "sign in" : "sign up"}
              </button>
            ))}
          </div>
        )}

        {/* Form card */}
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
          {mode === "forgot" && resetSent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <p style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.3rem",
                color: "var(--accent-sage)",
                marginBottom: 8,
              }}>
                check your inbox!
              </p>
              <p style={{
                fontFamily: "var(--font-body)",
                fontSize: "0.95rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
              }}>
                we sent a reset link to <strong>{email}</strong> — click it to set a new password
              </p>
            </div>
          ) : (
            <>
              {mode === "signup" && (
                <>
                  <label
                    style={{
                      fontFamily: "var(--font-hand)",
                      fontSize: "1.15rem",
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    your name:
                  </label>
                  <input
                    className="input"
                    type="text"
                    placeholder="what your partner calls you..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    style={{ width: "100%", marginBottom: 16, boxSizing: "border-box" }}
                  />
                </>
              )}

              <label
                style={{
                  fontFamily: "var(--font-hand)",
                  fontSize: "1.15rem",
                  color: "var(--text-secondary)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                email:
              </label>
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ width: "100%", marginBottom: mode === "forgot" ? 20 : 16, boxSizing: "border-box" }}
              />

              {mode !== "forgot" && (
                <>
                  <label
                    style={{
                      fontFamily: "var(--font-hand)",
                      fontSize: "1.15rem",
                      color: "var(--text-secondary)",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    password:
                  </label>
                  <div style={{ position: "relative", width: "100%", marginBottom: 20 }}>
                    <input
                      className="input"
                      type={showPassword ? "text" : "password"}
                      placeholder={mode === "signup" ? "at least 6 characters" : "your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
                </>
              )}

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !email.trim() || (mode !== "forgot" && !password)}
                style={{ width: "100%" }}
              >
                {loading
                  ? (mode === "forgot" ? "sending..." : mode === "signup" ? "creating account..." : "signing in...")
                  : (mode === "forgot" ? "send reset link" : mode === "signup" ? "create account" : "sign in")
                }
              </button>

              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(""); setResetSent(false) }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-light)",
                    fontFamily: "var(--font-body)",
                    fontSize: "0.9rem",
                    fontStyle: "italic",
                    cursor: "pointer",
                    marginTop: 10,
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    textDecoration: "underline",
                    textDecorationStyle: "wavy",
                    textDecorationColor: "var(--border-pencil)",
                    textUnderlineOffset: "3px",
                  }}
                >
                  forgot password?
                </button>
              )}
            </>
          )}

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

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); setResetSent(false) }}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-body)",
              fontSize: "0.9rem",
              color: "var(--accent-coral)",
              cursor: "pointer",
              textDecoration: "underline",
              textDecorationStyle: "wavy",
              textDecorationColor: "rgba(232, 141, 122, 0.4)",
              textUnderlineOffset: "3px",
            }}
          >
            ← back to sign in
          </button>
        )}
      </motion.div>
    </div>
  )
}
