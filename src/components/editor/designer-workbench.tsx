"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Canvas as FabricCanvas, Circle, FabricImage, Point, Rect, Shadow, Textbox, type FabricObject } from "fabric";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Box,
  Download,
  Grid2X2,
  ImagePlus,
  Italic,
  LinkIcon,
  Minus,
  Palette,
  Plus,
  Redo2,
  Shapes,
  Trash2,
  Type,
  Underline,
  Undo2,
  UploadCloud,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/ui/shell";
import { ColorPicker } from "@/components/editor/color-picker";
import { getStoredToken, getStoredUser, phpRequest } from "@/lib/php-api";
import { useDesignerStore } from "@/store/designer-store";
import type { DesignerElement } from "@/types/card";

type Panel = "templates" | "elements" | "text" | "brand" | "uploads" | "projects";
type SelectedKind = "text" | "image" | "shape" | "group" | null;
type UploadedAsset = {
  id: string;
  name: string;
  source: string;
};
type ElementAsset = {
  name: string;
  source: string;
};
type CardTemplate = {
  id: "studio" | "wedding" | "vip" | "member" | "event" | "minimal";
  name: string;
  category: string;
  background: string;
  accent: string;
  preview: string;
};

const cardColors = ["#0b1120", "#003b63", "#0f5132", "#7f1d1d", "#312e81", "#ffffff", "#fff7ed", "#fdf2f8"];
const fonts = ["Montserrat", "Geist", "Arial", "Georgia", "Times New Roman", "Courier New"];
const CARD_W = 1048;
const CARD_H = 590;
const CARD_X = 0;
const CARD_Y = 0;
const WORKSPACE_W = CARD_W;
const WORKSPACE_H = CARD_H;
const WHATSAPP_PHONE = "77022648901";
const cardTemplates: CardTemplate[] = [
  {
    id: "studio",
    name: "Executive Studio",
    category: "Business",
    background: "#0b1120",
    accent: "#00b7c7",
    preview: "linear-gradient(135deg, #0b1120 0 46%, #0b4a6f 46% 64%, #f8fafc 64% 74%, #083855 74% 100%)",
  },
  {
    id: "wedding",
    name: "Soft Vows",
    category: "Wedding",
    background: "#fff7ed",
    accent: "#be6f61",
    preview: "radial-gradient(circle at 18% 20%, #f7c9bd 0 12%, transparent 13%), linear-gradient(135deg, #fff7ed 0 52%, #f2c9bd 52% 54%, #ffffff 54% 100%)",
  },
  {
    id: "vip",
    name: "Black Gold",
    category: "VIP",
    background: "#09090b",
    accent: "#d7b46a",
    preview: "linear-gradient(135deg, #09090b 0 54%, #d7b46a 54% 57%, #1f1f22 57% 100%)",
  },
  {
    id: "member",
    name: "Member Pass",
    category: "Membership",
    background: "#eef6ff",
    accent: "#2563eb",
    preview: "linear-gradient(135deg, #eef6ff 0 42%, #2563eb 42% 66%, #0f172a 66% 100%)",
  },
  {
    id: "event",
    name: "Neon Event",
    category: "Event",
    background: "#111827",
    accent: "#a855f7",
    preview: "radial-gradient(circle at 78% 24%, #22d3ee 0 14%, transparent 15%), linear-gradient(135deg, #111827 0 45%, #a855f7 45% 68%, #ec4899 68% 100%)",
  },
  {
    id: "minimal",
    name: "Clean Identity",
    category: "ID",
    background: "#ffffff",
    accent: "#111827",
    preview: "linear-gradient(90deg, #111827 0 28%, #ffffff 28% 100%)",
  },
];

const railItems: { id: Panel; label: string; icon: typeof Grid2X2 }[] = [
  { id: "templates", label: "Templates", icon: Grid2X2 },
  { id: "elements", label: "Elements", icon: Shapes },
  { id: "text", label: "Text", icon: Type },
  { id: "brand", label: "Brand", icon: Palette },
  { id: "uploads", label: "Uploads", icon: UploadCloud },
  { id: "projects", label: "Projects", icon: Box },
];

function getObjectKind(object: FabricObject | undefined): SelectedKind {
  if (!object) return null;
  if (object.type === "textbox" || object.type === "text" || object.type === "i-text") return "text";
  if (object.type === "image") return "image";
  if (object.type === "activeSelection" || object.type === "group") return "group";
  return "shape";
}

function getObjectId(object: FabricObject | undefined) {
  return String((object as FabricObject & { cfId?: string } | undefined)?.cfId ?? "");
}

function createCardBackground(fill: string) {
  const background = new Rect({
    left: 0,
    top: 0,
    originX: "left",
    originY: "top",
    width: CARD_W,
    height: CARD_H,
    rx: 34,
    ry: 34,
    fill,
    selectable: false,
    evented: false,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
  });
  Object.assign(background, { cfId: "card-bg" });
  return background;
}

