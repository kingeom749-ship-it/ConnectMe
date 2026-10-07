import { Search, LayoutGrid, Rows3 } from "lucide-react";
import { DEPARTMENTS, INTERESTS, slug } from "../lib/data";
import { cn } from "../lib/utils";

interface Props {
  q: string;
  interest: string;
  department: string;
  view: "grid" | "grouped";
  onQ: (v: string) => void;
  onInterest: (v: string) => void;
  onDepartment: (v: string) => void;
  onView: (v: "grid" | "grouped") => void;
}

const pill = (on: boolean) =>
  cn(
    "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-[background-color,border-color,color] duration-300",
    on ? "border-[#2fb8ff] bg-[#2fb8ff] text-[#07080c]" : "border-white/10 text-zinc-200 hover:border-white/30"
  );

export function DirectoryFilters(p: Props) {
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="group relative flex-1">
          <span className="sr-only">Search by name or full phone number</span>
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#2fb8ff]" />
          <input
            value={p.q}
            onChange={(e) => p.onQ(e.target.value)}
            placeholder="Search by name or full phone number"
            data-testid="directory-search-input"
            className="h-14 w-full rounded-full border border-white/10 bg-white/[0.03] pl-14 pr-5 text-white placeholder:text-zinc-500 focus:border-[#2fb8ff] focus:outline-none"
          />
        </label>
        <select
          value={p.department}
          onChange={(e) => p.onDepartment(e.target.value)}
          aria-label="Filter by department"
          data-testid="directory-department-filter-select"
          className="h-14 rounded-full border border-white/10 bg-[#0e1016] px-5 text-white focus:border-[#2fb8ff] focus:outline-none"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="flex h-14 rounded-full border border-white/10 p-1" role="group" aria-label="View">
          {(["grid", "grouped"] as const).map((v) => (
            <button
              key={v}
              onClick={() => p.onView(v)}
              aria-pressed={p.view === v}
              data-testid={`directory-view-${v}-btn`}
              className={cn("flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm transition-colors", p.view === v ? "bg-white text-[#07080c]" : "text-zinc-300")}
            >
              {v === "grid" ? <LayoutGrid className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
              {v === "grid" ? "All" : "By department"}
            </button>
          ))}
        </div>
      </div>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filter by interest">
        <button onClick={() => p.onInterest("")} data-testid="directory-category-filter-all" className={pill(!p.interest)}>
          All scenes
        </button>
        {INTERESTS.map((it) => (
          <button key={it.id} onClick={() => p.onInterest(it.id)} data-testid={`directory-category-filter-${it.id}`} className={pill(p.interest === it.id)}>
            <img src={it.image} alt="" className="h-6 w-6 rounded-full object-cover" />
            {it.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Department quick filter">
        {DEPARTMENTS.map((d) => (
          <button
            key={d}
            onClick={() => p.onDepartment(p.department === d ? "" : d)}
            data-testid={`directory-dept-pill-${slug(d)}`}
            className={cn("rounded-full px-3 py-1.5 font-display text-xs uppercase transition-colors", p.department === d ? "bg-white text-[#07080c]" : "bg-white/5 text-zinc-300 hover:bg-white/10")}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}
