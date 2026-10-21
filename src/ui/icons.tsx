// Inline line icons: 24px grid, 1.5px stroke, currentColor (design/components.md "Iconography").
import type { ReactNode } from 'react';
import type { Glass } from '../domain';

function Icon({ children, size = 20, className }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

type P = { size?: number; className?: string };

export const SearchIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icon>
);
export const XIcon = (p: P) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const PlusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const MinusIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);
export const CheckIcon = (p: P) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const InfoIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.4" />
  </Icon>
);
export const AlertIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3.5 2.5 20h19Z" />
    <path d="M12 10v4.5M12 17.4v.4" />
  </Icon>
);
export const ChevronDownIcon = (p: P) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
export const ArrowRightIcon = (p: P) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);
export const ExternalIcon = (p: P) => (
  <Icon {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Icon>
);
export const SnowflakeIcon = (p: P) => (
  <Icon {...p}>
    <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
  </Icon>
);
export const SunIcon = (p: P) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </Icon>
);
export const MoonIcon = (p: P) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </Icon>
);

/** Ice cube in an empty coupe: the fallback illustration. `withIce` false gives the empty state. */
export function CoupeIllustration({ withIce = true }: { withIce?: boolean }) {
  return (
    <svg className="illustration" width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true" focusable="false">
      <path d="M16 26h64c0 18-14 28-32 28S16 44 16 26Z" stroke="var(--color-ink-muted)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M48 54v26M34 82h28" stroke="var(--color-ink-muted)" strokeWidth="2.5" strokeLinecap="round" />
      {withIce && (
        <rect x="39" y="30" width="16" height="16" rx="3" transform="rotate(-12 47 38)" fill="var(--color-accent)" stroke="var(--color-accent-edge)" strokeWidth="1.5" />
      )}
    </svg>
  );
}

// Paths from design/preview.html's glass gallery, 1:1 with the Glass enum.
const GLASS_PATHS: Record<Glass, string[]> = {
  'Cocktail Glass': ['M3.5 4h17L12 13Z', 'M12 13v7M8 20h8M6 6.5h12'],
  Coupe: ['M4 5h16c0 5-3.6 7.5-8 7.5S4 10 4 5Z', 'M12 12.5V20M8 20h8'],
  'Rocks Glass': ['M5 8h14l-1.3 11.2a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8Z', 'M6 13h12'],
  Highball: ['M7 3h10l-1 18H8Z', 'M7.4 9h9.2'],
  Flute: ['M9 2.5h6l-.5 9a2.5 2.5 0 0 1-5 0Z', 'M12 14v6.5M9 21h6'],
  'Wine Glass': ['M7 3h10v4.5a5 5 0 0 1-10 0Z', 'M7 7h10M12 12.5V20M8.5 20.5h7'],
  'Copper Mug': ['M4 5h11v13.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z', 'M15 8h2.5a2 2 0 0 1 2 2v3.5a2 2 0 0 1-2 2H15', 'M4 8.5h11M4 17h11'],
  'Julep Cup': ['M5.5 4h13l-1.2 16.5H6.7Z', 'M5.8 7h12.4', 'M14.5 1.5 13 7'],
  'Hurricane Glass': [
    'M8.5 2h7c0 3-2.3 4-2.3 6.5S16.5 12 16.5 15a4.5 4.5 0 0 1-9 0c0-3 3.3-4 3.3-6.5S8.5 5 8.5 2Z',
    'M12 19.5V22M9 22h6',
  ],
  'Irish Coffee Glass': [
    'M5.5 3h10l-.9 10.8A3 3 0 0 1 11.6 16.5h-2.2a3 3 0 0 1-3-2.7Z',
    'M15.3 5.5h1.7a2.5 2.5 0 0 1 2.5 2.5v1a2.5 2.5 0 0 1-2.5 2.5h-2.1',
    'M10.5 16.5V20M7 21h7',
  ],
};

export function GlassIcon({ glass, size = 24 }: { glass: Glass; size?: number }) {
  return (
    <Icon size={size} className="glass-icon">
      {GLASS_PATHS[glass].map((d) => (
        <path key={d} d={d} />
      ))}
    </Icon>
  );
}
