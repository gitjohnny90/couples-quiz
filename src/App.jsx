import React, { createContext, useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import VaultPage from "./pages/VaultPage";
import ProfilesPage from "./pages/ProfilesPage";

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
    {
      label: "Home",
      path: "/",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 21 9 14 15 14 15 21" />
        </svg>
      ),
    },
    {
      label: "Vault",
      path: `/vault/${sessionId}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      ),
    },
    {
      label: "Profiles",
      path: `/profiles/${sessionId}`,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  const isActive = (tabPath) => {
    if (tabPath === "/") return location.pathname === "/";
    // Extract the base segment like "/vault" or "/profiles" and match against current path
    const base = "/" + tabPath.split("/")[1];
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
          {tab.icon}
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
    } catch {
      // localStorage unavailable
    }
  }, [sessionId]);

  useEffect(() => {
    try {
      if (playerName) {
        localStorage.setItem("playerName", playerName);
      } else {
        localStorage.removeItem("playerName");
      }
    } catch {
      // localStorage unavailable
    }
  }, [playerName]);

  return (
    <SessionContext.Provider value={{ sessionId, setSessionId, playerName, setPlayerName }}>
      <div className="app">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join/:sessionId" element={<JoinPage />} />
          <Route path="/quiz/:sessionId/:packId" element={<QuizPage />} />
          <Route path="/results/:sessionId/:packId" element={<ResultsPage />} />
          <Route path="/vault/:sessionId" element={<VaultPage />} />
          <Route path="/profiles/:sessionId" element={<ProfilesPage />} />
        </Routes>
        <BottomNav />
      </div>
    </SessionContext.Provider>
  );
}
