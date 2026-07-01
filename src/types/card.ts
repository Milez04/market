export type CardCategory =
  | "Business"
  | "Wedding"
  | "VIP"
  | "Membership"
  | "Loyalty"
  | "Gift"
  | "Event"
  | "Student"
  | "Employee"
  | "ID"
  | "Restaurant";

export type CardFinish = "matte" | "soft-touch" | "foil" | "emboss" | "spot-uv";

export type DesignerElement = {
  id: string;
  type: "text" | "image" | "shape" | "qr" | "barcode";
  name: string;
  source?: string;
  fill?: string;
  locked?: boolean;
  visible?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};

export type CardTemplate = {
  id: string;
  title: string;
  category: CardCategory;
  audience: string;
  palette: string[];
  finish: CardFinish;
  size: "standard" | "square" | "invitation" | "id";
  priceFrom: number;
  preview: {
    front: string;
    back: string;
  };
};
