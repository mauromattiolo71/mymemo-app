import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "@/components/VideoPlayer";

export default async function ReceivedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: shares } = await supabase
    .from("shares")
    .select("id, created_at, videos(id, title, user_id, profiles(display_name))")
    .eq("recipient_user_id", user.id)
    .eq("status", "claimed")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
        For you
      </p>
      <h1 className="mb-8 font-serif text-3xl text-foreground">
        Received Messages
      </h1>

      {(!shares || shares.length === 0) && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          Nobody has shared a message with you yet.
        </p>
      )}

      <div className="flex flex-col gap-10">
        {shares?.map((share) => {
          const video = share.videos as unknown as {
            id: string;
            title: string | null;
            profiles: { display_name: string | null } | null;
          } | null;

          if (!video) return null;

          return (
            <div
              key={share.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <VideoPlayer videoId={video.id} />
              <div className="px-4 py-4">
                <p className="font-serif text-lg text-foreground">
                  {video.title || "Untitled"}
                </p>
                <p className="text-xs text-muted">
                  From {video.profiles?.display_name || "a MyMemo user"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
