import type { Collection, MediaItem } from "../types";
import { defaultFilters } from "../types";
import { uid } from "../lib/utils";

interface SeedDef {
  src: string;
  type: "photo" | "video";
  name: string;
  ext: string;
  mime: string;
  tags: string[];
  rating: number;
  favorite?: boolean;
  width?: number;
  height?: number;
  duration?: number;
  collectionIds?: string[];
}

const SEEDS: SeedDef[] = [
  {
    src: "https://image.qwenlm.ai/generated-images/ee796d17-85b6-449c-811b-1707828f8196/_result.png",
    type: "photo",
    name: "Золотой час",
    ext: "png",
    mime: "image/png",
    tags: ["природа", "пейзаж"],
    rating: 5,
    favorite: true,
    width: 1152,
    height: 720,
    collectionIds: ["col-nature"],
  },
  {
    src: "https://image.qwenlm.ai/generated-images/164cab3f-f039-4479-9829-081ec7167c99/_result.png",
    type: "photo",
    name: "Портрет у окна",
    ext: "png",
    mime: "image/png",
    tags: ["портрет", "плёнка"],
    rating: 4,
    width: 800,
    height: 1000,
  },
  {
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    type: "video",
    name: "Цветение — клип",
    ext: "mp4",
    mime: "video/mp4",
    tags: ["природа", "макро"],
    rating: 4,
    duration: 25,
    collectionIds: ["col-nature"],
  },
  {
    src: "https://image.qwenlm.ai/generated-images/ca8ec2a4-e639-49e9-9b20-6fa53965d9e9/_result.png",
    type: "photo",
    name: "Геометрия двора",
    ext: "png",
    mime: "image/png",
    tags: ["город", "архитектура"],
    rating: 4,
    width: 1000,
    height: 750,
    collectionIds: ["col-city"],
  },
  {
    src: "https://image.qwenlm.ai/generated-images/c2f51609-4eea-4021-ac95-46c494ac99d3/_result.png",
    type: "photo",
    name: "Ночная улица",
    ext: "png",
    mime: "image/png",
    tags: ["город", "ночь"],
    rating: 5,
    favorite: true,
    width: 1100,
    height: 733,
    collectionIds: ["col-city"],
  },
  {
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4",
    type: "video",
    name: "Пятница — таймлапс",
    ext: "mp4",
    mime: "video/mp4",
    tags: ["город", "таймлапс"],
    rating: 3,
    duration: 20,
    collectionIds: ["col-city"],
  },
  {
    src: "https://image.qwenlm.ai/generated-images/27c3f4dc-1548-453f-8da9-8f210ef502db/_result.png",
    type: "photo",
    name: "Туман в тайге",
    ext: "png",
    mime: "image/png",
    tags: ["природа"],
    rating: 3,
    width: 1200,
    height: 700,
    collectionIds: ["col-nature"],
  },
  {
    src: "https://image.qwenlm.ai/generated-images/49e8bdb8-b367-40cf-88d2-eccac81ca182/_result.png",
    type: "photo",
    name: "Северное озеро",
    ext: "png",
    mime: "image/png",
    tags: ["пейзаж", "вода"],
    rating: 4,
    width: 1200,
    height: 750,
    collectionIds: ["col-nature"],
  },
];

const SEED_COLLECTIONS: Collection[] = [
  { id: "col-nature", name: "Природа и дорога", createdAt: Date.now() },
  { id: "col-city", name: "Городские истории", createdAt: Date.now() },
];

export interface SeedPayload {
  items: MediaItem[];
  collections: Collection[];
}

export async function buildSeeds(): Promise<SeedPayload> {
  const out: MediaItem[] = [];
  const now = Date.now();
  for (let i = 0; i < SEEDS.length; i++) {
    const s = SEEDS[i];
    let blob: Blob | undefined;
    try {
      const res = await fetch(s.src);
      if (res.ok) blob = await res.blob();
    } catch {
      blob = undefined;
    }
    out.push({
      id: uid(),
      type: s.type,
      name: s.name,
      ext: s.ext,
      mime: s.mime,
      size: blob?.size ?? 0,
      createdAt: now - (i + 1) * 86_400_000 * 2 - i * 3_600_000,
      tags: s.tags,
      rating: s.rating,
      favorite: Boolean(s.favorite),
      width: s.width,
      height: s.height,
      duration: s.duration,
      blob,
      remoteUrl: s.src.startsWith("http") ? s.src : undefined,
      rotation: 0,
      filters: { ...defaultFilters },
      collectionIds: s.collectionIds ?? [],
    });
  }
  return { items: out, collections: SEED_COLLECTIONS };
}
