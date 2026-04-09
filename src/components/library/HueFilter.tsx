"use client";

interface HueSegment {
  label: string;
  hueMin: number;
  hueMax: number;
  color: string;
}

const HUE_SEGMENTS: HueSegment[] = [
  { label: "RED",    hueMin: 340, hueMax: 20,  color: "#ff3131" },
  { label: "ORANGE", hueMin: 20,  hueMax: 50,  color: "#ff8c00" },
  { label: "YELLOW", hueMin: 50,  hueMax: 75,  color: "#ffd700" },
  { label: "GREEN",  hueMin: 75,  hueMax: 165, color: "#00ff41" },
  { label: "CYAN",   hueMin: 165, hueMax: 210, color: "#00e5ff" },
  { label: "BLUE",   hueMin: 210, hueMax: 260, color: "#4a9eff" },
  { label: "PURPLE", hueMin: 260, hueMax: 300, color: "#cc44ff" },
  { label: "PINK",   hueMin: 300, hueMax: 340, color: "#ff44aa" },
  { label: "NEUTRAL",hueMin: 0,   hueMax: 360, color: "#888888" },
];

interface HueFilterProps {
  activeHue: string;
  setActiveHue: (seg: string, min: number, max: number) => void;
  clearHue: () => void;
}

export default function HueFilter({ activeHue, setActiveHue, clearHue }: HueFilterProps) {
  return (
    <div>
      <div className="text-[10px] text-green-dim mb-1.5 tracking-widest">HUE RANGE</div>
      <div className="flex flex-col gap-0.5">
        {HUE_SEGMENTS.map((seg) => (
          <button
            key={seg.label}
            onClick={() => {
              if (activeHue === seg.label) {
                clearHue();
              } else {
                setActiveHue(seg.label, seg.hueMin, seg.hueMax);
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 border text-[10px] transition-all
              ${activeHue === seg.label
                ? "border-current bg-current/10"
                : "border-transparent hover:border-border text-green-dim"
              }`}
            style={activeHue === seg.label ? { color: seg.color, borderColor: seg.color } : {}}
          >
            <span
              className="w-2.5 h-2.5 flex-shrink-0 border border-current/50"
              style={{ backgroundColor: seg.color, opacity: 0.8 }}
            />
            {seg.label}
          </button>
        ))}
        {activeHue && (
          <button className="btn-terminal text-[9px] px-2 py-0.5 mt-1" onClick={clearHue}>
            × CLEAR
          </button>
        )}
      </div>
    </div>
  );
}
