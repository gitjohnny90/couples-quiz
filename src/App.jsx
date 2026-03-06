import React, { createContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { getDocumentTitle, isTabActive } from "./utils/sessionUtils";

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

// Guard: redirects to home if no name has been entered yet
function RequireName({ children }) {
  const { playerName } = React.useContext(SessionContext);
  if (!playerName) return <Navigate to="/" replace />;
  return children;
}

export const SessionContext = createContext({
  sessionId: null,
  setSessionId: () => {},
  playerName: null,
  setPlayerName: () => {},
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

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId, playerName, setPlayerName }}>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join/:sessionId" element={<JoinPage />} />
          <Route path="/quiz/:sessionId/:packId" element={<RequireName><QuizPage /></RequireName>} />
          <Route path="/results/:sessionId/:packId" element={<RequireName><ResultsPage /></RequireName>} />
          <Route path="/draw/:sessionId" element={<RequireName><DrawPage /></RequireName>} />
          <Route path="/draw-results/:sessionId/:promptId" element={<RequireName><DrawResultsPage /></RequireName>} />
          <Route path="/draw-results/:sessionId" element={<RequireName><DrawResultsPage /></RequireName>} />
          <Route path="/fun/:sessionId" element={<RequireName><FunStuffPage /></RequireName>} />
          <Route path="/movies/:sessionId" element={<RequireName><MoviesPage /></RequireName>} />
          <Route path="/watch-guide/:sessionId" element={<RequireName><WatchGuidePage /></RequireName>} />
          <Route path="/books/:sessionId" element={<RequireName><BooksPage /></RequireName>} />
          <Route path="/tictactoe/:sessionId" element={<RequireName><TicTacToePage /></RequireName>} />
          <Route path="/love-notes/:sessionId" element={<RequireName><LoveNoteHuntPage /></RequireName>} />
          <Route path="/deep-dive/:sessionId" element={<RequireName><DeepDivePage /></RequireName>} />
          <Route path="/deep-dive/:sessionId/:deckId" element={<RequireName><DeepDiveDeckPage /></RequireName>} />
          <Route path="/journal/:sessionId" element={<RequireName><JournalPage /></RequireName>} />
          <Route path="/quiz-packs/:sessionId" element={<RequireName><QuizPacksPage /></RequireName>} />
          <Route path="/vault/:sessionId" element={<RequireName><VaultPage /></RequireName>} />
          <Route path="/profiles/:sessionId" element={<RequireName><ProfilesPage /></RequireName>} />
        </Routes>
        <BottomNav />
      </div>
    </SessionContext.Provider>
  );
}
