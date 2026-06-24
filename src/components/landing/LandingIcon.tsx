type IconName =
  | "pay-per-use"
  | "pricing"
  | "portals"
  | "pep"
  | "billing"
  | "enterprise"
  | "arrow-right"
  | "check"
  | "shield"
  | "menu"
  | "message";

type Props = {
  name: IconName;
  className?: string;
  decorative?: boolean;
};

export default function LandingIcon({
  name,
  className = "h-6 w-6",
  decorative = true,
}: Props) {
  const ariaProps = decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const };

  switch (name) {
    case "pay-per-use":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M12 3v18M7 8h6a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pricing":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M4 7h16M4 12h10M4 17h16"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="17" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "portals":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    case "pep":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M9 3h6l1 3h3a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3l1-3Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "billing":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 10h18M7 15h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "enterprise":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M4 21V8l8-4 8 4v13"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "check":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M5 12.5 9.5 17 19 7"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "shield":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M12 3 19 6v6c0 4.5-3.2 7.8-7 9-3.8-1.2-7-4.5-7-9V6l7-3Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "menu":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case "message":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" {...ariaProps}>
          <path
            d="M7 8.5h10M7 12h6"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M5 5.5h14a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2H9l-4 3v-3.5H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}