function createTemplateDesign(template: CardTemplate) {
  const objects: FabricObject[] = [];
  const elements: DesignerElement[] = [];

  function register(object: FabricObject, id: string, name: string, type: DesignerElement["type"]) {
    Object.assign(object, { cfId: id });
    objects.push(object);
    elements.push({
      id,
      type,
      name,
      x: Number(object.left ?? 0),
      y: Number(object.top ?? 0),
      width: Number(object.getScaledWidth()),
      height: Number(object.getScaledHeight()),
      rotation: Number(object.angle ?? 0),
    });
  }

  if (template.id === "studio") {
    register(new Rect({ left: 572, top: -98, width: 380, height: 260, fill: "#064b73", angle: 45, shadow: new Shadow({ color: "rgba(15,23,42,0.28)", blur: 30, offsetY: 18 }) }), "studio-top-cut", "Top glass cut", "shape");
    register(new Rect({ left: 660, top: 322, width: 430, height: 220, fill: "#064b73", angle: -42 }), "studio-bottom-cut", "Bottom ribbon", "shape");
    register(new Rect({ left: 676, top: 282, width: 160, height: 220, fill: "#f8fafc", angle: -42, shadow: new Shadow({ color: "rgba(15,23,42,0.22)", blur: 28, offsetY: 14 }) }), "studio-white-cut", "White print block", "shape");
    register(new Circle({ left: 88, top: 86, radius: 36, fill: "#12b9c9" }), "studio-mark", "Brand mark", "shape");
    register(new Textbox("KOMMERCIALANDYRU\nOFISININ ORYNDAGAN\nZHUMYSTARY", { left: 300, top: 230, width: 410, fill: "#0a5a82", fontFamily: "Montserrat", fontSize: 29, fontWeight: "700", lineHeight: 1.08 }), "studio-headline", "Headline", "text");
    register(new Textbox("2024-2025 OKU ZHYLY", { left: 230, top: 406, width: 360, fill: "#0a5a82", fontFamily: "Montserrat", fontSize: 24, fontWeight: "700" }), "studio-year", "Year", "text");
    register(new Textbox("Bayandamashy\nISAKOV AZAT\nKommertsiyalanduru ofisinin direktory", { left: 230, top: 466, width: 360, fill: "#0a5a82", fontFamily: "Montserrat", fontSize: 16, lineHeight: 1.45 }), "studio-author", "Author", "text");
  }

  if (template.id === "wedding") {
    register(new Circle({ left: 792, top: -80, radius: 180, fill: "#f7c9bd", opacity: 0.72 }), "wedding-orb", "Soft floral wash", "shape");
    register(new Rect({ left: 702, top: 0, width: 2, height: CARD_H, fill: "#be6f61", opacity: 0.65 }), "wedding-divider", "Fine divider", "shape");
    register(new Circle({ left: 128, top: 80, radius: 58, fill: "#f4b8a9", opacity: 0.55 }), "wedding-seal", "Invitation seal", "shape");
    register(new Textbox("Ayla & Deniz", { left: 280, top: 180, width: 500, fill: "#5f342e", fontFamily: "Georgia", fontSize: 64, fontWeight: "400" }), "wedding-title", "Couple names", "text");
    register(new Textbox("Together with their families invite you to celebrate their wedding", { left: 230, top: 274, width: 430, fill: "#8a5b52", fontFamily: "Montserrat", fontSize: 20, lineHeight: 1.35 }), "wedding-copy", "Invitation copy", "text");
    register(new Textbox("18 AUGUST 2026  |  ISTANBUL", { left: 230, top: 416, width: 430, fill: "#be6f61", fontFamily: "Montserrat", fontSize: 18, fontWeight: "700" }), "wedding-date", "Wedding date", "text");
  }

  if (template.id === "vip") {
    register(new Rect({ left: 0, top: 0, width: CARD_W, height: 78, fill: "#d7b46a" }), "vip-strip", "Gold header", "shape");
    register(new Rect({ left: 690, top: -44, width: 280, height: 700, fill: "#18181b", angle: -18 }), "vip-shadow-panel", "Premium panel", "shape");
    register(new Textbox("VIP", { left: 250, top: 142, width: 330, fill: "#d7b46a", fontFamily: "Montserrat", fontSize: 112, fontWeight: "700" }), "vip-title", "VIP title", "text");
    register(new Textbox("ACCESS PASS", { left: 200, top: 286, width: 360, fill: "#f8fafc", fontFamily: "Montserrat", fontSize: 32, fontWeight: "700", charSpacing: 120 }), "vip-subtitle", "Access pass", "text");
    register(new Textbox("CARD NO. 0098  |  LOUNGE  A", { left: 230, top: 464, width: 420, fill: "#d7b46a", fontFamily: "Montserrat", fontSize: 18, fontWeight: "600" }), "vip-meta", "VIP metadata", "text");
  }

  if (template.id === "member") {
    register(new Rect({ left: -120, top: 0, width: 420, height: CARD_H, fill: "#2563eb", angle: 0 }), "member-sidebar", "Blue sidebar", "shape");
    register(new Rect({ left: 666, top: 88, width: 260, height: 220, rx: 22, ry: 22, fill: "#dbeafe" }), "member-photo", "Photo area", "image");
    register(new Textbox("MEMBER", { left: 240, top: 90, width: 300, fill: "#c5c5db", fontFamily: "Montserrat", fontSize: 48, fontWeight: "800" }), "member-title", "Member label", "text");
    register(new Textbox("PREMIUM CLUB", { left: 450, top: 119, width: 360, fill: "#0f172a", fontFamily: "Montserrat", fontSize: 28, fontWeight: "700" }), "member-club", "Club name", "text");
    register(new Textbox("Nora Kaya\nID  8452 9910\nValid thru 12/28", { left: 230, top: 450, width: 360, fill: "#334155", fontFamily: "Montserrat", fontSize: 22, lineHeight: 1.55 }), "member-info", "Member info", "text");
  }

  if (template.id === "event") {
    register(new Circle({ left: 760, top: 80, radius: 96, fill: "#22d3ee", opacity: 0.82 }), "event-cyan", "Cyan glow", "shape");
    register(new Circle({ left: 836, top: 270, radius: 130, fill: "#ec4899", opacity: 0.58 }), "event-pink", "Pink glow", "shape");
    register(new Rect({ left: 54, top: 78, width: 10, height: 430, fill: "#a855f7" }), "event-line", "Neon rail", "shape");
    register(new Textbox("NIGHT\nMARKET", { left: 280, top: 112, width: 430, fill: "#f8fafc", fontFamily: "Montserrat", fontSize: 72, fontWeight: "800", lineHeight: 0.92 }), "event-title", "Event title", "text");
    register(new Textbox("Music  Food  Design  Pop-up stores", { left: 280, top: 320, width: 500, fill: "#c4b5fd", fontFamily: "Montserrat", fontSize: 22, fontWeight: "600" }), "event-copy", "Event copy", "text");
    register(new Textbox("SATURDAY 21:00  |  CENTRAL HALL", { left: 280, top: 444, width: 500, fill: "#22d3ee", fontFamily: "Montserrat", fontSize: 20, fontWeight: "700" }), "event-date", "Event date", "text");
  }

  if (template.id === "minimal") {
    register(new Rect({ left: 0, top: 0, width: 288, height: CARD_H, fill: "#111827" }), "minimal-sidebar", "Identity sidebar", "shape");
    register(new Circle({ left: 82, top: 82, radius: 52, fill: "#ffffff" }), "minimal-photo", "Profile mark", "image");
    register(new Textbox("ELIF\nYILMAZ", { left: 400, top: 118, width: 430, fill: "#111827", fontFamily: "Montserrat", fontSize: 56, fontWeight: "800", lineHeight: 0.95 }), "minimal-name", "Name", "text");
    register(new Textbox("SENIOR PRODUCT DESIGNER", { left: 404, top: 270, width: 420, fill: "#64748b", fontFamily: "Montserrat", fontSize: 18, fontWeight: "700", charSpacing: 80 }), "minimal-role", "Role", "text");
    register(new Textbox("elif@cardforge.studio\n+90 555 019 0021\ncardforge.studio", { left: 404, top: 390, width: 420, fill: "#334155", fontFamily: "Montserrat", fontSize: 20, lineHeight: 1.6 }), "minimal-contact", "Contact", "text");
  }

  return { objects, elements };
}

