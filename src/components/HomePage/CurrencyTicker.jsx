// components/HomePage/CurrencyTicker.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCY_ORDER = ["USD", "SAR", "AED", "GBP", "EUR", "CHF", "CAD", "AUD"];

const CURRENCY_META = {
  USD: { name: "US Dollar", flag: "🇺🇸" },
  SAR: { name: "Saudi Riyal", flag: "🇸🇦" },
  AED: { name: "UAE Dirham", flag: "🇦🇪" },
  GBP: { name: "British Pound", flag: "🇬🇧" },
  EUR: { name: "Euro", flag: "🇪🇺" },
  CHF: { name: "Swiss Franc", flag: "🇨🇭" },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦" },
  AUD: { name: "Australian Dollar", flag: "🇦🇺" },
  JPY: { name: "Japanese Yen", flag: "🇯🇵" },
  CNY: { name: "Chinese Yuan", flag: "🇨🇳" },
};

// ─── WCAG contrast helpers ────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace("#", "");

  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  const n = parseInt(full, 16);

  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function relativeLuminance({ r, g, b }) {
  return [r, g, b]
    .map((v) => {
      const s = v / 255;

      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    })
    .reduce((sum, lin, i) => sum + lin * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrastRatio(hex1, hex2) {
  try {
    const l1 = relativeLuminance(hexToRgb(hex1));
    const l2 = relativeLuminance(hexToRgb(hex2));

    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  } catch {
    return 1;
  }
}

function pickContrast(bg, threshold = 4.5, ...candidates) {
  for (const c of candidates) {
    if (c && contrastRatio(c, bg) >= threshold) {
      return c;
    }
  }

  return candidates
    .filter(Boolean)
    .reduce((best, c) =>
      contrastRatio(c, bg) > contrastRatio(best, bg) ? c : best,
    );
}

function toSolidHex(color = "") {
  if (color.startsWith("#")) {
    return color.slice(0, 7);
  }

  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);

  if (m) {
    return (
      "#" +
      [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, "0")).join("")
    );
  }

  return "#888888";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CurrencyTicker({ currencies }) {
  const { t } = useTranslation();
  const { theme, isLightTheme } = useTheme();

  const [paused, setPaused] = useState(false);

  // Prepare currency data
  const items = CURRENCY_ORDER.filter((code) => currencies?.[code]).map(
    (code) => ({
      code,
      rate: Number(currencies[code].rate).toFixed(2),
      ...(CURRENCY_META[code] ?? {
        name: code,
        flag: "💱",
      }),
    }),
  );

  if (!items.length) {
    return null;
  }

  // Triple the items so the ticker can scroll continuously
  const tripled = [...items, ...items, ...items];

  // ─── Theme colors ──────────────────────────────────────────────────────────

  const stripBg = toSolidHex(
    theme.cardBg ?? (isLightTheme ? "#f4f3f0" : "#111008"),
  );

  const primary = toSolidHex(theme.primary);
  const textPrim = toSolidHex(theme.textPrimary);
  const textMut = toSolidHex(theme.textMuted);

  const nuclearFallback = isLightTheme ? "#000000" : "#ffffff";

  const codeColor = pickContrast(
    stripBg,
    4.5,
    primary,
    textPrim,
    nuclearFallback,
  );

  const rateColor = pickContrast(
    stripBg,
    4.5,
    textPrim,
    primary,
    nuclearFallback,
  );

  const nameColor = pickContrast(
    stripBg,
    4.5,
    textMut,
    textPrim,
    nuclearFallback,
  );

  const cssVars = {
    "--tk-bg": stripBg,
    "--tk-border": `${primary}35`,
    "--tk-accent": primary,
    "--tk-code": codeColor,
    "--tk-rate": rateColor,
    "--tk-name": nameColor,
    "--tk-divider": `${primary}45`,
    "--tk-fade": stripBg,
  };

  return (
    <>
      <style>{`
        @keyframes tk-scroll {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-33.333%);
          }
        }

        .tk-track {
          animation: tk-scroll 42s linear infinite;
          will-change: transform;
        }

        .tk-track.tk-paused {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .tk-track {
            animation-play-state: paused !important;
          }
        }
      `}</style>

      <div
        role="marquee"
        aria-label={t("ticker.liveCurrencies", {
          defaultValue: "Live PKR exchange rates",
        })}
        style={cssVars}
        className="relative overflow-hidden py-2.5 border-t border-b"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        {/* Background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "var(--tk-bg)",
            zIndex: -1,
          }}
        />

        <style>{`
          [role="marquee"] {
            background: var(--tk-bg);
            border-color: var(--tk-border);
          }
        `}</style>

        {/* Top gold line */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-0.5 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--tk-accent)80 25%, var(--tk-accent) 50%, var(--tk-accent)80 75%, transparent 100%)",
          }}
        />

        {/* Bottom gold line */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 inset-x-0 h-px pointer-events-none opacity-50"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--tk-accent) 50%, transparent 100%)",
          }}
        />

        {/* Left fade */}
        <div
          aria-hidden="true"
          className="absolute left-0 inset-y-0 w-16 sm:w-24 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to right, var(--tk-fade) 0%, var(--tk-fade)dd 40%, transparent 100%)",
          }}
        />

        {/* Right fade */}
        <div
          aria-hidden="true"
          className="absolute right-0 inset-y-0 w-16 sm:w-24 pointer-events-none z-10"
          style={{
            background:
              "linear-gradient(to left, var(--tk-fade) 0%, var(--tk-fade)dd 40%, transparent 100%)",
          }}
        />

        {/* Scrolling ticker */}
        <div className="flex overflow-hidden">
          <div
            className={`tk-track flex items-center whitespace-nowrap${
              paused ? " tk-paused" : ""
            }`}
          >
            {tripled.map((item, i) => (
              <TickerItem
                key={`${item.code}-${i}`}
                item={item}
                aria-hidden={i >= items.length}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Ticker Item ──────────────────────────────────────────────────────────────

function TickerItem({ item, "aria-hidden": ariaHidden }) {
  return (
    <span
      aria-hidden={ariaHidden}
      className="inline-flex items-center gap-1.5 px-4 sm:px-5 cursor-default select-none"
    >
      {/* Flag */}
      <span
        aria-hidden="true"
        className="text-base sm:text-lg leading-none text-gray-600"
      >
        {item.flag}
      </span>

      {/* Currency code */}
      <span
        className="text-[11px] sm:text-xs font-black font-mono tracking-widest uppercase"
        style={{
          color: "var(--tk-code)",
        }}
      >
        {item.code}
      </span>

      {/* Divider */}
      <span
        aria-hidden="true"
        className="inline-block w-px h-3.5 rounded-full mx-0.5 opacity-50"
        style={{
          background: "var(--tk-divider)",
        }}
      />

      {/* Rate */}
      <span
        className="font-mono font-bold tabular-nums"
        style={{
          color: "var(--tk-rate)",
        }}
      >
        <span className="text-[10px] sm:text-[11px] font-semibold opacity-70 tracking-wide mr-0.5">
          PKR
        </span>

        {/* STATIC PRICE - NO ANIMATION */}
        <span className="text-sm sm:text-base">{item.rate}</span>
      </span>

      {/* Currency name */}
      <span
        className="hidden sm:inline text-[11px] sm:text-xs font-medium tracking-tight"
        style={{
          color: "var(--tk-name)",
        }}
      >
        {item.name}
      </span>

      {/* Separator */}
      <span
        aria-hidden="true"
        className="text-[6px] mx-1.5 sm:mx-2 opacity-60"
        style={{
          color: "var(--tk-divider)",
        }}
      >
        ◆
      </span>
    </span>
  );
}
