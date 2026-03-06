import React, { createContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { getDocumentTitle, isTabActive } from "./utils/sessionUtils";
import { AuthContext } from "./contexts/AuthContext";

import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import VaultPage from "./pages/VaultPage";
import ProfilesPage from "./pages/ProfilesPage";
import DrawPage from "./pages/DrawPage";
import DrawResultsPage from "./pages/DrawResultsPage";
import FunStuffPage from "./pages/FunStuffPage";
import MoviesPage from "./pages/MoviesPage";
import BooksPage from "./pages/BooksPage";
import WatchGuidePage from "./pages/WatchGuidePage";
import DeepDivePage from "./pages/DeepDivePage";
import DeepDiveDeckPage from "./pages/DeepDiveDeckPage";
import JournalPage from "./pages/JournalPage";
import QuizPacksPage from "./pages/QuizPacksPage";
import TicTacToePage from "./pages/TicTacToePage";
import LoveNoteHuntPage from "./pages/LoveNoteHuntPage";
import MissYouHeart from "./components/MissYouHeart";

// Guard: redirects to /auth if not logged in
function RequireAuth({ children }) {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", paddingTop: 60 }}>
        <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.4rem", color: "var(--text-secondary)" }}>
          opening the notebook...
        </p>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export const SessionContext = createContext({
  sessionId: null,
  setSessionId: () => {},
  playerName: null,
  setPlayerName: () => {},
  playerId: null,
  setPlayerId: () => {},
});

function useDocumentTitle() {
  const location = useLocation();
  React.useEffect(() => {
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = React.useContext(SessionContext);

  useDocumentTitle();

  if (!sessionId) return null;

  const tabs = [
    { label: "home", icon: "\u{1F3E0}", path: "/" },
    { label: "quizzes", icon: "\u{1F4DD}", path: `/vault/${sessionId}` },
    { label: "fun stuff", icon: "\u{1F389}", path: `/fun/${sessionId}` },
    { label: "us", icon: "\u{1F495}", path: `/profiles/${sessionId}` },
  ];

  const isActive = (tabPath) => isTabActive(tabPath, location.pathname);

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={`nav-item${isActive(tab.path) ? " active" : ""}`}
          onClick={() => navigate(tab.path)}
          aria-current={isActive(tab.path) ? "page" : undefined}
        >
          <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default function App() {
  const [sessionId, setSessionId] = useState(() => {
    try {
      return localStorage.getItem("sessionId") || null;
    } catch {
      return null;
    }
  });

  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem("playerName") || null;
    } catch {
      return null;
    }
  });

  const [playerId, setPlayerId] = useState(() => {
    try {
      return localStorage.getItem("playerId") || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (sessionId) {
        localStorage.setItem("sessionId", sessionId);
      } else {
        localStorage.removeItem("sessionId");
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => {
    try {
      if (playerName) {
        localStorage.setItem("playerName", playerName);
      } else {
        localStorage.removeItem("playerName");
      }
    } catch {}
  }, [playerName]);

  useEffect(() => {
    try {
      if (playerId) {
        localStorage.setItem("playerId", playerId);
      } else {
        localStorage.removeItem("playerId");
      }
    } catch {}
  }, [playerId]);

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId, playerName, setPlayerName, playerId, setPlayerId }}>
      <div className="app" style={{ position: 'relative' }}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/join/:sessionId" element={<RequireAuth><JoinPage /></RequireAuth>} />
          <Route path="/quiz/:sessionId/:packId" element={<RequireAuth><QuizPage /></RequireAuth>} />
          <Route path="/results/:sessionId/:packId" element={<RequireAuth><ResultsPage /></RequireAuth>} />
          <Route path="/draw/:sessionId" element={<RequireAuth><DrawPage /></RequireAuth>} />
          <Route path="/draw-results/:sessionId/:promptId" element={<RequireAuth><DrawResultsPage /></RequireAuth>} />
          <Route path="/draw-results/:sessionId" element={<RequireAuth><DrawResultsPage /></RequireAuth>} />
          <Route path="/fun/:sessionId" element={<RequireAuth><FunStuffPage /></RequireAuth>} />
          <Route path="/movies/:sessionId" element={<RequireAuth><MoviesPage /></RequireAuth>} />
          <Route path="/watch-guide/:sessionId" element={<RequireAuth><WatchGuidePage /></RequireAuth>} />
          <Route path="/books/:sessionId" element={<RequireAuth><BooksPage /></RequireAuth>} />
          <Route path="/tictactoe/:sessionId" element={<RequireAuth><TicTacToePage /></RequireAuth>} />
          <Route path="/love-notes/:sessionId" element={<RequireAuth><LoveNoteHuntPage /></RequireAuth>} />
          <Route path="/deep-dive/:sessionId" element={<RequireAuth><DeepDivePage /></RequireAuth>} />
          <Route path="/deep-dive/:sessionId/:deckId" element={<RequireAuth><DeepDiveDeckPage /></RequireAuth>} />
          <Route path="/journal/:sessionId" element={<RequireAuth><JournalPage /></RequireAuth>} />
          <Route path="/quiz-packs/:sessionId" element={<RequireAuth><QuizPacksPage /></RequireAuth>} />
          <Route path="/vault/:sessionId" element={<RequireAuth><VaultPage /></RequireAuth>} />
          <Route path="/profiles/:sessionId" element={<RequireAuth><ProfilesPage /></RequireAuth>} />
        </Routes>
        <BottomNav />
        <MissYouHeart />
      </div>
    </SessionContext.Provider>
  );
}
