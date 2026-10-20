import QRCode from "qrcode";

export const dynamic = "force-dynamic";

function originFrom(req: Request) {
  const url = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost ?? req.headers.get("host") ?? url.host;
  const proto =
    req.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const origin = originFrom(req);
  const png = await QRCode.toBuffer(origin, {
    type: "png",
    width: 640,
    margin: 1,
    color: { dark: "#1f6b4a", light: "#ffffff" },
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
