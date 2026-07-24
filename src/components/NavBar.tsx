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
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-serif text-lg italic tracking-wide text-foreground"
          >
            MyMemo
          </Link>

          {user ? (
            <div className="flex items-center gap-4 text-sm text-muted">
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
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
            >
              Log in
            </Link>
          )}
        </div>

        {user && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <Link href="/record" className="transition-colors hover:text-foreground">
              Record
            </Link>
            <Link href="/received" className="transition-colors hover:text-foreground">
              Received
            </Link>
            <Link
              href="/feed"
              title="Shout It to the World"
              className="transition-colors hover:text-foreground"
            >
              Shout
            </Link>
            {isAdminEmail(user.email) && (
              <Link href="/admin" className="transition-colors hover:text-foreground">
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
