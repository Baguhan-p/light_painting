export type MediaType = "photo" | "video";

export type Theme = "dark" | "light";

export interface Filters {
  brightness: number; // 100 = без изменений
  contrast: number;
  saturate: number;
  sepia: number; // 0
  grayscale: number; // 0
}

export interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  ext: string;
  mime: string;
  size: number;
  createdAt: number;
  tags: string[];
  rating: number; // 0..5
  favorite: boolean;
  width?: number;
  height?: number;
  duration?: number;
  blob?: Blob;
  remoteUrl?: string;
  rotation: 0 | 90 | 180 | 270;
  filters: Filters;
  collectionIds: string[];
}

export interface Collection {
  id: string;
  name: string;
  createdAt: number;
}

export const defaultFilters: Filters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  sepia: 0,
  grayscale: 0,
};
