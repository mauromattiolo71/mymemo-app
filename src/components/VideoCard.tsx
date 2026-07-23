"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/VideoPlayer";

type Props = {
  id: string;
  title: string | null;
  visibility: "private" | "public";
  moderationStatus: "pending" | "approved" | "rejected";
  storagePath: string;
};

export default function VideoCard({
  id,
  title,
  visibility,
  moderationStatus,
  storagePath,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("Delete this message? This cannot be undone.")) return;

    setDeleting(true);
    setError(null);

    const { error: storageError } = await supabase.storage
      .from("videos")
      .remove([storagePath]);

    if (storageError) {
      setError(storageError.message);
      setDeleting(false);
      return;
    }

    const { error: dbError } = await supabase.from("videos").delete().eq("id", id);

    if (dbError) {
      setError(dbError.message);
      setDeleting(false);
      return;
    }

    router.refresh();
  }

  const visibilityLabel = visibility === "public" ? "Public" : "Private";
  const statusLabel =
    visibility === "public"
      ? moderationStatus === "approved"
        ? "Approved"
        : moderationStatus === "rejected"
          ? "Rejected"
          : "Pending review"
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <VideoPlayer videoId={id} />
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="font-serif text-lg text-foreground">{title || "Untitled"}</p>
          <p className="text-xs text-muted">
            {visibilityLabel}
            {statusLabel ? ` · ${statusLabel}` : ""}
          </p>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
