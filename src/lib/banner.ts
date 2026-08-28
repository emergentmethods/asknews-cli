import chalk from "chalk";

// Two AskNews banners:
//   * a faithful "logo art" rendering with the gradient sail and wordmark (~98 cols), shown on wide
//     terminals, with light/dark variants for the sail shading; and
//   * a compact figlet "ANSI Shadow" wordmark (~59 cols) used as the fallback on narrow terminals
//     and when output is piped.
// The leading sail columns are tinted with the logo's navy→cyan gradient; the wordmark uses the
// terminal's default bold foreground so it stays legible on light and dark backgrounds. With color
// disabled, both render as plain monochrome ASCII.

const TAGLINE = "News, when quality matters.";
const ACCENT: [number, number, number] = [125, 222, 255];

// Sail columns get the gradient tint; the wordmark begins after this column in the logo art.
const SAIL_COLS = 17;
// Width tiers: full logo art when it fits, the figlet wordmark when that fits, else a tiny banner.
const LOGO_MIN_WIDTH = 100;
const WORDMARK_MIN_WIDTH = 62;

const LOGO_DARK = [
  "      @@%%                    @@@         @@@        @@",
  "      @@%##                   @@@         @@@@       @@",
  "     @@%%##*       @@@@@@@@   @@@   @@@@  @@ @@@     @@    @@@@@@@@@  @@     @@@     @@  @@@@@@@@",
  "    @@%%# **+     @@@    @@@  @@@  @@@    @@   @@    @@   @@       @@  @@    @@@@   @@  @@      @@",
  "   @@@%##**++=     @@@@@@     @@@@@@@     @@    @@@  @@  @@@@@@@@@@@@  @@@  @@ @@  @@    @@@@@",
  "  @@@ %#**++ =-        @@@@@  @@@@@@@     @@      @@ @@  @@@            @@ @@   @@ @@         @@@@",
  " @@@    **+===--  @@@    @@@@ @@@  @@@@   @@       @@@@   @@@      @@    @@@@    @@@    @@      @@",
  "@@@         =---   @@@@@@@@   @@@    @@@@ @@         @@     @@@@@@@       @@     @@@     @@@@@@@@",
];

const LOGO_LIGHT = [
  "      @@@@                    @@@         @@@        @@@",
  "     @@@@@%                   @@@         @@@@@      @@@",
  "    @@@@@%%%       @@@@@@@@@  @@@   @@@@  @@@@@@     @@@   @@@@@@@@@  @@@    @@@    @@@ @@@@@@@@@@",
  "   @@@@@%%%##     @@@    @@@@ @@@ @@@@@   @@@ @@@@   @@@  @@       @@  @@   @@@@@   @@  @@      @@",
  "  @@@@@@%% ###    @@@@@@@@    @@@@@@@     @@@   @@@  @@@ @@@@@@@@@@@@  @@@ @@@ @@  @@   @@@@@@@",
  "  @@@@@%%%## **       @@@@@@@ @@@@@@@     @@@    @@@ @@@ @@@            @@@@@  @@@@@@         @@@@",
  "@@@@    %###***+ @@@@    @@@@ @@@  @@@@   @@@      @@@@@  @@       @@    @@@@   @@@@    @@      @@",
  "@@@@       ***++=  @@@@@@@@@  @@@    @@@@ @@@       @@@@    @@@@@@@      @@@     @@      @@@@@@@@",
];

// figlet "ANSI Shadow" wordmark — compact fallback.
const WORDMARK = [
  " █████╗ ███████╗██╗  ██╗███╗   ██╗███████╗██╗    ██╗███████╗",
  "██╔══██╗██╔════╝██║ ██╔╝████╗  ██║██╔════╝██║    ██║██╔════╝",
  "███████║███████╗█████╔╝ ██╔██╗ ██║█████╗  ██║ █╗ ██║███████╗",
  "██╔══██║╚════██║██╔═██╗ ██║╚██╗██║██╔══╝  ██║███╗██║╚════██║",
  "██║  ██║███████║██║  ██╗██║ ╚████║███████╗╚███╔███╔╝███████║",
  "╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝ ╚══╝╚══╝ ╚══════╝",
];
const WORDMARK_SAIL = 8;

// Tiny banner for narrow windows: a gradient sail wedge beside the plain wordmark. Fits ~34 cols and
// never wraps where the figlet wordmark would.
const COMPACT = ["█", "██   AskNews", "███"];
const COMPACT_SAIL = 3;

// The help banner is opt-in: set ASKNEWS_BANNER=1 (or true/on/yes) to show it. Default is disabled.
export function bannerEnabled(): boolean {
  const value = process.env.ASKNEWS_BANNER?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "on" || value === "yes";
}

export function renderBanner(useColor: boolean): string {
  const width = process.stdout.columns ?? 0;
  const [rows, sailCols] =
    width >= LOGO_MIN_WIDTH
      ? [logoFor(useTheme()), SAIL_COLS]
      : width >= WORDMARK_MIN_WIDTH
        ? [WORDMARK, WORDMARK_SAIL]
        : [COMPACT, COMPACT_SAIL];
  return ["", ...colorize(rows, sailCols, useColor), "", tagline(useColor), ""].join("\n");
}

// Tint each row's leading sail columns with a top→bottom navy→cyan gradient; render the rest in the
// terminal's default bold foreground. Returns the rows unchanged when color is disabled.
function colorize(rows: string[], sailCols: number, useColor: boolean): string[] {
  if (!useColor) return rows;
  return rows.map((row, index) => {
    const [r, g, b] = gradient(index, rows.length);
    return chalk.rgb(r, g, b)(row.slice(0, sailCols)) + chalk.bold(row.slice(sailCols));
  });
}

function gradient(index: number, total: number): [number, number, number] {
  const top: [number, number, number] = [37, 99, 160];
  const bottom: [number, number, number] = [125, 222, 255];
  const t = total <= 1 ? 1 : index / (total - 1);
  return [
    Math.round(top[0] + (bottom[0] - top[0]) * t),
    Math.round(top[1] + (bottom[1] - top[1]) * t),
    Math.round(top[2] + (bottom[2] - top[2]) * t),
  ];
}

function tagline(useColor: boolean): string {
  if (!useColor) return `  ${TAGLINE}`;
  return `  ${chalk.rgb(...ACCENT)("News")}${chalk.dim(", when quality matters.")}`;
}

function logoFor(theme: "light" | "dark"): string[] {
  return theme === "light" ? LOGO_LIGHT : LOGO_DARK;
}

// Pick the sail-shading variant: explicit override first, then a best-effort read of the terminal
// background via COLORFGBG, defaulting to the dark-background art.
function useTheme(): "light" | "dark" {
  const override = process.env.ASKNEWS_BANNER_THEME?.toLowerCase();
  if (override === "light" || override === "dark") return override;
  const background = process.env.COLORFGBG?.split(";").pop();
  if (background !== undefined) {
    const value = Number(background);
    if (Number.isFinite(value) && value >= 11) return "light";
  }
  return "dark";
}
