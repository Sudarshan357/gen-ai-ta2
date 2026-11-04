// Example questions for the "Try:" quick-select chips in QuestionInput.
// Reasoning paths for these (and any other question) are now generated live
// by the backend — see server/selfConsistency.js. Each preset also carries
// its known correct `answer` so the UI can check a run against it instantly
// (exact match, after normalization — see normalizeAnswer in
// src/lib/selfConsistencyEngine.js) instead of needing an extra LLM call
// just to grade a question we already know the answer to. Custom,
// user-typed questions have no `answer` and fall back to the /api/grade
// LLM-as-judge endpoint instead.
export const PRESET_PROBLEMS = [
  {
    id: "conference",
    question:
      "A conference has 240 attendees. On day one, 3/8 of them left early. Of the attendees who remained, 1/5 signed up for a workshop the next day. How many attendees signed up for the workshop?",
    answer: "30",
  },
  {
    id: "sheep",
    question: "A farmer has 17 sheep. All but 9 die. How many sheep are left?",
    answer: "9",
  },
  {
    id: "tennis",
    question:
      "Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?",
    answer: "11",
  },
  {
    id: "train",
    question:
      "If a train travels 60 miles in 1.5 hours, what is its average speed in miles per hour?",
    answer: "40",
  },
  {
    id: "bakery",
    question:
      "A bakery had 24 cupcakes. They sold 3/4 of them in the morning and 1/6 of the remainder in the afternoon. How many cupcakes are left?",
    answer: "5",
  },
  {
    id: "bat-and-ball",
    question:
      "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost, in dollars?",
    answer: "0.05",
  },
  {
    // Opinion question with no single correct answer, so it has no `answer`
    // and the votes usually split.
    id: "hot-dog",
    question: "Is a hot dog a sandwich? Answer yes or no.",
  },
];

export const DEFAULT_QUESTION = PRESET_PROBLEMS[0].question;

/** Looks up the known answer for a preset question, if this is one — returns null for custom questions. */
export function findKnownAnswer(question) {
  const match = PRESET_PROBLEMS.find((p) => p.question.trim() === question.trim());
  return match?.answer ?? null;
}
