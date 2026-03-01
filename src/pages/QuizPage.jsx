import { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { supabase } from "../lib/supabase";
import quizPacks from "../data/quizPacks";
import { motion, AnimatePresence } from "framer-motion";

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
      <div className="page">
        <div
          className="glass"
          style={{ padding: 32, textAlign: "center", maxWidth: 400 }}
        >
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔍</div>
          <h2 style={{ marginBottom: 8 }}>Quiz not found</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
            This quiz pack doesn't exist or may have been removed.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
          >
            Go Home
          </button>
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
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = async () => {
    if (!hasCurrentAnswer) return;

    if (isLastQuestion) {
      setSubmitted(true);
      try {
        const { error } = await supabase.from("responses").upsert(
          {
            session_id: sessionId,
            pack_id: packId,
            player_id: playerId,
            player_name: playerName,
            answers: answers,
          },
          { onConflict: "session_id,pack_id,player_id" }
        );

        if (error) throw error;

        navigate(`/results/${sessionId}/${packId}`);
      } catch (err) {
        console.error("Failed to save answers:", err);
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
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
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
          maxWidth: 500,
        }}
      >
        {/* Pack Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 4, lineHeight: 1 }}>
            {pack.emoji}
          </div>
          <h1
            className="text-gradient"
            style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}
          >
            {pack.title}
          </h1>
        </div>

        {/* Progress */}
        <div style={{ width: "100%", marginBottom: 24 }}>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Question {currentQ + 1} of {questions.length}
          </p>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${progressPercent}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div
          className="glass"
          style={{
            padding: 24,
            width: "100%",
            minHeight: 320,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
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
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              {/* Question Text */}
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  marginBottom: 20,
                  lineHeight: 1.4,
                }}
              >
                {currentQuestion.text}
              </h2>

              {/* Options */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                }}
              >
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn${
                      answers[currentQuestion.id] === index ? " selected" : ""
                    }`}
                    onClick={() => handleSelectOption(index)}
                    disabled={submitted}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              gap: 12,
            }}
          >
            {currentQ > 0 ? (
              <button
                className="btn btn-secondary"
                onClick={handleBack}
                disabled={submitted}
                style={{ flex: 1 }}
              >
                Back
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}

            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!hasCurrentAnswer || submitted}
              style={{ flex: 1 }}
            >
              {submitted
                ? "Saving..."
                : isLastQuestion
                ? "Submit Answers"
                : "Next"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
