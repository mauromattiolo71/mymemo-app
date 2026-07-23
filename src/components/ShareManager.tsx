"use client";

import { useEffect, useState } from "react";

type Share = {
  id: string;
  recipient_phone: string;
  status: "pending" | "claimed";
  created_at: string;
};

export default function ShareManager({ videoId }: { videoId: string }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function loadShares() {
    const res = await fetch(`/api/shares?videoId=${videoId}`);
    if (res.ok) {
      const data = await res.json();
      setShares(data.shares ?? []);
    }
    setLoaded(true);
  }

  useEffect(() => {
    loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  async function sendInvite() {
    if (!phone.trim()) return;
    setSending(true);
    setStatus(null);
    const res = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, phone: phone.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      setStatus(data.error ?? "Something went wrong");
      return;
    }
    setPhone("");
    setStatus("Invite sent.");
    loadShares();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-muted p-4">
      <p className="text-sm font-medium text-foreground">Share With Your Loved Ones</p>

      {loaded && shares.length > 0 && (
        <ul className="flex flex-col gap-1">
          {shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-xs text-muted">
              <span>{s.recipient_phone}</span>
              <span>{s.status === "claimed" ? "Viewed" : "Invite sent"}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="Phone number, e.g. +39..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          onClick={sendInvite}
          disabled={sending}
          className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send invite"}
        </button>
      </div>

      {status && <p className="text-xs text-muted">{status}</p>}
    </div>
  );
}
