import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Regular client: RLS decides whether this user can see the video
  // (owner, or public+approved+subscribed). The admin bypasses RLS so
  // pending/unapproved videos can be previewed for moderation.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const queryClient = isAdminEmail(user.email) ? createAdminClient() : supabase;

  const { data: video, error } = await queryClient
    .from("videos")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video not found or access denied" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("videos")
    .createSignedUrl(video.storage_path, 60);

  if (signError || !signed) {
    return NextResponse.json({ error: "Unable to generate the link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
