import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { Nav } from "./components/Nav";
import { SmoothScroll } from "./components/SmoothScroll";
import { SessionProvider } from "./lib/session";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Directory from "./pages/Directory";
import Requests from "./pages/Requests";

export default function App() {
  return (
    <div className="App">
      <SessionProvider>
        <BrowserRouter>
          <SmoothScroll />
          <Nav />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register" element={<Register />} />
            <Route path="/directory" element={<Directory />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="*" element={<Landing />} />
          </Routes>
          <Toaster theme="dark" position="bottom-center" richColors />
        </BrowserRouter>
      </SessionProvider>
    </div>
  );
}
