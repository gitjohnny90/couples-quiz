import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageDoodles, { SquigglyUnderline } from "../components/Doodles";

function generateInviteCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `LOVE-${num}`;
}

export default function HomePage() {
  const { setSessionId, setPlayerName, setPlayerId } = useContext(SessionContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [copied, setCopied] = useState(false);

  const displayName = user?.user_metadata?.display_name || "Player";

  // On mount: check if user already has a session, or auto-create/join one
  useEffect(() => {
    if (!user) return;
    checkExistingSession();
  }, [user]);

  // Poll for partner joining when showing invite code
  useEffect(() => {
    if (!session || session.player2_name) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", session.id)
        .single();
      if (data?.player2_name) {
        setSession(data);
        // Partner joined — redirect to vault after a brief moment
        setTimeout(() => {
          navigate(`/vault/${data.id}`, { replace: true });
        }, 1500);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [session]);

  const copyCode = () => {
    const code = session?.invite_code || "";
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        // Fetch session to check if partner has joined
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", userSession.session_id)
          .single();

        if (sessionData && !sessionData.player2_name) {
          // No partner yet — stay on home page, show invite code
          setSession(sessionData);
          setLoading(false);
          return;
        }

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

      // No existing session — auto-create or auto-join
      const pendingCode = localStorage.getItem("pendingInviteCode");

      if (pendingCode) {
        localStorage.removeItem("pendingInviteCode");
        await autoJoin(pendingCode);
      } else {
        await autoCreate();
      }
    } catch (err) {
      console.error("Session setup error:", err.message);
      setError("something went wrong setting up your session — try again");
      setLoading(false);
    }
  };

  const autoJoin = async (rawCode) => {
    try {
      // Normalise the code: uppercase, strip spaces/dashes, add prefix if missing
      let normalised = rawCode.toUpperCase().replace(/\s/g, "").replace(/-/g, "");
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
        setError("that invite code didn't match any session — we started a fresh one for you");
        await autoCreate();
        return;
      }

      if (session.player2_name || session.player2_user_id) {
        setError("that session already has two people — we started a fresh one for you");
        await autoCreate();
        return;
      }

      if (session.player1_user_id === user.id) {
        setError("that was your own session code — we started a fresh one for you");
        await autoCreate();
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

      await supabase.from("user_sessions").insert({
        user_id: user.id,
        session_id: session.id,
        player_id: "player2",
      });

      setSessionId(session.id);
      setPlayerId("player2");
      setPlayerName(displayName);
      navigate(`/vault/${session.id}`, { replace: true });
    } catch (err) {
      console.error("Auto-join failed:", err);
      setError("couldn't join that session — we started a fresh one for you");
      await autoCreate();
    }
  };

  const autoCreate = async () => {
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
          if (createError.code === "23505" && attempt < 2) continue;
          throw createError;
        }

        await supabase.from("user_sessions").insert({
          user_id: user.id,
          session_id: session.id,
          player_id: "player1",
        });

        setSessionId(session.id);
        setPlayerId("player1");
        setPlayerName(displayName);
        // Show invite code on home page instead of redirecting
        setSession(session);
        setLoading(false);
        return;
      } catch (err) {
        if (attempt === 2) {
          console.error("Failed to create session:", err);
          setError("couldn't set up your session — check your connection and try again");
          setLoading(false);
        }
      }
    }
  };

  // Show invite code page when session exists but no partner yet
  if (session && !session.player2_name) {
    return (
      <div className="page" style={{ position: "relative" }}>
        <PageDoodles seed={1} />
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ fontFamily: "var(--font-hand)", fontSize: "2rem", fontWeight: 700, marginBottom: 2 }}>
              welcome, {displayName}
            </h1>
            <SquigglyUnderline width={110} color="#D4A843" opacity={0.4} style={{ margin: "0 auto 12px" }} />
          </div>

          <div className="glass" style={{ padding: 24, textAlign: "center", maxWidth: 340, margin: "0 auto" }}>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.15rem", marginBottom: 10 }}>
              share this code with your person:
            </p>
            <div style={{
              background: "#fff", borderBottom: "2px solid var(--border-pencil)",
              padding: "14px", marginBottom: 12,
              fontFamily: "var(--font-hand)", fontSize: "2rem", fontWeight: 700,
              letterSpacing: "0.1em", color: "var(--accent-coral)",
            }}>
              {session.invite_code || "..."}
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: 14, fontStyle: "italic" }}>
              they'll enter this when they sign up
            </p>
            <button className="btn btn-primary" style={{ width: "100%", marginBottom: 16 }} onClick={copyCode}>
              {copied ? "copied!" : "copy code"}
            </button>
            <button
              className="btn"
              style={{ width: "100%", background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-pencil)" }}
              onClick={() => navigate(`/vault/${session.id}`)}
            >
              go to quizzes →
            </button>
          </div>

          <p style={{
            textAlign: "center", marginTop: 24,
            fontFamily: "var(--font-hand)", fontSize: "0.95rem",
            color: "var(--text-light)", fontStyle: "italic",
          }}>
            this page will update when they join ✨
          </p>
        </motion.div>
      </div>
    );
  }

  // Partner already joined — show redirect text
  if (session && session.player2_name) {
    return (
      <div className="page" style={{ position: "relative" }}>
        <PageDoodles seed={1} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: "center", paddingTop: 60, position: "relative", zIndex: 1 }}
        >
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.4rem", color: "var(--accent-sage)" }}>
            {session.player2_name} joined! 💛
          </p>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.1rem", color: "var(--text-secondary)", marginTop: 8 }}>
            heading to your quizzes...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page" style={{ position: "relative" }}>
      <PageDoodles seed={1} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: "center",
          paddingTop: 60,
          position: "relative",
          zIndex: 1,
        }}
      >
        {error ? (
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "var(--font-hand)",
                fontSize: "1.1rem",
                color: "var(--accent-coral)",
                marginBottom: 20,
                lineHeight: 1.4,
              }}
            >
              {error}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setError("");
                setLoading(true);
                checkExistingSession();
              }}
            >
              try again
            </button>
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.4rem",
              color: "var(--text-secondary)",
            }}
          >
            setting up your notebook...
          </p>
        )}
      </motion.div>
    </div>
  );
}
