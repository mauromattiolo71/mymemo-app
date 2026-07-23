import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendInviteSms } from "@/lib/twilio";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: shares, error } = await supabase
    .from("shares")
    .select("id, recipient_phone, status, created_at")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shares });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { videoId, phone } = await request.json();
  if (!videoId || !phone) {
    return NextResponse.json({ error: "Missing videoId or phone" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: share, error } = await supabase
    .from("shares")
    .insert({ video_id: videoId, owner_id: user.id, recipient_phone: phone })
    .select("id, invite_token")
    .single();

  if (error || !share) {
    return NextResponse.json(
      { error: error?.message ?? "Could not create the share" },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const inviteUrl = `${appUrl}/invite/${share.invite_token}`;
  const senderName = profile?.display_name || "Someone";

  try {
    await sendInviteSms(phone, senderName, inviteUrl);
  } catch (smsError) {
    return NextResponse.json(
      { error: `Share created, but the SMS could not be sent: ${(smsError as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