export function DesignerWorkbench({ projectId }: { projectId: string }) {
  const router = useRouter();
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const canvasHistoryRef = useRef<string[]>([]);
  const canvasHistoryIndexRef = useRef(-1);
  const isRestoringHistoryRef = useRef(false);
  const copiedObjectRef = useRef<FabricObject | null>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const autoSaveReadyRef = useRef(false);
  const autoSaveInFlightRef = useRef(false);
  const pendingAutoSaveRef = useRef(false);
  const currentProjectIdRef = useRef(projectId);
  const sideDesignsRef = useRef<{ front: string | null; back: string | null }>({ front: null, back: null });
  const mirrorSidesRef = useRef(false);
  const sideRef = useRef<"front" | "back">("front");
  const [activePanel, setActivePanel] = useState<Panel | null>("templates");
  const [selectedKind, setSelectedKind] = useState<SelectedKind>(null);
  const [selectedFill, setSelectedFill] = useState("#FFFFFF");
  const [selectedFontSize, setSelectedFontSize] = useState(28);
  const [selectedFontFamily, setSelectedFontFamily] = useState("Montserrat");
  const [selectedOpacity, setSelectedOpacity] = useState(100);
  const [selectedFontWeight, setSelectedFontWeight] = useState<string | number>("400");
  const [selectedFontStyle, setSelectedFontStyle] = useState("normal");
  const [selectedUnderline, setSelectedUnderline] = useState(false);
  const [selectedTextAlign, setSelectedTextAlign] = useState("left");
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);
  const [elementAssets, setElementAssets] = useState<ElementAsset[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState(projectId);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [mirrorSides, setMirrorSides] = useState(false);
  const [brandColorBothSides, setBrandColorBothSides] = useState(false);
  const [sidePreviews, setSidePreviews] = useState<{ front: string; back: string }>({ front: "", back: "" });
  const { setTheme } = useTheme();
  const {
    side,
    zoom,
    cardColor,
    setSelectedId,
    addElement,
    removeElement,
    setElements,
    flipSide,
    setZoom,
    setCardColor,
  } = useDesignerStore();

  useEffect(() => {
    setTheme("light");
  }, [setTheme]);

  useEffect(() => {
    currentProjectIdRef.current = currentProjectId;
  }, [currentProjectId]);

  useEffect(() => {
    mirrorSidesRef.current = mirrorSides;
  }, [mirrorSides]);

  useEffect(() => {
    sideRef.current = side;
  }, [side]);

  useEffect(() => {
    if (!getStoredUser() || !getStoredToken()) {
      toast.error("Login first to open the editor");
      router.replace("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    const saved = window.localStorage.getItem("cardforge.uploads");
    if (saved) setUploadedAssets(JSON.parse(saved) as UploadedAsset[]);
  }, []);

  useEffect(() => {
    fetch("/api/element-assets")
      .then((response) => response.json() as Promise<{ assets: ElementAsset[] }>)
      .then((data) => setElementAssets(data.assets))
      .catch(() => setElementAssets([]));
  }, []);

  function saveUploadedAsset(asset: UploadedAsset) {
    setUploadedAssets((current) => {
      const next = [asset, ...current.filter((item) => item.source !== asset.source)].slice(0, 24);
      window.localStorage.setItem("cardforge.uploads", JSON.stringify(next));
      return next;
    });
  }

  function deleteUploadedAsset(id: string) {
    setUploadedAssets((current) => {
      const next = current.filter((item) => item.id !== id);
      window.localStorage.setItem("cardforge.uploads", JSON.stringify(next));
      return next;
    });
  }

  function activeObject() {
    return fabricRef.current?.getActiveObject();
  }

  function clearCanvasSelection() {
    const canvas = fabricRef.current;
    if (!canvas?.getActiveObject()) return;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelection(undefined);
  }

  function syncSelection(object = activeObject()) {
    setSelectedKind(getObjectKind(object));
    setSelectedId(getObjectId(object) || null);
    const record = object as FabricObject & {
      fill?: string;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string | number;
      fontStyle?: string;
      underline?: boolean;
      textAlign?: string;
      opacity?: number;
    } | undefined;
    if (typeof record?.fill === "string") setSelectedFill(record.fill);
    if (typeof record?.fontFamily === "string") setSelectedFontFamily(record.fontFamily);
    if (typeof record?.fontSize === "number") setSelectedFontSize(record.fontSize);
    if (record?.fontWeight) setSelectedFontWeight(record.fontWeight);
    if (record?.fontStyle) setSelectedFontStyle(record.fontStyle);
    if (typeof record?.underline === "boolean") setSelectedUnderline(record.underline);
    if (record?.textAlign) setSelectedTextAlign(record.textAlign);
    if (typeof record?.opacity === "number") setSelectedOpacity(Math.round(record.opacity * 100));
  }

  function saveCanvasHistory(canvas = fabricRef.current) {
    if (!canvas || isRestoringHistoryRef.current) return;
    const snapshot = JSON.stringify(canvas.toObject(["cfId"]));
    const history = canvasHistoryRef.current;
    if (history[canvasHistoryIndexRef.current] === snapshot) return;
    canvasHistoryRef.current = history.slice(0, canvasHistoryIndexRef.current + 1).concat(snapshot).slice(-80);
    canvasHistoryIndexRef.current = canvasHistoryRef.current.length - 1;
    const activeSide = sideRef.current;
    sideDesignsRef.current[activeSide] = snapshot;
    updateSidePreview(activeSide);
    if (mirrorSidesRef.current && activeSide === "front") {
      sideDesignsRef.current.back = snapshot;
      updateSidePreview("back");
    }
    scheduleAutoSave();
  }

  function scheduleAutoSave() {
    if (!autoSaveReadyRef.current) return;
    if (autoSaveTimeoutRef.current) window.clearTimeout(autoSaveTimeoutRef.current);
    setAutoSaveStatus("idle");
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      void autoSaveProject();
    }, 1600);
  }

  async function autoSaveProject() {
    if (autoSaveInFlightRef.current) {
      pendingAutoSaveRef.current = true;
      return;
    }
    autoSaveInFlightRef.current = true;
    setAutoSaveStatus("saving");
    const saved = await saveProject({ silent: true });
    autoSaveInFlightRef.current = false;
    if (saved) setAutoSaveStatus("saved");
    if (pendingAutoSaveRef.current) {
      pendingAutoSaveRef.current = false;
      scheduleAutoSave();
    }
  }

  async function restoreCanvasSnapshot(index: number) {
    const canvas = fabricRef.current;
    const snapshot = canvasHistoryRef.current[index];
    if (!canvas || !snapshot) return;
    isRestoringHistoryRef.current = true;
    canvas.discardActiveObject();
    await canvas.loadFromJSON(snapshot);
    canvas.renderAll();
    canvasHistoryIndexRef.current = index;
    const backgroundFill = getCardBackgroundFill(canvas) ?? cardColor;
    setCardColor(backgroundFill);
    stabilizeCardStack(canvas, backgroundFill);
    isRestoringHistoryRef.current = false;
    syncSelection(undefined);
  }

  async function loadSavedProject(id: string, canvas = fabricRef.current) {
    if (!canvas || id === "new" || Number.isNaN(Number(id))) return;
    try {
      const data = await phpRequest<{ project: { design_json?: string } }>(`/projects/get.php?id=${encodeURIComponent(id)}`);
      if (!data.project.design_json) return;
      isRestoringHistoryRef.current = true;
      canvas.discardActiveObject();
      const parsed = JSON.parse(data.project.design_json) as { sides?: { front?: string; back?: string } };
      const frontJson = parsed.sides?.front ?? data.project.design_json;
      const backJson = parsed.sides?.back ?? null;
      sideDesignsRef.current = { front: frontJson, back: backJson };
      await canvas.loadFromJSON(sideDesignsRef.current[sideRef.current] ?? frontJson);
      const backgroundFill = getCardBackgroundFill(canvas) ?? cardColor;
      setCardColor(backgroundFill);
      stabilizeCardStack(canvas, backgroundFill);
      canvas.renderAll();
      isRestoringHistoryRef.current = false;
      saveCanvasHistory(canvas);
      syncSelection(undefined);
    } catch {
      isRestoringHistoryRef.current = false;
    }
  }

  function undoCanvas() {
    const nextIndex = canvasHistoryIndexRef.current - 1;
    if (nextIndex >= 0) void restoreCanvasSnapshot(nextIndex);
  }

  function redoCanvas() {
    const nextIndex = canvasHistoryIndexRef.current + 1;
    if (nextIndex < canvasHistoryRef.current.length) void restoreCanvasSnapshot(nextIndex);
  }

  function updateActive(props: Record<string, string | number | boolean>) {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    object.set(props);
    object.setCoords();
    canvas.requestRenderAll();
    syncSelection(object);
    saveCanvasHistory(canvas);
  }

  function stabilizeCardStack(canvas = fabricRef.current, backgroundFill = cardColor) {
    if (!canvas) return;
    const background = getCardBackground(canvas);
    if (background) {
      background.set({
        fill: backgroundFill,
        selectable: false,
        evented: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
      });
      canvas.sendObjectToBack(background);
    }
    applyCardClip(canvas);
  }

  function getCardBackground(canvas = fabricRef.current) {
    return canvas?.getObjects().find((object) => getObjectId(object) === "card-bg");
  }

  function getCardBackgroundFill(canvas = fabricRef.current) {
    const fill = (getCardBackground(canvas) as FabricObject & { fill?: unknown } | undefined)?.fill;
    return typeof fill === "string" ? fill : null;
  }

  function captureCurrentSide() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const snapshot = JSON.stringify(canvas.toObject(["cfId"]));
    const activeSide = sideRef.current;
    sideDesignsRef.current[activeSide] = snapshot;
    updateSidePreview(activeSide);
    if (mirrorSidesRef.current && activeSide === "front") {
      sideDesignsRef.current.back = snapshot;
      updateSidePreview("back");
    }
  }

  function updateSidePreview(targetSide = side) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const preview = canvas.toDataURL({
      format: "png",
      multiplier: 0.16,
      left: CARD_X,
      top: CARD_Y,
      width: CARD_W,
      height: CARD_H,
      enableRetinaScaling: false,
    });
    setSidePreviews((current) => ({ ...current, [targetSide]: preview }));
  }

  async function updateSidePreviewFromSnapshot(targetSide: "front" | "back", snapshot: string) {
    const canvasElement = document.createElement("canvas");
    const canvas = new FabricCanvas(canvasElement, {
      width: CARD_W,
      height: CARD_H,
      backgroundColor: "transparent",
      enableRetinaScaling: false,
      preserveObjectStacking: true,
    });
    await canvas.loadFromJSON(snapshot);
    canvas.renderAll();
    const preview = canvas.toDataURL({
      format: "png",
      multiplier: 0.16,
      left: CARD_X,
      top: CARD_Y,
      width: CARD_W,
      height: CARD_H,
      enableRetinaScaling: false,
    });
    canvas.dispose();
    setSidePreviews((current) => ({ ...current, [targetSide]: preview }));
  }

  function setSnapshotBackground(snapshot: string, fill: string) {
    const parsed = JSON.parse(snapshot) as { objects?: Array<{ cfId?: string; fill?: string }> };
    const background = parsed.objects?.find((object) => object.cfId === "card-bg");
    if (background) background.fill = fill;
    return JSON.stringify(parsed);
  }

  function createBlankSideSnapshot(fill: string) {
    const canvasElement = document.createElement("canvas");
    const canvas = new FabricCanvas(canvasElement, {
      width: CARD_W,
      height: CARD_H,
      backgroundColor: "transparent",
      enableRetinaScaling: false,
      preserveObjectStacking: true,
    });
    canvas.add(createCardBackground(fill));
    const snapshot = JSON.stringify(canvas.toObject(["cfId"]));
    canvas.dispose();
    return snapshot;
  }

  function handleCardColorChange(fill: string) {
    const canvas = fabricRef.current;
    setCardColor(fill);
    if (!canvas) return;
    const background = getCardBackground(canvas);
    background?.set({ fill });
    canvas.requestRenderAll();
    saveCanvasHistory(canvas);
    if (!brandColorBothSides) return;
    const otherSide = side === "front" ? "back" : "front";
    const otherSnapshot = sideDesignsRef.current[otherSide];
    const nextSnapshot = otherSnapshot ? setSnapshotBackground(otherSnapshot, fill) : createBlankSideSnapshot(fill);
    sideDesignsRef.current[otherSide] = nextSnapshot;
    void updateSidePreviewFromSnapshot(otherSide, nextSnapshot);
  }

  async function loadSideDesign(nextSide: "front" | "back") {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const snapshot = sideDesignsRef.current[nextSide];
    isRestoringHistoryRef.current = true;
    canvas.discardActiveObject();
    if (snapshot) {
      await canvas.loadFromJSON(snapshot);
      const backgroundFill = getCardBackgroundFill(canvas) ?? "#ffffff";
      setCardColor(backgroundFill);
      stabilizeCardStack(canvas, backgroundFill);
    } else {
      canvas.clear();
      const background = createCardBackground("#ffffff");
      canvas.add(background);
      setElements([]);
      setCardColor("#ffffff");
      stabilizeCardStack(canvas, "#ffffff");
    }
    canvas.renderAll();
    isRestoringHistoryRef.current = false;
    const loadedSnapshot = JSON.stringify(canvas.toObject(["cfId"]));
    sideDesignsRef.current[nextSide] = loadedSnapshot;
    canvasHistoryRef.current = [loadedSnapshot];
    canvasHistoryIndexRef.current = 0;
    updateSidePreview(nextSide);
    syncSelection(undefined);
  }

  function selectSide(nextSide: "front" | "back") {
    if (nextSide === sideRef.current) return;
    captureCurrentSide();
    sideRef.current = nextSide;
    flipSide();
    void loadSideDesign(nextSide);
  }

  function toggleMirrorSides(checked: boolean) {
    mirrorSidesRef.current = checked;
    setMirrorSides(checked);
    if (checked) {
      captureCurrentSide();
      if (sideDesignsRef.current.front) {
        sideDesignsRef.current.back = sideDesignsRef.current.front;
      } else if (sideDesignsRef.current.back) {
        sideDesignsRef.current.front = sideDesignsRef.current.back;
      }
      if (side === "back") void loadSideDesign("back");
      saveCanvasHistory();
    }
  }

  function clearDesignObjects(canvas = fabricRef.current) {
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.getObjects()
      .filter((object) => getObjectId(object) !== "card-bg")
      .forEach((object) => canvas.remove(object));
  }

  function applyTemplate(template: CardTemplate) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    clearDesignObjects(canvas);
    const background = getCardBackground(canvas) ?? createCardBackground(template.background);
    if (!getCardBackground(canvas)) canvas.add(background);
    const { objects, elements: nextElements } = createTemplateDesign(template);
    canvas.add(...objects);
    setCardColor(template.background);
    setElements(nextElements);
    stabilizeCardStack(canvas, template.background);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelection(undefined);
    saveCanvasHistory(canvas);
  }

  function applyCardClip(canvas: FabricCanvas) {
    canvas.clipPath = new Rect({
      left: CARD_X,
      top: CARD_Y,
      originX: "left",
      originY: "top",
      width: CARD_W,
      height: CARD_H,
      rx: 34,
      ry: 34,
      absolutePositioned: true,
    });
  }

  function findTopObjectAt(canvas: FabricCanvas, point: Point) {
    return [...canvas.getObjects()]
      .reverse()
      .find((object) => getObjectId(object) !== "card-bg" && object.visible !== false && object.containsPoint(point));
  }

  function styleFabricCard(canvas: FabricCanvas) {
    const wrapper = canvas.wrapperEl;
    wrapper.style.borderRadius = "34px";
    wrapper.style.overflow = "hidden";
    wrapper.style.boxShadow = "0 18px 60px rgba(15,23,42,0.22)";
    wrapper.style.background = "transparent";
    wrapper.style.width = `${CARD_W}px`;
    wrapper.style.height = `${CARD_H}px`;
    wrapper.style.maxWidth = "none";
    wrapper.style.maxHeight = "none";
    wrapper.style.margin = "0 auto";
    canvas.lowerCanvasEl.style.width = `${CARD_W}px`;
    canvas.lowerCanvasEl.style.height = `${CARD_H}px`;
    canvas.upperCanvasEl.style.width = `${CARD_W}px`;
    canvas.upperCanvasEl.style.height = `${CARD_H}px`;
  }

  function findObjectInsideSelection(selection: FabricObject, point: Point) {
    const objects = (selection as FabricObject & { getObjects?: () => FabricObject[] }).getObjects?.() ?? [];
    return [...objects].reverse().find((object) => object.visible !== false && object.containsPoint(point));
  }

  useEffect(() => {
    autoSaveReadyRef.current = false;
    if (!canvasElementRef.current || fabricRef.current) return;
    const canvas = new FabricCanvas(canvasElementRef.current, {
      width: WORKSPACE_W,
      height: WORKSPACE_H,
      backgroundColor: "transparent",
      enableRetinaScaling: false,
      preserveObjectStacking: true,
      selectionColor: "rgba(139,92,246,0.12)",
      selectionBorderColor: "#8b5cf6",
      selectionLineWidth: 2,
    });
    fabricRef.current = canvas;
    styleFabricCard(canvas);
    applyCardClip(canvas);

    const initialCardColor = projectId === "new" ? "#ffffff" : cardColor;
    if (projectId === "new" && cardColor.toLowerCase() !== "#ffffff") {
      setCardColor("#ffffff");
    }
    const background = createCardBackground(initialCardColor);

    canvas.add(background);
    stabilizeCardStack(canvas, initialCardColor);
    canvas.on("selection:created", (event) => syncSelection(event.selected?.[0]));
    canvas.on("selection:updated", (event) => syncSelection(event.selected?.[0]));
    canvas.on("selection:cleared", () => syncSelection(undefined));
    const focusObjectFromSelection = (event: { e: MouseEvent | PointerEvent | TouchEvent; target?: FabricObject }) => {
      const current = canvas.getActiveObject();
      if (current?.type === "activeSelection") {
        const pointer = canvas.getScenePoint(event.e);
        const point = new Point(pointer.x, pointer.y);
        const target = findObjectInsideSelection(current, point)
          ?? (event.target && event.target !== current ? event.target : undefined)
          ?? findTopObjectAt(canvas, point);
        if (!target || target === current) return;
        canvas.discardActiveObject();
        canvas.setActiveObject(target);
        canvas.requestRenderAll();
        syncSelection(target);
      }
    };
    canvas.on("mouse:down", focusObjectFromSelection);
    canvas.on("mouse:up", (event) => {
      window.setTimeout(() => focusObjectFromSelection(event), 0);
    });
    canvas.on("object:modified", () => {
      syncSelection();
      saveCanvasHistory(canvas);
    });
    canvas.renderAll();
    setElements([]);
    syncSelection(undefined);
    saveCanvasHistory(canvas);
    void loadSavedProject(projectId, canvas);
    const readyTimer = window.setTimeout(() => {
      autoSaveReadyRef.current = true;
    }, 1000);

    return () => {
      window.clearTimeout(readyTimer);
      if (autoSaveTimeoutRef.current) window.clearTimeout(autoSaveTimeoutRef.current);
      canvas.dispose();
      fabricRef.current = null;
    };
  // Canvas is intentionally initialized once; subsequent updates are applied through Fabric events.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    stabilizeCardStack(canvas);
    canvas.renderAll();
  // Card color changes are applied to the Fabric canvas background.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardColor]);

  useHotkeys("mod+z", (event) => {
    event.preventDefault();
    if (event.shiftKey) redoCanvas();
    else undoCanvas();
  });
  useHotkeys("mod+y", (event) => {
    event.preventDefault();
    redoCanvas();
  });
  useHotkeys("mod+d", (event) => {
    event.preventDefault();
    void duplicateSelectedCanvas();
  });
  useHotkeys("mod+c", (event) => {
    event.preventDefault();
    void copySelectedCanvas();
  });
  useHotkeys("mod+v", (event) => {
    event.preventDefault();
    void pasteSelectedCanvas();
  });
  useHotkeys("backspace,delete", (event) => {
    event.preventDefault();
    deleteSelected();
  });

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const clipboard = event.clipboardData;
      if (!clipboard) return;
      const file = Array.from(clipboard.files).find((item) => item.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        uploadImage(file);
        return;
      }

      const htmlImage = extractImageSourceFromHtml(clipboard.getData("text/html"));
      if (htmlImage) {
        event.preventDefault();
        void addImageFromSource(htmlImage, "Pasted image");
        return;
      }

      const text = clipboard.getData("text/plain");
      if (!text) return;
      event.preventDefault();
      if (looksLikeImageSource(text)) void addImageFromSource(text.trim(), "Pasted image");
      else if (!activeObject()) addText(24, text);
    }

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  // Paste handler intentionally reads current canvas state through refs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addText(size = 30, text = "New headline") {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const id = crypto.randomUUID();
    const item = new Textbox(text, {
      left: CARD_X + 110,
      top: CARD_Y + 170,
      width: 360,
      fill: "#003b63",
      fontFamily: "Montserrat",
      fontSize: size,
      fontWeight: "700",
    });
    Object.assign(item, { cfId: id });
    canvas.add(item);
    stabilizeCardStack(canvas);
    canvas.setActiveObject(item);
    addElement({ id, type: "text", name: text, x: CARD_X + 110, y: CARD_Y + 170, width: 360, height: 50, rotation: 0 });
    syncSelection(item);
    saveCanvasHistory(canvas);
  }

  function addShape(fill = "#003b63") {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const id = crypto.randomUUID();
    const rect = new Rect({ left: CARD_X + 280, top: CARD_Y + 250, width: 190, height: 94, rx: 18, ry: 18, fill, opacity: 0.95 });
    Object.assign(rect, { cfId: id });
    canvas.add(rect);
    stabilizeCardStack(canvas);
    canvas.setActiveObject(rect);
    addElement({ id, type: "shape", name: "Shape", fill, x: CARD_X + 280, y: CARD_Y + 250, width: 190, height: 94, rotation: 0 });
    syncSelection(rect);
    saveCanvasHistory(canvas);
  }

  async function addImageFromSource(source: string, name = "Uploaded photo", options: { saveToUploads?: boolean } = {}) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const saveToUploads = options.saveToUploads ?? true;
    const id = crypto.randomUUID();
    const image = await FabricImage.fromURL(source, { crossOrigin: "anonymous" });
    image.set({ left: CARD_X + 560, top: CARD_Y + 92, cornerStyle: "circle" });
    image.scaleToWidth(320);
    Object.assign(image, { cfId: id });
    canvas.add(image);
    stabilizeCardStack(canvas);
    canvas.setActiveObject(image);
    canvas.renderAll();
    addElement({ id, type: "image", name, source, x: CARD_X + 560, y: CARD_Y + 92, width: 320, height: 220, rotation: 0 });
    if (saveToUploads && !source.startsWith("data:image/svg+xml")) saveUploadedAsset({ id, name, source });
    syncSelection(image);
    saveCanvasHistory(canvas);
  }

  function uploadImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a PNG, JPG, WebP or SVG image");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void addImageFromSource(String(reader.result), file.name);
    reader.readAsDataURL(file);
  }

  function addImageUrl() {
    const source = window.prompt("Paste a direct PNG, JPG, SVG, or WebP image URL");
    if (source) void addImageFromSource(source, "Image URL");
  }

  function looksLikeImageSource(value: string) {
    const source = value.trim();
    return (
      source.startsWith("data:image/") ||
      /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(source)
    );
  }

  function extractImageSourceFromHtml(html: string) {
    if (!html) return "";
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1] ?? "";
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const transfer = event.dataTransfer;
    const file = Array.from(transfer.files).find((item) => item.type.startsWith("image/"));
    if (file) {
      uploadImage(file);
      return;
    }

    const htmlImage = extractImageSourceFromHtml(transfer.getData("text/html"));
    const uri = transfer.getData("text/uri-list").split("\n").find((line) => line && !line.startsWith("#"));
    const text = transfer.getData("text/plain");
    const source = htmlImage || uri || text;
    if (source && (looksLikeImageSource(source) || htmlImage)) {
      void addImageFromSource(source.trim(), "Dropped image");
    }
  }

  function deleteSelected() {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object) return;
    const objects = canvas.getActiveObjects().filter((item) => getObjectId(item) !== "card-bg");
    if (!objects.length) return;
    objects.forEach((item) => {
      const id = getObjectId(item);
      canvas.remove(item);
      if (id) removeElement(id);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    syncSelection(undefined);
    saveCanvasHistory(canvas);
  }

  async function duplicateSelectedCanvas() {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || getObjectId(object) === "card-bg") return;
    const clone = await object.clone();
    const id = crypto.randomUUID();
    clone.set({ left: (object.left ?? 0) + 24, top: (object.top ?? 0) + 24 });
    Object.assign(clone, { cfId: id });
    canvas.add(clone);
    stabilizeCardStack(canvas);
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
    addElement({
      id,
      type: getObjectKind(clone) === "image" ? "image" : getObjectKind(clone) === "text" ? "text" : "shape",
      name: "Copy",
      x: Number(clone.left ?? 0),
      y: Number(clone.top ?? 0),
      width: Number(clone.width ?? 80),
      height: Number(clone.height ?? 40),
      rotation: Number(clone.angle ?? 0),
    });
    syncSelection(clone);
    saveCanvasHistory(canvas);
  }

  async function copySelectedCanvas() {
    const object = activeObject();
    if (!object || getObjectId(object) === "card-bg") return;
    copiedObjectRef.current = await object.clone();
  }

  async function pasteSelectedCanvas() {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (copiedObjectRef.current) {
      const clone = await copiedObjectRef.current.clone();
      const id = crypto.randomUUID();
      clone.set({
        left: (clone.left ?? 0) + 28,
        top: (clone.top ?? 0) + 28,
      });
      Object.assign(clone, { cfId: id });
      canvas.add(clone);
      stabilizeCardStack(canvas);
      canvas.setActiveObject(clone);
      canvas.requestRenderAll();
      addElement({
        id,
        type: getObjectKind(clone) === "image" ? "image" : getObjectKind(clone) === "text" ? "text" : "shape",
        name: "Pasted item",
        x: Number(clone.left ?? 0),
        y: Number(clone.top ?? 0),
        width: Number(clone.width ?? 80),
        height: Number(clone.height ?? 40),
        rotation: Number(clone.angle ?? 0),
      });
      syncSelection(clone);
      saveCanvasHistory(canvas);
      return;
    }

    const text = await navigator.clipboard?.readText().catch(() => "");
    if (text) addText(24, text);
  }

  function arrangeSelected(action: "front" | "back" | "forward" | "backward") {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || getObjectId(object) === "card-bg") return;

    stabilizeCardStack(canvas);

    if (action === "front") canvas.bringObjectToFront(object);
    if (action === "forward") canvas.bringObjectForward(object);
    if (action === "back") {
      canvas.moveObjectTo(object, 1);
    }
    if (action === "backward") {
      const currentIndex = canvas.getObjects().indexOf(object);
      if (currentIndex > 1) canvas.moveObjectTo(object, currentIndex - 1);
    }
    stabilizeCardStack(canvas);
    canvas.setActiveObject(object);
    object.setCoords();
    canvas.requestRenderAll();
    saveCanvasHistory(canvas);
  }

  function alignSelected(alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") {
    const canvas = fabricRef.current;
    const object = canvas?.getActiveObject();
    if (!canvas || !object || getObjectId(object) === "card-bg") return;
    const width = object.getScaledWidth();
    const height = object.getScaledHeight();
    const updates: Record<string, number> = {};
    if (alignment === "left") updates.left = CARD_X + 48;
    if (alignment === "center") updates.left = CARD_X + (CARD_W - width) / 2;
    if (alignment === "right") updates.left = CARD_X + CARD_W - width - 48;
    if (alignment === "top") updates.top = CARD_Y + 48;
    if (alignment === "middle") updates.top = CARD_Y + (CARD_H - height) / 2;
    if (alignment === "bottom") updates.top = CARD_Y + CARD_H - height - 48;
    object.set(updates);
    object.setCoords();
    canvas.requestRenderAll();
    saveCanvasHistory(canvas);
  }

  function exportPng() {
    void exportZip();
  }

  function downloadBlob(blob: Blob, filename: string) {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function getDesignJson() {
    captureCurrentSide();
    return JSON.stringify({
      version: 2,
      sides: {
        front: sideDesignsRef.current.front,
        back: sideDesignsRef.current.back,
      },
    });
  }

  async function renderSidePng(targetSide: "front" | "back", multiplier = 4) {
    captureCurrentSide();
    const snapshot = sideDesignsRef.current[targetSide];
    const canvasElement = document.createElement("canvas");
    const canvas = new FabricCanvas(canvasElement, {
      width: CARD_W,
      height: CARD_H,
      backgroundColor: "transparent",
      enableRetinaScaling: false,
      preserveObjectStacking: true,
    });
    if (snapshot) {
      await canvas.loadFromJSON(snapshot);
    } else {
      canvas.add(createCardBackground("#ffffff"));
    }
    canvas.renderAll();
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier,
      left: CARD_X,
      top: CARD_Y,
      width: CARD_W,
      height: CARD_H,
      enableRetinaScaling: false,
    });
    canvas.dispose();
    return dataUrl;
  }

  async function exportZip(filename = "cardforge-card-sides.zip") {
    const front = await renderSidePng("front", 4);
    const back = await renderSidePng("back", 4);
    downloadBlob(createZip([
      { name: "front.png", data: dataUrlToBytes(front) },
      { name: "back.png", data: dataUrlToBytes(back) },
    ]), filename);
  }

  async function saveProject(options: { silent?: boolean } = {}) {
    const user = getStoredUser();
    if (!user) {
      if (!options.silent) toast.error("Login first to save projects");
      return false;
    }
    const preview = await renderSidePng("front", 0.45);
    if (!preview) return false;
    const saveId = currentProjectIdRef.current;
    try {
      const data = await phpRequest<{ project: { id: number } }>("/projects/save.php", {
        method: "POST",
        body: JSON.stringify({
          id: saveId,
          title: saveId === "new" ? "Untitled card" : `Card #${saveId}`,
          preview,
          design_json: getDesignJson(),
        }),
      });
      if (saveId === "new") {
        const nextId = String(data.project.id);
        currentProjectIdRef.current = nextId;
        setCurrentProjectId(nextId);
        router.replace(`/designer/${nextId}`);
      }
      if (!options.silent) toast.success("Project saved to dashboard");
      return true;
    } catch (error) {
      if (!options.silent) toast.error(error instanceof Error ? error.message : "Project save failed");
      return false;
    }
  }

  async function orderViaWhatsapp() {
    const dashboardPreview = await renderSidePng("front", 0.45);

    const user = getStoredUser();
    const title = currentProjectId === "new" ? "New custom card" : `Card project ${currentProjectId}`;
    const whatsappText = [
      "Здравствуйте! Я хочу оформить заказ на печать карт через CardForge 3D.",
      `Проект: ${title}`,
      user ? `Клиент: ${user.name} (${user.email})` : "Клиент: гость",
      "Я прикреплю ZIP-файл с лицевой и обратной стороной к этому чату WhatsApp.",
    ].join("\n");

    if (user) {
      try {
        await phpRequest("/orders/create.php", {
          method: "POST",
          body: JSON.stringify({
            project_id: currentProjectId === "new" ? null : currentProjectId,
            title,
            preview: dashboardPreview,
            whatsapp_text: whatsappText,
          }),
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Order could not be saved, WhatsApp will still open");
      }
    }

    await exportZip("cardforge-whatsapp-order.zip");
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener,noreferrer");
  }
  return (
    <main
      className="grid h-screen overflow-hidden bg-[#eef0f4] text-slate-950"
      style={{ gridTemplateColumns: activePanel ? "76px 304px minmax(0, 1fr)" : "76px 0 minmax(0, 1fr)" }}
    >
      <aside className="flex flex-col items-center border-r border-slate-200 bg-[#f7f8fb] py-3">
        {railItems.map((item) => (
          <button
            key={item.id}
            className={`mb-1 flex h-[68px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
              activePanel === item.id ? "bg-white text-slate-950 shadow-sm ring-1 ring-violet-200" : "text-slate-600 hover:bg-white/70"
            }`}
            onClick={() => setActivePanel((current) => current === item.id ? null : item.id)}
          >
            <item.icon className="h-5 w-5" />
            <span className="max-w-[70px] truncate">{item.label}</span>
          </button>
        ))}
      </aside>

      <aside className={`min-h-0 overflow-y-auto border-r border-slate-200 bg-white ${activePanel ? "p-4 opacity-100" : "pointer-events-none p-0 opacity-0"}`}>
        {activePanel && (
          <PanelContent
            activePanel={activePanel}
            cardColor={cardColor}
            elementAssets={elementAssets}
            onAddText={addText}
            onAddShape={addShape}
            onAddImageUrl={addImageUrl}
            onAddElementAsset={(asset) => void addImageFromSource(asset.source, asset.name, { saveToUploads: false })}
            onApplyTemplate={applyTemplate}
            onColorChange={handleCardColorChange}
            applyColorBothSides={brandColorBothSides}
            onApplyColorBothSidesChange={setBrandColorBothSides}
            onUploadClick={() => fileInputRef.current?.click()}
            uploadedAssets={uploadedAssets}
            onUseUpload={(asset) => void addImageFromSource(asset.source, asset.name)}
            onDeleteUpload={deleteUploadedAsset}
          />
        )}
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(event) => uploadImage(event.target.files?.[0])}
        />
      </aside>

      <section className="grid min-w-0 grid-rows-[62px_1fr_112px]">
        <header className="relative flex items-center justify-between border-b border-slate-200 bg-white px-4">
          <AppLogo />
          <ContextToolbar
            kind={selectedKind}
            fill={selectedFill}
            fontFamily={selectedFontFamily}
            fontSize={selectedFontSize}
            opacity={selectedOpacity}
            fontWeight={selectedFontWeight}
            fontStyle={selectedFontStyle}
            underline={selectedUnderline}
            textAlign={selectedTextAlign}
            onUndo={undoCanvas}
            onRedo={redoCanvas}
            onCopy={() => void copySelectedCanvas()}
            onPaste={() => void pasteSelectedCanvas()}
            onDuplicate={() => void duplicateSelectedCanvas()}
            onDelete={deleteSelected}
            onArrange={arrangeSelected}
            onAlign={alignSelected}
            onUpdate={updateActive}
            onFillChange={(fill) => {
              setSelectedFill(fill);
              updateActive({ fill });
            }}
          />
          <div className="flex items-center gap-2">
            <Badge>{currentProjectId === "new" ? "Untitled" : currentProjectId}</Badge>
            {autoSaveStatus !== "idle" && <Badge>{autoSaveStatus === "saving" ? "Saving..." : "Saved"}</Badge>}
            <Button variant="secondary" size="sm" onClick={() => void saveProject()}>Save</Button>
            <Button variant="secondary" size="sm" onClick={exportPng}><Download className="h-4 w-4" /> Export ZIP</Button>
            <Button size="sm" variant="accent" onClick={orderViaWhatsapp}>Order via WhatsApp</Button>
          </div>
        </header>

        <div
          className="flex min-h-0 items-center justify-center overflow-auto bg-[#eef0f4] p-8"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) clearCanvasSelection();
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <div style={{ transform: `scale(${zoom})` }}>
            <canvas ref={canvasElementRef} />
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 0.1)}><Minus className="h-4 w-4" /></Button>
            <span className="w-12 text-center text-sm">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 0.1)}><Plus className="h-4 w-4" /></Button>
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
            <PageThumb label="Front" preview={sidePreviews.front} active={side === "front"} index={1} onClick={() => selectSide("front")} />
            <PageThumb label="Back" preview={sidePreviews.back} active={side === "back"} index={2} onClick={() => selectSide("back")} />
            <label className="ml-2 flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={mirrorSides}
                onChange={(event) => toggleMirrorSides(event.target.checked)}
              />
              Same both sides
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>CMYK proof</span>
            <span>300 DPI</span>
            <span>ZIP: front + back</span>
          </div>
        </footer>
      </section>
    </main>
  );
}

