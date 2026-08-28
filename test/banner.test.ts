import chalk from "chalk";
import { afterEach, describe, expect, test } from "vitest";
import { bannerEnabled, renderBanner } from "../src/lib/banner.js";

describe("bannerEnabled", () => {
  const original = process.env.ASKNEWS_BANNER;
  afterEach(() => {
    if (original === undefined) delete process.env.ASKNEWS_BANNER;
    else process.env.ASKNEWS_BANNER = original;
  });

  test("is disabled by default and enabled by truthy values", () => {
    delete process.env.ASKNEWS_BANNER;
    expect(bannerEnabled()).toBe(false);
    process.env.ASKNEWS_BANNER = "0";
    expect(bannerEnabled()).toBe(false);
    for (const value of ["1", "true", "on", "YES"]) {
      process.env.ASKNEWS_BANNER = value;
      expect(bannerEnabled()).toBe(true);
    }
  });
});

describe("renderBanner", () => {
  const originalLevel = chalk.level;
  const originalColumns = Object.getOwnPropertyDescriptor(process.stdout, "columns");
  afterEach(() => {
    chalk.level = originalLevel;
    if (originalColumns) Object.defineProperty(process.stdout, "columns", originalColumns);
  });

  function setColumns(value: number): void {
    Object.defineProperty(process.stdout, "columns", { value, configurable: true });
  }

  test("renders the faithful sail logo art on wide terminals", () => {
    setColumns(120);
    const banner = renderBanner(false);
    expect(banner).toContain("%"); // sail shading present only in the logo art
    expect(banner).toContain("News, when quality matters.");
  });

  test("uses the figlet wordmark at medium width", () => {
    setColumns(80);
    const banner = renderBanner(false);
    expect(banner).toContain("╗"); // figlet ANSI Shadow shadow glyph
    expect(banner).not.toContain("%");
  });

  test("falls back to the compact wedge on narrow terminals without wrapping", () => {
    setColumns(48);
    const banner = renderBanner(false);
    expect(banner).toContain("AskNews"); // plain wordmark only in the compact banner
    expect(banner).not.toContain("╗"); // not the wide figlet
    expect(banner).not.toContain("%"); // not the wide logo art
    expect(Math.max(...banner.split("\n").map((line) => line.length))).toBeLessThanOrEqual(48);
  });

  test("plain banner has no ANSI escapes", () => {
    setColumns(48);
    const banner = renderBanner(false);
    expect(banner).toContain("█");
    expect(banner).not.toContain("[");
  });

  test("colored banner emits truecolor for the sail and keeps the tagline", () => {
    setColumns(48);
    chalk.level = 3; // force truecolor regardless of the test TTY
    const banner = renderBanner(true);
    expect(banner).toContain("[38;2;"); // truecolor sail gradient
    expect(banner).toContain("News"); // accent word (rest of tagline is styled separately)
    expect(banner).toContain("quality matters.");
  });
});
