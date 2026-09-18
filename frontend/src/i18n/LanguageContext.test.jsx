import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageContext";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe("LanguageContext", () => {
  it("defaults to English", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(result.current.lang).toBe("en");
    expect(result.current.t("app.tab.advisory")).toBe("Farm advisory");
  });

  it("switches language and translates accordingly", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });

    act(() => result.current.setLang("hi"));

    expect(result.current.lang).toBe("hi");
    expect(result.current.t("app.tab.advisory")).toBe("खेत सलाह");
  });

  it("interpolates variables into the translated template", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(result.current.t("advisoryForm.noMatches", { query: "Timbuktu" })).toBe(
      'No matches for "Timbuktu"'
    );
  });

  it("falls back to the key itself for an unknown translation key", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });

  it("ignores an unsupported language code", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    act(() => result.current.setLang("fr"));
    expect(result.current.lang).toBe("en");
  });

  it("persists the selected language to localStorage", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    act(() => result.current.setLang("zh"));
    expect(localStorage.getItem("agrinexus.language")).toBe("zh");
  });

  it("restores a previously persisted language on mount", () => {
    localStorage.setItem("agrinexus.language", "ru");
    const { result } = renderHook(() => useLanguage(), { wrapper: LanguageProvider });
    expect(result.current.lang).toBe("ru");
  });

  it("throws when used outside a LanguageProvider", () => {
    const { result } = renderHook(() => {
      try {
        return useLanguage();
      } catch (err) {
        return err;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
  });
});
