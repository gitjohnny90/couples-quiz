import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function HomePage() {
  const { setSessionId, setPlayerName } = useContext(SessionContext);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data: session, error } = await supabase
        .from("sessions")
        .insert({ player1_name: name.trim() })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      setPlayerName(name.trim());
      localStorage.setItem("playerId", "player1");
      navigate(`/vault/${session.id}`);
    } catch (err) {
      console.error("Failed to create session:", err);
    } finally {
      setLoading(false);
    }
  };

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
          💜
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
          The Us Quiz
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: 32,
            maxWidth: 320,
          }}
        >
          The couples quiz that'll either bring you closer... or start a fight
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
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{ width: "100%" }}
          >
            {loading ? "Creating..." : "Create Quiz Session"}
          </button>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              marginTop: 20,
              paddingTop: 16,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              Fair warning: there are no wrong answers... but there are suspicious ones 👀
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
