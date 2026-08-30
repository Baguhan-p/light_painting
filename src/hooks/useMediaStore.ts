import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "../types";
import { dbDelete, dbGetAll, dbPut } from "../lib/db";
import { buildSeedItems } from "../data/seed";
import { imageDims, uid } from "../lib/utils";
import { useToast } from "../components/Toast";

export interface MediaStore {
  items: MediaItem[];
  ready: boolean;
  importing: boolean;
  urlOf: (item: MediaItem) => string;
  addFiles: (files: FileList | File[]) => Promise<void>;
  patch: (id: string, p: Partial<MediaItem>) => Promise<void>;
  remove: (id: string) => Promise<string>;
}

export function useMediaStore(): MediaStore {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  const [ready, setReady] = useState(false);
  const [importing, setImporting] = useState(false);
  const itemsRef = useRef<MediaItem[]>([]);
  const { push: toast } = useToast();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let list = await dbGetAll();
        if (list.length === 0) {
          const seeds = await buildSeedItems();
          for (const s of seeds) await dbPut(s);
          list = seeds;
        }
        if (!alive) return;
        const m = new Map<string, string>();
        list.forEach((i) => {
          if (i.blob) m.set(i.id, URL.createObjectURL(i.blob));
        });
        setItems(list);
        setUrls(m);
        setReady(true);
      } catch (err) {
        console.error(err);
        if (alive) {
          setReady(true);
          toast("Не удалось открыть хранилище браузера", "err");
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const urlOf = useCallback(
    (item: MediaItem) => urls.get(item.id) ?? item.remoteUrl ?? "",
    [urls],
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );
      if (!arr.length) {
        toast("Можно добавлять только фото и видео", "err");
        return;
      }
      setImporting(true);
      let added = 0;
      for (const f of arr) {
        try {
          const isPhoto = f.type.startsWith("image/");
          const dims = isPhoto ? await imageDims(f) : undefined;
          const dot = f.name.lastIndexOf(".");
          const item: MediaItem = {
            id: uid(),
            type: isPhoto ? "photo" : "video",
            name: dot > 0 ? f.name.slice(0, dot) : f.name,
            ext: dot > 0 ? f.name.slice(dot + 1).toLowerCase() : isPhoto ? "jpg" : "mp4",
            mime: f.type,
            size: f.size,
            createdAt: Date.now(),
            tags: [],
            rating: 0,
            favorite: false,
            width: dims?.width,
            height: dims?.height,
            blob: f,
            rotation: 0,
            filters: { brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0 },
          };
          await dbPut(item);
          setItems((prev) => [item, ...prev]);
          setUrls((prev) => new Map(prev).set(item.id, URL.createObjectURL(f)));
          added++;
        } catch (err) {
          console.error(err);
        }
      }
      setImporting(false);
      if (added) {
        toast(added === 1 ? "Файл добавлен в медиатеку" : `Добавлено файлов: ${added}`, "ok");
      }
    },
    [toast],
  );

  const patch = useCallback(async (id: string, p: Partial<MediaItem>) => {
    const cur = itemsRef.current.find((i) => i.id === id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...p } : i)));
    if (cur) {
      try {
        await dbPut({ ...cur, ...p });
      } catch {
        /* noop */
      }
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    const cur = itemsRef.current.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setUrls((prev) => {
      const m = new Map(prev);
      const u = m.get(id);
      if (u) URL.revokeObjectURL(u);
      m.delete(id);
      return m;
    });
    try {
      await dbDelete(id);
    } catch {
      /* noop */
    }
    return cur?.name ?? "Объект";
  }, []);

  return { items, ready, importing, urlOf, addFiles, patch, remove };
}
