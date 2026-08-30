import { useEffect, useRef, useState } from "react";
import type { Filters, MediaItem } from "../types";
import { defaultFilters } from "../types";
import {
  buildFilter,
  copyText,
  downloadItem,
  formatBytes,
  formatDate,
  formatDuration,
  hasEdits,
  imageToPngBlob,
  renderEdited,
  shareItem,
} from "../lib/utils";
import { useToast } from "./Toast";
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconDownload,
  IconFilm,
  IconHeart,
  IconImage,
  IconLink,
  IconPlus,
  IconRotateCw,
  IconShare,
  IconSliders,
  IconStar,
  IconTrash,
  IconX,
} from "./Icons";

interface Props {
  item: MediaItem;
  url: string;
  posLabel: string;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onPatch: (id: string, p: Partial<MediaItem>) => Promise<void>;
  onRemove: (id: string) => Promise<string>;
}

const SLIDERS: { key: keyof Filters; label: string; min: number; max: number }[] = [
  { key: "brightness", label: "Яркость", min: 40, max: 160 },
  { key: "contrast", label: "Контраст", min: 40, max: 160 },
  { key: "saturate", label: "Насыщенность", min: 0, max: 200 },
  { key: "sepia", label: "Сепия", min: 0, max: 100 },
  { key: "grayscale", label: "Ч/Б", min: 0, max: 100 },
];

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-mute">{children}</h4>
      {right}
    </div>
  );
}

