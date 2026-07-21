import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Link href="/" className="font-semibold">
        MyMemo
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/record">Registra</Link>
            <Link href="/feed">Community</Link>
            <Link href="/subscribe">Abbonati</Link>
            <form action="/auth/logout" method="post">
              <button type="submit" className="text-neutral-500">
                Esci
              </button>
            </form>
          </>
        ) : (
          <Link href="/login">Accedi</Link>
        )}
      </div>
    </nav>
  );
}
