import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const defaultIconClass = "h-4 w-4 shrink-0 opacity-90";

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={cn(defaultIconClass, className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      {children}
    </svg>
  );
}

type IconFactory = (className?: string) => ReactNode;

const NAV_ICON_MAP: Record<string, IconFactory> = {
  dashboard: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" />
    </Svg>
  ),
  billing: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6M5 3h14a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2-3-2V5a2 2 0 0 1 2-2Z" />
    </Svg>
  ),
  agenda: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v2m8-2v2M5 7h14M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </Svg>
  ),
  cadastros: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 1 0-8 0m12 8a8 8 0 1 0-16 0" />
    </Svg>
  ),
  estoque: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16l-1 12H5L4 7Zm2-4h12l1 4H5l1-4Z" />
    </Svg>
  ),
  crm: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 1 1 18 0v6M3 18h18M8 18v3m8-3v3" />
    </Svg>
  ),
  gestao: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4 7v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V7l-8-4Z" />
    </Svg>
  ),
  projetos: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M6 21V9l6-4 6 4v12M10 21v-6h4v6" />
    </Svg>
  ),
  subscriptions: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10H4V7Zm0-4h16a2 2 0 0 1 2 2v1H2V5a2 2 0 0 1 2-2Z" />
    </Svg>
  ),
  comunicacao: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-4a8 8 0 1 1 18-7Z" />
    </Svg>
  ),
  relatorios: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 20V10m6 10V4m6 16v-7" />
    </Svg>
  ),
  auditoria: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
    </Svg>
  ),
  branding: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c3 0 5 2 5 5s-2 5-5 5-5-2-5-5 2-5 5-5Zm-7 14c0-3 3-5 7-5s7 2 7 5" />
    </Svg>
  ),
  integracoes: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
    </Svg>
  ),
  seguranca: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Zm0 7v4" />
    </Svg>
  ),
  assistente: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 8.5A2.5 2.5 0 1 1 12 11m-8 9 2.5-6.5L12 15l5.5-1.5L20 20" />
    </Svg>
  ),
  more: (className) => (
    <Svg className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h.01M12 12h.01M18 12h.01" />
    </Svg>
  ),
};

export function NavModuleIcon({ navKey, className }: { navKey: string; className?: string }) {
  const factory = NAV_ICON_MAP[navKey] ?? NAV_ICON_MAP.more;
  return factory?.(className) ?? null;
}
