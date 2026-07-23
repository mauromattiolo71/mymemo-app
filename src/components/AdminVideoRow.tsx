"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  id: string;
  title: string | null;
  authorName: string;
  moderationStatus: "pending" | "approved" | "rejected";
};

export default function AdminVideoRow({ id, title, authorName, moderationStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/videos/${id}/moderate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <VideoPlayer videoId={id} />
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="font-serif text-lg text-foreground">{title || "Untitled"}</p>
          <p className="text-xs text-muted">
            {authorName} · {moderationStatus}
          </p>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatus("approved")}
            disabled={busy || moderationStatus === "approved"}
            className="rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            Approve
          </button>
          <button
            onClick={() => setStatus("rejected")}
            disabled={busy || moderationStatus === "rejected"}
            className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}
