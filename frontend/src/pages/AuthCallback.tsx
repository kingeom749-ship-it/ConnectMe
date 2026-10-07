import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useSession } from "../lib/session";
import { useRefresh } from "../lib/queries";

/** Lands here from auth.emergentagent.com as /auth/callback#session_id=... */
export default function AuthCallback() {
  const processed = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { addProfile } = useSession();
  const refresh = useRefresh();

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sessionId = new URLSearchParams(location.hash.replace(/^#/, "")).get("session_id");
    const go = async () => {
      try {
        if (sessionId) {
          window.history.replaceState(null, "", location.pathname);
          const res = await api.googleSession(sessionId);
          if (res.status === "signed_in") {
            addProfile({ id: res.person.id, name: res.person.name, token: res.token, picture: res.person.picture });
            refresh();
            toast.success(`Welcome back, ${res.person.name.split(" ")[0]}`);
            navigate("/directory", { replace: true });
          } else {
            navigate("/register", { replace: true, state: { google: { email: res.email, name: res.name, picture: res.picture, session_token: res.session_token } } });
          }
          return;
        }
        // No fragment: adopt an existing cookie session if there is one.
        const me = await api.authMe();
        addProfile({ id: me.person.id, name: me.person.name, token: me.token, picture: me.person.picture });
        refresh();
        navigate("/directory", { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign-in failed";
        if (msg === "registration_required") {
          navigate("/register", { replace: true });
          return;
        }
        toast.error(msg);
        navigate("/register", { replace: true });
      }
    };
    void go();
  }, [location.hash, location.pathname, addProfile, navigate, refresh]);

  return (
    <main className="grid min-h-screen place-items-center px-5 pt-28" data-testid="auth-callback-page">
      <p className="flex items-center gap-3 text-zinc-300"><Loader2 className="h-5 w-5 animate-spin text-[#ffb086]" /> Signing you in with Google…</p>
    </main>
  );
}
