import { useEffect, useMemo, useRef, useState } from "react";
import type { MediaItem } from "./types";
import { useMediaStore } from "./hooks/useMediaStore";
import { ToastProvider, useToast } from "./components/Toast";
import TopBar from "./components/TopBar";
import type { Density } from "./components/TopBar";
import Sidebar, { FiltersContent } from "./components/Sidebar";
import type { FiltersState, SortKey, TypeFilter } from "./components/Sidebar";
import MediaCard from "./components/MediaCard";
import Lightbox from "./components/Lightbox";
import { Reveal } from "./components/Reveal";
import { IconAperture, IconUpload } from "./components/Icons";
import { downloadItem, formatBytes, shareItem, storageEstimate } from "./lib/utils";

const COLS: Record<Density, string> = {
  s: "columns-2 gap-4 md:columns-3 xl:columns-4 2xl:columns-5",
  m: "columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4",
  l: "columns-1 gap-4 lg:columns-2",
};

function Shell() {
  const store = useMediaStore();
  const { push: toast } = useToast();

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState<SortKey>("new");
  const [density, setDensity] = useState<Density>("m");
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [storage, setStorage] = useState<{ used: number; quota: number } | null>(null);
  const dragCounter = useRef(0);
  const uploadRef = useRef<HTMLInputElement>(null);

  // Drag & drop во всё окно
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const enter = (e: DragEvent) => {
      if (hasFiles(e)) {
        dragCounter.current++;
        setDragOver(true);
      }
    };
    const leave = () => {
      dragCounter.current = Math.max(0, dragCounter.current - 1);
      if (dragCounter.current === 0) setDragOver(false);
    };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOver(false);
      if (e.dataTransfer?.files.length) void store.addFiles(e.dataTransfer.files);
    };
    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [store]);

  useEffect(() => {
    let alive = true;
    void storageEstimate().then((s) => {
      if (alive) setStorage(s);
    });
    return () => {
      alive = false;
    };
  }, [store.items.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = store.items.filter((i) => {
      if (typeFilter === "photo" && i.type !== "photo") return false;
      if (typeFilter === "video" && i.type !== "video") return false;
      if (typeFilter === "fav" && !i.favorite) return false;
      if (minRating > 0 && i.rating < minRating) return false;
      if (activeTags.length > 0 && !activeTags.every((t) => i.tags.includes(t))) return false;
      if (q && !(i.name.toLowerCase().includes(q) || i.tags.some((t) => t.includes(q)))) return false;
      return true;
    });
    return list.sort((a, b) => {
      switch (sort) {
        case "old":
          return a.createdAt - b.createdAt;
        case "top":
          return b.rating - a.rating || b.createdAt - a.createdAt;
        case "name":
          return a.name.localeCompare(b.name, "ru");
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [store.items, query, typeFilter, minRating, activeTags, sort]);

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    store.items.forEach((i) => i.tags.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"));
  }, [store.items]);

  const counts = useMemo(
    () => ({
      all: store.items.length,
      photo: store.items.filter((i) => i.type === "photo").length,
      video: store.items.filter((i) => i.type === "video").length,
      fav: store.items.filter((i) => i.favorite).length,
    }),
    [store.items],
  );

  const totalSize = useMemo(() => store.items.reduce((s, i) => s + i.size, 0), [store.items]);

  const hasFilters = query !== "" || typeFilter !== "all" || activeTags.length > 0 || minRating > 0;

  const resetFilters = () => {
    setQuery("");
    setTypeFilter("all");
    setActiveTags([]);
    setMinRating(0);
  };

  const filtersState: FiltersState = {
    counts,
    typeFilter,
    onType: setTypeFilter,
    tags,
    activeTags,
    onToggleTag: (t) =>
      setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])),
    minRating,
    onMinRating: setMinRating,
    sort,
    onSort: setSort,
    storage,
    totalSize,
    onReset: resetFilters,
    hasFilters,
  };

  const lightboxItem: MediaItem | null = lightboxId
    ? filtered.find((i) => i.id === lightboxId) ?? store.items.find((i) => i.id === lightboxId) ?? null
    : null;
  const lightboxIdx = lightboxItem ? filtered.findIndex((i) => i.id === lightboxItem.id) : -1;

  const move = (dir: 1 | -1) => {
    if (!lightboxItem || filtered.length === 0) return;
    const idx = filtered.findIndex((i) => i.id === lightboxItem.id);
    if (idx < 0) return;
    const next = filtered[(idx + dir + filtered.length) % filtered.length];
    if (next) setLightboxId(next.id);
  };

  const onRate = (i: MediaItem) => (n: number) =>
    void store.patch(i.id, { rating: n === i.rating ? 0 : n });
  const onFav = (i: MediaItem) => () => void store.patch(i.id, { favorite: !i.favorite });

  return (
    <div className="min-h-screen font-body text-cream">
      <TopBar
        query={query}
        onQuery={setQuery}
        onUpload={(files) => void store.addFiles(files)}
        importing={store.importing}
        density={density}
        onDensity={setDensity}
      />

      <div className="mx-auto flex max-w-[1600px] gap-7 px-4 py-6 sm:px-6">
        <Sidebar {...filtersState} />

        <main className="min-w-0 flex-1">
          {/* Мобильные фильтры */}
          <details className="group mb-5 rounded-lg border border-line bg-panel/70 lg:hidden">
            <summary className="flex cursor-pointer select-none list-none items-center justify-between px-4 py-3 text-sm font-semibold text-sand [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                Фильтры и сортировка
                {hasFilters && (
                  <span className="rounded bg-amber/15 px-1.5 py-0.5 text-[10px] font-bold text-amber">
                    активны
                  </span>
                )}
              </span>
              <svg
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="text-mute transition-transform group-open:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <div className="border-t border-line/60 px-4 py-4">
              <FiltersContent {...filtersState} />
            </div>
          </details>

          {/* Статистика */}
          <Reveal className="mb-6 border-b border-line/60 pb-5">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
              <div>
                <p className="font-display text-4xl font-extrabold leading-none text-amber">
                  {counts.all}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-mute">
                  объектов всего
                </p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold leading-none text-cream">{counts.photo}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-mute">фотографий</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold leading-none text-teal">{counts.video}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-mute">видео</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold leading-none text-cream">{counts.fav}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-mute">в избранном</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold leading-none text-cream">
                  {formatBytes(totalSize)}
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-mute">объём коллекции</p>
              </div>
              <p className="ml-auto hidden pb-1 text-xs text-mute sm:block">
                {hasFilters
                  ? `Найдено: ${filtered.length} из ${counts.all}`
                  : "Коллекция проявлена и готова к просмотру"}
              </p>
            </div>
          </Reveal>

          {/* Контент */}
          {!store.ready ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <IconAperture size={46} className="animate-[spin_2.6s_linear_infinite] text-amber" />
              <p className="font-display mt-5 text-lg font-semibold text-cream">Проявляем медиатеку…</p>
              <p className="mt-1.5 text-sm text-mute">Открываем локальное хранилище браузера</p>
            </div>
          ) : store.items.length === 0 ? (
            <div className="animate-fade-up">
              <div className="mx-auto max-w-xl rounded-xl border-2 border-dashed border-line bg-panel/40 px-8 py-16 text-center transition-colors hover:border-amber/40">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-amber/40 bg-amber/10 text-amber">
                  <IconAperture size={30} />
                </span>
                <h2 className="font-display mt-5 text-2xl font-bold text-cream">В медиатеке пока пусто</h2>
                <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-sand">
                  Перетащите фото и видео прямо в окно браузера — или выберите файлы вручную. Всё
                  сохранится локально на этом устройстве.
                </p>
                <button
                  onClick={() => uploadRef.current?.click()}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-bg transition-all hover:bg-amberlite active:scale-95"
                >
                  <IconUpload size={16} />
                  Выбрать файлы
                </button>
                <input
                  ref={uploadRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) void store.addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="animate-fade-up py-20 text-center">
              <p className="font-display text-xl font-semibold text-cream">Ничего не нашлось</p>
              <p className="mt-2 text-sm text-sand">Попробуйте смягчить условия поиска</p>
              <button
                onClick={resetFilters}
                className="mt-5 rounded-md border border-line px-4 py-2 text-sm text-sand transition-colors hover:border-amber/60 hover:text-amber"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className={COLS[density]}>
              {filtered.map((item, idx) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  url={store.urlOf(item)}
                  index={idx}
                  onOpen={() => setLightboxId(item.id)}
                  onFav={onFav(item)}
                  onRate={onRate(item)}
                  onDownload={() => void downloadItem(item, store.urlOf(item), toast)}
                  onShare={() => void shareItem(item, store.urlOf(item), toast)}
                />
              ))}
            </div>
          )}

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pb-2 pt-5 text-xs text-mute">
            <p className="flex items-center gap-2">
              <IconAperture size={14} className="text-amber" />
              Светопись — тёмная комната для ваших снимков
            </p>
            <p>
              Данные живут в IndexedDB этого браузера · {counts.all} объектов · {formatBytes(totalSize)}
            </p>
          </footer>
        </main>
      </div>

      {lightboxItem && (
        <Lightbox
          item={lightboxItem}
          url={store.urlOf(lightboxItem)}
          posLabel={
            lightboxIdx >= 0 ? `${lightboxIdx +1} / ${filtered.length}` : `— / ${filtered.length}`
          }
          total={filtered.length}
          onClose={() => setLightboxId(null)}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
          onPatch={store.patch}
          onRemove={store.remove}
        />
      )}

      {dragOver && (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-bg/85 p-6 backdrop-blur-sm">
          <div className="animate-pulse-soft rounded-xl border-2 border-dashed border-amber px-12 py-10 text-center">
            <IconUpload size={42} className="mx-auto text-amber" />
            <p className="font-display mt-4 text-xl font-bold text-cream">Отпустите файлы</p>
            <p className="mt-1.5 text-sm text-sand">Фото и видео добавятся в медиатеку</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}
