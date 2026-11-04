import { NextResponse } from "next/server";
import { RPC_URL } from "@/lib/config";

// Phones reach the chain through the app's own address, so they only need the URL in the QR.
// Only the JSON-RPC methods the game uses are forwarded.
const ALLOWED = new Set([
  "eth_chainId",
  "eth_blockNumber",
  "eth_call",
  "eth_getLogs",
  "eth_getBalance",
  "eth_getCode",
  "eth_getBlockByNumber",
  "eth_getTransactionCount",
  "eth_getTransactionReceipt",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_maxPriorityFeePerGas",
  "eth_feeHistory",
  "eth_sendRawTransaction",
  "net_version",
]);

type RpcRequest = { jsonrpc?: string; id?: unknown; method?: string };

const upstream = process.env.RPC_URL_SERVER ?? RPC_URL;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RpcRequest | RpcRequest[] | null;
  const calls = Array.isArray(body) ? body : body ? [body] : [];
  if (calls.length === 0 || calls.length > 20) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const blocked = calls.find((c) => !c.method || !ALLOWED.has(c.method));
  if (blocked) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: blocked.id ?? null, error: { code: -32601, message: `method not allowed: ${blocked.method}` } },
      { status: 403 },
    );
  }
  const res = await fetch(upstream, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return new NextResponse(await res.text(), {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}
