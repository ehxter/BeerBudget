import "server-only";

import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

/**
 * On-disk storage for Vault files.
 *
 * The bytes live outside both the database and `public/` — nothing under
 * VAULT_DIR is reachable by URL. The only way to read a file is the
 * `/api/vault/file/[id]` handler, which checks the session first.
 *
 * There is no size limit, which is why nothing here ever holds a whole file in
 * memory: uploads stream from the request to disk and downloads stream from
 * disk to the response.
 */

export function vaultDir(): string {
  const configured = process.env.VAULT_DIR;
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), ".vault");
}

/**
 * The on-disk name of a stored file.
 *
 * `storedName` is generated here and never derived from anything the user
 * typed, so there is no path to traverse out of. The `basename` is belt and
 * braces for the read path, which takes its argument from a database row.
 */
function storedPath(storedName: string): string {
  return path.join(vaultDir(), path.basename(storedName));
}

/** Keeps the uploaded extension (for icons and for the download name) but
 *  refuses anything that isn't a plain short alphanumeric suffix. */
function safeExtension(originalName: string): string {
  const extension = path.extname(originalName).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(extension) ? extension : "";
}

/**
 * Streams an upload straight from the request to disk.
 *
 * The body is piped, never buffered — that's what makes "no size limit" true
 * rather than aspirational, and it's why the upload route takes the raw body
 * instead of `request.formData()`, which would read the whole file into memory
 * before the handler ever runs.
 *
 * The size returned is what was actually written, not what the client claimed.
 */
export async function storeUpload(
  body: ReadableStream,
  originalName: string,
): Promise<{ storedName: string; sizeBytes: number }> {
  await mkdir(vaultDir(), { recursive: true });

  const storedName = `${randomUUID()}${safeExtension(originalName)}`;
  const destination = storedPath(storedName);

  try {
    await pipeline(
      Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(destination),
    );
  } catch (error) {
    // A half-written file with no row pointing at it would linger forever.
    await unlink(destination).catch(() => {});
    throw error;
  }

  const { size } = await stat(destination);
  return { storedName, sizeBytes: size };
}

/** A web stream of the stored bytes, or null when the file is gone from disk. */
export async function readStored(
  storedName: string,
): Promise<{ body: ReadableStream; sizeBytes: number } | null> {
  const source = storedPath(storedName);

  const stats = await stat(source).catch(() => null);
  if (!stats?.isFile()) return null;

  return {
    body: Readable.toWeb(createReadStream(source)) as ReadableStream,
    sizeBytes: stats.size,
  };
}

/** Best effort: a row can be deleted even if its bytes already went missing. */
export async function deleteStored(storedName: string): Promise<void> {
  await unlink(storedPath(storedName)).catch(() => {});
}

/**
 * A Content-Disposition value that survives a filename with spaces, quotes,
 * emoji, or a newline in it.
 *
 * The ASCII fallback is aggressively stripped — a raw CR or LF in a header
 * value is a response-splitting bug, not a cosmetic one — and the real name is
 * carried by the RFC 5987 `filename*` parameter that every current browser
 * prefers.
 */
export function contentDisposition(filename: string, inline: boolean): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(filename);

  return `${inline ? "inline" : "attachment"}; filename="${ascii || "file"}"; filename*=UTF-8''${encoded}`;
}

/** "Hotel booking" + "voucher.pdf" -> "Hotel booking.pdf" */
export function downloadName(name: string, originalName: string): string {
  const extension = safeExtension(originalName);
  return name.toLowerCase().endsWith(extension) ? name : `${name}${extension}`;
}
