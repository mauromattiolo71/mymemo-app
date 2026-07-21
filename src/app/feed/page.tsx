import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";
import LikeButton from "@/components/LikeButton";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_active")
    .eq("id", user.id)
    .single();

  if (!profile?.subscription_active) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Community MyMemo</h1>
        <p className="mb-6 text-neutral-500">
          Per vedere le testimonianze pubbliche e mettere &quot;mi piace&quot;
          serve l&apos;abbonamento community (0,50&nbsp;€/mese).
        </p>
        <Link
          href="/subscribe"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Abbonati per 0,50 € al mese
        </Link>
      </div>
    );
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, created_at, user_id, profiles(display_name)")
    .eq("visibility", "public")
    .eq("moderation_status", "approved")
    .order("created_at", { ascending: false });

  const videoIds = (videos ?? []).map((v) => v.id);

  const { data: likes } = videoIds.length
    ? await supabase.from("likes").select("video_id, user_id").in("video_id", videoIds)
    : { data: [] as { video_id: string; user_id: string }[] };

  const likesByVideo = new Map<string, { count: number; likedByMe: boolean }>();
  for (const like of likes ?? []) {
    const entry = likesByVideo.get(like.video_id) ?? { count: 0, likedByMe: false };
    entry.count += 1;
    if (like.user_id === user.id) entry.likedByMe = true;
    likesByVideo.set(like.video_id, entry);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Community MyMemo</h1>

      {(!videos || videos.length === 0) && (
        <p className="text-neutral-500">
          Nessuna testimonianza pubblica ancora disponibile.
        </p>
      )}

      <div className="flex flex-col gap-8">
        {videos?.map((video) => {
          const likeInfo = likesByVideo.get(video.id) ?? {
            count: 0,
            likedByMe: false,
          };
          const authorName =
            (video.profiles as unknown as { display_name: string | null } | null)
              ?.display_name ?? "Un utente MyMemo";

          return (
            <div key={video.id} className="flex flex-col gap-3">
              <VideoPlayer videoId={video.id} />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{video.title || "Senza titolo"}</p>
                  <p className="text-xs text-neutral-500">{authorName}</p>
                </div>
                <LikeButton
                  videoId={video.id}
                  userId={user.id}
                  initialLiked={likeInfo.likedByMe}
                  initialCount={likeInfo.count}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
