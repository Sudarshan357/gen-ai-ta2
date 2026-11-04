import { Play, Loader2, AlertTriangle, History, Trash2 } from "lucide-react";
import { PRESET_PROBLEMS } from "../data/presetProblems.js";
import { VOTING_STRATEGIES } from "../hooks/useSelfConsistencyDemo.js";

const CHIP_LABELS = {
  conference: "Conference",
  sheep: "Sheep riddle",
  tennis: "Tennis balls",
  train: "Train speed",
  bakery: "Cupcakes",
  "bat-and-ball": "Bat & ball",
  "hot-dog": "Hot dog",
};

/** Field wrapper: micro-label above, control below — the console's one form rhythm. */
function Field({ label, value, children }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="micro-label">{label}</span>
        {value !== undefined && <span className="font-mono text-[11px] text-charcoal">{value}</span>}
      </div>
      {children}
    </div>
  );
}

/**
 * The run's control surface — always present on the left, the way a
 * runtime's parameters stay visible while the graph executes.
 */
export default function SidebarControls({ demo }) {
  const {
    question,
    setQuestion,
    numSamples,
    setNumSamples,
    temperature,
    setTemperature,
    model,
    setModel,
    availableModels,
    votingStrategy,
    setVotingStrategy,
    adaptive,
    setAdaptive,
    suggestedSamples,
    isProcessing,
    error,
    run,
    history,
    loadFromHistory,
    clearHistoryList,
  } = demo;

  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-hairline bg-surface-card p-4 lg:w-[300px] lg:border-r">
      <div>
        <h2 className="text-[13px] font-semibold text-ink">Control panel</h2>
        <p className="mt-0.5 text-[11px] text-mute">Self-consistency parameters</p>
      </div>

      <Field label="Question">
        <textarea
          rows={4}
          value={question}
          disabled={isProcessing}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="A conference has 240 attendees…"
          className="w-full resize-none rounded-md border border-hairline bg-surface-bone px-3 py-2 text-[13px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ash focus:border-primary/50 disabled:opacity-50"
        />
        <div className="mt-2 flex flex-wrap gap-1">
          {PRESET_PROBLEMS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={isProcessing}
              onClick={() => setQuestion(p.question)}
              className="rounded border border-hairline px-1.5 py-0.5 text-[10px] text-mute transition-colors hover:border-primary/40 hover:text-body disabled:opacity-40"
            >
              {CHIP_LABELS[p.id] ?? p.id}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Model">
        <select
          value={model}
          disabled={isProcessing}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-md border border-hairline bg-surface-bone px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-primary/50 disabled:opacity-50"
        >
          {availableModels.length === 0 && <option value={model}>{model}</option>}
          {availableModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Samples" value={numSamples}>
        <input
          type="range"
          min={2}
          max={9}
          value={numSamples}
          disabled={isProcessing}
          onChange={(e) => setNumSamples(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-primary disabled:opacity-50"
        />
        {suggestedSamples !== numSamples && (
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setNumSamples(suggestedSamples)}
            className="mt-1.5 text-[10px] text-primary hover:underline disabled:opacity-40"
          >
            suggested: {suggestedSamples} for this question
          </button>
        )}
      </Field>

      <Field label="Temperature" value={temperature.toFixed(1)}>
        <input
          type="range"
          min={0.2}
          max={1.3}
          step={0.1}
          value={temperature}
          disabled={isProcessing}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-surface-raised accent-primary disabled:opacity-50"
        />
      </Field>

      <Field label="Voting strategy">
        <div className="flex flex-col gap-1">
          {VOTING_STRATEGIES.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={isProcessing}
              onClick={() => setVotingStrategy(s.id)}
              title={s.description}
              aria-pressed={votingStrategy === s.id}
              className={`rounded border px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors disabled:opacity-40 ${
                votingStrategy === s.id
                  ? "border-primary/50 bg-primary/10 text-ink"
                  : "border-hairline text-mute hover:text-body"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Field>

      <label className="flex cursor-pointer items-start justify-between gap-3">
        <div>
          <span className="text-[12px] font-medium text-body">Adaptive sampling</span>
          <p className="mt-0.5 text-[10px] leading-relaxed text-mute">
            Stop early once agreement is strong.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={adaptive}
          disabled={isProcessing}
          onClick={() => setAdaptive(!adaptive)}
          className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-40 ${
            adaptive ? "border-primary/50 bg-primary/40" : "border-hairline bg-surface-raised"
          }`}
        >
          <span
            className={`absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-ink transition-transform ${
              adaptive ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </label>

      <button type="button" onClick={run} disabled={isProcessing || !question.trim()} className="btn-primary w-full">
        {isProcessing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Running
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5" />
            Run
          </>
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/[0.08] px-3 py-2 text-[11px] leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {history.length > 0 && (
        <div className="border-t border-hairline pt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="micro-label flex items-center gap-1.5">
              <History className="h-3 w-3" />
              Recent runs
            </span>
            <button type="button" onClick={clearHistoryList} className="text-[10px] text-mute hover:text-danger">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-0.5">
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                type="button"
                disabled={isProcessing}
                onClick={() => loadFromHistory(entry)}
                className="flex items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-surface-bone disabled:opacity-40"
              >
                <span className="truncate text-mute">{entry.question}</span>
                <span className="mono-tag shrink-0 text-ash">{entry.winner}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
