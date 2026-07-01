import { create } from "zustand";
import type { CardFinish, DesignerElement } from "@/types/card";

type DesignerState = {
  selectedId: string | null;
  zoom: number;
  side: "front" | "back";
  finish: CardFinish;
  cardColor: string;
  elements: DesignerElement[];
  history: DesignerElement[][];
  setSelectedId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  flipSide: () => void;
  setFinish: (finish: CardFinish) => void;
  setCardColor: (color: string) => void;
  setElements: (elements: DesignerElement[]) => void;
  addElement: (element: DesignerElement) => void;
  removeElement: (id: string) => void;
  duplicateSelected: () => void;
  toggleLock: (id: string) => void;
  undo: () => void;
};

const starterElements: DesignerElement[] = [];

export const useDesignerStore = create<DesignerState>((set) => ({
  selectedId: null,
  zoom: 1,
  side: "front",
  finish: "foil",
  cardColor: "#ffffff",
  elements: starterElements,
  history: [starterElements],
  setSelectedId: (selectedId) => set({ selectedId }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.25, zoom)) }),
  flipSide: () => set((state) => ({ side: state.side === "front" ? "back" : "front" })),
  setFinish: (finish) => set({ finish }),
  setCardColor: (cardColor) => set({ cardColor }),
  setElements: (elements) => set((state) => ({ elements, history: [...state.history, elements] })),
  addElement: (element) =>
    set((state) => {
      const elements = [...state.elements, element];
      return { elements, selectedId: element.id, history: [...state.history, elements] };
    }),
  removeElement: (id) =>
    set((state) => {
      const elements = state.elements.filter((element) => element.id !== id);
      return {
        elements,
        selectedId: state.selectedId === id ? null : state.selectedId,
        history: [...state.history, elements],
      };
    }),
  duplicateSelected: () =>
    set((state) => {
      const source = state.elements.find((element) => element.id === state.selectedId);
      if (!source) return state;
      const clone = { ...source, id: crypto.randomUUID(), name: `${source.name} copy`, x: source.x + 18, y: source.y + 18 };
      const elements = [...state.elements, clone];
      return { elements, selectedId: clone.id, history: [...state.history, elements] };
    }),
  toggleLock: (id) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id ? { ...element, locked: !element.locked } : element,
      ),
    })),
  undo: () =>
    set((state) => {
      if (state.history.length < 2) return state;
      const history = state.history.slice(0, -1);
      return { history, elements: history[history.length - 1] };
    }),
}));
