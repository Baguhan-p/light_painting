import { useRef } from "react";
import { IconAperture, IconSearch, IconSizeL, IconSizeM, IconSizeS, IconUpload } from "./Icons";

export type Density = "s" | "m" | "l";

interface Props {
  query: string;
  onQuery: (v: string) => void;
  onUpload: (files: FileList) => void;
  importing: boolean;
  density: Density;
  onDensity: (d: Density) => void;
}

const DENSITY: { key: Density; label: string; icon: typeof IconSizeS }[] = [
  { key: "s", label: "Мелкая сетка", icon: IconSizeS },
  { key: "m", label: "Средняя сетка", icon: IconSizeM },
  { key: "l", label: "Крупная сетка", icon: IconSizeL },
];

export default function TopBar({ query, onQuery, onUpload, importing, density, onDensity }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <a href="#" className="group flex shrink-0 items-center gap-3" aria-label="Светопись">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-amber/50 bg-amber/10 text-amber shadow-[0_0_24px_-8px_rgba(240,163,46,.8)]">
            <IconAperture size={22} className="transition-transform duration-700 ease-out group-hover:rotate-180" />
          </span>
          <span className="hidden xs:block sm:block">
            <span className="font-display block text-base font-bold leading-none tracking-wide text-cream">
              СВЕТОПИСЬ
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.24em] text-mute">
              личная медиатека
            </span>
          </span>
        </a>

        <label className="relative ml-auto w-full max-w-md">
          <IconSearch
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute"
          />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Поиск по имени или тегу…"
            className="w-full rounded-md border border-line bg-surface/70 py-2 pl-9 pr-3 text-sm text-cream placeholder:text-mute outline-none transition-colors focus:border-amber/70 focus:bg-surface"
          />
        </label>

        <div className="hidden shrink-0 items-center gap-1 rounded-md border border-line bg-surface/50 p-1 md:flex">
          {DENSITY.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              title={label}
              aria-label={label}
              onClick={() => onDensity(key)}
              className={`grid h-7 w-7 place-items-center rounded transition-all ${
                density === key
                  ? "bg-amber/15 text-amber shadow-[inset_0_0_0_1px_rgba(240,163,46,.4)]"
                  : "text-mute hover:text-cream"
              }`}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="flex shrink-0 items-center gap-2 rounded-md bg-amber px-3.5 py-2 text-sm font-semibold text-bg shadow-[0_0_28px_-8px_rgba(240,163,46,.7)] transition-all hover:bg-amberlite hover:shadow-[0_0_32px_-6px_rgba(240,163,46,.85)] active:scale-[.97] sm:px-4"
        >
          <IconUpload size={16} />
          <span className="hidden sm:inline">Загрузить</span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onUpload(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {importing && (
        <div className="h-0.5 w-full overflow-hidden bg-line/40">
          <div className="progress-bar h-full rounded-full bg-amber" />
        </div>
      )}
    </header>
  );
}
