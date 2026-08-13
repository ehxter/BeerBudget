import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Screen, Tabs } from "@/components/ui";
import { Checklist } from "./Checklist";
import { Files } from "./Files";
import { Notes } from "./Notes";

export const metadata = { title: "Vault · Istanbul" };
export const dynamic = "force-dynamic";

/**
 * Vault: the checklist, the file store, and free-form notes, behind one tab
 * bar.
 *
 * All three queries run here, in parallel, and every tab's data is handed over
 * on the first load — so switching tabs is instant and costs no round trip.
 * The panels themselves are client components (they're all interactive), so
 * the markup is built in the browser from that data.
 */
export default async function VaultPage() {
  const user = await requireUser();

  const [checklist, files, notes] = await Promise.all([
    prisma.checklistItem.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true, isDone: true },
    }),
    prisma.vaultFile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        originalName: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
    }),
    prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, body: true, updatedAt: true },
    }),
  ]);

  return (
    <Screen logo gap={4} className="animate-rise">
      <Tabs
        tabs={[
          {
            value: "checklist",
            label: "Checklist",
            content: <Checklist items={checklist} />,
          },
          {
            value: "files",
            label: "Files",
            content: <Files files={files} />,
          },
          {
            value: "notes",
            label: "Notes",
            // Keyed on the note count so a save clears the composer textarea.
            content: <Notes key={notes.length} notes={notes} />,
          },
        ]}
      />
    </Screen>
  );
}
