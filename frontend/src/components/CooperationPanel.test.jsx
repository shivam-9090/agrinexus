import { render, screen, waitFor } from "../test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import CooperationPanel from "./CooperationPanel";

vi.mock("../api", () => ({
  fetchFederationStats: vi.fn(),
  fetchFederationNodes: vi.fn(),
  fetchFederationInsights: vi.fn(),
  registerFederationNode: vi.fn(),
  submitFederationInsight: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
});

async function mockApi(overrides = {}) {
  const api = await import("../api");
  api.fetchFederationStats.mockResolvedValue(
    overrides.stats ?? { registered_nodes: 0, participating_countries: [], total_insights_shared: 0 }
  );
  api.fetchFederationNodes.mockResolvedValue(overrides.nodes ?? []);
  api.fetchFederationInsights.mockResolvedValue(overrides.insights ?? []);
  api.registerFederationNode.mockResolvedValue(overrides.registerResult ?? {});
  api.submitFederationInsight.mockResolvedValue(overrides.insightResult ?? {});
  return api;
}

describe("CooperationPanel", () => {
  it("loads and displays network stats on mount", async () => {
    await mockApi({
      stats: { registered_nodes: 3, participating_countries: ["India", "Brazil"], total_insights_shared: 2 },
    });
    render(<CooperationPanel />);

    expect(await screen.findByText("3")).toBeInTheDocument();
    expect(screen.getAllByText("2")).toHaveLength(2);
  });

  it("shows an empty state when there are no insights yet", async () => {
    await mockApi();
    render(<CooperationPanel />);
    expect(await screen.findByText(/no insights shared yet/i)).toBeInTheDocument();
  });

  it("registers a manual node via the form", async () => {
    const api = await mockApi();
    const user = userEvent.setup();
    render(<CooperationPanel />);

    await screen.findByText(/no insights shared yet/i);

    await user.type(screen.getAllByLabelText(/node id/i)[0], "test-01");
    await user.type(screen.getAllByLabelText(/^country$/i)[0], "India");
    await user.type(screen.getAllByLabelText(/^region$/i)[0], "Punjab");
    await user.click(screen.getByRole("button", { name: /^register node$/i }));

    await waitFor(() => {
      expect(api.registerFederationNode).toHaveBeenCalledWith(
        expect.objectContaining({ node_id: "test-01", country: "India", region: "Punjab" })
      );
    });
  });

  it("shows an error message when the demo sync fails", async () => {
    const api = await mockApi();
    api.registerFederationNode.mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    render(<CooperationPanel />);

    await screen.findByText(/no insights shared yet/i);
    await user.click(screen.getByRole("button", { name: /simulate brics network sync/i }));

    expect(await screen.findByText("network down")).toBeInTheDocument();
  });
});
