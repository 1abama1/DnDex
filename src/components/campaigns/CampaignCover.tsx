import { useId, useState } from 'react';
import { safeImageUrl } from '@/lib/domain';
import type { ReactNode } from 'react';

function coverTheme(system: string) {
  if (/cthulhu|shadowrun/i.test(system)) return 'mystery';
  if (/vampire/i.test(system)) return 'crimson';
  if (/pathfinder|savage/i.test(system)) return 'wilds';
  return 'citadel';
}
const palettes = {
  citadel: ['#111b2b', '#536777', '#182b3b', '#101d2b', '#d6c694'],
  mystery: ['#0c1c22', '#4a7c78', '#153b3c', '#0c252b', '#b3d5ba'],
  crimson: ['#25131e', '#785461', '#3e2336', '#201524', '#dfb09c'],
  wilds: ['#1c2424', '#839082', '#394d43', '#182c2b', '#e4d2a3'],
};
/** Original vector artwork; no third-party assets or unstable remote fallback URLs. */
export function AdventureArt({
  system = 'D&D 5e',
  hero = false,
}: {
  system?: string;
  hero?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const theme = coverTheme(system);
  const colors = palettes[theme];
  return (
    <svg
      className="landscape"
      viewBox="0 0 800 520"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient
          id={`${id}-sky`}
          x1="400"
          y1="0"
          x2="400"
          y2="520"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors[0]} />
          <stop offset=".7" stopColor={colors[1]} />
          <stop offset="1" stopColor={colors[0]} />
        </linearGradient>
        <radialGradient id={`${id}-light`}>
          <stop stopColor={colors[4]} stopOpacity=".23" />
          <stop offset="1" stopColor={colors[4]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-fog`} x2="0" y2="1">
          <stop stopColor={colors[1]} stopOpacity="0" />
          <stop offset="1" stopColor={colors[1]} stopOpacity=".3" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id}-sky)`} d="M0 0h800v520H0z" />
      <circle cx="450" cy="190" r="200" fill={`url(#${id}-light)`} />
      <circle cx="458" cy="150" r="55" fill={colors[4]} opacity=".75" />
      <circle cx="475" cy="136" r="55" fill={colors[0]} opacity=".8" />
      <g fill={colors[4]} opacity=".65">
        <circle cx="200" cy="86" r="1" />
        <circle cx="330" cy="64" r="1.3" />
        <circle cx="570" cy="75" r="1" />
        <circle cx="655" cy="150" r="1.5" />
        <circle cx="180" cy="170" r="1.5" />
        <circle cx="357" cy="136" r=".9" />
        <circle cx="523" cy="40" r=".8" />
        <circle cx="275" cy="210" r=".9" />
      </g>
      <g stroke={colors[4]} opacity=".14">
        <circle cx="445" cy="214" r="148" />
        <circle cx="445" cy="214" r="160" strokeDasharray="2 13" />
        <path d="M445 46v20m0 296v20M277 214h20m296 0h20M330 99l14 14m202 202 14 14M330 329l14-14M546 113l14-14" />
      </g>
      <path
        d="M0 360 116 221l89 102 111-125 100 127 87-72 95 92 95-130L800 356v164H0Z"
        fill={colors[2]}
        opacity=".8"
      />
      <path
        d="m90 250 26-29 40 46-37-21-9 13Zm189-13 37-39 45 57-43-27-13 18Zm383 32 31-54 45 59-40-27-12 17Z"
        fill={colors[1]}
        opacity=".55"
      />
      <path
        d="M0 402c115-21 174-41 253-35 84 7 110-80 180-70 73 11 134 66 205 61 57-4 110 13 162 42v120H0Z"
        fill={colors[3]}
      />
      <path
        d="m297 380 18-38 18-12 18-34 17 8 21-26 38-3 23 17 18-6 28 37 9 36 40 26-10 50H279Z"
        fill={colors[0]}
      />
      <g fill={colors[0]} stroke={colors[1]} strokeWidth="1">
        <path d="M350 300v-73l-5-4 16-30 16 30-5 4v73M393 285v-120l-6-4 21-48 22 48-7 4v120M438 300v-78l-5-3 17-34 18 34-6 3v78" />
        <path d="M365 290v-43h15v10h13v-35h17v35h20v-10h16v58" />
        <path d="M331 324v-52l-4-3 13-25 13 25-4 3v52M469 323v-48l-4-3 13-25 13 25-4 3v51" />
      </g>
      <g fill={colors[4]} opacity=".8">
        <path d="M405 195h5v14h-5zM356 247h4v10h-4zM448 241h4v11h-4zM404 239h4v11h-4zM476 288h3v7h-3zM337 287h3v7h-3z" />
        <path d="M403 291v-15a6 6 0 0 1 12 0v15Z" />
      </g>
      <path
        d="M409 291c-6 30-51 39-44 56 9 22 85 6 73 36-12 30-69 36-86 66"
        stroke={colors[4]}
        strokeOpacity=".35"
        strokeWidth="3"
      />
      <g stroke={colors[1]} opacity=".2">
        <path d="m304 377 21-21 11-5m-6 44 13-17m117-48 17 25m-82-36-9 8m43 58-11 24" />
      </g>
      <path
        d="M0 367c139 17 193 38 300 21 105-18 169 9 263-7 103-18 173-5 237 17v66H0Z"
        fill={`url(#${id}-fog)`}
      />
      <path
        d="M0 454c111-9 157-37 230-17 72 19 123 38 209 15 93-24 180-25 361-4v72H0Z"
        fill={colors[0]}
        opacity=".9"
      />
      <g fill={colors[3]}>
        {[25, 68, 113, 174, 632, 681, 742, 782].map((x, index) => (
          <path
            key={x}
            d={`M${x} 520v-${95 + (index % 3) * 22}m-21 50 21-50 21 50h-10l17 27h-56l17-27Z`}
            stroke={colors[3]}
            strokeWidth="4"
          />
        ))}
      </g>
      {theme === 'mystery' && (
        <g stroke={colors[4]} opacity=".17">
          <path
            d="M150 520c-35-92-35-143-8-146s24 35 8 39M630 520c47-82 50-146 22-146s-25 35-7 39"
            strokeWidth="6"
          />
        </g>
      )}
      {hero && (
        <g stroke={colors[4]} opacity=".5">
          <path d="m408 92 0-18m-7 9h14M171 244v-10m-5 5h10M637 220v-12m-6 6h12" />
        </g>
      )}
    </svg>
  );
}
export function CampaignCover({
  coverUrl,
  system,
  className = '',
  children,
}: {
  coverUrl?: string | null;
  system: string;
  className?: string;
  children?: ReactNode;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const safe = safeImageUrl(coverUrl);
  return (
    <div className={`campaign-cover ${className}`}>
      {safe && failed !== safe ? (
        <img
          src={safe}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(safe)}
        />
      ) : (
        <AdventureArt system={system} />
      )}
      {children}
    </div>
  );
}
