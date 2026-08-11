"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Plus, X, Paperclip } from "lucide-react";
import {
  Card,
  Input,
  Chips,
  SubmitButton,
  FormError,
  EmptyState,
  Button,
  CardButton,
  Divider,
} from "@/components/ui";
import { VAULT_CATEGORIES, emojiFor } from "@/lib/constants";
import { addVaultItem } from "./actions";

type VaultFile = { id: string; filename: string; sizeBytes: number };
type VaultItem = {
  id: string;
  title: string;
  category: string;
  content: string | null;
  files: VaultFile[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Vault({
  items,
  startOpen = false,
}: {
  items: VaultItem[];
  /** Opens the composer immediately — the header "Add Item" pill sets this. */
  startOpen?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<string>("OTHER");
  const [composing, setComposing] = useState(startOpen);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  async function handleAction(formData: FormData) {
    const result = await addVaultItem({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    formRef.current?.reset();
    setCategory("OTHER");
    setComposing(false);
  }

  async function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    itemId: string,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFor(itemId);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("vaultItemId", itemId);

    try {
      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      // Refresh the server component rather than reloading the document.
      router.refresh();
    } catch {
      setError("That file could not be uploaded.");
    } finally {
      setUploadingFor(null);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FormError>{error}</FormError>

      {composing ? (
        <form ref={formRef} action={handleAction} className="animate-rise flex flex-col gap-4">
          <Card pad={16}>
            <Input name="title" placeholder="e.g. Passport" required autoFocus maxLength={120} />
            <Chips
              name="category"
              options={VAULT_CATEGORIES.map((c) => ({
                value: c.value,
                label: c.label,
                emoji: c.emoji,
              }))}
              value={category}
              onChange={setCategory}
              columns={3}
            />
            <Input name="content" placeholder="Details (optional)" maxLength={500} />
          </Card>
          <div className="flex gap-2">
            <SubmitButton size="block" className="flex-1" pendingLabel="Saving…">
              Save entry
            </SubmitButton>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setComposing(false)}
              aria-label="Cancel"
              className="w-12 px-0"
            >
              <X size={17} />
            </Button>
          </div>
        </form>
      ) : (
        <CardButton onClick={() => setComposing(true)}>
          <Plus size={16} className="mr-1.5" />
          New entry
        </CardButton>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={<span className="text-base">🔒</span>}
          title="Vault is empty"
          description="Passport details, booking references, insurance — stored against your account and served only to you."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} pad={16} className="gap-3">
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="text-meta">
                  {emojiFor(VAULT_CATEGORIES, item.category)}
                </span>
                <h3 className="min-w-0 flex-1 truncate text-row font-medium text-ink">
                  {item.title}
                </h3>
              </div>

              {item.content ? (
                <p className="text-meta leading-relaxed text-ink-3">{item.content}</p>
              ) : null}

              {item.files.length > 0 ? <Divider soft /> : null}

              <div className="flex flex-col gap-2">
                {item.files.map((file) => (
                  <a
                    key={file.id}
                    href={`/api/vault/download/${file.id}`}
                    className="flex items-center gap-2 rounded-pill bg-track px-3 py-2.5 text-meta active:bg-fill"
                  >
                    <Paperclip size={13} className="shrink-0 text-ink-4" />
                    <span className="min-w-0 flex-1 truncate text-ink">{file.filename}</span>
                    <span className="tnum shrink-0 text-label text-ink-5">
                      {formatBytes(file.sizeBytes)}
                    </span>
                    <Download size={13} className="shrink-0 text-ink-4" />
                  </a>
                ))}

                <label className="flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-pill border border-dashed border-line text-label font-medium text-ink-4 active:bg-track">
                  <Upload size={13} />
                  {uploadingFor === item.id ? "Uploading…" : "Attach file"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploadingFor !== null}
                    onChange={(event) => handleFileUpload(event, item.id)}
                  />
                </label>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
