/* Premium SVG icons — crisp at any resolution */

type IconProps = { className?: string; size?: number };

const defaults = { size: 22, className: "" };

function Svg({ children, size, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size ?? defaults.size}
      height={size ?? defaults.size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const grad = (
  <defs>
    <linearGradient id="ic-grad" x1="0" y1="0" x2="24" y2="24">
      <stop offset="0%" stopColor="#38bdf8" />
      <stop offset="100%" stopColor="#0ea5e9" />
    </linearGradient>
  </defs>
);

export function IconHome({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCalendar({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1" fill="#38bdf8" />
      <circle cx="12" cy="14" r="1" fill="#0ea5e9" />
      <circle cx="16" cy="14" r="1" fill="#38bdf8" />
    </Svg>
  );
}

export function IconTelegram({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M21 4L3.5 11.2c-.9.4-.9 1.6.1 1.9l4.4 1.3 1.7 5.2c.3.9 1.4 1 1.9.2l2.5-3.6 4.6 3.4c.8.6 1.9.1 2.1-.9L22 5.5c.2-1-1-1.7-1.9-1.5z" stroke="url(#ic-grad)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 13l9-6" stroke="#bae6fd" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSettings({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <circle cx="12" cy="12" r="3" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconStethoscope({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M6 4v5a6 6 0 0012 0V4" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="18" cy="18" r="3" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M18 15v-2a4 4 0 00-4-4h-2" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function IconDoctor({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <circle cx="12" cy="7" r="3.5" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M5 20v-1.5a7 7 0 0114 0V20" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 11v3M10.5 12.5h3" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconClock({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <circle cx="12" cy="12" r="9" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconClipboard({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <rect x="5" y="4" width="14" height="17" rx="2" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M9 4h6a2 2 0 012 2v1H7V6a2 2 0 012-2z" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M8 12h8M8 16h5" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

export function IconCheck({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <circle cx="12" cy="12" r="9" stroke="url(#ic-grad)" strokeWidth="1.6" />
      <path d="M8 12l2.5 2.5L16 9" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPhone({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M6.5 4h3l1.5 5-2 1.5a11 11 0 005 5L17.5 13l5 1.5v3a2 2 0 01-2.2 2A15 15 0 014 6.2 2 2 0 016 4z" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLocation({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke="#bae6fd" strokeWidth="1.4" />
    </Svg>
  );
}

export function IconShield({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M12 3l7 3v6c0 4.5-3.2 8.2-7 9-3.8-.8-7-4.5-7-9V6l7-3z" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconZap({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M13 3L5 14h6l-1 7 8-12h-6l1-6z" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconLab({ size, className }: IconProps = {}) {
  return (
    <Svg size={size} className={className}>
      {grad}
      <path d="M9 3h6l3 10a5 5 0 01-4.5 7H10.5A5 5 0 016 13L9 3z" stroke="url(#ic-grad)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 10h6" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}
