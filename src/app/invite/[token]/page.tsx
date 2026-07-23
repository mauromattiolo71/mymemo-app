import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: share } = await admin
    .from("shares")
    .select("id, status, recipient_user_id, profiles:owner_id(display_name)")
    .eq("invite_token", token)
    .single();

  if (!share) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="text-sm text-muted">This invite link is not valid.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const senderName =
    (share.profiles as unknown as { display_name: string | null } | null)?.display_name ??
    "Someone";

  if (!user) {
    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
          You've been invited
        </p>
        <h1 className="mb-3 font-serif text-3xl text-foreground">
          {senderName} shared a message with you
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-muted">
          Log in or create a free account to watch it.
        </p>
        <Link
          href={`/login?next=/invite/${token}`}
          className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
        >
          Log in to watch
        </Link>
      </div>
    );
  }

  if (share.status === "claimed" && share.recipient_user_id !== user.id) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16 text-center">
        <p className="text-sm text-muted">This invite has already been used by someone else.</p>
      </div>
    );
  }

  if (share.status === "pending") {
    await admin
      .from("shares")
      .update({ recipient_user_id: user.id, status: "claimed" })
      .eq("id", share.id);
  }

  redirect("/received");
}
