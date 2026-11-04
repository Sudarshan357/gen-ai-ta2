import { useCallback, useEffect, useState } from "react";
import {
  runSelfConsistency,
  computeVotes,
  judgeResultToVote,
  judgeBestPath as judgeBestPathRequest,
  explainDisagreement as explainDisagreementRequest,
  gradeAnswer as gradeAnswerRequest,
  fetchModels,
  normalizeAnswer,
  buildShareUrl,
  parseShareFromLocation,
  runToMarkdown,
  downloadTextFile,
  loadHistory,
  pushHistory,
  clearHistory,
  suggestSampleCount,
} from "../lib/selfConsistencyEngine.js";
import { DEFAULT_QUESTION, findKnownAnswer } from "../data/presetProblems.js";

export const STAGES = {
  IDLE: "idle",
  SENDING: "sending",
  GENERATING: "generating",
  REVEALING: "revealing",
  VOTING: "voting",
  DONE: "done",
};

export const STAGE_LABELS = {
  [STAGES.SENDING]: "Sending your question to the model…",
  [STAGES.GENERATING]: "Running a single prompt and independent samples…",
  [STAGES.REVEALING]: "Extracting the final answer from each path…",
  [STAGES.VOTING]: "Counting the votes…",
};

export const VOTING_STRATEGIES = [
  { id: "majority", label: "Majority Vote", description: "Every sample counts equally — the most common answer wins." },
  { id: "confidence", label: "Confidence-Weighted", description: "Each sample's own self-reported confidence weights its vote." },
  { id: "judge", label: "LLM Judge", description: "A separate model call reads all paths and picks the soundest one." },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Drives the demo: ask the question once as a single prompt and
 * `numSamples` times as self-consistency, show each reasoning path, vote
 * (by the chosen strategy), then optionally grade, explain disagreement,
 * export, share, and save to history.
 */
export function useSelfConsistencyDemo() {
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [numSamples, setNumSamples] = useState(5);
  const [temperature, setTemperature] = useState(0.9);
  const [model, setModel] = useState("openai/gpt-oss-20b");
  const [availableModels, setAvailableModels] = useState([]);
  const [votingStrategy, setVotingStrategy] = useState("majority");
  const [adaptive, setAdaptive] = useState(false);

  const [stage, setStage] = useState(STAGES.IDLE);
  const [single, setSingle] = useState(null);
  const [paths, setPaths] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [voteResult, setVoteResult] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  const [correctness, setCorrectness] = useState(null); // { status: 'correct'|'incorrect'|'unverified'|'checking', source, note }
  const [disagreement, setDisagreement] = useState(null); // { loading, explanation, error }
  const [history, setHistory] = useState(() => loadHistory());
  const [shareUrl, setShareUrl] = useState(null);

  // One row per completed step of the run, in order — what the timeline
  // panel renders. Appended as the run actually reaches each step rather
  // than derived afterwards, so the log reflects real sequence and timing.
  const [events, setEvents] = useState([]);

  const isProcessing = stage !== STAGES.IDLE && stage !== STAGES.DONE;

  const logEvent = useCallback((label, status, detail) => {
    setEvents((prev) => [...prev, { id: `${prev.length}-${label}`, label, status, detail, at: Date.now() }]);
  }, []);

  // Load the model list once; fall back to the current default silently if
  // the request fails (the run itself will surface a clearer error).
  useEffect(() => {
    fetchModels()
      .then(({ models, defaultModel }) => {
        setAvailableModels(models);
        if (defaultModel) setModel((m) => m || defaultModel);
      })
      .catch(() => {});
  }, []);

  // A shared link only prefills the form — it never auto-runs a request on
  // page load, so opening a link never spends someone else's API quota.
  useEffect(() => {
    const shared = parseShareFromLocation();
    if (!shared) return;
    if (shared.question) setQuestion(shared.question);
    if (shared.numSamples) setNumSamples(shared.numSamples);
    if (typeof shared.temperature === "number") setTemperature(shared.temperature);
    if (shared.model) setModel(shared.model);
    if (shared.votingStrategy) setVotingStrategy(shared.votingStrategy);
    if (typeof shared.adaptive === "boolean") setAdaptive(shared.adaptive);
  }, []);

  const suggestedSamples = suggestSampleCount(question);

  const checkCorrectness = useCallback(async (q, winnerAnswer, usedModel) => {
    const known = findKnownAnswer(q);
    if (known !== null) {
      const isCorrect = normalizeAnswer(winnerAnswer) === normalizeAnswer(known);
      setCorrectness({ status: isCorrect ? "correct" : "incorrect", source: "known", expected: known });
      return;
    }

    setCorrectness({ status: "checking", source: "llm" });
    try {
      const result = await gradeAnswerRequest({ question: q, answer: winnerAnswer, model: usedModel });
      if (result.correct === null) {
        setCorrectness({ status: "unverified", source: "llm" });
      } else {
        setCorrectness({
          status: result.correct ? "correct" : "incorrect",
          source: "llm",
          expected: result.expected,
          note: result.note,
        });
      }
    } catch {
      setCorrectness({ status: "unverified", source: "llm" });
    }
  }, []);

  const run = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isProcessing) return;

    setSingle(null);
    setPaths([]);
    setVisibleCount(0);
    setVoteResult(null);
    setMeta(null);
    setError(null);
    setCorrectness(null);
    setDisagreement(null);
    setShareUrl(null);
    setEvents([]);

    setStage(STAGES.SENDING);
    logEvent("READ QUESTION", "completed", `${adaptive ? "adaptive" : "fixed"} · ${numSamples} samples`);
    await wait(500);

    setStage(STAGES.GENERATING);
    logEvent("DISPATCH SAMPLES", "routed", `${model} · temp ${temperature}`);
    let result;
    try {
      result = await runSelfConsistency({ question: trimmed, numSamples, temperature, model, adaptive });
    } catch (err) {
      setError(err.message || "Something went wrong while generating reasoning paths.");
      logEvent("SAMPLING FAILED", "failed", err.message);
      setStage(STAGES.IDLE);
      return;
    }
    setSingle(result.single);
    setPaths(result.paths);
    setMeta(result.meta);
    logEvent("BASELINE (single prompt)", "completed", `answer ${result.single.answer}`);
    if (result.meta?.failedCount > 0) {
      logEvent("SAMPLES DROPPED", "issue", `${result.meta.failedCount} of ${result.meta.requested} failed`);
    }

    setStage(STAGES.REVEALING);
    for (let i = 1; i <= result.paths.length; i++) {
      setVisibleCount(i);
      const p = result.paths[i - 1];
      logEvent(
        `PATH ${p.pathNumber} EXTRACTED`,
        "completed",
        `answer ${p.answer}${typeof p.confidence === "number" ? ` · conf ${p.confidence}` : ""}`
      );
      await wait(350);
    }

    setStage(STAGES.VOTING);
    logEvent("TALLY VOTES", "routed", votingStrategy);
    await wait(700);

    let vote;
    if (votingStrategy === "judge") {
      try {
        const judgeResponse = await judgeBestPathRequest({ question: trimmed, paths: result.paths, model });
        vote = judgeResultToVote(judgeResponse, result.paths);
        logEvent("LLM JUDGE", "completed", `picked path ${judgeResponse.pathNumber ?? "?"}`);
      } catch (err) {
        // Judge call failed — fall back to majority so the run still finishes.
        vote = { ...computeVotes(result.paths, "majority"), judgeError: err.message };
        logEvent("LLM JUDGE", "issue", "failed — fell back to majority");
      }
    } else {
      vote = computeVotes(result.paths, votingStrategy);
    }
    setVoteResult(vote);
    if (vote.entries.length > 1) {
      logEvent("DISAGREEMENT DETECTED", "issue", `${vote.entries.length} distinct answers`);
    }
    await wait(600);

    setStage(STAGES.DONE);
    logEvent("CONSENSUS", "completed", `${vote.winner} · ${vote.confidence}% agreement`);

    checkCorrectness(trimmed, vote.winner, model);
    setHistory(
      pushHistory({
        question: trimmed,
        numSamples: result.paths.length,
        requested: numSamples,
        temperature,
        model,
        votingStrategy,
        adaptive,
        winner: vote.winner,
        confidence: vote.confidence,
        failedCount: result.meta?.failedCount || 0,
      })
    );
  }, [question, numSamples, temperature, model, votingStrategy, adaptive, isProcessing, checkCorrectness, logEvent]);

  const runExplainDisagreement = useCallback(async () => {
    if (!paths.length || !voteResult) return;
    setDisagreement({ loading: true, explanation: null, error: null });
    try {
      const result = await explainDisagreementRequest({ question, paths, model });
      setDisagreement({ loading: false, explanation: result.explanation, error: null });
    } catch (err) {
      setDisagreement({ loading: false, explanation: null, error: err.message });
    }
  }, [question, paths, voteResult, model]);

  const getShareUrl = useCallback(() => {
    const url = buildShareUrl({ question, numSamples, temperature, model, votingStrategy, adaptive });
    setShareUrl(url);
    return url;
  }, [question, numSamples, temperature, model, votingStrategy, adaptive]);

  const exportMarkdown = useCallback(() => {
    const md = runToMarkdown({ question, single, paths, voteResult, meta });
    downloadTextFile(`consistai-run-${Date.now()}.md`, md, "text/markdown");
  }, [question, single, paths, voteResult, meta]);

  const exportJson = useCallback(() => {
    const json = JSON.stringify({ question, single, paths, voteResult, meta }, null, 2);
    downloadTextFile(`consistai-run-${Date.now()}.json`, json, "application/json");
  }, [question, single, paths, voteResult, meta]);

  const loadFromHistory = useCallback((entry) => {
    setQuestion(entry.question);
    setNumSamples(entry.requested || entry.numSamples);
    setTemperature(entry.temperature);
    setModel(entry.model);
    setVotingStrategy(entry.votingStrategy);
    setAdaptive(Boolean(entry.adaptive));
  }, []);

  const clearHistoryList = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return {
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

    stage,
    isProcessing,
    single,
    paths,
    visibleCount,
    voteResult,
    meta,
    error,
    run,
    events,

    correctness,
    disagreement,
    runExplainDisagreement,

    shareUrl,
    getShareUrl,
    exportMarkdown,
    exportJson,

    history,
    loadFromHistory,
    clearHistoryList,
  };
}
