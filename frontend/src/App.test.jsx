import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
});
