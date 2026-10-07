import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, BellOff, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useConversations, useUnreadCount } from "../../lib/queries";
import { useSession } from "../../lib/session";

const SOUND_KEY = "connectme.alertSound.v1";
const soundOn = () => localStorage.getItem(SOUND_KEY) !== "off";

function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const play = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.4);
    };
    play(740, 0);
    play(988, 0.12);
    window.setTimeout(() => void ctx.close(), 900);
  } catch {
    /* audio unavailable */
  }
}

export function AlertSoundToggle() {
  const [on, setOn] = useState(soundOn);
  const toggle = () => {
    const next = !on;
    localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    setOn(next);
    if (next) chime();
  };
  return (
    <button onClick={toggle} aria-pressed={on} aria-label={on ? "Mute message sounds" : "Unmute message sounds"} data-testid="alert-sound-toggle" className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:text-white">
      {on ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
    </button>
  );
}

export function MessageAlerts() {
  const { active } = useSession();
  const { data } = useConversations();
  const unread = useUnreadCount();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const seen = useRef<Map<string, string> | null>(null);
  const profile = active?.id;

  useEffect(() => {
    seen.current = null;
  }, [profile]);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\)\s*/, "");
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread]);

  useEffect(() => {
    if (!data) return;
    if (!seen.current) {
      seen.current = new Map(data.map((c) => [c.person.id, c.last_message.id]));
      return;
    }
    let played = false;
    for (const c of data) {
      const last = c.last_message;
      const prev = seen.current.get(c.person.id);
      seen.current.set(c.person.id, last.id);
      if (prev === last.id || last.mine || pathname === `/messages/${c.person.id}`) continue;
      toast(c.person.name, {
        id: `msg-${last.id}`,
        description: last.text.length > 90 ? `${last.text.slice(0, 90)}…` : last.text,
        icon: <MessageCircle className="h-4 w-4 text-[#ffb086]" />,
        action: { label: "Open", onClick: () => navigate(`/messages/${c.person.id}`) },
        duration: 6000,
      });
      if (!played && soundOn()) {
        chime();
        played = true;
      }
    }
  }, [data, pathname, navigate]);

  return null;
}
