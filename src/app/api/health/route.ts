import { storageMode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    storage: storageMode(),
    shared: storageMode() === "postgres",
  });
}
