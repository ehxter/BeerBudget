import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentDisposition, downloadName, readStored } from "@/lib/vault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Types a browser can render on its own, and that can't execute script against
 * this origin.
 *
 * HTML and SVG are deliberately absent. Both can carry script, and a file
 * served inline from this origin would run with the app's own privileges —
 * stored XSS by upload. They download instead, which costs a tap and closes
 * the hole. `nosniff` on every response stops the browser from deciding for
 * itself that something else is HTML.
 */
const PREVIEWABLE = new Set([
  "application/pdf",
  "image/apng",
  "image/avif",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
]);

function isPreviewable(mimeType: string): boolean {
  return (
    PREVIEWABLE.has(mimeType) ||
    mimeType.startsWith("audio/") ||
    mimeType.startsWith("video/")
  );
}

/**
 * Reads one Vault file.
 *
 * The bytes live outside `public/`, so this handler is the only way to reach
 * them — and it answers 404 for a file belonging to someone else, which tells
 * a prober nothing that a made-up id wouldn't.
 *
 * Tapping a file opens it here for preview; the download button adds
 * `?download=1` to get the same bytes as an attachment.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Not signed in", { status: 401 });

  const { id } = await context.params;

  const file = await prisma.vaultFile.findFirst({
    where: { id, userId: user.id },
    select: {
      name: true,
      originalName: true,
      storedName: true,
      mimeType: true,
    },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });

  const stored = await readStored(file.storedName);
  if (!stored) return new NextResponse("File is missing from storage", { status: 404 });

  const forceDownload = request.nextUrl.searchParams.get("download") !== null;
  const inline = !forceDownload && isPreviewable(file.mimeType);

  return new NextResponse(stored.body, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(stored.sizeBytes),
      "Content-Disposition": contentDisposition(
        downloadName(file.name, file.originalName),
        inline,
      ),
      "X-Content-Type-Options": "nosniff",
      // Private to one account: no shared cache should ever hold a copy.
      "Cache-Control": "private, no-store",
    },
  });
}
