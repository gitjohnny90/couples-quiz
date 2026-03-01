import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import PageDoodles, { DoodleHeart, SquigglyUnderline, DoodleArrow } from "../components/Doodles";

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

        if (error || !data) { setNotFound(true); return; }
        setPlayer1Name(data.player1_name);
        if (data.player2_name) setAlreadyJoined(true);
      } catch (err) {
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
      console.error("oops, couldn't join:", err);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", paddingTop: 60 }}>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.4rem", color: "var(--text-secondary)" }}>
            flipping to the right page...
          </p>
        </motion.div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={7} />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", paddingTop: 40, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📓</div>
          <h2 style={{ fontFamily: "var(--font-hand)", fontSize: "1.8rem", marginBottom: 8 }}>hmm, can't find that page</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontStyle: "italic" }}>
            this quiz session doesn't exist — maybe the link got smudged?
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>go home</button>
        </motion.div>
      </div>
    );
  }

  if (alreadyJoined) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={8} />
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", paddingTop: 40, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✌️</div>
          <h2 style={{ fontFamily: "var(--font-hand)", fontSize: "1.8rem", marginBottom: 8 }}>two's company!</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>this notebook already has two people writing in it</p>
          <button className="btn btn-primary" onClick={() => {
            setSessionId(sessionId);
            setPlayerName("Player 2");
            localStorage.setItem("playerId", "player2");
            navigate(`/vault/${sessionId}`);
          }}>
            open the notebook anyway
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={2} />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 24 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>💌</div>
          <h1 style={{ fontFamily: "var(--font-hand)", fontSize: "2.2rem", fontWeight: 700, marginBottom: 4 }}>
            you've been invited!
          </h1>
          <SquigglyUnderline width={160} color="#D4A843" opacity={0.5} style={{ margin: '0 auto 12px' }} />
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            <strong style={{ color: "var(--accent-coral)" }}>{player1Name}</strong> wants to see if you two really know each other
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <DoodleArrow width={50} color="#B8A08A" opacity={0.5} rotate={85} />
        </div>

        <div className="glass" style={{ padding: "28px 24px 24px", width: "100%", maxWidth: 380, margin: "0 auto", transform: "rotate(0.4deg)" }}>
          <label style={{ fontFamily: "var(--font-hand)", fontSize: "1.3rem", color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
            and you are...?
          </label>
          <input
            className="input"
            type="text"
            placeholder="write your name here..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            style={{ width: "100%", marginBottom: 20, boxSizing: "border-box" }}
          />
          <button className="btn btn-primary" onClick={handleJoin} disabled={joining || !name.trim()} style={{ width: "100%" }}>
            {joining ? "joining..." : "let's do this"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
