import type { ByToggle } from "@/types/types";

interface CategoryItem {
  color: string;
  name: string;
  sub: number;
  count: number;
}

export const categoriesData: ByToggle<CategoryItem[]> = {
  paints: [
    { color: "#2A2A2A", name: "Enamel Paints", sub: 4, count: 128 },
    { color: "#8FD3C0", name: "Emulsion Paints", sub: 3, count: 96 },
    { color: "#B65454", name: "Distempers", sub: 2, count: 54 },
    { color: "#C97B4C", name: "Primers & Putty", sub: 3, count: 71 },
  ],
  interiors: [
    { color: "#5B7FBE", name: "PVC & Wall Panels", sub: 5, count: 142 },
    { color: "#D9C27E", name: "Laminates & Veneers", sub: 4, count: 118 },
    { color: "#9C8CD6", name: "Hardware & Fittings", sub: 6, count: 133 },
    { color: "#7A9E7E", name: "Boards & Ply", sub: 3, count: 89 },
  ],
};
