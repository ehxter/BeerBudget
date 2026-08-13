"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Paperclip, Upload, X } from "lucide-react";
import {
  Card,
  CardLabel,
  Input,
  Button,
  EmptyState,
  FormError,
  ProgressBar,
  SectionHeader,
  DeleteButton,
} from "@/components/ui";
import { formatBytes, relativeDay } from "@/lib/format";
import { deleteVaultFile } from "./actions";

export type VaultFileRow = {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

function iconFor(mimeType: string): string {
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType.startsWith("text/")) return "📝";
  if (/zip|compressed|tar|rar|7z/.test(mimeType)) return "🗜️";
  return "📎";
}

/** "passport-scan.pdf" -> "passport-scan", as a starting point for the name. */
function baseName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? filename.slice(0, dot) : filename;
}

/**
 * The Vault's second tab: any file, any size.
 *
 * Upload goes through XMLHttpRequest rather than `fetch` for one reason —
 * `upload.onprogress`. With no size cap, a large file otherwise leaves the
 * screen doing nothing for minutes with no way to tell whether it's working.
 */
export function Files({ files }: { files: VaultFileRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const [picked, setPicked] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");

  const [optimistic, removeOptimistic] = useOptimistic(
    files,
    (current: VaultFileRow[], id: string) => current.filter((row) => row.id !== id),
  );

  function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setPicked(file);
    setError("");
    // Pre-fill the label from the filename; it stays editable.
    if (file && !name.trim()) setName(baseName(file.name).slice(0, 120));
  }

  function reset() {
    setPicked(null);
    setName("");
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleUpload() {
    const file = picked;
    const label = name.trim();

    if (!file) return setError("Choose a file first");
    if (!label) return setError("Give the file a name");

    setError("");
    setProgress(0);

    // The file is the whole body — see the upload route for why it isn't sent
    // as a multipart field.
    const url =
      `/api/vault/upload?name=${encodeURIComponent(label)}` +
      `&filename=${encodeURIComponent(file.name)}`;

    const request = new XMLHttpRequest();
    request.open("POST", url);
    request.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress((event.loaded / event.total) * 100);
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        reset();
        router.refresh();
        return;
      }
      let message = "That file could not be uploaded";
      try {
        message = JSON.parse(request.responseText).error ?? message;
      } catch {
        // A non-JSON error body (a proxy timeout page, say) isn't worth showing.
      }
      setError(message);
      setProgress(null);
    };

    request.onerror = () => {
      setError("The upload was interrupted. Try again.");
      setProgress(null);
    };

    request.send(file);
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      await deleteVaultFile(id);
    });
  }

  const uploading = progress !== null;

  return (
    <div className="flex flex-col gap-4">
      <FormError>{error}</FormError>

      <Card pad={20}>
        <CardLabel>Add a file</CardLabel>

        <input
          ref={inputRef}
          type="file"
          onChange={handlePick}
          className="hidden"
          id="vault-file"
        />

        <label
          htmlFor="vault-file"
          className="flex h-12 w-full cursor-pointer items-center gap-3 rounded-card bg-track px-4 text-row text-ink-3"
        >
          <Paperclip size={16} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {picked ? picked.name : "Choose a file"}
          </span>
          {picked ? (
            <span className="tnum shrink-0 text-meta text-ink-4">
              {formatBytes(picked.size)}
            </span>
          ) : null}
        </label>

        {picked ? (
          <>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name it — e.g. Hotel booking"
              maxLength={120}
              autoComplete="off"
              aria-label="File name"
            />

            {uploading ? (
              <div className="flex flex-col gap-2">
                <ProgressBar percent={progress} tone="white" label="Upload progress" />
                <p className="tnum text-label text-ink-5">
                  {Math.round(progress)}% uploaded
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="block"
                  className="flex-1"
                  onClick={handleUpload}
                >
                  <Upload size={15} />
                  Upload
                </Button>
                <Button
                  type="button"
                  variant="quiet"
                  onClick={reset}
                  aria-label="Clear selection"
                >
                  <X size={16} />
                </Button>
              </div>
            )}
          </>
        ) : null}
      </Card>

      {optimistic.length === 0 ? (
        <EmptyState
          icon={<span className="text-base">🗄️</span>}
          title="No files yet"
          description="Passports, bookings, tickets — anything you want to be able to pull up offline."
        />
      ) : (
        <section className="flex flex-col gap-2.5">
          <SectionHeader label="Files" value={`${optimistic.length}`} />

          <div className="flex flex-col gap-2">
            {optimistic.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 rounded-card bg-card p-4"
              >
                {/* Opens in a new tab so the app keeps its place behind the
                    preview, and the back gesture doesn't leave the Vault. */}
                <a
                  href={`/api/vault/file/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-track"
                  >
                    {iconFor(file.mimeType)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-row font-medium text-ink">
                      {file.name}
                    </span>
                    <span className="mt-1 block truncate text-meta text-ink-4">
                      {formatBytes(file.sizeBytes)} · {relativeDay(file.createdAt)}
                    </span>
                  </span>
                </a>

                <a
                  href={`/api/vault/file/${file.id}?download`}
                  download
                  aria-label={`Download ${file.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-5 transition-colors active:bg-white/[0.06] active:text-ink-3"
                >
                  <Download size={15} />
                </a>

                <DeleteButton
                  label={`Delete ${file.name}`}
                  onDelete={() => handleDelete(file.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
