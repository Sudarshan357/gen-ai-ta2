import { AVAILABLE_MODELS, MODEL } from "../server/config.js";

export default function handler(req, res) {
  res.status(200).json({ models: AVAILABLE_MODELS, defaultModel: MODEL });
}
