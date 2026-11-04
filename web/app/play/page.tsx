"use client";

import { useState } from "react";
import { game, publicClient, readGameState } from "@/lib/chain";
import { PICKS, pickLabel } from "@/lib/config";
import { useNow, usePoll } from "@/lib/usePoll";
import { getWallet, type PlayerWallet } from "@/lib/wallet";
import { contextFor, situation } from "@/lib/match";

export default function Play() {
  const [name, setName] = useState("");
  const [wallet, setWallet] = useState<PlayerWallet | null>(null);
  const [status, setStatus] = useState("");
  const [sentFor, setSentFor] = useState<Record<string, number>>({});
  const now = useNow();

  const state = usePoll(async () => {
    const s = await readGameState();
    if (!wallet) return { ...s, myPick: 0, points: 0n, streak: 0n };
    const me = wallet.account.address;
    const [myPick, points, streak] = await Promise.all([
      s.ballId > 0n
        ? publicClient.readContract({ ...game, functionName: "pickOf", args: [s.ballId, me] })
        : Promise.resolve(0),
      publicClient.readContract({ ...game, functionName: "points", args: [me] }),
      publicClient.readContract({ ...game, functionName: "streak", args: [me] }),
    ]);
    return { ...s, myPick, points, streak };
  }, 500);

  async function join() {
    const trimmed = name.trim().slice(0, 20);
    if (!trimmed) return setStatus("Type a name first");
    try {
      setStatus("Creating your passkey wallet…");
      const w = await getWallet(trimmed);
      setStatus("Getting gas…");
      const res = await fetch("/api/fund", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: w.account.address }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "funding failed");
      const existing = await publicClient.readContract({
        ...game,
        functionName: "nameOf",
        args: [w.account.address],
      });
      if (!existing) {
        setStatus("Joining…");
        const hash = await w.client.writeContract({
          ...game,
          functionName: "join",
          args: [trimmed],
          account: w.account,
          chain: w.client.chain,
        });
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setWallet(w);
      setStatus("");
    } catch (e) {
      setStatus(`Could not join: ${String((e as { shortMessage?: string }).shortMessage ?? e).slice(0, 140)}`);
    }
  }

  async function call(pick: number) {
    if (!wallet || !state) return;
    const key = state.ballId.toString();
    setSentFor((m) => ({ ...m, [key]: pick }));
    try {
      await wallet.client.writeContract({
        ...game,
        functionName: "call",
        args: [pick],
        account: wallet.account,
        chain: wallet.client.chain,
      });
    } catch (e) {
      setSentFor((m) => ({ ...m, [key]: 0 }));
      setStatus(`Call failed: ${String((e as { shortMessage?: string }).shortMessage ?? e).slice(0, 120)}`);
    }
  }

  if (!wallet) {
    return (
      <main className="phone">
        <h1>Over Call</h1>
        <p className="muted">Call every ball with the whole room. Points only, no money.</p>
        <input
          className="nameInput"
          placeholder="Your name"
          maxLength={20}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="primary" onClick={join}>
          Join with passkey
        </button>
        {status && <p className="status">{status}</p>}
      </main>
    );
  }

  const ctx = state ? contextFor(state.ballId) : undefined;
  const ball = ctx?.ball;
  const secondsLeft = state ? Math.max(0, Math.ceil(state.closesAt - now)) : 0;
  const open = !!state && state.ballId > 0n && !state.settled && secondsLeft > 0;
  const mine = state ? state.myPick || sentFor[state.ballId.toString()] || 0 : 0;

  return (
    <main className="phone">
      <header className="phoneHead">
        <span>{name.trim()}</span>
        <span>
          {state?.points.toString() ?? 0} pts · streak {state?.streak.toString() ?? 0}
        </span>
      </header>
      <p className="muted small">
        Wallet {wallet.account.address.slice(0, 6)}…{wallet.account.address.slice(-4)} ({wallet.mode})
      </p>

      {!state || state.ballId === 0n ? (
        <p className="big">Waiting for the first ball…</p>
      ) : open ? (
        <>
          <p className="big">
            Ball {ball?.label} · <strong>{secondsLeft}s</strong>
          </p>
          {ctx && <p className="muted">{situation(ctx)}</p>}
          <div className="picks">
            {PICKS.map((p) => (
              <button
                key={p.id}
                className={`pick ${mine === p.id ? "chosen" : ""}`}
                disabled={mine !== 0}
                onClick={() => call(p.id)}
              >
                <span className="emoji">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>
          {mine !== 0 && <p className="muted">You called {pickLabel(mine)}. Watch the big screen.</p>}
        </>
      ) : state.settled ? (
        <p className="big">
          Ball {ball?.label}: {pickLabel(state.result)}
          {mine ? (mine === state.result ? " · You got it!" : " · Missed") : " · You skipped"}
        </p>
      ) : (
        <p className="big">Calls closed. Waiting for the result…</p>
      )}
      {status && <p className="status">{status}</p>}
    </main>
  );
}
