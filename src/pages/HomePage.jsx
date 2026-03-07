import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { AuthContext } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageDoodles from "../components/Doodles";

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

  const displayName = user?.user_metadata?.display_name || "Player";

  // On mount: check if user already has a session, or auto-create/join one
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
        navigate(`/vault/${session.id}`, { replace: true });
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
