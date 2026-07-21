import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Client "normale": la RLS decide se questo utente puo' vedere il video
  // (proprietario, oppure pubblico+approvato+abbonato).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { data: video, error } = await supabase
    .from("videos")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (error || !video) {
    return NextResponse.json({ error: "Video non trovato o accesso negato" }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("videos")
    .createSignedUrl(video.storage_path, 60);

  if (signError || !signed) {
    return NextResponse.json({ error: "Impossibile generare il link" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
