import { render as rtlRender } from "@testing-library/react";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";

export function render(ui, options) {
  return rtlRender(ui, { wrapper: LanguageProvider, ...options });
}

// re-export everything else from Testing Library unchanged
export * from "@testing-library/react";
