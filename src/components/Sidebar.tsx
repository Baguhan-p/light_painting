import { useEffect, useRef, useState } from "react";
import type { Collection, MediaType } from "../types";
import { formatBytes } from "../lib/utils";
import {
  IconAperture,
  IconCheck,
  IconFilm,
  IconFolder,
  IconHeart,
  IconImage,
  IconPlus,
  IconStar,
  IconTrash,
  IconX,
} from "./Icons";

export type TypeFilter = "all" | MediaType | "fav";
export type SortKey = "new" | "old" | "top" | "name";

export interface FiltersState {
  counts: Record<TypeFilter, number>;
  typeFilter: TypeFilter;
  onType: (t: TypeFilter) => void;
  collections: Collection[];
  collectionCounts: Map<string, number>;
  activeCollectionId: string | null;
  onCollection: (id: string | null) => void;
  onCreateCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  tags: [string, number][];
  activeTags: string[];
  onToggleTag: (t: string) => void;
  minRating: number;
  onMinRating: (n: number) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  storage: { used: number; quota: number } | null;
  totalSize: number;
  onReset: () => void;
  hasFilters: boolean;
}

const TYPE_ROWS: { key: TypeFilter; label: string; icon: typeof IconImage }[] = [
  { key: "all", label: "Все объекты", icon: IconAperture },
  { key: "photo", label: "Фотографии", icon: IconImage },
  { key: "video", label: "Видео", icon: IconFilm },
  { key: "fav", label: "Избранное", icon: IconHeart },
];

const SORT_LABELS: Record<SortKey, string> = {
  new: "Сначала новые",
  old: "Сначала старые",
  top: "По оценке",
  name: "По имени (А–Я)",
};

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">
      {children}
    </h4>
  );
}

