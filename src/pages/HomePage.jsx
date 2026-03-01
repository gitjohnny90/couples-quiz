import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleStar, DoodleFlower } from "../components/Doodles";

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
    <div className="page" style={{ position: 'relative' }}>
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
        {/* Hand-drawn hearts cluster */}
        <div style={{ position: 'relative', marginBottom: 4, marginTop: 16 }}>
          <DoodleHeart size={36} color="#E88D7A" opacity={0.6} rotate={-5} />
          <div style={{ position: 'absolute', top: -8, right: -18 }}>
            <DoodleHeart size={18} color="#D4A843" opacity={0.4} rotate={12} />
          </div>
          <div style={{ position: 'absolute', bottom: -4, left: -14 }}>
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
            marginBottom: 28,
            maxWidth: 300,
            fontFamily: "var(--font-body)",
            fontSize: "1.05rem",
            lineHeight: 1.5,
          }}
        >
          The couples quiz that'll either bring you closer... or start a fight
        </p>

        {/* Main card — looks like a note card */}
        <div
          className="glass"
          style={{
            padding: "28px 24px 24px",
            marginBottom: 20,
            width: "100%",
            maxWidth: 380,
            transform: "rotate(-0.5deg)",
          }}
        >
          <label
            style={{
              fontFamily: "var(--font-hand)",
              fontSize: "1.3rem",
              color: "var(--text-secondary)",
              display: "block",
              marginBottom: 10,
            }}
          >
            your name:
          </label>
          <input
            className="input"
            type="text"
            placeholder="write it here..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{ width: "100%", marginBottom: 20, boxSizing: "border-box" }}
          />

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{ width: "100%" }}
          >
            {loading ? "creating..." : "start a quiz session"}
          </button>
        </div>

        {/* Bottom note */}
        <div
          style={{
            textAlign: "center",
            position: "relative",
            maxWidth: 320,
          }}
        >
          <p
            style={{
              color: "var(--text-light)",
              fontSize: "0.95rem",
              fontFamily: "var(--font-body)",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            Fair warning: there are no wrong answers... but there are suspicious ones 👀
          </p>
          <div style={{ position: 'absolute', right: -20, bottom: -8 }}>
            <DoodleFlower size={18} rotate={15} opacity={0.3} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
