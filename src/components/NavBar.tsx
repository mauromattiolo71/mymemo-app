import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export default async function NavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="border-b border-border bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-serif text-lg italic tracking-wide text-foreground"
        >
          MyMemo
        </Link>
        <div className="flex items-center gap-5 text-sm text-muted">
          {user ? (
            <>
              <Link href="/record" className="transition-colors hover:text-foreground">
                Record
              </Link>
              <Link href="/received" className="transition-colors hover:text-foreground">
                Received
              </Link>
              <Link href="/feed" className="transition-colors hover:text-foreground">
                Shout It to the World
              </Link>
              {isAdminEmail(user.email) && (
                <Link href="/admin" className="transition-colors hover:text-foreground">
                  Admin
                </Link>
              )}
              <Link
                href="/subscribe"
                className="rounded-full bg-accent px-4 py-1.5 font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
              >
                Subscribe
              </Link>
              <form action="/auth/logout" method="post">
                <button type="submit" className="transition-colors hover:text-foreground">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-accent px-4 py-1.5 font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
