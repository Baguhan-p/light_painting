import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";
import { IconAlert, IconCheck, IconInfo, IconX } from "./Icons";

export type ToastKind = "ok" | "err" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastCtxValue {
  push: (text: string, kind?: ToastKind) => void;
}

const ToastCtx = createContext<ToastCtxValue>({ push: () => undefined });

export function useToast(): ToastCtxValue {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<ToastItem[]>([]);
  const idRef = useRef(1);

  const push = useCallback((text: string, kind: ToastKind = "ok") => {
    const id = idRef.current++;
    setList((prev) => [...prev.slice(-3), { id, kind, text }]);
    window.setTimeout(() => {
      setList((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismiss = (id: number) => setList((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {list.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`animate-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-panel/95 px-3.5 py-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,.7)] backdrop-blur ${
              t.kind === "ok"
                ? "border-amber/50"
                : t.kind === "err"
                  ? "border-danger/60"
                  : "border-line"
            }`}
          >
            <span
              className={`mt-0.5 shrink-0 ${
                t.kind === "ok" ? "text-amber" : t.kind === "err" ? "text-danger" : "text-teal"
              }`}
            >
              {t.kind === "ok" ? (
                <IconCheck size={15} />
              ) : t.kind === "err" ? (
                <IconAlert size={15} />
              ) : (
                <IconInfo size={15} />
              )}
            </span>
            <p className="flex-1 text-sm leading-snug text-cream">{t.text}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="mt-0.5 text-mute transition-colors hover:text-cream"
              aria-label="Закрыть уведомление"
            >
              <IconX size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
