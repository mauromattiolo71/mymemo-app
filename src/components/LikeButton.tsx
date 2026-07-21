"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LikeButton({
  videoId,
  userId,
  initialLiked,
  initialCount,
}: {
  videoId: string;
  userId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const supabase = createClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("video_id", videoId)
        .eq("user_id", userId);
      if (!error) {
        setLiked(false);
        setCount((c) => c - 1);
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ video_id: videoId, user_id: userId });
      if (!error) {
        setLiked(true);
        setCount((c) => c + 1);
      }
    }
    setBusy(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        liked
          ? "border-red-600 bg-red-50 text-red-600 dark:bg-red-950"
          : "border-neutral-300 dark:border-neutral-700"
      }`}
    >
      <span>{liked ? "❤" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
