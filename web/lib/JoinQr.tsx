"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** QR for the phone join link, fetched from /api/join-url so it never encodes localhost. */
export function JoinQr({ size, showLink = true }: { size: number; showLink?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  const [img, setImg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/join-url")
      .then((r) => r.json())
      .then(async ({ url }: { url: string | null }) => {
        setUrl(url);
        if (url) setImg(await QRCode.toDataURL(url, { width: size * 2, margin: 1 }));
      })
      .catch((e) => console.warn("[overcall] join url failed", e));
  }, [size]);

  if (!url) return <p className="muted">Join link unavailable: connect this laptop to Wi-Fi.</p>;
  return (
    <div className="qr">
      {img && <img src={img} width={size} height={size} alt={`QR code to join: ${url}`} />}
      {showLink && <p className="qrLink">{url}</p>}
    </div>
  );
}
