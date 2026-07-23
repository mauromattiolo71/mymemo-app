import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Recorder from "@/components/Recorder";
import VideoCard from "@/components/VideoCard";

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, visibility, moderation_status, storage_path, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      {videos && videos.length > 0 && (
        <div className="mb-12">
          <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
            Your messages
          </p>
          <h2 className="mb-6 font-serif text-2xl text-foreground">
            Published
          </h2>
          <div className="flex flex-col gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                visibility={video.visibility}
                moderationStatus={video.moderation_status}
                storagePath={video.storage_path}
              />
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
        Your message
      </p>
      <h1 className="mb-2 font-serif text-3xl text-foreground">
        Leave your voice
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-muted">
        Record a video for your loved ones. This is not a legal will: it is
        a personal message that will last forever.
      </p>
      <Recorder userId={user.id} />
    </div>
  );
}
