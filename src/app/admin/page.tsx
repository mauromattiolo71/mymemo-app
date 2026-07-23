import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import AdminVideoRow from "@/components/AdminVideoRow";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdminEmail(user.email)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-muted">You are not authorized to view this page.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: videos } = await admin
    .from("videos")
    .select("id, title, moderation_status, created_at, profiles(display_name)")
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
        Admin
      </p>
      <h1 className="mb-8 font-serif text-3xl text-foreground">
        Moderate public messages
      </h1>

      {(!videos || videos.length === 0) && (
        <p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">
          No public messages yet.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {videos?.map((video) => (
          <AdminVideoRow
            key={video.id}
            id={video.id}
            title={video.title}
            authorName={
              (video.profiles as unknown as { display_name: string | null } | null)
                ?.display_name ?? "Unknown user"
            }
            moderationStatus={video.moderation_status}
          />
        ))}
      </div>
    </div>
  );
}
