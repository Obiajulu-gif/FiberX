/**
 * FiberX logo — an "X" formed by two crossing fiber strands inside a
 * liquid-glass squircle, with glowing payment nodes at the ends.
 */

let uid = 0;

export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Unique gradient ids so multiple marks on one page don't collide.
  const id = `fx${uid++}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="FiberX logo"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#2a1466" />
          <stop offset="0.5" stopColor="#160b33" />
          <stop offset="1" stopColor="#07121f" />
        </linearGradient>
        <linearGradient id={`${id}-a`} x1="12" y1="12" x2="52" y2="52">
          <stop offset="0" stopColor="#b79bff" />
          <stop offset="1" stopColor="#7c4dff" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="52" y1="12" x2="12" y2="52">
          <stop offset="0" stopColor="#7af0ff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#a07dff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#a07dff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.1" />
        </filter>
      </defs>

      {/* Squircle body */}
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="18"
        fill={`url(#${id}-bg)`}
        stroke={`url(#${id}-a)`}
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      {/* Inner glow */}
      <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${id}-glow)`} />
      {/* Specular top highlight */}
      <path
        d="M20 6 H44 A14 14 0 0 1 58 20 V24 C46 14 18 14 6 24 V20 A14 14 0 0 1 20 6 Z"
        fill="#ffffff"
        opacity="0.10"
      />

      {/* Fiber strand A (top-left → bottom-right) */}
      <path
        d="M16 16 C 28 24, 36 40, 48 48"
        stroke={`url(#${id}-a)`}
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Fiber strand B (top-right → bottom-left) */}
      <path
        d="M48 16 C 36 24, 28 40, 16 48"
        stroke={`url(#${id}-b)`}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Central pulse node */}
      <circle cx="32" cy="32" r="6" fill="#ffffff" opacity="0.9" filter={`url(#${id}-blur)`} />
      <circle cx="32" cy="32" r="3.4" fill="#ffffff" />

      {/* End payment nodes */}
      <circle cx="16" cy="16" r="3" fill="#c5b3ff" />
      <circle cx="48" cy="48" r="3" fill="#c5b3ff" />
      <circle cx="48" cy="16" r="3" fill="#8ef3ff" />
      <circle cx="16" cy="48" r="3" fill="#8ef3ff" />
    </svg>
  );
}

export function Logo({
  size = 36,
  withWord = true,
  className,
}: {
  size?: number;
  withWord?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      {withWord && (
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">Fiber</span>
          <span className="bg-gradient-to-r from-fx-violet-400 to-fx-cyan bg-clip-text text-transparent">
            X
          </span>
        </span>
      )}
    </span>
  );
}
