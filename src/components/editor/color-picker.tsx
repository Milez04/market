"use client";

import { Pipette } from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Hsv = {
  h: number;
  s: number;
  v: number;
};

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToHsv(hex: string): Hsv {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean.padEnd(6, "0");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function hsvToHex({ h, s, v }: Hsv) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] =
    h < 60 ? [c, x, 0] :
    h < 120 ? [x, c, 0] :
    h < 180 ? [0, c, x] :
    h < 240 ? [0, x, c] :
    h < 300 ? [x, 0, c] :
    [c, 0, x];

  return `#${[r, g, b]
    .map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const hsv = useMemo(() => hexToHsv(value), [value]);
  const hueColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });

  function updateFromPointer(event: React.PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const s = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const v = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    onChange(hsvToHex({ h: hsv.h, s, v }));
  }

  async function pickScreenColor() {
    const EyeDropper = (window as Window & { EyeDropper?: EyeDropperConstructor }).EyeDropper;
    if (!EyeDropper) return;
    const result = await new EyeDropper().open();
    onChange(result.sRGBHex.toUpperCase());
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        aria-label="Choose saturation and brightness"
        className="relative h-28 overflow-hidden rounded-lg border"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) updateFromPointer(event);
        }}
      >
        <span
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
        />
      </button>

      <input
        aria-label="Hue"
        type="range"
        min={0}
        max={360}
        value={Math.round(hsv.h)}
        onChange={(event) => onChange(hsvToHex({ ...hsv, h: Number(event.target.value) }))}
        className="h-4 w-full cursor-pointer appearance-none rounded-full border bg-[linear-gradient(to_right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)]"
      />

      <div className="grid grid-cols-[1fr_42px] gap-2">
        <label className="grid grid-cols-[28px_1fr] items-center gap-2 rounded-lg border bg-background/70 px-2">
          <span className="h-5 w-5 rounded-full border" style={{ backgroundColor: value }} />
          <Input
            value={value.toUpperCase()}
            onChange={(event) => {
              const next = event.target.value.startsWith("#") ? event.target.value : `#${event.target.value}`;
              if (/^#[0-9a-fA-F]{0,6}$/.test(next)) onChange(next.toUpperCase());
            }}
            className="border-0 bg-transparent px-0 font-mono focus:ring-0"
            maxLength={7}
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={pickScreenColor}
          disabled={typeof window !== "undefined" && !("EyeDropper" in window)}
        >
          <Pipette className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
