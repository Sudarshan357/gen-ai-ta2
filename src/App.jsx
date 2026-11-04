import { useState } from "react";
import TopBar from "./components/TopBar.jsx";
import SidebarControls from "./components/SidebarControls.jsx";
import StageView from "./components/StageView.jsx";
import MethodView from "./components/MethodView.jsx";
import RunTimeline from "./components/RunTimeline.jsx";
import { useSelfConsistencyDemo, STAGES } from "./hooks/useSelfConsistencyDemo.js";
import { useTheme } from "./hooks/useTheme.js";

const STATUS_BY_STAGE = {
  [STAGES.IDLE]: { label: "idle", tone: "bg-stone" },
  [STAGES.SENDING]: { label: "running", tone: "bg-info animate-pulse-node" },
  [STAGES.GENERATING]: { label: "sampling", tone: "bg-info animate-pulse-node" },
  [STAGES.REVEALING]: { label: "extracting", tone: "bg-info animate-pulse-node" },
  [STAGES.VOTING]: { label: "voting", tone: "bg-info animate-pulse-node" },
  [STAGES.DONE]: { label: "finished", tone: "bg-success" },
};

/**
 * Application shell: controls on the left, the execution view in the
 * middle, the run log on the right — fixed regions, so the tool never
 * scrolls away from under you.
 */
export default function App() {
  const demo = useSelfConsistencyDemo();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState("console");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <TopBar
        view={view}
        onViewChange={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
        status={STATUS_BY_STAGE[demo.stage]}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {view === "console" ? (
          <>
            <SidebarControls demo={demo} />
            <StageView demo={demo} />
            <RunTimeline events={demo.events} stage={demo.stage} voteResult={demo.voteResult} />
          </>
        ) : (
          <MethodView />
        )}
      </main>
    </div>
  );
}
