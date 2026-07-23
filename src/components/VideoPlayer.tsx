"use client";

import { useState } from "react";

export default function VideoPlayer({ videoId }: { videoId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/videos/${videoId}/signed-url`);
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setUrl(data.url);
  }

  if (url) {
    return <video src={url} controls className="aspect-video w-full bg-[#120f0a]" />;
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-surface-muted">
      <button
        onClick={load}
        disabled={loading}
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Loading..." : "Watch video"}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
