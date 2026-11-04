/** Maps a Groq API error to a clean HTTP status + user-facing message. */
export function friendlyError(err) {
  if (err?.status === 401) {
    return {
      status: 500,
      message:
        "The server is missing a valid GROQ_API_KEY. Set it as an environment variable (a .env file locally, or your deployment platform's project settings) and restart/redeploy.",
    };
  }
  if (err?.status === 429) {
    return { status: 429, message: "The Groq API is rate-limiting requests. Please wait a moment and try again." };
  }
  if (err?.status >= 400 && err?.status < 500) {
    return { status: 502, message: `The Groq API rejected the request: ${err.message}` };
  }
  return { status: 502, message: "Failed to reach the Groq API. Please try again." };
}
