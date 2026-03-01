import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function JoinPage() {
  const { sessionId } = useParams();
  const { setSessionId, setPlayerName } = useContext(SessionContext);
  const navigate = useNavigate();

  const [player1Name, setPlayer1Name] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("player1_name, player2_name")
          .eq("id", sessionId)
          .single();

        if (error || !data) {
          setNotFound(true);
          return;
        }

        setPlayer1Name(data.player1_name);

        if (data.player2_name) {
          setAlreadyJoined(true);
        }
      } catch (err) {
        console.error("Failed to fetch session:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const handleJoin = async () => {
    if (!name.trim()) return;
    setJoining(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ player2_name: name.trim() })
        .eq("id", sessionId);

      if (error) throw error;

      setSessionId(sessionId);
      setPlayerName(name.trim());
      localStorage.setItem("playerId", "player2");
      navigate(`/vault/${sessionId}`);
    } catch (err) {
      console.error("Failed to join session:", err);
    } finally {
      setJoining(false);
    }
  };

  const handleGoToVault = () => {
    setSessionId(sessionId);
    setPlayerName(player1Name);
    navigate(`/vault/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="page">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", color: "var(--text-secondary)" }}
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: 8, lineHeight: 1 }}>
            😕
          </div>
          <h1
            className="text-gradient"
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Session Not Found
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              textAlign: "center",
              marginBottom: 32,
              maxWidth: 320,
            }}
          >
            This session doesn't exist or the link may be invalid. Ask your
            partner for a new one!
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
            style={{ maxWidth: 400 }}
          >
            Go Home
          </button>
        </motion.div>
      </div>
    );
  }

  if (alreadyJoined) {
    return (
      <div className="page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: 8, lineHeight: 1 }}>
            👥
          </div>
          <h1
            className="text-gradient"
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Session Full
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              textAlign: "center",
              marginBottom: 32,
              maxWidth: 320,
            }}
          >
            This session already has two players.
          </p>
          <button
            className="btn btn-primary"
            onClick={handleGoToVault}
            style={{ maxWidth: 400 }}
          >
            Go to Vault Anyway
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: 8, lineHeight: 1 }}>
          💌
        </div>

        <h1
          className="text-gradient"
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          You've been invited!
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: 32,
            maxWidth: 320,
          }}
        >
          {player1Name} wants to see if you really know each other
        </p>

        <div
          className="glass"
          style={{
            padding: 24,
            marginBottom: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <input
            className="input"
            type="text"
            placeholder="Enter your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", marginBottom: 16, boxSizing: "border-box" }}
          />

          <button
            className="btn btn-primary"
            onClick={handleJoin}
            disabled={joining || !name.trim()}
            style={{ width: "100%" }}
          >
            {joining ? "Joining..." : "Join Session"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
