import { Music2, Gamepad2, Trophy, PenLine, Mic2, Cpu, Wrench, Briefcase, Terminal, FlaskConical } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type InterestId = "dancing" | "gaming" | "sports" | "writing" | "singing";

export interface Interest {
  id: InterestId;
  label: string;
  image: string;
  tagline: string;
  icon: LucideIcon;
}

export const INTERESTS: Interest[] = [
  { id: "dancing", label: "Dancing", image: "/images/dancing.jpg", tagline: "Crews, choreo & stage nights", icon: Music2 },
  { id: "gaming", label: "Gaming", image: "/images/gaming.jpg", tagline: "Squads, LAN parties & esports", icon: Gamepad2 },
  { id: "sports", label: "Sports", image: "/images/sports.jpg", tagline: "Pickup games & training partners", icon: Trophy },
  { id: "writing", label: "Writing", image: "/images/writing.jpg", tagline: "Poetry circles & zine makers", icon: PenLine },
  { id: "singing", label: "Singing", image: "/images/singing.jpg", tagline: "Jam rooms, choirs & open mics", icon: Mic2 },
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
