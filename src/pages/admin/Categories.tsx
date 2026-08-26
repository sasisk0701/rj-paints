import { useMemo } from "react";
import {  Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness.ts";
import { categoriesData } from "@/data/categoriesData";
import { Toolbar,FilterChip } from "@/components/common/Toolbar.tsx";
import { Button } from "@/components/common/Button.tsx";
import { Swatch } from "@/components/common/Swatch";
import { Badge } from "@/components/common/Badge.tsx";
import { Panel } from "@/components/common/Panel.tsx";

export default function Categories() {
  const { toggle } = useBusiness();
  const cats = useMemo(() => categoriesData[toggle], [toggle]);
  const badgeTone = toggle === "paints" ? "paints" : "interiors";

  const cards = useMemo(
    () =>
      cats.map((c) => (
        <Panel key={c.name} className="p-4">
          <div className="flex items-center gap-2.5">
            <Swatch color={c.color} />
            <div className="flex-1">
              <div className="font-semibold">{c.name}</div>
              <div className="text-[11.5px] text-ink-3">
                {c.sub} subcategories · {c.count} products
              </div>
            </div>
            <Badge tone={badgeTone}>{toggle === "paints" ? "Paints" : "Interiors"}</Badge>
          </div>
        </Panel>
      )),
    [cats, badgeTone, toggle]
  );

  return (
    <div>
      <Toolbar
        left={<FilterChip>{cats.length} categories · {toggle === "paints" ? "Paints" : "Interiors"}</FilterChip>}
        right={<Button variant="primary" size="sm" icon={Plus}>Add Category</Button>}
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
        {cards}
      </div>
    </div>
  );
}
