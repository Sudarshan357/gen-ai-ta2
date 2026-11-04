import { useState } from "react";
import { Link2, FileJson, FileText, Check } from "lucide-react";

export default function ShareExportBar({ getShareUrl, exportMarkdown, exportJson }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the URL is still in state if we ever want to show it inline
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2.5">
      <button type="button" onClick={copyLink} className="btn-secondary px-4 py-2 text-xs">
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? "Link copied" : "Copy share link"}
      </button>
      <button type="button" onClick={exportMarkdown} className="btn-secondary px-4 py-2 text-xs">
        <FileText className="h-3.5 w-3.5" />
        Export Markdown
      </button>
      <button type="button" onClick={exportJson} className="btn-secondary px-4 py-2 text-xs">
        <FileJson className="h-3.5 w-3.5" />
        Export JSON
      </button>
    </div>
  );
}
