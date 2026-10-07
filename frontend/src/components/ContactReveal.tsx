import { MessageCircle, Phone, ShieldCheck } from "lucide-react";

interface Props {
  phone: string;
  other: string;
  spot: string;
}

const btn = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.03]";

export function ContactReveal({ phone, other, spot }: Props) {
  const digits = phone.replace(/\D/g, "");
  const wa = `https://wa.me/${digits}?text=${encodeURIComponent(`Hey ${other}, I'm heading to ${spot} — see you there!`)}`;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4" data-testid="contact-reveal">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-[#34d399]" /> Contact unlocked
        </p>
        <p className="mt-1 font-mono text-base text-white" data-testid="contact-phone">{phone}</p>
        <p className="text-xs text-zinc-400">Shared with you because you both confirmed the spot.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${phone}`} data-testid="contact-call-link" className={`${btn} bg-white text-[#07080c]`}>
          <Phone className="h-4 w-4" /> Call
        </a>
        <a href={wa} target="_blank" rel="noreferrer" data-testid="contact-whatsapp-link" className={`${btn} bg-[#25D366] text-[#07080c]`}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
      </div>
    </div>
  );
}
