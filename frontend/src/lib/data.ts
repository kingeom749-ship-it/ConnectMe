import { Music2, Gamepad2, Trophy, PenLine, Mic2, Cpu, Wrench, Briefcase, Terminal, FlaskConical, Bot, Clapperboard, Footprints, CircleDot, Sparkles, Camera, Disc3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type InterestId =
  | "dancing" | "gaming" | "sports" | "writing" | "singing"
  | "ai-building" | "content-creation" | "run-club" | "pickleball" | "anime" | "photography" | "music-production";

export interface Interest {
  id: InterestId;
  label: string;
  image: string;
  tagline: string;
  icon: LucideIcon;
  trending?: boolean;
}

export const INTERESTS: Interest[] = [
  { id: "dancing", label: "Dancing", image: "/images/dancing.jpg", tagline: "Crews, choreo & stage nights", icon: Music2 },
  { id: "gaming", label: "Gaming", image: "/images/gaming.jpg", tagline: "Squads, LAN parties & esports", icon: Gamepad2 },
  { id: "sports", label: "Sports", image: "/images/sports.jpg", tagline: "Pickup games & training partners", icon: Trophy },
  { id: "writing", label: "Writing", image: "/images/writing.jpg", tagline: "Poetry circles & zine makers", icon: PenLine },
  { id: "singing", label: "Singing", image: "/images/singing.jpg", tagline: "Jam rooms, choirs & open mics", icon: Mic2 },
  { id: "ai-building", label: "AI & Vibe Coding", image: "/images/ai-building.jpg", tagline: "Build agents, ship side projects", icon: Bot, trending: true },
  { id: "content-creation", label: "Content Creation", image: "/images/content-creation.jpg", tagline: "Reels, streams & podcasts", icon: Clapperboard, trending: true },
  { id: "run-club", label: "Run Club", image: "/images/run-club.jpg", tagline: "Sunrise 5Ks & social runs", icon: Footprints, trending: true },
  { id: "pickleball", label: "Pickleball & Padel", image: "/images/pickleball.jpg", tagline: "Rally partners & weekend ladders", icon: CircleDot, trending: true },
  { id: "anime", label: "Anime & Cosplay", image: "/images/anime.jpg", tagline: "Watch parties, cons & costume builds", icon: Sparkles, trending: true },
  { id: "photography", label: "Photography & Film", image: "/images/photography.jpg", tagline: "Street walks & short films", icon: Camera, trending: true },
  { id: "music-production", label: "Music Production", image: "/images/music-production.jpg", tagline: "Beats, DJ sets & bedroom studios", icon: Disc3, trending: true },
];

export const INTEREST_MAP = Object.fromEntries(INTERESTS.map((i) => [i.id, i])) as Record<InterestId, Interest>;

export const DEPARTMENTS = ["B.Tech", "BE", "MBA", "CDAC", "Pharmacy"] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const DEPARTMENT_INFO: Record<Department, { full: string; icon: LucideIcon }> = {
  "B.Tech": { full: "Bachelor of Technology", icon: Cpu },
  BE: { full: "Bachelor of Engineering", icon: Wrench },
  MBA: { full: "Master of Business Administration", icon: Briefcase },
  CDAC: { full: "C-DAC Advanced Computing", icon: Terminal },
  Pharmacy: { full: "Pharmaceutical Sciences", icon: FlaskConical },
};

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
