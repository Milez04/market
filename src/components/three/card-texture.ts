import { CanvasTexture, SRGBColorSpace } from "three";
import type { CardFinish, DesignerElement } from "@/types/card";

export function createCardTexture(
  elements: DesignerElement[],
  side: "front" | "back",
  finish: CardFinish,
  cardColor: string,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 700;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, side === "front" ? cardColor : "#f8fafc");
  gradient.addColorStop(0.58, side === "front" ? cardColor : "#e0f2fe");
  gradient.addColorStop(1, side === "front" ? "#0f766e" : "#fce7f3");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#ffffff";
  for (let x = 0; x < canvas.width; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 180, canvas.height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = side === "front" ? "#f8fafc" : "#111827";
  ctx.font = "700 64px Inter, Arial";
  ctx.fillText(side === "front" ? "CardForge" : "Print Ready", 110, 150);
  ctx.font = "400 32px Inter, Arial";
  ctx.fillText(side === "front" ? "Premium cards, forged in 3D" : "CMYK . 300 DPI . 3mm bleed", 112, 206);

  elements.forEach((element) => {
    ctx.save();
    ctx.translate(element.x * 2, element.y * 2);
    ctx.rotate((element.rotation * Math.PI) / 180);
    if (element.type === "image") {
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.roundRect(0, 0, element.width * 2, element.height * 2, 28);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "500 24px Inter, Arial";
      ctx.fillText("Photo", 36, 88);
    } else if (element.type === "qr" || element.type === "barcode") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, element.width * 2, element.height * 2);
      ctx.fillStyle = "#101113";
      for (let i = 8; i < element.width * 2 - 8; i += 18) {
        ctx.fillRect(i, 8, 9, element.height * 2 - 16);
      }
    } else if (element.type === "shape") {
      ctx.fillStyle = element.fill ?? "#f5d36d";
      ctx.roundRect(0, 0, element.width * 2, element.height * 2, 24);
      ctx.fill();
    } else {
      ctx.fillStyle = element.fill ?? (finish === "foil" ? "#f5d36d" : side === "front" ? "#ffffff" : "#111827");
      ctx.font = element.name === "Headline" ? "700 44px Inter, Arial" : "600 30px Inter, Arial";
      ctx.fillText(element.name, 0, element.name === "Headline" ? 42 : 30);
    }
    ctx.restore();
  });

  if (finish === "spot-uv" || finish === "foil") {
    const shine = ctx.createLinearGradient(0, 0, canvas.width, 0);
    shine.addColorStop(0, "rgba(255,255,255,0)");
    shine.addColorStop(0.5, finish === "foil" ? "rgba(255,220,120,0.28)" : "rgba(255,255,255,0.18)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
