import { NextResponse } from "next/server";
import { isAddress, parseEther } from "viem";
import { publicClient } from "@/lib/chain";
import { hostClient } from "@/lib/server";

// Gives each new phone enough testnet MON for a join plus a match of calls.
const DRIP = parseEther(process.env.FUND_AMOUNT ?? "0.05");
const funded = new Set<string>();

export async function POST(req: Request) {
  if (!hostClient) return NextResponse.json({ error: "HOST_PRIVATE_KEY not set" }, { status: 500 });
  const { address } = (await req.json().catch(() => ({}))) as { address?: string };
  if (!address || !isAddress(address)) return NextResponse.json({ error: "bad address" }, { status: 400 });

  const key = address.toLowerCase();
  const balance = await publicClient.getBalance({ address });
  if (balance >= DRIP / 2n || funded.has(key)) return NextResponse.json({ ok: true, skipped: true });

  funded.add(key);
  try {
    const hash = await hostClient.sendTransaction({ to: address, value: DRIP });
    await publicClient.waitForTransactionReceipt({ hash });
    return NextResponse.json({ ok: true, hash });
  } catch (e) {
    funded.delete(key);
    return NextResponse.json({ error: String(e).slice(0, 200) }, { status: 500 });
  }
}