function ContextToolbar({
  kind,
  fill,
  fontFamily,
  fontSize,
  opacity,
  fontWeight,
  fontStyle,
  underline,
  textAlign,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onArrange,
  onAlign,
  onUpdate,
  onFillChange,
}: {
  kind: SelectedKind;
  fill: string;
  fontFamily: string;
  fontSize: number;
  opacity: number;
  fontWeight: string | number;
  fontStyle: string;
  underline: boolean;
  textAlign: string;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onArrange: (action: "front" | "back" | "forward" | "backward") => void;
  onAlign: (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => void;
  onUpdate: (props: Record<string, string | number | boolean>) => void;
  onFillChange: (fill: string) => void;
}) {
  const isBold = String(fontWeight) === "700" || String(fontWeight).toLowerCase() === "bold";
  const isItalic = fontStyle === "italic";
  const alignCycle = textAlign === "left" ? "center" : textAlign === "center" ? "right" : "left";

  return (
    <div className="absolute left-1/2 top-2 flex max-w-[70%] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-1 shadow-lg shadow-slate-900/10">
      <Button variant="ghost" size="icon" onClick={onUndo}><Undo2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" onClick={onRedo}><Redo2 className="h-4 w-4" /></Button>
      <span className="mx-1 h-7 w-px bg-slate-200" />
      {kind === "text" && (
        <>
          <select
            className="h-9 rounded-lg border bg-white px-3 text-sm"
            value={fontFamily}
            onChange={(event) => onUpdate({ fontFamily: event.target.value })}
          >
            {fonts.map((font) => <option key={font} value={font}>{font}</option>)}
          </select>
          <Button variant="secondary" size="sm" onClick={() => onUpdate({ fontSize: Math.max(8, fontSize - 2) })}>-</Button>
          <span className="w-8 text-center text-sm">{fontSize}</span>
          <Button variant="secondary" size="sm" onClick={() => onUpdate({ fontSize: fontSize + 2 })}>+</Button>
          <ToolbarIcon active={isBold} onClick={() => onUpdate({ fontWeight: isBold ? "400" : "700" })}><Bold className="h-4 w-4" /></ToolbarIcon>
          <ToolbarIcon active={isItalic} onClick={() => onUpdate({ fontStyle: isItalic ? "normal" : "italic" })}><Italic className="h-4 w-4" /></ToolbarIcon>
          <ToolbarIcon active={underline} onClick={() => onUpdate({ underline: !underline })}><Underline className="h-4 w-4" /></ToolbarIcon>
          <ToolbarIcon active={textAlign === "left" || textAlign === "center" || textAlign === "right"} onClick={() => onUpdate({ textAlign: alignCycle })}>
            {textAlign === "center" ? <AlignCenter className="h-4 w-4" /> : textAlign === "right" ? <AlignRight className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" />}
          </ToolbarIcon>
        </>
      )}
      {kind === "image" && (
        <>
          <Button variant="secondary" size="sm" onClick={() => onUpdate({ opacity: Math.max(0.1, (opacity - 10) / 100) })}>Opacity -</Button>
          <span className="w-10 text-center text-sm">{opacity}%</span>
          <Button variant="secondary" size="sm" onClick={() => onUpdate({ opacity: Math.min(1, (opacity + 10) / 100) })}>Opacity +</Button>
          <Button variant="secondary" size="sm" onClick={() => onUpdate({ angle: 0 })}>Reset</Button>
        </>
      )}
      {(kind === "shape" || kind === "text") && (
        <label className="ml-1 flex h-9 w-10 cursor-pointer flex-col items-center justify-center rounded-lg border text-sm font-semibold">
          A
          <span className="mt-0.5 h-1 w-6 rounded-full" style={{ backgroundColor: fill }} />
          <input type="color" value={fill} onChange={(event) => onFillChange(event.target.value.toUpperCase())} className="sr-only" />
        </label>
      )}
      <span className="mx-1 h-7 w-px bg-slate-200" />
      <ToolbarText onClick={() => onArrange("front")}>Front</ToolbarText>
      <ToolbarText onClick={() => onArrange("back")}>Back</ToolbarText>
      <ToolbarText onClick={() => onAlign("center")}>Center</ToolbarText>
      <ToolbarText onClick={onCopy}>Copy</ToolbarText>
      <ToolbarText onClick={onPaste}>Paste</ToolbarText>
      <ToolbarIcon onClick={onDuplicate}><Plus className="h-4 w-4" /></ToolbarIcon>
      <ToolbarIcon onClick={onDelete}><Trash2 className="h-4 w-4" /></ToolbarIcon>
    </div>
  );
}

function ToolbarIcon({ children, onClick, active = false }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button className={`flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100 ${active ? "bg-violet-100 text-violet-700 ring-1 ring-violet-300" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function ToolbarText({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button className="h-9 rounded-lg px-2 text-sm font-medium hover:bg-slate-100" onClick={onClick}>
      {children}
    </button>
  );
}

function PageThumb({ label, index, active, preview, onClick }: { label: string; index: number; active: boolean; preview: string; onClick: () => void }) {
  return (
    <button
      className={`grid w-28 gap-1 rounded-xl border p-1.5 text-left transition ${
        active ? "border-teal-400 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onClick={onClick}
    >
      <span
        className="aspect-[1.78] rounded-lg bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-cover bg-center ring-1 ring-slate-200"
        style={preview ? { backgroundImage: `url("${preview}")` } : undefined}
      />
      <span className="px-1 text-xs font-semibold text-slate-700">{index}. {label}</span>
    </button>
  );
}

function PanelContent({
  activePanel,
  cardColor,
  elementAssets,
  onAddText,
  onAddShape,
  onAddImageUrl,
  onAddElementAsset,
  onApplyTemplate,
  onColorChange,
  applyColorBothSides,
  onApplyColorBothSidesChange,
  onUploadClick,
  uploadedAssets,
  onUseUpload,
  onDeleteUpload,
}: {
  activePanel: Panel;
  cardColor: string;
  elementAssets: ElementAsset[];
  onAddText: (size?: number, text?: string) => void;
  onAddShape: (fill?: string) => void;
  onAddImageUrl: () => void;
  onAddElementAsset: (asset: ElementAsset) => void;
  onApplyTemplate: (template: CardTemplate) => void;
  onColorChange: (color: string) => void;
  applyColorBothSides: boolean;
  onApplyColorBothSidesChange: (checked: boolean) => void;
  onUploadClick: () => void;
  uploadedAssets: UploadedAsset[];
  onUseUpload: (asset: UploadedAsset) => void;
  onDeleteUpload: (id: string) => void;
}) {
  const [assetSearch, setAssetSearch] = useState("");
  const visibleElementAssets = elementAssets.filter((asset) =>
    asset.name.toLowerCase().includes(assetSearch.trim().toLowerCase()),
  );

  if (activePanel === "templates") {
    return (
      <Panel title="Templates">
        {cardTemplates.map((template) => (
          <button
            key={template.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg"
            onClick={() => onApplyTemplate(template)}
          >
            <span className="relative block aspect-[1.78] overflow-hidden bg-slate-100" style={{ background: template.preview }}>
              <span className="absolute left-[10%] top-[18%] h-[18%] w-[18%] rounded-full" style={{ backgroundColor: template.accent }} />
              <span className="absolute left-[10%] top-[52%] h-[8%] w-[36%] rounded-full bg-white/80" />
              <span className="absolute left-[10%] top-[66%] h-[5%] w-[26%] rounded-full bg-white/55" />
              <span className="absolute bottom-[12%] right-[10%] h-[28%] w-[28%] rotate-45 rounded-md bg-white/80 shadow-xl" />
            </span>
            <span className="block p-3">
              <span className="block text-sm font-semibold text-slate-950">{template.name}</span>
              <span className="mt-1 block text-xs font-medium text-slate-500">{template.category}</span>
            </span>
          </button>
        ))}
      </Panel>
    );
  }

  if (activePanel === "elements") {
    return (
      <Panel title="Elements">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-500">Search assets</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            placeholder="Search by file name"
            value={assetSearch}
            onChange={(event) => setAssetSearch(event.target.value)}
          />
        </label>
        <p className="mt-5 mb-3 text-sm font-medium text-slate-500">Built-in assets</p>
        {visibleElementAssets.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {visibleElementAssets.map((asset) => (
              <button
                key={asset.source}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-slate-50 bg-contain bg-center bg-no-repeat hover:ring-2 hover:ring-violet-400"
                style={{ backgroundImage: `url("${asset.source}")` }}
                title={asset.name}
                onClick={() => onAddElementAsset(asset)}
              />
            ))}
          </div>
        )}
        {elementAssets.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
            Put PNG files in <span className="font-mono text-slate-700">public/cardforge-elements</span>.
          </div>
        )}
        {elementAssets.length > 0 && visibleElementAssets.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
            No PNG assets match вЂњ{assetSearch}вЂќ.
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {cardColors.slice(0, 6).map((color) => (
            <button key={color} className="h-20 rounded-lg border" style={{ backgroundColor: color }} onClick={() => onAddShape(color)} />
          ))}
        </div>
      </Panel>
    );
  }

  if (activePanel === "text") {
    return (
      <Panel title="Text">
        <Button className="h-14 justify-start rounded-lg" variant="secondary" onClick={() => onAddText(44, "Add a heading")}>Add heading</Button>
        <Button className="h-12 justify-start rounded-lg" variant="secondary" onClick={() => onAddText(28, "Add a subheading")}>Add subheading</Button>
        <Button className="h-11 justify-start rounded-lg" variant="secondary" onClick={() => onAddText(18, "Add body text")}>Add body text</Button>
      </Panel>
    );
  }

  if (activePanel === "brand") {
    return (
      <Panel title="Brand colors">
        <ColorPicker value={cardColor} onChange={onColorChange} />
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={applyColorBothSides}
            onChange={(event) => onApplyColorBothSidesChange(event.target.checked)}
          />
          Apply color to both sides
        </label>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {cardColors.map((color) => (
            <button key={color} className="h-9 rounded-full border" style={{ backgroundColor: color }} onClick={() => onColorChange(color)} />
          ))}
        </div>
      </Panel>
    );
  }

  if (activePanel === "uploads") {
    return (
      <Panel title="Uploads">
        <Button className="h-20 rounded-lg" variant="secondary" onClick={onUploadClick}><ImagePlus className="h-5 w-5" /> Upload photo or PNG</Button>
        <Button className="h-12 rounded-lg" variant="secondary" onClick={onAddImageUrl}><LinkIcon className="h-4 w-4" /> Add image URL</Button>
        {uploadedAssets.length > 0 && (
          <div className="mt-4">
            <p className="mb-3 text-sm font-medium text-slate-500">Recent uploads</p>
            <div className="grid grid-cols-3 gap-3">
              {uploadedAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border bg-slate-100"
                >
                  <button
                    className="h-full w-full bg-cover bg-center transition group-hover:scale-105"
                    style={{ backgroundImage: `url("${asset.source}")` }}
                    title={asset.name}
                    onClick={() => onUseUpload(asset)}
                  />
                  <button
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-slate-700 opacity-0 shadow transition hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    aria-label={`Delete ${asset.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteUpload(asset.id);
                    }}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    );
  }

  return (
    <Panel title={activePanel[0].toUpperCase() + activePanel.slice(1)}>
      <Button variant="secondary" onClick={() => onAddShape()}>Add shape</Button>
      <Button variant="secondary" onClick={() => onAddText()}>Add text</Button>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function crc32(bytes: Uint8Array) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 255, (value >>> 8) & 255);
}

function writeUint32(output: number[], value: number) {
  output.push(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

function writeBytes(output: number[], bytes: Uint8Array) {
  for (const byte of bytes) output.push(byte);
}

function createZip(files: { name: string; data: Uint8Array }[]) {
  const output: number[] = [];
  const central: number[] = [];
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const file of files) {
    const name = encoder.encode(file.name);
    const offset = output.length;
    const checksum = crc32(file.data);

    writeUint32(output, 0x04034b50);
    writeUint16(output, 20);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, dosTime);
    writeUint16(output, dosDate);
    writeUint32(output, checksum);
    writeUint32(output, file.data.length);
    writeUint32(output, file.data.length);
    writeUint16(output, name.length);
    writeUint16(output, 0);
    writeBytes(output, name);
    writeBytes(output, file.data);

    writeUint32(central, 0x02014b50);
    writeUint16(central, 20);
    writeUint16(central, 20);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, dosTime);
    writeUint16(central, dosDate);
    writeUint32(central, checksum);
    writeUint32(central, file.data.length);
    writeUint32(central, file.data.length);
    writeUint16(central, name.length);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint16(central, 0);
    writeUint32(central, 0);
    writeUint32(central, offset);
    writeBytes(central, name);
  }

  const centralOffset = output.length;
  output.push(...central);
  writeUint32(output, 0x06054b50);
  writeUint16(output, 0);
  writeUint16(output, 0);
  writeUint16(output, files.length);
  writeUint16(output, files.length);
  writeUint32(output, central.length);
  writeUint32(output, centralOffset);
  writeUint16(output, 0);

  return new Blob([new Uint8Array(output)], { type: "application/zip" });
}


