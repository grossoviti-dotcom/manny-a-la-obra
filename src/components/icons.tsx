import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 20, props: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export const IconCheck = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const IconShieldCheck = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const IconSearch = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const IconScale = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 3v18M5 21h14M6 7h12M6 7l-3 7a3 3 0 0 0 6 0L6 7zm12 0-3 7a3 3 0 0 0 6 0l-3-7z" />
  </svg>
);
export const IconStar = ({ size, filled = true, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? "currentColor" : "none"} strokeWidth={1.5}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </svg>
);
export const IconHandshake = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="m11 17 2 2a1 1 0 0 0 3-3" />
    <path d="m14 14 2.5 2.5a1 1 0 0 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a2 2 0 0 1-2.8-2.8L12 4.8a3 3 0 0 1 4.2 0L22 10.5" />
    <path d="M2 10.5 7 5.5l3 1M3 13l4 4" />
  </svg>
);
export const IconLifebuoy = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <path d="m5.6 5.6 3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
  </svg>
);
export const IconMapPin = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const IconTools = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" />
  </svg>
);
export const IconChat = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </svg>
);
export const IconClock = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconAlert = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M12 3 2 21h20L12 3z" />
    <path d="M12 10v4M12 17.5v.5" />
  </svg>
);
export const IconMenu = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconFile = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <path d="M14 3H6v18h12V7z" />
    <path d="M14 3v4h4" />
  </svg>
);
export const IconLock = ({ size, ...p }: P) => (
  <svg {...base(size, p)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const CATEGORY_PATHS: Record<string, React.ReactNode> = {
  electricidad: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  plomeria: (
    <>
      <path d="M4 8h8a4 4 0 0 1 4 4v8" />
      <path d="M4 4v8M20 16h-8" />
    </>
  ),
  gas: <path d="M12 3c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-3.5 2-5 1 1.5 2 2 3 2-1-2-1-4.5 0-7z" />,
  electrodomesticos: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M5 10h14M9 6.5v1M9 13v3" />
    </>
  ),
  "reparaciones-hogar": (
    <>
      <path d="M3 11 12 4l9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  tecnologia: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  mecanica: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
};

export const CategoryIcon = ({ slug, size, ...p }: P & { slug: string }) => (
  <svg {...base(size, p)}>{CATEGORY_PATHS[slug] ?? <circle cx="12" cy="12" r="8" />}</svg>
);
