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
              className={`group relative flex flex-col items-start gap-3 rounded-xl border p-5 text-left transition-all duration-200 ${
                isActive
                  ? "border-primary bg-primary/5 shadow-md glow-electric"
                  : "border-border/60 bg-card hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full gradient-electric shadow-sm" />
              )}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  isActive ? "gradient-electric shadow-sm" : "bg-muted"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{info.label}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{info.description}</p>
              </div>
            </button>
          );
        }
      )}
    </div>
  );
}
