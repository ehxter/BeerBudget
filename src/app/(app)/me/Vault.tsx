"use client";

import { useRef, useState } from "react";
import { Download, Upload, File as FileIcon } from "lucide-react";
import { Card, Input, ChoiceChips, SubmitButton, FormError } from "@/components/ui";
import { VAULT_CATEGORIES, emojiFor } from "@/lib/constants";
import { addVaultItem } from "./actions";

type VaultFile = {
  id: string;
  filename: string;
  sizeBytes: number;
};

type VaultItem = {
  id: string;
  title: string;
  category: string;
  content: string | null;
  files: VaultFile[];
};

export function Vault({ items }: { items: VaultItem[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<string>("OTHER");
  const [isUploading, setIsUploading] = useState(false);

  async function handleAction(formData: FormData) {
    const res = await addVaultItem({}, formData);
    if (res.error) {
      setError(res.error);
    } else {
      setError("");
      formRef.current?.reset();
      setCategory("OTHER");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, itemId: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vaultItemId", itemId);

    try {
      const response = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      window.location.reload(); // Quick refresh to show new file
    } catch (err) {
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleAction} className="space-y-3">
        <FormError>{error}</FormError>
        <Card className="space-y-3 p-4 bg-surface-2/50 border-dashed border-2 border-surface-3 shadow-none">
          <Input name="title" placeholder="e.g. Passport Copy" required className="bg-surface" />
          
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Category</span>
            <ChoiceChips
              name="category"
              options={VAULT_CATEGORIES}
              value={category}
              onChange={setCategory}
              columns={3}
            />
          </div>

          <Input name="content" placeholder="Optional notes (e.g. passport number)" className="bg-surface" />
          
          <SubmitButton className="w-full">Create Entry</SubmitButton>
        </Card>
      </form>

      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-surface-2 pb-2">
              <span className="text-xl">{emojiFor(VAULT_CATEGORIES, item.category)}</span>
              <h3 className="font-semibold text-ink">{item.title}</h3>
            </div>
            
            {item.content ? (
              <div className="text-sm text-ink-muted">{item.content}</div>
            ) : null}

            <div className="space-y-2 pt-2">
              {item.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded bg-surface-2 p-2 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon size={14} className="text-ink-faint shrink-0" />
                    <span className="truncate text-ink">{file.filename}</span>
                  </div>
                  <a
                    href={`/api/vault/download/${file.id}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-3 hover:bg-surface-4 text-ink-muted transition-colors"
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                </div>
              ))}

              <label className="flex cursor-pointer items-center justify-center gap-1 rounded border border-dashed border-surface-3 py-2 text-xs font-medium text-ink-faint hover:bg-surface-2 transition-colors">
                <Upload size={14} />
                {isUploading ? "Uploading..." : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => handleFileUpload(e, item.id)}
                />
              </label>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
