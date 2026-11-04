// A small in-memory fixed-window rate limiter for the Groq-calling routes.
// This is a per-process limiter, not a distributed one — fine for local dev
// and a single long-lived Node process (`npm start`), and still useful as a
// basic guard on Vercel even though each serverless invocation may get a
// cold instance (so the real backstop against abuse there is Groq's own
// per-key rate limit, not this).
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map(); // key -> array of timestamps within the current window

function keyFor(req) {
  return req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

/** Express-style middleware: 429s once a client exceeds the per-minute budget. */
export function rateLimit(req, res, next) {
  const key = keyFor(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const recent = (hits.get(key) || []).filter((t) => t > windowStart);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: `Too many requests from this client (${MAX_REQUESTS_PER_WINDOW}/min limit). Please wait a moment and try again.`,
    });
    return;
  }

  recent.push(now);
  hits.set(key, recent);
  next();
}

/** Same check, for Vercel's (req, res) handler signature — returns true if the request should be blocked. */
export function isRateLimited(req, res) {
  const key = keyFor(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const recent = (hits.get(key) || []).filter((t) => t > windowStart);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: `Too many requests from this client (${MAX_REQUESTS_PER_WINDOW}/min limit). Please wait a moment and try again.`,
    });
    return true;
  }

  recent.push(now);
  hits.set(key, recent);
  return false;
}
