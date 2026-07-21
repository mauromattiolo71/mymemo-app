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
      setError(data.error ?? "Errore durante la creazione del pagamento");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="mb-2 text-2xl font-semibold">Abbonamento Community</h1>
      <p className="mb-6 text-neutral-500">
        0,50 € al mese per vedere le testimonianze pubbliche di altri utenti
        MyMemo e lasciare un &quot;mi piace&quot;.
      </p>
      <button
        onClick={subscribe}
        disabled={loading}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {loading ? "Attendere..." : "Abbonati per 0,50 €/mese"}
      </button>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
