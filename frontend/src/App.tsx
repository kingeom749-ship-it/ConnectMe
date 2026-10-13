import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";
import { Nav } from "./components/Nav";
import { MessageAlerts } from "./components/chat/MessageAlerts";
import { SmoothScroll } from "./components/SmoothScroll";
import { SessionProvider } from "./lib/session";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Directory from "./pages/Directory";
import Requests from "./pages/Requests";
import Messages from "./pages/Messages";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import PublicProfile from "./pages/PublicProfile";
import { IntroOverlay } from "./components/IntroOverlay";

function AppRoutes() {
  const location = useLocation();
  // Google auth returns to {origin}/auth/callback#session_id=... — handle it before any other route renders.
  if (location.hash.includes("session_id=")) return <AuthCallback />;
  // Messages list <-> thread share a layout: keep them on one key so switching threads doesn't re-run the page transition.
  const pageKey = location.pathname.startsWith("/messages") ? "/messages" : location.pathname;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        data-testid="page-transition"
        initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -14, filter: "blur(6px)", transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/directory" element={<Directory />} />
          <Route path="/people/:personId" element={<PublicProfile />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:personId" element={<Messages />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <div className="App">
      <SessionProvider>
        <BrowserRouter>
          <SmoothScroll />
          <IntroOverlay />
          <Nav />
          <MessageAlerts />
          <AppRoutes />
          <Toaster theme="dark" position="bottom-center" richColors />
        </BrowserRouter>
      </SessionProvider>
    </div>
  );
}
