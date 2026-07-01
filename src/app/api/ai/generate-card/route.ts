import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt = "premium business card" } = await request.json().catch(() => ({}));

  return NextResponse.json({
    prompt,
    layout: "asymmetric-luxury-grid",
    palette: ["#07080d", "#f8fafc", "#2dd4bf", "#f5d36d"],
    typography: { heading: "Geist", body: "Inter", mood: "editorial and precise" },
    elements: [
      { type: "text", name: "Brand lockup", x: 84, y: 62 },
      { type: "image", name: "Photo focal area", x: 390, y: 58 },
      { type: "qr", name: "Smart QR", x: 468, y: 248 },
    ],
    productionNotes: ["Use 3mm bleed", "Foil only on brand mark", "Keep text inside safe area"],
  });
}
