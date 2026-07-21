import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Usa la Service Role Key: bypassa la RLS. Solo per codice server-side
// (webhook Stripe, generazione signed URL). Non importare mai in un Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
