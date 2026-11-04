"use client";

import { useEffect, useState } from "react";
import { readGameState } from "@/lib/chain";
import { PICKS, pickLabel } from "@/lib/config";
import { useNow, usePoll } from "@/lib/usePoll";
import match from "@/data/match.json";

export default function Host() {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const state = usePoll(readGameState, 500);
  const now = useNow();

  useEffect(() => {
    setSecret(new URLSearchParams(window.location.search).get("secret") ?? "");
  }, []);

  async function act(action: "open" | "settle", result?: number) {
    setBusy(true);
    try {
      const res = await fetch("/api/host", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret, action, result }),
      });
      const body = await res.json();
      setLog((l) => [`${action}${result ? ` ${pickLabel(result)}` : ""}: ${body.error ?? `ok, block ${body.block}`}`, ...l].slice(0, 6));
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <main className="phone">Connecting…</main>;
  const current = state.ballId > 0n ? match.balls[Number(state.ballId) - 1] : undefined;
  const next = match.balls[Number(state.ballId)];
  const secondsLeft = Math.max(0, Math.ceil(state.closesAt - now));
  const canOpen = state.settled && !!next;
  const canSettle = state.ballId > 0n && !state.settled && secondsLeft === 0;

  return (
    <main className="phone">
      <h1>Host</h1>
      <input
        className="nameInput"
        placeholder="Host secret"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
      />
      <p>
        Current: {current ? `Ball ${current.label}` : "none"}{" "}
        {state.ballId > 0n && (state.settled ? `· settled ${pickLabel(state.result)}` : `· ${secondsLeft}s left`)}
      </p>
      <button className="primary" disabled={busy || !canOpen} onClick={() => act("open")}>
        {next ? `Open ball ${next.label}` : "Match over"}
      </button>
      {current && (
        <>
          <p className="muted">
            Script says {current.label}: <strong>{pickLabel(current.result)}</strong> ({current.note})
          </p>
          <button
            className="primary"
            disabled={busy || !canSettle}
            onClick={() => act("settle", current.result)}
          >
            Reveal: {pickLabel(current.result)}
          </button>
          <div className="picks">
            {PICKS.map((p) => (
              <button key={p.id} className="pick" disabled={busy || !canSettle} onClick={() => act("settle", p.id)}>
                Override: {p.label}
              </button>
            ))}
          </div>
        </>
      )}
      <ul className="muted small">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </main>
  );
}
