import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const VAULT_DIR = path.join(process.cwd(), ".vault");

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const vaultItemId = formData.get("vaultItemId") as string;

    if (!file || !vaultItemId) {
      return NextResponse.json({ error: "Missing file or vaultItemId" }, { status: 400 });
    }

    // Verify vault item belongs to user
    const vaultItem = await prisma.privateVaultItem.findUnique({
      where: { id: vaultItemId },
    });

    if (!vaultItem || vaultItem.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized or not found" }, { status: 403 });
    }

    // Ensure .vault dir exists
    await fs.mkdir(VAULT_DIR, { recursive: true });

    // Read file and save to disk with random name
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const storedName = crypto.randomBytes(16).toString("hex") + path.extname(file.name);
    const filePath = path.join(VAULT_DIR, storedName);

    await fs.writeFile(filePath, buffer);

    // Save record in DB
    const record = await prisma.vaultFile.create({
      data: {
        vaultItemId,
        userId: session.userId,
        filename: file.name,
        storedName,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      },
    });

    return NextResponse.json({ success: true, file: record });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