export default function Lightbox({ item, url, posLabel, total, onClose, onPrev, onNext, onPatch, onRemove }: Props) {
  const { push: toast } = useToast();
  const [nameDraft, setNameDraft] = useState(item.name);
  const [tagDraft, setTagDraft] = useState("");
  const [edits, setEdits] = useState<{ filters: Filters; rotation: number }>({
    filters: { ...item.filters },
    rotation: item.rotation,
  });
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const firstRun = useRef(true);
  const delTimer = useRef<number | undefined>(undefined);
  const savedTimer = useRef<number | undefined>(undefined);

  // Сброс состояния при смене объекта
  useEffect(() => {
    setNameDraft(item.name);
    setTagDraft("");
    setEdits({ filters: { ...item.filters }, rotation: item.rotation });
    setSaved(false);
    setCopied(false);
    setConfirmDel(false);
    firstRun.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  // Автосохранение правок (дебаунс)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void onPatch(item.id, {
        filters: edits.filters,
        rotation: (edits.rotation % 360) as MediaItem["rotation"],
      });
      setSaved(true);
      window.clearTimeout(savedTimer.current);
      savedTimer.current = window.setTimeout(() => setSaved(false), 1800);
    }, 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edits]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  useEffect(
    () => () => {
      window.clearTimeout(delTimer.current);
      window.clearTimeout(savedTimer.current);
    },
    [],
  );

  const edited: MediaItem = {
    ...item,
    filters: edits.filters,
    rotation: (edits.rotation % 360) as MediaItem["rotation"],
  };
  const odd = edited.rotation === 90 || edited.rotation === 270;
  const dirty = hasEdits(edited);

  const saveName = () => {
    const v = nameDraft.trim();
    if (!v || v === item.name) {
      setNameDraft(item.name);
      return;
    }
    void onPatch(item.id, { name: v });
    toast("Переименовано");
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
    if (!t) return;
    if (item.tags.includes(t)) {
      toast("Такой тег уже есть", "info");
      setTagDraft("");
      return;
    }
    if (item.tags.length >= 8) {
      toast("Не больше 8 тегов на объект", "err");
      return;
    }
    void onPatch(item.id, { tags: [...item.tags, t] });
    setTagDraft("");
  };

  const copyLink = async () => {
    const ok = await copyText(url);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      toast("Прямая ссылка скопирована");
    } else {
      toast("Не удалось скопировать ссылку", "err");
    }
  };

  const copyImage = async () => {
    try {
      let blob: Blob;
      if (dirty) {
        const rendered = await renderEdited(edited, url);
        const bmp = await createImageBitmap(rendered);
        const c = document.createElement("canvas");
        c.width = bmp.width;
        c.height = bmp.height;
        c.getContext("2d")!.drawImage(bmp, 0, 0);
        blob = await new Promise<Blob>((res, rej) =>
          c.toBlob((b) => (b ? res(b) : rej(new Error("canvas"))), "image/png"),
        );
      } else {
        blob = await imageToPngBlob(url);
      }
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast("Изображение скопировано в буфер обмена");
    } catch {
      const ok = await copyText(url);
      toast(
        ok ? "Скопирована ссылка (буфер изображений недоступен)" : "Не удалось скопировать",
        ok ? "info" : "err",
      );
    }
  };

  const handleDelete = async () => {
    if (!confirmDel) {
      setConfirmDel(true);
      window.clearTimeout(delTimer.current);
      delTimer.current = window.setTimeout(() => setConfirmDel(false), 2600);
      return;
    }
    const name = await onRemove(item.id);
    toast(`«${name}» удалён из медиатеки`, "info");
    onClose();
  };

  return (
    <div className="animate-fade fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex h-full w-full flex-col md:flex-row">
        <div className="perf hidden w-7 shrink-0 border-r border-line/40 bg-[#0d0a07] md:block" />

        {/* Предпросмотр */}
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden bg-[#120d09] p-4 md:p-8">
          {item.type === "photo" ? (
            <img
              key={`${item.id}-${url}`}
              src={url}
              alt={item.name}
              draggable={false}
              className={`select-none object-contain shadow-[0_30px_90px_-24px_rgba(0,0,0,.95)] transition-[filter,transform] duration-300 ${
                odd ? "max-h-[min(70vw,66vh)] max-w-[min(80vw,60vh)] md:max-h-[min(50vw,78vh)]" : "max-h-full max-w-full"
              }`}
              style={{ filter: buildFilter(edits.filters), transform: `rotate(${edited.rotation}deg)` }}
            />
          ) : (
            <video key={`${item.id}-${url}`} src={url} controls className="max-h-full max-w-full" />
          )}

          {total > 1 && (
            <>
              <button
                onClick={onPrev}
                aria-label="Предыдущий"
                className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line/60 bg-black/60 text-cream/80 backdrop-blur-sm transition-all hover:scale-105 hover:border-amber/60 hover:text-amber active:scale-95"
              >
                <IconChevronLeft size={20} />
              </button>
              <button
                onClick={onNext}
                aria-label="Следующий"
                className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line/60 bg-black/60 text-cream/80 backdrop-blur-sm transition-all hover:scale-105 hover:border-amber/60 hover:text-amber active:scale-95"
              >
                <IconChevronRight size={20} />
              </button>
            </>
          )}

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-3.5 py-1.5 text-[11px] text-sand backdrop-blur-sm">
            <span className="tabular-nums">{posLabel}</span>
            {dirty && <span className="text-amber">· правки</span>}
          </div>
        </div>

        <div className="perf hidden w-7 shrink-0 border-l border-line/40 bg-[#0d0a07] xl:block" />

        {/* Панель «досье» */}
        <aside className="flex max-h-[46vh] w-full shrink-0 flex-col overflow-y-auto border-t border-line/70 bg-panel md:max-h-none md:w-[360px] md:border-l md:border-t-0 xl:w-[380px]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line/70 bg-panel px-4 py-3">
            <span className="font-display text-[11px] font-semibold uppercase tracking-[0.24em] text-mute">
              Досье объекта
            </span>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="grid h-8 w-8 place-items-center rounded-md text-mute transition-all hover:bg-surface hover:text-cream active:scale-90"
            >
              <IconX size={17} />
            </button>
          </div>

          <div className="space-y-6 px-4 py-5">
            {/* Имя и мета */}
            <section>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                aria-label="Название"
                className="w-full border-b border-line bg-transparent pb-1.5 text-lg font-semibold text-cream outline-none transition-colors focus:border-amber"
              />
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 rounded border border-line bg-surface/60 px-2 py-1 text-sand">
                  {item.type === "photo" ? <IconImage size={12} className="text-amber" /> : <IconFilm size={12} className="text-teal" />}
                  {item.type === "photo" ? "Фото" : "Видео"}
                </span>
                <span className="rounded border border-line bg-surface/60 px-2 py-1 text-sand">{formatBytes(item.size)}</span>
                <span className="rounded border border-line bg-surface/60 px-2 py-1 text-sand">{formatDate(item.createdAt)}</span>
                <span className="rounded border border-line bg-surface/60 px-2 py-1 text-sand">
                  {item.type === "photo"
                    ? `${item.width ?? "—"}×${item.height ?? "—"} px`
                    : formatDuration(item.duration)}
                </span>
              </div>
            </section>

            {/* Оценка и избранное */}
            <section>
              <SectionTitle>Оценка</SectionTitle>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => void onPatch(item.id, { rating: n === item.rating ? 0 : n })}
                      aria-label={`Оценка ${n}`}
                      className={`transition-all hover:scale-110 active:scale-95 ${
                        n <= item.rating ? "text-amber" : "text-cream/25 hover:text-amber/60"
                      }`}
                    >
                      <IconStar size={23} filled={n <= item.rating} />
                    </button>
                  ))}
                </div>
                <span className="text-sm tabular-nums text-sand">{item.rating} / 5</span>
                <button
                  onClick={() => {
                    void onPatch(item.id, { favorite: !item.favorite });
                    toast(item.favorite ? "Убрано из избранного" : "Добавлено в избранное", "info");
                  }}
                  className={`ml-auto flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 ${
                    item.favorite
                      ? "border-amber/60 bg-amber/15 text-amber"
                      : "border-line text-sand hover:border-amber/50 hover:text-amber"
                  }`}
                >
                  <IconHeart size={13} filled={item.favorite} />
                  {item.favorite ? "В избранном" : "В избранное"}
                </button>
              </div>
            </section>

            {/* Теги */}
            <section>
              <SectionTitle>Теги</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((t) => (
                  <span
                    key={t}
                    className="group flex items-center gap-1 rounded border border-line bg-surface/60 px-2 py-1 text-xs text-sand transition-colors hover:border-danger/50"
                  >
                    #{t}
                    <button
                      onClick={() => void onPatch(item.id, { tags: item.tags.filter((x) => x !== t) })}
                      aria-label={`Убрать тег ${t}`}
                      className="text-mute transition-colors hover:text-danger"
                    >
                      <IconX size={11} />
                    </button>
                  </span>
                ))}
                {item.tags.length === 0 && <span className="text-xs text-mute">Тегов пока нет</span>}
              </div>
              <div className="mt-2.5 flex gap-2">
                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag();
                  }}
                  placeholder="Новый тег…"
                  className="min-w-0 flex-1 rounded-md border border-line bg-bg px-3 py-1.5 text-xs text-cream placeholder:text-mute outline-none transition-colors focus:border-amber/70"
                />
                <button
                  onClick={addTag}
                  aria-label="Добавить тег"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line text-sand transition-all hover:border-amber/60 hover:text-amber active:scale-90"
                >
                  <IconPlus size={15} />
                </button>
              </div>
            </section>

            {/* Прямая ссылка */}
            <section>
              <SectionTitle>Прямая ссылка</SectionTitle>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={url}
                  onFocus={(e) => e.currentTarget.select()}
                  aria-label="Прямая ссылка"
                  className="min-w-0 flex-1 truncate rounded-md border border-line bg-bg px-3 py-1.5 text-[11px] text-sand outline-none focus:border-amber/60"
                />
                <button
                  onClick={() => void copyLink()}
                  aria-label="Скопировать ссылку"
                  className={`grid h-8 w-9 shrink-0 place-items-center rounded-md border transition-all active:scale-90 ${
                    copied ? "border-teal/60 text-teal" : "border-line text-sand hover:border-amber/60 hover:text-amber"
                  }`}
                >
                  {copied ? <IconCheck size={14} /> : <IconLink size={14} />}
                </button>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-mute">
                Ссылка указывает на объект в памяти браузера и живёт в рамках текущей сессии.
              </p>
            </section>

            {/* Правки (только фото) */}
            {item.type === "photo" && (
              <section>
                <SectionTitle
                  right={
                    <span className="flex items-center gap-2">
                      {saved && (
                        <span className="animate-fade flex items-center gap-1 text-[11px] font-medium text-teal">
                          <IconCheck size={12} /> Сохранено
                        </span>
                      )}
                      {dirty && (
                        <button
                          onClick={() => setEdits({ filters: { ...defaultFilters }, rotation: 0 })}
                          className="text-[11px] text-mute underline-offset-2 transition-colors hover:text-danger hover:underline"
                        >
                          Сбросить
                        </button>
                      )}
                    </span>
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <IconSliders size={12} className="text-amber" /> Правки
                  </span>
                </SectionTitle>
                <div className="space-y-3">
                  {SLIDERS.map(({ key, label, min, max }) => (
                    <label key={key} className="block">
                      <span className="mb-1 flex justify-between text-[11px]">
                        <span className="text-sand">{label}</span>
                        <span className="tabular-nums text-mute">{edits.filters[key]}</span>
                      </span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        value={edits.filters[key]}
                        onChange={(e) =>
                          setEdits((prev) => ({
                            ...prev,
                            filters: { ...prev.filters, [key]: Number(e.target.value) },
                          }))
                        }
                        className="w-full"
                      />
                    </label>
                  ))}
                  <button
                    onClick={() => setEdits((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-xs font-medium text-sand transition-all hover:border-amber/60 hover:text-amber active:scale-[.98]"
                  >
                    <IconRotateCw size={14} />
                    Повернуть на 90°
                    <span className="ml-1 tabular-nums text-mute">{edits.rotation}°</span>
                  </button>
                </div>
              </section>
            )}

            {/* Действия */}
            <section className="border-t border-line/60 pt-5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => void downloadItem(edited, url, toast)}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-md bg-amber px-3 py-2.5 text-sm font-semibold text-bg transition-all hover:bg-amberlite active:scale-[.98]"
                >
                  <IconDownload size={16} />
                  Скачать{dirty ? " с правками" : ""}
                </button>
                {item.type === "photo" && (
                  <button
                    onClick={() => void copyImage()}
                    className="flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-xs font-medium text-sand transition-all hover:border-amber/60 hover:text-amber active:scale-[.98]"
                  >
                    <IconCopy size={14} />
                    Копировать фото
                  </button>
                )}
                <button
                  onClick={() => void shareItem(edited, url, toast)}
                  className={`flex items-center justify-center gap-2 rounded-md border border-line px-3 py-2 text-xs font-medium text-sand transition-all hover:border-amber/60 hover:text-amber active:scale-[.98] ${
                    item.type === "video" ? "col-span-1" : ""
                  }`}
                >
                  <IconShare size={14} />
                  Поделиться
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className={`flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all active:scale-[.98] ${
                    confirmDel
                      ? "border-danger bg-danger/15 text-danger"
                      : "border-line text-sand hover:border-danger/60 hover:text-danger"
                  } ${item.type === "video" ? "" : "col-span-2"}`}
                >
                  <IconTrash size={14} />
                  {confirmDel ? "Точно удалить?" : "Удалить"}
                </button>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
