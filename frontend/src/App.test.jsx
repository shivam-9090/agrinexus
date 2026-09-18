import { render, screen } from "./test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./api", () => ({
  fetchAdvisory: vi.fn(),
  geocodePlace: vi.fn(),
  diagnoseDisease: vi.fn(),
  fetchFederationStats: vi.fn().mockResolvedValue({
    registered_nodes: 0,
    participating_countries: [],
    total_insights_shared: 0,
  }),
  fetchFederationNodes: vi.fn().mockResolvedValue([]),
  fetchFederationInsights: vi.fn().mockResolvedValue([]),
  registerFederationNode: vi.fn(),
  submitFederationInsight: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders the advisory tab by default with the empty-state placeholder", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "AgriNexus" })).toBeInTheDocument();
    expect(screen.getByText(/fill in your farm's soil test/i)).toBeInTheDocument();
  });

  it("switches to the leaf diagnostics tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /leaf diagnostics/i }));
    expect(screen.getByText(/crop leaf stress diagnostic/i)).toBeInTheDocument();
  });

  it("switches to the BRICS cooperation tab", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /brics cooperation/i }));
    expect(await screen.findByText(/brics cooperation network/i)).toBeInTheDocument();
  });

  it("switches the whole UI to Hindi when a language is selected", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText(/language/i), "hi");

    expect(screen.getByRole("button", { name: "खेत सलाह" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "पत्ती निदान" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ब्रिक्स सहयोग" })).toBeInTheDocument();
  });

  it("persists the language choice across a remount", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.selectOptions(screen.getByLabelText(/language/i), "pt");
    unmount();

    render(<App />);
    expect(screen.getByRole("button", { name: "Consultoria agrícola" })).toBeInTheDocument();
  });
});
