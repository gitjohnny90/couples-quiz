import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar, DoodleFlower } from "../components/Doodles";

function generateInviteCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LOVE-${num}`;
}

export default function HomePage() {
  const { setSessionId, setPlayerName, setPlayerId } = useContext(SessionContext);
  const { user, signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const displayName = user?.user_metadata?.display_name || "Player";

  // On mount: check if user already has a session
  useEffect(() => {
    if (!user) return;
    checkExistingSession();
  }, [user]);

  const checkExistingSession = async () => {
    try {
      // First check user_sessions table
      const { data: userSession } = await supabase
        .from("user_sessions")
        .select("session_id, player_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (userSession) {
        setSessionId(userSession.session_id);
        setPlayerId(userSession.player_id);
        setPlayerName(displayName);
        navigate(`/vault/${userSession.session_id}`, { replace: true });
        return;
      }

      // Legacy migration: check localStorage for an old session
      const legacySessionId = localStorage.getItem("sessionId");
      const legacyPlayerId = localStorage.getItem("playerId");

      if (legacySessionId && legacyPlayerId) {
        const { data: session } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", legacySessionId)
          .single();

        if (session) {
          const userIdCol = legacyPlayerId === "player1" ? "player1_user_id" : "player2_user_id";

          // Only claim if not already claimed by someone else
          if (!session[userIdCol]) {
            await supabase
              .from("sessions")
              .update({ [userIdCol]: user.id })
              .eq("id", legacySessionId);

            await supabase
              .from("user_sessions")
              .upsert({
                user_id: user.id,
                session_id: legacySessionId,
                player_id: legacyPlayerId,
              });

            setSessionId(legacySessionId);
            setPlayerId(legacyPlayerId);
            setPlayerName(displayName);
            navigate(`/vault/${legacySessionId}`, { replace: true });
            return;
          }
        }
      }
    } catch (err) {
      // No existing session found — that's fine, show create/join
      console.log("No existing session:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError("");

    // Try up to 3 times in case of invite code collision
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const inviteCode = generateInviteCode();
        const { data: session, error: createError } = await supabase
          .from("sessions")
          .insert({
            player1_name: displayName,
            player1_user_id: user.id,
            invite_code: inviteCode,
          })
          .select()
          .single();

        if (createError) {
          // Unique constraint violation on invite_code — retry
          if (createError.code === "23505" && attempt < 2) continue;
          throw createError;
        }

        // Create the user_sessions link
        await supabase.from("user_sessions").insert({
          user_id: user.id,
          session_id: session.id,
          player_id: "player1",
        });

        setSessionId(session.id);
        setPlayerId("player1");
        setPlayerName(displayName);
        navigate(`/vault/${session.id}`);
        return;
      } catch (err) {
        if (attempt === 2) {
          console.error("Failed to create session:", err);
          setError("couldn't create session — check your connection");
        }
      }
    }
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!code.trim()) return;
    setJoining(true);
    setError("");

    try {
      // Normalise the code: uppercase, strip spaces, add prefix if missing
      let normalised = code.toUpperCase().replace(/\s/g, "").replace(/-/g, "");
      if (normalised.startsWith("LOVE")) {
        normalised = "LOVE-" + normalised.slice(4);
      } else {
        normalised = "LOVE-" + normalised;
      }

      const { data: session, error: lookupError } = await supabase
        .from("sessions")
        .select("*")
        .eq("invite_code", normalised)
        .single();

      if (lookupError || !session) {
        setError("hmm, that code doesn't match any session");
        setJoining(false);
        return;
      }

      if (session.player2_name || session.player2_user_id) {
        setError("this session already has two people");
        setJoining(false);
        return;
      }

      if (session.player1_user_id === user.id) {
        setError("you can't join your own session!");
        setJoining(false);
        return;
      }

      // Join the session
      const { error: joinError } = await supabase
        .from("sessions")
        .update({
          player2_name: displayName,
          player2_user_id: user.id,
        })
        .eq("id", session.id);

      if (joinError) throw joinError;

      // Create the user_sessions link
      await supabase.from("user_sessions").insert({
        user_id: user.id,
        session_id: session.id,
        player_id: "player2",
      });

      setSessionId(session.id);
      setPlayerId("player2");
      setPlayerName(displayName);
      navigate(`/vault/${session.id}`);
    } catch (err) {
      console.error("Failed to join:", err);
      setError("couldn't join — check your connection and try again");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 60 }}>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.4rem", color: "var(--text-secondary)" }}>
            checking your notebook...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      <PageDoodles seed={1} />

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
        {/* Hearts cluster */}
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
          hey, {displayName}!
        </h1>

        <SquigglyUnderline width={120} color="#E88D7A" opacity={0.5} style={{ marginBottom: 12 }} />

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
          start a new session or join your partner's
        </p>

        {/* Create session card */}
        <div
          className="glass"
          style={{
            padding: "24px",
            marginBottom: 14,
            width: "100%",
            maxWidth: 380,
            transform: "rotate(-0.5deg)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              marginBottom: 14,
            }}
          >
            ready to start fresh?
          </p>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || joining}
            style={{ width: "100%" }}
          >
            {creating ? "creating..." : "start a new session"}
          </button>
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            maxWidth: 380,
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--border-pencil)" }} />
          <span
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1rem",
              color: "var(--text-light)",
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, background: "var(--border-pencil)" }} />
        </div>

        {/* Join with code card */}
        <div
          className="glass"
          style={{
            padding: "24px",
            marginBottom: 20,
            width: "100%",
            maxWidth: 380,
            transform: "rotate(0.3deg)",
          }}
        >
          <label
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.2rem",
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: 8,
            }}
          >
            got a code from your person?
          </label>
          <input
            className="input"
            type="text"
            placeholder="LOVE-7742"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            style={{
              width: "100%",
              marginBottom: 14,
              boxSizing: "border-box",
              textAlign: "center",
              fontFamily: "var(--font-hand)",
              fontSize: "1.3rem",
              letterSpacing: "0.1em",
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={joining || creating || !code.trim()}
            style={{ width: "100%" }}
          >
            {joining ? "joining..." : "join session"}
          </button>
        </div>

        {error && (
          <p
            style={{
              color: "var(--accent-coral)",
              fontSize: "0.85rem",
              textAlign: "center",
              fontStyle: "italic",
              maxWidth: 380,
            }}
          >
            {error}
          </p>
        )}

        {/* Bottom note */}
        <div style={{ textAlign: "center", position: "relative", maxWidth: 320, marginTop: 8 }}>
          <p
            style={{
              color: "var(--text-light)",
              fontSize: "0.95rem",
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            Fair warning: there are no wrong answers... but there are suspicious ones
          </p>
          <div style={{ position: "absolute", right: -20, bottom: -8 }}>
            <DoodleFlower size={18} rotate={15} opacity={0.3} />
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={async () => {
            await signOut();
            navigate("/auth");
          }}
          style={{
            marginTop: 28,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-hand)",
            fontSize: "0.9rem",
            color: "var(--text-light)",
            padding: "6px 12px",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          sign out
        </button>
      </motion.div>
    </div>
  );
}
