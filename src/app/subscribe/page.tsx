"use client";

import { useState } from "react";

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.url) {
      setError(data.error ?? "Something went wrong while starting checkout");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <p className="mb-2 font-serif text-sm italic tracking-[0.2em] text-accent uppercase">
        Subscription
      </p>
      <h1 className="mb-3 font-serif text-3xl text-foreground">
        MyMemo Community
      </h1>
      <p className="mb-8 text-sm leading-relaxed text-muted">
        €0.50 a month to watch public testimonials from other MyMemo users
        and leave a &quot;like&quot;.
      </p>
      <button
        onClick={subscribe}
        disabled={loading}
        className="rounded-full bg-accent px-7 py-3 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        {loading ? "Please wait..." : "Subscribe for €0.50/month"}
      </button>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}
