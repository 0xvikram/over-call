import { NextResponse } from "next/server";
import { game, publicClient } from "@/lib/chain";
import { CALL_WINDOW_SECONDS } from "@/lib/config";
import { HOST_SECRET, hostClient } from "@/lib/server";

type Body = { secret?: string; action?: "open" | "settle"; result?: number };

export async function POST(req: Request) {
  if (!hostClient) return NextResponse.json({ error: "HOST_PRIVATE_KEY not set" }, { status: 500 });
  const body = (await req.json().catch(() => ({}))) as Body;
  if (body.secret !== HOST_SECRET) return NextResponse.json({ error: "wrong host secret" }, { status: 401 });

  try {
    let hash: `0x${string}`;
    if (body.action === "open") {
      hash = await hostClient.writeContract({
        ...game,
        functionName: "openBall",
        args: [BigInt(CALL_WINDOW_SECONDS)],
      });
    } else if (body.action === "settle" && body.result && body.result >= 1 && body.result <= 4) {
      hash = await hostClient.writeContract({ ...game, functionName: "settle", args: [body.result] });
    } else {
      return NextResponse.json({ error: "bad action" }, { status: 400 });
    }
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (receipt.status !== "success") return NextResponse.json({ error: "reverted", hash }, { status: 500 });
    return NextResponse.json({ ok: true, hash, block: receipt.blockNumber.toString() });
  } catch (e) {
    const msg = String((e as { shortMessage?: string }).shortMessage ?? e).slice(0, 300);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
