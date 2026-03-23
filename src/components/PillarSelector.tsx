import { TrendingUp, Users, MousePointerClick } from "lucide-react";
import type { Pillar } from "@/lib/content-generator";
import { PILLAR_INFO } from "@/lib/content-generator";

const ICONS = {
  TrendingUp,
  Users,
  MousePointerClick,
};

interface PillarSelectorProps {
  selected: Pillar | null;
  onSelect: (pillar: Pillar) => void;
}

export function PillarSelector({ selected, onSelect }: PillarSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(Object.entries(PILLAR_INFO) as [Pillar, typeof PILLAR_INFO[Pillar]][]).map(
        ([key, info]) => {
          const Icon = ICONS[info.icon as keyof typeof ICONS];
          const isActive = selected === key;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`group flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-primary bg-primary/5 glow-electric"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isActive ? "gradient-electric" : "bg-muted"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{info.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{info.description}</p>
              </div>
            </button>
          );
        }
      )}
    </div>
  );
}
