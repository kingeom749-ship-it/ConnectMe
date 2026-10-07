import "./App.css";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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

function AppRoutes() {
  const location = useLocation();
  // Google auth returns to {origin}/auth/callback#session_id=... — handle it before any other route renders.
  if (location.hash.includes("session_id=")) return <AuthCallback />;
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/directory" element={<Directory />} />
      <Route path="/requests" element={<Requests />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:personId" element={<Messages />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default function App() {
  return (
    <div className="App">
      <SessionProvider>
        <BrowserRouter>
          <SmoothScroll />
          <Nav />
          <MessageAlerts />
          <AppRoutes />
          <Toaster theme="dark" position="bottom-center" richColors />
        </BrowserRouter>
      </SessionProvider>
    </div>
  );
}
