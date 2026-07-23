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
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
          Community
        </p>
        <h1 className="mb-3 font-serif text-3xl text-foreground">
          Listen to other voices
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-muted">
          Subscribe to the community (€0.50/month) to watch public
          testimonials and leave a &quot;like&quot;.
        </p>
        <Link
          href="/subscribe"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
        >
          Subscribe for €0.50/month
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
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
        Community
      </p>
      <h1 className="mb-8 font-serif text-3xl text-foreground">
        Shared voices
      </h1>

      {(!videos || videos.length === 0) && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          No public testimonials yet.
        </p>
      )}

      <div className="flex flex-col gap-10">
        {videos?.map((video) => {
          const likeInfo = likesByVideo.get(video.id) ?? {
            count: 0,
            likedByMe: false,
          };
          const authorName =
            (video.profiles as unknown as { display_name: string | null } | null)
              ?.display_name ?? "A MyMemo user";

          return (
            <div
              key={video.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <VideoPlayer videoId={video.id} />
              <div className="flex items-center justify-between px-4 py-4">
                <div>
                  <p className="font-serif text-lg text-foreground">
                    {video.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted">{authorName}</p>
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
