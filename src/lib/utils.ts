import type { Filters, MediaItem } from "../types";

export type Notify = (text: string, kind?: "ok" | "err" | "info") => void;

export function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatBytes(n: number): string {
  if (!n) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function formatDuration(sec?: number): string {
  if (!sec || !Number.isFinite(sec)) return "—:—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildFilter(f: Filters): string {
  const parts: string[] = [];
  if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
  if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
  if (f.saturate !== 100) parts.push(`saturate(${f.saturate}%)`);
  if (f.sepia) parts.push(`sepia(${f.sepia}%)`);
  if (f.grayscale) parts.push(`grayscale(${f.grayscale}%)`);
  return parts.length ? parts.join(" ") : "none";
}

export function hasEdits(item: MediaItem): boolean {
  const f = item.filters;
  return (
    item.rotation !== 0 ||
    f.brightness !== 100 ||
    f.contrast !== 100 ||
    f.saturate !== 100 ||
    f.sepia !== 0 ||
    f.grayscale !== 0
  );
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = url;
  });
}

export async function imageToPngBlob(url: string): Promise<Blob> {
  const img = await loadImage(url);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/png"),
  );
}

/** Рендерит фото с применёнными правками (фильтры + поворот) в новый Blob. */
export async function renderEdited(item: MediaItem, url: string): Promise<Blob> {
  const img = await loadImage(url);
  const rot = item.rotation;
  const swap = rot === 90 || rot === 270;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = buildFilter(item.filters);
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/jpeg", 0.92),
  );
}

export async function imageDims(
  file: Blob,
): Promise<{ width: number; height: number } | undefined> {
  try {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    return { width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return undefined;
  }
}

export async function storageEstimate(): Promise<{ used: number; quota: number } | null> {
  try {
    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      const e = await navigator.storage.estimate();
      return { used: e.usage ?? 0, quota: e.quota ?? 0 };
    }
  } catch {
    /* noop */
  }
  return null;
}

/** Скачивание объекта: фото с правками рендерится заново, остальное — как есть. */
export async function downloadItem(item: MediaItem, url: string, notify: Notify): Promise<void> {
  if (!url) {
    notify("Файл недоступен", "err");
    return;
  }
  notify("Готовим файл…", "info");
  try {
    if (item.type === "photo" && hasEdits(item)) {
      downloadBlob(await renderEdited(item, url), `${item.name}-edit.jpg`);
    } else {
      const blob =
        item.blob ??
        (await (await fetch(url)).blob());
      downloadBlob(blob, `${item.name}.${item.ext}`);
    }
    notify("Скачивание началось");
  } catch {
    if (url.startsWith("http")) {
      window.open(url, "_blank", "noopener");
      notify("Файл открыт в новой вкладке — сохраните его оттуда", "info");
    } else {
      notify("Не удалось скачать файл", "err");
    }
  }
}

/** Поделиться: системный share-диалог (с файлом, если возможно), иначе — копия ссылки. */
export async function shareItem(item: MediaItem, url: string, notify: Notify): Promise<void> {
  try {
    if (item.blob && typeof navigator.canShare === "function") {
      const file = new File([item.blob], `${item.name}.${item.ext}`, {
        type: item.mime || undefined,
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: item.name });
        return;
      }
    }
    if (typeof navigator.share === "function") {
      await navigator.share({ title: `Светопись — ${item.name}`, url });
      return;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return;
  }
  const ok = await copyText(url);
  notify(ok ? "Ссылка скопирована — можно отправлять" : "Не удалось поделиться", ok ? "info" : "err");
}
