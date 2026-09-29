/**
 * The product mark — hexagon, orbit and bolt. Decorative: pair it with the
 * product name in text. `gradientId` must be unique within the page.
 */
export function BrandMark({
  className,
  gradientId = "brand-mark-grad",
}: {
  className?: string;
  gradientId?: string;
}) {
  const fill = `url(#${gradientId})`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      <path
        d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"
        fill={fill}
        opacity="0.15"
      />
      <path
        d="M50 10 A 40 40 0 1 0 90 50"
        fill="none"
        stroke={fill}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="90" cy="50" r="8" fill="#7C3AED" />
      <circle cx="50" cy="10" r="8" fill="#C084FC" />
      <path d="M55 22 L32 55 L48 55 L42 82 L72 45 L52 45 Z" fill={fill} />
    </svg>
  );
}
