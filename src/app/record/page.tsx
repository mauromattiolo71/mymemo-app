import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Recorder from "@/components/Recorder";

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Il tuo messaggio</h1>
      <p className="mb-6 text-sm text-neutral-500">
        Registra un video per i tuoi cari. Non è un testamento legale: è un
        messaggio personale che resterà per sempre.
      </p>
      <Recorder userId={user.id} />
    </div>
  );
}
