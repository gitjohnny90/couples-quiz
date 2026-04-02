import React, { createContext, useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useLocation, useNavigate, Navigate } from "react-router-dom";
import { getDocumentTitle, isTabActive } from "./utils/sessionUtils";
import { AuthContext } from "./contexts/AuthContext";

// Eager imports — critical path (auth, home, vault)
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import VaultPage from "./pages/VaultPage";
import MissYouHeart from "./components/MissYouHeart";

// Lazy imports — loaded on navigation
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const JoinPage = lazy(() => import("./pages/JoinPage"));
const QuizPage = lazy(() => import("./pages/QuizPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const PersonalityPage = lazy(() => import("./pages/PersonalityPage"));
const VisionPage = lazy(() => import("./pages/VisionPage"));
const DrawPage = lazy(() => import("./pages/DrawPage"));
const DrawResultsPage = lazy(() => import("./pages/DrawResultsPage"));
const FunStuffPage = lazy(() => import("./pages/FunStuffPage"));
const MoviesPage = lazy(() => import("./pages/MoviesPage"));
const StudyTogetherPage = lazy(() => import("./pages/StudyTogetherPage"));
const WatchGuidePage = lazy(() => import("./pages/WatchGuidePage"));
const DeepDivePage = lazy(() => import("./pages/DeepDivePage"));
const DeepDiveDeckPage = lazy(() => import("./pages/DeepDiveDeckPage"));
const JournalPage = lazy(() => import("./pages/JournalPage"));
const QuizPacksPage = lazy(() => import("./pages/QuizPacksPage"));
const TicTacToePage = lazy(() => import("./pages/TicTacToePage"));
const HeartLinePage = lazy(() => import("./pages/HeartLinePage"));
const LoveNoteHuntPage = lazy(() => import("./pages/LoveNoteHuntPage"));
const PredictPartnerPage = lazy(() => import("./pages/PredictPartnerPage"));
const FinishSentencePage = lazy(() => import("./pages/FinishSentencePage"));
const HotTakesPage = lazy(() => import("./pages/HotTakesPage"));
const DailyPhotosHubPage = lazy(() => import("./pages/DailyPhotosHubPage"));
const DailyPhotoSectionPage = lazy(() => import("./pages/DailyPhotoSectionPage"));
const DailyPhotoRevealPage = lazy(() => import("./pages/DailyPhotoRevealPage"));
const WaitlistPage = lazy(() => import("./pages/WaitlistPage"));

// Error boundary catches chunk load failures from React.lazy
class LazyErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{ textAlign: "center", paddingTop: 60 }}>
          <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.4rem", color: "var(--text-secondary)", marginBottom: 16 }}>
            oops — that page didn't load right
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
            style={{
              fontFamily: "var(--font-hand)", fontSize: "1.2rem", padding: "10px 24px",
              background: "var(--accent-coral)", color: "white", border: "none",
              borderRadius: 8, cursor: "pointer"
            }}
          >
            try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Dev-only auth bypass for preview testing (double-safe: requires DEV mode AND env var)
const DEV_BYPASS_AUTH = import.meta.env.DEV && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';

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
      return localStorage.getItem("sessionId") || (DEV_BYPASS_AUTH ? "preview" : null);
    } catch {
      return DEV_BYPASS_AUTH ? "preview" : null;
    }
  });

  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem("playerName") || (DEV_BYPASS_AUTH ? "Preview" : null);
    } catch {
      return DEV_BYPASS_AUTH ? "Preview" : null;
    }
  });

  const [playerId, setPlayerId] = useState(() => {
    try {
      return localStorage.getItem("playerId") || (DEV_BYPASS_AUTH ? "player1" : null);
    } catch {
      return DEV_BYPASS_AUTH ? "player1" : null;
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
        <LazyErrorBoundary>
        <Suspense fallback={
          <div className="page" style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontFamily: "var(--font-hand)", fontSize: "1.4rem", color: "var(--text-secondary)" }}>
              flipping to that page...
            </p>
          </div>
        }>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
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
          <Route path="/study/:sessionId" element={<RequireAuth><StudyTogetherPage /></RequireAuth>} />
          <Route path="/tictactoe/:sessionId" element={<RequireAuth><TicTacToePage /></RequireAuth>} />
          <Route path="/heartline/:sessionId" element={<RequireAuth><HeartLinePage /></RequireAuth>} />
          <Route path="/love-notes/:sessionId" element={<RequireAuth><LoveNoteHuntPage /></RequireAuth>} />
          <Route path="/predict-partner/:sessionId" element={<RequireAuth><PredictPartnerPage /></RequireAuth>} />
          <Route path="/finish-sentence/:sessionId" element={<RequireAuth><FinishSentencePage /></RequireAuth>} />
          <Route path="/hot-takes/:sessionId" element={<RequireAuth><HotTakesPage /></RequireAuth>} />
          <Route path="/daily-photos/:sessionId" element={<RequireAuth><DailyPhotosHubPage /></RequireAuth>} />
          <Route path="/daily-photo-section/:sessionId/:sectionId" element={<RequireAuth><DailyPhotoSectionPage /></RequireAuth>} />
          <Route path="/daily-photo-reveal/:sessionId/:sectionId" element={<RequireAuth><DailyPhotoRevealPage /></RequireAuth>} />
          <Route path="/deep-dive/:sessionId" element={<RequireAuth><DeepDivePage /></RequireAuth>} />
          <Route path="/deep-dive/:sessionId/:deckId" element={<RequireAuth><DeepDiveDeckPage /></RequireAuth>} />
          <Route path="/journal/:sessionId" element={<RequireAuth><JournalPage /></RequireAuth>} />
          <Route path="/quiz-packs/:sessionId" element={<RequireAuth><QuizPacksPage /></RequireAuth>} />
          <Route path="/vault/:sessionId" element={<RequireAuth><VaultPage /></RequireAuth>} />
          <Route path="/profiles/:sessionId" element={<RequireAuth><ProfilesPage /></RequireAuth>} />
          <Route path="/personality/:sessionId" element={<RequireAuth><PersonalityPage /></RequireAuth>} />
          <Route path="/vision/:sessionId" element={<RequireAuth><VisionPage /></RequireAuth>} />
        </Routes>
        </Suspense>
        </LazyErrorBoundary>
        <BottomNav />
        <MissYouHeart />
      </div>
    </SessionContext.Provider>
  );
}
