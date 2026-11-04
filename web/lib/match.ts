import match from "@/data/match.json";

export type ScriptBall = (typeof match.balls)[number] & { how?: string };

export type BallContext = {
  ball: ScriptBall;
  index: number;
  runsBefore: number;
  wicketsBefore: number;
  striker: string;
  bowler: string;
};

/** Score, striker and bowler as they stand before each scripted ball. */
export const contexts: BallContext[] = (() => {
  let runs = 0;
  let wickets = 0;
  let striker = 0;
  let nonStriker = 1;
  let nextIn = 2;
  return match.balls.map((ball, index) => {
    if (index > 0 && index % 6 === 0) [striker, nonStriker] = [nonStriker, striker]; // new over
    const ctx: BallContext = {
      ball,
      index,
      runsBefore: runs,
      wicketsBefore: wickets,
      striker: match.lineup[striker] ?? "Batter",
      bowler: match.bowlers[Math.floor(index / 6) % match.bowlers.length],
    };
    runs += ball.runs;
    if (ball.result === 4) {
      wickets += 1;
      striker = nextIn++;
    } else if (ball.runs % 2 === 1) {
      [striker, nonStriker] = [nonStriker, striker];
    }
    return ctx;
  });
})();

/** Context for an on-chain ball id (1-based), if the script has it. */
export const contextFor = (ballId: bigint | number): BallContext | undefined =>
  Number(ballId) > 0 ? contexts[Number(ballId) - 1] : undefined;

export const situation = (c: BallContext) =>
  `${match.batting} ${c.runsBefore}/${c.wicketsBefore} · ${c.striker} facing · ${c.bowler} bowling`;

export { match };
