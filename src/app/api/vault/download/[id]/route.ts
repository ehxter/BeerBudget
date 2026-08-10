import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const VAULT_DIR = path.join(process.cwd(), ".vault");

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await readSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;

  const fileRecord = await prisma.vaultFile.findUnique({
    where: { id },
  });

  if (!fileRecord || fileRecord.userId !== session.userId) {
    return new NextResponse("Not Found or Unauthorized", { status: 404 });
  }

  const filePath = path.join(VAULT_DIR, fileRecord.storedName);

  if (!fs.existsSync(filePath)) {
    return new NextResponse("File missing on disk", { status: 404 });
  }

  const fileStream = fs.createReadStream(filePath);

  return new NextResponse(fileStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": fileRecord.mimeType,
      "Content-Disposition": `attachment; filename="${fileRecord.filename}"`,
    },
  });
}
