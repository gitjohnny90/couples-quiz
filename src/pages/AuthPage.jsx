import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../contexts/AuthContext"
import { motion } from "framer-motion"
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar } from "../components/Doodles"

export default function AuthPage() {
  const { signUp, signIn } = useContext(AuthContext)
  const navigate = useNavigate()

  const [mode, setMode] = useState("signin") // "signin" or "signup"
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (mode === "signup") {
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
      } else {
        await signIn(email.trim(), password)
      }
      navigate("/")
    } catch (err) {
      console.error("Auth error:", err)
      if (err.message?.includes("Invalid login")) {
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
            : "welcome back"}
        </p>

        {/* Mode toggle tabs */}
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
              onClick={() => { setMode(m); setError("") }}
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
            style={{ width: "100%", marginBottom: 16, boxSizing: "border-box" }}
          />

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

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !email.trim() || !password}
            style={{ width: "100%" }}
          >
            {loading
              ? (mode === "signup" ? "creating account..." : "signing in...")
              : (mode === "signup" ? "create account" : "sign in")
            }
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
      </motion.div>
    </div>
  )
}
