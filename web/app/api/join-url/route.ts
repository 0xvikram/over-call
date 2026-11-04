import { NextResponse } from "next/server";
import os from "node:os";

export const dynamic = "force-dynamic";

// The link the QR encodes. A public URL wins; otherwise this laptop's Wi-Fi address,
// so the QR works even when the big screen itself is open on localhost.
function lanAddress(): string | null {
  const nets = os.networkInterfaces();
  const candidates = Object.entries(nets).flatMap(([name, list]) =>
    (list ?? [])
      .filter((n) => n.family === "IPv4" && !n.internal)
      .map((n) => ({ name, address: n.address })),
  );
  const preferred = candidates.find((c) => c.name === "en0") ?? candidates[0];
  return preferred?.address ?? null;
}

export async function GET(req: Request) {
  const configured = process.env.NEXT_PUBLIC_PUBLIC_URL;
  if (configured) return NextResponse.json({ url: `${configured.replace(/\/$/, "")}/play`, source: "configured" });

  const port = new URL(req.url).port || "3000";
  const ip = lanAddress();
  if (!ip) return NextResponse.json({ url: null, source: "none" });
  return NextResponse.json({ url: `http://${ip}:${port}/play`, source: "lan" });
}
