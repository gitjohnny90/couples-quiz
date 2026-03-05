import { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { supabase } from "../lib/supabase";
import quizPacks from "../data/quizPacks";
import { motion, AnimatePresence } from "framer-motion";
import PageDoodles, { SquigglyUnderline, DoodleStar } from "../components/Doodles";

export default function QuizPage() {
  const { sessionId, packId } = useParams();
  const { playerName } = useContext(SessionContext);
  const navigate = useNavigate();
  const playerId = localStorage.getItem("playerId");

  const pack = quizPacks.find((p) => p.id === packId);

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  if (!pack) {
    return (
      <div className="page" style={{ position: 'relative' }}>
        <PageDoodles seed={99} />
        <div className="glass" style={{ padding: 28, textAlign: "center", position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: "2rem", marginBottom: 12 }}>📓</div>
          <h2 style={{ fontFamily: "var(--font-hand)", fontSize: "1.6rem", marginBottom: 8 }}>can't find that quiz</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontStyle: "italic" }}>
            this page seems to be missing from the notebook
          </p>
          <button className="btn btn-primary" onClick={() => navigate("/")}>go home</button>
        </div>
      </div>
    );
  }

  const questions = pack.questions;
  const currentQuestion = questions[currentQ];
  const isLastQuestion = currentQ === questions.length - 1;
  const hasCurrentAnswer = answers[currentQuestion.id] !== undefined;
  const progressPercent = ((currentQ + 1) / questions.length) * 100;

  const handleSelectOption = (optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }));
  };

  const handleNext = async () => {
    if (!hasCurrentAnswer) return;
    if (isLastQuestion) {
      setSubmitted(true);
      try {
        const { error } = await supabase.from("responses").upsert(
          { session_id: sessionId, pack_id: packId, player_id: playerId, player_name: playerName, answers },
          { onConflict: "session_id,pack_id,player_id" }
        );
        if (error) throw error;
        navigate(`/results/${sessionId}/${packId}`);
      } catch (err) {
        console.error("oops, couldn't save:", err);
        setSubmitted(false);
      }
    } else {
      setDirection(1);
      setCurrentQ((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  // Tiny rotation for each option card
  const optionRotations = [-0.6, 0.4, -0.3, 0.7];

  return (
    <div className="page" style={{ position: 'relative' }}>
      <PageDoodles seed={3} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", position: 'relative', zIndex: 1 }}
      >
        {/* Pack header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "2rem", marginBottom: 4 }}>{pack.emoji}</div>
          <h1 style={{ fontFamily: "var(--font-hand)", fontSize: "1.8rem", fontWeight: 700, color: "var(--accent-coral)" }}>
            {pack.title}
          </h1>
        </div>

        {/* Crayon progress bar */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: 6, textAlign: "center", fontFamily: "var(--font-hand)", fontSize: "1.1rem" }}>
            {currentQ + 1} of {questions.length}
          </p>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Question area — index card feel */}
        <div
          className="glass"
          style={{
            padding: "24px 20px",
            width: "100%",
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            transform: "rotate(0.3deg)",
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQ}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ display: "flex", flexDirection: "column", flex: 1 }}
            >
              <h2 style={{
                fontSize: "1.15rem",
                fontFamily: "var(--font-body)",
                fontWeight: 400,
                marginBottom: 18,
                lineHeight: 1.5,
                color: "var(--text-primary)",
              }}>
                {currentQuestion.text}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn${answers[currentQuestion.id] === index ? " selected" : ""}`}
                    onClick={() => handleSelectOption(index)}
                    disabled={submitted}
                    aria-pressed={answers[currentQuestion.id] === index}
                    style={{ transform: `rotate(${optionRotations[index] || 0}deg)` }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 12 }}>
            {currentQ > 0 ? (
              <button className="btn btn-secondary" onClick={handleBack} disabled={submitted} style={{ flex: 1 }}>
                ← back
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <button className="btn btn-primary" onClick={handleNext} disabled={!hasCurrentAnswer || submitted} style={{ flex: 1 }}>
              {submitted ? "saving..." : isLastQuestion ? "done!" : "next →"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
