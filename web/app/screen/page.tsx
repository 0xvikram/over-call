"use client";

import { useRef } from "react";
import { game, publicClient, readGameState } from "@/lib/chain";
import { PICKS, pickLabel } from "@/lib/config";
import { JoinQr } from "@/lib/JoinQr";
import { contextFor, match, situation } from "@/lib/match";
import { Pitch } from "@/lib/Pitch";
import { useNow, usePoll } from "@/lib/usePoll";

type BlockRow = { block: bigint; calls: number };

export default function Screen() {
  const lastBlock = useRef<bigint | null>(null);
  const feed = useRef<BlockRow[]>([]);
  const now = useNow();

  const data = usePoll(async () => {
    const head = await publicClient.getBlockNumber();
    if (lastBlock.current === null) lastBlock.current = head;
    if (head > lastBlock.current) {
      // Monad's public RPC rejects large log ranges, so only look at the most recent blocks.
      // A failed log fetch must never stop the score, tally and leaderboard from updating.
      const MAX_RANGE = 80n;
      const fromBlock = head - lastBlock.current > MAX_RANGE ? head - MAX_RANGE + 1n : lastBlock.current + 1n;
      try {
        const logs = await publicClient.getContractEvents({ ...game, eventName: "Called", fromBlock, toBlock: head });
        const byBlock = new Map<bigint, number>();
        for (const l of logs) byBlock.set(l.blockNumber, (byBlock.get(l.blockNumber) ?? 0) + 1);
        const rows = [...byBlock].map(([block, calls]) => ({ block, calls }));
        feed.current = [...rows.reverse(), ...feed.current].slice(0, 8);
      } catch (e) {
        console.warn("[overcall] call feed skipped", e);
      }
      lastBlock.current = head;
    }
    const [state, board] = await Promise.all([
      readGameState(),
      publicClient.readContract({ ...game, functionName: "board" }),
    ]);
    const [addrs, names, pts, streaks] = board;
    const leaders = addrs
      .map((a, i) => ({ a, name: names[i], pts: pts[i], streak: streaks[i] }))
      .sort((x, y) => (y.pts > x.pts ? 1 : y.pts < x.pts ? -1 : 0))
      .slice(0, 8);
    return { head, state, leaders, players: addrs.length };
  }, 400);

  if (!data) return <main className="screen">Connecting to Monad…</main>;

  const { state, leaders, head, players } = data;
  const ctx = contextFor(state.ballId);
  const ball = ctx?.ball;
  const secondsLeft = Math.max(0, Math.ceil(state.closesAt - now));
  const totalCalls = state.tally.reduce((s, n) => s + Number(n), 0);

  return (
    <main className="screen">
      <section className="stage">
        <div className="scoreStrip">
          <span className="teams">{match.batting} <i>v</i> {match.bowling}</span>
          <span className="liveDot">LIVE ON MONAD · ~0.4s BLOCKS</span>
        </div>
        <div className="statRow">
          <div className="stat"><b>{players}</b><span>players</span></div>
          <div className="stat"><b>{totalCalls}</b><span>calls this ball</span></div>
          <div className="stat"><b>#{head.toString()}</b><span>latest block</span></div>
        </div>
        {state.ballId === 0n ? (
          <>
            <h1>Scan to play</h1>
            <JoinQr size={320} />
          </>
        ) : (
          <>
            <h1>
              Ball {ball?.label}{" "}
              {state.settled ? (
                <span className="result">{pickLabel(state.result)}</span>
              ) : secondsLeft > 0 ? (
                <span className="countdown">{secondsLeft}s to call</span>
              ) : (
                <span className="muted">calls closed</span>
              )}
            </h1>
            {ctx && <p className="situation muted">{situation(ctx)}</p>}
            <Pitch phase={state.settled ? "revealed" : "live"} ctx={ctx} ballKey={state.ballId.toString()} />
            {state.settled && ball && <p className="note">{ball.note}</p>}
            <div className="tally">
              {PICKS.map((p) => {
                const n = Number(state.tally[p.id]);
                const pct = totalCalls ? (n / totalCalls) * 100 : 0;
                const hit = state.settled && state.result === p.id;
                return (
                  <div key={p.id} className={`bar ${hit ? "hit" : ""}`}>
                    <span className="barLabel">{p.label}</span>
                    <span className="barTrack">
                      <span className="barFill" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="barCount">{n}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <aside className="side">
        {state.ballId > 0n && (
          <div className="cornerQr">
            <JoinQr size={120} showLink={false} />
            <span className="muted small">Late? Scan to join</span>
          </div>
        )}
        <h2>Calls landing on Monad</h2>
        <ul className="feed">
          {feed.current.length === 0 && <li className="muted">No calls yet</li>}
          {feed.current.map((r) => (
            <li key={r.block.toString()} className="feedRow">
              <span className="mono">#{r.block.toString()}</span>
              <span className="callsPill">{r.calls} call{r.calls === 1 ? "" : "s"}</span>
            </li>
          ))}
        </ul>
        <h2>Leaderboard</h2>
        <ol className="leaders">
          {leaders.map((l, i) => (
            <li key={l.a} className="leaderRow">
              <span><span className={`rank r${i + 1}`}>{i + 1}</span>{l.name}</span>
              <span>
                {l.pts.toString()} {l.streak > 1n ? `🔥${l.streak.toString()}` : ""}
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </main>
  );
}
