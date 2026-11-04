import { Clock } from "lucide-react";

/**
 * Real token counts from this exact run — pulled straight from Groq's
 * response (see server/groqClient.js), not estimated. Deliberately shows
 * no dollar cost: Groq's free tier has no published per-token price, and
 * this app doesn't show numbers it can't back with a real measurement.
 */
export default function ResourceUsagePanel({ meta, pathCount }) {
  if (!meta) return null;

  const { usageTotal, requested, failedCount, model, adaptive, stoppedEarly } = meta;

  return (
    <div className="panel">
      <div className="flex items-center justify-between border-b border-hairline px-4 py-2.5">
        <span className="micro-label">Resource usage</span>
        <span className="font-mono text-[10px] text-ash">{model}</span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-hairline sm:grid-cols-4 sm:divide-y-0">
        <Stat label="prompt tok" value={usageTotal?.promptTokens ?? "n/a"} />
        <Stat label="completion tok" value={usageTotal?.completionTokens ?? "n/a"} />
        <Stat label="total tok" value={usageTotal?.totalTokens ?? "n/a"} />
        <Stat label="calls" value={pathCount + 1} />
      </div>

      {(adaptive || failedCount > 0) && (
        <div className="flex flex-col gap-1.5 border-t border-hairline px-4 py-3 text-[11px]">
          {adaptive && (
            <div className="flex items-center gap-1.5 text-mute">
              <Clock className="h-3 w-3 text-info" />
              Adaptive: used {pathCount} of {requested} samples
              {stoppedEarly ? " — stopped early on strong agreement" : ""}.
            </div>
          )}
          {failedCount > 0 && (
            <div className="text-warning">
              {failedCount} sample{failedCount > 1 ? "s" : ""} failed and were dropped from the vote.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="px-4 py-3">
      <p className="mono-tag text-base font-semibold text-ink">{value}</p>
      <p className="micro-label mt-0.5">{label}</p>
    </div>
  );
}
