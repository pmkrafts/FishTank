import { useEffect, useState } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs-pro";
import { API_URL, FINGERPRINT_API_KEY } from "../lib/env.js";
import { BrutalButton } from "./BrutalButton";
import { BrutalBox } from "./BrutalBox";
import { BrutalInput } from "./BrutalInput";
import { BrutalAlert } from "./BrutalAlert";
import { FishMaskSelector } from "./FishMaskSelector";
import { renderMaskedImage, renderMaskedText, validateShape } from "../lib/mask.js";
import { FISH_MAX_UPLOAD_BYTES, TEXT_FISH_MAX_LENGTH, type FishShapeType } from "@fishtank/shared";

const TEXT_COLORS = ["#FF2D00", "#0055FF", "#F4F4F0", "#000000", "#FFDD00", "#00AA44"];

export function UploadPipeline() {
  const [mode, setMode] = useState<"photo" | "text">("photo");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [color, setColor] = useState(TEXT_COLORS[0]);
  const [shape, setShape] = useState<FishShapeType>("classic");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{ allowed: boolean; remainingSeconds: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    FingerprintJS.load({ apiKey: FINGERPRINT_API_KEY })
      .then((fp) => fp.get())
      .then((result) => {
        if (cancelled) return;
        setFingerprint(result.visitorId);
        return checkRateLimit(result.visitorId);
      })
      .catch((err) => {
        if (cancelled) return;
        setFingerprint(`anon-${crypto.randomUUID()}`);
        console.error("Fingerprint failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const checkRateLimit = async (fp: string) => {
    const res = await fetch(`${API_URL}/api/rate-limit?fp=${encodeURIComponent(fp)}`);
    const data = await res.json();
    setRateLimit(data);
  };

  const isRateLimited = rateLimit && !rateLimit.allowed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError(null);
    setPreview(null);
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (selected.size > FISH_MAX_UPLOAD_BYTES) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setFile(selected);
  };

  const generatePreview = async () => {
    if (!validateShape(shape)) return;
    setError(null);
    setLoading(true);
    try {
      if (mode === "photo") {
        if (!file) throw new Error("Select a photo first.");
        const dataUrl = await renderMaskedImage(file, shape);
        setPreview(dataUrl);
      } else {
        if (!text.trim()) throw new Error("Type a label first.");
        const dataUrl = await renderMaskedText(text, color, shape);
        setPreview(dataUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!fingerprint) {
      setError("Visitor ID not ready. Please wait.");
      return;
    }
    if (!preview) {
      setError("Generate a preview first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const key = `${fingerprint}/${crypto.randomUUID()}.png`;
      const blob = await (await fetch(preview)).blob();

      const uploadRes = await fetch(`${API_URL}/api/upload?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error("Image upload failed.");

      const fishRes = await fetch(`${API_URL}/api/fish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2Key: key,
          fingerprint,
          shapeType: shape,
          textLabel: mode === "text" ? text.slice(0, TEXT_FISH_MAX_LENGTH) : undefined,
          textColor: mode === "text" ? color : undefined,
        }),
      });
      if (fishRes.status === 429) {
        const data = await fishRes.json();
        setRateLimit({ allowed: false, remainingSeconds: data.remainingSeconds });
        throw new Error(`Cooldown active — wait ${data.remainingSeconds}s.`);
      }
      if (!fishRes.ok) throw new Error("Failed to add fish.");

      setSuccess(true);
      setFile(null);
      setText("");
      setPreview(null);
      await checkRateLimit(fingerprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setLoading(false);
    }
  };

  const modeButtonStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    background: active ? "var(--ink)" : "var(--bg)",
    color: active ? "var(--bg)" : "var(--ink)",
  });

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {rateLimit && (
        <BrutalAlert variant={rateLimit.allowed ? "blue" : "red"}>
          <p style={{ margin: 0, fontWeight: 700 }}>
            {rateLimit.allowed
              ? "YOU MAY RELEASE ONE FISH"
              : `COOLDOWN ACTIVE — ${Math.ceil(rateLimit.remainingSeconds / 60)} MINUTES REMAINING`}
          </p>
        </BrutalAlert>
      )}

      {success && (
        <BrutalAlert variant="blue">
          <p style={{ margin: 0, fontWeight: 700 }}>FISH RELEASED. IT WILL APPEAR IN THE AQUARIUM SOON.</p>
        </BrutalAlert>
      )}

      {error && (
        <BrutalAlert variant="red">
          <p style={{ margin: 0, fontWeight: 700 }}>{error}</p>
        </BrutalAlert>
      )}

      <BrutalBox>
        <p className="brutal-label" style={{ margin: "0 0 1rem" }}>Mode</p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <BrutalButton
            type="button"
            variant={mode === "photo" ? "solid" : "outline"}
            onClick={() => { setMode("photo"); setPreview(null); setError(null); }}
            style={modeButtonStyle(mode === "photo")}
          >
            Upload Photo
          </BrutalButton>
          <BrutalButton
            type="button"
            variant={mode === "text" ? "solid" : "outline"}
            onClick={() => { setMode("text"); setPreview(null); setError(null); }}
            style={modeButtonStyle(mode === "text")}
          >
            Type Label
          </BrutalButton>
        </div>
      </BrutalBox>

      {mode === "photo" ? (
        <BrutalBox>
          <p className="brutal-label" style={{ margin: "0 0 1rem" }}>Photo</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="brutal-input"
          />
        </BrutalBox>
      ) : (
        <BrutalBox>
          <p className="brutal-label" style={{ margin: "0 0 1rem" }}>Label & Color</p>
          <BrutalInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={TEXT_FISH_MAX_LENGTH}
            placeholder="TYPE FISH NAME"
            label="FISH LABEL"
            style={{ marginBottom: "1rem" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {TEXT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`brutal-swatch ${color === c ? "brutal-swatch-selected" : ""}`}
                style={{ background: c }}
                aria-label={`Select color ${c}`}
                title={c}
              />
            ))}
          </div>
        </BrutalBox>
      )}

      <BrutalBox>
        <p className="brutal-label" style={{ margin: "0 0 1rem" }}>Shape</p>
        <FishMaskSelector selected={shape} onSelect={setShape} />
      </BrutalBox>

      <BrutalButton
        type="button"
        onClick={generatePreview}
        disabled={loading || (mode === "photo" ? !file : !text.trim())}
      >
        {loading ? "PROCESSING..." : "PREVIEW FISH"}
      </BrutalButton>

      {preview && (
        <BrutalBox>
          <p className="brutal-label" style={{ margin: "0 0 1rem" }}>Preview</p>
          <img
            src={preview}
            alt="Masked fish preview"
            style={{ width: "100%", maxWidth: 256, border: "4px solid var(--ink)", display: "block" }}
          />
          <BrutalButton
            type="button"
            onClick={handleSubmit}
            disabled={loading || !!isRateLimited}
            style={{ marginTop: "1rem" }}
          >
            {loading ? "RELEASING..." : "RELEASE FISH"}
          </BrutalButton>
        </BrutalBox>
      )}
    </div>
  );
}