/** Содержимое фильтров — используется и в сайдбаре, и в мобильной панели. */
export function FiltersContent(p: FiltersState) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(confirmTimer.current), []);

  const submitCreate = () => {
    if (!name.trim()) {
      setCreating(false);
      return;
    }
    p.onCreateCollection(name);
    setName("");
    setCreating(false);
  };

  const askDelete = (id: string) => {
    if (confirmId === id) {
      setConfirmId(null);
      p.onDeleteCollection(id);
      return;
    }
    setConfirmId(id);
    window.clearTimeout(confirmTimer.current);
    confirmTimer.current = window.setTimeout(() => setConfirmId(null), 2600);
  };

  return (
    <div className="space-y-6">
      <section>
        <Heading>Разделы</Heading>
        <nav className="space-y-1">
          {TYPE_ROWS.map(({ key, label, icon: Icon }) => {
            const active = p.typeFilter === key;
            return (
              <button
                key={key}
                onClick={() => p.onType(key)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-all ${
                  active
                    ? "bg-amber/12 text-amber shadow-[inset_2px_0_0_0_var(--color-amber)]"
                    : "text-sand hover:bg-surface hover:text-cream"
                }`}
              >
                <Icon size={15} className={active ? "text-amber" : "text-mute"} />
                <span className="flex-1">{label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] tabular-nums ${
                    active ? "bg-amber/15 text-amber" : "bg-surface text-mute"
                  }`}
                >
                  {p.counts[key]}
                </span>
              </button>
            );
          })}
        </nav>
      </section>

      <section>
        <Heading>Коллекции</Heading>
        {p.collections.length > 0 && (
          <nav className="space-y-1">
            {p.collections.map((c) => {
              const active = p.activeCollectionId === c.id;
              const confirming = confirmId === c.id;
              return (
                <div
                  key={c.id}
                  className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all ${
                    active
                      ? "bg-amber/12 text-amber shadow-[inset_2px_0_0_0_var(--color-amber)]"
                      : "text-sand hover:bg-surface hover:text-cream"
                  }`}
                >
                  <button
                    onClick={() => p.onCollection(active ? null : c.id)}
                    className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                    title={c.name}
                  >
                    <IconFolder size={15} className={active ? "text-amber" : "text-mute"} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] tabular-nums ${
                        active ? "bg-amber/15 text-amber" : "bg-surface text-mute"
                      }`}
                    >
                      {p.collectionCounts.get(c.id) ?? 0}
                    </span>
                  </button>
                  {confirming ? (
                    <button
                      onClick={() => askDelete(c.id)}
                      className="flex items-center gap-1 rounded border border-danger/60 bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold text-danger transition-all active:scale-95"
                    >
                      <IconCheck size={11} />
                      точно?
                    </button>
                  ) : (
                    <button
                      onClick={() => askDelete(c.id)}
                      aria-label={`Удалить коллекцию ${c.name}`}
                      className="text-mute opacity-0 transition-all hover:text-danger group-hover:opacity-100"
                    >
                      <IconTrash size={13} />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>
        )}
        {creating ? (
          <div className="mt-1.5 flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCreate();
                if (e.key === "Escape") {
                  setName("");
                  setCreating(false);
                }
              }}
              onBlur={() => {
                if (!name.trim()) setCreating(false);
              }}
              placeholder="Название коллекции…"
              className="min-w-0 flex-1 rounded-md border border-line bg-bg px-2.5 py-1.5 text-xs text-cream placeholder:text-mute outline-none transition-colors focus:border-amber/70"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={submitCreate}
              aria-label="Создать коллекцию"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber text-amberink transition-all hover:bg-amberlite active:scale-90"
            >
              <IconCheck size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="mt-1.5 flex w-full items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-xs text-mute transition-all hover:border-amber/50 hover:text-amber"
          >
            <IconPlus size={13} />
            Новая коллекция
          </button>
        )}
      </section>

      {p.tags.length > 0 && (
        <section>
          <Heading>Теги</Heading>
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map(([tag, count]) => {
              const active = p.activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => p.onToggleTag(tag)}
                  className={`rounded border px-2 py-1 text-xs transition-all active:scale-95 ${
                    active
                      ? "border-amber bg-amber font-semibold text-amberink"
                      : "border-line bg-surface/50 text-sand hover:border-amber/50 hover:text-cream"
                  }`}
                >
                  #{tag}
                  <span className={`ml-1 ${active ? "text-amberink/60" : "text-mute"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <Heading>Минимальная оценка</Heading>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => p.onMinRating(n === p.minRating ? 0 : n)}
              aria-label={`Оценка от ${n}`}
              className={`transition-all hover:scale-110 active:scale-95 ${
                n <= p.minRating ? "text-amber" : "text-cream/25 hover:text-amber/60"
              }`}
            >
              <IconStar size={19} filled={n <= p.minRating} />
            </button>
          ))}
          {p.minRating > 0 && <span className="ml-2 text-xs text-mute">от {p.minRating}</span>}
        </div>
      </section>

      <section>
        <Heading>Сортировка</Heading>
        <div className="relative">
          <select
            value={p.sort}
            onChange={(e) => p.onSort(e.target.value as SortKey)}
            className="w-full cursor-pointer appearance-none rounded-md border border-line bg-surface px-3 py-2 pr-8 text-sm text-cream outline-none transition-colors focus:border-amber/70"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <option key={k} value={k} className="bg-panel">
                {SORT_LABELS[k]}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mute"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </section>

      {p.hasFilters && (
        <button
          onClick={p.onReset}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-sm text-sand transition-all hover:border-danger/50 hover:text-danger active:scale-[.98]"
        >
          <IconX size={14} />
          Сбросить фильтры
        </button>
      )}

      <section className="border-t border-line/60 pt-4">
        <Heading>Хранилище</Heading>
        <p className="text-xs leading-relaxed text-sand">
          Медиатека: <span className="font-semibold text-cream">{formatBytes(p.totalSize)}</span>
        </p>
        {p.storage && p.storage.quota > 0 && (
          <>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber to-amberlite transition-[width] duration-700"
                style={{
                  width: `${Math.max(2, Math.min(100, (p.storage.used / p.storage.quota) * 100))}%`,
                }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-mute">
              В браузере занято {formatBytes(p.storage.used)} из {formatBytes(p.storage.quota)}
            </p>
          </>
        )}
        <p className="mt-2 text-[11px] leading-relaxed text-mute">
          Всё хранится локально в IndexedDB — без сервера и регистрации.
        </p>
      </section>
    </div>
  );
}

export default function Sidebar(p: FiltersState) {
  return (
    <aside className="sticky top-[84px] hidden max-h-[calc(100vh-104px)] w-60 shrink-0 self-start overflow-y-auto pr-1 lg:block">
      <FiltersContent {...p} />
    </aside>
  );
}
