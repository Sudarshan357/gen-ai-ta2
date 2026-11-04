import { GitBranch, Sun, Moon, BookOpen, Terminal } from "lucide-react";

const VIEWS = [
  { id: "console", label: "Console", icon: Terminal },
  { id: "method", label: "Method", icon: BookOpen },
];

/**
 * A thin application bar, not a site nav: identity on the left, the two
 * views in the middle, runtime status on the right.
 */
export default function TopBar({ view, onViewChange, theme, onToggleTheme, status }) {
  const isLight = theme === "light";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-hairline bg-surface-card px-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 text-primary">
          <GitBranch className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <span className="text-[13px] font-semibold tracking-tight text-ink">ConsistAI</span>
        <span className="micro-label hidden sm:inline">self-consistency runtime</span>
      </div>

      <nav className="flex items-center gap-1 rounded-md border border-hairline bg-surface-bone p-0.5">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onViewChange(v.id)}
            aria-pressed={view === v.id}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              view === v.id ? "bg-surface-raised text-ink" : "text-mute hover:text-body"
            }`}
          >
            <v.icon className="h-3.5 w-3.5" />
            {v.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {status && (
          <span className="hidden items-center gap-1.5 md:inline-flex">
            <span className={`h-1.5 w-1.5 rounded-full ${status.tone}`} />
            <span className="micro-label">{status.label}</span>
          </span>
        )}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isLight ? "Switch to dark" : "Switch to light"}
          title={isLight ? "Switch to dark" : "Switch to light"}
          className="btn-ghost h-7 w-7 p-0"
        >
          {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
}
