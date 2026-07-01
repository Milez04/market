import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const ELEMENTS_DIR = path.join(process.cwd(), "public", "cardforge-elements");
const IMAGE_EXTENSIONS = new Set([".png", ".webp", ".jpg", ".jpeg", ".svg"]);

export async function GET() {
  try {
    const entries = await readdir(ELEMENTS_DIR, { withFileTypes: true });
    const assets = entries
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((entry) => ({
        name: path.parse(entry.name).name,
        source: `/cardforge-elements/${encodeURIComponent(entry.name)}`,
      }));

    return NextResponse.json({ assets });
  } catch {
    return NextResponse.json({ assets: [] });
  }
}
