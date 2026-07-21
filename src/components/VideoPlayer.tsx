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
      setError(data.error ?? "Errore");
      return;
    }
    setUrl(data.url);
  }

  if (url) {
    return (
      <video src={url} controls className="aspect-video w-full rounded-lg bg-black" />
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
      <button
        onClick={load}
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Caricamento..." : "Guarda il video"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
