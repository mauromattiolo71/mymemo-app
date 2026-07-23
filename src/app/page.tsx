import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 20%, var(--accent) 0%, transparent 70%)",
          opacity: 0.12,
        }}
      />

      <p className="mb-4 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
        MyMemo
      </p>
      <h1 className="max-w-2xl font-serif text-5xl leading-tight text-foreground sm:text-6xl">
        A Voice Into Eternity
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
        Record a video for your loved ones. Give them a personal message
        that will last forever.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover"
        >
          Start for free
        </Link>
        <Link
          href="/feed"
          className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Shout It to the World
        </Link>
      </div>

      <div className="mt-20 grid max-w-2xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-accent">01</p>
          <p className="mt-2 text-sm text-muted">
            Record a personal video, for free, in just a few minutes.
          </p>
        </div>
        <div>
          <p className="font-serif text-2xl text-accent">02</p>
          <p className="mt-2 text-sm text-muted">
            You decide who can see it: only you, your loved ones, or the
            whole world.
          </p>
        </div>
        <div>
          <p className="font-serif text-2xl text-accent">03</p>
          <p className="mt-2 text-sm text-muted">
            It stays forever, like a memory that keeps speaking.
          </p>
        </div>
      </div>
    </div>
  );
}
