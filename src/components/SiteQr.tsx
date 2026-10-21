"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function SiteQr({ className, alt }: { className?: string; alt: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    const origin = window.location.origin;
    void QRCode.toDataURL(origin, { margin: 1, width: 512, color: { dark: "#143528", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, []);

  if (!src) {
    return <div className={className} aria-hidden />;
  }
  return <img src={src} alt={alt} className={className} />;
}
