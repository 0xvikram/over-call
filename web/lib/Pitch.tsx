"use client";

import type { CSSProperties } from "react";
import type { BallContext } from "./match";

// Top-down field, drawn in a 600 x 440 SVG. The batter's end is at the top.
const STRIKER_STUMPS_Y = 127;
const BOWLER_STUMPS_Y = 313;
const FROZEN = { x: 300, y: 165 }; // where the ball waits while calls are open
const KEEPER = { x: 300, y: 96 };

const FIELDERS = [
  { x: 470, y: 62 }, // long-on side, used for catches
  { x: 150, y: 90 },
  { x: 520, y: 230 },
  { x: 95, y: 250 },
  { x: 430, y: 380 },
  { x: 175, y: 385 },
  { x: 355, y: 70 },
];
const GAPS = [
  { x: 440, y: 250 },
  { x: 165, y: 195 },
  { x: 420, y: 120 },
  { x: 185, y: 315 },
];
const ROPE = [
  { x: 565, y: 170 },
  { x: 40, y: 150 },
  { x: 520, y: 370 },
  { x: 95, y: 375 },
  { x: 300, y: 18 },
];

export type PitchPhase = "waiting" | "live" | "revealed";

type Pt = { x: number; y: number };

/** CSS custom properties for the generic `mv` keyframe (from -> to). */
function move(from: Pt, to: Pt, duration: string, delay = "0s", extra: CSSProperties = {}): CSSProperties {
  return {
    "--x0": `${from.x}px`,
    "--y0": `${from.y}px`,
    "--x1": `${to.x}px`,
    "--y1": `${to.y}px`,
    "--d": duration,
    "--delay": delay,
    ...extra,
  } as CSSProperties;
}

function outcomeText(ctx: BallContext): string {
  const { result, runs } = ctx.ball;
  if (result === 4) return ctx.ball.how === "caught" ? "OUT · caught" : "OUT · bowled";
  if (result === 3) return runs === 6 ? "SIX" : "FOUR";
  if (result === 2) return `${runs} run${runs === 1 ? "" : "s"}`;
  return "dot ball";
}

export function Pitch({ phase, ctx, ballKey }: { phase: PitchPhase; ctx?: BallContext; ballKey: string }) {
  const result = ctx?.ball.result ?? 0;
  const i = ctx?.index ?? 0;
  const revealed = phase === "revealed" && !!ctx;
  const bowled = revealed && result === 4 && ctx.ball.how !== "caught";
  const caught = revealed && result === 4 && ctx.ball.how === "caught";
  const boundary = revealed && result === 3;
  const running = revealed && result === 2;

  let ballTarget: Pt = KEEPER;
  if (bowled) ballTarget = { x: 300, y: STRIKER_STUMPS_Y };
  else if (caught) ballTarget = FIELDERS[0];
  else if (boundary) ballTarget = ROPE[i % ROPE.length];
  else if (running) ballTarget = GAPS[i % GAPS.length];

  return (
    <svg className="pitch" viewBox="0 0 600 440" role="img" aria-label={revealed ? outcomeText(ctx) : "Cricket field"}>
      {/* Field, rope and 30-yard circle */}
      <ellipse cx="300" cy="220" rx="290" ry="212" className="field" />
      <ellipse
        cx="300"
        cy="220"
        rx="284"
        ry="206"
        className={`rope ${boundary ? "ropeFlash" : ""}`}
        key={`rope-${ballKey}-${boundary}`}
      />
      <ellipse cx="300" cy="220" rx="170" ry="140" className="inner" />
      <rect x="281" y="115" width="38" height="210" rx="3" className="strip" />
      <line x1="281" x2="319" y1="140" y2="140" className="crease" />
      <line x1="281" x2="319" y1="300" y2="300" className="crease" />

      {/* Fielders and keeper */}
      {FIELDERS.map((f, n) => (
        <circle
          key={`f-${n}-${ballKey}`}
          cx={f.x}
          cy={f.y}
          r="7"
          className={`fielder ${caught && n === 0 ? "catchFlash" : ""}`}
        />
      ))}
      <circle cx={KEEPER.x} cy={KEEPER.y - 6} r="7" className="fielder" />

      {/* Stumps at both ends; the striker's bails fly on a bowled */}
      <g key={`stumps-${ballKey}-${bowled}`} className={bowled ? "stumpsHit" : ""}>
        {[-6, 0, 6].map((dx) => (
          <rect key={dx} x={298.5 + dx} y={STRIKER_STUMPS_Y - 6} width="3" height="12" className="stump" />
        ))}
        <rect x="292" y={STRIKER_STUMPS_Y - 8} width="7" height="2" className={`bail ${bowled ? "bailL" : ""}`} />
        <rect x="301" y={STRIKER_STUMPS_Y - 8} width="7" height="2" className={`bail ${bowled ? "bailR" : ""}`} />
      </g>
      {[-6, 0, 6].map((dx) => (
        <rect key={`b${dx}`} x={298.5 + dx} y={BOWLER_STUMPS_Y - 6} width="3" height="12" className="stump" />
      ))}

      {/* Everything that moves is remounted per ball and phase so the CSS animations restart */}
      <g key={`${ballKey}-${phase}`}>
        {/* Batters: striker top, non-striker bottom; they swap ends when running */}
        <g className={running ? "mv" : ""} style={move({ x: 314, y: 142 }, { x: 314, y: 298 }, "0.7s", "0.5s", runIters(ctx, running))}>
          <circle cx={running ? 0 : 314} cy={running ? 0 : 142} r="8" className="batter" />
        </g>
        <g className={running ? "mv" : ""} style={move({ x: 286, y: 298 }, { x: 286, y: 142 }, "0.7s", "0.5s", runIters(ctx, running))}>
          <circle cx={running ? 0 : 286} cy={running ? 0 : 298} r="8" className="batter" />
        </g>

        {/* Bowler: runs in while calls open, stands at the crease after */}
        {phase === "live" ? (
          <g className="mv" style={move({ x: 300, y: 425 }, { x: 300, y: 326 }, "1.1s")}>
            <circle r="9" className="bowler" />
          </g>
        ) : (
          <circle cx="300" cy={phase === "waiting" ? 425 : 326} r="9" className="bowler" />
        )}

        {/* Ball: released and frozen just short of the batter, then played out on reveal */}
        {phase === "live" && (
          <g className="mv" style={move({ x: 300, y: 320 }, FROZEN, "0.45s", "1.1s", { animationTimingFunction: "ease-in" })}>
            <circle r="13" className="halo" />
            <circle r="5.5" className="ball" />
          </g>
        )}
        {revealed && (
          <g className="mv" style={move(FROZEN, ballTarget, boundary ? "0.55s" : "0.4s")}>
            <circle r="5.5" className="ball" />
          </g>
        )}

        {revealed && (
          <text x="300" y="232" className={`outcome ${result === 4 ? "out" : boundary ? "big" : ""}`}>
            {outcomeText(ctx)}
          </text>
        )}
      </g>

      {phase === "waiting" && (
        <text x="300" y="232" className="outcome subtle">
          Waiting for the first ball
        </text>
      )}
    </svg>
  );
}

function runIters(ctx: BallContext | undefined, running: boolean): CSSProperties {
  if (!running || !ctx) return {};
  return { animationIterationCount: ctx.ball.runs, animationDirection: "alternate" };
}
