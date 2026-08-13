import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStored, storeUpload } from "@/lib/vault";

export const dynamic = "force-dynamic";
// Streaming to disk needs the Node runtime, not the edge one.
export const runtime = "nodejs";

const MAX_NAME = 120;
const MAX_FILENAME = 255;

/**
 * Vault upload.
 *
 * The file arrives as the raw request body rather than a multipart field, and
 * its metadata rides along in the query string. That's deliberate: it lets the
 * handler pipe the body to disk a chunk at a time. `request.formData()` would
 * pull the entire file into memory first, which is exactly what a vault with
 * no size limit can't afford.
 *
 * A Server Action is not an option here either — those are capped at 1MB of
 * body by default.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const name = (params.get("name") ?? "").trim().slice(0, MAX_NAME);
  const originalName = (params.get("filename") ?? "").trim().slice(0, MAX_FILENAME);

  if (!name) {
    return NextResponse.json({ error: "Give the file a name" }, { status: 400 });
  }
  if (!request.body) {
    return NextResponse.json({ error: "No file was sent" }, { status: 400 });
  }

  // Whatever the browser reported for the picked file. Never trusted as a
  // reason to render something: the read route sandboxes every response.
  const mimeType =
    request.headers.get("content-type")?.split(";")[0].trim() ||
    "application/octet-stream";

  let stored: { storedName: string; sizeBytes: number } | undefined;

  try {
    stored = await storeUpload(request.body, originalName || name);

    if (stored.sizeBytes === 0) {
      await deleteStored(stored.storedName);
      return NextResponse.json({ error: "That file is empty" }, { status: 400 });
    }

    const file = await prisma.vaultFile.create({
      data: {
        userId: user.id,
        name,
        originalName: originalName || name,
        storedName: stored.storedName,
        mimeType,
        sizeBytes: stored.sizeBytes,
      },
      select: { id: true, name: true, sizeBytes: true },
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error("[vault] upload failed:", error);
    // Don't leave bytes on disk that no row will ever point at.
    if (stored) await deleteStored(stored.storedName);
    return NextResponse.json({ error: "That file could not be saved" }, { status: 500 });
  }
}
