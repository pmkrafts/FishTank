import { FISH_SHAPE_TYPES, TEXT_FISH_MAX_LENGTH } from "@fishtank/shared";

export type ShapeType = (typeof FISH_SHAPE_TYPES)[number];

const CANVAS_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  const { promise, resolve, reject } = Promise.withResolvers<HTMLImageElement>();
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
  return promise;
}

function readFileAsDataURL(file: File): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = reject;
  reader.readAsDataURL(file);
  return promise;
}

function getMaskUrl(shape: ShapeType) {
  return `/masks/${shape}.svg`;
}

function createCanvas(): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  return { canvas, ctx };
}

function drawSourceImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = (CANVAS_SIZE - dw) / 2;
  const dy = (CANVAS_SIZE - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawTextSource(
  ctx: CanvasRenderingContext2D,
  text: string,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = color === "#000000" || color.toLowerCase() === "#fff" || color.toLowerCase() === "#ffffff" ? "#F4F4F0" : "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${CANVAS_SIZE / Math.max(4, text.length)}px ui-monospace, monospace`;
  ctx.fillText(text.toUpperCase(), CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

async function applyMask(
  ctx: CanvasRenderingContext2D,
  shape: ShapeType
) {
  const mask = await loadImage(getMaskUrl(shape));
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(mask, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.globalCompositeOperation = "source-over";
}

export async function renderMaskedImage(
  file: File,
  shape: ShapeType
): Promise<string> {
  const dataUrl = await readFileAsDataURL(file);
  const [img] = await Promise.all([loadImage(dataUrl), loadImage(getMaskUrl(shape))]);

  const { canvas, ctx } = createCanvas();
  drawSourceImage(ctx, img);
  await applyMask(ctx, shape);

  return canvas.toDataURL("image/png");
}

export async function renderMaskedText(
  text: string,
  color: string,
  shape: ShapeType
): Promise<string> {
  const safe = text.slice(0, TEXT_FISH_MAX_LENGTH).trim();
  if (!safe) throw new Error("Text is empty");

  await loadImage(getMaskUrl(shape));
  const { canvas, ctx } = createCanvas();
  drawTextSource(ctx, safe, color);
  await applyMask(ctx, shape);

  return canvas.toDataURL("image/png");
}

export function validateShape(shape: string): shape is ShapeType {
  return FISH_SHAPE_TYPES.includes(shape as ShapeType);
}
