import { FISH_SHAPE_TYPES, type FishShapeType } from "@fishtank/shared";

interface FishMaskSelectorProps {
  selected: FishShapeType;
  onSelect: (shape: FishShapeType) => void;
}

export function FishMaskSelector({ selected, onSelect }: FishMaskSelectorProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
      {FISH_SHAPE_TYPES.map((shape) => (
        <button
          key={shape}
          type="button"
          onClick={() => onSelect(shape)}
          className={`brutal-swatch ${selected === shape ? "brutal-swatch-selected" : ""}`}
          style={{
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.5rem",
          }}
          aria-pressed={selected === shape}
          title={shape}
        >
          <img
            src={`/masks/${shape}.svg`}
            alt={shape}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </button>
      ))}
    </div>
  );
}
