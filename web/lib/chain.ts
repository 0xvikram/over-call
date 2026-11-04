import { createPublicClient, http } from "viem";
import { chain, clientRpcUrl, CONTRACT } from "./config";
import { overCallAbi } from "./generated/abi";

export const publicClient = createPublicClient({ chain, transport: http(clientRpcUrl()) });

export const game = { address: CONTRACT, abi: overCallAbi } as const;

export type GameState = {
  ballId: bigint;
  closesAt: number;
  settled: boolean;
  result: number;
  tally: readonly bigint[];
};

export async function readGameState(): Promise<GameState> {
  const ballId = await publicClient.readContract({ ...game, functionName: "ballCount" });
  if (ballId === 0n) return { ballId, closesAt: 0, settled: true, result: 0, tally: [0n, 0n, 0n, 0n, 0n] };
  const [[closesAt, result, settled], tally] = await Promise.all([
    publicClient.readContract({ ...game, functionName: "balls", args: [ballId] }),
    publicClient.readContract({ ...game, functionName: "tallyOf", args: [ballId] }),
  ]);
  return { ballId, closesAt: Number(closesAt), settled, result, tally };
}
