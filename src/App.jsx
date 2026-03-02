import React, { createContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";

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

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId } = React.useContext(SessionContext);

  if (!sessionId) return null;

  const tabs = [
    { label: "home", path: "/" },
    { label: "quizzes", path: `/vault/${sessionId}` },
    { label: "fun stuff", path: `/fun/${sessionId}` },
    { label: "us", path: `/profiles/${sessionId}` },
  ];

  const isActive = (tabPath) => {
    if (tabPath === "/") return location.pathname === "/";
    const base = "/" + tabPath.split("/")[1];
    // "fun stuff" tab should also highlight for /draw and /draw-results pages
    if (base === "/fun") {
      return location.pathname.startsWith("/fun") ||
             location.pathname.startsWith("/draw") ||
             location.pathname.startsWith("/movies") ||
             location.pathname.startsWith("/books") ||
             location.pathname.startsWith("/watch-guide");
    }
    return location.pathname.startsWith(base);
  };

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          className={`nav-item${isActive(tab.path) ? " active" : ""}`}
          onClick={() => navigate(tab.path)}
        >
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
          <Route path="/draw-results/:sessionId" element={<RequireName><DrawResultsPage /></RequireName>} />
          <Route path="/fun/:sessionId" element={<RequireName><FunStuffPage /></RequireName>} />
          <Route path="/movies/:sessionId" element={<RequireName><MoviesPage /></RequireName>} />
          <Route path="/watch-guide/:sessionId" element={<RequireName><WatchGuidePage /></RequireName>} />
          <Route path="/books/:sessionId" element={<RequireName><BooksPage /></RequireName>} />
          <Route path="/vault/:sessionId" element={<RequireName><VaultPage /></RequireName>} />
          <Route path="/profiles/:sessionId" element={<RequireName><ProfilesPage /></RequireName>} />
        </Routes>
        <BottomNav />
      </div>
    </SessionContext.Provider>
  );
}
