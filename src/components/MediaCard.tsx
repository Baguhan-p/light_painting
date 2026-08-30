import type { MediaItem } from "../types";
import { buildFilter, formatBytes, formatDuration } from "../lib/utils";
import { Reveal } from "./Reveal";
import { IconDownload, IconFilm, IconHeart, IconPlay, IconShare, IconStar } from "./Icons";

interface Props {
  item: MediaItem;
  url: string;
  index: number;
  onOpen: () => void;
  onFav: () => void;
  onRate: (n: number) => void;
  onDownload: () => void;
  onShare: () => void;
}

function Stars({ value, onRate, size = 14 }: { value: number; onRate: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={(e) => {
            e.stopPropagation();
            onRate(n === value ? 0 : n);
          }}
          aria-label={`Оценка ${n}`}
          className={`transition-all hover:scale-125 active:scale-95 ${
            n <= value ? "text-amber" : "text-cream/30 hover:text-amber/70"
          }`}
        >
          <IconStar size={size} filled={n <= value} />
        </button>
      ))}
    </div>
  );
}

export default function MediaCard({ item, url, index, onOpen, onFav, onRate, onDownload, onShare }: Props) {
  const odd = item.rotation === 90 || item.rotation === 270;

  return (
    <Reveal delay={(index % 8) * 45} className="mb-4 break-inside-avoid">
      <article className="group relative overflow-hidden rounded-lg border border-line/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-amber/50 hover:shadow-[0_20px_44px_-18px_rgba(0,0,0,.85)]">
        <div className="relative overflow-hidden">
          <button onClick={onOpen} className="block w-full cursor-zoom-in text-left" aria-label={`Открыть ${item.name}`}>
            <div className="overflow-hidden bg-black/30 transition-transform duration-500 group-hover:scale-[1.03]">
              {item.type === "photo" ? (
                <img
                  src={url}
                  alt={item.name}
                  loading="lazy"
                  draggable={false}
                  className="block w-full"
                  style={{
                    filter: buildFilter(item.filters),
                    transform: `rotate(${item.rotation}deg)`,
                    maxWidth: odd ? "78%" : undefined,
                    margin: odd ? "0 auto" : undefined,
                  }}
                />
              ) : (
                <video
                  src={`${url}#t=0.4`}
                  muted
                  playsInline
                  preload="metadata"
                  className="block aspect-video w-full object-cover"
                />
              )}
            </div>
          </button>

          {item.type === "video" && (
            <>
              <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 text-[11px] font-medium text-cream backdrop-blur-sm">
                <IconFilm size={12} className="text-teal" />
                {formatDuration(item.duration)}
              </span>
              <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-cream/30 bg-black/55 text-cream opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 scale-75">
                <IconPlay size={20} className="translate-x-0.5" />
              </span>
            </>
          )}

          {item.type === "photo" && (
            <span className="absolute left-2.5 top-2.5 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream/80 backdrop-blur-sm">
              фото
            </span>
          )}

          <button
            onClick={onFav}
            aria-label="В избранное"
            className={`absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition-all active:scale-90 ${
              item.favorite
                ? "bg-amber/90 text-bg shadow-[0_0_18px_-2px_rgba(240,163,46,.8)]"
                : "bg-black/55 text-cream/70 opacity-0 hover:text-amber group-hover:opacity-100"
            }`}
          >
            <IconHeart size={15} filled={item.favorite} />
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2 pt-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="pointer-events-auto">
              <Stars value={item.rating} onRate={onRate} />
            </div>
            <div className="pointer-events-auto flex gap-1.5">
              <button
                onClick={onDownload}
                aria-label="Скачать"
                title="Скачать"
                className="grid h-8 w-8 place-items-center rounded-md bg-cream/10 text-cream backdrop-blur-sm transition-all hover:bg-amber hover:text-bg active:scale-90"
              >
                <IconDownload size={15} />
              </button>
              <button
                onClick={onShare}
                aria-label="Поделиться"
                title="Поделиться"
                className="grid h-8 w-8 place-items-center rounded-md bg-cream/10 text-cream backdrop-blur-sm transition-all hover:bg-amber hover:text-bg active:scale-90"
              >
                <IconShare size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 px-3 py-2.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold leading-tight text-cream">
              {item.name}
              <span className="ml-1 text-[11px] font-normal text-mute">.{item.ext}</span>
            </h3>
            <p className="mt-0.5 text-[11px] text-mute">
              {formatBytes(item.size)}
              {item.type === "photo" && item.width ? ` · ${item.width}×${item.height}` : ""}
              {item.type === "video" ? ` · ${formatDuration(item.duration)}` : ""}
            </p>
            {item.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded border border-line/70 bg-panel px-1.5 py-0.5 text-[10px] text-sand"
                  >
                    #{t}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="px-1 py-0.5 text-[10px] text-mute">+{item.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
          {item.rating > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-amber/10 px-1.5 py-0.5 text-xs font-semibold text-amber">
              <IconStar size={11} filled />
              {item.rating}
            </span>
          )}
        </div>
      </article>
    </Reveal>
  );
}
