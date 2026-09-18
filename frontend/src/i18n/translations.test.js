import { describe, expect, it } from "vitest";
import { LANGUAGES, translations } from "./translations";

describe("translations", () => {
  const englishKeys = Object.keys(translations.en).sort();

  it("has an entry for every declared language", () => {
    for (const { code } of LANGUAGES) {
      expect(translations[code]).toBeDefined();
    }
  });

  for (const { code } of LANGUAGES) {
    it(`${code}: has exactly the same keys as English (no missing/extra translations)`, () => {
      expect(Object.keys(translations[code]).sort()).toEqual(englishKeys);
    });

    it(`${code}: has no empty translation values`, () => {
      for (const [key, value] of Object.entries(translations[code])) {
        expect(value, `${code}.${key} should not be empty`).toBeTruthy();
      }
    });
  }

  it("every {placeholder} used in an English string also appears in every other language's string for that key", () => {
    const placeholderPattern = /\{(\w+)\}/g;
    for (const key of englishKeys) {
      const englishPlaceholders = [...translations.en[key].matchAll(placeholderPattern)].map((m) => m[1]).sort();
      for (const { code } of LANGUAGES) {
        if (code === "en") continue;
        const otherPlaceholders = [...translations[code][key].matchAll(placeholderPattern)].map((m) => m[1]).sort();
        expect(otherPlaceholders, `${code}.${key} placeholders should match English`).toEqual(englishPlaceholders);
      }
    }
  });
});
