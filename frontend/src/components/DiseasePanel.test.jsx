import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import DiseasePanel from "./DiseasePanel";

vi.mock("../api", () => ({
  diagnoseDisease: vi.fn(),
}));

URL.createObjectURL = vi.fn(() => "blob:mock");
URL.revokeObjectURL = vi.fn();

afterEach(() => {
  vi.clearAllMocks();
});

function makeFile() {
  return new File(["leaf-bytes"], "leaf.png", { type: "image/png" });
}

describe("DiseasePanel", () => {
  it("disables the diagnose button until a file is chosen", () => {
    render(<DiseasePanel />);
    expect(screen.getByRole("button", { name: /diagnose leaf/i })).toBeDisabled();
  });

  it("shows the diagnosis result after a successful upload", async () => {
    const { diagnoseDisease } = await import("../api");
    diagnoseDisease.mockResolvedValue({
      stress_level: "healthy",
      healthy_tissue_pct: 92.0,
      discoloration_pct: 2.0,
      likely_causes: [],
      recommended_action: "No visible stress detected.",
    });

    const user = userEvent.setup();
    render(<DiseasePanel />);

    const input = screen.getByLabelText(/leaf photo/i);
    await user.upload(input, makeFile());

    await user.click(screen.getByRole("button", { name: /diagnose leaf/i }));

    expect(await screen.findByText("Healthy")).toBeInTheDocument();
    expect(screen.getByText(/no visible stress detected/i)).toBeInTheDocument();
  });

  it("shows an error message when the API call fails", async () => {
    const { diagnoseDisease } = await import("../api");
    diagnoseDisease.mockRejectedValue(new Error("Could not process image"));

    const user = userEvent.setup();
    render(<DiseasePanel />);

    await user.upload(screen.getByLabelText(/leaf photo/i), makeFile());
    await user.click(screen.getByRole("button", { name: /diagnose leaf/i }));

    expect(await screen.findByText("Could not process image")).toBeInTheDocument();
  });

  it("clears the file and result when Clear is clicked", async () => {
    const { diagnoseDisease } = await import("../api");
    diagnoseDisease.mockResolvedValue({
      stress_level: "healthy",
      healthy_tissue_pct: 92.0,
      discoloration_pct: 2.0,
      likely_causes: [],
      recommended_action: "No visible stress detected.",
    });

    const user = userEvent.setup();
    render(<DiseasePanel />);

    await user.upload(screen.getByLabelText(/leaf photo/i), makeFile());
    await user.click(screen.getByRole("button", { name: /diagnose leaf/i }));
    await screen.findByText("Healthy");

    await user.click(screen.getByRole("button", { name: /clear/i }));

    await waitFor(() => {
      expect(screen.queryByText("Healthy")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /diagnose leaf/i })).toBeDisabled();
    });
  });
});
