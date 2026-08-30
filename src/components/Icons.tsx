import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svgProps({ size = 18, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...rest,
  };
}

export function IconAperture(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="12" cy="12" r="10" />
      <path d="m14.31 8 5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16 3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function IconUpload(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5M12 3v12" />
    </svg>
  );
}

export function IconDownload(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </svg>
  );
}

export function IconStar({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg {...svgProps(p)} fill={filled ? "currentColor" : "none"}>
      <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95L12 2.6z" />
    </svg>
  );
}

export function IconHeart({ filled, ...p }: IconProps & { filled?: boolean }) {
  return (
    <svg {...svgProps(p)} fill={filled ? "currentColor" : "none"}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function IconShare(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
    </svg>
  );
}

export function IconLink(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function IconCopy(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function IconSliders(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M3 6h18M3 12h18M3 18h18" />
      <circle cx="9" cy="6" r="2.2" fill="var(--color-panel)" />
      <circle cx="15" cy="12" r="2.2" fill="var(--color-panel)" />
      <circle cx="7" cy="18" r="2.2" fill="var(--color-panel)" />
    </svg>
  );
}

export function IconTrash(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconX(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconPlay(p: IconProps) {
  return (
    <svg {...svgProps(p)} fill="currentColor">
      <path d="M6 3.8v16.4a.6.6 0 0 0 .9.52l13.2-8.2a.6.6 0 0 0 0-1.04L6.9 3.28a.6.6 0 0 0-.9.52z" stroke="none" />
    </svg>
  );
}

export function IconFilm(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="2" y="2" width="20" height="20" rx="2.2" />
      <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 7h5M17 17h5" />
    </svg>
  );
}

export function IconImage(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

export function IconRotateCw(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronLeft(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconSizeS(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function IconSizeM(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="3" width="8" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
    </svg>
  );
}

export function IconSizeL(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
    </svg>
  );
}

export function IconInfo(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export function IconAlert(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function IconSun(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

export function IconMoon(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function IconFolder(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <svg {...svgProps(p)}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
